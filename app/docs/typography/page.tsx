"use client";

import { type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { TYPESET_SAMPLES, TypesetEditor } from "@/lib/docs/typeset-sample";
import { TYPESET_SPACE } from "@/lib/typeset/generate";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { BalanceDemo, PrettyDemo, WeightOpszDemo } from "./demos";

/** Inline code chip used throughout the prose. */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-site-caption text-foreground">
      {children}
    </code>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-site-body text-muted-foreground">{children}</p>;
}

function Rule({ children }: { children: ReactNode }) {
  return <li className="pl-1 text-site-body text-muted-foreground">{children}</li>;
}

/** The sheet's gaps, named by the styles they sit around. A caption takes
 *  the same room as the space under a heading. */
const GAPS: Array<[gap: keyof typeof TYPESET_SPACE, label: string]> = [
  ["section", "Above display and title"],
  ["subsection", "Above subtitle"],
  ["heading", "Below display, title, and subtitle"],
  ["block", "Between body blocks"],
  ["heading", "Above caption"],
  ["item", "Between list items"],
  ["rule", "Around a divider"],
];

/** Read from the sheet's own values, so it can't drift from them. Styled
 *  like PropsTable. */
function GapTable() {
  const th = "px-3 py-2 text-left text-foreground";
  return (
    <table className="w-full border-collapse text-site-body tabular-nums [&_th:first-child]:pl-0 [&_td:first-child]:pl-0">
      <thead>
        <tr className="border-b border-border">
          {["Gap", "Default", "Compact"].map((label) => (
            <th key={label} className={th} style={{ fontVariationSettings: fontWeights.semibold }}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {GAPS.map(([gap, label]) => (
          <tr key={label} className="border-b border-border/40">
            <td className="px-3 py-2 text-muted-foreground">{label}</td>
            <td className="px-3 py-2 text-foreground">{TYPESET_SPACE[gap].default}px</td>
            <td className="px-3 py-2 text-foreground">{TYPESET_SPACE[gap].compact}px</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const classRows: PropDef[] = [
  { name: ".typeset", type: "class", description: "Sets everything inside in the 5 styles, like the rest of the site." },
  { name: ".typeset-compact", type: "class", description: "The compact step: one notch smaller, with tighter spacing." },
  { name: ".not-typeset", type: "class", description: "Leaves a part alone, like a component inside a chat reply." },
];

const apiRows: PropDef[] = [
  { name: "typeClass(role, variant?)", type: "string", description: "Puts your own text in one of the styles, like every component. In a server component, import it from @/lib/type-scale." },
  { name: "useSize().type", type: "Record<TypeScaleRole, string>", description: "The same, at the size step of the region it's in." },
  { name: "text-<role>", type: "utility", description: "The same styles as Tailwind classes, like text-caption." },
];

export default function TypographyDoc() {
  return (
    <DocPage
      title="Typography"
      slug="typography"
      installSlug="size-context"
      installNote="The 5 styles for your own text, already in every component."
      description="Bold rules that create consistency across the whole component library."
    >
      <DocSection title="4 rules">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground">
          <Rule>5 styles for the whole site, from page titles to captions.</Rule>
          <Rule>3 weights: regular for text, semibold for headings and selected items, bold for page titles.</Rule>
          <Rule>2 text colors: foreground and muted.</Rule>
          <Rule>1 paragraph style.</Rule>
        </ul>
      </DocSection>

      <DocSection title="5 no-gos">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground">
          <Rule>No uppercase: hierarchy comes from size and weight.</Rule>
          <Rule>No letter-spacing: handled with Inter&apos;s optical sizing.</Rule>
          <Rule>No eyebrows: a section starts with its title.</Rule>
          <Rule>No difference with markdown: it uses the same styles and colors as everything else.</Rule>
          <Rule>No opacity for text: it&apos;s foreground or muted, never a faded step of them.</Rule>
        </ul>
      </DocSection>

      <DocSection title="The scale">
        <P>
          The 5 styles, called roles in code, each a size and a line height. Edit the page below like
          a Notion doc, and press<Code>S</Code>to drop every style a notch for compact.
        </P>
        <TypesetEditor content={TYPESET_SAMPLES.scale} label="Type scale sample" />
      </DocSection>

      <DocSection title="Markdown">
        <P>Markdown gets the same 5 styles, to-dos and tables included.</P>
        <TypesetEditor content={TYPESET_SAMPLES.notion} label="Notion doc sample" />
      </DocSection>

      <DocSection title="Spacing">
        <P>Space around the 5 styles, always above a block, so text streaming in never moves what&apos;s on screen.</P>
        <GapTable />
      </DocSection>

      <DocSection title="Weight without reflow">
        <P>
          A heavier weight makes Inter wider, so a label that turns semibold on selection pushes its
          neighbors. Each weight in<Code>fontWeights</Code>carries its own optical size, which pulls
          the letters back in. The blue line is the unselected width.
        </P>
        <WeightOpszDemo />
      </DocSection>

      <DocSection title="Balanced headings">
        <P>
          Headings set<Code>text-wrap: balance</Code>so the browser evens out their lines instead of
          filling the first one and leaving a short one.
        </P>
        <BalanceDemo />
      </DocSection>

      <DocSection title="Pretty paragraphs">
        <P>
          Paragraphs set<Code>text-wrap: pretty</Code>so the browser brings a word down rather than
          end on one word alone. Both rules are global, in the base layer, and both stay off
          inside<Code>.typeset</Code>where streamed text would re-wrap lines already on screen.
        </P>
        <PrettyDemo />
      </DocSection>

      <div className="flex flex-col gap-8">
        <DocSection title="Classes">
          <PropsTable props={classRows} />
        </DocSection>
        <DocSection title="Type scale API">
          <PropsTable props={apiRows} />
        </DocSection>
      </div>
    </DocPage>
  );
}
