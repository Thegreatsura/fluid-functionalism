// What an installer gets. Installers run `shadcn@latest` in a fresh Next app
// and get the newest version of each package the registry ranges allow, not
// the versions in this repo's lockfile. This reproduces that setup per flavor:
//
//   1. serves this checkout's public/r on 127.0.0.1, with every link to the
//      live registry pointed back at it, so dependencies resolve here too
//   2. scaffolds a stock `shadcn@latest init -t next` app per flavor
//   3. installs every item for the flavor in one `shadcn add`
//   4. runs tsc, the app's own ESLint over the installed files, and next build
//
//   node scripts/deps-watch/install-check.mjs [--flavor base|radix|both] [--build] [--json out.json] [--md out.md] [--keep]
//
// --build runs `npm run registry:build` first; otherwise the committed
// public/r is used (CI keeps it current). --keep leaves the temp apps behind.
import { existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { changedFiles, makeTemplates } from "../../evals/copy-prompts/project.mjs";
import { run } from "../../evals/copy-prompts/util.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const REGISTRY_DIR = join(ROOT, "public/r");
const LIVE = "https://www.fluidfunctionalism.com/r";
const BUILD_ENV = { NEXT_TELEMETRY_DISABLED: "1", NO_COLOR: "1", FORCE_COLOR: "0" };
const ENV_PACKAGES = ["next", "react", "react-dom", "tailwindcss", "typescript"];

const { values: opts } = parseArgs({
  options: {
    flavor: { type: "string", default: "both" },
    build: { type: "boolean", default: false },
    json: { type: "string" },
    md: { type: "string" },
    keep: { type: "boolean", default: false },
  },
});
if (!["base", "radix", "both"].includes(opts.flavor)) {
  console.error(`--flavor must be base, radix or both, not "${opts.flavor}"`);
  process.exit(2);
}
const flavors = opts.flavor === "both" ? ["radix", "base"] : [opts.flavor];
const log = (...args) => console.error(`[${new Date().toLocaleTimeString()}]`, ...args);

/** The last lines of a command's output, enough to see what went wrong. */
function tail(out, lines = 40) {
  return out.trimEnd().split("\n").slice(-lines).join("\n").slice(-4000);
}

const names = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".json") && statSync(join(dir, f)).isFile())
    .map((f) => f.slice(0, -5));

// Shipped packages: every dependency an item in registry.json lists.
const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8"));
const shipped = [
  ...new Set(
    registry.items.flatMap((item) =>
      (item.dependencies ?? []).map((spec) => {
        const at = spec.lastIndexOf("@");
        return at > 0 ? spec.slice(0, at) : spec;
      }),
    ),
  ),
].sort();

if (opts.build) {
  log("building the registry");
  const res = await run("npm", ["run", "registry:build"], { cwd: ROOT, timeoutMs: 10 * 60000 });
  if (res.code !== 0) {
    console.error(`registry:build failed:\n${tail(res.out)}`);
    process.exit(1);
  }
}

// Flavored items live in public/r/<flavor>/; single-source items are the
// top-level files with no flavored twin. Subfolders other than the two
// flavors (presets, setups, starters) are not items.
const flavored = { base: names(join(REGISTRY_DIR, "base")), radix: names(join(REGISTRY_DIR, "radix")) };
const single = names(REGISTRY_DIR).filter(
  (n) => n !== "registry" && !flavored.base.includes(n) && !flavored.radix.includes(n),
);

