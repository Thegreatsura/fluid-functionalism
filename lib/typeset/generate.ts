// The prose stylesheet (`.typeset`) as data, then as CSS or as the registry
// item's `css` object. One path for every consumer: the registry build and
// globals.css (scripts/generate-type-scale.mjs) and the Copy prompt output of
// the playground on /docs/typography. No imports, so node can load this file
// directly; the type scale comes in as an argument, for the px fallbacks.
//
// Nothing to tune: markdown sets in the site's own styles and spacing, read
// from the type scale tokens, so it never looks different from the rest.

/** `semibold` and `bold` from registry/default/lib/font-weight.ts, copied
 *  because this file can't import (tests/type-scale.test.mjs keeps them equal). */
export const SEMIBOLD = "'wght' 550, 'opsz' 18";
export const BOLD = "'wght' 700, 'opsz' 25";

/** The shape of `typeScale` in registry/default/lib/type-scale.ts. */
export type TypeScaleData = Record<
  string,
  Record<"default" | "compact", { size: number; leading: number }>
>;

type Step = "default" | "compact";
type Decls = Record<string, string>;
type Rule = [selector: string, decls: Decls];

/** The styles prose sets in: h1 display, h2 title, h3 to h6 subtitle,
 *  paragraphs body, figcaption and code caption. Micro stays out: it sizes
 *  key caps, counters, and initials inside components. */
export const TYPESET_ROLES = ["display", "title", "subtitle", "body", "caption"] as const;

/** Room between blocks in px: 12px between paragraphs and 8px under a
 *  title, as on the site's doc pages, then 24px above a section and 20px
 *  above a sub-heading. Compact steps them down, list items aside. The
 *  Spacing table on /docs/typography reads them from here. */
export const TYPESET_SPACE = {
  /** Between blocks: paragraphs, lists, quotes, code, tables, media. */
  block: { default: 12, compact: 8 },
  /** Below a heading, and above a figcaption. */
  heading: { default: 8, compact: 4 },
  /** Above h1 and h2. */
  section: { default: 24, compact: 16 },
  /** Above h3 to h6. */
  subsection: { default: 20, compact: 12 },
  /** Both sides of an hr. */
  rule: { default: 24, compact: 16 },
  /** Between list items, and inside an item. */
  item: { default: 4, compact: 4 },
} as const;

/** Split a selector list at its top-level commas (not the ones inside
 *  `:is(…)`). Also used by the docs inspector to name the rule it traced. */
