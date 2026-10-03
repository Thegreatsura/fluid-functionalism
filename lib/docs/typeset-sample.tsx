"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Fragment, useMemo } from "react";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { EditorContent, Node, createDocument, mergeAttributes, useEditor } from "@tiptap/react";
import { EditorState } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import { cn } from "@/lib/utils";
import { useShape } from "@/registry/default/lib/shape-context";
import { useThemeContext } from "@/registry/default/lib/theme-context";
import { Button } from "@/registry/radix/button";
import { Switch } from "@/registry/radix/switch";
import { Tooltip } from "@/registry/radix/tooltip";
import { typeScale } from "@/lib/type-scale";
import { selectorList, typesetRules } from "@/lib/typeset/generate";

// The Type scale document: each style the way the site uses it. Display
// titles the page in bold, title heads a section, body is the muted
// paragraph, subtitle sets h3 to h6, and caption is a muted figcaption.
const SCALE_SAMPLES: Array<[tag: string, text: string]> = [
  ["h1", "This is the main display"],
  ["h2", "This is a section title"],
  [
    "p",
    "This is a paragraph in the body style, the size of labels and copy across every component. It runs onto a second line so you can see its line height at work.",
  ],
  ["h3", "This is a heading in the subtitle style, for h3 to h6"],
  ["figcaption", "This is a caption, for descriptions and meta rows"],
];

/** Starting HTML of each document on /docs/typography. Between them, every
 *  element the sheet styles appears. */
export const TYPESET_SAMPLES = {
  scale: SCALE_SAMPLES.map(([tag, text]) => `<${tag}>${text}</${tag}>`).join(""),
  release: [
    "<h1>Release notes</h1>",
    '<p>Version 2.4 ships <strong>paired leading</strong> for every type role and a prose sheet for rendered markdown. Read the <a href="#typeset-reference">reference</a> or run <code>npx shadcn add</code> to install it.</p>',
    "<h2>What changed</h2>",
    "<p>Each role is now a size and a line height, so a caption in a menu and a caption in a table sit on the same rhythm.</p>",
    "<ul>",
    "<li><p>Five styles, from display to caption</p></li>",
    "<li><p>Two steps per style</p><ul><li><p>Default for most screens</p></li><li><p>Compact for dense tools</p></li></ul></li>",
    "<li><p>One source file generates every copy</p></li>",
    "</ul>",
    "<h3>Install order</h3>",
    "<ol><li><p>Add the type scale tokens</p></li><li><p>Add the prose sheet</p></li><li><p>Wrap your content in <code>.typeset</code></p></li></ol>",
    "<blockquote><p>Spacing only goes above an element, so streamed text never moves what is already on screen.</p></blockquote>",
    '<pre><code class="language-tsx">&lt;article className="typeset"&gt;\n  {content}\n&lt;/article&gt;</code></pre>',
    "<table><tbody>",
    "<tr><th><p>Role</p></th><th><p>Default</p></th><th><p>Compact</p></th></tr>",
    "<tr><td><p>Body</p></td><td><p>13 / 20</p></td><td><p>12 / 18</p></td></tr>",
    "<tr><td><p>Caption</p></td><td><p>12 / 16</p></td><td><p>11 / 14</p></td></tr>",
    "</tbody></table>",
    "<hr>",
    "<p>Questions go to the changelog thread.</p>",
  ].join(""),
  notion: [
    "<h1>Q3 design system audit</h1>",
    "<p><strong>Owner</strong> Design systems · <strong>Status</strong> In progress · <strong>Due</strong> October 14</p>",
    "<h2>Goals</h2>",
    '<ul data-type="taskList">',
    '<li data-type="taskItem" data-checked="true"><p>List every text size in the product</p></li>',
    '<li data-type="taskItem" data-checked="true"><p>Map each one to a type role</p></li>',
    '<li data-type="taskItem" data-checked="false"><p>Replace hard-coded sizes on the settings pages</p></li>',
    '<li data-type="taskItem" data-checked="false"><p>Ship compact mode for the data tables</p></li>',
    "</ul>",
    "<h2>Findings</h2>",
    "<p>We found <strong>23 distinct font sizes</strong> across 140 screens. Most are one-offs: a 13.5px label here, a 15px caption there.</p>",
    "<blockquote><p>The fix is not fewer screens. It is fewer decisions.</p></blockquote>",
    "<h3>Sizes in the wild</h3>",
    "<table><tbody>",
    "<tr><th><p>Size</p></th><th><p>Screens</p></th><th><p>Maps to</p></th></tr>",
    "<tr><td><p>12px</p></td><td><p>64</p></td><td><p>caption</p></td></tr>",
    "<tr><td><p>13px</p></td><td><p>97</p></td><td><p>body</p></td></tr>",
    "<tr><td><p>14px</p></td><td><p>41</p></td><td><p>subtitle</p></td></tr>",
    "<tr><td><p>16px</p></td><td><p>22</p></td><td><p>title</p></td></tr>",
    "</tbody></table>",
    "<h3>Next steps</h3>",
    "<ol><li><p>Agree on the five styles with engineering</p></li><li><p>Run the codemod on one surface</p></li><li><p>Review the diff together on Friday</p></li></ol>",
  ].join(""),
} as const;

