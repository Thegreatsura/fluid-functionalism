import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";

// Tailwind utilities reserved for the canonical-shadcn theme on /compare.
// See app/compare/shadcn-theme.css. These render as transparent outside
// `.shadcn-theme`; this rule blocks accidental use in FF components.
const SHADCN_RESERVED_REGEX =
  "\\b(bg|text|border|ring|hover:bg|hover:text|focus-visible:ring|focus:ring)-(primary|secondary|popover|primary-foreground|secondary-foreground|popover-foreground|destructive-foreground)(\\/[0-9]+)?\\b";

// Focus indicators must ride the --focus-ring token so every click area
// shows the same ring (see the @layer base :focus-visible fallback in
// app/globals.css). This catches color-bearing ring/outline/border utilities
// under focus variants that bypass the token: palette colors, white/black,
// and arbitrary values that aren't var(--focus-ring) — including the raw
// hex, which must go through the token form to stay themeable.
const FOCUS_PALETTE =
  "(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-[0-9]{2,3}";
const FOCUS_RING_REGEX = `\\bfocus(?:-visible|-within)?:(?:ring|outline|border)-(?:${FOCUS_PALETTE}|white|black|\\[(?!color:var\\(--focus-ring|var\\(--focus-ring))`;
const FOCUS_RING_MESSAGE =
  "Focus indicators must use the --focus-ring token — e.g. focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)].";

// A component owns its type: size comes from the ladder — a `size` prop, or
// the surrounding SizeProvider (see /docs/sizes). Overriding that with a raw
// px in className freezes one step of the ladder, so the text stops
// responding when the site size changes. Site chrome has the type-scale
// roles for this — text-site-display / -title / -subtitle / -body /
// -caption / -micro, generated into app/globals.css — and a component that
// genuinely wants a different step takes `size`.
//
// Deliberately scoped to className on FF components, not to every element:
// previews that mimic a component's internals with plain divs legitimately
// repeat the same px the component itself uses.
const FF_COMPONENT_REGEX =
  "^(Accordion|AskUser|Badge|Button|Card|Chat|Checkbox|Color|Dialog|Dropdown|Elevated|Input|Menu|Nav|Radio|Scroll|Select|Sidebar|Slider|Switch|Table|Tabs|Thinking|Tooltip)";
const HARDCODED_TYPE_REGEX = "\\btext-\\[[0-9]";
const HARDCODED_TYPE_MESSAGE =
  "Hardcoded font size on a component. Type follows the size ladder: pass `size`, or use a site type-scale role (text-site-caption / -body / -subtitle / -title / -display / -micro) so it tracks the site size step.";

// Inside the registry every size and leading comes from the type scale
// (/docs/typography): typeClass(role, variant), sizeClasses.type.<role>, or
// the literal role class with its var(--fs-*) / var(--lh-*) fallback. A raw
// text-[13px] or leading-[18px] is drift the scale can't reach, and a bare
// text-caption (or site-only text-site-caption) breaks in installs: stock
// tailwind-merge takes it for a color and drops it inside cn().
const REGISTRY_TYPE_REGEX = "\\btext-\\[[0-9]|\\bleading-\\[(?!var\\(--lh-)|(?:^|\\s)text-(?:site-)?(?:display|title|subtitle|body|caption|micro)(?:-compact)?(?:\\s|$)";
const REGISTRY_TYPE_MESSAGE =
  "Registry type comes from the type scale: typeClass(role, variant) / sizeClasses.type.<role> from @/lib/size-context, not a raw text-[Npx], leading-[…], or bare text-<role> class.";

const shadcnRestrictedRules = {
  "no-restricted-syntax": [
    "error",
    {
      selector: `Literal[value=/${SHADCN_RESERVED_REGEX}/]`,
      message:
        "Tailwind utility reserved for /compare's shadcn theme. Use FF tokens (bg-foreground, bg-card, bg-accent, bg-destructive, text-foreground, etc.) instead.",
    },
    {
      selector: `TemplateElement[value.raw=/${SHADCN_RESERVED_REGEX}/]`,
      message:
        "Tailwind utility reserved for /compare's shadcn theme. Use FF tokens instead.",
    },
    {
      selector: `Literal[value=/${FOCUS_RING_REGEX}/]`,
      message: FOCUS_RING_MESSAGE,
    },
    {
      selector: `TemplateElement[value.raw=/${FOCUS_RING_REGEX}/]`,
      message: FOCUS_RING_MESSAGE,
    },
    // `>` into the attribute, not a bare descendant: a component's own
    // className only. Without it the selector reaches through
    // `render={<span className="text-[13px]" />}` and flags the nested
    // element, which is a plain span rendering a row's internals.
    {
      selector: `JSXOpeningElement[name.name=/${FF_COMPONENT_REGEX}/] > JSXAttribute[name.name="className"] Literal[value=/${HARDCODED_TYPE_REGEX}/]`,
      message: HARDCODED_TYPE_MESSAGE,
    },
    {
      selector: `JSXOpeningElement[name.name=/${FF_COMPONENT_REGEX}/] > JSXAttribute[name.name="className"] TemplateElement[value.raw=/${HARDCODED_TYPE_REGEX}/]`,
      message: HARDCODED_TYPE_MESSAGE,
    },
  ],
};

const registryRestrictedRules = {
  "no-restricted-syntax": [
    ...shadcnRestrictedRules["no-restricted-syntax"],
    { selector: `Literal[value=/${REGISTRY_TYPE_REGEX}/]`, message: REGISTRY_TYPE_MESSAGE },
    { selector: `TemplateElement[value.raw=/${REGISTRY_TYPE_REGEX}/]`, message: REGISTRY_TYPE_MESSAGE },
  ],
};

export default [
  {
    ignores: [
      ".claude/**",
      ".next/**",
      "dist/**",
      "next-env.d.ts",
      "node_modules/**",
      "public/r/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Block shadcn-reserved Tailwind tokens in Fluid Functionalism code.
  // The canonical shadcn install (components/shadcn/**) and the /compare page
  // are explicitly exempt because they need these utilities by design.
  {
    files: ["**/*.{ts,tsx}"],
    ignores: [
      "components/shadcn/**",
      "app/compare/**",
      "app/components/shadcn-previews.tsx",
    ],
    rules: shadcnRestrictedRules,
  },
  // Registry sources: the shadcn rules plus the type-scale rule. A later
  // block replaces no-restricted-syntax wholesale, so this one repeats them.
  {
    files: ["registry/**/*.{ts,tsx}"],
    // The tailwind-merge list names the role utilities on purpose.
    ignores: ["registry/default/lib/utils.ts"],
    rules: registryRestrictedRules,
  },
];
