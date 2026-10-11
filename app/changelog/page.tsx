import type { Metadata } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadReleases } from "@/lib/changelog/load";
import { highlightDiff } from "@/lib/docs/highlight";
import { ChangelogView, type ReleaseView } from "@/app/changelog/changelog-view";

const DESCRIPTION = "Every change to Fluid Functionalism, month by month. A release lands on the first Friday.";

export const metadata: Metadata = {
  title: "Changelog · Fluid Functionalism",
  description: DESCRIPTION,
  // Agents find the Markdown version from the page's <head>.
  alternates: { canonical: "/changelog", types: { "text/markdown": "/changelog.md" } },
  openGraph: { title: "Changelog · Fluid Functionalism", description: DESCRIPTION },
};

/** The registry item a doc page installs, when it installs one under its own
 *  name. The migration prompt re-installs it; anything else gets the
 *  generic "re-install what you use" step. */
function installSlugFor(href: string | null): string | null {
  const slug = href ? /^\/docs\/([^/#]+)$/.exec(href)?.[1] : undefined;
  if (!slug) return null;
  return existsSync(join(process.cwd(), "public", "r", `${slug}.json`)) ? slug : null;
}

export default async function ChangelogPage() {
  const releases: ReleaseView[] = await Promise.all(
    loadReleases().map(async (release) => ({
      ...release,
      groups: await Promise.all(
        release.groups.map(async (group) => ({
          ...group,
          entries: await Promise.all(
            group.entries.map(async (entry, i) => ({
              ...entry,
              id: `${release.month}-${group.kind}-${i}`,
              diffHtml: entry.diff ? await highlightDiff(entry.diff) : null,
              installSlug: installSlugFor(entry.href),
            }))
          ),
        }))
      ),
    }))
  );

  return (
    <div className="py-20 sm:py-28 w-full max-w-[680px] mx-auto mt-12 lg:mt-0">
      <ChangelogView releases={releases} />
    </div>
  );
}
