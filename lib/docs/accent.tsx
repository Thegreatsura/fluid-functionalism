"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  ACCENT_ORDER,
  ACCENT_PRESETS,
  accentHex,
  presetForHex,
  type AccentPreset,
} from "@/lib/accent";
import { customAccentCookie } from "@/lib/docs/site-settings";
import { showShortcutToast } from "@/lib/docs/settings-toast";

interface AccentContextValue {
  /** The preset: the starter setting, kept even under a custom color. */
  preset: AccentPreset;
  /** The visitor's own color (6-digit hex), overriding the preset. */
  custom: string | null;
  /** The color on screen. */
  hex: string;
  /** Picks a preset and drops any custom color. */
  setPreset: (preset: AccentPreset) => void;
  /** Takes any 6-digit hex: a preset's hex selects that preset. */
  setColor: (hex: string) => void;
}

const AccentContext = createContext<AccentContextValue | null>(null);

/**
 * Docs-site-only: the accent (--fluid-accent) behind every focus ring and
 * accented detail, set from the right panel or A. The preset is a "Make them
 * yours" setting (SettingsPersistence writes its cookie); a custom color has
 * its own cookie, written here. Either way the color lands inline on
 * <html>, which the root layout also renders, so the first paint has it.
 */
export function AccentProvider({
  defaultPreset,
  defaultCustom,
  children,
}: {
  defaultPreset: AccentPreset;
  defaultCustom: string | null;
  children: ReactNode;
}) {
  const [preset, setPresetState] = useState(defaultPreset);
  const [custom, setCustom] = useState(defaultCustom);
  const hex = accentHex(preset, custom);

  useEffect(() => {
    document.documentElement.style.setProperty("--fluid-accent", hex);
  }, [hex]);

  const setPreset = useCallback((next: AccentPreset) => {
    setPresetState(next);
    setCustom(null);
    document.cookie = customAccentCookie(null);
  }, []);

  const setColor = useCallback(
    (next: string) => {
      const match = presetForHex(next);
      if (match) {
        setPreset(match);
        return;
      }
      const upper = next.toUpperCase();
      setCustom(upper);
      document.cookie = customAccentCookie(upper);
    },
    [setPreset]
  );

  const value = useMemo(
    () => ({ preset, custom, hex, setPreset, setColor }),
    [preset, custom, hex, setPreset, setColor]
  );

  return <AccentContext.Provider value={value}>{children}</AccentContext.Provider>;
}

export function useAccent(): AccentContextValue {
  const ctx = useContext(AccentContext);
  if (!ctx) throw new Error("useAccent must be used inside AccentProvider");
  return ctx;
}

/**
 * Docs-site-only global shortcut: A cycles the accent presets (from blue
 * when a custom color is on) and toasts the result. Same guards as the other
 * settings shortcuts.
 */
export function AccentShortcut() {
  const { preset, custom, setPreset } = useAccent();
  // Read at keypress time, so quick presses each advance one step.
  const currentRef = useRef<AccentPreset | null>(custom ? null : preset);
  useEffect(() => {
    currentRef.current = custom ? null : preset;
  }, [preset, custom]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "a" && e.key !== "A") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      if (target?.closest('[role="listbox"], [role="menu"], [role="dialog"], [role="combobox"], [role="option"]')) return;
      e.preventDefault();
      const current = currentRef.current;
      const next = current === null ? ACCENT_ORDER[0] : ACCENT_ORDER[(ACCENT_ORDER.indexOf(current) + 1) % ACCENT_ORDER.length];
      currentRef.current = next;
      setPreset(next);
      showShortcutToast("A", `Accent set to ${ACCENT_PRESETS[next].label}`);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setPreset]);

  return null;
}
