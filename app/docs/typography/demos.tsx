"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { typeClass } from "@/registry/default/lib/size-context";
import { Button } from "@/registry/radix/button";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";

function Label({ children }: { children: ReactNode }) {
  return <span className="text-site-caption text-muted-foreground">{children}</span>;
}

// ---------------------------------------------------------------------------
// Weight + optical size
// ---------------------------------------------------------------------------

const WEIGHTS = [
  { name: "normal", wght: 400 },
  { name: "medium", wght: 450 },
  { name: "semibold", wght: 550 },
  { name: "bold", wght: 700 },
] as const;

const WEIGHT_LABEL = "Quarterly planning review";

export function WeightOpszDemo() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const plainRef = useRef<HTMLSpanElement>(null);
  const pairedRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState<{ plain: number[]; paired: number[] } | null>(null);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % WEIGHTS.length), 1100);
    return () => window.clearInterval(id);
  }, [playing]);

  // Measure every weight once, off screen, after the font is ready.
  useLayoutEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      const root = measureRef.current;
      if (!root || cancelled) return;
      const read = (sel: string) =>
        Array.from(root.querySelectorAll<HTMLElement>(sel)).map((el) => el.getBoundingClientRect().width);
      setWidths({ plain: read("[data-plain]"), paired: read("[data-paired]") });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const w = WEIGHTS[index];
  const plainSettings = `'wght' ${w.wght}`;
  const pairedSettings = fontWeights[w.name];
  const delta = (arr: number[] | undefined, i: number) =>
    arr ? arr[i] - arr[0] : 0;
  const fmt = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}px`;

  const row = (label: string, ref: React.RefObject<HTMLSpanElement | null>, settings: string, d: number, good: boolean) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <span
          className={cn(
            "text-site-caption tabular-nums transition-colors duration-150",
            good ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {widths ? fmt(d) : ""}
        </span>
      </div>
      <div className="relative">
        {/* The width at 400: the edge a label must not cross to avoid reflow. */}
        {widths && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-[-4px] w-px bg-[#6B97FF]"
            style={{ left: widths.plain[0] }}
          />
        )}
        <span
          ref={ref}
          className={cn(typeClass("body"), "inline-block whitespace-nowrap text-foreground transition-[font-variation-settings] duration-150")}
          style={{ fontVariationSettings: settings }}
        >
          {WEIGHT_LABEL}
        </span>
      </div>
    </div>
  );

  return (
    <ComponentPreview hideHeader>
      <div className="flex w-full max-w-[420px] flex-col gap-5">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-compact"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? <Pause /> : <Play />}
          </Button>
          {WEIGHTS.map((x, i) => (
            <Button
              key={x.name}
              size="compact"
              variant={i === index ? "secondary" : "ghost"}
              onClick={() => {
                setPlaying(false);
                setIndex(i);
              }}
            >
              {x.wght}
            </Button>
          ))}
        </div>
        {row("Weight only", plainRef, plainSettings, delta(widths?.plain, index), index === 0)}
        {row("Weight + optical size", pairedRef, pairedSettings, delta(widths?.paired, index), true)}
        <div ref={measureRef} aria-hidden className="pointer-events-none invisible absolute left-0 top-0">
          {WEIGHTS.map((x) => (
            <span key={`p${x.name}`} data-plain className={cn(typeClass("body"), "absolute whitespace-nowrap")} style={{ fontVariationSettings: `'wght' ${x.wght}` }}>
              {WEIGHT_LABEL}
            </span>
          ))}
          {WEIGHTS.map((x) => (
            <span key={`q${x.name}`} data-paired className={cn(typeClass("body"), "absolute whitespace-nowrap")} style={{ fontVariationSettings: fontWeights[x.name] }}>
              {WEIGHT_LABEL}
            </span>
          ))}
        </div>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Text details
// ---------------------------------------------------------------------------

function Pair({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

const DASHED = "outline outline-1 outline-dashed outline-[#6B97FF]/70";

export function TrimDemo() {
  return (
    <ComponentPreview hideHeader>
      <div className="flex w-full flex-col gap-6 sm:flex-row">
        <Pair label="Line box">
          <span className="flex h-9 w-fit items-center rounded-lg bg-accent px-4">
            <span className={cn(typeClass("body"), "text-foreground", DASHED)}>Save changes</span>
          </span>
        </Pair>
        <Pair label="Trimmed to cap height">
          <span className="flex h-9 w-fit items-center rounded-lg bg-accent px-4">
            <span className={cn(typeClass("body"), "text-foreground [text-box:trim-both_cap_alphabetic]", DASHED)}>
              Save changes
            </span>
          </span>
        </Pair>
      </div>
    </ComponentPreview>
  );
}

const HEADLINE = "Ship the new settings dialog before the review";
const PARAGRAPH =
  "Pick compact for dense tools with long tables, and keep default for every other screen in the app.";

export function WrapDemo() {
  return (
    <ComponentPreview hideHeader>
      <div className="grid w-full gap-6 lg:grid-cols-2">
        <Pair label="Heading, wrap">
          <p className={cn(typeClass("title"), "w-[280px] max-w-full text-foreground [text-wrap:wrap]")} style={{ fontVariationSettings: fontWeights.semibold }}>
            {HEADLINE}
          </p>
        </Pair>
        <Pair label="Heading, balance">
          <p className={cn(typeClass("title"), "w-[280px] max-w-full text-foreground [text-wrap:balance]")} style={{ fontVariationSettings: fontWeights.semibold }}>
            {HEADLINE}
          </p>
        </Pair>
        <Pair label="Paragraph, wrap">
          <p className={cn(typeClass("body"), "w-[300px] max-w-full text-muted-foreground [text-wrap:wrap]")}>{PARAGRAPH}</p>
        </Pair>
        <Pair label="Paragraph, pretty">
          <p className={cn(typeClass("body"), "w-[300px] max-w-full text-muted-foreground [text-wrap:pretty]")}>{PARAGRAPH}</p>
        </Pair>
      </div>
    </ComponentPreview>
  );
}
