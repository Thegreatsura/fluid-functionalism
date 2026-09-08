"use client";

import { useRef, useState, type ReactNode } from "react";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { cn } from "@/registry/default/lib/utils";
import { useShape } from "@/registry/default/lib/shape-context";
import {
  useFluidHover,
  useRegisterFluidHoverItem,
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
  const { activeIndex, itemRects, isMeasured, sessionRef, handlers, registerItem } =
    useFluidHover(containerRef);
  const rect = isMeasured && activeIndex !== null ? itemRects[activeIndex] : null;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1 p-2" {...handlers}>
      {/* Re-keyed on every entry (session): fades in at the nearest row
          instead of sliding over from wherever it was last. */}
      <FluidHoverHighlight rect={rect} session={sessionRef.current} className="rounded-lg" />
      {rows.map((label, i) => (
        <Row key={label} index={i} registerItem={registerItem}>{label}</Row>
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
// ---------------------------------------------------------------------------

function PlainHoverList() {
  const shape = useShape();
  return (
    <div className="flex w-full flex-col gap-1 p-2">
      {ROWS.map((label) => (
        <div key={label} className={cn(rowClass, "hover:bg-hover", shape.item)}>
          {label}
        </div>
      ))}
    </div>
  );
}

function FluidHoverList() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shape = useShape();
  const { activeIndex, itemRects, isMeasured, sessionRef, handlers, registerItem } =
    useFluidHover(containerRef);
  const rect =
    isMeasured && activeIndex !== null ? (itemRects[activeIndex] ?? null) : null;
  return (
    <div
      ref={containerRef}
      className="relative flex w-full flex-col gap-1 p-2"
      {...handlers}
    >
      <FluidHoverHighlight rect={rect} session={sessionRef.current} className={shape.bg} />
      {ROWS.map((label, i) => (
        <FluidRow key={label} index={i} registerItem={registerItem}>
          {label}
        </FluidRow>
      ))}
    </div>
  );
}

export function PlainVsFluidDemo() {
  const shape = useShape();
  const frame = cn("w-full border border-border/60", shape.container);
  const labelClass =
    "flex items-center justify-center gap-2 text-caption text-muted-foreground";
  return (
    <ComponentPreview code={FLUID_HOVER_CODE}>
      <div className="flex w-full max-w-xl flex-col items-center gap-4">
        <div className="grid w-full gap-5 sm:grid-cols-2">
          <div className="flex flex-col items-center gap-3">
            <div className={frame}>
              <PlainHoverList />
            </div>
            <span className={labelClass}>
              <span aria-hidden="true">❌</span> Plain <code className="font-mono">:hover</code>, nothing between rows
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className={frame}>
              <FluidHoverList />
            </div>
            <span className={labelClass}>
              <span aria-hidden="true">✅</span> Fluid hover, always on a row
            </span>
          </div>
        </div>
        <p className="text-center text-caption text-muted-foreground/70">
          Glide up and down slowly, through the gaps and past the last row.
        </p>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Demo 2: show the math
// ---------------------------------------------------------------------------

function MathList({ showMath }: { showMath: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shape = useShape();
  const { activeIndex, itemRects, isMeasured, sessionRef, handlers, registerItem } =
    useFluidHover(containerRef);
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
      <FluidHoverHighlight rect={rect} session={sessionRef.current} className={shape.bg} />
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
