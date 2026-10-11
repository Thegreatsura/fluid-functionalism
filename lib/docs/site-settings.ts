// ---------------------------------------------------------------------------
// The "Make them yours" settings (theme, radius, size, icons, primitive) and
// where the browser keeps them: one cookie each, so the server layout renders
// the visitor's last choice on the first paint. localStorage would only be
// readable after hydration, and every reload would flash the defaults first
// (a light page before dark, rounded corners before pill, the default ladder
// before compact).
//
// Server-safe on purpose: no "use client", and the value lists live here
// rather than in the client modules that own each setting, because a server
// component importing a value from a client module gets a reference, not
// the array.
// ---------------------------------------------------------------------------

import type { Theme } from "@/registry/default/lib/theme-context";
import type { ShapeVariant } from "@/registry/default/lib/shape-context";
import type { SizeVariant } from "@/registry/default/lib/size-context";
import type { IconLibrary } from "@/lib/docs/icon-map";
import type { Base } from "@/lib/base-context";

export interface SiteSettings {
  theme: Theme;
  shape: ShapeVariant;
  size: SizeVariant;
  icons: IconLibrary;
  base: Base;
}

/** What a first visit sees. */
export const DEFAULT_SETTINGS: SiteSettings = {
  theme: "system",
  shape: "rounded",
  size: "default",
  icons: "untitledui",
  base: "base",
};

/** Every value each setting accepts, in the order the site lists them. */
export const SETTING_VALUES = {
  theme: ["system", "light", "dark"],
  shape: ["rounded", "pill"],
  size: ["default", "compact"],
  icons: ["lucide", "tabler", "phosphor", "hugeicons", "untitledui"],
  base: ["radix", "base"],
} as const satisfies { [K in keyof SiteSettings]: readonly SiteSettings[K][] };

export const SETTINGS_COOKIES: Record<keyof SiteSettings, string> = {
  theme: "ff_theme",
  shape: "ff_shape",
  size: "ff_size",
  icons: "ff_icons",
  base: "ff_base",
};

/** One year: a preference, not a session. */
const MAX_AGE = 60 * 60 * 24 * 365;

/** Reads every setting through `get` (a cookie lookup), falling back to the
 *  default for a missing or unknown value. */
export function readSettings(get: (name: string) => string | undefined): SiteSettings {
  const pick = <K extends keyof SiteSettings>(key: K): SiteSettings[K] => {
    const raw = get(SETTINGS_COOKIES[key]);
    const allowed = SETTING_VALUES[key] as readonly string[];
    return (raw && allowed.includes(raw) ? raw : DEFAULT_SETTINGS[key]) as SiteSettings[K];
  };
  return {
    theme: pick("theme"),
    shape: pick("shape"),
    size: pick("size"),
    icons: pick("icons"),
    base: pick("base"),
  };
}

/** The `document.cookie` assignment that stores one setting. */
export function settingCookie<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]): string {
  return `${SETTINGS_COOKIES[key]}=${value}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}
