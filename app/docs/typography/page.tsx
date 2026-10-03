"use client";

import { type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { TypographyPlayground } from "@/lib/docs/playgrounds/typography";
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
  { name: ".typeset", type: "class", description: "Sets every element inside like the site: h1 display in bold, h2 title, h3 to h6 subtitle, paragraphs body in the muted color, figcaption and code caption. Works on rendered markdown and on Tiptap editors as is." },
  { name: ".typeset-compact", type: "class", description: "Next to .typeset: the compact styles and tighter spacing." },
  { name: ".not-typeset", type: "class", description: "Opts a subtree out. The sheet skips it and everything inside." },
  { name: ".typeset-scroll", type: "class", description: "Wrap a wide table in it to scroll sideways instead of squeezing columns." },
];

const apiRows: PropDef[] = [
  { name: "typeClass(role, variant?)", type: "string", description: "Size and leading classes for one role at one step, with px fallbacks. What every component uses. In a server component, import it from @/lib/type-scale: size-context is a client module." },
  { name: "typeSize(role, variant?)", type: "string", description: "The size half alone, for text whose line box is set elsewhere: a fixed-height control, a key cap with leading-none." },
  { name: "useSize().type", type: "Record<TypeScaleRole, string>", description: "The same classes for the step the surrounding SizeProvider (or a size prop) resolves to." },
  { name: "useTypeScale(override?)", type: "Record<TypeScaleRole, { size, leading }>", description: "Raw px per role for the current step. Changed from plain numbers: read typeScale.body[step].size where you read typeScale.body[step]." },
  { name: "text-<role>, text-<role>-compact", type: "utility", description: "Tailwind theme utilities from the type-scale tokens. Size and leading; a later leading-* wins." },
];

/** The doc and its controls: the editor stays in the column, the Typeset
 *  panel parks in the right rail on wide screens. */
function TypesetPlayground() {
  return (
    <TypographyPlayground>
      {({ preview, controls }) => <PlaygroundLayout controls={controls} preview={preview} />}
    </TypographyPlayground>
  );
}

export default function TypographyDoc() {
  return (
    <DocPage
      title="Typography"
      slug="typography"
      installSlug="size-context"
      installNote="The styles as variables and utilities, plus typeClass(). Every component already pulls them in."
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
          a Notion doc, switch documents in the Typeset panel, and press<Code>S</Code>to drop
          every style a notch for compact.
        </P>
        <TypesetPlayground />
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

      <div id="typeset-reference" className="flex flex-col gap-8">
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
