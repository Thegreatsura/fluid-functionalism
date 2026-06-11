"use client";

import { useState } from "react";
import Link from "next/link";
import { useIcon } from "@/lib/icon-context";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";
import { ScrollArea } from "@/registry/radix/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/registry/default/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/registry/default/select";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const TIMEZONES = [
  ["utc-8", "(UTC-8) Pacific Time"],
  ["utc-7", "(UTC-7) Mountain Time"],
  ["utc-6", "(UTC-6) Central Time"],
  ["utc-5", "(UTC-5) Eastern Time"],
  ["utc-4", "(UTC-4) Atlantic Time"],
  ["utc-3", "(UTC-3) Buenos Aires"],
  ["utc-1", "(UTC-1) Azores"],
  ["utc+0", "(UTC+0) London"],
  ["utc+1", "(UTC+1) Paris"],
  ["utc+2", "(UTC+2) Helsinki"],
  ["utc+3", "(UTC+3) Moscow"],
  ["utc+5:30", "(UTC+5:30) Mumbai"],
  ["utc+8", "(UTC+8) Singapore"],
  ["utc+9", "(UTC+9) Tokyo"],
  ["utc+10", "(UTC+10) Sydney"],
  ["utc+12", "(UTC+12) Auckland"],
] as const;

const RELEASES = Array.from(
  { length: 24 },
  (_, i) => `v1.${23 - i}.0 — maintenance release`
);

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CITIES = [
  "Amsterdam", "Berlin", "Copenhagen", "Dublin", "Helsinki", "Lisbon",
  "London", "Madrid", "Oslo", "Paris", "Prague", "Stockholm",
  "Vienna", "Warsaw", "Zurich",
];

// Deterministic fake metric so the table renders identically on every pass.
function metric(row: number, col: number) {
  return (((row + 3) * (col + 7) * 37) % 900) + 100;
}

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const PROBLEM_CODE = `// ❌ Native overflow — the list just stops. Nothing says
// there are 18 more releases below the fold, and on macOS
// the scrollbar is invisible until you happen to scroll.
<div className="h-56 overflow-y-auto">
  {releases.map((r) => <Row key={r} label={r} />)}
</div>

// ✅ ScrollArea — a surface gradient + chevron marks every
// edge with more content, and the scrollbar is always
// discoverable on hover.
<ScrollArea className="h-56">
  {releases.map((r) => <Row key={r} label={r} />)}
</ScrollArea>`;

const SIZES_CODE = `import { ScrollArea } from "./components";

// Two cue band sizes: "tight" (32px) for dense surfaces,
// "comfortable" (60px, default) everywhere else. The chevron
// stays 16px in both.
<ScrollArea cueSize="tight" className="h-56 w-64">
  ...
</ScrollArea>

<ScrollArea cueSize="comfortable" className="h-56 w-64">
  ...
</ScrollArea>`;

const TABLE_CODE = `import { ScrollArea } from "./components";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "./components";

// Double overflow: a Table both taller and wider than its
// container. orientation="both" tracks all four edges and adds
// both scrollbars plus the corner. w-max lets the table grow
// past the viewport width instead of squeezing into it.
<ScrollArea orientation="both" className="h-80 w-full">
  <Table className="w-max">
    <TableHeader>
      <TableRow>
        <TableHead>City</TableHead>
        {months.map((m) => (
          <TableHead key={m} className="text-right">{m}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {cities.map((city, r) => (
        <TableRow key={city} index={r}>
          <TableCell>{city}</TableCell>
          {months.map((m, c) => (
            <TableCell key={m} className="text-right tabular-nums">
              {metric(r, c)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</ScrollArea>`;

const HORIZONTAL_CODE = `import { ScrollArea } from "./components";

<ScrollArea orientation="horizontal" className="w-full">
  <div className="flex gap-2 p-3 w-max">
    {months.map((month) => (
      <Card key={month} label={month} />
    ))}
  </div>
</ScrollArea>`;

