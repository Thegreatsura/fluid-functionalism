"use client";

import { type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { TypographyPlayground } from "@/lib/docs/playgrounds/typography";
import { InputCopy } from "@/registry/default/input-copy";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { WeightOpszDemo, TrimDemo, WrapDemo } from "./demos";

/** Inline code chip used throughout the prose. */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-site-caption text-foreground">
      {children}
    </code>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-site-body leading-relaxed text-muted-foreground">{children}</p>;
}

function Sub({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-site-body text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>{children}</h3>;
}

const variableRows: PropDef[] = [
  { name: "--typeset-size", type: "length", default: "1em", description: "Base font size. 1em inherits the surrounding size, so a typeset in a 13px bubble reads at 13px." },
  { name: "--typeset-leading", type: "number", default: "1.6", description: "Line height of body text. Headings set their own, tighter." },
  { name: "--typeset-flow", type: "number", default: "1", description: "Vertical rhythm. 1 puts one base em between paragraphs; headings take 2 above and 0.5 below." },
  { name: "--typeset-ratio", type: "number", default: "1.2", description: "Heading step. h3 is ratio, h2 is ratio², h1 is ratio³ times the base, so headings always outgrow body text." },
  { name: "--typeset-h1 … --typeset-h6", type: "number", default: "from ratio", description: "Each heading level's size in base ems, with a matching --typeset-h1-leading … --typeset-h6-leading. Presets pin them; .typeset-scale sets them from the roles." },
  { name: "--typeset-code", type: "number", default: "0.875", description: "Code size in ems of its surroundings, with --typeset-code-leading (1.6) for blocks." },
];

const classRows: PropDef[] = [
  { name: ".typeset", type: "class", description: "Styles every element inside: headings, lists and to-dos, quotes, code, tables, kbd, media. Works on rendered markdown and on Tiptap editors as is." },
  { name: ".typeset-docs", type: "class", description: "Long-form preset: 15px base, 1.65 leading, roomier flow." },
  { name: ".typeset-chat", type: "class", description: "Chat preset: inherits the bubble's size, 1.5 leading, tighter flow, flatter headings." },
  { name: ".typeset-scale", type: "class", description: "Type scale preset: h1 display, h2 title, h3 subtitle, h4 and paragraphs body, h5 caption, h6 micro, code caption, each with its role's leading." },
  { name: ".typeset-compact", type: "class", description: "Steps any preset down one notch, the way compact steps the roles: 1px off a px base, 0.05 off the leading, a fifth off the rhythm. Type scale switches to the compact roles." },
  { name: ".not-typeset", type: "class", description: "Opts a subtree out. The sheet skips it and everything inside." },
  { name: ".typeset-scroll", type: "class", description: "Wrap a wide table in it to scroll sideways instead of squeezing columns." },
];

const apiRows: PropDef[] = [
  { name: "typeClass(role, variant?)", type: "string", description: "Size and leading classes for one role at one step, with px fallbacks. What every component uses." },
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
      installSlug="type-scale"
      installNote="Installs the six roles as --fs-* and --lh-* variables plus text-<role> and text-<role>-compact utilities. Every component pulls it in on its own."
      description="Six roles, each a size and a leading, shared by every component and the prose stylesheet."
    >
      <DocSection title="The scale">
        <P>
          Six roles, from display to micro, each a size and a line height. The page below sets them
          as a document: edit it like a Notion doc, switch presets in the Typeset panel, and press
          <Code>S</Code>to see every role drop one notch in compact.
        </P>
        <TypesetPlayground />
      </DocSection>

      <DocSection title="Weight without reflow">
        <P>
          A heavier weight makes Inter wider, so a label that turns bold on selection pushes its
          neighbors. Each weight in<Code>fontWeights</Code>carries its own optical size, which pulls
          the letters back in. The blue line is the width at 400.
        </P>
        <WeightOpszDemo />
      </DocSection>

      <DocSection title="Details">
        <Sub>Trim to the cap height</Sub>
        <P>
          A line box adds space above the capitals and below the baseline, so centered labels sit
          low. Trimming to cap height and baseline centers the letters, not the box.
        </P>
        <TrimDemo />
        <Sub>Balance and pretty</Sub>
        <P>
          Headings balance their lines; paragraphs avoid a lone last word. Both are global, in the
          base layer.
        </P>
        <WrapDemo />
      </DocSection>

      <DocSection title="Install the prose sheet">
        <P>
          The CLI writes the sheet into your global CSS, inside<Code>@layer components</Code>. Every
          rule has zero specificity, so any utility on an element wins without
          <Code>!important</Code>. Space only goes above an element, so text streamed in at the end
          never moves what&apos;s already on screen.
        </P>
        <InputCopy
          value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/typography.json"
          align="left"
          className="w-full max-w-[560px]"
        />
      </DocSection>

      <div id="typeset-reference" className="flex flex-col gap-8">
        <DocSection title="Variables">
          <PropsTable props={variableRows} />
        </DocSection>
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
