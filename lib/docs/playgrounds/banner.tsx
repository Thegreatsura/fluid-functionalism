"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DialRoot, useDialKit } from "dialkit";
import "dialkit/styles.css";
import { useSlowMotion } from "@/app/docs/skill/slow-motion";
import {
  Banner,
  BannerTitle,
  BannerDescription,
  BannerActions,
  BannerAction,
  bannerMotion,
  type BannerContrast,
  type BannerStatus,
  type BannerVariant,
} from "@/registry/default/banner";
import { Button } from "@/registry/radix/button";
import { Switch } from "@/registry/radix/switch";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import type { PlaygroundProps } from "./types";

// ── Banner playground ────────────────────────────────────
// One real Banner driven by the controls, with the matching code kept in sync
// for the doc page's Code tab. Size is left to the site-wide control (the
// "Make them yours" panel / S), so it isn't repeated here. The fixed variant
// renders inside a mock page, between its header and its scrolling content.

export const BANNER_COPY: Record<
  BannerStatus,
  { title: string; description: string; primary: string; secondary: string; ghost: string }
> = {
  default: {
    title: "Banner is new in Fluid Functionalism",
    description: "5 statuses, 2 contrasts and a dismiss that collapses its height.",
    primary: "Read the docs",
    secondary: "Changelog",
    ghost: "Not now",
  },
  info: {
    title: "The registry has new components",
    description: "Run the install command again to pull the latest versions.",
    primary: "Copy command",
    secondary: "What's new",
    ghost: "Later",
  },
  success: {
    title: "Fluid Functionalism is installed",
    description: "Button, Card and Dialog were added to components/ui.",
    primary: "Open the docs",
    secondary: "Add more",
    ghost: "Share",
  },
  warning: {
    title: "Inter is missing its opsz axis",
    description: 'Labels shift when their weight changes. Add axes: ["opsz"] to your next/font call.',
    primary: "Show the fix",
    secondary: "Read the guide",
    ghost: "Ignore",
  },
  error: {
    title: "Couldn't reach the registry",
    description: "shadcn couldn't fetch button.json from fluidfunctionalism.com.",
    primary: "Retry",
    secondary: "Status page",
    ghost: "Report issue",
  },
};

const STATUSES: BannerStatus[] = ["default", "info", "success", "warning", "error"];

interface PlayState {
  variant: BannerVariant;
  status: BannerStatus;
  contrast: BannerContrast;
  description: boolean;
  primary: boolean;
  secondary: boolean;
  ghost: boolean;
  dismissible: boolean;
}

function buildBannerCode(o: PlayState) {
  const copy = BANNER_COPY[o.status];
  const attrs: string[] = [];
  if (o.variant !== "inline") attrs.push(`variant="${o.variant}"`);
  if (o.status !== "default") attrs.push(`status="${o.status}"`);
  if (o.contrast !== "low") attrs.push(`contrast="${o.contrast}"`);
  if (o.dismissible) attrs.push("dismissible");

  const lines = [`  <BannerTitle>${copy.title}</BannerTitle>`];
  if (o.description) {
    lines.push(`  <BannerDescription>\n    ${copy.description}\n  </BannerDescription>`);
  }
  // Written strongest first (that's the tab order); the banner lays them
  // out by variant.
  if (o.primary || o.secondary || o.ghost) {
    lines.push("  <BannerActions>");
    if (o.primary) lines.push(`    <BannerAction variant="primary">${copy.primary}</BannerAction>`);
    if (o.secondary) lines.push(`    <BannerAction>${copy.secondary}</BannerAction>`);
    if (o.ghost) lines.push(`    <BannerAction variant="ghost">${copy.ghost}</BannerAction>`);
    lines.push("  </BannerActions>");
  }
  return `<Banner${attrs.length ? " " + attrs.join(" ") : ""}>\n${lines.join("\n")}\n</Banner>`;
}

const ROW_WIDTHS = [92, 84, 88, 60, 95, 78, 86, 70, 50, 90, 82, 94, 66, 88, 74, 58];

/** Muted skeleton bars standing in for the page around the banner. */
function SkeletonLines({ widths }: { widths: number[] }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {widths.map((width, i) => (
        <div key={i} className="h-4 rounded-full bg-muted" style={{ width: `${width}%` }} />
      ))}
    </div>
  );
}

/** A skeleton page for the fixed banner: a header, the banner (children)
 *  right under it, and page content that scrolls on its own below both. */
