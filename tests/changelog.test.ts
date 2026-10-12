import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseRelease, releaseEntries, type Inline } from "@/lib/changelog/parse";
import { releasesToMarkdown } from "@/lib/changelog/markdown";
import { SHOWCASE_PREVIEW_SLUGS } from "@/app/changelog/previews";
import { componentList, systemNavList } from "@/lib/docs/components";

// The release files in content/changelog/ follow changelog-guidelines.md.
// The parser already rejects anything off-format; these checks cover what it
// cannot see from one file: links that resolve, months in order.

const root = join(__dirname, "..");
const docSlugs = new Set([...componentList, ...systemNavList].map((e) => e.slug));

function routeExists(href: string): boolean {
  const path = href.split("#")[0].replace(/\/$/, "");
  const docs = /^\/docs\/([^/]+)$/.exec(path);
  if (docs) return docSlugs.has(docs[1]);
  return existsSync(join(root, "app", path, "page.tsx"));
}

// The checkable half of tone-of-voice.md's Changelog variant. A code span
// counts as 1 word, so a long prop value doesn't eat the budget.
const BANNED = /\b(now|we|our|has been|have been|is renamed|are renamed|seamless|powerful|robust|beautiful)\b/i;

function voiceProblems(inline: Inline[], maxSentences: number): string[] {
  const flat = inline.map((p) => (p.type === "code" ? "\u00a7" : p.value)).join("");
  const sentences = flat.split(/(?<=[.!?])\s+(?=[A-Z0-9\u00a7])/).filter(Boolean);
  const problems: string[] = [];
  if (sentences.length > maxSentences) problems.push(`${sentences.length} sentences`);
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter(Boolean).length;
    const codes = (sentence.match(/\u00a7/g) ?? []).length;
    if (words > 25) problems.push(`${words} words: "${sentence.slice(0, 40)}..."`);
    if (codes > 3) problems.push(`${codes} code spans: "${sentence.slice(0, 40)}..."`);
  }
  const banned = BANNED.exec(flat);
  if (banned) problems.push(`"${banned[0]}"`);
  return problems;
}

// One test per file, so a malformed month names itself instead of stopping
// the whole suite at collection time.
const dir = join(root, "content", "changelog");
const files = readdirSync(dir).filter((name) => /^\d{4}-\d{2}\.md$/.test(name)).sort().reverse();

describe("changelog releases", () => {
  it("has at least one release, every file named after its month", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s follows the format, links to pages that exist, lists each label once per kind, A to Z", (name) => {
    const release = parseRelease(readFileSync(join(dir, name), "utf8"), `content/changelog/${name}`);
    expect(release.month).toBe(name.slice(0, 7));
    for (const entry of releaseEntries(release)) {
      if (entry.href) expect(routeExists(entry.href), `${entry.name} -> ${entry.href}`).toBe(true);
    }
    for (const group of release.groups) {
      const names = group.entries.map((e) => e.name);
      expect(new Set(names).size, `${group.kind}: ${names.join(", ")}`).toBe(names.length);
      // Linked labels A to Z, then bold labels A to Z.
      const sorted = [...group.entries]
        .sort((a, b) => Number(a.href === null) - Number(b.href === null) || a.name.localeCompare(b.name))
        .map((e) => e.name);
      expect(names, `${group.kind} order`).toEqual(sorted);
    }
  });

  it.each(files)("%s follows the changelog voice", (name) => {
    const release = parseRelease(readFileSync(join(dir, name), "utf8"), `content/changelog/${name}`);
    const problems = releaseEntries(release).flatMap((entry) =>
      voiceProblems(entry.text, 2).map((problem) => `${entry.kind} ${entry.name}: ${problem}`)
    );
    if (release.intro) problems.push(...voiceProblems(release.intro, 1).map((p) => `intro: ${p}`));
    expect(problems).toEqual([]);
  });
});

