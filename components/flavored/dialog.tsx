"use client";

import type { ComponentType, ReactNode } from "react";
import * as Base from "@/registry/base/dialog";
import * as Radix from "@/registry/radix/dialog";
import { flavored } from "@/components/flavored/flavored";

/** Root props shared by both flavors. */
interface FlavoredDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: ReactNode;
}

export const Dialog = flavored(
  Base.Dialog as unknown as ComponentType<FlavoredDialogProps>,
  Radix.Dialog as unknown as ComponentType<FlavoredDialogProps>,
  "Flavored(Dialog)"
);

// Both flavors accept `render` and `asChild` on their trigger/close, so
// they flavor-switch like any other part.
export const DialogTrigger = flavored(
  Base.DialogTrigger,
  Radix.DialogTrigger as unknown as typeof Base.DialogTrigger,
  "Flavored(DialogTrigger)"
);
export const DialogClose = flavored(
  Base.DialogClose,
  Radix.DialogClose as unknown as typeof Base.DialogClose,
  "Flavored(DialogClose)"
);

export const DialogContent = flavored(
  Base.DialogContent,
  Radix.DialogContent as unknown as typeof Base.DialogContent,
  "Flavored(DialogContent)"
);
export const DialogHeader = flavored(Base.DialogHeader, Radix.DialogHeader, "Flavored(DialogHeader)");
export const DialogFooter = flavored(Base.DialogFooter, Radix.DialogFooter, "Flavored(DialogFooter)");
export const DialogTitle = flavored(
  Base.DialogTitle,
  Radix.DialogTitle as unknown as typeof Base.DialogTitle,
  "Flavored(DialogTitle)"
);
export const DialogDescription = flavored(
  Base.DialogDescription,
  Radix.DialogDescription as unknown as typeof Base.DialogDescription,
  "Flavored(DialogDescription)"
);
