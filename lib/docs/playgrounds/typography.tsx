"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CopyPromptButton } from "@/lib/docs/copy-prompt-button";
import { typeScale } from "@/lib/type-scale";
import { useSizeVariant } from "@/lib/size-context";
import {
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import {
  TYPESET_DEFAULTS,
  TYPESET_PRESETS,
  compactValues,
  generateTypesetCss,
  type TypesetValues,
} from "@/lib/typeset/generate";
import {
  TYPESET_SAMPLES,
  TypesetEditor,
  typesetVars,
  type TypesetSampleName,
} from "@/lib/docs/typeset-sample";
import type { PlaygroundProps } from "./types";

// ── Typeset builder ──────────────────────────────────────
// A preset is a kind of content plus the values that suit it. The editor
// keeps one draft per preset, so switching away and back loses nothing.
// Type scale renders through its class, .typeset-scale, since its heading
// levels are pinned to the roles rather than derived from four values; the
// others apply their values as variables on top of the sheet in globals.css.
// Everything follows the site's size step through .typeset-compact. Copy
// prompt hands a coding agent the output of generateTypesetCss, the function
// that also writes the registry item, so what you tune is what you get.

const sheetPreset = (name: "docs" | "chat"): TypesetValues => {
  const p = TYPESET_PRESETS.find((x) => x.name === name)!;
  return { size: p.size, leading: p.leading, flow: p.flow, ratio: p.ratio };
};

/** `values: null` is Type scale: the class sets every level from a role. */
const PRESETS: Record<TypesetSampleName, { label: string; values: TypesetValues | null }> = {
  scale: { label: "Type scale", values: null },
  release: { label: "Release note", values: sheetPreset("docs") },
  // 16px body with a 1.25 heading step lands near Notion's own page type.
  notion: { label: "Notion doc", values: { size: 16, leading: 1.6, flow: 1, ratio: 1.25 } },
  chat: { label: "Chat reply", values: sheetPreset("chat") },
};

const PRESET_NAMES = Object.keys(PRESETS) as TypesetSampleName[];

const sameValues = (a: TypesetValues | null, b: TypesetValues | null) =>
  a === b ||
  (!!a && !!b && a.size === b.size && a.leading === b.leading && a.flow === b.flow && a.ratio === b.ratio);

const SIZES = ["inherit", "13", "14", "15", "16", "18"];
const LEADINGS = ["1.4", "1.5", "1.6", "1.65", "1.75"];
const FLOWS = ["0.5", "0.75", "1", "1.1", "1.25", "1.5"];
const RATIOS = ["1.1", "1.125", "1.2", "1.25", "1.333"];
const WIDTHS = ["360", "520", "680"];

const opts = (values: string[], fmt: (v: string) => string = (v) => v) =>
  values.map((v) => ({ value: v, label: fmt(v) }));

/** The brief behind Copy prompt: the sheet plus how to wire it. */
function typesetPrompt(css: string, scaleMode: boolean) {
  return [
    "Add this prose stylesheet from Fluid Functionalism to my app's global CSS (Tailwind v4), as is.",
    "",
    scaleMode
      ? "- Wrap rendered markdown, chat replies, or a rich-text editor (Tiptap works as is) in an element with the classes `typeset typeset-scale`: every heading level then sets in a type role (h1 display, h2 title, h3 subtitle, h4 and paragraphs body, h5 caption, h6 micro, code caption). The elements inside need no classes."
      : "- Wrap rendered markdown, chat replies, or a rich-text editor (Tiptap works as is) in an element with the `typeset` class. The elements inside need no classes.",
    "- Add `typeset-compact` where the region uses the compact size step: it steps the sheet down one notch.",
    "- Every rule sits in @layer components with zero specificity, so any utility on an element still wins.",
    "- Add `not-typeset` to a subtree to opt it out.",
    "- Four variables tune it: --typeset-size, --typeset-leading, --typeset-flow, --typeset-ratio.",
    "",
    "```css",
    css.trimEnd(),
    "```",
    "",
    "Docs: https://www.fluidfunctionalism.com/docs/typography",
  ].join("\n");
}

export function TypographyPlayground({ children }: PlaygroundProps) {
  const [content, setContent] = useState<TypesetSampleName>("scale");
  const [values, setValues] = useState<TypesetValues | null>(PRESETS.scale.values);
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
    chat: false,
  });
  const [version, setVersion] = useState(0);

  const scaleMode = values === null;
  const custom = !sameValues(values, PRESETS[content].values);
  // Type scale hands over the whole sheet, presets included; tuned values
  // hand over just their own sheet, compact step included.
  const code = scaleMode ? generateTypesetCss(TYPESET_DEFAULTS, true, typeScale) : generateTypesetCss(values, false);

  const set = (patch: Partial<TypesetValues>) =>
    setValues((v) => ({ ...(v ?? sheetPreset("docs")), ...patch }));

  const applyPreset = (name: string) => {
    if (name === "custom") return;
    const next = name as TypesetSampleName;
    setContent(next);
    setValues(PRESETS[next].values);
  };

  const edit = (html: string) => {
    drafts.current[content] = html;
    if (!dirty[content]) setDirty((d) => ({ ...d, [content]: true }));
  };

  const reset = () => {
    drafts.current[content] = TYPESET_SAMPLES[content];
    setDirty((d) => ({ ...d, [content]: false }));
    setVersion((v) => v + 1);
  };

  const randomize = () => {
    const any = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
    setValues({
      size: Number(any(SIZES.slice(1))),
      leading: Number(any(LEADINGS)),
      flow: Number(any(FLOWS)),
      ratio: Number(any(RATIOS)),
    });
  };

  const preview = (
    <TypesetEditor
      content={drafts.current[content]}
      contentKey={content}
      version={version}
      onChange={edit}
      onReset={reset}
      canReset={dirty[content]}
      // Inline variables beat the classes, so tuned values carry their own
      // compact step; Type scale reads both steps from its class.
      style={values ? typesetVars(compact ? compactValues(values) : values) : undefined}
      typesetClassName={cn(scaleMode && "typeset-scale", compact && "typeset-compact")}
      // Type scale reads type only; the documents show their spacing too.
      inspectSpacing={!scaleMode}
      maxWidth={Number(width)}
      // An inheriting size reads the chat bubble's role, subtitle.
      className="text-site-subtitle"
    />
  );

  const controls = (
    <PlaygroundPanel title="Typeset" onShuffle={randomize}>
      <PlayField label="Preset">
        <PlaySelect
          value={custom ? "custom" : content}
          onChange={applyPreset}
          options={[
            ...PRESET_NAMES.map((name) => ({ value: name, label: PRESETS[name].label })),
            ...(custom ? [{ value: "custom", label: "Custom" }] : []),
          ]}
        />
      </PlayField>
      <PlayDivider />
      <PlaySection label="Values" />
      {values ? (
        <>
          <PlayField label="Size">
            <PlaySelect
              value={values.size === null ? "inherit" : String(values.size)}
              onChange={(v) => set({ size: v === "inherit" ? null : Number(v) })}
              options={opts(SIZES, (v) => (v === "inherit" ? "Inherit" : `${v}px`))}
            />
          </PlayField>
          <PlayField label="Leading">
            <PlaySelect
              value={String(values.leading)}
              onChange={(v) => set({ leading: Number(v) })}
              options={opts(LEADINGS)}
            />
          </PlayField>
          <PlayField label="Flow">
            <PlaySelect
              value={String(values.flow)}
              onChange={(v) => set({ flow: Number(v) })}
              options={opts(FLOWS, (v) => `${v}×`)}
            />
          </PlayField>
          <PlayField label="Heading ratio">
            <PlaySelect
              value={String(values.ratio)}
              onChange={(v) => set({ ratio: Number(v) })}
              options={opts(RATIOS)}
            />
          </PlayField>
        </>
      ) : (
        <p className="px-1 pb-2 text-site-caption text-muted-foreground">
          Every heading level sets in a type role, so there is nothing to tune. Pick another preset,
          or shuffle, to set your own values.
        </p>
      )}
      <PlayDivider />
      <PlaySection label="Preview" />
      <PlayField label="Width">
        <PlaySelect value={width} onChange={setWidth} options={opts(WIDTHS, (v) => `${v}px`)} />
      </PlayField>
      <div className="px-1 pt-2">
        <CopyPromptButton prompt={typesetPrompt(code, scaleMode)} size="compact" className="w-full" />
      </div>
    </PlaygroundPanel>
  );

  return <>{children({ preview, demoPreview: preview, controls, code })}</>;
}
