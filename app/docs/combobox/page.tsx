"use client";

import { useState } from "react";
import { useIcon, type IconComponent } from "@/lib/icon-context";
import {
  Combobox,
  ComboboxInput,
  ComboboxChips,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/flavored/combobox";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { ComboboxPlayground } from "@/lib/docs/playgrounds/combobox";

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const FRAMEWORKS = [
  { value: "next", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt", label: "Nuxt" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "solid", label: "SolidStart" },
  { value: "qwik", label: "Qwik City" },
];

const TIMEZONES = [
  "(UTC−12) Baker Island",
  "(UTC−10) Honolulu",
  "(UTC−9) Anchorage",
  "(UTC−8) Los Angeles",
  "(UTC−7) Denver",
  "(UTC−6) Mexico City",
  "(UTC−5) New York",
  "(UTC−4) Santiago",
  "(UTC−3) São Paulo",
  "(UTC−2) South Georgia",
  "(UTC−1) Azores",
  "(UTC+0) London",
  "(UTC+1) Paris",
  "(UTC+2) Cairo",
  "(UTC+3) Moscow",
  "(UTC+4) Dubai",
  "(UTC+5) Karachi",
  "(UTC+5:30) Mumbai",
  "(UTC+6) Dhaka",
  "(UTC+7) Bangkok",
  "(UTC+8) Singapore",
  "(UTC+9) Tokyo",
  "(UTC+10) Sydney",
  "(UTC+11) Nouméa",
  "(UTC+12) Auckland",
];

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const basicCode = `import {
  Combobox, ComboboxInput, ComboboxContent,
  ComboboxList, ComboboxItem, ComboboxEmpty,
} from "./components";
import { useState } from "react";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt", label: "Nuxt" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];
const [value, setValue] = useState("");

<Combobox items={frameworks} value={value} onValueChange={setValue}>
  <ComboboxInput placeholder="Select a framework…" />
  <ComboboxContent>
    <ComboboxEmpty>No framework found.</ComboboxEmpty>
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item.value} value={item.value}>
          {item.label}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`;

const iconsCode = `import {
  Combobox, ComboboxInput, ComboboxContent,
  ComboboxList, ComboboxItem, ComboboxEmpty,
} from "./components";
import { Users, Star, Clock, Lock, Mail } from "lucide-react";

const views = [
  { value: "shared", label: "Shared with me", icon: Users },
  { value: "starred", label: "Starred", icon: Star },
  { value: "recent", label: "Recent", icon: Clock },
  { value: "private", label: "Private", icon: Lock },
  { value: "inbox", label: "Inbox", icon: Mail },
];

<Combobox items={views} value={view} onValueChange={setView}>
  <ComboboxInput icon={SearchIcon} placeholder="Jump to view…" />
  <ComboboxContent>
    <ComboboxEmpty>No view matches.</ComboboxEmpty>
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item.value} value={item.value} icon={item.icon}>
          {item.label}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`;

const multipleCode = `import {
  Combobox, ComboboxChips, ComboboxContent,
  ComboboxList, ComboboxItem, ComboboxEmpty,
} from "./components";
import { useState } from "react";

const [values, setValues] = useState<string[]>(["next", "astro"]);

{/* multiple: values are string[]; ComboboxChips shows one chip per pick */}
<Combobox multiple items={frameworks} value={values} onValueChange={setValues}>
  <ComboboxChips placeholder="Add frameworks…" />
  <ComboboxContent>
    <ComboboxEmpty>No framework found.</ComboboxEmpty>
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item.value} value={item.value}>
          {item.label}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`;

const variantsCode = `import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from "./components";

{/* Bordered (default): framed at rest */}
<Combobox items={frameworks}>
  <ComboboxInput variant="bordered" placeholder="Bordered" />
  …
</Combobox>

{/* Borderless: invisible at rest */}
<Combobox items={frameworks}>
  <ComboboxInput variant="borderless" placeholder="Borderless" />
  …
</Combobox>`;

const longListCode = `import {
  Combobox, ComboboxInput, ComboboxContent,
  ComboboxList, ComboboxItem, ComboboxEmpty,
} from "./components";

// String items are their own value and label.
const timezones = ["(UTC−8) Los Angeles", "(UTC−5) New York", "(UTC+0) London", /* … */];

<Combobox items={timezones} value={tz} onValueChange={setTz}>
  <ComboboxInput icon={Globe} placeholder="Search timezones…" />
  <ComboboxContent>
    <ComboboxEmpty>No timezone matches.</ComboboxEmpty>
    <ComboboxList>
      {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`;

const statesCode = `import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from "./components";

{/* Error */}
<Combobox items={frameworks} value={value} onValueChange={setValue}>
  <ComboboxInput placeholder="Select a framework…" error="Pick a framework to continue." />
  …
</Combobox>

{/* Disabled */}
<Combobox items={frameworks} disabled>
  <ComboboxInput placeholder="Disabled" />
  …
</Combobox>`;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const comboboxProps: PropDef[] = [
  { name: "items", type: "readonly (string | { value: string; label: string })[]", description: "The options. A string is its own value and label; an object carries value, label, and whatever your rows need." },
  { name: "multiple", type: "boolean", default: "false", description: "Any number of picks. Values become string[]; use ComboboxChips for the field." },
  { name: "value", type: "string | string[]", description: "Selected value. \"\" means none; an array when multiple." },
  { name: "defaultValue", type: "string | string[]", description: "Initial selection." },
  { name: "onValueChange", type: "(value: string | string[]) => void", description: "Called with the pick, \"\" when cleared, or the array when multiple." },
  { name: "filter", type: "(item, query: string) => boolean", description: "Match an item against the query. Default: case-insensitive contains on the label." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the field and the popup." },
  { name: "name", type: "string", description: "Form field name; a hidden input carries the value." },
  { name: "required", type: "boolean", description: "Marks the hidden form input required." },
  { name: "size", type: '"default" | "compact"', description: "Pins field and popup to one size step. Omitted, both follow the SizeProvider." },
];

const inputProps: PropDef[] = [
  { name: "variant", type: '"bordered" | "borderless"', default: '"bordered"', description: "Framed at rest, or invisible until hovered or focused." },
  { name: "icon", type: "IconComponent", description: "Leading icon inside the field." },
  { name: "placeholder", type: "string", default: '"Search…"', description: "Shown while nothing is typed or selected." },
  { name: "error", type: "string", description: "Error message under the field; tints the ring and sets aria-invalid." },
  { name: "clearable", type: "boolean", default: "false", description: "A ✕ that clears the pick and the query. Its slot is always reserved, so the width never changes." },
  { name: "size", type: '"default" | "compact"', description: "Size for the field alone. Prefer size on Combobox so the popup matches." },
];

const chipsProps: PropDef[] = [
  { name: "variant", type: '"bordered" | "borderless"', default: '"bordered"', description: "Same field ladder as ComboboxInput." },
  { name: "icon", type: "IconComponent", description: "Leading icon inside the field." },
  { name: "placeholder", type: "string", default: '"Search…"', description: "Shown while nothing is selected or typed." },
  { name: "error", type: "string", description: "Error message under the field; tints the ring and sets aria-invalid." },
  { name: "clearable", type: "boolean", default: "false", description: "A ✕ that clears every chip and the query. Its slot is always reserved." },
  { name: "size", type: '"default" | "compact"', description: "Size for the field alone. Chips and input step down together." },
];

const contentProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "ComboboxEmpty and ComboboxList." },
  { name: "side", type: '"top" | "bottom" | "left" | "right"', default: '"bottom"', description: "Side of the field the popup prefers." },
  { name: "align", type: '"start" | "center" | "end"', default: '"start"', description: "Alignment against the field." },
  { name: "sideOffset", type: "number", default: "6", description: "Gap to the field, in px." },
];

const listProps: PropDef[] = [
  { name: "children", type: "(item, index: number) => ReactNode", description: "Return a ComboboxItem per match. Rows get their index from the list." },
];

const itemProps: PropDef[] = [
  { name: "value", type: "string", description: "The item's value: the string itself, or the object's value." },
  { name: "icon", type: "IconComponent", description: "Leading icon in the row." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the row." },
  { name: "children", type: "ReactNode", description: "The row label." },
];

// ---------------------------------------------------------------------------
// Doc page
// ---------------------------------------------------------------------------

// ── Playground ───────────────────────────────────────────
// The state + controls live in the shared module (lib/docs/playgrounds) so
// the /demo slide can drive the same sandbox from its pen menu.

function ComboboxPlaygroundSection() {
  return (
    <ComboboxPlayground>
      {({ preview, controls, code }) => (
        <PlaygroundLayout
          controls={controls}
          preview={
            <ComponentPreview code={code} minHeightClass="min-h-[360px]" align="top">
              <div className="pt-6">{preview}</div>
            </ComponentPreview>
          }
        />
      )}
    </ComboboxPlayground>
  );
}

export default function ComboboxDoc() {
  const SearchIcon = useIcon("search");
  const Globe = useIcon("globe");
  const Users = useIcon("users");
  const Star = useIcon("star");
  const Clock = useIcon("clock");
  const Lock = useIcon("lock");
  const Mail = useIcon("mail");

  const views: { value: string; label: string; icon: IconComponent }[] = [
    { value: "shared", label: "Shared with me", icon: Users },
    { value: "starred", label: "Starred", icon: Star },
    { value: "recent", label: "Recent", icon: Clock },
    { value: "private", label: "Private", icon: Lock },
    { value: "inbox", label: "Inbox", icon: Mail },
  ];

  const [framework, setFramework] = useState("");
  const [view, setView] = useState("");
  const [bordered, setBordered] = useState("");
  const [borderless, setBorderless] = useState("");
  const [timezone, setTimezone] = useState("");
  const [errored, setErrored] = useState("");
  const [stack, setStack] = useState<string[]>(["next", "astro"]);

  const frameworkRows = (item: { value: string; label: string } | string) => {
    const value = typeof item === "string" ? item : item.value;
    const label = typeof item === "string" ? item : item.label;
    return (
      <ComboboxItem key={value} value={value}>
        {label}
      </ComboboxItem>
    );
  };

  return (
    <DocPage
      title="Combobox"
      slug="combobox"
      description="Type to filter a list. 1 pick, or chips."
    >
      <DocSection title="Playground">
        <ComboboxPlaygroundSection />
      </DocSection>

      <DocSection title="Basic">
        <p className="text-subtitle text-muted-foreground">
          Items are data on the root, <code>ComboboxList</code> renders a row
          per match. Type, then press Enter to pick the highlighted row.
        </p>
        <ComponentPreview code={basicCode}>
          <Combobox items={FRAMEWORKS} value={framework} onValueChange={setFramework}>
            <ComboboxInput placeholder="Select a framework…" />
            <ComboboxContent>
              <ComboboxEmpty>No framework found.</ComboboxEmpty>
              <ComboboxList>{frameworkRows}</ComboboxList>
            </ComboboxContent>
          </Combobox>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With icons">
        <ComponentPreview code={iconsCode}>
          <Combobox items={views} value={view} onValueChange={setView}>
            <ComboboxInput icon={SearchIcon} placeholder="Jump to view…" />
            <ComboboxContent>
              <ComboboxEmpty>No view matches.</ComboboxEmpty>
              <ComboboxList>
                {(item) => {
                  const v = item as (typeof views)[number];
                  return (
                    <ComboboxItem key={v.value} value={v.value} icon={v.icon}>
                      {v.label}
                    </ComboboxItem>
                  );
                }}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Multiple selection">
        <p className="text-subtitle text-muted-foreground">
          <code>multiple</code> plus <code>ComboboxChips</code>: 1 chip per
          pick, touching picks share one background. Press Backspace in an
          empty field to drop the last chip.
        </p>
        <ComponentPreview code={multipleCode} minHeightClass="min-h-[160px]">
          <Combobox multiple items={FRAMEWORKS} value={stack} onValueChange={setStack}>
            <ComboboxChips placeholder="Add frameworks…" className="w-[360px] max-w-full" />
            <ComboboxContent>
              <ComboboxEmpty>No framework found.</ComboboxEmpty>
              <ComboboxList>{frameworkRows}</ComboboxList>
            </ComboboxContent>
          </Combobox>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Variants">
        <ComponentPreview code={variantsCode}>
          <div className="flex flex-wrap items-center gap-3">
            <Combobox items={FRAMEWORKS} value={bordered} onValueChange={setBordered}>
              <ComboboxInput variant="bordered" placeholder="Bordered" />
              <ComboboxContent>
                <ComboboxEmpty>No framework found.</ComboboxEmpty>
                <ComboboxList>{frameworkRows}</ComboboxList>
              </ComboboxContent>
            </Combobox>
            <Combobox items={FRAMEWORKS} value={borderless} onValueChange={setBorderless}>
              <ComboboxInput variant="borderless" placeholder="Borderless" />
              <ComboboxContent>
                <ComboboxEmpty>No framework found.</ComboboxEmpty>
                <ComboboxList>{frameworkRows}</ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Long list">
        <p className="text-subtitle text-muted-foreground">
          String items are their own value and label. The list scrolls past
          300px.
        </p>
        <ComponentPreview code={longListCode} minHeightClass="min-h-[160px]">
          <Combobox items={TIMEZONES} value={timezone} onValueChange={setTimezone}>
            <ComboboxInput icon={Globe} placeholder="Search timezones…" className="w-[280px]" />
            <ComboboxContent>
              <ComboboxEmpty>No timezone matches.</ComboboxEmpty>
              <ComboboxList>{frameworkRows}</ComboboxList>
            </ComboboxContent>
          </Combobox>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Error & disabled">
        <ComponentPreview code={statesCode}>
          <div className="flex flex-wrap items-start gap-3">
            <Combobox items={FRAMEWORKS} value={errored} onValueChange={setErrored}>
              <ComboboxInput placeholder="Select a framework…" error="Pick a framework to continue." />
              <ComboboxContent>
                <ComboboxEmpty>No framework found.</ComboboxEmpty>
                <ComboboxList>{frameworkRows}</ComboboxList>
              </ComboboxContent>
            </Combobox>
            <Combobox items={FRAMEWORKS} disabled>
              <ComboboxInput placeholder="Disabled" />
              <ComboboxContent>
                <ComboboxList>{frameworkRows}</ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — Combobox">
        <PropsTable props={comboboxProps} />
      </DocSection>

      <DocSection title="API Reference — ComboboxInput">
        <PropsTable props={inputProps} />
      </DocSection>

      <DocSection title="API Reference — ComboboxChips">
        <PropsTable props={chipsProps} />
      </DocSection>

      <DocSection title="API Reference — ComboboxContent">
        <PropsTable props={contentProps} />
      </DocSection>

      <DocSection title="API Reference — ComboboxList">
        <PropsTable props={listProps} />
      </DocSection>

      <DocSection title="API Reference — ComboboxItem">
        <PropsTable props={itemProps} />
      </DocSection>
    </DocPage>
  );
}