export function selectorList(sel: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < sel.length; i++) {
    if (sel[i] === "(") depth++;
    else if (sel[i] === ")") depth--;
    else if (sel[i] === "," && depth === 0) {
      parts.push(sel.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(sel.slice(start).trim());
  return parts;
}

// Every element rule puts its whole selector inside `.typeset`, in a single
// :where(), so nothing outside the sheet can match part of it: an outer list
// doesn't make a first-level list "nested", and a .not-typeset wrapper around
// a page doesn't switch a .typeset inside it off. The opt-out is a
// zero-specificity :not(:where(…)) too, so the whole sheet sits at
// specificity 0 inside @layer components: any utility wins.
const inSheet = (sel: string) =>
  selectorList(sel)
    .map((part) => `.typeset ${part}`)
    .join(", ");
const OPT_OUT = ":not(:where(.typeset .not-typeset, .typeset .not-typeset *))";
const el = (sel: string) => `:where(${inSheet(sel)})${OPT_OUT}`;
// Rhythm still reaches an opted-out root, so it sits in the flow like any
// block; only what's inside it is left alone.
const flowEl = (sel: string) => `:where(${inSheet(sel)}):not(:where(.typeset .not-typeset *))`;

/** Block elements that take the paragraph rhythm. `.tableWrapper` is
 *  Tiptap's table wrapper. Plain divs are left alone: inside prose they're
 *  usually the inside of an embedded component, which spaces itself. */
const BLOCKS = "p, ul, ol, pre, blockquote, figure, table, .typeset-scroll, .tableWrapper, img, video";

const ANY_HEADING = "h1, h2, h3, h4, h5, h6";

const v = (name: string) => `var(--typeset-${name})`;

/** The sheet's own variables at one step: each role's size and line height
 *  from the type scale tokens (px fallbacks, so it works without them), and
 *  the spacing. Every value is a whole pixel. */
function stepDecls(scale: TypeScaleData, step: Step): Decls {
  const s = step === "compact" ? "-compact" : "";
  const d: Decls = {};
  for (const role of TYPESET_ROLES) {
    const { size, leading } = scale[role][step];
    d[`--typeset-${role}`] = `var(--fs-${role}${s}, ${size}px)`;
    d[`--typeset-${role}-leading`] = `var(--lh-${role}${s}, ${leading}px)`;
  }
  for (const [name, px] of Object.entries(TYPESET_SPACE)) {
    d[`--typeset-space-${name}`] = `${px[step]}px`;
  }
  return d;
}

const FOREGROUND = "var(--foreground, currentColor)";
const MUTED = "var(--muted-foreground, color-mix(in oklab, currentColor 65%, transparent))";
const BORDER = "var(--border, color-mix(in oklab, currentColor 14%, transparent))";
const WASH = "color-mix(in oklab, currentColor 7%, transparent)";

export function typesetRules(scale: TypeScaleData): Rule[] {
  return [
    [
      ":where(.typeset)",
      {
        ...stepDecls(scale, "default"),
        "font-size": v("body"),
        "line-height": v("body-leading"),
        // Text in the muted color, as on the site; headings, links, code,
        // and table headers take the foreground.
        color: MUTED,
        "overflow-wrap": "break-word",
        // A host like ChatMessage keeps whitespace (pre-wrap); markdown puts
        // newlines between blocks, which would render as blank lines.
        "white-space": "normal",
      },
    ],
    // The compact step: compact roles, tighter spacing. On the .typeset
    // element itself, since .typeset sets the default step.
    [":where(.typeset.typeset-compact)", stepDecls(scale, "compact")],

    // Rhythm: space only above an element that follows another, never below
    // the last one, so appending content (streaming) never moves what's
    // already on screen. No :last-child, no :has(), and no text-wrap
    // pretty or balance: both re-wrap earlier lines as text arrives.
    //
    // Every rule sits at specificity 0, so source order decides. The general
    // rhythm comes first, then each case it must not win.
    [el(`${BLOCKS}, ${ANY_HEADING}, li`), { margin: "0" }],
    // Plain wrapping even where a base layer balances headings or makes
    // paragraphs pretty. The longhand, so a <pre> keeps its nowrap mode.
    [el(`p, li, ${ANY_HEADING}`), { "text-wrap-style": "auto" }],
    [flowEl(`* + :is(${BLOCKS}, .not-typeset)`), { "margin-top": v("space-block") }],
    // More room above a heading than between paragraphs, less below it.
    [el("* + :is(h1, h2)"), { "margin-top": v("space-section") }],
    [el("* + :is(h3, h4, h5, h6)"), { "margin-top": v("space-subsection") }],
    [flowEl(`:is(${ANY_HEADING}) + *`), { "margin-top": v("space-heading") }],
    // A rule takes the same room on both sides.
    [el("hr"), { border: "0", "border-top": `1px solid ${BORDER}`, "margin-top": v("space-rule") }],
    [flowEl("hr + *"), { "margin-top": v("space-rule") }],

    [el(ANY_HEADING), { color: FOREGROUND, "font-variation-settings": SEMIBOLD }],
    [
      el("h1"),
      { "font-size": v("display"), "line-height": v("display-leading"), "font-variation-settings": BOLD },
    ],
    [el("h2"), { "font-size": v("title"), "line-height": v("title-leading") }],
    [el("h3, h4, h5, h6"), { "font-size": v("subtitle"), "line-height": v("subtitle-leading") }],

    [el("strong, b"), { "font-variation-settings": SEMIBOLD }],
    [
      el("a"),
      {
        color: FOREGROUND,
        "text-decoration-line": "underline",
        "text-decoration-color": "color-mix(in oklab, currentColor 35%, transparent)",
        "text-underline-offset": "0.2em",
        transition: "text-decoration-color 80ms ease-out",
      },
    ],
    [el("a:hover"), { "text-decoration-color": "currentColor" }],

    [el("ul, ol"), { "padding-left": "1.25em" }],
    // Bullets as text with one space after, the same as a number's ". ":
    // the built-in disc gets a wider gap, so it sat further from its text.
    [el("ul"), { "list-style-type": '"• "' }],
    [el("ol"), { "list-style-type": "decimal" }],
    // Nested numbers outline the way Notion and Docs do: 1. → a. → i., then
    // the cycle repeats, so a level never reads like its parent.
    [el("ol ol"), { "list-style-type": "lower-alpha" }],
    [el("ol ol ol"), { "list-style-type": "lower-roman" }],
    [el("ol ol ol ol"), { "list-style-type": "decimal" }],
    [el("ol ol ol ol ol"), { "list-style-type": "lower-alpha" }],
    [el("ol ol ol ol ol ol"), { "list-style-type": "lower-roman" }],
    [el("ul ul"), { "list-style-type": '"◦ "' }],
    // Pseudo-elements can't sit inside :where(), so the marker goes after it.
    [`${el("li")}::marker`, { color: MUTED }],
    // List rhythm, inside items too. `li > div > …` is a Tiptap to-do, whose
    // text and nested list sit in a content div.
    [
      el("li + li, li > ul, li > ol, li > p + p, li > div > ul, li > div > ol, li > div > p + p"),
      { "margin-top": v("space-item") },
    ],
    // Task lists, where the checkbox is the marker. Markdown renderers emit
    // GFM's classes (remark-gfm); Tiptap marks the list with data-type and
    // puts the checkbox in a label next to a content div. Its editor view
    // drops data-type from the items, so they're matched through the list.
    [el('.contains-task-list, ul[data-type="taskList"]'), { "list-style-type": "none", "padding-left": "0" }],
    [el(".contains-task-list .contains-task-list"), { "padding-left": "1.5em" }],
    // A 1em box plus a 0.25em gap lands to-do text on the list indent
    // (1.25em) at every size, and the box scales with the text.
    [
      el("input[type=checkbox]"),
      { margin: "0", width: "1em", height: "1em", "accent-color": FOREGROUND },
    ],
    [el(".task-list-item > input[type=checkbox]"), { "margin-right": "0.25em", "vertical-align": "-0.125em" }],
    [el('ul[data-type="taskList"] > li'), { display: "flex", gap: "0.25em", "align-items": "flex-start" }],
    // One line box tall, so the box centers on the first line of the item.
    [
      el('ul[data-type="taskList"] > li > label'),
      { flex: "none", display: "flex", "align-items": "center", height: v("body-leading"), "user-select": "none" },
    ],
    [el('ul[data-type="taskList"] > li > div'), { flex: "1 1 auto", "min-width": "0" }],
    // Only the checked item's own text: a nested list of sub-tasks keeps its
    // own state, since a strike-through can't be undone by descendants.
    [
      el('ul[data-type="taskList"] > li[data-checked="true"] > div > :not(ul, ol)'),
      { color: MUTED, "text-decoration-line": "line-through", "text-decoration-color": "color-mix(in oklab, currentColor 50%, transparent)" },
    ],

    [
      el("blockquote"),
      {
        "padding-left": "1em",
        "border-left": `2px solid ${BORDER}`,
        color: MUTED,
      },
    ],

    // Code and keys set in caption, code in the foreground like the site's
    // code chips. In a heading they keep its scale, a notch down, so a
    // `## The cn() helper` doesn't drop to caption.
    [
      el("code"),
      {
        color: FOREGROUND,
        "font-size": v("caption"),
        "font-family": "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
      },
    ],
    [
      el(":not(pre) > code"),
      { "background-color": WASH, "border-radius": "4px", padding: "0.1em 0.3em" },
    ],
    [
      el("pre"),
      {
        "font-size": v("caption"),
        "line-height": v("caption-leading"),
        "background-color": WASH,
        "border-radius": "8px",
        padding: "0.75em 1em",
        "overflow-x": "auto",
      },
    ],
    [el("pre code"), { "font-size": "1em", background: "none", padding: "0" }],

    [
      el("kbd"),
      {
        "font-family": "inherit",
        "font-size": v("caption"),
        padding: "0.1em 0.35em",
        "border-radius": "4px",
        border: `1px solid ${BORDER}`,
        "box-shadow": `0 1px 0 ${BORDER}`,
      },
    ],
    [el(`:is(${ANY_HEADING}) :is(code, kbd)`), { "font-size": "round(nearest, 0.875em, 1px)" }],

    [el("table"), { width: "100%", "border-collapse": "collapse", "font-variant-numeric": "tabular-nums" }],
    [
      el("th, td"),
      {
        "text-align": "left",
        "vertical-align": "top",
        padding: "0.5em 0.75em",
        "border-bottom": `1px solid ${BORDER}`,
      },
    ],
    [el("th:first-child, td:first-child"), { "padding-left": "0" }],
    [el("th"), { color: FOREGROUND, "font-variation-settings": SEMIBOLD }],
    // A wrapped table scrolls sideways instead of squeezing its columns.
    // .tableWrapper is Tiptap's table wrapper.
    [el(".typeset-scroll, .tableWrapper"), { "overflow-x": "auto" }],
    [el(".typeset-scroll > table, .tableWrapper > table"), { "min-width": "max-content" }],

    [el("img, video"), { "max-width": "100%", height: "auto", "border-radius": "8px" }],
    [
      el("figcaption"),
      {
        "margin-top": v("space-heading"),
        "font-size": v("caption"),
        "line-height": v("caption-leading"),
        color: MUTED,
      },
    ],
  ];
}

/** The sheet as CSS text, wrapped in @layer components. */
export function generateTypesetCss(scale: TypeScaleData): string {
  const body = typesetRules(scale)
    .map(([sel, decls]) => {
      const lines = Object.entries(decls).map(([k, val]) => `    ${k}: ${val};`);
      return `  ${sel} {\n${lines.join("\n")}\n  }`;
    })
    .join("\n\n");
  return (
    "/* Fluid Functionalism typeset: https://www.fluidfunctionalism.com/docs/typography */\n" +
    `@layer components {\n${body}\n}\n`
  );
}

/** The sheet as a shadcn registry `css` object. */
export function typesetRegistryCss(scale: TypeScaleData): Record<string, Record<string, Decls>> {
  const layer: Record<string, Decls> = {};
  for (const [sel, decls] of typesetRules(scale)) {
    layer[sel] = { ...(layer[sel] ?? {}), ...decls };
  }
  return { "@layer components": layer };
}