// Serves public/r under /r/. JSON gets every live registry URL rewritten to
// this server, so registryDependencies come from this checkout as well.
let local = "";
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = resolve(REGISTRY_DIR, path.replace(/^\/r\//, ""));
  if (!path.startsWith("/r/") || !file.startsWith(REGISTRY_DIR + sep) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end("not found");
    return;
  }
  const body = readFileSync(file, "utf8");
  res.writeHead(200, { "content-type": file.endsWith(".json") ? "application/json" : "text/plain" });
  res.end(file.endsWith(".json") ? body.replaceAll(LIVE, local) : body);
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
local = `http://127.0.0.1:${server.address().port}/r`;
log(`serving public/r at ${local}`);

const workDir = mkdtempSync(join(tmpdir(), "ff-deps-install-"));
const report = { ranAt: new Date().toISOString(), registry: local, shadcn: null, flavors: {} };
let failed = false;

try {
  const { templates, shadcnVersion } = await makeTemplates(join(workDir, "apps"), flavors, log);
  report.shadcn = shadcnVersion;

  for (const flavor of flavors) {
    const { dir, sha } = templates[flavor];
    const items = [...flavored[flavor].map((n) => `${flavor}/${n}`), ...single];
    const result = { items, versions: {}, env: {}, steps: [] };
    report.flavors[flavor] = result;
    // Paths in the output read relative to the app, not the temp folder
    // (which macOS also reaches through /private).
    const relative = (text) => [realpathSync(dir), dir].reduce((t, p) => t.replaceAll(`${p}/`, ""), text);
    const step = (name, res, extra = {}) => {
      const pass = res.code === 0;
      const out = tail(relative(res.out));
      result.steps.push({ name, pass, code: res.code, timedOut: res.timedOut, ms: res.ms, tail: out, ...extra });
      if (!pass) failed = true;
      log(`${flavor}: ${name} ${pass ? "passed" : "FAILED"} in ${Math.round(res.ms / 1000)}s`);
      return pass;
    };
    const bin = (name) => join(dir, "node_modules/.bin", name);

    // One `add` for everything. The CLI's overwrite prompt kills runs with no
    // TTY, so --overwrite and -y are both needed.
    log(`${flavor}: installing ${items.length} items`);
    const installed = step(
      "install",
      await run("npx", ["-y", "shadcn@latest", "add", ...items.map((i) => `${local}/${i}.json`), "--overwrite", "-y"], {
        cwd: dir,
        timeoutMs: 20 * 60000,
      }),
    );

    const versionOf = (name) => {
      try {
        return JSON.parse(readFileSync(join(dir, "node_modules", name, "package.json"), "utf8")).version;
      } catch {
        return null;
      }
    };
    for (const name of shipped) {
      const version = versionOf(name);
      if (version) result.versions[name] = version;
    }
    for (const name of ENV_PACKAGES) result.env[name] = versionOf(name);

    if (!installed) {
      for (const name of ["tsc", "eslint", "next build"]) {
        result.steps.push({ name, pass: null, skipped: true, tail: "skipped: the install failed" });
      }
      continue;
    }

    step("tsc", await run(bin("tsc"), ["--noEmit", "--pretty", "false"], { cwd: dir, timeoutMs: 10 * 60000 }));

    // Only what the install wrote: the scaffold's own files are not ours.
    // Errors fail the step, as they fail the installer's `npm run lint`;
    // warnings are counted and shown, since the installer sees them too.
    const files = changedFiles(dir, sha).filter((p) => /\.tsx?$/.test(p) && existsSync(join(dir, p)));
    const lint = await run(bin("eslint"), files, { cwd: dir, env: BUILD_ENV, timeoutMs: 10 * 60000 });
    const warnings = Number(/(\d+) warnings?\)/.exec(lint.out)?.[1] ?? 0);
    step("eslint", lint, { files: files.length, warnings });

    step("next build", await run(bin("next"), ["build"], { cwd: dir, env: BUILD_ENV, timeoutMs: 15 * 60000 }));
  }
} catch (error) {
  failed = true;
  report.error = String(error.message ?? error);
  log(report.error);
} finally {
  server.close();
  if (opts.keep) log(`kept the apps in ${workDir}`);
  else rmSync(workDir, { recursive: true, force: true });
}

const md = [`# Install check, ${report.ranAt.slice(0, 10)}`, ""];
if (report.shadcn) md.push(`shadcn ${report.shadcn}, registry served from this checkout's public/r.`, "");
if (report.error) md.push("Setup failed:", "", "```", tail(report.error), "```", "");
for (const [flavor, r] of Object.entries(report.flavors)) {
  md.push(`## ${flavor}`, "", `${r.items.length} items.`, "");
  const list = (o) =>
    Object.entries(o)
      .map(([name, v]) => `${name} ${v ?? "missing"}`)
      .join(", ");
  md.push(`Shipped packages: ${list(r.versions) || "none found"}.`, "", `Env: ${list(r.env)}.`, "");
  md.push("| Step | Result | Time |", "|---|---|---|");
  for (const s of r.steps) {
    const result = s.skipped ? "skipped" : s.pass ? "pass" : s.timedOut ? "FAIL (timed out)" : "FAIL";
    const note = s.warnings ? `, ${s.warnings} warnings` : "";
    md.push(`| ${s.name} | ${result}${note} | ${s.ms ? `${Math.round(s.ms / 1000)}s` : ""} |`);
  }
  md.push("");
  for (const s of r.steps.filter((s) => s.pass === false || s.warnings)) {
    md.push(`${s.name} output (tail):`, "", "```", s.tail, "```", "");
  }
}
const summary = md.join("\n");

if (opts.json) writeFileSync(opts.json, JSON.stringify({ ...report, failed }, null, 2));
if (opts.md) writeFileSync(opts.md, summary);
process.stdout.write(summary);
process.exit(failed ? 1 : 0);
