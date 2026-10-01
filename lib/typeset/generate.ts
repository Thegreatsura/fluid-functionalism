// The prose stylesheet (`.typeset`) as data, then as CSS or as the registry
// item's `css` object. One path for every consumer: the registry build and
// globals.css (scripts/generate-type-scale.mjs) and the Copy prompt output of
// the playground on /docs/typography. No imports, so node can load this file
// directly; the type scale comes in as an argument.

/** `SEMIBOLD` from registry/default/lib/font-weight.ts, copied
 *  because this file can't import (tests/type-scale.test.mjs keeps them equal). */
export const SEMIBOLD = "'wght' 550, 'opsz' 18";

/** The four inputs. Everything else in the sheet derives from them; presets
 *  can also pin each heading level (see LEVEL_DEFAULTS). */
export interface TypesetValues {
  /** Base font size in px, or `null` to inherit the surrounding size. */
  size: number | null;
  /** Unitless line height for body text. */
  leading: number;
  /** Vertical rhythm multiplier: 1 puts one base em between paragraphs. */
  flow: number;
  /** Heading step: h3 = ratio, h2 = ratio², h1 = ratio³ (in base ems). */
  ratio: number;
}

export interface TypesetPreset extends TypesetValues {
  name: "docs" | "chat";
  label: string;
}

/** Defaults on `.typeset`: inherit the context, readable rhythm. */
export const TYPESET_DEFAULTS: TypesetValues = {
  size: null,
  leading: 1.6,
  flow: 1,
  ratio: 1.2,
};

export const TYPESET_PRESETS: TypesetPreset[] = [
  { name: "docs", label: "Docs", size: 15, leading: 1.65, flow: 1.1, ratio: 1.2 },
  { name: "chat", label: "Chat", size: null, leading: 1.5, flow: 0.75, ratio: 1.1 },
];

/** The shape of `typeScale` in registry/default/lib/type-scale.ts. */
export type TypeScaleData = Record<
  string,
  Record<"default" | "compact", { size: number; leading: number }>
>;

type Decls = Record<string, string>;
type Rule = [selector: string, decls: Decls];

/** One notch down the size ladder, the way compact steps every role: the
 *  base loses a pixel when it's set in px (an inheriting base already follows
 *  its compact context), lines get 0.05 tighter, the rhythm a fifth tighter. */
export function compactValues(v: TypesetValues): TypesetValues {
  return {
    size: v.size === null ? null : v.size - 1,
    leading: Math.round((v.leading - 0.05) * 1000) / 1000,
    flow: Math.round(v.flow * 0.8 * 1000) / 1000,
    ratio: v.ratio,
  };
}

// Every element rule reads `:where(.typeset) :where(<el>)` with the opt-out
// folded into a zero-specificity :not(:where(…)), so the whole sheet sits at
// specificity 0 inside @layer components: any utility wins.
const OPT_OUT = ":not(:where(.not-typeset, .not-typeset *))";
const el = (sel: string) => `:where(.typeset) :where(${sel})${OPT_OUT}`;
// Rhythm still reaches an opted-out root, so it sits in the flow like any
// block; only what's inside it is left alone.
const flowEl = (sel: string) => `:where(.typeset) :where(${sel}):not(:where(.not-typeset *))`;

/** Block elements that take the paragraph rhythm. */
const BLOCKS = "p, ul, ol, pre, blockquote, figure, table, .typeset-scroll, div, img, video";

const round = (n: number) => String(Math.round(n * 1000) / 1000);

function varsDecls(v: TypesetValues): Decls {
  return {
    "--typeset-size": v.size === null ? "1em" : `${v.size}px`,
    "--typeset-leading": round(v.leading),
    "--typeset-flow": round(v.flow),
    "--typeset-ratio": round(v.ratio),
  };
}

/** Compact never changes the ratio, and only touches the base size when
 *  it's set in px. */
function compactDecls(v: TypesetValues): Decls {
  const d = varsDecls(compactValues(v));
  delete d["--typeset-ratio"];
  if (v.size === null) delete d["--typeset-size"];
  return d;
}

// Each heading level and code read their own size (a multiple of the base em)
// and leading. By default the sizes follow the ratio; a preset can pin them,
// which is how .typeset-scale maps the levels onto the type roles.
const LEVEL_DEFAULTS: Decls = {
  "--typeset-h1": "calc(var(--typeset-ratio) * var(--typeset-ratio) * var(--typeset-ratio))",
  "--typeset-h2": "calc(var(--typeset-ratio) * var(--typeset-ratio))",
  "--typeset-h3": "var(--typeset-ratio)",
  "--typeset-h4": "1",
  "--typeset-h5": "1",
  "--typeset-h6": "0.875",
  "--typeset-h1-leading": "1.2",
  "--typeset-h2-leading": "1.25",
  "--typeset-h3-leading": "1.3",
  "--typeset-h4-leading": "var(--typeset-leading)",
  "--typeset-h5-leading": "var(--typeset-leading)",
  "--typeset-h6-leading": "var(--typeset-leading)",
  "--typeset-code": "0.875",
  "--typeset-code-leading": "1.6",
};

