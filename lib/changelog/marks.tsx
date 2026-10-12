"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

/** The doc slugs the latest changelog release marks, read on the server by
 *  latestMarks() in lib/changelog/load.ts. The one source for every New and
 *  Updated marker on the site. */
export interface ReleaseMarks {
  new: string[];
  updated: string[];
}

interface MarkLookup {
  isNew: (slug: string) => boolean;
  isUpdated: (slug: string) => boolean;
}

const NONE: MarkLookup = { isNew: () => false, isUpdated: () => false };

const ReleaseMarksContext = createContext<MarkLookup>(NONE);

export function ReleaseMarksProvider({ marks, children }: { marks: ReleaseMarks; children: ReactNode }) {
  const lookup = useMemo<MarkLookup>(() => {
    const added = new Set(marks.new);
    const updated = new Set(marks.updated);
    return { isNew: (slug) => added.has(slug), isUpdated: (slug) => updated.has(slug) };
  }, [marks]);
  return <ReleaseMarksContext.Provider value={lookup}>{children}</ReleaseMarksContext.Provider>;
}

export function useReleaseMarks(): MarkLookup {
  return useContext(ReleaseMarksContext);
}
