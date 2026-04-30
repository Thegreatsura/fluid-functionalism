"use client";

/**
 * Fluid Functionalism preview overrides used only on /compare. Each entry
 * here replaces the default `previewMap` entry from `bento-previews.tsx` so
 * the comparison reads more directly against the canonical shadcn version
 * (matched button heights, two badge variants, etc).
 */

import { Badge } from "@/registry/default/badge";
import { Button } from "@/registry/default/button";

function ButtonPreview() {
  // size="lg" → h-9 / text-[14px], matching shadcn's size="sm" (h-9 / text-sm)
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="primary" size="lg">Primary</Button>
      <Button variant="secondary" size="lg">Secondary</Button>
      <Button variant="tertiary" size="lg">Tertiary</Button>
      <Button variant="ghost" size="lg">Ghost</Button>
    </div>
  );
}

function BadgePreview() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap gap-1.5 items-center justify-center">
        <Badge variant="solid" color="blue">Published</Badge>
        <Badge variant="solid" color="green">Active</Badge>
        <Badge variant="solid" color="red">Declined</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5 items-center justify-center">
        <Badge variant="dot" color="blue">Published</Badge>
        <Badge variant="dot" color="green">Active</Badge>
        <Badge variant="dot" color="red">Declined</Badge>
      </div>
    </div>
  );
}

export const compareFluidPreviewMap: Record<string, React.FC> = {
  button: ButtonPreview,
  badge: BadgePreview,
};
