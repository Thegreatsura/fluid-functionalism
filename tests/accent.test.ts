import { describe, expect, it } from "vitest";
import {
  ACCENT_ORDER,
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  accentHex,
  accentLabel,
  contrastRatio,
  isAccentHex,
  presetForHex,
} from "@/lib/accent";
import {
  CUSTOM_ACCENT_COOKIE,
  SETTING_VALUES,
  customAccentCookie,
  readCustomAccent,
} from "@/lib/docs/site-settings";
import { buildStarterPrompt, starterCommand } from "@/lib/docs/install-prompt";
import { STARTER_DEFAULTS } from "@/lib/starter/settings";

const jar = (cookies: Record<string, string>) => (name: string) => cookies[name];
const valueOf = (line: string) => line.split("; ")[0].split("=").slice(1).join("=");

describe("accent presets", () => {
  it("default to the blue the system always had", () => {
    expect(DEFAULT_ACCENT).toBe("blue");
    expect(ACCENT_PRESETS.blue.hex).toBe("#6B97FF");
    expect([...SETTING_VALUES.accent]).toEqual(ACCENT_ORDER);
  });

  // A 1px focus ring has to read the same whichever preset is on.
  it("sit at the blue's contrast on both backgrounds", () => {
    for (const preset of ACCENT_ORDER) {
      const { hex } = ACCENT_PRESETS[preset];
      expect(contrastRatio(hex, "#FFFFFF"), preset).toBeGreaterThan(2.75);
      expect(contrastRatio(hex, "#FFFFFF"), preset).toBeLessThan(3);
      expect(contrastRatio(hex, "#171717"), preset).toBeGreaterThan(5.5);
    }
  });

  it("map a hex back to its preset, any case", () => {
    expect(presetForHex("#ac82f0")).toBe("violet");
    expect(presetForHex("#123456")).toBeNull();
    expect(accentHex("red", null)).toBe("#FF6964");
    expect(accentHex("red", "#123456")).toBe("#123456");
    expect(accentLabel("red", null)).toBe("Red");
    expect(accentLabel("red", "#abcdef")).toBe("#ABCDEF");
  });
});

describe("custom accent cookie", () => {
  it("round-trips a hex and clears for a preset", () => {
    expect(readCustomAccent(jar({ [CUSTOM_ACCENT_COOKIE]: valueOf(customAccentCookie("#abcdef")) }))).toBe("#ABCDEF");
    expect(customAccentCookie(null)).toContain("max-age=0");
  });

  it("ignores anything that isn't a 6-digit hex", () => {
    for (const raw of ["red", "#abc", "#abcdef00", "%E0%A4%A", "javascript:alert(1)"]) {
      expect(readCustomAccent(jar({ [CUSTOM_ACCENT_COOKIE]: raw })), raw).toBeNull();
    }
    expect(isAccentHex("#A1B2C3")).toBe(true);
  });
});

describe("the starter Copy prompt's accent", () => {
  it("carries a preset in the slug and the layout line", () => {
    const settings = { ...STARTER_DEFAULTS, accent: "violet" } as const;
    const prompt = buildStarterPrompt(settings);
    expect(starterCommand(settings)).toContain("/r/starter/violet.json");
    expect(prompt).toContain("violet accent");
    expect(prompt).toContain("(violet, #AC82F0)");
    // An existing app gets the tokens' blue, so it sets the preset itself.
    expect(prompt).toContain(`put style={{ "--fluid-accent": "#AC82F0" }} on <html>`);
  });

  it("asks nothing extra of an existing app for the default blue", () => {
    expect(buildStarterPrompt(STARTER_DEFAULTS)).not.toContain(`put style={{ "--fluid-accent"`);
  });

  it("names a custom color in words and where to set it, the slug keeping the preset", () => {
    const prompt = buildStarterPrompt(STARTER_DEFAULTS, undefined, "#123456");
    expect(prompt).toContain("#123456 accent");
    expect(prompt).not.toContain("blue accent");
    expect(prompt).toContain(`Change its value to "#123456"`);
    expect(prompt).toContain(`put style={{ "--fluid-accent": "#123456" }} on <html>`);
    expect(prompt).toContain(starterCommand(STARTER_DEFAULTS));
    expect(prompt).not.toContain("—");
  });
});
