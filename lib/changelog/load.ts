import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ChangelogFormatError, parseRelease, releaseEntries, type Release } from "@/lib/changelog/parse";

// Server only: reads content/changelog/, for the page and /changelog.md at
// build, and for the root layout's sidebar dots.

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

let latestNewCache: string[] | null = null;

/** The doc slugs the latest release lists as New: the sidebar's dots. Read
 *  once per server in production, where release files only change with a
 *  deploy; every request in development, so an edited release shows. */
export function latestNewSlugs(dir = CHANGELOG_DIR): string[] {
  if (latestNewCache && process.env.NODE_ENV === "production") return latestNewCache;
  try {
    const latest = loadReleases(dir)[0];
    latestNewCache = latest
      ? releaseEntries(latest)
          .filter((e) => e.kind === "new" && e.href?.startsWith("/docs/"))
          .map((e) => e.href!.slice("/docs/".length))
      : [];
  } catch (error) {
    // Every route's layout calls this: a missing or malformed release
    // costs the sidebar its dots, never the page. tests/changelog.test.ts
    // still fails the build on a malformed file.
    console.error("[changelog] sidebar dots skipped:", error);
    return [];
  }
  return latestNewCache;
}
