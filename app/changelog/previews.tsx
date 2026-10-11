"use client";

import type { FC } from "react";
import { previewMap } from "@/app/components/bento-previews";
import { PlainVsFluidPreview } from "@/app/docs/fluid-hover/demos";
import { ToolbarDemo } from "@/app/docs/sizes/toolbar-demo";
import { TabsExample } from "@/app/docs/skill/examples";
import { usePreviewPlayback } from "@/lib/docs/preview-playback";

// ---------------------------------------------------------------------------
// What a New entry shows under its sentence: the live component, the same
// preview its Showcase tile renders, or the system page's own demo. A slug
// with no entry here (a page-less change) shows its text alone.
// ---------------------------------------------------------------------------

function FluidHoverPreview() {
  return <PlainVsFluidPreview paused={!usePreviewPlayback()} />;
}

export const changelogPreviews: Record<string, FC> = {
  ...previewMap,
  "fluid-hover": FluidHoverPreview,
  sizes: ToolbarDemo,
  skill: TabsExample,
};

/** Stage padding by slug, where a preview needs more room than the default
 *  px-6 py-12 leaves (the Showcase grid's overrides, same reasons). */
export const STAGE_PADDING: Record<string, string> = {
  sidebar: "px-4 py-8",
  card: "px-6 py-5",
  "command-menu": "px-6 py-8",
  "fluid-hover": "px-6 py-8",
  sizes: "px-6 py-8",
  skill: "px-4 py-6",
};

/** The previews that animate by themselves, and so read
 *  usePreviewPlayback(): the changelog gives these a Play / Pause button. */
export const ANIMATED_PREVIEWS = new Set(["carousel-dots", "fluid-hover", "skill"]);
