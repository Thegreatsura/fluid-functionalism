import type { ChangeKind } from "@/lib/changelog/parse";

/** One color per kind, shared by the changelog's entry dots and the
 *  sidebar's: blue for New, gray for Updated, red for Breaking. */
export const KIND_DOT: Record<ChangeKind, string> = {
  new: "bg-[var(--info)]",
  updated: "bg-muted-foreground",
  breaking: "bg-[var(--destructive)]",
};
