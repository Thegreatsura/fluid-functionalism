// Compile guard for the preset install generator: generated files are
// injected as virtual files into a REAL TypeScript program over the
// project's tsconfig (path aliases and all), and must produce zero
// diagnostics. A curated matrix covers the structural branches; a seeded
// fuzz sweep parses a wide sample for syntax errors cheaply.
import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";
import { generateSidebarPresetFiles } from "../lib/preset/sidebar-install.ts";
import {
  DEFAULT_PRESET,
  SIDEBAR_PRESET_FIELDS,
} from "../lib/preset/sidebar-options.ts";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

function typecheckPreset(preset) {
  const files = generateSidebarPresetFiles(preset);
  const virtual = new Map(
    files.map((f) => [path.join(root, "__preset__", f.target), f.content])
  );
  // The generated component imports its sibling by alias — map the alias
  // into the virtual dir via extra paths below.
  const configFile = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
  const options = {
    ...parsed.options,
    noEmit: true,
    skipLibCheck: true,
    paths: {
      ...parsed.options.paths,
      "@/components/sidebar-preset/*": ["./__preset__/components/sidebar-preset/*"],
    },
    baseUrl: parsed.options.baseUrl ?? root,
  };
  const host = ts.createCompilerHost(options);
  const origReadFile = host.readFile.bind(host);
  const origFileExists = host.fileExists.bind(host);
  const origDirExists = (host.directoryExists ?? ts.sys.directoryExists).bind(
    host.directoryExists ? host : ts.sys
  );
  const virtualDirs = new Set(
    [...virtual.keys()].flatMap((f) => {
      const dirs = [];
      let d = path.dirname(f);
      while (d.startsWith(root) && d !== root) {
        dirs.push(d);
        d = path.dirname(d);
      }
      return dirs;
    })
  );
  host.readFile = (f) => virtual.get(path.normalize(f)) ?? origReadFile(f);
  host.fileExists = (f) => virtual.has(path.normalize(f)) || origFileExists(f);
  host.directoryExists = (d) =>
    virtualDirs.has(path.normalize(d)) || origDirExists(d);
  const program = ts.createProgram([...virtual.keys()], options, host);
  const diagnostics = [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ].filter((d) => d.file && virtual.has(path.normalize(d.file.fileName)));
  return diagnostics.map((d) =>
    `${path.basename(d.file.fileName)}:${d.file.getLineAndCharacterOfPosition(d.start).line + 1} ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`
  );
}

// Curated matrix: every structural branch flips at least once.
const MATRIX = [
  {}, // all defaults
  { headerStack: "horizontal", headerActions: 2, headerPrimary: "logo" },
  { headerPrimary: "none", headerStack: "horizontal" },
  { l1Primary: "menu", l1Children: true, l2Actions: 2, l2Badges: true, l2Icon: false },
  { l1Primary: "menu", l1Children: true, l1Actions: 3, l1Badges: true },
  { state: "loading", footerCallout: "inline" },
  { state: "closed", collapsedBehavior: "hover", design: "floating" },
  { footerCallout: "banner", footerCalloutStacked: true, footerPrimary: "none", footerActions: 0 },
  { footerCallout: "inline", footerCalloutStacked: true, footerStack: "vertical" },
  { sectionActions: 3, sectionsCollapsible: false, l1Actions: 0, footerActions: 1 },
  { shape: "pill", size: "compact", flavor: "base", collapsedBehavior: "click" },
];

describe("preset install generator", () => {
  for (const [i, partial] of MATRIX.entries()) {
    it(`matrix ${i} typechecks: ${JSON.stringify(partial)}`, () => {
      const diags = typecheckPreset({ ...DEFAULT_PRESET, ...partial });
      expect(diags, diags.join("\n")).toEqual([]);
    });
  }

  it("fuzz: 120 random presets parse cleanly", () => {
    let a = 42;
    const rand = () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < 120; i++) {
      const p = { ...DEFAULT_PRESET };
      for (const f of SIDEBAR_PRESET_FIELDS) {
        p[f.key] = f.values[Math.floor(rand() * f.values.length)];
      }
      for (const file of generateSidebarPresetFiles(p)) {
        const sf = ts.createSourceFile(
          file.target,
          file.content,
          ts.ScriptTarget.Latest,
          true,
          file.target.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
        );
        const errs = sf.parseDiagnostics.map((d) =>
          ts.flattenDiagnosticMessageText(d.messageText, " ")
        );
        expect(errs, `iteration ${i} ${file.target}:\n${errs.join("\n")}`).toEqual([]);
      }
    }
  });
});
