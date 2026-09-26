"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { useMotionValue } from "framer-motion";
import { CarouselDots } from "@/registry/default/carousel-dots";
import { TabsSubtle, TabsSubtleItem } from "@/components/flavored/tabs-subtle";
import { MenuExample } from "./menu-example";
import { CopyExample, PressExample, TabsExample } from "./examples";
import { CycleContext } from "./hero-shared";
import { SpeedProvider, useSlowMotion } from "./slow-motion";

/** One example per recipe the skill teaches: fluid hover, weight without
 *  reflow, the icon swap, and a press that never warps. */
const EXAMPLES = [
  { label: "Menu", Example: MenuExample },
  { label: "Tabs", Example: TabsExample },
  { label: "Copy field", Example: CopyExample },
  { label: "Button press", Example: PressExample },
];

/** Real speed, or slow enough to watch every frame of a spring. */
const SPEEDS = [1, 0.2];

export function SkillHero() {
  const [selected, setSelected] = useState(0);
  const [speed, setSpeed] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);
  useSlowMotion(panelRef, speed);
  const { label, Example } = EXAMPLES[selected];

  // The dot's fill runs on its own clock: elapsed time, scaled by speed,
  // advancing only while the example reports it is playing. One continuous
  // ramp per example instead of per-step targets, so it never stalls.
  const progress = useMotionValue(0);
  const clock = useRef({ totalMs: 1, playing: false, elapsed: 0 });
  const speedRef = useRef(speed);
  speedRef.current = speed;
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const c = clock.current;
      const dt = Math.min(now - last, 100);
      last = now;
      if (c.playing) c.elapsed += dt * speedRef.current;
      const p = Math.min(c.elapsed / c.totalMs, 1);
      progress.set(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  const goTo = useCallback((i: number) => {
    clock.current = { totalMs: 1, playing: false, elapsed: 0 };
    setSelected(i);
  }, []);

  // Each example reports its length and playback, and says when both turns
  // played; then autoplay moves to the next one.
  const cycle = useMemo(
    () => ({
      report: (totalMs: number, playing: boolean) => {
        clock.current.totalMs = totalMs;
        clock.current.playing = playing;
      },
      done: () => goTo((selected + 1) % EXAMPLES.length),
    }),
    [goTo, selected]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* The speed switch overlays the frame's top-right corner but sits
          outside the slowed panel, so its own pill never plays at 0.2x. */}
      <div className="relative">
        <div ref={panelRef} role="group" aria-roledescription="carousel" aria-label={`${label} example`}>
          <SpeedProvider value={speed}>
            <CycleContext.Provider value={cycle}>
              <ComponentPreview hideHeader inspectable={false}>
                {/* Keyed so each example starts its script fresh. */}
                <Example key={selected} />
              </ComponentPreview>
            </CycleContext.Provider>
          </SpeedProvider>
        </div>
        <div className="absolute right-3 top-3 z-10">
          <TabsSubtle
            size="compact"
            selectedIndex={SPEEDS.indexOf(speed)}
            onSelect={(i) => {
              setSpeed(SPEEDS[i]);
              track("Skill hero speed", { speed: SPEEDS[i] });
            }}
            idPrefix="skill-hero-speed"
            aria-label="Playback speed"
          >
            {SPEEDS.map((v, i) => (
              <TabsSubtleItem key={v} index={i} label={`${v}x`} />
            ))}
          </TabsSubtle>
        </div>
      </div>
      <div className="flex justify-center">
        <CarouselDots
          count={EXAMPLES.length}
          value={selected}
          progress={progress}
          getLabel={(i) => `Show the ${EXAMPLES[i].label} example`}
          onValueChange={(i) => {
            goTo(i);
            track("Skill hero example", { example: EXAMPLES[i].label });
          }}
        />
      </div>
    </div>
  );
}
