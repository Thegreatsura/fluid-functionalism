"use client";

// Development-only tuning panel for the Banner playground: a DialKit panel
// showing every appear and dismiss value, plus a speed control. The
// playground loads this module with a dynamic import behind a
// NODE_ENV === "development" check, so neither DialKit nor its stylesheet
// ships to the live site.

import { useEffect, useRef } from "react";
import { DialRoot, useDialKit } from "dialkit";
import "dialkit/styles.css";
import { useSlowMotion } from "@/app/docs/skill/slow-motion";
import { bannerMotion, type BannerMotionConfig } from "@/registry/default/banner";

const num = (value: unknown, fallback = 0) => (typeof value === "number" ? value : fallback);
const percent = (scale: number) => Math.round(scale * 100);

const CURVES = [
  { value: "easeInOut", label: "Ease in-out" },
  { value: "easeOut", label: "Ease out" },
  { value: "easeIn", label: "Ease in" },
  { value: "linear", label: "Linear" },
];

type Curve = "easeInOut" | "easeOut" | "easeIn" | "linear";

/** Slows framer's clock page-wide while mounted (the /docs/skill hero's
 *  slow motion). Mounted only below 1x, so normal speed is untouched. */
function SlowMotion({ rate }: { rate: number }) {
  const rootRef = useRef<HTMLElement>(null);
  useSlowMotion(rootRef, rate);
  return null;
}

export default function BannerMotionDials({
  onChange,
  onReplay,
}: {
  /** The tuned values, whenever a dial moves. */
  onChange: (config: BannerMotionConfig) => void;
  /** Dismiss, then show again after `delayMs`. */
  onReplay: (delayMs: number) => void;
}) {
  // Defaults are the shipped values, so the panel opens at what ships.
  const { appear, dismiss } = bannerMotion;
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
    { onAction: (action) => action === "replay" && replay() }
  );

  const speed = dials["Speed (x)"];
  const a = dials.appear;
  const d = dials.dismiss;
  const config: BannerMotionConfig = {
    appear: {
      row: { type: "spring", duration: a["Space opens (s)"], bounce: a["Space bounce"] },
      banner: {
        type: "spring",
        duration: a["Banner appears (s)"],
        bounce: a["Banner bounce"],
        delay: a["Banner delay (s)"],
      },
      fromScale: a["Banner grows from (%)"] / 100,
    },
    dismiss: {
      row: { duration: d["Space closes (s)"], ease: d.Curve as Curve },
      shrinkTo: d["Banner shrinks to (%)"] / 100,
    },
  };

  // Report only real changes: the playground re-renders on every report, so
  // reporting each render would loop.
  const key = JSON.stringify(config);
  const lastKey = useRef("");
  const latest = useRef({ config, speed, onChange, onReplay });
  useEffect(() => {
    latest.current = { config, speed, onChange, onReplay };
    if (key === lastKey.current) return;
    lastKey.current = key;
    onChange(config);
  });

  // The replay waits for the close to play out at the current speed.
  function replay() {
    const { config: current, speed: rate, onReplay: play } = latest.current;
    play((num(current.dismiss.row.duration, 0.5) / rate) * 1000 + 400);
  }

  return (
    <>
      <DialRoot position="bottom-right" />
      {speed < 1 && <SlowMotion rate={speed} />}
    </>
  );
}
