#!/usr/bin/env node
// Upgrade check: compares every installed Fluid Functionalism file with the
// item the registry ships today, in the project's flavor, and says which
// ones differ. It writes nothing; the agent reads the differences, the
// changelog, and the user's edits, then decides what to re-install.
//
//   node <skill>/scripts/upgrade.mjs [app-dir]              # the report
//   node <skill>/scripts/upgrade.mjs [app-dir] --diff select # one file's diff
//   node <skill>/scripts/upgrade.mjs [app-dir] --json
//   --registry <url or dir>  compare with another registry (tests, mirrors)
//
// The shadcn CLI rewrites imports to the project's aliases when it installs,
// so specifiers are compared by their last segment only. A difference can be
// the registry moving on or a local edit; the script can't tell which, and
// says so. The changelog can.
import { readFileSync, realpathSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readStack } from "./stack.mjs";

export const REGISTRY = "https://www.fluidfunctionalism.com/r";
export const CHANGELOG = "https://www.fluidfunctionalism.com/changelog.md";

const isRemote = (registry) => /^https?:\/\//.test(registry);

async function readJson(registry, path) {
  if (isRemote(registry)) {
    const res = await fetch(`${registry}/${path}`, { signal: AbortSignal.timeout(15_000) });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${registry}/${path}: HTTP ${res.status}`);
    return res.json();
  }
  try {
    return JSON.parse(readFileSync(join(registry, path), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

/** A file's text with what an install legitimately changes taken out: line
 *  endings, trailing spaces, and the alias part of import specifiers. */
export function normalize(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/((?:from|import)\s*\(?\s*)(["'])([^"']+)\2/g, (_, lead, quote, spec) =>
      /^(@\/|~\/|\.{1,2}\/)/.test(spec) ? `${lead}${quote}${spec.split("/").pop()}${quote}` : `${lead}${quote}${spec}${quote}`,
    )
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

/** Line diff from `a` to `b`: ["=" | "-" | "+", line] pairs, by longest
 *  common subsequence. Files here run to a couple of thousand lines, which
 *  a 16-bit table holds comfortably. */
export function diffLines(a, b) {
  const n = a.length;
  const m = b.length;
  const w = m + 1;
  const table = new Uint16Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      table[i * w + j] = a[i] === b[j] ? table[(i + 1) * w + j + 1] + 1 : Math.max(table[(i + 1) * w + j], table[i * w + j + 1]);
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push(["=", a[i++]]);
      j++;
    } else if (table[(i + 1) * w + j] >= table[i * w + j + 1]) ops.push(["-", a[i++]]);
    else ops.push(["+", b[j++]]);
  }
  while (i < n) ops.push(["-", a[i++]]);
  while (j < m) ops.push(["+", b[j++]]);
  return ops;
}

/** The ops as a readable diff: changed lines with 3 lines of context. */
export function formatDiff(ops) {
  const keep = new Set();
  ops.forEach(([op], k) => {
    if (op !== "=") for (let c = k - 3; c <= k + 3; c++) keep.add(c);
  });
  const out = [];
  let skipped = false;
  ops.forEach(([op, line], k) => {
    if (!keep.has(k)) {
      skipped = true;
      return;
    }
    if (skipped) out.push("@@");
    skipped = false;
    out.push(`${op === "=" ? " " : op} ${line}`);
  });
  return out.join("\n");
}

/** Which registry item ships a file of this name: the item of the same name
 *  when there is one, else the item that lists it (fluid-hover-highlight
 *  installs with use-fluid-hover). */
function itemFor(index, name) {
  const items = index?.items ?? [];
  if (items.some((item) => item.name === name)) return name;
  const owner = items.find((item) => (item.files ?? []).some((f) => basename(f.path, extname(f.path)) === name));
  return owner?.name ?? null;
}

/** Compares every installed FF file with the registry. */
export async function checkUpgrade(input = ".", { registry = REGISTRY } = {}) {
  const stack = readStack(input);
  const flavor = stack.flavor.flavor === "base" ? "base" : "radix";
  const index = await readJson(registry, "registry.json");
  const items = new Map();
  const fetchItem = async (name) => {
    if (!items.has(name)) {
      // The Base UI build of an item lives at base/<name>; single-source
      // items have one file for both flavors.
      const tries = flavor === "base" ? [`base/${name}`, name] : [name];
      let found = null;
      for (const path of tries) {
        const item = await readJson(registry, `${path}.json`);
        if (item) {
          found = { item, url: `${registry}/${path}.json` };
          break;
        }
      }
      items.set(name, found);
    }
    return items.get(name);
  };

  const results = [];
  for (const [name, path] of Object.entries(stack.installed.files ?? {}).sort()) {
    const itemName = itemFor(index, name);
    const found = itemName ? await fetchItem(itemName) : null;
    const file = found?.item.files?.find((f) => basename(f.target ?? f.path, extname(f.target ?? f.path)) === name);
    if (!file?.content) {
      results.push({ name, path, status: "unmatched" });
      continue;
    }
    const local = normalize(readFileSync(join(stack.root, path), "utf8"));
    const upstream = normalize(file.content);
    if (local === upstream) {
      results.push({ name, path, item: itemName, url: found.url, status: "current" });
      continue;
    }
    const ops = diffLines(local.split("\n"), upstream.split("\n"));
    results.push({
      name,
      path,
      item: itemName,
      url: found.url,
      status: "differs",
      removed: ops.filter(([op]) => op === "-").length,
      added: ops.filter(([op]) => op === "+").length,
      diff: formatDiff(ops),
    });
  }
  return { root: stack.root, flavor: stack.flavor, registry, changelog: CHANGELOG, results };
}

function report(check) {
  const by = (status) => check.results.filter((r) => r.status === status);
  const current = by("current");
  const differs = by("differs");
  const unmatched = by("unmatched");
  const reinstall = [...new Set(differs.map((r) => r.url))];
  const lines = [
    `Fluid Functionalism upgrade check: ${check.root}`,
    `Compared with ${check.registry}. Nothing is written.`,
    "",
    `FLAVOR    ${check.flavor.flavor}: ${check.flavor.reason}`,
    `CURRENT   ${current.length ? current.map((r) => r.name).join(", ") : "none"}`,
  ];
  if (differs.length) {
    lines.push(`DIFFERS   ${differs.length} file${differs.length === 1 ? "" : "s"}, local on the - side, registry on the +:`);
    for (const r of differs) lines.push(`          ${r.name}  ${r.path}  (-${r.removed} +${r.added})  from ${r.item}`);
  } else lines.push("DIFFERS   none: every installed file matches the registry");
  if (unmatched.length)
    lines.push(`UNMATCHED ${unmatched.map((r) => r.name).join(", ")}: no registry item ships a file of that name; leave these alone`);
  if (differs.length) {
    lines.push(
      "",
      `CHANGELOG ${check.changelog}: read the entries for each DIFFERS item, Breaking first. A difference the changelog explains is the registry moving on; one it doesn't is a local edit to keep or ask about.`,
      `NEXT      node <skill>/scripts/upgrade.mjs [dir] --diff <name> shows one file's difference.`,
      `          Re-install what should take the registry's version: npx shadcn@latest add ${reinstall.join(" ")} --overwrite`,
    );
  }
  return lines.join("\n");
}

/** Whether Node was started on this file (through a symlinked skill folder
 *  too; see the same guard in stack.mjs). */
function isMain() {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (process.argv[1] && isMain()) {
  const args = process.argv.slice(2);
  const option = (flag) => {
    const at = args.indexOf(flag);
    return at === -1 ? undefined : args[at + 1];
  };
  const registry = option("--registry");
  const diffName = option("--diff");
  const dir = args.find((a, k) => !a.startsWith("--") && !["--registry", "--diff"].includes(args[k - 1])) ?? ".";
  try {
    const check = await checkUpgrade(dir, { registry: registry ? (isRemote(registry) ? registry : resolve(registry)) : REGISTRY });
    if (args.includes("--json")) console.log(JSON.stringify(check, null, 2));
    else if (diffName) {
      const r = check.results.find((x) => x.name === diffName);
      if (!r) throw new Error(`${diffName} is not an installed Fluid Functionalism file here.`);
      console.log(r.status === "differs" ? `${r.path} (-) against ${r.url} (+)\n\n${r.diff}` : `${r.path}: ${r.status}`);
    } else console.log(report(check));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