describe("lazy previews", () => {
  it("lists exactly the slugs the Showcase's previewMap covers", () => {
    const source = readFileSync(join(root, "app", "components", "bento-previews.tsx"), "utf8");
    const map = /export const previewMap[^{]*\{([\s\S]*?)\n\};/.exec(source)?.[1] ?? "";
    const keys = [...map.matchAll(/^\s+"?([a-z-]+)"?:/gm)].map((m) => m[1]).sort();
    expect(keys.length).toBeGreaterThan(0);
    expect([...SHOWCASE_PREVIEW_SLUGS].sort()).toEqual(keys);
  });
});

describe("/changelog.md", () => {
  const releases = files.map((name) => parseRelease(readFileSync(join(dir, name), "utf8"), name));
  const md = releasesToMarkdown(releases);

  it("carries every month and every entry, with absolute links only", () => {
    for (const release of releases) {
      expect(md).toContain(`Highlights: ${release.title}`);
      for (const entry of releaseEntries(release)) expect(md).toContain(entry.name);
    }
    expect(md).not.toMatch(/\]\(\//);
    expect(md).not.toContain("\u2014");
  });

  it("keeps each Breaking diff", () => {
    for (const entry of releases.flatMap(releaseEntries)) {
      if (entry.diff) expect(md).toContain(entry.diff.split("\n")[0]);
    }
  });
});

describe("parseRelease", () => {
  const valid = `---
month: 2026-07
released: 2026-08-07
title: Springs, Select
---

One line about the month.

## Breaking

- [Motion](/docs/motion): The \`settle\` tier is gone, use \`slow\`. (#18)

  \`\`\`diff
  - transition={spring.settle}
  + transition={spring.slow}
  \`\`\`

## Updated

- [Select](/docs/select): The highlight stops sliding on reopen. (#22, #23)
- **All components**: Installs pass the lint. (a28dd34)
`;

  it("reads a release into data", () => {
    const release = parseRelease(valid);
    expect(release.month).toBe("2026-07");
    expect(release.released).toBe("2026-08-07");
    expect(release.intro).toEqual([{ type: "text", value: "One line about the month." }]);
    expect(release.groups.map((g) => g.kind)).toEqual(["breaking", "updated"]);
    const [breaking] = release.groups[0].entries;
    expect(breaking.text).toEqual([
      { type: "text", value: "The " },
      { type: "code", value: "settle" },
      { type: "text", value: " tier is gone, use " },
      { type: "code", value: "slow" },
      { type: "text", value: "." },
    ]);
    expect(breaking.diff).toContain("spring.settle");
    const [select, all] = release.groups[1].entries;
    expect(select.refs).toEqual([
      { type: "pr", number: 22 },
      { type: "pr", number: 23 },
    ]);
    expect(all.href).toBeNull();
    expect(all.refs).toEqual([{ type: "commit", sha: "a28dd34" }]);
  });

  const broken: Array<[string, string, RegExp]> = [
    ["an em dash", valid.replace("One line", "One line — about"), /em dash/],
    ["an unknown section", valid.replace("## Updated", "## Fixed"), /unknown section/],
    ["sections out of order", `${valid}\n## New\n\n- [Badge](/docs/badge): A late section. (#1)\n`, /New, Breaking, Updated/],
    ["a Breaking entry with no diff", valid.replace(/ {2}```diff[\s\S]*?```\n/, ""), /needs a ```diff block/],
    ["missing refs", valid.replace(" (#22, #23)", ""), /ends with its refs/],
    ["a bad ref", valid.replace("#22", "PR22"), /is not a PR/],
    ["more than 3 refs", valid.replace("(#22, #23)", "(#22, #23, #24, #25)"), /3 refs at most/],
    ["a missing period", valid.replace("on reopen. (#22", "on reopen (#22"), /ends with a period/],
    ["an external label link", valid.replace("(/docs/select)", "(https://example.com)"), /use a site route/],
    ["a link inside the sentence", valid.replace("stops sliding", "stops [sliding](/x)"), /only plain text and inline code/],
    ["a long title", valid.replace("Springs, Select", "x".repeat(61)), /60 characters/],
    ["a title with and", valid.replace("Springs, Select", "Springs and Select"), /"and"/],
    ["an early release date", valid.replace("2026-08-07", "2026-07-31"), /before the month ended/],
    ["an unknown frontmatter key", valid.replace("title:", "author: me\ntitle:"), /unknown frontmatter key/],
  ];

  it.each(broken)("rejects %s", (_, source, message) => {
    expect(() => parseRelease(source)).toThrow(message);
  });
});
