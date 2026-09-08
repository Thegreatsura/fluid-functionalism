"use client";

import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { cn } from "@/registry/default/lib/utils";
import { useShape } from "@/registry/default/lib/shape-context";
import { useIcon } from "@/lib/icon-context";
import {
  useFluidHover,
  useRegisterFluidHoverItem,
  pickNearest,
} from "@/registry/default/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import { Switch } from "@/components/flavored/switch";
import { Tabs, TabsList, TabItem } from "@/registry/radix/tabs";
import { Dropdown } from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import {
  Card,
  CardGroup,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/registry/default/card";

// ---------------------------------------------------------------------------
// Fluid hover: the three demos on the /docs/fluid-hover page. Bare rows for the
// comparison and the math (nothing else competes with the mechanism), real
// components for the axes.
// ---------------------------------------------------------------------------

const ROWS = ["Inbox", "Drafts", "Sent", "Archive", "Trash"];

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const FLUID_HOVER_CODE = `import { useRef } from "react";
import { useFluidHover, useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";

// One list, one highlight. The hook picks the row whose center is nearest
// the cursor; the highlight springs to that row's rect on spring.fast.
function List({ rows }: { rows: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(containerRef);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1 p-2" {...hover.handlers}>
      {/* The highlight reads the hook: it sits on the nearest row and fades
          in fresh on every entry instead of sliding over from its last spot. */}
      <FluidHoverHighlight hover={hover} className="rounded-lg" />
      {rows.map((label, i) => (
        <Row key={label} index={i} registerItem={hover.registerItem}>{label}</Row>
      ))}
    </div>
  );
}

// Rows register their element; the hook measures them once per layout change.
function Row({ index, registerItem, children }) {
  const ref = useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  return <div ref={ref} className="relative z-10 flex h-9 items-center px-3">{children}</div>;
}`;

const MATH_CODE = `// Per mouse move (coalesced to one animation frame), for every row:
const center = rect.top + rect.height / 2;
const distance = Math.abs(cursorY - center);
if (distance < closestDistance) {
  closestDistance = distance;
  nearest = index;
}

// A row the cursor is inside always wins. Otherwise the nearest center does,
// so the cursor in a gap, in the padding, or past the last row still lands.
setActiveIndex(containing ?? nearest);`;

const AXES_CODE = `import { useFluidHover } from "@/hooks/use-fluid-hover";

// "y" (default): lists. Nearest by the vertical center, top + height / 2.
useFluidHover(containerRef);

// "x": strips. Nearest by the horizontal center, left + width / 2.
useFluidHover(containerRef, { axis: "x" });

// "xy": grids. Nearest center by straight-line distance across rows and columns.
useFluidHover(containerRef, { axis: "xy" });`;

// ---------------------------------------------------------------------------
// Shared bare-row pieces
// ---------------------------------------------------------------------------

const rowClass =
  "relative z-10 flex h-9 shrink-0 items-center px-3 text-body text-foreground";

function FluidRow({
  index,
  registerItem,
  children,
}: {
  index: number;
  registerItem: (index: number, element: HTMLElement | null) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  return (
    <div ref={ref} className={rowClass}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo 1: plain :hover next to fluid hover
//
// Two scripted cursors ride the same clock down and up both lists, through
// the gaps and past the last row, so the difference shows without the reader
// moving. The plain list's cursor toggles a fake :hover on whichever row it
// is inside; the fluid list's cursor feeds real mouse coordinates into the
// hook, so the right-hand highlight is the library's own behaviour. A real
// pointer inside the demo takes over; the script resumes when it leaves.
// ---------------------------------------------------------------------------

/* Geometry the cursors ride: rows are h-9 (36px) in a gap-1 (4px) column
   inside p-2 (8px). The cursor turns around 2px inside the padding at both
   ends, so it spends a beat above the first row and below the last. */
const ROW_H = 36;
const ROW_GAP = 4;
const LIST_PAD = 8;
const CURSOR_X = 120;
const CURSOR_TOP = 2;
const CURSOR_BOTTOM =
  LIST_PAD * 2 + ROWS.length * ROW_H + (ROWS.length - 1) * ROW_GAP - 2;
/** One pass is three round trips, each faster than the last: reading
 *  speed, pointing speed, then a flick. Seconds per leg. */
const CURSOR_SLOW_LEG_S = 2;
const CURSOR_FAST_LEG_S = 0.8;
const CURSOR_FLICK_LEG_S = 0.3;
const CURSOR_KEYFRAMES = [
  CURSOR_TOP,
  CURSOR_BOTTOM,
  CURSOR_TOP,
  CURSOR_BOTTOM,
  CURSOR_TOP,
  CURSOR_BOTTOM,
  CURSOR_TOP,
];
const CURSOR_LEGS_S = [
  CURSOR_SLOW_LEG_S,
  CURSOR_SLOW_LEG_S,
  CURSOR_FAST_LEG_S,
  CURSOR_FAST_LEG_S,
  CURSOR_FLICK_LEG_S,
  CURSOR_FLICK_LEG_S,
];
const CURSOR_PASS_S = CURSOR_LEGS_S.reduce((a, b) => a + b, 0);
/** Keyframe offsets (0..1) where each leg ends. */
const CURSOR_TIMES = CURSOR_LEGS_S.reduce<number[]>(
  (acc, leg) => [...acc, acc[acc.length - 1] + leg / CURSOR_PASS_S],
  [0]
);

/** Which row a y (in list coordinates) is inside, or null in a gap or the
 *  padding. This is what plain :hover would report. */
function rowUnder(y: number): number | null {
  if (y < LIST_PAD) return null;
  const i = Math.floor((y - LIST_PAD) / (ROW_H + ROW_GAP));
  const within = y - LIST_PAD - i * (ROW_H + ROW_GAP) < ROW_H;
  return i < ROWS.length && within ? i : null;
}

function FakeCursor({ y }: { y: MotionValue<number> }) {
  return (
    <motion.span
      aria-hidden
      // The arrow's tip sits 3px in from the SVG's corner.
      className="pointer-events-none absolute -left-[3px] -top-[3px] z-30"
      style={{ x: CURSOR_X, y }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          d="m4 4 7.07 17 2.51-7.39L21 11.07z"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="fill-foreground stroke-background"
        />
      </svg>
    </motion.span>
  );
}

function PlainHoverList({
  fakeIndex,
  cursor,
}: {
  /** The row the scripted cursor is inside, lit like :hover would. */
  fakeIndex: number | null;
  cursor: MotionValue<number> | null;
}) {
  const shape = useShape();
  return (
    <div className="relative flex w-full flex-col gap-1 p-2">
      {ROWS.map((label, i) => (
        <div
          key={label}
          className={cn(
            rowClass,
            "hover:bg-hover",
            fakeIndex === i && "bg-hover",
            shape.item
          )}
        >
          {label}
        </div>
      ))}
      {cursor && <FakeCursor y={cursor} />}
    </div>
  );
}

type FluidHoverApi = ReturnType<typeof useFluidHover>;

function FluidHoverList({
  containerRef,
  hover,
  cursor,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  hover: FluidHoverApi;
  cursor: MotionValue<number> | null;
}) {
  const shape = useShape();
  const { handlers, registerItem } = hover;
  return (
    <div
      ref={containerRef}
      className="relative flex w-full flex-col gap-1 p-2"
      {...handlers}
    >
      <FluidHoverHighlight hover={hover} className={shape.bg} />
      {ROWS.map((label, i) => (
        <FluidRow key={label} index={i} registerItem={registerItem}>
          {label}
        </FluidRow>
      ))}
      {cursor && <FakeCursor y={cursor} />}
    </div>
  );
}

function PlainVsFluidPreview({ paused }: { paused: boolean }) {
  const shape = useShape();
  const rootRef = useRef<HTMLDivElement>(null);
  const fluidRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(fluidRef);
  const inView = useInView(rootRef, { amount: 0.35 });
  const reduced = useReducedMotion();
  // A real pointer inside the demo owns both lists until it leaves.
  const [userInside, setUserInside] = useState(false);
  const scripted = inView && !reduced && !userInside;
  const running = scripted && !paused;

  const y = useMotionValue(CURSOR_TOP);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const [fakeIndex, setFakeIndex] = useState<number | null>(null);

  // The script is one animation, paused and resumed in place so the pause
  // button and a visiting pointer both hold the current frame.
  useEffect(() => {
    if (!running) {
      controlsRef.current?.pause();
      return;
    }
    if (controlsRef.current) {
      controlsRef.current.play();
      return;
    }
    controlsRef.current = animate(y, CURSOR_KEYFRAMES, {
      duration: CURSOR_PASS_S,
      times: CURSOR_TIMES,
      ease: "easeInOut",
      repeat: Infinity,
    });
  }, [running, y]);
  useEffect(() => () => controlsRef.current?.stop(), []);

  // Each scripted entry is a fresh session, like a real pointer coming in.
  const { handlers } = hover;
  const wasScriptedRef = useRef(false);
  useEffect(() => {
    if (scripted && !wasScriptedRef.current) handlers.onMouseEnter();
    if (!scripted && wasScriptedRef.current) {
      handlers.onMouseLeave();
      setFakeIndex(null);
    }
    wasScriptedRef.current = scripted;
  }, [scripted, handlers]);

  // Every frame of the cursor: the plain list gets what :hover would say,
  // the fluid list gets the same point as a real mouse move.
  useMotionValueEvent(y, "change", (value) => {
    if (!scripted) return;
    setFakeIndex(rowUnder(value));
    const box = fluidRef.current?.getBoundingClientRect();
    if (!box) return;
    handlers.onMouseMove({
      clientX: box.left + CURSOR_X,
      clientY: box.top + value,
    } as React.MouseEvent);
  });

  const frame = cn("w-full border border-border/60", shape.container);
  const labelClass =
    "flex items-center justify-center gap-2 text-caption text-muted-foreground";
  const cursor = scripted ? y : null;
  return (
    <div
      ref={rootRef}
      className="flex w-full max-w-xl flex-col items-center gap-4"
      onMouseEnter={() => setUserInside(true)}
      onMouseMove={() => setUserInside(true)}
      onPointerDown={() => setUserInside(true)}
      onMouseLeave={() => setUserInside(false)}
    >
      <div className="grid w-full gap-5 sm:grid-cols-2">
        <div className="flex flex-col items-center gap-3">
          <div className={frame}>
            <PlainHoverList fakeIndex={scripted ? fakeIndex : null} cursor={cursor} />
          </div>
          <span className={labelClass}>
            <span aria-hidden="true">❌</span> Plain <code className="font-mono">:hover</code> blinks at every gap
          </span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className={frame}>
            <FluidHoverList containerRef={fluidRef} hover={hover} cursor={cursor} />
          </div>
          <span className={labelClass}>
            <span aria-hidden="true">✅</span> Fluid hover glides, one pass, one target
          </span>
        </div>
      </div>
    </div>
  );
}

/** The comparison's frame: the play/pause button in the preview header holds
 *  the cursors on any frame. */
export function PlainVsFluidDemo() {
  const [paused, setPaused] = useState(false);
  const PauseIcon = useIcon("pause");
  const PlayIcon = useIcon("play");
  return (
    <ComponentPreview
      code={FLUID_HOVER_CODE}
      playbackButton={{
        icon: paused ? (
          <PlayIcon size={16} strokeWidth={1.5} />
        ) : (
          <PauseIcon size={16} strokeWidth={1.5} />
        ),
        tooltip: paused ? "Play" : "Pause",
        onClick: () => setPaused((v) => !v),
      }}
    >
      <PlainVsFluidPreview paused={paused} />
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Demo 2: show the math
// ---------------------------------------------------------------------------

function MathList({ showMath }: { showMath: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shape = useShape();
  const hover = useFluidHover(containerRef);
  const { activeIndex, itemRects, isMeasured, handlers, registerItem } = hover;
  const [cursorY, setCursorY] = useState<number | null>(null);

  const rect =
    isMeasured && activeIndex !== null ? (itemRects[activeIndex] ?? null) : null;
  const centers = isMeasured
    ? ROWS.map((_, i) => {
        const r = itemRects[i];
        return r ? r.top + r.height / 2 : null;
      })
    : [];
  // The highlight flips where the cursor crosses the midpoint between two
  // neighbouring centers.
  const boundaries = centers.flatMap((c, i) => {
    const next = centers[i + 1];
    return c !== null && next != null ? [(c + next) / 2] : [];
  });
  const winner = rect ? rect.top + rect.height / 2 : null;
  const distance =
    cursorY !== null && winner !== null ? Math.round(Math.abs(cursorY - winner)) : null;

  return (
    <div
      ref={containerRef}
      className="relative flex w-full flex-col gap-1 px-2 py-6"
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={() => {
        handlers.onMouseLeave();
        setCursorY(null);
      }}
      onMouseMove={(e) => {
        handlers.onMouseMove(e);
        const box = containerRef.current?.getBoundingClientRect();
        if (box) setCursorY(e.clientY - box.top);
      }}
    >
      <FluidHoverHighlight hover={hover} className={shape.bg} />
      {ROWS.map((label, i) => (
        <FluidRow key={label} index={i} registerItem={registerItem}>
          {label}
        </FluidRow>
      ))}

      {showMath && (
        <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
          {/* Midpoints between centers: the highlight flips here */}
          {boundaries.map((y) => (
            <div
              key={y}
              className="absolute left-2 right-2 border-t border-dashed border-foreground/20"
              style={{ top: y }}
            />
          ))}
          {/* Cursor */}
          {cursorY !== null && (
            <div
              className="absolute left-2 right-2 h-px bg-[color:var(--focus-ring,#6B97FF)] opacity-70"
              style={{ top: cursorY }}
            />
          )}
          {/* Rail: one dot per row center, and the distance to the winner */}
          <div className="absolute inset-y-0 right-5 w-0">
            {centers.map((c, i) =>
              c === null ? null : (
                <div
                  key={ROWS[i]}
                  className={cn(
                    "absolute left-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors",
                    i === activeIndex
                      ? "bg-[color:var(--focus-ring,#6B97FF)]"
                      : "bg-foreground/25"
                  )}
                  style={{ top: c }}
                />
              )
            )}
            {cursorY !== null && winner !== null && distance !== null && (
              <>
                <div
                  className="absolute left-0 w-px -translate-x-1/2 bg-[color:var(--focus-ring,#6B97FF)]"
                  style={{
                    top: Math.min(cursorY, winner),
                    height: Math.abs(cursorY - winner),
                  }}
                />
                <span
                  className="absolute left-0 -translate-x-[calc(100%+8px)] -translate-y-1/2 whitespace-nowrap font-mono text-[11px] text-[color:var(--focus-ring,#6B97FF)]"
                  style={{ top: (cursorY + winner) / 2 }}
                >
                  {distance}px
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ShowTheMathDemo() {
  const [showMath, setShowMath] = useState(true);
  const shape = useShape();
  return (
    <ComponentPreview code={MATH_CODE}>
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <div className={cn("w-full border border-border/60", shape.container)}>
          <MathList showMath={showMath} />
        </div>
        <Switch
          label="Show the math"
          checked={showMath}
          onToggle={() => setShowMath((v) => !v)}
        />
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Demo 3: three axes, on real components
// ---------------------------------------------------------------------------

const TAB_ITEMS = ["Library", "Recents", "Favorites", "Settings"];

const CARD_ITEMS = [
  { title: "Inbox", description: "Everything new lands here." },
  { title: "Drafts", description: "Unsent, saved as you type." },
  { title: "Sent", description: "Delivered and archived." },
  { title: "Trash", description: "Emptied after 30 days." },
];

function AxisBlock({
  axis,
  hint,
  children,
}: {
  axis: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <code
          className="font-mono text-caption text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          axis=&quot;{axis}&quot;
        </code>
        <span className="text-caption text-muted-foreground">{hint}</span>
      </div>
      {children}
    </div>
  );
}

export function AxesDemo() {
  return (
    <ComponentPreview code={AXES_CODE} padding="responsive">
      <div className="flex w-full max-w-md flex-col gap-8">
        <AxisBlock axis="x" hint="strips: tabs">
          <Tabs defaultValue={TAB_ITEMS[0]}>
            <TabsList>
              {TAB_ITEMS.map((label) => (
                <TabItem key={label} value={label} label={label} />
              ))}
            </TabsList>
          </Tabs>
        </AxisBlock>
        <AxisBlock axis="y" hint="lists: menus, tables, radios">
          <div className="w-56">
            <Dropdown aria-label="Folders">
              {ROWS.map((label, i) => (
                <MenuItem key={label} index={i} label={label} />
              ))}
            </Dropdown>
          </div>
        </AxisBlock>
        <AxisBlock axis="xy" hint="grids: card groups">
          <CardGroup columns={2} border="outlined" separated>
            {CARD_ITEMS.map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </CardGroup>
        </AxisBlock>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Demo 4: what it costs
//
// 200 rows in a scroll frame and a meter that measures, not estimates: the
// pick is the hook's own exported function timed on every move with the real
// rects, and the layout-write count watches the highlight's inline style
// while it travels.
// ---------------------------------------------------------------------------

const COST_ROW_COUNT = 200;
const COST_ROWS = Array.from(
  { length: COST_ROW_COUNT },
  (_, i) => `Message ${String(i + 1).padStart(3, "0")}`
);

const COST_CODE = `import { useFluidHover, pickNearest } from "@/hooks/use-fluid-hover";

// The hook runs pickNearest once per animation frame: one loop over the
// cached row rects, no DOM reads per row. The meter times that same
// function on every move, with the same inputs.
const t0 = performance.now();
pickNearest({
  axis: "y",
  point: { x: e.clientX, y: e.clientY },
  rects: itemRects,
  containerRect: container.getBoundingClientRect(),
  scroll: { x: container.scrollLeft, y: container.scrollTop },
  border: { x: container.clientLeft, y: container.clientTop },
  layoutSize: { width: container.offsetWidth, height: container.offsetHeight },
});
const workPerMove = performance.now() - t0;

// The highlight is 1 element that travels on a transform: while it moves,
// its top / left / width / height are never written.`;

const CostRow = memo(function CostRow({
  index,
  registerItem,
  children,
}: {
  index: number;
  registerItem: (index: number, element: HTMLElement | null) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  return (
    <div ref={ref} className={cn(rowClass, "w-full")}>
      {children}
    </div>
  );
});

interface CostMeter {
  moves: number;
  /** Mean of the last `COST_WINDOW` picks. `performance.now()` is coarsened
   *  to 0.1ms in most browsers, so one reading is 0 or 0.1; the mean over a
   *  window is the honest number. */
  avgMs: number;
  maxMs: number;
  layoutWrites: number;
  transformFrames: number;
  highlights: number;
}

const COST_WINDOW = 100;

const EMPTY_METER: CostMeter = {
  moves: 0,
  avgMs: 0,
  maxMs: 0,
  layoutWrites: 0,
  transformFrames: 0,
  highlights: 0,
};

function CostList({ onMeter }: { onMeter: (m: CostMeter) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shape = useShape();
  const hover = useFluidHover(containerRef);
  const { itemRects, handlers, registerItem } = hover;

  // The meter lives in a ref and is published once per frame, so measuring
  // never adds a render per move to what it measures.
  const meterRef = useRef<CostMeter>(EMPTY_METER);
  const windowRef = useRef<number[]>([]);
  const publishRef = useRef<number | null>(null);
  const publish = () => {
    if (publishRef.current !== null) return;
    publishRef.current = requestAnimationFrame(() => {
      publishRef.current = null;
      onMeter({ ...meterRef.current });
    });
  };

  const timePick = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const t0 = performance.now();
    pickNearest({
      axis: "y",
      point: { x: e.clientX, y: e.clientY },
      rects: itemRects,
      containerRect: container.getBoundingClientRect(),
      scroll: { x: container.scrollLeft, y: container.scrollTop },
      border: { x: container.clientLeft, y: container.clientTop },
      layoutSize: { width: container.offsetWidth, height: container.offsetHeight },
    });
    const ms = performance.now() - t0;
    const w = windowRef.current;
    w.push(ms);
    if (w.length > COST_WINDOW) w.shift();
    const m = meterRef.current;
    meterRef.current = {
      ...m,
      moves: m.moves + 1,
      avgMs: w.reduce((a, b) => a + b, 0) / w.length,
      maxMs: Math.max(m.maxMs, ms),
    };
    publish();
  };

  // Watch the highlight's inline style frame by frame: a transform change is
  // a frame of travel, a change to any layout property is a layout write.
  useEffect(() => {
    let raf = 0;
    let prev: { el: Element | null; transform: string; layout: string } = {
      el: null,
      transform: "",
      layout: "",
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const container = containerRef.current;
      if (!container) return;
      const els = container.querySelectorAll<HTMLElement>('[data-slot="fluid-hover-highlight"]');
      const el = els[els.length - 1] ?? null;
      const m = meterRef.current;
      if (m.highlights !== els.length) {
        meterRef.current = { ...m, highlights: els.length };
        publish();
      }
      if (!el) {
        prev = { el: null, transform: "", layout: "" };
        return;
      }
      const transform = el.style.transform;
      const layout = `${el.style.top}|${el.style.left}|${el.style.width}|${el.style.height}`;
      if (prev.el === el) {
        const travelling = transform !== prev.transform;
        const layoutChanged = layout !== prev.layout;
        if (travelling || layoutChanged) {
          meterRef.current = {
            ...meterRef.current,
            transformFrames: meterRef.current.transformFrames + (travelling ? 1 : 0),
            layoutWrites: meterRef.current.layoutWrites + (layoutChanged ? 1 : 0),
          };
          publish();
        }
      }
      prev = { el, transform, layout };
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (publishRef.current !== null) cancelAnimationFrame(publishRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex max-h-64 w-full flex-col gap-1 overflow-y-auto p-2"
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={handlers.onMouseLeave}
      onClick={handlers.onClick}
      onMouseMove={(e) => {
        timePick(e);
        handlers.onMouseMove(e);
      }}
    >
      <FluidHoverHighlight hover={hover} className={shape.bg} />
      {COST_ROWS.map((label, i) => (
        <CostRow key={label} index={i} registerItem={registerItem}>
          {label}
        </CostRow>
      ))}
    </div>
  );
}

function Stat({ value, label, hint }: { value: string; label: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <span className="font-mono text-body tabular-nums text-foreground">{value}</span>
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-[11px] leading-snug text-muted-foreground/60">{hint}</span>
    </div>
  );
}

/** One frame at 60Hz, the budget every move has to fit in. */
const FRAME_MS = 1000 / 60;

export function CostDemo() {
  const shape = useShape();
  const [meter, setMeter] = useState<CostMeter>(EMPTY_METER);
  return (
    <ComponentPreview code={COST_CODE}>
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <div className={cn("w-full border border-border/60", shape.container)}>
          <CostList onMeter={setMeter} />
        </div>
        {/* Three numbers, one per claim in the copy: the loop, the element,
            the layout. Moves counts up so the reader sees the meter is live. */}
        <div className="grid w-full grid-cols-3 gap-4">
          <Stat value={String(meter.moves)} label="moves" hint="counts as you hover" />
          <Stat
            value={`${meter.avgMs.toFixed(3)} ms`}
            label="per move"
            hint={`${((meter.avgMs / FRAME_MS) * 100).toFixed(2)}% of a ${FRAME_MS.toFixed(1)} ms frame`}
          />
          <Stat
            value={String(meter.layoutWrites)}
            label="layout writes"
            hint="a top/left animation writes 1 every frame"
          />
        </div>
      </div>
    </ComponentPreview>
  );
}
