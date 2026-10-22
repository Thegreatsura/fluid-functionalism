"use client";

// The Reveal page is the source the rest follows. When its content, values,
// or classes change, update in the same change:
//  - skills/fluid-functionalism/references/custom-motion.md, "Page reveals"
//  - skills/fluid-functionalism/SKILL.md, the "Page reveals are 1 class" rule
//  - lib/docs/prompt-entries.ts `reveal` (then `node scripts/build-skill-craft.mjs`)
//  - lib/docs/api/reveal.ts (reference tables; values derive from the presets)
//  - motion-guidelines.md, "Page reveals"
//  - values: lib/reveal/presets.ts, then `npm run reveal-css` regenerates
//    app/globals.css and the `reveal` registry item (tests/reveal.test.ts)
//  - the Showcase (app/page.tsx + app/components/bento-grid.tsx) runs on
//    reveal-landing-subtle and reveal-scroll: check it still reads right

import { Fragment, type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PropsTable } from "@/lib/docs/PropsTable";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { PresetDemo } from "./demos";
import { apiReference } from "@/lib/docs/api/reveal";

/** Inline code chip used throughout the prose. */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-site-caption text-foreground">
      {children}
    </code>
  );
}

function Subtitle({ children }: { children: ReactNode }) {
  return (
    <h3
      className="mt-2 text-site-subtitle text-foreground"
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      {children}
    </h3>
  );
}

export default function RevealDoc() {
  return (
    <DocPage
      title="Reveal"
      slug="reveal"
      description="Page reveals in 1 class: a landing preset and a product preset, each with a subtle step."
    >
      <DocSection title="Landing">
        <p className="text-site-body text-muted-foreground">
          For a page read once. Add <Code>reveal-landing</Code> to the
          page&apos;s container: the hero plays on load, every section after it
          rises as it scrolls in, and each one leaves the same way at the top.
          Put everything on screen at first paint in the hero, product shot
          included, and keep the header and footer outside. For a grid, add{" "}
          <Code>reveal-scroll</Code> to each card so every card is a section of
          its own, and once more inside it so the content follows its card. The
          Showcase does both.
        </p>
        <PresetDemo preset="Landing" />
      </DocSection>

      <DocSection title="Product">
        <p className="text-site-body text-muted-foreground">
          For the app people come back to. Add <Code>reveal-product</Code> to
          the main column: every block fades in on load, and nothing moves on
          scroll. Keep the sidebar outside.
        </p>
        <PresetDemo preset="Product" />
        <p className="text-site-body text-muted-foreground">
          Slow data shows shadcn&apos;s <Code>Skeleton</Code>, installed with
          the preset. Wrap the skeleton and the real block in{" "}
          <Code>reveal-swap</Code> to crossfade them, and add{" "}
          <Code>reveal-items</Code> to both so rows hand over one by one.
        </p>
      </DocSection>

      <DocSection title="Good to know">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground">
          <li className="pl-1 text-site-body text-muted-foreground">
            Just CSS on <Code>spring.slow</Code>: no JavaScript to load, nothing
            to hydrate.
          </li>
          <li className="pl-1 text-site-body text-muted-foreground">
            Sections and cards already on screen when the page loads play right
            after the hero, a step apart.
          </li>
          <li className="pl-1 text-site-body text-muted-foreground">
            Browsers without scroll timelines show landing sections still.
          </li>
          <li className="pl-1 text-site-body text-muted-foreground">
            Reduced motion keeps the fades and drops the rest: no rise, no
            scale, no scroll motion, no pulse.
          </li>
        </ul>
      </DocSection>

      <DocSection title="Reference">
        {apiReference.map((table) => (
          <Fragment key={table.title}>
            <Subtitle>{table.title}</Subtitle>
            <PropsTable props={table.props} />
          </Fragment>
        ))}
      </DocSection>
    </DocPage>
  );
}
