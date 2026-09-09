import { componentList, systemList } from "@/lib/docs/components";
import { installUrl, DUAL_FLAVOR_SLUGS, type Base } from "@/lib/base-context";
import { PROMPT_ENTRIES, type PromptEntry } from "@/lib/docs/prompt-entries";

const SITE = "https://www.fluidfunctionalism.com";

interface BuildInstallPromptOptions {
  /** Doc page slug (matches `componentList` / `systemList`). */
  slug: string;
  /** Registry slug the install command advertises. Defaults to `slug`. */
  installSlug?: string;
  /** Currently selected primitive flavor. Picks the install URL and the
   *  flavor sentence. */
  base: Base;
}

/** Builds the text behind the "Copy prompt" button on every doc page: a
 *  self-contained brief a visitor pastes into an AI coding agent. It carries
 *  the install command, a usage snippet, the main props, a one-line
 *  description, and the docs URL, so the agent can wire the component in
 *  without fetching anything. Per-component usage and props live in
 *  `prompt-entries.ts`; everything else is derived. */
export function buildInstallPrompt({ slug, installSlug, base }: BuildInstallPromptOptions): string {
  const registrySlug = installSlug ?? slug;
  const system = systemList.find((c) => c.slug === slug);
  const entry = system ?? componentList.find((c) => c.slug === slug);
  const name = entry?.name ?? slug;
  // Site copy allows a spaced em dash in descriptions; the prompt does not.
  const description = (entry?.description ?? "").replace(/\s+\u2014\s+/g, ": ");
  const details: PromptEntry | undefined = PROMPT_ENTRIES[slug];
  const dual = DUAL_FLAVOR_SLUGS.has(registrySlug);

  const lines: string[] = [];
  lines.push(
    system
      ? `Add the ${name} system from Fluid Functionalism to my React app.`
      : `Add the ${name} component from Fluid Functionalism to my React app.`,
  );
  lines.push("");
  lines.push("Install (shadcn CLI, pulls the shared libs and npm dependencies on its own):");
  lines.push(`npx shadcn@latest add ${installUrl(registrySlug, base)}`);

  if (details?.usage) {
    lines.push("");
    lines.push("Usage:");
    lines.push(details.usage.trim());
  }

  if (details?.props?.length) {
    lines.push("");
    lines.push("Props:");
    for (const prop of details.props) lines.push(`- ${prop}`);
  }

  lines.push("");
  const about: string[] = [];
  if (description) about.push(stripTrailingPeriod(description) + ".");
  if (dual) {
    about.push(
      base === "base"
        ? `Base UI flavor. Same API on Radix: ${SITE}/r/${registrySlug}.json.`
        : `Radix flavor. Same API on Base UI: ${SITE}/r/base/${registrySlug}.json.`,
    );
  }
  if (details?.flavorNote) about.push(details.flavorNote);
  about.push(
    "Needs a shadcn-style project: Tailwind v4, the `@/` alias, and the Inter variable font loaded for the weight animations. Installed files land in components/ui, lib, and hooks. Compose with props and className rather than editing them.",
  );
  lines.push(about.join(" "));
  lines.push(`Docs: ${SITE}/docs/${slug}`);

  return lines.join("\n");
}

function stripTrailingPeriod(s: string): string {
  return s.replace(/[.\s]+$/, "");
}
