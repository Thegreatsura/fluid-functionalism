import { componentList, plainDescription, skillEntry, systemList } from "@/lib/docs/components";

// /llms.txt: the site's front door for agents (https://llmstxt.org). Built
// from the same lists as the sidebar, so it can't drift from the docs.

const SITE = "https://www.fluidfunctionalism.com";

export function buildLlmsTxt(): string {
  const link = (name: string, slug: string, description: string) =>
    `- [${name}](${SITE}/docs/${slug}): ${plainDescription(description)}`;
  return [
    "# Fluid Functionalism",
    "",
    "> A shadcn/ui registry of animated React components with one motion system: three spring speeds, a hover highlight that glides to the item nearest the cursor, and labels that change weight without layout shift. Components that touch a primitive ship in 2 flavors, Radix and Base UI, with the same API.",
    "",
    `Install an item with \`npx shadcn@latest add ${SITE}/r/<name>.json --overwrite\`, or \`${SITE}/r/base/<name>.json\` for the Base UI flavor. Each docs page has a Copy prompt: a self-contained brief with the install command, usage, and props.`,
    "",
    "## Start here",
    "",
    `- [Introduction](${SITE}/docs): why the components feel the way they do.`,
    `- [Agent skill](${SITE}/docs/skill): \`npx skills add mickadesign/fluid-functionalism\` gives a coding agent the catalog, the craft behind each component, and an upgrade workflow for projects that already use them.`,
    `- [Changelog](${SITE}/changelog.md): every change, month by month, with an install URL per entry and migration steps for breaking changes.`,
    `- [Registry index](${SITE}/r/registry.json): every item and its files.`,
    "",
    "## Systems",
    "",
    ...[...systemList, skillEntry].map((s) => link(s.name, s.slug, s.description)),
    "",
    "## Components",
    "",
    ...componentList.map((c) => link(c.name, c.slug, c.description)),
    "",
  ].join("\n");
}