export type TypesetSampleName = keyof typeof TYPESET_SAMPLES;

// Tiptap's markdown shortcuts format as you type: "# " heading, "- " list,
// "1. " numbered, "[] " to-do, "> " quote, "```" code, "---" rule, and
// **bold**, *italic*, `code` inline. It emits plain elements, so the sheet
// styles the live document the same way it styles rendered markdown.
// A caption line. Markdown has no caption of its own, so the sample uses
// figcaption, which the sheet sets in the caption style.
const Caption = Node.create({
  name: "caption",
  group: "block",
  content: "inline*",
  parseHTML: () => [{ tag: "figcaption" }],
  renderHTML: ({ HTMLAttributes }) => ["figcaption", mergeAttributes(HTMLAttributes), 0],
});

const EXTENSIONS = [
  Caption,
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    link: { openOnClick: false },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  TableKit.configure({ table: { resizable: false, renderWrapper: true } }),
  // Short and per line, like Notion: a long hint wraps and runs into the
  // next block, since the placeholder takes no height.
  Placeholder.configure({
    placeholder: ({ node }) =>
      node.type.name === "heading"
        ? `Heading ${node.attrs.level}`
        : node.type.name === "codeBlock"
          ? "Code"
          : "Write something",
  }),
];

// A constant, so useEditor doesn't re-apply it on every render. Its
// setProps would drop the role Tiptap adds on create, so the role is set
// here too. `relative` keeps the editor above the inspect bands (both
// positioned, painted in tree order).
const EDITOR_PROPS = {
  attributes: {
    class: "relative outline-none",
    role: "textbox",
    "aria-multiline": "true",
    "aria-label": "Sample document",
  },
};

// Tiptap marks the empty line with data-placeholder; show it as a ghost.
const PLACEHOLDER =
  "[&_.is-empty]:before:pointer-events-none [&_.is-empty]:before:float-left [&_.is-empty]:before:h-0 [&_.is-empty]:before:whitespace-nowrap [&_.is-empty]:before:text-muted-foreground [&_.is-empty]:before:content-[attr(data-placeholder)]";

// ── Inspect ──────────────────────────────────────────────
// Hover a text block to see its line boxes (one band per line) and a readout
// of its measured font size and line height. It also shows who owns the
// space around the block: the margin above it (the sheet only
// ever spaces from the top, so that margin can belong to the block itself or
// to a list item or list it opens), padding, and flex gaps, each with the
// sheet rule that set it, so a refinement knows which rule to touch. One
// block at a time: the one under the pointer, or the nearest when the
// pointer sits between blocks, so it never blinks off. Measured from the live
// DOM, in the colors and tooltip of the site's inspector
// (lib/docs/InspectOverlay.tsx); margins in orange, as browser devtools do.

// A type alias, not an interface, so a box passes straight in as a style.
type Box = {
  top: number;
  left: number;
  width: number;
  height: number;
};

interface InspectMark {
  el: HTMLElement;
  /** Border box: what the pointer is matched against. */
  box: Box;
  /** Content box: where the line bands go (inside a code block's padding). */
  content: Box;
  fontSize: number;
  /** Line height in px: one band per line. */
  lineHeight: number;
}

const INSPECT_BLOCKS = ".ProseMirror :is(h1, h2, h3, h4, h5, h6, p, pre, figcaption)";
const INSPECT_BLUE = "#6B97FF";
const INSPECT_BAND = "rgba(107, 151, 255, 0.16)";
const INSPECT_TONES = {
  margin: { fill: "rgba(255, 168, 82, 0.28)", line: "rgba(240, 140, 40, 0.9)" },
  padding: { fill: "rgba(153, 255, 201, 0.35)", line: "rgba(83, 214, 145, 0.9)" },
} as const;

/** The theme opposite the page's. The tooltip inverts the page
 *  (bg-foreground), so its readout sits in that theme's scope, the way the
 *  forced-theme previews do: muted there is the muted made for that surface. */