export function MockPage({
  children,
  className = "h-[240px]",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-xl border border-border/60 bg-background ${className}`}
    >
      <div
        className="flex h-11 shrink-0 items-center gap-4 border-b border-border/60 px-4"
        aria-hidden="true"
      >
        <div className="size-5 rounded-md bg-muted" />
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-10 rounded-full bg-muted" />
          <div className="h-2.5 w-12 rounded-full bg-muted" />
          <div className="h-2.5 w-9 rounded-full bg-muted" />
        </div>
        <div className="ml-auto size-6 rounded-full bg-muted" />
      </div>
      {children}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-5" aria-hidden="true">
          <div className="h-3 w-1/3 rounded-full bg-muted" />
          {ROW_WIDTHS.map((width, i) => (
            <div key={i} className="h-2.5 rounded-full bg-muted" style={{ width: `${width}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Motion dials (development only) ─────────────────────
// A DialKit panel showing every appear and dismiss value. It starts at the
// shipped values (read once, before any dial writes) and writes each change
// into `bannerMotion`, which the banner reads when an animation starts.

const SHIPPED_MOTION = {
  appear: {
    row: { ...bannerMotion.appear.row },
    banner: { ...bannerMotion.appear.banner },
    fromScale: bannerMotion.appear.fromScale,
  },
  dismiss: { row: { ...bannerMotion.dismiss.row }, shrinkTo: bannerMotion.dismiss.shrinkTo },
};

const num = (value: unknown, fallback = 0) => (typeof value === "number" ? value : fallback);
const percent = (scale: number) => Math.round(scale * 100);

const CURVES = [
  { value: "easeInOut", label: "Ease in-out" },
  { value: "easeOut", label: "Ease out" },
  { value: "easeIn", label: "Ease in" },
  { value: "linear", label: "Linear" },
];

/** Slows framer's clock page-wide while mounted (the /docs/skill hero's
 *  slow motion). Mounted only below 1x, so normal speed is untouched. */
function SlowMotion({ rate }: { rate: number }) {
  const rootRef = useRef<HTMLElement>(null);
  useSlowMotion(rootRef, rate);
  return null;
}

function BannerMotionDials({ onReplay }: { onReplay: (speed: number) => void }) {
  const { appear, dismiss } = SHIPPED_MOTION;
  const dials = useDialKit(
    "Banner motion",
    {
      "Speed (x)": [1, 0.1, 1, 0.05],
      appear: {
        "Space opens (s)": [num(appear.row.duration), 0, 1, 0.01],
        "Space bounce": [num(appear.row.bounce), 0, 1, 0.01],
        "Banner delay (s)": [num(appear.banner.delay), 0, 0.5, 0.01],
        "Banner appears (s)": [num(appear.banner.duration), 0, 1, 0.01],
        "Banner bounce": [num(appear.banner.bounce), 0, 1, 0.01],
        "Banner grows from (%)": [percent(appear.fromScale), 0, 100, 1],
      },
      dismiss: {
        "Space closes (s)": [num(dismiss.row.duration), 0, 1, 0.01],
        Curve: {
          type: "select",
          options: CURVES,
          default: typeof dismiss.row.ease === "string" ? dismiss.row.ease : "easeInOut",
        },
        "Banner shrinks to (%)": [percent(dismiss.shrinkTo), 5, 95, 1],
      },
      replay: { type: "action", label: "Dismiss, then show" },
    },
    { onAction: (action) => action === "replay" && onReplay(speedRef.current) }
  );
  const speed = dials["Speed (x)"];
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const { appear: a, dismiss: d } = dials;
    Object.assign(bannerMotion.appear.row, {
      duration: a["Space opens (s)"],
      bounce: a["Space bounce"],
    });
    Object.assign(bannerMotion.appear.banner, {
      delay: a["Banner delay (s)"],
      duration: a["Banner appears (s)"],
      bounce: a["Banner bounce"],
    });
    bannerMotion.appear.fromScale = a["Banner grows from (%)"] / 100;
    bannerMotion.dismiss.row = {
      duration: d["Space closes (s)"],
      ease: d.Curve as "easeInOut" | "easeOut" | "easeIn" | "linear",
    };
    bannerMotion.dismiss.shrinkTo = d["Banner shrinks to (%)"] / 100;
  });

  return (
    <>
      <DialRoot position="bottom-right" />
      {speed < 1 && <SlowMotion rate={speed} />}
    </>
  );
}

