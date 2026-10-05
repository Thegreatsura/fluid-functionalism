"use client";

import { track } from "@vercel/analytics";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { SkillExamples } from "./hero";
import { Timeline } from "./timeline";

/** Installation: a prompt rather than the bare command, so the agent goes
 *  on to run the skill once on the project. It names the skill, so an agent
 *  that already has it skips the install. Global (-g) keeps the skill out of
 *  the user's repo; -y skips the CLI's prompts, which an agent shell can't
 *  answer. */
const INSTALL_PROMPT =
  "Install the fluid-functionalism skill with `npx skills add mickadesign/fluid-functionalism -g -y` (skip this if you already have it). Then read its SKILL.md and use it to audit this project.";

/** What it does: 1 line per job. The detail lives in SKILL.md. */
const JOBS: Array<{ title: string; body: string }> = [
  { title: "Read your stack", body: "To understand your project." },
  { title: "Suggests 2 to 5 upgrades", body: "Ranked by what your users will notice." },
  { title: "Aligns your UI", body: "Installs what fits, matches the rest." },
];

export default function FluidSkillDoc() {
  return (
    <DocPage
      title="/fluid-functionalism skill"
      slug="skill"
      installNote="One prompt for your coding agent: it installs the skill, then audits your project with it."
      installPrompt={INSTALL_PROMPT}
      onInstallCopy={() => track("Skill install copied", { method: "prompt" })}
      description="Gives your coding agent the components and the craft behind them, then puts both to work on your project."
    >
      <DocSection title="What it does">
        <Timeline steps={JOBS} />
      </DocSection>

      <DocSection title="What it knows">
        <p className="text-site-body text-muted-foreground">
          The craft behind every component, distilled from its implementation and
          code comments: exact values, interaction rules, edge cases, and why each
          detail matters. Once the FF components are in place, your agent uses this
          knowledge to apply the final layer of craft to your interface, from
          spacing and alignment to motion and feedback.
        </p>
      </DocSection>

      <SkillExamples />
    </DocPage>
  );
}
