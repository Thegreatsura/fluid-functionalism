"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";
import { typeClass } from "@/registry/default/lib/size-context";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";

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

/** The menu's check, drawn as MenuItem draws it. */
function CheckGlyph() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-auto shrink-0 text-foreground"
      aria-hidden="true"
    >
      <path d="M4 12L9 17L20 6" />
    </svg>
  );
}

/** Two menu rows, one of them selected. Each row's optical size sits after
 *  its label, so a label that grows pushes it along. The blue line marks the
 *  unselected width; whatever runs past it is tinted red. */
function WeightMenu({
  settings,
  opsz,
  selected,
  onDelta,
}: {
  settings: readonly [unselected: string, selected: string];
  opsz: readonly [unselected: string, selected: string];
  /** Which row is selected. */
  selected: 0 | 1;
  onDelta: (px: number) => void;
}) {
  const shape = useShape();
  const frameRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  // In px from the frame: the unselected label's right edge, how far past it
  // a selected label runs, and each row's label box.
  const [marks, setMarks] = useState<{ edge: number; over: number; tops: number[]; height: number } | null>(null);
  const onDeltaRef = useRef(onDelta);
  onDeltaRef.current = onDelta;

  useLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      const frame = frameRef.current;
      const rows = labelRefs.current.map((el) => el?.getBoundingClientRect());
      if (cancelled || !frame || !rows[0] || !rows[1]) return;
      const f = frame.getBoundingClientRect();
      const on = rows[selectedRef.current]!;
      const off = rows[1 - selectedRef.current]!;
      setMarks({
        edge: off.right - f.left,
        over: on.right - off.right,
        tops: rows.map((r) => r!.top - f.top),
        height: on.height,
      });
      onDeltaRef.current(on.width - off.width);
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

  return (
    <div ref={frameRef} className="relative flex flex-col p-1">
      {marks && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-2 w-px bg-[#6B97FF]"
          style={{ left: marks.edge }}
        />
      )}
      {/* What spills past the line, tinted over the selected label's end. */}
      {marks && marks.over >= 0.5 && (
        <span
          aria-hidden
          className="pointer-events-none absolute bg-[#F2555A]/45"
          style={{ left: marks.edge, width: marks.over, top: marks.tops[selected] - 3, height: marks.height + 6 }}
        />
      )}
      {[0, 1].map((i) => {
        const on = i === selected ? 1 : 0;
        return (
          <div key={i} className={cn("flex h-9 items-center gap-2 px-2", shape.item, typeClass("body"))}>
            <span
              ref={(node) => {
                labelRefs.current[i] = node;
              }}
              className={cn("whitespace-nowrap", on ? "text-foreground" : "text-muted-foreground")}
              style={{ fontVariationSettings: settings[on] }}
            >
              {MENU_LABEL}
            </span>
            <span
              className={cn(
                "whitespace-nowrap font-mono text-site-caption",
                on && opsz[1] !== opsz[0] ? "text-foreground" : "text-muted-foreground"
              )}
            >
              opsz {opsz[on]}
            </span>
            {on === 1 && <CheckGlyph />}
          </div>
        );
      })}
    </div>
  );
}

const wider = (px: number | null) =>
  px === null ? "" : Math.abs(px) < 0.25 ? ": same width" : `: ${Math.abs(px).toFixed(1)}px wider`;

export function WeightOpszDemo() {
  const [plain, setPlain] = useState<number | null>(null);
  const [paired, setPaired] = useState<number | null>(null);
  // The selection moves between the two rows while the demo is on screen:
  // 2px is hard to see standing still, and easy to see jump. Reduced motion
  // keeps the second row selected.
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<0 | 1>(1);
  useEffect(() => {
    if (!inView || reduceMotion) return;
    const id = window.setInterval(() => setSelected((s) => (s === 1 ? 0 : 1)), 1400);
    return () => window.clearInterval(id);
  }, [inView, reduceMotion]);

  return (
    <ComponentPreview hideHeader>
      <div ref={rootRef} className="grid w-full max-w-xl gap-5 sm:grid-cols-2">
        {/* Weight alone leaves optical size on auto: the font size, 14 at
            the axis floor, for both rows. */}
        <Specimen good={false} caption={`Weight only${wider(plain)}`}>
          <WeightMenu
            settings={["'wght' 400", "'wght' 550"]}
            opsz={["auto", "auto"]}
            selected={selected}
            onDelta={setPlain}
          />
        </Specimen>
        <Specimen good caption={`Weight + optical size${wider(paired)}`}>
          <WeightMenu
            settings={[fontWeights.normal, fontWeights.semibold]}
            opsz={["14", "18"]}
            selected={selected}
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

// Measured at 214px: wrap sets the headline 6 words over 2 (balance 4 and 4)
// and leaves the paragraph's last word alone (pretty brings one down), with
// a few px either side to spare for font rendering.
const HEADLINE = "Plan the launch of the new billing page";
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