const NO_CHEVRON_CODE = `import { ScrollArea } from "./components";

// Fade-only cues: the gradient still marks overflowing edges,
// the directional chevron is dropped.
<ScrollArea chevron={false} className="h-64 w-72">
  ...
</ScrollArea>`;

const SELECT_CODE = `// SelectContent owns its own scroller (listbox role, keyboard
// nav), so it consumes the primitives directly instead of
// wrapping in ScrollArea — same hook, same cue, sticky mode.
<Select value={timezone} onValueChange={setTimezone}>
  <SelectTrigger icon={Globe} placeholder="Select timezone…" />
  <SelectContent>
    {timezones.map(([value, label], i) => (
      <SelectItem key={value} index={i} value={value}>
        {label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>`;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const scrollAreaProps: PropDef[] = [
  {
    name: "orientation",
    type: '"vertical" | "horizontal" | "both"',
    default: '"vertical"',
    description: "Which axes get scrollbars and edge cues.",
  },
  {
    name: "scrollFade",
    type: "boolean",
    default: "true",
    description:
      "Surface-gradient + chevron cues at edges with more content. Auto-shows on overflow; set to false to disable.",
  },
  {
    name: "chevron",
    type: "boolean",
    default: "true",
    description:
      "Show the directional chevron in the cues. The gradient fade always renders; set to false for fade-only cues.",
  },
  {
    name: "cueSize",
    type: '"tight" | "comfortable"',
    default: '"comfortable"',
    description:
      "Cue band size along the scroll axis — tight is 32px, comfortable is 60px. The chevron stays 16px in either.",
  },
  {
    name: "viewportClassName",
    type: "string",
    description: "Additional classes for the inner scrolling viewport.",
  },
  {
    name: "className",
    type: "string",
    description:
      "Classes for the outer container — set the height/width constraint here.",
  },
];

const useScrollEdgesProps: PropDef[] = [
  {
    name: "ref",
    type: "RefObject<HTMLElement>",
    description: "The scroll container to observe.",
  },
  {
    name: "enabled",
    type: "boolean",
    default: "true",
    description:
      "Attach/detach tracking. Callers whose scroller mounts late (portals) fold that into enabled so the hook re-attaches once the element exists.",
  },
  {
    name: "axis",
    type: '"vertical" | "horizontal" | "both"',
    default: '"vertical"',
    description: "Which axes to measure.",
  },
];

const scrollEdgeCueProps: PropDef[] = [
  {
    name: "edge",
    type: '"top" | "bottom" | "left" | "right"',
    description: "Which scroll edge the cue marks.",
  },
  {
    name: "visible",
    type: "boolean",
    description: "Whether the cue shows — wire to the matching useScrollEdges flag.",
  },
  {
    name: "mode",
    type: '"sticky" | "absolute"',
    default: '"sticky"',
    description:
      "sticky renders a zero-size element inside the scroller; absolute renders a band for an overlay sitting over the viewport.",
  },
  {
    name: "surfaceLevel",
    type: "number",
    default: "useSurface()",
    description:
      "Surface ladder level the gradient fades toward. Override only on backgrounds outside the ladder.",
  },
  {
    name: "size",
    type: '"tight" | "comfortable"',
    default: '"comfortable"',
    description:
      "Band size along the scroll axis — tight is 32px, comfortable is 60px. The chevron stays 16px in either.",
  },
  {
    name: "inset",
    type: "number",
    default: "4",
    description:
      "Sticky-mode bleed in px. Must match the scroller's own padding (4 for p-1, 16 for p-4) so the band — and the chevron's 8px offset — land exactly on the visible edge.",
  },
  {
    name: "chevron",
    type: "boolean",
    default: "true",
    description:
      "Show the directional chevron in the band. The gradient fade always renders; set to false for a fade-only cue.",
  },
];

// ---------------------------------------------------------------------------
// Demos
// ---------------------------------------------------------------------------

function ReleaseRows() {
  return (
    <div className="flex flex-col p-3">
      {RELEASES.map((release) => (
        <div
          key={release}
          className="px-3 py-2 text-[13px] text-foreground whitespace-nowrap"
        >
          {release}
        </div>
      ))}
    </div>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[12px] text-muted-foreground text-center">
      {children}
    </span>
  );
}

