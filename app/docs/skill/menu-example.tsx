"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import { Check } from "lucide-react";
import { Compare, FakeCursor, usePlayback, type Side } from "./hero-shared";
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
// picked row, and a weight change that moves nothing. One scripted cursor
// plays the generic list, then the skill list, turn by turn; a real pointer
// takes over while it is inside.
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
const ROW_GAP = 0;
const LIST_PAD = 8;
const CURSOR_X = 150;
const rowTop = (i: number) => LIST_PAD + i * (ROW_H + ROW_GAP);
const rowCenter = (i: number) => rowTop(i) + ROW_H / 2;

/** One turn: glide to a row, sometimes click it. The generic side plays it,
 *  then the skill side plays the same turn. Durations in seconds. */
const TURN: Array<{ row: number; duration: number; click?: boolean }> = [
  { row: 3, duration: 1.1, click: true },
  { row: 0, duration: 0.9, click: true },
  { row: 4, duration: 0.5 },
  { row: 1, duration: 0.6, click: true },
];
const HOLD_MS = 600;
/** Where the cursor enters each turn: just inside the top padding. */
const CURSOR_START = 2;

/** Which row a y (in list coordinates) is inside, or null in a gap or the
 *  padding. This is what plain :hover reports. */
function rowUnder(y: number): number | null {
  if (y < LIST_PAD) return null;
  const i = Math.floor((y - LIST_PAD) / (ROW_H + ROW_GAP));
  const within = y - rowTop(i) < ROW_H;
  return i < ROWS.length && within ? i : null;
}

const rowBase =
  "relative z-10 flex h-9 w-full shrink-0 items-center gap-2 px-3 text-left text-body text-foreground outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]";

function Count({ n }: { n: number }) {
  return <span className="text-caption tabular-nums text-muted-foreground">{n}</span>;
}

/** Generic: :hover per row with no transition, font-weight bold that
 *  widens the label, and a selected background that jumps. */
function GenericList({
  fakeHover,
  selected,
  onSelect,
  cursor,
}: {
  fakeHover: number | null;
  selected: number;
  onSelect: (i: number) => void;
  cursor: { y: MotionValue<number>; scale: MotionValue<number> } | null;
}) {
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
            // is what the eye lands on.
            "hover:bg-selected",
            selected === i && "bg-selected/50 font-bold dark:bg-accent/40",
            fakeHover === i && "bg-selected dark:bg-selected",
            shape.item
          )}
        >
          {label}
          <Count n={count} />
          {/* Static check: pops in and out with the selection. */}
          {selected === i && <Check className="ml-auto size-4 shrink-0" strokeWidth={2} />}
        </button>
      ))}
      {cursor && <FakeCursor x={CURSOR_X} {...cursor} />}
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
  cursor,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  hover: ReturnType<typeof useFluidHover>;
  selected: number;
  onSelect: (i: number) => void;
  cursor: { y: MotionValue<number>; scale: MotionValue<number> } | null;
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
      {cursor && <FakeCursor x={CURSOR_X} {...cursor} />}
    </div>
  );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function MenuExample() {
  const skillRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(skillRef);
  const { rootRef, playing: scripted, bind } = usePlayback();

  const [genericSelected, setGenericSelected] = useState(0);
  const [skillSelected, setSkillSelected] = useState(0);
  const [fakeHover, setFakeHover] = useState<number | null>(null);

  const y = useMotionValue(CURSOR_START);
  const scale = useMotionValue(1);
  const stepRef = useRef(0);
  const [side, setSide] = useState<Side>("generic");
  const sideRef = useRef<Side>("generic");

  // The fluid list sees the cursor enter at the start of its turn and leave
  // at the end, like a real pointer, so its highlight fades in fresh.
  // Handlers are a fresh object each render; the script reads them through a
  // ref so a re-render never restarts it mid-glide.
  const { handlers } = hover;
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const handoff = useCallback((next: Side) => {
    if (sideRef.current === "skill" && next !== "skill") handlersRef.current.onMouseLeave();
    if (next === "skill") handlersRef.current.onMouseEnter();
    sideRef.current = next;
    setSide(next);
    setFakeHover(null);
  }, []);

  // The script: an async loop over TURN, alternating sides, that resumes at
  // the step it left.
  useEffect(() => {
    if (!scripted) return;
    let cancelled = false;
    let current: AnimationPlaybackControls | null = null;
    handoff(sideRef.current);
    (async () => {
      while (!cancelled) {
        const step = TURN[stepRef.current];
        current = animate(y, rowCenter(step.row), { duration: step.duration, ease: "easeInOut" });
        await current;
        if (cancelled) return;
        if (step.click) {
          current = animate(scale, [1, 0.8, 1], { duration: 0.2 });
          (sideRef.current === "generic" ? setGenericSelected : setSkillSelected)(step.row);
          await current;
        }
        await wait(HOLD_MS);
        if (cancelled) return;
        stepRef.current = (stepRef.current + 1) % TURN.length;
        if (stepRef.current === 0) {
          // A turn played: the other side takes the next one, so after the
          // skill's turn the generic side starts over.
          handoff(sideRef.current === "skill" ? "generic" : "skill");
          y.set(CURSOR_START);
        }
      }
    })();
    return () => {
      cancelled = true;
      current?.stop();
      if (sideRef.current === "skill") handlersRef.current.onMouseLeave();
      setFakeHover(null);
    };
  }, [scripted, y, scale, handoff]);

  // Every frame of the cursor goes to the side whose turn it is: the generic
  // list gets what :hover would say, the fluid list a real mouse move.
  useMotionValueEvent(y, "change", (value) => {
    if (!scripted) return;
    if (sideRef.current === "generic") {
      setFakeHover(rowUnder(value));
      return;
    }
    const box = skillRef.current?.getBoundingClientRect();
    if (!box) return;
    handlers.onMouseMove({ clientX: box.left + CURSOR_X, clientY: box.top + value } as React.MouseEvent);
  });

  const cursor = scripted ? { y, scale } : null;
  const active = scripted ? side : null;

  return (
    <Compare
      rootRef={rootRef}
      bind={bind}
      bare
      active={active}
      generic={
        <GenericList
          fakeHover={scripted ? fakeHover : null}
          selected={genericSelected}
          onSelect={setGenericSelected}
          cursor={active === "generic" ? cursor : null}
        />
      }
      skill={
        <SkillList
          containerRef={skillRef}
          hover={hover}
          selected={skillSelected}
          onSelect={setSkillSelected}
          cursor={active === "skill" ? cursor : null}
        />
      }
    />
  );
}
