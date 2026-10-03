"use client";

import { motion, type MotionValue } from "framer-motion";

/** A scripted pointer for demos, so a behaviour shows without the reader
 *  moving. The arrow's tip sits at (x, y) in the positioned parent. */
export function FakeCursor({
  x,
  y,
}: {
  x: MotionValue<number> | number;
  y: MotionValue<number> | number;
}) {
  return (
    <motion.span
      aria-hidden
      // The arrow's tip sits 3px in from the SVG's corner.
      className="pointer-events-none absolute -left-[3px] -top-[3px] z-30"
      style={{ x, y }}
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