function ProblemDemo() {
  const shape = useShape();
  return (
    <ComponentPreview code={PROBLEM_CODE} padding="responsive">
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="flex flex-col gap-2">
          <div
            className={`h-56 w-64 overflow-y-auto border border-border ${shape.container}`}
          >
            <ReleaseRows />
          </div>
          <PanelLabel>❌ Native — no hint of 18 more rows</PanelLabel>
        </div>
        <div className="flex flex-col gap-2">
          <ScrollArea
            className={`h-56 w-64 border border-border ${shape.container}`}
          >
            <ReleaseRows />
          </ScrollArea>
          <PanelLabel>✅ Treated — edge cues + scrollbar</PanelLabel>
        </div>
      </div>
    </ComponentPreview>
  );
}

function SizesDemo() {
  const shape = useShape();
  return (
    <ComponentPreview code={SIZES_CODE} padding="responsive">
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="flex flex-col gap-2">
          <ScrollArea
            cueSize="tight"
            className={`h-56 w-64 border border-border ${shape.container}`}
          >
            <ReleaseRows />
          </ScrollArea>
          <PanelLabel>Tight — 32px band</PanelLabel>
        </div>
        <div className="flex flex-col gap-2">
          <ScrollArea
            cueSize="comfortable"
            className={`h-56 w-64 border border-border ${shape.container}`}
          >
            <ReleaseRows />
          </ScrollArea>
          <PanelLabel>Comfortable — 60px band (default)</PanelLabel>
        </div>
      </div>
    </ComponentPreview>
  );
}

