"use client";

import type { ComponentType, ReactElement } from "react";
import * as Base from "@/registry/base/dropdown";
import * as Radix from "@/registry/radix/dropdown";
import { flavored } from "@/components/flavored/flavored";
import { useBase } from "@/lib/base-context";

export const Dropdown = flavored(
  Base.Dropdown,
  Radix.Dropdown,
  "Flavored(Dropdown)"
);
export const DropdownLabel = flavored(
  Base.DropdownLabel,
  Radix.DropdownLabel,
  "Flavored(DropdownLabel)"
);
export const DropdownSeparator = flavored(
  Base.DropdownSeparator,
  Radix.DropdownSeparator,
  "Flavored(DropdownSeparator)"
);
export const DropdownMenu = flavored(
  Base.DropdownMenu,
  Radix.DropdownMenu,
  "Flavored(DropdownMenu)"
);

/** The site only composes triggers via `render`, so the flavored wrapper
 *  narrows both flavors' trigger props (Base UI's MenuTriggerProps / the
 *  Radix flavor's button props) to that shared surface. */
interface FlavoredDropdownTriggerProps {
  render?: ReactElement;
  className?: string;
}
export const DropdownTrigger = flavored(
  Base.DropdownTrigger as unknown as ComponentType<FlavoredDropdownTriggerProps>,
  Radix.DropdownTrigger as unknown as ComponentType<FlavoredDropdownTriggerProps>,
  "Flavored(DropdownTrigger)"
);

export const DropdownContent = flavored(
  Base.DropdownContent,
  // Structurally identical public props; only the side/align unions differ
  // (Base UI accepts a few extra logical values).
  Radix.DropdownContent as unknown as typeof Base.DropdownContent,
  "Flavored(DropdownContent)"
);

/** Flavor-aware useDropdown. Both flavors keep their own DropdownContext, so
 *  this probes each null-safely (hooks must run unconditionally) and returns
 *  the one matching the active flavor — under which the flavored Dropdown /
 *  DropdownContent above actually rendered its provider. */
export function useDropdown(): Base.DropdownContextValue {
  const { base } = useBase();
  const baseCtx = Base.useDropdownMaybe();
  const radixCtx = Radix.useDropdownMaybe();
  const ctx = base === "base" ? baseCtx : radixCtx;
  if (!ctx) throw new Error("useDropdown must be used within a Dropdown");
  return ctx;
}

export type {
  DropdownProps,
  DropdownMenuProps,
  DropdownContentProps,
  DropdownContextValue,
  MenuItemRenderOptions,
} from "@/registry/base/dropdown";

export default Dropdown;
