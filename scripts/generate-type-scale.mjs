/**
 * Generates every copy of the type scale from registry/default/lib/type-scale.ts:
 *
 *  1. the literal class map (`typeClasses`) inside type-scale.ts itself
 *  2. the type-scale block in app/globals.css (component vars, Tailwind theme
 *     tokens, and the site-chrome `text-site-*` utilities that follow
 *     <html data-size>)
 *  3. the `type-scale` item in registry.json (cssVars for installs)
 *  4. the tailwind-merge font-size list in registry/default/lib/utils.ts
 *  5. the `.typeset` prose sheet from lib/typeset/generate.ts, both as the
 *     `typography` item in registry.json and as a block in app/globals.css
 *     (the same function the builder on /docs/typography downloads from)
 *
 * `node scripts/generate-type-scale.mjs` writes; `--check` exits non-zero
 * when any output is stale (run by tests/type-scale.test.mjs).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

// fileURLToPath, not .pathname: a checkout path with a space stays a path.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SCALE_PATH = `${ROOT}registry/default/lib/type-scale.ts`;
const GLOBALS_PATH = `${ROOT}app/globals.css`;
const REGISTRY_PATH = `${ROOT}registry.json`;
const UTILS_PATH = `${ROOT}registry/default/lib/utils.ts`;
const TYPESET_PATH = `${ROOT}lib/typeset/generate.ts`;

// Site chrome only: page titles keep a smaller size below `sm`.
const SITE_DISPLAY_MOBILE = {
  default: { size: 22, leading: 28 },
  compact: { size: 20, leading: 26 },
};

/** Node strips the TS types; the data object is plain. */
export async function loadScale() {
  const mod = await import(`${pathToFileURL(SCALE_PATH).href}?t=${Date.now()}`);
  return mod.typeScale;
}

const suffix = (variant) => (variant === "compact" ? "-compact" : "");

export function classFor(role, variant, pair) {
  const s = suffix(variant);
  return `text-[length:var(--fs-${role}${s},${pair.size}px)] leading-[var(--lh-${role}${s},${pair.leading}px)]`;
}

function replaceBetween(source, start, end, body, file) {
  const a = source.indexOf(start);
  const b = source.indexOf(end);
  if (a === -1 || b === -1 || b < a) {
    throw new Error(`Markers ${start} … ${end} missing in ${file}`);
  }
  return source.slice(0, a + start.length) + body + source.slice(b);
}

export function sizeClassFor(role, variant, pair) {
  return `text-[length:var(--fs-${role}${suffix(variant)},${pair.size}px)]`;
}

/** Both maps: size + leading (`typeClasses`) and size only (`typeSizes`). */
export function renderClassMap(scale) {
  const variants = ["default", "compact"];
  const lines = [""];
  for (const [name, pick] of [
    ["typeClasses", classFor],
    ["typeSizes", sizeClassFor],
  ]) {
    lines.push(`const ${name} = {`);
    for (const v of variants) {
      lines.push(`  ${v}: {`);
      for (const [role, step] of Object.entries(scale)) {
        lines.push(`    ${role}: "${pick(role, v, step[v])}",`);
      }
      lines.push("  },");
    }
    lines.push("} as const satisfies Record<TypeScaleVariant, Record<TypeScaleRole, string>>;", "");
  }
  lines.push("// ");
  return lines.join("\n");
}

export function cssVars(scale) {
  const vars = {};
  for (const [role, step] of Object.entries(scale)) {
    for (const v of ["default", "compact"]) {
      vars[`fs-${role}${suffix(v)}`] = `${step[v].size}px`;
      vars[`lh-${role}${suffix(v)}`] = `${step[v].leading}px`;
    }
  }
  return vars;
}

export function themeVars(scale) {
  const vars = {};
  for (const role of Object.keys(scale)) {
    for (const v of ["default", "compact"]) {
      const s = suffix(v);
      vars[`text-${role}${s}`] = `var(--fs-${role}${s})`;
      vars[`text-${role}${s}--line-height`] = `var(--lh-${role}${s})`;
    }
  }
  return vars;
}

export function renderGlobals(scale) {
  const roles = Object.keys(scale);
  const out = [""];
  out.push(":root {");
  for (const [k, v] of Object.entries(cssVars(scale))) out.push(`  --${k}: ${v};`);
  out.push("}", "");
  out.push("@theme inline {");
  for (const [k, v] of Object.entries(themeVars(scale))) out.push(`  --${k}: ${v};`);
  out.push("}", "");
  out.push(
    "/* Site chrome: follows the size shortcut through <html data-size>. Each",
    "   role brings its whole-pixel line height; a leading-* utility on the",
    "   same element still wins, since it sets --tw-leading. */"
  );
  const step = (variant) => (role) =>
    role === "display" ? SITE_DISPLAY_MOBILE[variant] : scale[role][variant];
  out.push(":root {");
  for (const role of roles) {
    const { size, leading } = step("default")(role);
    out.push(`  --fs-site-${role}: ${size}px;`, `  --lh-site-${role}: ${leading}px;`);
  }
  out.push("}", "");
  out.push("@media (min-width: 640px) {", "  :root {");
  out.push(`    --fs-site-display: ${scale.display.default.size}px;`);
  out.push(`    --lh-site-display: ${scale.display.default.leading}px;`);
  out.push("  }", "}", "");
  out.push('html[data-size="compact"] {');
  for (const role of roles) {
    const { size, leading } = step("compact")(role);
    out.push(`  --fs-site-${role}: ${size}px;`, `  --lh-site-${role}: ${leading}px;`);
  }
  out.push("}", "");
  out.push("@media (min-width: 640px) {", '  html[data-size="compact"] {');
  out.push(`    --fs-site-display: ${scale.display.compact.size}px;`);
  out.push(`    --lh-site-display: ${scale.display.compact.leading}px;`);
  out.push("  }", "}", "");
  for (const role of roles) {
    out.push(`@utility text-site-${role} {`);
    out.push(`  font-size: var(--fs-site-${role}, ${scale[role].default.size}px);`);
    out.push(`  line-height: var(--tw-leading, var(--lh-site-${role}, ${scale[role].default.leading}px));`);
    out.push("}");
  }
  out.push("/* ");
  return out.join("\n");
}