function TableDemo() {
  const shape = useShape();
  return (
    <ComponentPreview code={TABLE_CODE} padding="compact">
      <ScrollArea
        orientation="both"
        className={`h-80 w-full border border-border ${shape.container}`}
      >
        <Table className="w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">City</TableHead>
              {MONTHS.map((m) => (
                <TableHead key={m} className="text-right whitespace-nowrap">
                  {m}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {CITIES.map((city, r) => (
              <TableRow key={city} index={r}>
                <TableCell className="text-foreground whitespace-nowrap">
                  {city}
                </TableCell>
                {MONTHS.map((m, c) => (
                  <TableCell
                    key={m}
                    className="text-right tabular-nums whitespace-nowrap"
                  >
                    {metric(r, c)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </ComponentPreview>
  );
}

function HorizontalDemo() {
  const shape = useShape();
  return (
    <ComponentPreview code={HORIZONTAL_CODE} padding="compact">
      <ScrollArea orientation="horizontal" className="w-full">
        <div className="flex gap-2 p-3 w-max">
          {MONTHS.map((month) => (
            <div
              key={month}
              className={`flex items-center justify-center h-20 w-28 shrink-0 border border-border text-[13px] text-foreground ${shape.bg}`}
            >
              {month}
            </div>
          ))}
        </div>
      </ScrollArea>
    </ComponentPreview>
  );
}

function NoChevronDemo() {
  const shape = useShape();
  return (
    <ComponentPreview code={NO_CHEVRON_CODE}>
      <ScrollArea
        chevron={false}
        className={`h-64 w-72 border border-border ${shape.container}`}
      >
        <ReleaseRows />
      </ScrollArea>
    </ComponentPreview>
  );
}

function SelectDemo() {
  const Globe = useIcon("globe");
  const [timezone, setTimezone] = useState("");
  return (
    <ComponentPreview code={SELECT_CODE} minHeightClass="min-h-[380px]">
      <div className="w-64">
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger icon={Globe} placeholder="Select timezone…" />
          <SelectContent>
            {TIMEZONES.map(([value, label], i) => (
              <SelectItem key={value} index={i} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Doc Page
// ---------------------------------------------------------------------------

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-[15px] text-foreground mt-2"
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] text-muted-foreground leading-relaxed">
      {children}
    </p>
  );
}

export default function ScrollingListDoc() {
  return (
    <DocPage
      title="Scrolling list"
      slug="scrolling-list"
      installSlug="scroll-area"
      description={
        <>
          Every scrolling surface gets the same affordances: a surface-colour
          gradient with a chevron at edges that have more content, and a
          scrollbar that stays discoverable — native where that feels better.
        </>
      }
    >
      <DocSection title="The problem">
        <div className="flex flex-col gap-3 text-[13px] text-muted-foreground leading-relaxed">
          <p>
            A clipped list looks finished. When content stops exactly at the
            container edge there is no signal that anything sits below the
            fold — and since macOS hides scrollbars until you scroll, the one
            built-in affordance often is not there either. Users simply do not
            scroll what does not look scrollable.
          </p>
        </div>
        <ProblemDemo />
      </DocSection>

      <DocSection title="The system">
        <div className="flex flex-col gap-3 text-[13px] text-muted-foreground leading-relaxed">
          <p>
            Two layers: primitives that any component can drop into its own
            scroller, and a wrapper that bundles everything for the common
            case.
          </p>
        </div>

        <H3>Edge primitives</H3>
        <P>
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">
            useScrollEdges
          </code>{" "}
          observes a scroll container — position, resizes, and content
          changes — and reports which edges have more content.{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">
            ScrollEdgeCue
          </code>{" "}
          renders the affordance for one edge. The gradient fades toward the
          surface level provided by context, so it matches the actual
          background at any depth of the{" "}
          <Link href="/docs/surfaces" className="underline underline-offset-2">
            surface ladder
          </Link>{" "}
          — a menu elevated two levels above a dialog fades into the menu
          colour, not the page colour.
        </P>

        <H3>ScrollArea</H3>
        <P>
          The wrapper composes the cues with restyled overlay scrollbars
          (thumb radius follows the shape system — press{" "}
          <kbd className="px-1 py-0.5 rounded bg-muted text-[12px] font-mono">
            R
          </kbd>
          ) and falls back to native overflow scrolling on touch-primary
          devices, where platform scroll physics beat any custom scrollbar.
          The edge cues stay active in both modes. Ships in Radix and Base UI
          flavors (same API — switch with the Primitive toggle); scrollbar
          machinery adapted from{" "}
          <a
            href="https://lina.sameer.sh"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Lina
          </a>
          .
        </P>
      </DocSection>

      <DocSection title="Examples">
        <H3>Horizontal</H3>
        <P>Left/right chevrons, same gradient logic per edge.</P>
        <HorizontalDemo />

        <H3>Cue size</H3>
        <P>
          Two band sizes:{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">
            tight
          </code>{" "}
          (32px) for dense surfaces and{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">
            comfortable
          </code>{" "}
          (60px, the default) everywhere else. The chevron stays 16px in both
          — only the gradient runway changes.
        </P>
        <SizesDemo />

        <H3>Double overflow</H3>
        <P>
          A table both taller and wider than its container.{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">
            orientation=&quot;both&quot;
          </code>{" "}
          tracks all four edges independently and adds both scrollbars plus
          the corner.
        </P>
        <TableDemo />

        <H3>Without chevron</H3>
        <P>
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">
            chevron={"{false}"}
          </code>{" "}
          drops the directional chevron for quieter surfaces — the gradient
          fade always stays, so overflowing edges still read as unfinished.
        </P>
        <NoChevronDemo />

        <H3>Select</H3>
        <P>
          SelectContent consumes the same primitives in sticky mode inside its
          own listbox — the cue gradient picks up the menu&apos;s elevated
          surface automatically. MobileDrawer does the same on its panel.
        </P>
        <SelectDemo />
      </DocSection>

      <DocSection title="API reference">
        <H3>ScrollArea</H3>
        <PropsTable props={scrollAreaProps} />

        <H3>useScrollEdges</H3>
        <PropsTable props={useScrollEdgesProps} />

        <H3>ScrollEdgeCue</H3>
        <PropsTable props={scrollEdgeCueProps} />
      </DocSection>
    </DocPage>
  );
}
