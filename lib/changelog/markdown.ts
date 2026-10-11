import { KIND_LABEL, type ChangeEntry, type ChangeRef, type Inline, type Release } from "@/lib/changelog/parse";
import { monthLabel } from "@/lib/changelog/migration-prompt";

// ---------------------------------------------------------------------------
// The whole changelog as one Markdown document, for agents and for anyone
// pasting it into one: served at /changelog.md, and behind the page's Copy
// as Markdown button. Built from the same parsed releases as the page, with
// every link absolute so the text stands on its own.
// ---------------------------------------------------------------------------

const SITE = "https://www.fluidfunctionalism.com";
const REPO = "https://github.com/mickadesign/fluid-functionalism";

function inline(parts: Inline[]): string {
  return parts.map((p) => (p.type === "code" ? `\`${p.value}\`` : p.value)).join("");
}

function ref(r: ChangeRef): string {
  return r.type === "pr" ? `[#${r.number}](${REPO}/pull/${r.number})` : `[${r.sha}](${REPO}/commit/${r.sha})`;
}

function entry(e: ChangeEntry): string {
  const label = e.href ? `[${e.name}](${SITE}${e.href})` : `**${e.name}**`;
  const lines = [`- ${label}: ${inline(e.text)} (${e.refs.map(ref).join(", ")})`];
  if (e.diff) {
    lines.push("", "  ```diff", ...e.diff.replace(/\n+$/, "").split("\n").map((l) => `  ${l}`), "  ```", "");
  }
  return lines.join("\n");
}

function day(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function releasesToMarkdown(releases: Release[]): string {
  const out: string[] = [
    "# Fluid Functionalism changelog",
    "",
    "Every change to Fluid Functionalism, a shadcn/ui registry of animated React components, month by month. A release lands on the first Friday of the next month.",
    "",
    `- Page: ${SITE}/changelog`,
    "- New: a component or system that just landed.",
    "- Breaking: an API change that needs a migration. Each one carries a diff of the call site, before and after.",
    "- Updated: a change to something already here.",
    `- Install or update a component: \`npx shadcn@latest add ${SITE}/r/<name>.json --overwrite\`, or \`${SITE}/r/base/<name>.json\` for the Base UI flavor.`,
  ];

  for (const release of releases) {
    out.push("", `## ${monthLabel(release.month)}`, "");
    if (release.released) out.push(`Released ${day(release.released)}.`, "");
    out.push(`Highlights: ${release.title}`);
    if (release.intro) out.push("", inline(release.intro));
    for (const group of release.groups) {
      out.push("", `### ${KIND_LABEL[group.kind]}`, "", ...group.entries.map(entry));
    }
  }

  return out.join("\n") + "\n";
}