/** Which role sets each level in .typeset-scale, so markdown's six heading
 *  levels show all six roles. h4 is body set semibold. */
const SCALE_LEVELS = [
  ["h1", "display"],
  ["h2", "title"],
  ["h3", "subtitle"],
  ["h4", "body"],
  ["h5", "caption"],
  ["h6", "micro"],
] as const;

/** .typeset-scale at one ladder step, from the type scale data: the base is
 *  the body role, every level a role, code the caption role. */
function scaleDecls(scale: TypeScaleData, step: "default" | "compact", flow: number): Decls {
  const body = scale.body[step];
  const ratio = (role: string) => round(scale[role][step].size / body.size);
  const leading = (role: string) => round(scale[role][step].leading / scale[role][step].size);
  const d: Decls = {
    "--typeset-size": `var(--fs-body${step === "compact" ? "-compact" : ""}, ${body.size}px)`,
    "--typeset-leading": leading("body"),
    "--typeset-flow": round(flow),
  };
  for (const [level, role] of SCALE_LEVELS) {
    d[`--typeset-${level}`] = ratio(role);
    d[`--typeset-${level}-leading`] = leading(role);
  }
  d["--typeset-code"] = ratio("caption");
  d["--typeset-code-leading"] = leading("caption");
  return d;
}

/** Heading level size, for the space formula below. */
const H = {
  h1: "var(--typeset-h1)",
  h2: "var(--typeset-h2)",
  h3: "var(--typeset-h3)",
  h4: "var(--typeset-h4)",
  h5: "var(--typeset-h5)",
  h6: "var(--typeset-h6)",
  code: "var(--typeset-code)",
};

/** Space of `n` base ems inside an element whose font-size is `scale` base ems. */
const space = (n: number, scale?: string) =>
  scale
    ? `calc(var(--typeset-flow) * ${n}em / (${scale}))`
    : `calc(var(--typeset-flow) * ${n}em)`;

const MUTED = "var(--muted-foreground, color-mix(in oklab, currentColor 65%, transparent))";
const BORDER = "var(--border, color-mix(in oklab, currentColor 14%, transparent))";
const WASH = "color-mix(in oklab, currentColor 7%, transparent)";

