/**
 * The type scale has one source (registry/default/lib/type-scale.ts) and
 * generated copies (globals.css, registry.json, utils.ts, the class map).
 * These tests fail when a copy is stale and pin the tailwind-merge behavior
 * components rely on.
 */
import { describe, expect, it } from "vitest";
import { twMerge } from "tailwind-merge";
import { generate } from "../scripts/generate-type-scale.mjs";
import { typeScale, typeClasses } from "../registry/default/lib/type-scale.ts";
import { cn } from "../registry/default/lib/utils.ts";
import { fontWeights } from "../registry/default/lib/font-weight.ts";
import { SEMIBOLD, generateTypesetCss } from "../lib/typeset/generate.ts";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

describe("type scale generation", () => {
  it("every generated output is up to date", async () => {
    const files = await generate();
    const stale = Object.entries(files)
      .filter(([, [before, after]]) => before !== after)
      .map(([path]) => path);
    expect(stale, "run `node scripts/generate-type-scale.mjs`").toEqual([]);
  });

  it("class map carries each role's px values as fallbacks", () => {
    for (const [role, step] of Object.entries(typeScale)) {
      for (const v of ["default", "compact"]) {
        expect(typeClasses[v][role]).toContain(`,${step[v].size}px)]`);
        expect(typeClasses[v][role]).toContain(`,${step[v].leading}px)]`);
      }
    }
  });
});

// Installed components get shadcn's stock `cn` (plain tailwind-merge), so the
// component class strings must survive it, not only FF's extended one.
describe.each([
  ["stock tailwind-merge", twMerge],
  ["FF cn", cn],
])("%s", (_name, merge) => {
  const caption = typeClasses.default.caption;

  it("keeps the role next to a text color", () => {
    expect(merge(caption, "text-muted-foreground")).toBe(`${caption} text-muted-foreground`);
  });

  it("a later leading utility replaces the role leading", () => {
    expect(merge(caption, "leading-none")).toBe(
      "text-[length:var(--fs-caption,12px)] leading-none"
    );
  });

  it("a later role replaces an earlier size and leading", () => {
    expect(merge("text-[13px] leading-snug", caption)).toBe(caption);
  });
});

describe("FF cn with theme utilities", () => {
  it.each(["text-caption", "text-caption-compact", "text-micro", "text-site-body"])(
    "%s is a font size, not a color",
    (cls) => {
      expect(cn(cls, "text-muted-foreground")).toBe(`${cls} text-muted-foreground`);
    }
  );

  it("a role utility drops an earlier leading (font-size wins over leading)", () => {
    expect(cn("leading-none", "text-caption")).toBe("text-caption");
  });

  it("a later leading is kept after a role utility", () => {
    expect(cn("text-caption", "leading-none")).toBe("text-caption leading-none");
  });
});

describe("typeset sheet", () => {
  it("uses the library's semibold weight", () => {
    expect(SEMIBOLD).toBe(fontWeights.semibold);
  });

  it("sets .typeset-scale levels from the roles at both steps", () => {
    const css = generateTypesetCss(undefined, true, typeScale);
    const block = (sel) => css.split(`${sel} {`)[1].split("}")[0];
    const num = (decls, name) => Number(new RegExp(`${name}: ([0-9.]+);`).exec(decls)[1]);
    for (const [sel, step] of [
      [":where(.typeset-scale)", "default"],
      [":where(.typeset-scale.typeset-compact)", "compact"],
    ]) {
      const decls = block(sel);
      const body = typeScale.body[step].size;
      for (const [level, role] of [
        ["h1", "display"],
        ["h2", "title"],
        ["h3", "subtitle"],
        ["h4", "body"],
        ["h5", "caption"],
        ["h6", "micro"],
      ]) {
        // Within rounding: the level times the body size lands on the role.
        expect(num(decls, `--typeset-${level}`) * body).toBeCloseTo(typeScale[role][step].size, 1);
      }
      expect(num(decls, "--typeset-code") * body).toBeCloseTo(typeScale.caption[step].size, 1);
      expect(decls).toContain(`${body}px)`);
    }
  });

  it("never relies on selectors that reflow streamed content", () => {
    const css = generateTypesetCss();
    expect(css).not.toMatch(/:last-child|:has\(|margin-bottom/);
  });
});

// Components carry the role classes as literal strings (Tailwind must read
// them in source), so their px fallbacks are copies: keep them on the scale.
describe("role class literals in registry sources", () => {
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(name)) files.push(p);
    }
  };
  walk(new URL("../registry", import.meta.url).pathname);

  it.each(files.map((f) => [f.split("/registry/")[1], f]))("%s", (_rel, file) => {
    const src = readFileSync(file, "utf-8");
    for (const m of src.matchAll(/var\(--(fs|lh)-([a-z]+)(-compact)?,(\d+)px\)/g)) {
      const [, kind, role, compact, px] = m;
      const pair = typeScale[role]?.[compact ? "compact" : "default"];
      expect(pair, `unknown role ${role}`).toBeDefined();
      expect(Number(px), m[0]).toBe(kind === "fs" ? pair.size : pair.leading);
    }
  });
});