function useInverseTheme(): "light" | "dark" {
  const { theme } = useThemeContext();
  const [osDark, setOsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setOsDark(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return theme === "dark" || (theme === "system" && osDark) ? "light" : "dark";
}

const pxLabel = (value: number) => {
  const n = Math.round(value * 10) / 10;
  return `${Number.isInteger(n) ? n : n.toFixed(1)}px`;
};

/** Every block's boxes relative to `frame`, in document order. */
function measureBlocks(frame: HTMLElement): InspectMark[] {
  const base = frame.getBoundingClientRect();
  const blocks = Array.from(frame.querySelectorAll<HTMLElement>(INSPECT_BLOCKS));
  return blocks.map((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const [pt, pr, pb, pl] = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(parseFloat);
    const box = { top: r.top - base.top, left: r.left - base.left, width: r.width, height: r.height };
    return {
      el,
      box,
      content: { top: box.top + pt, left: box.left + pl, width: box.width - pl - pr, height: box.height - pt - pb },
      fontSize: parseFloat(cs.fontSize),
      lineHeight: parseFloat(cs.lineHeight),
    };
  });
}

/** Distance from a point to a box (0 inside). */
const distance = (x: number, y: number, b: Box) =>
  Math.hypot(
    Math.max(b.left - x, 0, x - (b.left + b.width)),
    Math.max(b.top - y, 0, y - (b.top + b.height))
  );

// ── Spacing: who owns the space around a block, and which rule set it ──

interface SpaceMark {
  kind: "Margin top" | "Padding top" | "Padding bottom" | "Gap";
  value: number;
  /** The element the space belongs to, e.g. "li". */
  owner: string;
  /** The sheet rule that set it, as its matching selector. */
  rule: string | null;
  band: Box;
  tone: keyof typeof INSPECT_TONES;
}

// The sheet's own rules (the ones generateTypesetCss writes), to trace a
// margin or padding back to its selector. Values don't change selectors.
const SHEET_RULES = typesetRules(typeScale);

/** The selector list a sheet rule opens with, `:where(.typeset p, …)`,
 *  split at its top-level commas. */
function whereParts(sel: string): string[] {
  if (!sel.startsWith(":where(")) return [];
  let depth = 0;
  let i = 0;
  for (; i < sel.length; i++) {
    if (sel[i] === "(") depth++;
    else if (sel[i] === ")" && --depth === 0) break;
  }
  return selectorList(sel.slice(":where(".length, i));
}

const safeMatches = (el: Element, sel: string) => {
  try {
    return el.matches(sel);
  } catch {
    return false;
  }
};

/** The last sheet rule (same specificity, so order wins) that sets `prop`
 *  on `el`, as its selector. */
function ruleFor(el: HTMLElement, prop: "margin-top" | "padding-top" | "padding-bottom" | "gap"): string | null {
  const short = prop === "margin-top" ? "margin" : prop === "gap" ? "gap" : "padding";
  for (let i = SHEET_RULES.length - 1; i >= 0; i--) {
    const [sel, decls] = SHEET_RULES[i];
    const value = decls[prop] ?? decls[short];
    if (value === undefined || sel.includes("::") || !safeMatches(el, sel)) continue;
    const part = whereParts(sel).find((p) => safeMatches(el, p)) ?? sel;
    // An element list reads better as the element it matched: the block
    // itself at the end, the one before it in front of a `+`.
    const tag = (n: Element | null) => n?.tagName.toLowerCase() ?? "*";
    const readable = part
      .replace(/^\.typeset /, "")
      .replace(/:is\([^)]*\)$/, tag(el))
      .replace(/:is\([^)]*\)/, tag(el.previousElementSibling));
    return readable;
  }
  return null;
}

const isRow = (n: HTMLElement) => {
  const cs = getComputedStyle(n);
  return /flex/.test(cs.display) && !cs.flexDirection.startsWith("column");
};

