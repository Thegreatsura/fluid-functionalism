"use client";

import { useEffect, useState } from "react";
import type { ComponentEntry } from "@/lib/docs/components";
import { previewMap } from "@/app/components/bento-previews";
import { BentoCard } from "@/app/components/bento-card";
import { cn } from "@/lib/utils";

/**
 * Band layout. At xl (3 cols) the grid reads as horizontal bands: each 2-wide
 * card (medium/large) pairs with smalls filling the remaining column — a
 * large (2 rows) takes two smalls, a medium takes one. `side: "right"` pins
 * that band's wide card to columns 2–3 (xl:col-start-2); the dense auto-flow
 * backfills column 1 with the neighboring smalls, so the wide card alternates
 * left/right band by band.
 *
 * The size mix is balanced so the grid fills with NO holes at both md and xl:
 * smalls needed = 2·(larges) + 1·(mediums) = 2·6 + 3 = 15 = smalls available
 * (and an even small count keeps md's half-width pairs complete). Adding a
 * card or changing a gridSize breaks that equation — rebalance before
 * shipping or the bottom rows develop holes again.
 */
const displayOrder: { slug: string; side?: "right" }[] = [
  { slug: "input-message" },                 // band 1 · medium left
  { slug: "thinking-indicator" },
  { slug: "sidebar", side: "right" },        // band 2 · large right
  { slug: "radio-group" },
  { slug: "chat-message" },
  { slug: "card" },                          // band 3 · large left
  { slug: "switch" },
  { slug: "select" },
  { slug: "thinking-steps", side: "right" }, // band 4 · large right
  { slug: "tabs-subtle" },
  { slug: "checkbox-group" },
  { slug: "ask-user-questions" },            // band 5 · large left
  { slug: "slider" },
  { slug: "dropdown" },
  { slug: "tabs", side: "right" },           // band 6 · medium right
  { slug: "input-copy" },
  { slug: "accordion" },                     // band 7 · large left
  { slug: "input-group" },
  { slug: "button" },
  { slug: "table", side: "right" },          // band 8 · medium right
  { slug: "dialog" },
  { slug: "color-picker" },                  // band 9 · large left
  { slug: "tooltip" },
  { slug: "badge" },
];

/**
 * Column count driven from React state (not just CSS breakpoints) so the
 * cards can FLIP-animate between grid layouts. A pure media-query change
 * reflows the grid outside React's commit, which means framer-motion never
 * sees the "before" positions and the re-slot snaps. By applying the column
 * template in the render that follows the matchMedia flip, the layout change
 * happens inside the commit and each card animates from its old slot.
 *
 * `null` = pre-hydration: the SSR markup keeps the plain responsive classes
 * (identical computed layout), so there is no first-paint flash on any
 * viewport and no animation on mount.
 */
function useGridCols(): 1 | 2 | 3 | null {
  const [cols, setCols] = useState<1 | 2 | 3 | null>(null);

  useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)");
    const xl = window.matchMedia("(min-width: 1280px)");
    // A window resize listener (reading mq.matches) rather than MediaQueryList
    // "change" events: same signal in real browsers, but it also fires under
    // synthetic resize dispatch, which emulated/test environments rely on.
    // setCols with an unchanged value skips the re-render, so per-frame resize
    // events inside a breakpoint band cost nothing.
    const update = () => setCols(xl.matches ? 3 : md.matches ? 2 : 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return cols;
}

interface BentoGridProps {
  components: ComponentEntry[];
}

export function BentoGrid({ components }: BentoGridProps) {
  const componentMap = new Map(components.map((c) => [c.slug, c]));
  const ordered = displayOrder.flatMap(({ slug, side }) => {
    const entry = componentMap.get(slug);
    return entry ? [{ entry, side }] : [];
  });
  const cols = useGridCols();

  return (
    <div
      className={cn(
        "grid gap-3 bento-grid",
        cols === null && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      )}
      style={
        cols !== null
          ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {ordered.map(({ entry: c, side }) => {
        const Preview = previewMap[c.slug];
        if (!Preview) return null;
        return (
          <BentoCard
            key={c.slug}
            slug={c.slug}
            name={c.name}
            isNew={c.isNew}
            gridSize={c.gridSize}
            className={side === "right" ? "xl:col-start-2" : undefined}
            // A whole app shell needs more of the card than the default
            // 24px/64px stage padding leaves it, in both directions.
            previewClassName={c.slug === "sidebar" ? "px-4 py-8" : undefined}
            animateLayout
          >
            <Preview />
          </BentoCard>
        );
      })}
    </div>
  );
}
