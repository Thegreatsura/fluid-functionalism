// The fluid-functionalism skill reads a project's stack fresh on every run
// instead of caching verdicts in a file in the user's repo. That only holds
// up if the read is as good as the cache was: the same project must always
// get the same flavor verdict, the quality checks must cite where they looked,
// and the script must never write. The drift guards below fail when the
// registry grows a component the script would not recognize once installed.
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FF_MODULES,
  REQUIRED_MAJOR,
  flavorVerdict,
  importsOf,
  interFindings,
  isFluidFile,
  parseMajor,
  readStack,
  registryNames,
} from "../skills/fluid-functionalism/scripts/stack.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const script = join(root, "skills/fluid-functionalism/scripts/stack.mjs");

/** Writes a throwaway project; keys are paths, values file contents. */
function project(files) {
  const dir = mkdtempSync(join(tmpdir(), "ff-stack-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), typeof content === "string" ? content : JSON.stringify(content, null, 2));
  }
  return dir;
}

const listing = (dir) =>
  readdirSync(dir, { recursive: true })
    .map(String)
    .sort();

describe("stack helpers", () => {
  it("reads the major from installed versions and ranges", () => {
    expect(parseMajor("19.2.0")).toBe(19);
    expect(parseMajor("^4.1.0")).toBe(4);
    expect(parseMajor(">=12")).toBe(12);
    expect(parseMajor("latest")).toBe(null);
  });

  it("collects imports, re-exports, dynamic imports and requires", () => {
    const text = `import a from "a";\nimport "b";\nexport { c } from "c";\nconst d = await import("d");\nrequire("e");\nimport {\n  f,\n} from "f";`;
    expect(importsOf(text)).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("knows FF code by the modules only FF ships, under any alias", () => {
    expect(isFluidFile("select", ["@/lib/springs"])).toBe(true);
    expect(isFluidFile("select", ["~/src/hooks/use-fluid-hover"])).toBe(true);
    expect(isFluidFile("springs", [])).toBe(true);
    expect(isFluidFile("card", ["@/lib/utils", "react"])).toBe(false);
    expect(isFluidFile("x", ["@/lib/my-springs"])).toBe(false);
  });
});

describe("flavor verdict", () => {
  const none = { base: [], radix: [] };

  it("follows installed FF components before anything package.json says", () => {
    const v = flavorVerdict({ deps: ["@radix-ui/react-dialog"], fluid: { base: ["ui/select.tsx"], radix: [] }, app: none });
    expect(v.flavor).toBe("base");
  });

  it("refuses to pick when installed FF code already mixes flavors", () => {
    const v = flavorVerdict({ deps: [], fluid: { base: ["a.tsx"], radix: ["b.tsx"] }, app: none });
    expect(v.flavor).toBe("mixed");
  });

  it("reads package.json, both Radix package styles included", () => {
    expect(flavorVerdict({ deps: ["@base-ui/react"], fluid: none, app: none }).flavor).toBe("base");
    expect(flavorVerdict({ deps: ["@base-ui-components/react"], fluid: none, app: none }).flavor).toBe("base");
    expect(flavorVerdict({ deps: ["@radix-ui/react-slot"], fluid: none, app: none }).flavor).toBe("radix");
    expect(flavorVerdict({ deps: ["radix-ui"], fluid: none, app: none }).flavor).toBe("radix");
  });

  it("breaks a both-primitives tie by what the app imports, and flags it", () => {
    const v = flavorVerdict({
      deps: ["@base-ui/react", "@radix-ui/react-slot"],
      fluid: none,
      app: { base: ["a.tsx", "b.tsx"], radix: ["c.tsx"] },
    });
    expect(v).toMatchObject({ flavor: "base", mixedPrimitives: true });
  });

  it("defaults to Radix and says the choice is still open", () => {
    expect(flavorVerdict({ deps: [], fluid: none, app: none })).toMatchObject({ flavor: "radix", open: true });
  });
});

describe("Inter detection", () => {
  it("separates next/font/google with and without the opsz axis", () => {
    const opsz = `import { Inter } from "next/font/google";\nconst inter = Inter({ subsets: ["latin"], axes: ["opsz"] });`;
    const plain = `import { Inter } from "next/font/google";\nconst inter = Inter({ subsets: ["latin"] });`;
    expect(interFindings("a.tsx", opsz)).toEqual([{ file: "a.tsx", line: 2, via: "next/font/google", status: "opsz" }]);
    expect(interFindings("a.tsx", plain)[0].status).toBe("no-opsz");
  });

  it("flags a local variable font declared without a weight range", () => {
    const text = `import localFont from "next/font/local";\nconst f = localFont({ src: "./InterVariable.woff2" });`;
    expect(interFindings("a.tsx", text)[0].status).toBe("no-weight-range");
    const ranged = text.replace(`" }`, `", weight: "100 900" }`);
    expect(interFindings("a.tsx", ranged)[0].status).toBe("weight-range");
  });

  it("reads fontsource, Google Fonts links, and @font-face", () => {
    expect(interFindings("a.ts", `import "@fontsource-variable/inter/opsz.css";`)[0].status).toBe("opsz");
    expect(interFindings("a.ts", `import "@fontsource-variable/inter";`)[0].status).toBe("no-opsz");
    expect(interFindings("a.ts", `import "@fontsource/inter/400.css";`)[0].status).toBe("static");
    const link = `<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900">`;
    expect(interFindings("a.html", link)[0].status).toBe("opsz");
    const face = `@font-face { font-family: "Inter"; src: url(i.woff2); font-weight: 400; }`;
    expect(interFindings("a.css", face)[0].status).toBe("static");
    expect(interFindings("a.tsx", `const x = Inter();`)).toEqual([]);
  });
});

describe("readStack on a project", () => {
  const ready = () =>
    project({
      "package.json": {
        dependencies: {
          next: "15.5.0",
          react: "^19.1.0",
          "framer-motion": "^12.34.0",
          "@base-ui/react": "^1.4.1",
        },
        devDependencies: { tailwindcss: "^4.1.0" },
      },
      "pnpm-lock.yaml": "",
      "components.json": {
        tailwind: { css: "src/app/globals.css" },
        aliases: { ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks", components: "@/components" },
      },
      "tsconfig.json": `{\n  // jsonc, as tsconfig usually is\n  "compilerOptions": { "paths": { "@/*": ["./src/*"], }, },\n}`,
      "src/app/globals.css": `@import "tailwindcss";\n:root { --background: white; --hover: rgb(0 0 0 / 0.04); }`,
      "src/app/layout.tsx": `import { Inter } from "next/font/google";\nimport { Providers } from "@/components/providers";\nconst inter = Inter({ axes: ["opsz"] });\nexport default function L({ children }) { return <Providers>{children}</Providers>; }`,
      "src/components/providers.tsx": `import { MotionConfig } from "framer-motion";\nexport function Providers({ children }) {\n  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;\n}`,
      "src/components/ui/select.tsx": `import { Select } from "@base-ui/react/select";\nimport { spring } from "@/lib/springs";`,
      "src/components/ui/card.tsx": `import { cn } from "@/lib/utils";`,
      "src/components/ui/avatar.tsx": `import { cn } from "@/lib/utils";`,
      "src/components/ui/project-list.tsx": `import { useFluidHover } from "@/hooks/use-fluid-hover";`,
      "src/components/ui/card.stories.tsx": `import { Card } from "./card";`,
      "src/lib/fonts.test.ts": `import { Inter } from "next/font/google";\nInter({ subsets: ["latin"] });`,
      "src/lib/springs.ts": `export const spring = {};`,
      "src/lib/utils.ts": `export const cn = () => "";`,
      "AGENTS.md": `# Agents\n\n## Fluid Functionalism\n- fluid hover: declined, stillness is deliberate\n`,
    });

  it("reads a wired project with every check passing and its sources cited", () => {
    const s = readStack(ready());
    expect(s.framework.name).toBe("Next.js app router");
    expect(s.packageManager).toBe("pnpm");
    expect(s.flavor).toMatchObject({ flavor: "base", open: false });
    expect(s.flavor.reason).toContain("src/components/ui/select.tsx");
    expect(s.requirements.map((r) => r.ok)).toEqual([true, true, true, true, true]);
    expect(s.wiring.map((w) => w.ok)).toEqual([true, true, true]);
    expect(s.wiring[0].text).toContain("src/components/providers.tsx:3");
    expect(s.installed.fluid.sort()).toEqual(["select", "springs"]);
    expect(s.installed.builtOnFluid).toEqual(["project-list"]);
    expect(s.installed.collisions).toEqual(["src/components/ui/card.tsx"]);
    expect(s.installed.other).toEqual(["avatar"]);
    expect(s.decisions).toEqual(["AGENTS.md:3"]);
    expect(s.legacy).toEqual([]);
  });

  it("reads product code only: tests and stories never count", () => {
    const s = readStack(ready());
    expect(s.inter.map((f) => f.file)).toEqual(["src/app/layout.tsx"]);
    expect(s.installed.other).not.toContain("card.stories");
  });

  it("prefers the font the root loads over one in a mockup", () => {
    const dir = ready();
    writeFileSync(
      join(dir, "src/components/mockup.tsx"),
      `import { Inter } from "next/font/google";\nconst i = Inter({ subsets: ["latin"] });`,
    );
    const s = readStack(dir);
    expect(s.wiring[1]).toMatchObject({ ok: true });
    expect(s.wiring[1].text).toContain("(+1 outside the root)");
  });

  it("writes nothing, from the command line either", () => {
    const dir = ready();
    const before = listing(dir);
    const out = execFileSync(process.execPath, [script, dir], { encoding: "utf8" });
    expect(out).toContain("FLAVOR    base");
    expect(out).toContain("Nothing is cached or written");
    expect(listing(dir)).toEqual(before);
  });

  it("names each blocked requirement and quality gap on an older stack", () => {
    const s = readStack(
      project({
        "package.json": {
          dependencies: { react: "^18.3.1", motion: "^12.0.0", "@radix-ui/react-dialog": "^1.1.0" },
          devDependencies: { tailwindcss: "^3.4.0", vite: "^6.0.0" },
        },
        "src/index.css": `@tailwind base;\n:root { --background: white; }`,
        "src/main.tsx": `import "@fontsource-variable/inter";\nimport App from "./App";`,
        "src/App.tsx": `export default function App() { return null; }`,
        "src/demo/motion.tsx": `import { MotionConfig } from "motion/react";\nexport const D = () => <MotionConfig reducedMotion="user" />;`,
        ".agents/fluid-functionalism.md": "# old audit\n",
      }),
    );
    expect(s.framework.name).toBe("Vite");
    expect(s.flavor).toMatchObject({ flavor: "radix", open: false });
    const blocked = s.requirements.filter((r) => r.ok === false).map((r) => r.text);
    expect(blocked.some((t) => t.startsWith("react ^18"))).toBe(true);
    expect(blocked.some((t) => t.startsWith("tailwindcss ^3"))).toBe(true);
    expect(blocked.some((t) => t.startsWith("motion ^12"))).toBe(true);
    expect(blocked.some((t) => t.startsWith("no components.json"))).toBe(true);
    // A MotionConfig in a demo does not cover the app: not a pass, not a miss.
    expect(s.wiring[0]).toMatchObject({ ok: null });
    expect(s.wiring[0].text).toContain("src/demo/motion.tsx");
    expect(s.wiring[1]).toMatchObject({ ok: false });
    expect(s.legacy).toEqual([".agents/fluid-functionalism.md"]);
  });

  it("fails loudly outside a project", () => {
    expect(() => readStack(mkdtempSync(join(tmpdir(), "ff-empty-")))).toThrow(/package\.json/);
  });
});

describe("the stack script keeps up with the registry", () => {
  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  const files = registry.items.flatMap((item) => (item.files ?? []).map((f) => ({ item: item.name, ...f })));

  it("recognizes every registry ui file as FF code once installed", () => {
    const missed = files
      .filter((f) => f.type === "registry:ui")
      .filter((f) => !isFluidFile(basename(f.path, extname(f.path)), importsOf(readFileSync(join(root, f.path), "utf8"))))
      .map((f) => `${f.item}: ${f.path}`);
    expect(missed, "import one of FF_MODULES, or add the new module to FF_MODULES in stack.mjs").toEqual([]);
  });

  it("knows every name the registry installs a file under", () => {
    const known = registryNames();
    const unknown = files
      .map((f) => basename(f.target ?? f.path, extname(f.target ?? f.path)))
      .filter((name) => !["utils", "page"].includes(name) && !known.has(name));
    expect([...new Set(unknown)], "add the catalog row, or the part to FF_PARTS in stack.mjs").toEqual([]);
  });

  it("only fingerprints modules the registry actually ships", () => {
    const shipped = new Set(
      files.filter((f) => f.type !== "registry:ui").map((f) => basename(f.path, extname(f.path))),
    );
    expect(FF_MODULES.filter((m) => !shipped.has(m))).toEqual([]);
  });

  it("accepts the versions the registry is built and tested on", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const all = { ...pkg.devDependencies, ...pkg.dependencies };
    for (const [name, major] of Object.entries(REQUIRED_MAJOR)) {
      expect(parseMajor(all[name]), name).toBeGreaterThanOrEqual(major);
    }
  });
});
