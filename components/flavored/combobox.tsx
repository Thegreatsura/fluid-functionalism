"use client";

import * as Base from "@/registry/base/combobox";
import * as Radix from "@/registry/radix/combobox";
import { flavored } from "@/components/flavored/flavored";

export const Combobox = flavored(
  Base.Combobox,
  Radix.Combobox,
  "Flavored(Combobox)"
);
export const ComboboxInput = flavored(
  Base.ComboboxInput,
  Radix.ComboboxInput,
  "Flavored(ComboboxInput)"
);
export const ComboboxChips = flavored(
  Base.ComboboxChips,
  Radix.ComboboxChips,
  "Flavored(ComboboxChips)"
);
export const ComboboxContent = flavored(
  Base.ComboboxContent,
  // Structurally identical public props; only the side/align unions differ
  // (Base UI accepts a few extra logical values).
  Radix.ComboboxContent as unknown as typeof Base.ComboboxContent,
  "Flavored(ComboboxContent)"
);
export const ComboboxList = flavored(
  Base.ComboboxList,
  Radix.ComboboxList,
  "Flavored(ComboboxList)"
);
export const ComboboxItem = flavored(
  Base.ComboboxItem,
  Radix.ComboboxItem,
  "Flavored(ComboboxItem)"
);
export const ComboboxEmpty = flavored(
  Base.ComboboxEmpty,
  Radix.ComboboxEmpty,
  "Flavored(ComboboxEmpty)"
);

// The cva instance and prop types are flavor-identical; re-export from Base.
export { comboboxFieldVariants } from "@/registry/base/combobox";
export type {
  ComboboxItemData,
  ComboboxProps,
  ComboboxInputProps,
  ComboboxChipsProps,
  ComboboxValue,
  ComboboxContentProps,
  ComboboxListProps,
  ComboboxItemProps,
  ComboboxEmptyProps,
} from "@/registry/base/combobox";
