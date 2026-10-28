// ---------------------------------------------------------------------------
// The accent: the one brand color of the system, read by every focus ring,
// the switch track, the drop and swatch rings and the copy highlight through
// --fluid-accent (globals.css derives --focus-ring from it). Hover and
// selected highlights stay neutral on purpose.
//
// Three presets travel as a "Make them yours" setting (cookie ff_accent, a word
// in the starter slug). A custom color is site-only (cookie ff_accent_custom)
// and reaches installs through the copied prompt. Server-safe: the root
// layout, the starter generator and the client all read it.
// ---------------------------------------------------------------------------

export type AccentPreset = "blue" | "violet" | "red";

/** The presets in panel order, by hue. Blue is the system's own; violet and
 *  red are Tailwind's 400 shades (violet-400, red-400, as hex). All three sit
 *  at about 0.70 OKLCH lightness: about 2.8:1 on white and 6.2 to 6.4:1 on
 *  the dark background, so a focus ring reads the same whichever is picked. */
export const ACCENT_PRESETS: Record<AccentPreset, { label: string; hex: string }> = {
  blue: { label: "Blue", hex: "#6B97FF" },
  violet: { label: "Violet", hex: "#A684FF" },
  red: { label: "Red", hex: "#FF6467" },
};

export const ACCENT_ORDER = Object.keys(ACCENT_PRESETS) as AccentPreset[];

export const DEFAULT_ACCENT: AccentPreset = "blue";

/** The accent as a CSS value, for site code that draws in it (inspect
 *  rulers, spec-sheet guides, annotations). SVG presentation attributes
 *  can't read var(): pass it through style or as the CSS color under
 *  currentColor. */
export const ACCENT_VAR = "var(--fluid-accent, #6B97FF)";

/** A 6-digit hex color, the only custom accent shape the site stores. */
export function isAccentHex(value: string | null | undefined): value is string {
  return !!value && /^#[0-9a-fA-F]{6}$/.test(value);
}

/** The preset a hex color is, if any (case-insensitive). */
export function presetForHex(hex: string): AccentPreset | null {
  const upper = hex.toUpperCase();
  return ACCENT_ORDER.find((p) => ACCENT_PRESETS[p].hex === upper) ?? null;
}

/** The color on screen: the custom one when set, else the preset's. */
export function accentHex(preset: AccentPreset, custom: string | null): string {
  return custom ?? ACCENT_PRESETS[preset].hex;
}

/** How the accent reads in words: "Violet", or the custom hex. */
export function accentLabel(preset: AccentPreset, custom: string | null): string {
  return custom ? custom.toUpperCase() : ACCENT_PRESETS[preset].label;
}

/** WCAG contrast ratio between two 6-digit hex colors. */
export function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Below this against the page, a 1px focus ring gets hard to find. The
 *  presets sit near 2.8:1 on the light background and 7:1 on the dark. */
export const LOW_ACCENT_CONTRAST = 2;
