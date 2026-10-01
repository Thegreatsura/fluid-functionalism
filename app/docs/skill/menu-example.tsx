"use client";

import { useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import {
  Compare,
  clickStep,
  glideStep,
  turns,
  useLoop,
  usePlayback,
  useScriptCursor,
  type Side,
} from "./hero-shared";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { spring } from "@/registry/default/lib/springs";
import { cn } from "@/registry/default/lib/utils";
import { useShape } from "@/registry/default/lib/shape-context";
import {
  useFluidHover,
  useRegisterFluidHoverItem,
} from "@/registry/default/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";

// ---------------------------------------------------------------------------
// Menu example for /docs/skill: the same menu twice. Left is what
// an agent writes on its own: a per-row :hover that snaps on and off, a
// selected background that jumps, and a bold label that pushes its count. Right is
// what it writes with the skill: fluid hover, a selection that springs to the
// picked row, and a weight change that moves nothing. The scripted cursor
// the other examples share plays the generic list, then the skill list, turn
// by turn. It hovers like a real pointer, so the left list's :hover and the
// right list's fluid hover both answer it; a real pointer takes over while
// it is inside.
// ---------------------------------------------------------------------------

const ROWS = [
  { label: "Inbox", count: 12 },
  { label: "Drafts", count: 3 },
  { label: "Sent", count: 48 },
  { label: "Archive", count: 210 },
  { label: "Trash", count: 7 },
];

/* Rows are h-9 (36px) stacked with no gap inside p-2 (8px), the same on
   both sides so the only difference is behavior. */
const ROW_H = 36;
const LIST_PAD = 8;
const rowTop = (i: number) => LIST_PAD + i * ROW_H;

/** One turn: glide to a row, sometimes click it. The generic side plays it,
 *  then the skill side plays the same turn. */
const TURN: Array<{ row: number; click?: boolean }> = [
  { row: 3, click: true },
  { row: 0, click: true },
  { row: 4 },
  { row: 1, click: true },
];
const HOLD_MS = 600;

const rowBase =
  "relative z-10 flex h-9 w-full shrink-0 items-center gap-2 px-3 text-left text-site-body text-foreground outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]";

function Count({ n }: { n: number }) {
  return <span className="text-site-caption tabular-nums text-muted-foreground">{n}</span>;
}

/** Generic: :hover per row with no transition, font-weight bold that
 *  widens the label, and a selected background that jumps. */
function GenericList({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  const shape = useShape();
  return (
    <div className="relative flex w-full flex-col p-2">
      {ROWS.map(({ label, count }, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            rowBase,
            // Hover louder than the selection: the cursor, not the pick,
            // is what the eye lands on. Scripted hover counts as hover.
            "[&:is(:hover,[data-script-hover])]:bg-selected dark:[&:is(:hover,[data-script-hover])]:bg-selected",
            selected === i && "bg-selected/50 font-bold dark:bg-accent/40",
            shape.item
          )}
        >
          {label}
          <Count n={count} />
          {/* Static check: pops in and out with the selection. */}
          {selected === i && <Check className="ml-auto size-4 shrink-0" strokeWidth={2} />}
        </button>
      ))}
    </div>
  );
}

function FluidRow({
  index,
  registerItem,
  selected,
  onSelect,
  label,
  count,
}: {
  index: number;
  registerItem: (index: number, element: HTMLElement | null) => void;
  selected: boolean;
  onSelect: (i: number) => void;
  label: string;
  count: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  return (
    <button ref={ref} type="button" onClick={() => onSelect(index)} className={rowBase}>
      {/* Ghost span: the invisible semibold copy holds the width, so the
          count never moves when the label gets heavier. */}
      <span className="inline-grid">
        <span
          className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80"
          style={{ fontVariationSettings: selected ? fontWeights.semibold : fontWeights.normal }}
        >
          {label}
        </span>
        <span
          aria-hidden="true"
          className="invisible col-start-1 row-start-1"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          {label}
        </span>
      </span>
      <Count n={count} />
      {/* Motion check, as in MenuItem: the path draws in on 0.08s and erases
          on 0.04s inside a fixed slot, so the row never changes width. */}
      <span className="ml-auto flex size-4 shrink-0 items-center justify-center">
        <AnimatePresence>
          {selected && (
            <motion.svg
              key="check"
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground"
              exit={{ opacity: 1 }}
            >
              <motion.path
                d="M4 12L9 17L20 6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1, transition: { duration: 0.08, ease: "easeOut" } }}
                exit={{ pathLength: 0, transition: { duration: 0.04, ease: "easeIn" } }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}

/** With the skill: one fluid highlight, a selected background that springs
 *  on the moderate tier, and weight without reflow. */
function SkillList({
  containerRef,
  hover,
  selected,
  onSelect,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  hover: ReturnType<typeof useFluidHover>;
  selected: number;
  onSelect: (i: number) => void;
}) {
  const shape = useShape();
  return (
    <div ref={containerRef} className="relative flex w-full flex-col p-2" {...hover.handlers}>
      <motion.div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-2 top-0 h-9 bg-selected/50 dark:bg-accent/40",
          shape.bg
        )}
        initial={false}
        animate={{ y: rowTop(selected) }}
        transition={spring.moderate}
      />
      <FluidHoverHighlight hover={hover} className={shape.bg} />
      {ROWS.map(({ label, count }, i) => (
        <FluidRow
          key={label}
          index={i}
          registerItem={hover.registerItem}
          selected={selected === i}
          onSelect={onSelect}
          label={label}
          count={count}
        />
      ))}
    </div>
  );
}

export function MenuExample() {
  const skillRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(skillRef);
  const { rootRef, playing, bind } = usePlayback();
  const cursor = useScriptCursor(rootRef, playing);
  const [generic, setGeneric] = useState(0);
  const [skill, setSkill] = useState(0);
  const [active, setActive] = useState<Side | null>(null);
  const select = (side: Side) => (side === "generic" ? setGeneric : setSkill);
  const row = (side: Side) => `[data-side="${side}"] button`;
  useLoop(
    playing,
    turns(setActive, (side) =>
      TURN.flatMap(({ row: i, click }) =>
        click
          ? clickStep(cursor, row(side), i, () => select(side)(i), HOLD_MS)
          : [glideStep(cursor, row(side), i, HOLD_MS)]
      )
    )
  );

  return (
    <Compare
      rootRef={rootRef}
      bind={bind}
      bare
      active={playing ? active : null}
      cursor={playing ? cursor : null}
      generic={<GenericList selected={generic} onSelect={setGeneric} />}
      skill={<SkillList containerRef={skillRef} hover={hover} selected={skill} onSelect={setSkill} />}
    />
  );
}
