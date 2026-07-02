"use client";

import * as Base from "@/registry/base/select";
import * as Radix from "@/registry/radix/select";
import { flavored } from "@/components/flavored/flavored";

export const Select = flavored(Base.Select, Radix.Select, "Flavored(Select)");
export const SelectTrigger = flavored(
  Base.SelectTrigger,
  Radix.SelectTrigger,
  "Flavored(SelectTrigger)"
);
export const SelectContent = flavored(
  Base.SelectContent,
  Radix.SelectContent,
  "Flavored(SelectContent)"
);
export const SelectItem = flavored(
  Base.SelectItem,
  Radix.SelectItem,
  "Flavored(SelectItem)"
);
export const SelectGroup = flavored(
  Base.SelectGroup,
  Radix.SelectGroup,
  "Flavored(SelectGroup)"
);
export const SelectLabel = flavored(
  Base.SelectLabel,
  Radix.SelectLabel,
  "Flavored(SelectLabel)"
);
export const SelectSeparator = flavored(
  Base.SelectSeparator,
  Radix.SelectSeparator,
  "Flavored(SelectSeparator)"
);

// The cva instance and prop types are flavor-identical; re-export from Base.
export { triggerVariants } from "@/registry/base/select";
export type {
  SelectProps,
  SelectTriggerProps,
  SelectContentProps,
  SelectItemProps,
} from "@/registry/base/select";
