import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ChangelogFormatError, parseRelease, releaseEntries, type ChangeKind, type Release } from "@/lib/changelog/parse";
import type { ReleaseMarks } from "@/lib/changelog/marks";

// Server only: reads content/changelog/, for the page and /changelog.md at
// build, and for the root layout's New and Updated markers.

export const CHANGELOG_DIR = join(process.cwd(), "content", "changelog");
const FILE = /^(\d{4}-\d{2})\.md$/;

/** Every release, newest month first. Throws on a malformed file. */
export function loadReleases(dir = CHANGELOG_DIR): Release[] {
  return readdirSync(dir)
    .filter((name) => FILE.test(name))
    .sort()
    .reverse()
    .map((name) => {
      const release = parseRelease(readFileSync(join(dir, name), "utf8"), `content/changelog/${name}`);
      if (release.month !== FILE.exec(name)![1]) {
        throw new ChangelogFormatError(`content/changelog/${name}`, 2, "`month` does not match the file name");
      }
      return release;
    });
}

let marksCache: ReleaseMarks | null = null;

/** The doc slugs the latest release marks: New for its New entries, Updated
 *  for its Updated and Breaking ones. The sidebar dots the New ones, and the
 *  Showcase, ⌘K, /demo and /compare label both, so every marker on the site
 *  moves on with each release. Read once per server in production, where
 *  release files only change with a deploy; every request in development,
 *  so an edited release shows. */
export function latestMarks(dir = CHANGELOG_DIR): ReleaseMarks {
  if (marksCache && process.env.NODE_ENV === "production") return marksCache;
  let marks: ReleaseMarks = { new: [], updated: [] };
  try {
    const latest = loadReleases(dir)[0];
    if (latest) {
      const slugs = (kinds: ChangeKind[]) =>
        releaseEntries(latest)
          .filter((e) => kinds.includes(e.kind))
          .map((e) => (e.href ? /^\/docs\/([^/#?]+)/.exec(e.href)?.[1] : undefined))
          .filter((slug): slug is string => !!slug);
      const added = slugs(["new"]);
      marks = { new: added, updated: slugs(["updated", "breaking"]).filter((s) => !added.includes(s)) };
    }
  } catch (error) {
    // Every route's layout calls this: a missing or malformed release
    // costs the site its markers, never the page, and logs once per server.
    // tests/changelog.test.ts still fails the build on a malformed file.
    console.error("[changelog] New and Updated markers skipped:", error);
  }
  marksCache = marks;
  return marks;
}
