import { installUrl, type Base } from "@/lib/base-context";
import { OVERWRITE_NOTE } from "@/lib/docs/install-prompt";
import type { ChangeEntry, Inline } from "@/lib/changelog/parse";

const SITE = "https://www.fluidfunctionalism.com";

export function inlineToText(inline: Inline[]): string {
  return inline.map((part) => (part.type === "code" ? `\`${part.value}\`` : part.value)).join("");
}

export function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface BuildMigrationPromptOptions {
  entry: ChangeEntry;
  month: string;
  /** The registry item to re-install, or null when the page has none of its
   *  own (a system page that installs under another name, a change that
   *  spans many components). */
  installSlug: string | null;
  base: Base;
}

/** The text behind a Breaking entry's "Copy migration prompt": a brief an
 *  AI coding agent can act on without opening the changelog. It re-installs
 *  the component, then rewrites call sites from the diff's `-` lines to its
 *  `+` lines. */
export function buildMigrationPrompt({ entry, month, installSlug, base }: BuildMigrationPromptOptions): string {
  const lines: string[] = [];
  lines.push(
    `Migrate my React app to the ${monthLabel(month)} release of ${entry.name} from Fluid Functionalism. It has a breaking change.`,
  );
  lines.push("");
  lines.push(`What changed: ${inlineToText(entry.text)}`);
  lines.push("");
  if (installSlug) {
    lines.push("1. Re-install it (shadcn CLI):");
    lines.push(`npx shadcn@latest add ${installUrl(installSlug, base)} --overwrite`);
  } else {
    lines.push(
      "1. Re-install every Fluid Functionalism component this project uses, with the shadcn CLI and --overwrite, from the same URLs they came from (https://www.fluidfunctionalism.com/r/<name>.json, or /r/base/<name>.json for the Base UI flavor).",
    );
  }
  lines.push(OVERWRITE_NOTE);
  lines.push("");
  lines.push(
    "2. Find every call site that matches the - lines below and rewrite it to the + lines. Leave everything else as it is, then run the type checker.",
  );
  lines.push("```diff");
  lines.push(entry.diff?.replace(/\n+$/, "") ?? "");
  lines.push("```");
  lines.push("");
  lines.push(`Changelog: ${SITE}/changelog#${month}`);
  if (entry.href) lines.push(`Docs: ${SITE}${entry.href}`);
  return lines.join("\n");
}
