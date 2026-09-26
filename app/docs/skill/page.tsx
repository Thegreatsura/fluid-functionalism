"use client";

import { useEffect, useState, type ReactNode } from "react";
import { track } from "@vercel/analytics";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { InputCopy } from "@/registry/default/input-copy";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { SkillHero } from "./hero";

const SKILLS_SH_URL = "https://skills.sh/mickadesign/fluid-functionalism/fluid-functionalism";
const INSTALL_COMMAND = "npx skills add mickadesign/fluid-functionalism";

/** What it does: 1 line per job. The detail lives in SKILL.md. */
const JOBS: Array<{ title: string; body: string }> = [
  { title: "Reads your stack once", body: "Flavor, requirements, and 2 silent quality killers, saved for every later run." },
  { title: "Suggests 2 to 5 upgrades", body: "Ranked by impact and effort, systems before components." },
  { title: "Installs the right piece", body: "Right name, right flavor. Files you customized survive." },
  { title: "Writes motion that matches", body: "Your own lists and cards get the same springs and fluid hover." },
  { title: "Reviews the motion you have", body: "Hand-written durations, per-row hover, weight that shifts layout." },
];

/** What it knows: the skill's 4 references, in the order an agent meets
 *  them. Counts match skills/fluid-functionalism/references/. */
const REFERENCES: Array<{ file: string; body: string }> = [
  { file: "stack-audit.md", body: "The first-run checklist and how to rank upgrades." },
  { file: "components.md", body: "Every component, system, and block, with its install name and flavors." },
  { file: "craft.md", body: "Exact values, edge cases, and reasons for 5 systems, 27 components, and 3 blocks." },
  { file: "custom-motion.md", body: "7 recipes for motion you write yourself." },
];

/** 4 bullets lifted from references/craft.md, rewritten for the reader. */
const CRAFT_SAMPLES = [
  "Select holds its popup open 300ms after a pick, so you see the checkmark draw in.",
  "Button shrinks exactly 1px per side when pressed, at any width. A 2% scale would take 8px off a 400px button.",
  "Dialog enters on a 0.24s spring and leaves on a 0.16s tween, so closing reads final.",
  "Neighboring tooltips open instantly, but only under 1 shared TooltipProvider.",
];

/** Try it: prompts to paste as-is. Each names the skill so it triggers. */
const PROMPTS = [
  "Audit this project with the fluid-functionalism skill",
  "Add a settings dialog with a sidebar from Fluid Functionalism",
  "Replace our dropdowns with the Fluid Functionalism ones",
  "Make this list hover like the Fluid Functionalism menus",
  "Review the motion in this app against the fluid-functionalism skill",
];

function Row({ title, children, mono }: { title: string; children: ReactNode; mono?: boolean }) {
  return (
    <li className="flex flex-col gap-1">
      {mono ? (
        <code className="self-start rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-caption text-foreground">
          {title}
        </code>
      ) : (
        <span className="text-body text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
          {title}
        </span>
      )}
      <p className="text-body leading-relaxed text-muted-foreground">{children}</p>
    </li>
  );
}

/** A step on the What it does timeline: a dot level with the title, and a
 *  line down to the next dot that stops 4px short of both. */
function TimelineItem({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="group relative pb-4 pl-6 last:pb-0">
      <span
        aria-hidden
        className="absolute left-0 top-[9px] size-2 rounded-full bg-muted-foreground/50"
      />
      <span
        aria-hidden
        className="absolute -bottom-[5px] left-[3.5px] top-[21px] w-px bg-border group-last:hidden"
      />
      <span className="text-body text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
        {title}
      </span>
      <p className="mt-1 text-body leading-relaxed text-muted-foreground">{children}</p>
    </li>
  );
}

/** Live install count from skills.sh, via our cached route. Renders nothing
 *  until a number arrives, so a failed lookup never shows a wrong zero. */
function InstallCount() {
  const [installs, setInstalls] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/skill-installs")
      .then((res) => res.json())
      .then((data: { installs: number | null }) => {
        if (!cancelled && typeof data.installs === "number") setInstalls(data.installs);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (installs === null) return null;
  return (
    <p className="text-caption text-muted-foreground">
      <a
        href={SKILLS_SH_URL}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-muted-foreground/40 underline-offset-2 hover:text-foreground"
      >
        {new Intl.NumberFormat("en", { notation: "compact" }).format(installs)}{" "}
        {installs === 1 ? "install" : "installs"} on skills.sh
      </a>
    </p>
  );
}

export default function FluidSkillDoc() {
  return (
    <DocPage
      title="/fluid-functionalism skill"
      slug="skill"
      showInstall={false}
      description="Teaches your coding agent the components, the motion rules, and the reasons behind them."
    >
      <SkillHero />

      {/* No section title: the command sits straight under the page intro. */}
      <div className="flex flex-col gap-4">
        <InputCopy
          value={INSTALL_COMMAND}
          variant="button"
          onCopy={() => track("Skill install copied", { method: "skills-cli" })}
        />
        <InstallCount />
      </div>

      <DocSection title="What it does">
        <ol className="flex flex-col">
          {JOBS.map(({ title, body }) => (
            <TimelineItem key={title} title={title}>
              {body}
            </TimelineItem>
          ))}
        </ol>
      </DocSection>

      <DocSection title="What it knows">
        <ul className="flex flex-col gap-4">
          {REFERENCES.map(({ file, body }) => (
            <Row key={file} title={file} mono>
              {body}
            </Row>
          ))}
        </ul>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground/50">
          {CRAFT_SAMPLES.map((item) => (
            <li key={item} className="pl-1 text-body leading-relaxed text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection title="Try it">
        <div className="flex flex-col gap-2">
          {PROMPTS.map((prompt, i) => (
            <InputCopy
              key={prompt}
              value={prompt}
              onCopy={() => track("Skill prompt copied", { prompt: i + 1 })}
            />
          ))}
        </div>
      </DocSection>
    </DocPage>
  );
}
