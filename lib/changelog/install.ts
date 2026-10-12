import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ChangeEntry } from "@/lib/changelog/parse";

// Server only: what an entry installs, read from the repo at build time, so
// /changelog.md can tell an agent exactly what to re-install.

export type EntryInstall =
  /** A registry item, and whether it has a Base UI flavor at /r/base/. */
  | { kind: "item"; name: string; base: boolean }
  /** The agent skill, installed with `npx skills add`. */
  | { kind: "skill" }
  /** A change across every component. */
  | { kind: "all" }
  /** No single item: a docs-site feature, or a change the sentence spreads
   *  over several named components. */
  | { kind: "none" };

const ROOT = process.cwd();
const has = (...parts: string[]) => existsSync(join(ROOT, ...parts));

/** The registry name a doc page installs: the page's own `installSlug` when
 *  it sets one (Surfaces installs `elevated`), else the slug itself. */
function installNameForPage(slug: string): string {
  try {
    const page = readFileSync(join(ROOT, "app", "docs", slug, "page.tsx"), "utf8");
    return /installSlug="([a-z0-9-]+)"/.exec(page)?.[1] ?? slug;
  } catch {
    return slug;
  }
}

const item = (name: string): EntryInstall =>
  has("public", "r", `${name}.json`)
    ? { kind: "item", name, base: has("public", "r", "base", `${name}.json`) }
    : { kind: "none" };

export function entryInstall(entry: ChangeEntry): EntryInstall {
  const slug = entry.href ? /^\/docs\/([^/#]+)$/.exec(entry.href)?.[1] : undefined;
  if (slug === "skill") return { kind: "skill" };
  if (slug) return item(installNameForPage(slug));
  if (entry.href) return { kind: "none" };
  if (entry.name === "All components") return { kind: "all" };
  // A bold label naming one registry item (MobileDrawer → mobile-drawer).
  return item(entry.name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/\s+/g, "-").toLowerCase());
}
