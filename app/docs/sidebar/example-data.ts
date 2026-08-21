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

/** Top-level product nav — the layout and collapse examples. */
export const AI_NAV: readonly {
  icon: IconName;
  label: string;
  badge?: string;
  active?: boolean;
}[] = [
  { icon: "message-circle", label: "Chat", active: true },
  { icon: "brain", label: "Agents", badge: "4" },
  { icon: "square-library", label: "Knowledge", badge: "12" },
  { icon: "play", label: "Runs", badge: "3" },
  { icon: "check", label: "Evals" },
];

/** Level 1 rows that own a level 2 sub-tree — the nesting example.
 *  Two branches so more than one can be open at once. */
export const AI_TREE: readonly {
  icon: IconName;
  label: string;
  children: readonly { icon: IconName; label: string; badge?: string }[];
}[] = [
  {
    icon: "brain",
    label: "Agents",
    children: [
      { icon: "inbox", label: "Support triage", badge: "18" },
      { icon: "pencil", label: "Release notes" },
      { icon: "search", label: "SQL analyst" },
    ],
  },
  {
    icon: "square-library",
    label: "Knowledge",
    children: [
      { icon: "globe", label: "Product docs", badge: "1.2k" },
      { icon: "mail", label: "Support macros" },
      { icon: "link", label: "API reference" },
    ],
  },
];

/** Assistant threads for the status-dot treatment: `active` is the one
 *  streaming a reply, `unread` finished while you were away, `idle` is
 *  everything else. Badges count turns. */
export const AI_THREADS: readonly {
  label: string;
  status: "active" | "unread" | "idle";
  badge?: string;
}[] = [
  { label: "Summarise the Q3 board deck", status: "active", badge: "12" },
  { label: "Migration plan for Postgres 16", status: "unread", badge: "4" },
  { label: "Why does retrieval miss the changelog?", status: "idle" },
  { label: "Rewrite the onboarding emails", status: "idle", badge: "8" },
];

/** Eval runs — rows whose trailing slot is a result, not a count. */
export const AI_RUNS: readonly {
  icon: IconName;
  label: string;
  badge: string;
}[] = [
  { icon: "check", label: "Refusal suite", badge: "98%" },
  { icon: "rotate-ccw", label: "Retrieval recall", badge: "91%" },
  { icon: "shield", label: "Jailbreak probes", badge: "12" },
];

/** Sources a retrieval agent is indexing — the skeleton example's payload,
 *  so the loading state stands for something that really is slow. */
export const AI_SOURCES: readonly { icon: IconName; label: string }[] = [
  { icon: "globe", label: "docs.aurora.ai" },
  { icon: "folder", label: "Notion — Handbook" },
  { icon: "mail", label: "Support inbox" },
  { icon: "square-library", label: "Zendesk macros" },
];

export const AI_CALLOUT = {
  title: "Aurora 2 is here",
  media: "Longer context, faster agents",
  icon: "See what changed",
} as const;