export function BannerPlayground({ children }: PlaygroundProps) {
  const [variant, setVariant] = useState<BannerVariant>("inline");
  const [status, setStatus] = useState<BannerStatus>("success");
  const [contrast, setContrast] = useState<BannerContrast>("low");
  const [description, setDescription] = useState(true);
  const [primary, setPrimary] = useState(true);
  const [secondary, setSecondary] = useState(true);
  const [ghost, setGhost] = useState(false);
  const [dismissible, setDismissible] = useState(true);
  const [open, setOpen] = useState(true);

  const state: PlayState = {
    variant,
    status,
    contrast,
    description,
    primary,
    secondary,
    ghost,
    dismissible,
  };
  const code = buildBannerCode(state);
  const copy = BANNER_COPY[status];

  const randomize = () => {
    const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
    setVariant(Math.random() > 0.75 ? "fixed" : "inline");
    setStatus(pick(STATUSES));
    setContrast(pick(["low", "high"] as const));
    setDescription(Math.random() > 0.4);
    setPrimary(Math.random() > 0.3);
    setSecondary(Math.random() > 0.5);
    setGhost(Math.random() > 0.6);
    setDismissible(Math.random() > 0.3);
    setOpen(true);
  };

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Banner" />
      <div>
        <PlayField label="Variant">
          <PlaySelect
            value={variant}
            onChange={(v) => setVariant(v as BannerVariant)}
            options={[
              { value: "inline", label: "Inline" },
              { value: "fixed", label: "Fixed" },
            ]}
          />
        </PlayField>
        <PlayField label="Status">
          <PlaySelect
            value={status}
            onChange={(v) => setStatus(v as BannerStatus)}
            options={[
              { value: "default", label: "Default" },
              { value: "info", label: "Info" },
              { value: "success", label: "Success" },
              { value: "warning", label: "Warning" },
              { value: "error", label: "Error" },
            ]}
          />
        </PlayField>
        <PlayField label="Contrast">
          <PlaySelect
            value={contrast}
            onChange={(v) => setContrast(v as BannerContrast)}
            options={[
              { value: "low", label: "Low" },
              { value: "high", label: "High" },
            ]}
          />
        </PlayField>
      </div>

      <PlayDivider />
      <PlaySection label="Content" />
      <div>
        <Switch
          label="Description"
          checked={description}
          onToggle={() => setDescription((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Primary action"
          checked={primary}
          onToggle={() => setPrimary((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Secondary action"
          checked={secondary}
          onToggle={() => setSecondary((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Ghost action"
          checked={ghost}
          onToggle={() => setGhost((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Dismissible"
          checked={dismissible}
          onToggle={() => {
            setDismissible((v) => !v);
            setOpen(true);
          }}
          className={PLAY_SWITCH}
        />
      </div>
    </PlaygroundPanel>
  );

  const banner = (
    <Banner
      variant={variant}
      status={status}
      contrast={contrast}
      dismissible={dismissible}
      open={open}
      onDismiss={() => setOpen(false)}
    >
      <BannerTitle>{copy.title}</BannerTitle>
      {description && <BannerDescription>{copy.description}</BannerDescription>}
      {(primary || secondary || ghost) && (
        <BannerActions>
          {primary && <BannerAction variant="primary">{copy.primary}</BannerAction>}
          {secondary && <BannerAction>{copy.secondary}</BannerAction>}
          {ghost && <BannerAction variant="ghost">{copy.ghost}</BannerAction>}
        </BannerActions>
      )}
    </Banner>
  );

  // A dismissed banner leaves a way back, pinned to the bottom of the
  // preview area by the host (doc preview and /demo card alike).
  const showAgain = !open && (
    <Button variant="ghost" size="compact" onClick={() => setOpen(true)}>
      Show banner
    </Button>
  );

  // Inline, the banner sits in a fixed-height page between skeleton lines,
  // so its appear and dismiss move real content: the line above stays put,
  // the ones below slide, and the page never re-centres in the preview. The
  // height fits the default banner.
  const render = (maxWidth: string, pageHeight: string, inlineHeight: string) =>
    variant === "fixed" ? (
      <div className={`w-full ${maxWidth}`}>
        <MockPage className={pageHeight}>{banner}</MockPage>
      </div>
    ) : (
      <div className={`flex w-full ${maxWidth} ${inlineHeight} flex-col gap-3 overflow-hidden`}>
        <SkeletonLines widths={[45]} />
        {banner}
        <SkeletonLines widths={[85, 60]} />
      </div>
    );

  // Replays the dismiss, then the appear, once the close has played out
  // (longer when the dials slow the clock down).
  const replay = (speed: number) => {
    setOpen(false);
    const close = num(bannerMotion.dismiss.row.duration, 0.5);
    window.setTimeout(() => setOpen(true), (close / speed) * 1000 + 400);
  };
  const dials = process.env.NODE_ENV === "development" && (
    <BannerMotionDials onReplay={replay} />
  );

  return children({
    preview: (
      <>
        {render("max-w-[560px]", "h-[280px]", "h-[200px]")}
        {dials}
      </>
    ),
    demoPreview: (
      <>
        {render("max-w-[420px]", "h-[260px]", "h-[220px]")}
        {dials}
      </>
    ),
    controls,
    code,
    onReplay: () => setOpen(true),
    overlay: showAgain,
  });
}
