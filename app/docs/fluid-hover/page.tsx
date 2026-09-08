"use client";

import { type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PlainVsFluidDemo, ShowTheMathDemo, AxesDemo } from "./demos";

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
      installSlug="use-proximity-hover"
      installNote="Installs the useProximityHover hook. Every list, menu, strip, and grid in the library hovers with it."
      description="1 highlight per list. It springs to the item nearest the cursor, so every menu, table, strip, and grid hovers the same way."
    >
      <DocSection title="Nearest, not hovered">
        <p className="text-body leading-relaxed text-muted-foreground">
          Same 5 rows, same 4px gaps. The left lights the row under the
          cursor and nothing else. The right lights the nearest row, and
          travels to it on <Code>spring.fast</Code> instead of blinking.
        </p>
        <PlainVsFluidDemo />
      </DocSection>

      <DocSection title="Show the math">
        <p className="text-body leading-relaxed text-muted-foreground">
          Dots mark each row&apos;s center. Dashed lines sit halfway between
          neighbours: cross one and the highlight flips. The number is the
          distance from the cursor to the winning center. Move above the
          first row or below the last and the nearest row still wins.
        </p>
        <ShowTheMathDemo />
      </DocSection>

      <DocSection title="3 axes">
        <p className="text-body leading-relaxed text-muted-foreground">
          <Code>y</Code> for lists, <Code>x</Code> for strips,{" "}
          <Code>xy</Code> for grids. Pass the axis and the hook measures the
          matching distance: one coordinate for a list or a strip, the
          straight line to each center for a grid.
        </p>
        <AxesDemo />
      </DocSection>
    </DocPage>
  );
}