export function typesetRules(
  values: TypesetValues = TYPESET_DEFAULTS,
  withPresets = true,
  scale?: TypeScaleData
): Rule[] {
  const rules: Rule[] = [
    [
      ":where(.typeset)",
      {
        ...varsDecls(values),
        ...LEVEL_DEFAULTS,
        "font-size": "var(--typeset-size)",
        "line-height": "var(--typeset-leading)",
        "overflow-wrap": "break-word",
      },
    ],
  ];

  if (withPresets) {
    for (const p of TYPESET_PRESETS) rules.push([`:where(.typeset-${p.name})`, varsDecls(p)]);
    if (scale) rules.push([":where(.typeset-scale)", scaleDecls(scale, "default", 1)]);
  }

  // Compact: one notch down, after every preset so it can override them.
  rules.push([":where(.typeset-compact)", compactDecls(values)]);
  if (withPresets) {
    for (const p of TYPESET_PRESETS) {
      rules.push([`:where(.typeset-${p.name}.typeset-compact)`, compactDecls(p)]);
    }
    if (scale) {
      rules.push([
        ":where(.typeset-scale.typeset-compact)",
        scaleDecls(scale, "compact", compactValues({ ...TYPESET_DEFAULTS, flow: 1 }).flow),
      ]);
    }
  }

  rules.push(
    // Rhythm: space only above an element that follows another, never below
    // the last one, so appending content (streaming) never moves what's
    // already on screen. No :last-child, no :has().
    [el(`${BLOCKS}, h1, h2, h3, h4, h5, h6, li`), { margin: "0" }],
    [flowEl(`* + :is(${BLOCKS}, .not-typeset)`), { "margin-top": space(1) }],

    [el("p"), { "text-wrap": "pretty" }],

    [
      el("h1, h2, h3, h4, h5, h6"),
      {
        color: "var(--foreground, currentColor)",
        "text-wrap": "balance",
        "font-variation-settings": SEMIBOLD,
      },
    ],
    [el("h1"), { "font-size": `calc(1em * ${H.h1})`, "line-height": "var(--typeset-h1-leading)" }],
    [el("h2"), { "font-size": `calc(1em * ${H.h2})`, "line-height": "var(--typeset-h2-leading)" }],
    [el("h3"), { "font-size": `calc(1em * ${H.h3})`, "line-height": "var(--typeset-h3-leading)" }],
    [el("h4"), { "font-size": `calc(1em * ${H.h4})`, "line-height": "var(--typeset-h4-leading)" }],
    [el("h5"), { "font-size": `calc(1em * ${H.h5})`, "line-height": "var(--typeset-h5-leading)" }],
    [el("h6"), { "font-size": `calc(1em * ${H.h6})`, "line-height": "var(--typeset-h6-leading)" }],
    // More room above a heading than between paragraphs, less below it.
    [el("* + h1"), { "margin-top": space(2, H.h1) }],
    [el("* + h2"), { "margin-top": space(2, H.h2) }],
    [el("* + h3"), { "margin-top": space(1.5, H.h3) }],
    [el("* + h4"), { "margin-top": space(1.5, H.h4) }],
    [el("* + h5"), { "margin-top": space(1.5, H.h5) }],
    [el("* + h6"), { "margin-top": space(1.5, H.h6) }],
    [el("h1 + *, h2 + *, h3 + *, h4 + *, h5 + *, h6 + *"), { "margin-top": space(0.5) }],

    [el("strong, b"), { "font-variation-settings": SEMIBOLD }],
    [
      el("a"),
      {
        color: "var(--foreground, currentColor)",
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
    [el("li + li, li > ul, li > ol, li > p + p"), { "margin-top": space(0.25) }],
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
      { margin: "0", width: "1em", height: "1em", "accent-color": "var(--foreground, currentColor)" },
    ],
    [el(".task-list-item > input[type=checkbox]"), { "margin-right": "0.25em", "vertical-align": "-0.125em" }],
    [el('ul[data-type="taskList"] > li'), { display: "flex", gap: "0.25em", "align-items": "flex-start" }],
    // One line box tall, so the box centers on the first line of the item.
    [
      el('ul[data-type="taskList"] > li > label'),
      { flex: "none", display: "flex", "align-items": "center", height: "calc(var(--typeset-leading) * 1em)", "user-select": "none" },
    ],
    [el('ul[data-type="taskList"] > li > div'), { flex: "1 1 auto", "min-width": "0", "margin-top": "0" }],
    [
      el('ul[data-type="taskList"] > li[data-checked="true"] > div'),
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

    [
      el("hr"),
      { border: "0", "border-top": `1px solid ${BORDER}`, "margin-top": space(2) },
    ],
    [el("hr + *"), { "margin-top": space(2) }],

    [
      el("code"),
      {
        "font-size": `calc(1em * ${H.code})`,
        "font-family":
          "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
      },
    ],
    [
      el(":not(pre) > code"),
      { "background-color": WASH, "border-radius": "4px", padding: "0.1em 0.3em" },
    ],
    [
      el("pre"),
      {
        "font-size": `calc(1em * ${H.code})`,
        "line-height": "var(--typeset-code-leading)",
        "background-color": WASH,
        "border-radius": "8px",
        padding: "0.75em 1em",
        "overflow-x": "auto",
      },
    ],
    [el("* + pre"), { "margin-top": space(1, H.code) }],
    [el("pre code"), { "font-size": "1em", background: "none", padding: "0" }],

    [
      el("kbd"),
      {
        "font-family": "inherit",
        "font-size": "0.85em",
        padding: "0.1em 0.35em",
        "border-radius": "4px",
        border: `1px solid ${BORDER}`,
        "box-shadow": `0 1px 0 ${BORDER}`,
      },
    ],

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
    // Code in a cell is usually an identifier: keep it whole (a token split at
    // its hyphen reads as two). A table too wide for it scrolls sideways.
    [el("th code, td code"), { "white-space": "nowrap" }],
    [el("th"), { color: "var(--foreground, currentColor)", "font-variation-settings": SEMIBOLD }],
    // .tableWrapper is Tiptap's table wrapper.
    [el(".typeset-scroll, .tableWrapper"), { "overflow-x": "auto" }],
    [el(".typeset-scroll > table"), { "min-width": "max-content" }],

    [el("img, video"), { "max-width": "100%", height: "auto", "border-radius": "8px" }],
    [el("figcaption"), { "margin-top": space(0.5), "font-size": "0.875em", color: MUTED }]
  );

  return rules;
}

/** The sheet as CSS text, wrapped in @layer components. */
export function generateTypesetCss(
  values: TypesetValues = TYPESET_DEFAULTS,
  withPresets = true,
  scale?: TypeScaleData
): string {
  const body = typesetRules(values, withPresets, scale)
    .map(([sel, decls]) => {
      const lines = Object.entries(decls).map(([k, v]) => `    ${k}: ${v};`);
      return `  ${sel} {\n${lines.join("\n")}\n  }`;
    })
    .join("\n\n");
  return (
    "/* Fluid Functionalism typeset: https://www.fluidfunctionalism.com/docs/typography */\n" +
    `@layer components {\n${body}\n}\n`
  );
}

/** The sheet as a shadcn registry `css` object. */
export function typesetRegistryCss(
  scale: TypeScaleData,
  values: TypesetValues = TYPESET_DEFAULTS
): Record<string, Record<string, Decls>> {
  const layer: Record<string, Decls> = {};
  for (const [sel, decls] of typesetRules(values, true, scale)) {
    layer[sel] = { ...(layer[sel] ?? {}), ...decls };
  }
  return { "@layer components": layer };
}
