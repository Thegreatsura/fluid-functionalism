"use client";

import { type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import {
  PlainVsFluidDemo,
  ShowTheMathDemo,
  AxesDemo,
  CostDemo,
} from "./demos";

/** Inline code chip used throughout the prose. */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-caption text-foreground">
      {children}
    </code>
  );
}

export default function FluidHoverDoc() {
  return (
    <DocPage
      title="Fluid Hover"
      slug="fluid-hover"
      installSlug="use-fluid-hover"
      installNote="Installs the useFluidHover hook. Every list, menu, strip, and grid in the library hovers with it."
      description="Hover that never blinks and always follows your cursor to the nearest item."
    >
      <DocSection title="Blink or glide">
        <p className="text-body leading-relaxed text-muted-foreground">
          Watch both cursors. The left blinks off and on 9 times per pass,
          and each blink pulls your eye back to the list. The right glides
          once, and your eye stays on the task.
        </p>
        <PlainVsFluidDemo />
      </DocSection>

      <DocSection title="Show the math">
        <p className="text-body leading-relaxed text-muted-foreground">
          1 rule, no hit boxes: the nearest dot wins. Flip the switch and
          that is the whole algorithm.
        </p>
        <ShowTheMathDemo />
      </DocSection>

      <DocSection title="3 axes">
        <p className="text-body leading-relaxed text-muted-foreground">
          Menus, tabs, and card grids all feel the same under the cursor.
          Pass <Code>y</Code>, <Code>x</Code>, or <Code>xy</Code> and the
          highlight follows you down the list, across the strip, or to the
          closest card.
        </p>
        <AxesDemo />
      </DocSection>

      <DocSection title="What it costs">
        <p className="text-body leading-relaxed text-muted-foreground">
          1 element, 1 transform, 1 loop per move. 200 rows below: hover and
          watch the meter.
        </p>
        <CostDemo />
      </DocSection>

      <DocSection title="Reduced motion">
        <p className="text-body leading-relaxed text-muted-foreground">
          The highlight respects the OS setting on its own. Turn on reduced
          motion and the travel drops out: the highlight still fades in on
          the nearest row, it just stops sliding between rows. No{" "}
          <Code>{`<MotionConfig>`}</Code> needed, so a copied component
          behaves the same in your app.
        </p>
      </DocSection>
    </DocPage>
  );
}
