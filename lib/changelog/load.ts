import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ChangelogFormatError, parseRelease, type Release } from "@/lib/changelog/parse";

// Server only: reads content/changelog/ at build time.

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