export function renderMergeList(scale) {
  const names = [];
  for (const role of Object.keys(scale)) names.push(`text-${role}`, `text-${role}-compact`);
  for (const role of Object.keys(scale)) names.push(`text-site-${role}`);
  return "\n" + names.map((n) => `        "${n}",`).join("\n") + "\n        // ";
}

export function registryItem(scale) {
  return {
    name: "type-scale",
    // registry:item, not registry:theme: shadcn asks "install a new theme?"
    // when the first item is a theme, and a non-interactive shell can't
    // answer, so the install silently writes nothing. Items carry cssVars and
    // css just the same.
    type: "registry:item",
    title: "Type Scale",
    description:
      "Six type roles (display, title, subtitle, body, caption, micro), each a font size and a line height, at the default and compact steps of the size ladder. Adds text-<role> and text-<role>-compact utilities and the --fs-* / --lh-* variables components read.",
    cssVars: {
      theme: themeVars(scale),
      light: cssVars(scale),
    },
    docs: "Docs & live playground: https://www.fluidfunctionalism.com/docs/typography.",
    categories: ["theme"],
  };
}

const loadTypeset = () => import(`${pathToFileURL(TYPESET_PATH).href}?t=${Date.now()}`);

export async function typographyItem(scale) {
  const { typesetRegistryCss } = await loadTypeset();
  return {
    name: "typography",
    // registry:item, not registry:theme: shadcn asks "install a new theme?"
    // when the first item is a theme, and a non-interactive shell can't
    // answer, so the install silently writes nothing. Items carry cssVars and
    // css just the same.
    type: "registry:item",
    title: "Typography",
    description:
      "Prose styles for rendered markdown and rich-text editors (Tiptap works as is): wrap content in .typeset and every element sets in the type scale's styles, as on the site. h1 is display in bold, h2 title, h3 to h6 subtitle, paragraphs body in the muted color, figcaption and code caption. Reads the --fs-* and --lh-* tokens, with px fallbacks. Zero specificity inside @layer components, so any utility wins; .not-typeset opts a subtree out; spacing only above elements, so streamed content never reflows. Add .typeset-compact for the compact step.",
    css: typesetRegistryCss(scale),
    docs: "Docs & builder: https://www.fluidfunctionalism.com/docs/typography.",
    categories: ["theme"],
  };
}

export async function generate() {
  const scale = await loadScale();
  const files = {};

  const scaleSrc = readFileSync(SCALE_PATH, "utf-8");
  files[SCALE_PATH] = [
    scaleSrc,
    replaceBetween(scaleSrc, "// <generated:type-classes>", "</generated:type-classes>", renderClassMap(scale), SCALE_PATH),
  ];

  const { generateTypesetCss } = await loadTypeset();
  const globals = readFileSync(GLOBALS_PATH, "utf-8");
  let nextGlobals = replaceBetween(globals, "/* <generated:type-scale> */", "</generated:type-scale> */", renderGlobals(scale), GLOBALS_PATH);
  nextGlobals = replaceBetween(nextGlobals, "/* <generated:typeset> */", "</generated:typeset> */", "\n" + generateTypesetCss(scale) + "/* ", GLOBALS_PATH);
  files[GLOBALS_PATH] = [globals, nextGlobals];

  const utils = readFileSync(UTILS_PATH, "utf-8");
  files[UTILS_PATH] = [
    utils,
    replaceBetween(utils, "// <generated:type-scale>", "</generated:type-scale>", renderMergeList(scale), UTILS_PATH),
  ];

  const registrySrc = readFileSync(REGISTRY_PATH, "utf-8");
  const registry = JSON.parse(registrySrc);
  const upsert = (item, afterName) => {
    const idx = registry.items.findIndex((i) => i.name === item.name);
    if (idx !== -1) registry.items[idx] = item;
    else registry.items.splice(registry.items.findIndex((i) => i.name === afterName) + 1, 0, item);
  };
  upsert(registryItem(scale), "tokens");
  upsert(await typographyItem(scale), "type-scale");
  files[REGISTRY_PATH] = [registrySrc, JSON.stringify(registry, null, 2) + "\n"];

  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const check = process.argv.includes("--check");
  const files = await generate();
  const stale = Object.entries(files).filter(([, [before, after]]) => before !== after);
  if (check) {
    if (stale.length) {
      console.error(
        "Type scale outputs are stale. Run `node scripts/generate-type-scale.mjs`:\n" +
          stale.map(([p]) => `  ${p.replace(ROOT, "")}`).join("\n")
      );
      process.exit(1);
    }
    console.log("Type scale outputs are up to date.");
  } else {
    for (const [path, [, after]] of stale) writeFileSync(path, after);
    console.log(`Type scale: wrote ${stale.length} file(s).`);
  }
}
