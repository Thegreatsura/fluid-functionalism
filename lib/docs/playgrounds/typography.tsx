"use client";

import { useRef, useState } from "react";
import { CopyPromptButton } from "@/lib/docs/copy-prompt-button";
import { typeScale } from "@/lib/type-scale";
import { useSizeVariant } from "@/lib/size-context";
import { PlayField, PlaySelect, PlaygroundPanel } from "@/lib/docs/playground";
import { generateTypesetCss } from "@/lib/typeset/generate";
import { TYPESET_SAMPLES, TypesetEditor, type TypesetSampleName } from "@/lib/docs/typeset-sample";
import type { PlaygroundProps } from "./types";

// ── Typeset builder ──────────────────────────────────────
// One sheet, three documents to try it on. The editor keeps one draft per
// document, so switching away and back loses nothing. The sheet has nothing
// to tune: S switches the step, Width sets the measure. Copy prompt hands a
// coding agent the output of generateTypesetCss, the function that also
// writes the registry item.

const DOCUMENTS: Record<TypesetSampleName, string> = {
  scale: "Type scale",
  release: "Release note",
  notion: "Notion doc",
};

const DOCUMENT_NAMES = Object.keys(DOCUMENTS) as TypesetSampleName[];

const WIDTHS = ["360", "520", "680"];

const CSS = generateTypesetCss(typeScale);

/** The brief behind Copy prompt: the sheet plus how to wire it. */
const PROMPT = [
  "Add this prose stylesheet from Fluid Functionalism to my app's global CSS (Tailwind v4), as is.",
  "",
  "- Wrap rendered markdown, chat replies, or a rich-text editor (Tiptap works as is) in an element with the `typeset` class. The elements inside need no classes: each sets in a type style, as on fluidfunctionalism.com. h1 is display in bold, h2 title, h3 to h6 subtitle, paragraphs body in the muted color, figcaption and code caption.",
  "- Add `typeset-compact` next to `typeset` where the region uses the compact size step: it switches to the compact styles and tighter spacing.",
  "- The sheet reads the --fs-* and --lh-* variables from the type-scale install, with px fallbacks, so it works without them.",
  "- Every rule sits in @layer components with zero specificity, so any utility on an element still wins.",
  "- Add `not-typeset` to a subtree to opt it out.",
  "",
  "```css",
  CSS.trimEnd(),
  "```",
  "",
  "Docs: https://www.fluidfunctionalism.com/docs/typography",
].join("\n");

export function TypographyPlayground({ children }: PlaygroundProps) {
  const [content, setContent] = useState<TypesetSampleName>("scale");
  const [width, setWidth] = useState("680");
  // The page's size step (S, or the Size control in the right panel).
  const compact = useSizeVariant() === "compact";
  // Drafts live in a ref: the editor owns the live document, and a keystroke
  // shouldn't re-render the panel. `dirty` is only there for Reset.
  const drafts = useRef<Record<TypesetSampleName, string>>({ ...TYPESET_SAMPLES });
  const [dirty, setDirty] = useState<Record<TypesetSampleName, boolean>>({
    scale: false,
    release: false,
    notion: false,
  });
  const [version, setVersion] = useState(0);

  const edit = (html: string) => {
    drafts.current[content] = html;
    if (!dirty[content]) setDirty((d) => ({ ...d, [content]: true }));
  };

  const reset = () => {
    drafts.current[content] = TYPESET_SAMPLES[content];
    setDirty((d) => ({ ...d, [content]: false }));
    setVersion((v) => v + 1);
  };

  const preview = (
    <TypesetEditor
      content={drafts.current[content]}
      contentKey={content}
      version={version}
      onChange={edit}
      onReset={reset}
      canReset={dirty[content]}
      typesetClassName={compact ? "typeset-compact" : undefined}
      maxWidth={Number(width)}
    />
  );

  const controls = (
    <PlaygroundPanel title="Typeset">
      <PlayField label="Document">
        <PlaySelect
          value={content}
          onChange={(v) => setContent(v as TypesetSampleName)}
          options={DOCUMENT_NAMES.map((name) => ({ value: name, label: DOCUMENTS[name] }))}
        />
      </PlayField>
      <PlayField label="Width">
        <PlaySelect
          value={width}
          onChange={setWidth}
          options={WIDTHS.map((w) => ({ value: w, label: `${w}px` }))}
        />
      </PlayField>
      <div className="px-1 pt-2">
        <CopyPromptButton prompt={PROMPT} size="compact" className="w-full" />
      </div>
    </PlaygroundPanel>
  );

  return <>{children({ preview, demoPreview: preview, controls, code: CSS })}</>;
}