/** The space around `el` and who owns it, as bands relative to `frame`. */
function spacingOf(el: HTMLElement, frame: HTMLElement): SpaceMark[] {
  const root = frame.querySelector<HTMLElement>(".ProseMirror");
  if (!root) return [];
  const base = frame.getBoundingClientRect();
  const rel = (n: Element): Box => {
    const r = n.getBoundingClientRect();
    return { top: r.top - base.top, left: r.left - base.left, width: r.width, height: r.height };
  };
  const name = (n: Element) => n.tagName.toLowerCase();
  const out: SpaceMark[] = [];

  const padding = (n: HTMLElement, side: "top" | "bottom") => {
    const cs = getComputedStyle(n);
    const value = parseFloat(side === "top" ? cs.paddingTop : cs.paddingBottom);
    if (value < 0.5) return;
    const b = rel(n);
    const border = parseFloat(side === "top" ? cs.borderTopWidth : cs.borderBottomWidth);
    out.push({
      kind: side === "top" ? "Padding top" : "Padding bottom",
      value,
      owner: name(n),
      rule: ruleFor(n, side === "top" ? "padding-top" : "padding-bottom"),
      band: {
        top: side === "top" ? b.top + border : b.top + b.height - border - value,
        left: b.left,
        width: b.width,
        height: value,
      },
      tone: "padding",
    });
  };

  // Above: the block's own padding, then its margin, then up through every
  // ancestor it opens (a first child shares its parent's space above).
  padding(el, "top");
  let node: HTMLElement = el;
  while (node !== root) {
    const mt = parseFloat(getComputedStyle(node).marginTop);
    if (mt >= 0.5) {
      const b = rel(node);
      out.push({
        kind: "Margin top",
        value: mt,
        owner: name(node),
        rule: ruleFor(node, "margin-top"),
        band: { top: b.top - mt, left: b.left, width: b.width, height: mt },
        tone: "margin",
      });
    }
    const parent: HTMLElement | null = node.parentElement;
    if (!parent || parent === root) break;
    // A sibling before it stacks above it, so the space is the block's own;
    // in a flex row (a to-do's checkbox) siblings sit beside it instead.
    if (node.previousElementSibling && !isRow(parent)) break;
    padding(parent, "top");
    if (getComputedStyle(parent).display === "table-cell") break;
    node = parent;
  }

  // Below: the block's own padding, then any ancestor it closes. The sheet
  // never adds margin below, so that's all the space under it.
  padding(el, "bottom");
  node = el;
  while (node !== root) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent || parent === root) break;
    if (node.nextElementSibling && !isRow(parent)) break;
    padding(parent, "bottom");
    if (getComputedStyle(parent).display === "table-cell") break;
    node = parent;
  }

  // Gap: the nearest flex or grid ancestor that spaces its children, like a
  // to-do's checkbox and its text.
  for (let n = el.parentElement; n && n !== root; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (!/flex|grid/.test(cs.display)) continue;
    const gap = Math.max(parseFloat(cs.columnGap) || 0, parseFloat(cs.rowGap) || 0);
    const [a, b] = Array.from(n.children);
    if (gap < 0.5 || !a || !b) break;
    const ra = rel(a);
    const rb = rel(b);
    const host = rel(n);
    out.push({
      kind: "Gap",
      value: gap,
      owner: name(n),
      rule: ruleFor(n as HTMLElement, "gap"),
      band: { top: host.top, left: ra.left + ra.width, width: Math.max(1, rb.left - ra.left - ra.width), height: host.height },
      tone: "padding",
    });
    break;
  }
  return out;
}

/** An editable `.typeset` document, like a Notion page: no source pane,
 *  markdown shortcuts format in place. `contentKey` + `version` decide when
 *  `content` is (re)loaded: another document's draft, or a reset. */
