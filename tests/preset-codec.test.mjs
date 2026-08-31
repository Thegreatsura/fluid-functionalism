// Preset codec guards: round-trip integrity across the whole state space,
// the shadcn-style compat rules (defaults at index 0, < 53 bits), and a
// golden code so an accidental table reorder cannot ship silently.
import { describe, it, expect } from "vitest";
import {
  encodeSidebarPreset,
  decodeSidebarPreset,
  SIDEBAR_DEFAULT_CODE,
} from "../lib/preset/components.ts";
import { totalBits } from "../lib/preset/codec.ts";
import {
  SIDEBAR_PRESET_FIELDS,
  DEFAULT_PRESET,
} from "../lib/preset/sidebar-options.ts";

// Deterministic PRNG (mulberry32) — seeded, so failures reproduce.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomPreset(rand) {
  const p = {};
  for (const f of SIDEBAR_PRESET_FIELDS) {
    p[f.key] = f.values[Math.floor(rand() * f.values.length)];
  }
  return p;
}

describe("preset codec", () => {
  it("stays under 53 bits", () => {
    expect(totalBits(SIDEBAR_PRESET_FIELDS)).toBeLessThan(53);
  });

  it("every field's default sits at index 0", () => {
    for (const f of SIDEBAR_PRESET_FIELDS) {
      expect(f.values[0], `field "${f.key}" default must be values[0]`).toEqual(
        DEFAULT_PRESET[f.key]
      );
    }
  });

  it("every field allocates enough bits for its values", () => {
    for (const f of SIDEBAR_PRESET_FIELDS) {
      expect(2 ** f.bits, `field "${f.key}"`).toBeGreaterThanOrEqual(
        f.values.length
      );
    }
  });

  it("the all-defaults code decodes to the defaults", () => {
    const res = decodeSidebarPreset(SIDEBAR_DEFAULT_CODE);
    expect(res.ok).toBe(true);
    expect(res.preset).toEqual(DEFAULT_PRESET);
  });

  it("round-trips 500 random presets exactly", () => {
    const rand = rng(1234);
    for (let i = 0; i < 500; i++) {
      const p = randomPreset(rand);
      const res = decodeSidebarPreset(encodeSidebarPreset(p));
      expect(res.ok).toBe(true);
      expect(res.preset, `seed iteration ${i}`).toEqual({
        ...DEFAULT_PRESET,
        ...p,
      });
    }
  });

  it("rejects garbage without throwing", () => {
    for (const bad of ["", "s", "xz99", "sZ!!!", "sa" + "z".repeat(40)]) {
      const res = decodeSidebarPreset(bad);
      expect(res.ok).toBe(false);
      expect(typeof res.error).toBe("string");
    }
  });

  // Golden: if this fails, a value array was reordered or a field inserted
  // mid-table — that breaks every code in the wild. Append instead.
  it("golden code for a fixed non-default preset is stable", () => {
    const code = encodeSidebarPreset({
      design: "floating",
      collapsedBehavior: "hover",
      headerStack: "horizontal",
      l1Primary: "menu",
      l1Children: true,
      footerCallout: "banner",
      flavor: "base",
    });
    const back = decodeSidebarPreset(code);
    expect(back.ok).toBe(true);
    expect(back.preset.design).toBe("floating");
    expect(back.preset.flavor).toBe("base");
    // Pin the literal string — update ONLY on a deliberate version bump.
    expect(code).toBe(code); // placeholder replaced below by snapshot
    expect(code).toMatchInlineSnapshot(`"sa1P6kiL98"`);
  });
});

// ── Generic guards: every registered component obeys the compat rules ──────
import "../lib/preset/components.ts"; // side-effect registrations
import {
  getAllPresetComponents,
  encodePreset,
  decodePreset as decodeAny,
  totalBits as bitsOf,
} from "../lib/preset/codec.ts";

describe("every registered preset component", () => {
  for (const def of getAllPresetComponents()) {
    describe(`"${def.label}" (tag ${def.tag})`, () => {
      const fields = def.versions[def.currentVersion];
      it("stays under 53 bits", () => {
        expect(bitsOf(fields)).toBeLessThan(53);
      });
      it("defaults sit at index 0 and fit their bits", () => {
        for (const f of fields) {
          expect(f.values[0], `field "${f.key}"`).toEqual(def.defaults[f.key]);
          expect(2 ** f.bits, `field "${f.key}"`).toBeGreaterThanOrEqual(f.values.length);
        }
      });
      it("round-trips 200 random configs", () => {
        const rand = rng(def.tag.charCodeAt(0) * 7919);
        for (let i = 0; i < 200; i++) {
          const cfg = {};
          for (const f of fields) cfg[f.key] = f.values[Math.floor(rand() * f.values.length)];
          const res = decodeAny(encodePreset(def, cfg));
          expect(res.ok).toBe(true);
          expect(res.preset, `iteration ${i}`).toEqual({ ...def.defaults, ...cfg });
        }
      });
    });
  }
});
