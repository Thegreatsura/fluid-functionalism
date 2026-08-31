// Preset route guards: the bundler-safe dep resolver must agree with the
// postbuild's resolver for every item × flavor (they are two copies by
// necessity — the route can't import the fs-touching script), and generated
// preset payload sources must obey the same purity rules as static payloads.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  depUrl as scriptDepUrl,
  CUSTOM_ITEMS,
} from "../scripts/postbuild-registry.mjs";
import { buildDepResolver } from "../lib/registry-urls.mjs";
import {
  generateSidebarPresetFiles,
  presetRegistryDeps,
} from "../lib/preset/sidebar-install.ts";
import { DEFAULT_PRESET, SIDEBAR_PRESET_FIELDS } from "../lib/preset/sidebar-options.ts";

const manifest = JSON.parse(
  readFileSync(new URL("../registry.json", import.meta.url), "utf-8")
);
const routeDepUrl = buildDepResolver(manifest.items);

describe("preset route dependency resolution", () => {
  it("agrees with the postbuild resolver for every item and flavor", () => {
    const deps = [...CUSTOM_ITEMS, "utils", "not-a-real-item"];
    for (const dep of deps) {
      for (const flavor of ["flat", "radix", "base"]) {
        expect(routeDepUrl(dep, flavor), `${dep} @ ${flavor}`).toBe(
          scriptDepUrl(dep, flavor)
        );
      }
    }
  });

  it("every preset registry dep exists as a manifest item (or is 'utils')", () => {
    const names = new Set(manifest.items.map((i) => i.name));
    let a = 7;
    const rand = () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < 100; i++) {
      const p = { ...DEFAULT_PRESET };
      for (const f of SIDEBAR_PRESET_FIELDS) {
        p[f.key] = f.values[Math.floor(rand() * f.values.length)];
      }
      for (const dep of presetRegistryDeps(p)) {
        expect(dep === "utils" || names.has(dep), `unknown dep "${dep}"`).toBe(true);
      }
    }
  });

  it("generated sources obey payload purity (no docs or repo-internal imports)", () => {
    for (const partial of [
      {},
      { l1Primary: "menu", l1Children: true, footerCallout: "banner", footerCalloutStacked: true },
      { headerStack: "horizontal", flavor: "base", shape: "pill" },
    ]) {
      for (const file of generateSidebarPresetFiles({ ...DEFAULT_PRESET, ...partial })) {
        expect(file.content).not.toContain("@/lib/docs");
        expect(file.content).not.toContain('from "@/registry/');
      }
    }
  });
});
