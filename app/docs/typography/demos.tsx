"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  easeInOut,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import type { ItemRect } from "@/registry/default/hooks/use-fluid-hover";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";
import { typeClass } from "@/registry/default/lib/size-context";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { FakeCursor } from "@/lib/docs/fake-cursor";

/** One side of a before/after: a framed specimen with its verdict under it,
 *  as on the fluid hover page. */
function Specimen({
  good,
  caption,
  className,
  children,
}: {
  good: boolean;
  caption: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const shape = useShape();
  return (
    <div className="flex min-w-0 flex-col items-center gap-3">
      <div className={cn("w-full border border-border/60", shape.container, className)}>{children}</div>
      <span className="flex items-center justify-center gap-2 text-center text-site-caption text-muted-foreground">
        <span aria-hidden="true">{good ? "✅" : "❌"}</span>
        <span>{caption}</span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Weight + optical size
// ---------------------------------------------------------------------------

// Measured: weight alone widens it 2.3px, the paired weights 0px.
const MENU_LABEL = "Download all invoices";

/** One menu item that behaves like a sidebar row: a hover background under
 *  the pointer, and a click that sets the active background and turns the
 *  label semibold. The blue line marks the unselected width; whatever runs
 *  past it is tinted red. */
function WeightItem({
  settings,
  selected,
  onToggle,
  cursor,
  onDelta,
}: {
  settings: readonly [unselected: string, selected: string];
  selected: boolean;
  onToggle: () => void;
  /** The scripted pointer while it plays, and whether it's over the item. */
  cursor: { y: MotionValue<number>; over: boolean } | null;
  onDelta: (px: number) => void;
}) {
  const shape = useShape();
  const frameRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  // The label at both weights, out of sight, so the line and the tint know
  // both widths whichever one shows.
  const sizerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // In px from the frame: the unselected label's right edge, how far past it
  // the selected label runs, the label's box, and the item's own box.
  const [marks, setMarks] = useState<{
    edge: number;
    over: number;
    top: number;
    height: number;
    row: ItemRect;
  } | null>(null);
  // A real pointer over the item, and its visit: each visit fades the hover
  // in where it lands, as fluid hover does.
  const [pointerOver, setPointerOver] = useState(false);
  const [visit, setVisit] = useState(0);
  const onDeltaRef = useRef(onDelta);
  onDeltaRef.current = onDelta;

  useLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      const frame = frameRef.current;
      const row = rowRef.current;
      const label = labelRef.current;
      const [off, on] = sizerRefs.current.map((el) => el?.getBoundingClientRect().width);
      if (cancelled || !frame || !row || !label || off === undefined || on === undefined) return;
      const f = frame.getBoundingClientRect();
      const l = label.getBoundingClientRect();
      setMarks({
        edge: l.left - f.left + off,
        over: on - off,
        top: l.top - f.top,
        height: l.height,
        row: { top: row.offsetTop, left: row.offsetLeft, width: row.offsetWidth, height: row.offsetHeight },
      });
      onDeltaRef.current(on - off);
    };
    // Widths are only right once Inter has loaded.
    document.fonts.ready.then(measure);
    const ro = new ResizeObserver(measure);
    if (frameRef.current) ro.observe(frameRef.current);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, []);

  const hovered = cursor ? cursor.over : pointerOver;
  const on = selected ? 1 : 0;

  return (
    <div ref={frameRef} className="relative p-1" onMouseEnter={() => setVisit((v) => v + 1)}>
      {/* The active background, in on the click. */}
      <AnimatePresence>
        {selected && marks && (
          <motion.div
            aria-hidden
            className={cn("pointer-events-none absolute bg-active", shape.bg)}
            style={{ left: marks.row.left, top: marks.row.top, width: marks.row.width, height: marks.row.height }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
          />
        )}
      </AnimatePresence>
      <FluidHoverHighlight rect={marks && hovered ? marks.row : null} session={visit} className={shape.bg} />
      {marks && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-2 z-20 w-px bg-[#6B97FF]"
          style={{ left: marks.edge }}
        />
      )}
      {/* What spills past the line, tinted over the selected label's end. */}
      {marks && selected && marks.over >= 0.5 && (
        <span
          aria-hidden
          className="pointer-events-none absolute z-20 bg-[#F2555A]/45"
          style={{ left: marks.edge, width: marks.over, top: marks.top - 3, height: marks.height + 6 }}
        />
      )}
      <div
        ref={rowRef}
        onMouseEnter={() => setPointerOver(true)}
        onMouseLeave={() => setPointerOver(false)}
        onClick={onToggle}
        className={cn("relative z-10 flex h-9 cursor-pointer items-center gap-2 px-2", typeClass("body"))}
      >
        <span
          ref={labelRef}
          className={cn(
            "whitespace-nowrap transition-[color,font-variation-settings] duration-80",
            selected || hovered ? "text-foreground" : "text-muted-foreground"
          )}
          style={{ fontVariationSettings: settings[on] }}
        >
          {MENU_LABEL}
        </span>
      </div>
      {settings.map((setting, i) => (
        <span
          key={i}
          ref={(node) => {
            sizerRefs.current[i] = node;
          }}
          aria-hidden
          className={cn("invisible absolute left-0 top-0 whitespace-nowrap", typeClass("body"))}
          style={{ fontVariationSettings: setting }}
        >
          {MENU_LABEL}
        </span>
      ))}
      {cursor && <FakeCursor x={CURSOR_X} y={cursor.y} />}
    </div>
  );
}

// The script, one loop shared by both items so they click together: the
// cursor comes down onto the label, rests a beat, clicks it on, holds long
// enough to read the result, clicks it off, and leaves. The item is 36px
// from a 4px inset; the arrow's tip lands just below its middle, over the
// label's first word, and waits above the frame, in the preview's padding.
const OUT_Y = -28;
const IN_Y = 24;
/** The item's top and bottom edges, for whether the cursor is over it. */
const ITEM_TOP = 4;
const ITEM_BOTTOM = 40;
const CURSOR_X = 56;
const GLIDE_S = 0.6;
const REST_S = 0.2;
const ON_S = 1.4;
const OFF_S = 0.6;
const AWAY_S = 0.4;
const LOOP_S = GLIDE_S + REST_S + ON_S + OFF_S + GLIDE_S + AWAY_S;
const at = (s: number) => s / LOOP_S;
const CLICK_ON = at(GLIDE_S + REST_S);
const CLICK_OFF = at(GLIDE_S + REST_S + ON_S);
const LEAVE = at(GLIDE_S + REST_S + ON_S + OFF_S);
const Y_TIMES = [0, at(GLIDE_S), LEAVE, LEAVE + at(GLIDE_S), 1];
const Y_KEYS = [OUT_Y, IN_Y, IN_Y, OUT_Y, OUT_Y];
const selectedAt = (p: number) => p >= CLICK_ON && p < CLICK_OFF;

const wider = (px: number | null) =>
  px === null ? "" : Math.abs(px) < 0.25 ? ": same width" : `: ${Math.abs(px).toFixed(1)}px wider`;

export function WeightOpszDemo() {
  const [plain, setPlain] = useState<number | null>(null);
  const [paired, setPaired] = useState<number | null>(null);
  // A cursor clicks the item on and off while the demo is on screen, in both
  // at once: 2px is hard to see standing still, and easy to see jump. A real
  // pointer inside the demo takes over and clicks it itself; reduced motion
  // leaves it to the reader, with the item on.
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const [userInside, setUserInside] = useState(false);
  const scripted = inView && !reduceMotion && !userInside;
  const [selected, setSelected] = useState(true);

  const progress = useMotionValue(0);
  const y = useTransform(progress, Y_TIMES, Y_KEYS, { ease: easeInOut });
  const [scriptOver, setScriptOver] = useState(false);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);

  // One animation, paused and resumed in place, so the reader's pointer
  // holds the current frame.
  useEffect(() => {
    if (!scripted) {
      controlsRef.current?.pause();
      return;
    }
    if (controlsRef.current) {
      controlsRef.current.play();
      return;
    }
    controlsRef.current = animate(progress, [0, 1], { duration: LOOP_S, ease: "linear", repeat: Infinity });
  }, [scripted, progress]);
  useEffect(() => () => controlsRef.current?.stop(), []);

  useMotionValueEvent(progress, "change", (p) => {
    if (!scripted) return;
    setSelected(selectedAt(p));
    const cy = y.get();
    setScriptOver(cy >= ITEM_TOP && cy <= ITEM_BOTTOM);
  });

  const cursor = scripted ? { y, over: scriptOver } : null;

  return (
    <ComponentPreview hideHeader>
      <div
        ref={rootRef}
        className="grid w-full max-w-xl gap-5 sm:grid-cols-2"
        onMouseEnter={() => setUserInside(true)}
        onMouseMove={() => setUserInside(true)}
        onPointerDown={() => setUserInside(true)}
        onMouseLeave={() => setUserInside(false)}
      >
        {/* Weight alone leaves optical size on auto: the font size, 14 at
            the axis floor, either way. */}
        <Specimen good={false} caption={`Weight only${wider(plain)}`}>
          <WeightItem
            settings={["'wght' 400", "'wght' 550"]}
            selected={selected}
            onToggle={() => setSelected((v) => !v)}
            cursor={cursor}
            onDelta={setPlain}
          />
        </Specimen>
        <Specimen good caption={`Weight + optical size${wider(paired)}`}>
          <WeightItem
            settings={[fontWeights.normal, fontWeights.semibold]}
            selected={selected}
            onToggle={() => setSelected((v) => !v)}
            cursor={cursor}
            onDelta={setPaired}
          />
        </Specimen>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Balance and pretty
// ---------------------------------------------------------------------------

// Measured at 214px: wrap sets the headline 5 words over 2 (204px, then
// 83px), balance 3 over 4 with the first line the longer (156px, 132px),
// and wrap leaves the paragraph's last word alone (pretty brings one down),
// with a few px either side to spare for font rendering.
const HEADLINE = "Everything you need to run your billing";
const PARAGRAPH =
  "Each role pairs a size with a line height, so a caption in a menu and a caption in a table share one rhythm.";
const SAMPLE = "w-[214px] max-w-full";

const heading = (wrap: string) => (
  <p
    className={cn(typeClass("title"), SAMPLE, "text-foreground", wrap)}
    style={{ fontVariationSettings: fontWeights.semibold }}
  >
    {HEADLINE}
  </p>
);

const paragraph = (wrap: string) => (
  <p className={cn(typeClass("body"), SAMPLE, "text-muted-foreground", wrap)}>{PARAGRAPH}</p>
);

export function BalanceDemo() {
  return (
    <ComponentPreview hideHeader>
      <div className="grid w-full max-w-xl gap-5 sm:grid-cols-2">
        <Specimen good={false} className="px-4 py-5" caption={<><code>wrap</code> leaves a short last line</>}>
          {heading("[text-wrap:wrap]")}
        </Specimen>
        <Specimen good className="px-4 py-5" caption={<><code>balance</code> evens the lines</>}>
          {heading("[text-wrap:balance]")}
        </Specimen>
      </div>
    </ComponentPreview>
  );
}

export function PrettyDemo() {
  return (
    <ComponentPreview hideHeader>
      <div className="grid w-full max-w-xl gap-5 sm:grid-cols-2">
        <Specimen good={false} className="px-4 py-5" caption={<><code>wrap</code> leaves one word alone</>}>
          {paragraph("[text-wrap:wrap]")}
        </Specimen>
        <Specimen good className="px-4 py-5" caption={<><code>pretty</code> brings a word down to join it</>}>
          {paragraph("[text-wrap:pretty]")}
        </Specimen>
      </div>
    </ComponentPreview>
  );
}