export function TypesetEditor({
  content,
  contentKey,
  version,
  onChange,
  onReset,
  canReset,
  typesetClassName,
  maxWidth,
}: {
  content: string;
  contentKey: string;
  version: number;
  onChange: (html: string) => void;
  onReset: () => void;
  canReset: boolean;
  /** The step class on the `.typeset` element. */
  typesetClassName?: string;
  /** Width of the document, in px. */
  maxWidth?: number;
}) {
  const shape = useShape();
  const inverse = useInverseTheme();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [inspect, setInspect] = useState(false);
  const [marks, setMarks] = useState<InspectMark[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: EXTENSIONS,
    content,
    // Rendered on the client only; the static copy below covers SSR.
    immediatelyRender: false,
    editorProps: EDITOR_PROPS,
    onUpdate: ({ editor, transaction }) => {
      if (transaction.docChanged) onChangeRef.current(editor.getHTML());
    },
  });

  // Swap documents without counting the swap as an edit, in a fresh state so
  // undo can't step back into the previous document. A layout effect ahead
  // of the inspect one below, which then measures the new document.
  const loaded = useRef({ contentKey, version });
  useLayoutEffect(() => {
    if (!editor) return;
    if (loaded.current.contentKey === contentKey && loaded.current.version === version) return;
    loaded.current = { contentKey, version };
    const doc = createDocument(content, editor.schema);
    editor.view.updateState(EditorState.create({ doc, plugins: editor.state.plugins }));
  }, [editor, content, contentKey, version]);

  // Re-measure on every edit, document swap, resize, and change of step.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!inspect || !frame || !editor) return;
    const measure = () => setMarks(measureBlocks(frame));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    editor.on("update", measure);
    return () => {
      ro.disconnect();
      editor.off("update", measure);
    };
  }, [inspect, editor, typesetClassName, maxWidth, contentKey, version]);

  // The block under the pointer, or the nearest one from a gap.
  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    if (!inspect || !frame || marks.length === 0) return;
    const base = frame.getBoundingClientRect();
    const x = e.clientX - base.left;
    const y = e.clientY - base.top;
    let best = 0;
    marks.forEach((m, i) => {
      if (distance(x, y, m.box) < distance(x, y, marks[best].box)) best = i;
    });
    setHovered((h) => (h === best ? h : best));
  };

  const mark = inspect && hovered !== null ? marks[hovered] : undefined;
  const spacing = useMemo(
    () => (mark && frameRef.current ? spacingOf(mark.el, frameRef.current) : []),
    [mark]
  );

  // A click in the page margin lands at the end of the document, as in Notion.
  const focusEnd = (e: MouseEvent<HTMLDivElement>) => {
    if (!editor || (e.target as HTMLElement).closest(".ProseMirror")) return;
    e.preventDefault();
    editor.commands.focus("end");
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden border border-border/60 transition-[border-color] duration-150 ease-out focus-within:border-foreground/40",
        shape.container
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 pl-4 pr-1.5">
        <p className="hidden min-w-0 text-site-caption text-muted-foreground sm:block">
          Type <code>#</code> for a heading, <code>-</code> for a list, <code>[]</code> for a to-do,{" "}
          <code>&gt;</code> for a quote.
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Switch
            label="Inspect"
            checked={inspect}
            onToggle={() => {
              setInspect((v) => !v);
              setHovered(null);
            }}
            className="h-8 px-2 rounded-md"
          />
          <Button variant="ghost" size="compact" disabled={!canReset} onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
      <div
        onMouseDown={focusEnd}
        className="cursor-text bg-background px-5 py-6 sm:px-8 sm:py-8"
      >
        <div
          ref={frameRef}
          onPointerMove={pick}
          onPointerLeave={() => setHovered(null)}
          className="relative mx-auto w-full text-foreground"
          style={{ maxWidth }}
        >
          {/* The bands paint under the text (the editor root is positioned
              and comes later). None of the overlay takes the pointer. */}
          {mark && (
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                ...mark.content,
                backgroundImage: `repeating-linear-gradient(to bottom, ${INSPECT_BAND} 0 ${mark.lineHeight}px, transparent ${mark.lineHeight}px ${mark.lineHeight * 2}px)`,
                outline: `1px solid ${INSPECT_BLUE}`,
              }}
            />
          )}
          {spacing.map((sp, i) => (
            <div
              key={i}
              aria-hidden
              className="pointer-events-none absolute flex items-center justify-center"
              style={{
                ...sp.band,
                background: INSPECT_TONES[sp.tone].fill,
                outline: `1px dashed ${INSPECT_TONES[sp.tone].line}`,
                outlineOffset: -1,
              }}
            >
              <span className="font-mono text-[9px] leading-none text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
                {Math.round(sp.value * 10) / 10}
              </span>
            </div>
          ))}
          <div className={cn("typeset", typesetClassName, PLACEHOLDER)}>
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              // Our own constant sample, never user input.
              <div className="tiptap ProseMirror" dangerouslySetInnerHTML={{ __html: content }} />
            )}
          </div>
          {mark && (
            <Tooltip
              forceOpen
              side="top"
              sideOffset={8}
              content={
                <div className={cn(inverse, "grid grid-cols-[auto_auto] gap-x-4 font-mono text-[11px] leading-4 tabular-nums")}>
                  <span className="text-muted-foreground">Font size</span>
                  <span className="text-right">{pxLabel(mark.fontSize)}</span>
                  <span className="text-muted-foreground">Line height</span>
                  <span className="text-right">{pxLabel(mark.lineHeight)}</span>
                  {spacing.map((sp, i) => (
                    <Fragment key={i}>
                      <span className="mt-1.5 text-muted-foreground">{sp.kind}</span>
                      <span className="mt-1.5 text-right">{pxLabel(sp.value)}</span>
                      <span className="col-span-2 text-muted-foreground">
                        {sp.owner}
                        {sp.rule ? ` · ${sp.rule}` : ""}
                      </span>
                    </Fragment>
                  ))}
                </div>
              }
              className="!px-3 !py-2.5 max-w-[300px]"
            >
              <div aria-hidden className="pointer-events-none absolute" style={mark.content} />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
