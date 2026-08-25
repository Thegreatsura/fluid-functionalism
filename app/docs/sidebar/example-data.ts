import type { IconName } from "@/lib/icon-context";

/**
 * Content for the Sidebar doc page's examples — one fictional AI product,
 * shown doing a different job in each section.
 *
 * Deliberately not in `app/components/demo-data.ts`: that file is shared with
 * the home bento and the /compare originals, which render the same copy
 * side by side to keep the comparison honest. This content is only ever a
 * sidebar, so it lives next to the page that draws it.
 *
 * The spread across sections is the point — an assistant's thread list, an
 * agent roster, retrieval sources and eval runs all want different parts of
 * the component, and a nav of Home / Inbox / Calendar shows none of it.
 */

export const AI_WORKSPACE = "Aurora AI";

/** Top-level product nav — the layout and collapse examples. Every row owns
 *  a sub-tree, so those examples show the shape of a real tree rather than a
 *  flat list; only the first is open, or five expanded rows would outrun the
 *  frame. Level-2 rows carry the counts, since a parent row spends its
 *  trailing slot on the chevron. */
export const AI_NAV: readonly {
  icon: IconName;
  label: string;
  children: readonly { label: string; badge?: string }[];
}[] = [
  {
    icon: "message-circle",
    label: "Chat",
    children: [
      { label: "Q3 board deck", badge: "12" },
      { label: "Postgres 16 plan", badge: "4" },
      { label: "Onboarding emails" },
    ],
  },
  {
    icon: "brain",
    label: "Agents",
    children: [
      { label: "Support triage", badge: "18" },
      { label: "Release notes" },
      { label: "SQL analyst" },
    ],
  },
  {
    icon: "square-library",
    label: "Knowledge",
    children: [
      { label: "Product docs", badge: "1.2k" },
      { label: "Support macros" },
      { label: "API reference" },
    ],
  },
  {
    icon: "play",
    label: "Runs",
    children: [
      { label: "In progress", badge: "3" },
      { label: "Completed" },
      { label: "Failed", badge: "1" },
    ],
  },
  {
    icon: "check",
    label: "Evals",
    children: [
      { label: "Refusal suite", badge: "98%" },
      { label: "Retrieval recall", badge: "91%" },
      { label: "Jailbreak probes" },
    ],
  },
];

/** Level 1 rows that own a level 2 sub-tree — the nesting example.
 *  Two branches so more than one can be open at once. */
export const AI_TREE: readonly {
  icon: IconName;
  label: string;
  children: readonly { icon: IconName; label: string }[];
}[] = [
  {
    icon: "brain",
    label: "Agents",
    children: [
      { icon: "inbox", label: "Support triage" },
      { icon: "pencil", label: "Release notes" },
      { icon: "search", label: "SQL analyst" },
    ],
  },
  {
    icon: "square-library",
    label: "Knowledge",
    children: [
      { icon: "globe", label: "Product docs" },
      { icon: "mail", label: "Support macros" },
      { icon: "link", label: "API reference" },
    ],
  },
];

/** Assistant threads for the status-dot treatment: `active` is the one
 *  streaming a reply, `unread` finished while you were away, `idle` is
 *  everything else. Every thread carries a badge — they count turns. */
export const AI_THREADS: readonly {
  label: string;
  status: "active" | "unread" | "idle";
  badge: string;
}[] = [
  { label: "Summarise the Q3 board deck", status: "active", badge: "12" },
  { label: "Migration plan for Postgres 16", status: "unread", badge: "4" },
  { label: "Why does retrieval miss the changelog?", status: "idle", badge: "6" },
  { label: "Rewrite the onboarding emails", status: "idle", badge: "8" },
  { label: "Debug the eval harness timeout", status: "unread", badge: "9" },
  { label: "Draft the launch announcement", status: "idle", badge: "5" },
  { label: "Compare embedding models", status: "idle", badge: "3" },
];

export const AI_CALLOUT = {
  title: "Aurora 2 is here",
  media: "Longer context, faster agents",
  icon: "See what changed",
} as const;
