// ---------------------------------------------------------------------------
// Stateless preset codec, following shadcn's preset principle: bit-pack the
// configuration into ONE integer over versioned, append-only field tables,
// base62-encode it, and prefix a component tag + version character. Codes
// decode offline and forever — no storage, no lookup.
//
// Code shape: `<component><version><base62>` — e.g. "sa3Xk9Q".
//   component "s" = sidebar (future playgrounds get their own tag)
//   version   "a" = the current SIDEBAR_PRESET_FIELDS layout
//
// Compat rules (enforced by tests/preset-codec.test.mjs):
//   1. Never reorder existing value arrays — only append.
//   2. Every field's default sits at index 0 (unknown/overflow decodes to it).
//   3. Only append new fields at the end; bump the version char when the
//      LAYOUT changes incompatibly (bit widths, removals).
//   4. Total bits stay under 53 (JS safe-integer limit).
// ---------------------------------------------------------------------------

import {
  SIDEBAR_PRESET_FIELDS,
  DEFAULT_PRESET,
  type SidebarPreset,
  type PresetField,
} from "./sidebar-options";

const BASE62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function toBase62(num: number): string {
  if (num === 0) return "0";
  let out = "";
  let n = num;
  while (n > 0) {
    out = BASE62[n % 62] + out;
    n = Math.floor(n / 62);
  }
  return out;
}

export function fromBase62(str: string): number {
  let out = 0;
  for (const ch of str) {
    const idx = BASE62.indexOf(ch);
    if (idx === -1) return -1;
    out = out * 62 + idx;
  }
  return out;
}

export const SIDEBAR_TAG = "s";
const SIDEBAR_VERSIONS: Record<string, readonly PresetField[]> = {
  a: SIDEBAR_PRESET_FIELDS,
};
const SIDEBAR_CURRENT_VERSION = "a";

export function totalBits(fields: readonly PresetField[]): number {
  return fields.reduce((n, f) => n + f.bits, 0);
}

/** Encode a (possibly partial) preset. Missing fields take their defaults,
 *  so a bare {} encodes the canonical default code. Uses multiplication, not
 *  bitwise ops — JS bitwise truncates to 32 bits. */
export function encodeSidebarPreset(config: Partial<SidebarPreset>): string {
  const merged = { ...DEFAULT_PRESET, ...config };
  let bits = 0;
  let offset = 0;
  for (const field of SIDEBAR_PRESET_FIELDS) {
    const idx = field.values.indexOf(merged[field.key] as never);
    bits += (idx === -1 ? 0 : idx) * 2 ** offset;
    offset += field.bits;
  }
  return `${SIDEBAR_TAG}${SIDEBAR_CURRENT_VERSION}${toBase62(bits)}`;
}

export type DecodeResult =
  | { ok: true; preset: SidebarPreset; version: string }
  | { ok: false; error: string };

/** Tolerant decode: an out-of-range index (a value appended after this code
 *  was minted no longer exists locally — impossible under the append-only
 *  rule, but defended anyway) falls back to the field's default. Unknown
 *  tags/versions fail loudly with a useful message. */
export function decodeSidebarPreset(code: string): DecodeResult {
  const trimmed = code.trim();
  if (trimmed.length < 3) return { ok: false, error: "Preset code is too short." };
  const tag = trimmed[0];
  const version = trimmed[1];
  const body = trimmed.slice(2);
  if (tag !== SIDEBAR_TAG) {
    return { ok: false, error: `Unknown preset component tag "${tag}".` };
  }
  const fields = SIDEBAR_VERSIONS[version];
  if (!fields) {
    return {
      ok: false,
      error: `Unknown preset version "${version}" — update fluidfunctionalism.com links or re-copy the code.`,
    };
  }
  const bits = fromBase62(body);
  if (bits < 0 || bits >= 2 ** totalBits(fields)) {
    return { ok: false, error: "Preset code is not valid base62 or out of range." };
  }
  const preset = { ...DEFAULT_PRESET } as Record<string, unknown>;
  let remaining = bits;
  for (const field of fields) {
    const idx = remaining % 2 ** field.bits;
    remaining = Math.floor(remaining / 2 ** field.bits);
    preset[field.key as string] =
      idx < field.values.length ? field.values[idx] : field.values[0];
  }
  return { ok: true, preset: preset as unknown as SidebarPreset, version };
}

/** The canonical all-defaults code — the static sidebar-app block. */
export const SIDEBAR_DEFAULT_CODE = encodeSidebarPreset({});
