"use client";

import { useState } from "react";
import { useIcon } from "@/lib/icon-context";
import {
  Dropdown,
  DropdownLabel,
  DropdownSeparator,
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownSearch,
  DropdownEmpty,
} from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { Button } from "@/registry/radix/button";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { DropdownPlayground } from "@/lib/docs/playgrounds/dropdown";

const basicCode = `import { Dropdown, MenuItem } from "./components";
import { SquareLibrary, Clock, Star, Users, Lock } from "lucide-react";
import { useState } from "react";

const items = [
  { icon: SquareLibrary, label: "Teamspaces" },
  { icon: Clock, label: "Recents" },
  { icon: Star, label: "Favorites" },
  { icon: Users, label: "Shared" },
  { icon: Lock, label: "Private" },
];
const [selected, setSelected] = useState<number | null>(0);

<Dropdown checkedIndex={selected ?? undefined}>
  {items.map((item, i) => (
    <MenuItem
      key={item.label}
      index={i}
      icon={item.icon}
      label={item.label}
      checked={selected === i}
      onSelect={() => setSelected(selected === i ? null : i)}
    />
  ))}
</Dropdown>`;

const groupsCode = `import { Dropdown, DropdownLabel, DropdownSeparator, MenuItem } from "./components";
import { Mail, Bell, Shield, Settings, Palette, Monitor } from "lucide-react";

<Dropdown>
  <DropdownLabel>Account</DropdownLabel>
  <MenuItem index={0} icon={Mail} label="Email" />
  <MenuItem index={1} icon={Bell} label="Notifications" />
  <MenuItem index={2} icon={Shield} label="Privacy" />
  <DropdownSeparator />
  <DropdownLabel>Appearance</DropdownLabel>
  <MenuItem index={3} icon={Settings} label="General" />
  <MenuItem index={4} icon={Palette} label="Theme" />
  <MenuItem index={5} icon={Monitor} label="Display" />
</Dropdown>`;

const triggeredCode = `import { DropdownMenu, DropdownTrigger, DropdownContent, MenuItem, Button } from "./components";
import { SquareLibrary, Clock, Star, Users, Lock } from "lucide-react";
import { useState } from "react";

const items = [
  { icon: SquareLibrary, label: "Teamspaces" },
  { icon: Clock, label: "Recents" },
  { icon: Star, label: "Favorites" },
  { icon: Users, label: "Shared" },
  { icon: Lock, label: "Private" },
];
const [view, setView] = useState(0);

<DropdownMenu>
  <DropdownTrigger render={<Button variant="ghost">Open menu</Button>} />
  <DropdownContent checkedIndex={view}>
    {items.map((item, i) => (
      <MenuItem
        key={item.label}
        index={i}
        icon={item.icon}
        label={item.label}
        checked={view === i}
        onSelect={() => setView(i)}
      />
    ))}
  </DropdownContent>
</DropdownMenu>`;

const searchableCode = `import {
  DropdownMenu, DropdownTrigger, DropdownContent,
  DropdownSearch, DropdownEmpty, MenuItem, Button,
} from "./components";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const LANGUAGES = ["Auto detect", "Albanian (Albania)", "Arabic", "Bengali", /* … */];
const [language, setLanguage] = useState("Auto detect");
const [query, setQuery] = useState("");

// Filter the rows you render; the popup re-indexes from 0 each time.
const matches = LANGUAGES.filter((l) =>
  l.toLowerCase().includes(query.toLowerCase())
);

<DropdownMenu>
  <DropdownTrigger
    render={
      <Button variant="ghost" trailingIcon={ChevronDown}>
        {language}
      </Button>
    }
  />
  <DropdownContent checkedIndex={matches.indexOf(language)}>
    <DropdownSearch
      value={query}
      onValueChange={setQuery}
      placeholder="Search languages"
    />
    {matches.map((l, i) => (
      <MenuItem
        key={l}
        index={i}
        label={l}
        checked={language === l}
        onSelect={() => setLanguage(l)}
      />
    ))}
    {matches.length === 0 && <DropdownEmpty>No languages found</DropdownEmpty>}
  </DropdownContent>
</DropdownMenu>`;

const multipleCode = `import { DropdownMenu, DropdownTrigger, DropdownContent, MenuItem, Button } from "./components";
import { useState } from "react";

const STATUSES = ["Open", "In progress", "In review", "Blocked", "Done", "Archived"];

const [checked, setChecked] = useState<number[]>([0, 1, 2]);
const toggle = (i: number) =>
  setChecked((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));

{/* checkedIndices turns rows into checkbox items that keep the menu open,
    and contiguous checked rows share one merged background. */}
<DropdownMenu>
  <DropdownTrigger render={<Button variant="ghost">Status</Button>} />
  <DropdownContent checkedIndices={checked}>
    {STATUSES.map((s, i) => (
      <MenuItem
        key={s}
        index={i}
        label={s}
        checked={checked.includes(i)}
        onSelect={() => toggle(i)}
      />
    ))}
  </DropdownContent>
</DropdownMenu>`;

const STATUSES = ["Open", "In progress", "In review", "Blocked", "Done", "Archived"];

const searchableMultipleCode = `import {
  DropdownMenu, DropdownTrigger, DropdownContent,
  DropdownSearch, DropdownEmpty, MenuItem, Button,
} from "./components";
import { useState } from "react";

const LABELS = ["Bug", "Feature", "Docs", "Design", "Performance", /* … */];
const [labels, setLabels] = useState<string[]>(["Bug", "Design"]);
const [query, setQuery] = useState("");
const matches = LABELS.filter((l) => l.toLowerCase().includes(query.toLowerCase()));
const toggle = (l: string) =>
  setLabels((c) => (c.includes(l) ? c.filter((x) => x !== l) : [...c, l]));

// Both checked rows and indices are read off the FILTERED list.
<DropdownMenu>
  <DropdownTrigger render={<Button variant="ghost">Labels · {labels.length}</Button>} />
  <DropdownContent
    checkedIndices={matches.flatMap((l, i) => (labels.includes(l) ? [i] : []))}
  >
    <DropdownSearch value={query} onValueChange={setQuery} placeholder="Search labels" />
    {matches.map((l, i) => (
      <MenuItem key={l} index={i} label={l} checked={labels.includes(l)} onSelect={() => toggle(l)} />
    ))}
    {matches.length === 0 && <DropdownEmpty>No labels found</DropdownEmpty>}
  </DropdownContent>
</DropdownMenu>`;

const LABELS = [
  "Bug",
  "Feature",
  "Docs",
  "Design",
  "Performance",
  "Accessibility",
  "Refactor",
  "Testing",
  "Infrastructure",
  "Security",
  "Good first issue",
  "Help wanted",
];

const LANGUAGES = [
  "Auto detect",
  "Albanian (Albania)",
  "Arabic",
  "Bengali",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Czech",
  "Danish",
  "Dutch",
  "English (UK)",
  "English (US)",
  "Finnish",
  "French",
  "German",
  "Greek",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Indonesian",
  "Italian",
  "Japanese",
  "Korean",
  "Norwegian",
  "Polish",
  "Portuguese (Brazil)",
  "Portuguese (Portugal)",
  "Romanian",
  "Russian",
  "Spanish",
  "Swedish",
  "Thai",
  "Turkish",
  "Ukrainian",
  "Vietnamese",
];

const dropdownProps: PropDef[] = [
  { name: "checkedIndex", type: "number", description: "Index of the currently checked item." },
  { name: "checkedIndices", type: "number[]", description: "Multiple selection: the checked rows. Rows become checkbox items and contiguous checked rows share one merged background that merges and splits as the selection changes." },
  { name: "children", type: "ReactNode", description: "MenuItem children." },
  { name: "aria-label", type: "string", description: "Accessible name for the inline panel. The always-visible panel renders as a plain role=\"group\" — popup menu semantics (role=\"menu\") belong to the triggered DropdownContent." },
];

const dropdownMenuProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "DropdownTrigger and DropdownContent." },
  { name: "open", type: "boolean", description: "Controlled open state." },
  { name: "defaultOpen", type: "boolean", default: "false", description: "Initial open state (uncontrolled)." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the menu opens or closes." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables opening the menu." },
];

const dropdownTriggerProps: PropDef[] = [
  { name: "render", type: "ReactElement", description: "Element to render as the trigger (Base UI composition), e.g. a Button." },
  { name: "children", type: "ReactNode", description: "Trigger content when no render element is given." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the trigger." },
];

const dropdownContentProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "MenuItem, DropdownLabel, and DropdownSeparator children." },
  { name: "checkedIndex", type: "number", description: "Index of the checked item — drives the animated selected background and the radio-group value." },
  { name: "checkedIndices", type: "number[]", description: "Multiple selection: the checked rows. Rows become checkbox items that keep the menu open when toggled, and contiguous checked rows share one merged background." },
  { name: "side", type: "\"top\" | \"bottom\" | \"left\" | \"right\"", default: "\"bottom\"", description: "Preferred side of the trigger to place the popup." },
  { name: "align", type: "\"start\" | \"center\" | \"end\"", default: "\"start\"", description: "Alignment against the trigger." },
  { name: "sideOffset", type: "number", default: "6", description: "Gap between trigger and popup, in pixels." },
];

const searchProps: PropDef[] = [
  { name: "value", type: "string", description: "The query. Filter the MenuItems you render against it — the popup re-indexes from 0." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called on every keystroke, and with \"\" when the popup closes (see clearOnClose)." },
  { name: "placeholder", type: "string", default: "\"Search…\"", description: "Placeholder text." },
  { name: "clearOnClose", type: "boolean", default: "true", description: "Reset the query when the popup closes, so the menu reopens unfiltered." },
  { name: "autoFocus", type: "boolean", default: "true", description: "Take focus when the popup opens. Typing on a focused row always jumps back into the field." },
];

const emptyProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "The message shown in place of rows — a polite live region." },
];

const labelProps: PropDef[] = [
  {
    name: "children",
    type: "ReactNode",
    description: "Label text content.",
  },
];

const separatorProps: PropDef[] = [
  {
    name: "className",
    type: "string",
    description: "Additional CSS classes.",
  },
];

const menuItemProps: PropDef[] = [
  { name: "icon", type: "IconComponent", description: "Icon displayed in the menu item." },
  { name: "label", type: "string", description: "Text label for the menu item." },
  { name: "index", type: "number", description: "Position index within the dropdown." },
  { name: "checked", type: "boolean", default: "false", description: "Whether this item is checked. When set (even false), the item is a radio-style option — or a checkbox item inside a dropdown with checkedIndices; when undefined it is a plain action item." },
  { name: "onSelect", type: "() => void", description: "Called when this item is selected." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the item." },
  { name: "closeOnClick", type: "boolean", default: "true", description: "Popup-only: whether selecting the item closes the menu (defaults to false inside a multiple-selection dropdown). Ignored in the inline panel." },
];

// ── Playground ───────────────────────────────────────────
// The state + controls live in the shared module (lib/docs/playgrounds) so
// the /demo slide can drive the same sandbox from its pen menu.

function DropdownPlaygroundSection() {
  return (
    <DropdownPlayground>
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
    </DropdownPlayground>
  );
}

export default function DropdownDoc() {
  const SquareLibrary = useIcon("square-library");
  const Clock = useIcon("clock");
  const Star = useIcon("star");
  const Users = useIcon("users");
  const Lock = useIcon("lock");
  const Mail = useIcon("mail");
  const Bell = useIcon("bell");
  const Shield = useIcon("shield");
  const Settings = useIcon("settings");
  const Palette = useIcon("palette");
  const Monitor = useIcon("monitor");
  const ChevronDown = useIcon("chevron-down");

  const items = [
    { icon: SquareLibrary, label: "Teamspaces" },
    { icon: Clock, label: "Recents" },
    { icon: Star, label: "Favorites" },
    { icon: Users, label: "Shared" },
    { icon: Lock, label: "Private" },
  ];
  const [selected, setSelected] = useState<number | null>(0);
  const [view, setView] = useState(0);
  const [language, setLanguage] = useState("Auto detect");
  const [statuses, setStatuses] = useState<number[]>([0, 1, 2]);
  const [labels, setLabels] = useState<string[]>(["Bug", "Design"]);
  const [labelQuery, setLabelQuery] = useState("");
  const labelMatches = LABELS.filter((l) =>
    l.toLowerCase().includes(labelQuery.toLowerCase())
  );
  const toggleLabel = (l: string) =>
    setLabels((c) => (c.includes(l) ? c.filter((x) => x !== l) : [...c, l]));
  const toggleStatus = (i: number) =>
    setStatuses((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));
  const [query, setQuery] = useState("");
  const matches = LANGUAGES.filter((l) =>
    l.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <DocPage
      title="Dropdown"
      slug="dropdown"
      description="Menus with proximity hover and animated selection, as an inline panel or a triggered popup."
    >
      <DocSection title="Playground">
        <DropdownPlaygroundSection />
      </DocSection>

      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <Dropdown checkedIndex={selected ?? undefined}>
            {items.map((item, i) => (
              <MenuItem
                key={item.label}
                index={i}
                icon={item.icon}
                label={item.label}
                checked={selected === i}
                onSelect={() => setSelected(selected === i ? null : i)}
              />
            ))}
          </Dropdown>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Groups">
        <ComponentPreview code={groupsCode}>
          <Dropdown>
            <DropdownLabel>Account</DropdownLabel>
            <MenuItem index={0} icon={Mail} label="Email" />
            <MenuItem index={1} icon={Bell} label="Notifications" />
            <MenuItem index={2} icon={Shield} label="Privacy" />
            <DropdownSeparator />
            <DropdownLabel>Appearance</DropdownLabel>
            <MenuItem index={3} icon={Settings} label="General" />
            <MenuItem index={4} icon={Palette} label="Theme" />
            <MenuItem index={5} icon={Monitor} label="Display" />
          </Dropdown>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Triggered menu">
        <p className="text-subtitle text-muted-foreground">
          The inline panels above are always visible and render as a plain
          group. For a real popup menu — trigger button, positioning,
          dismissal, typeahead, and close-on-select, built on Base UI&apos;s
          Menu — compose <code>DropdownMenu</code>,{" "}
          <code>DropdownTrigger</code>, and <code>DropdownContent</code>. Any
          element can be the trigger via the <code>render</code> prop.
        </p>
        <ComponentPreview code={triggeredCode}>
          <DropdownMenu>
            <DropdownTrigger
              render={<Button variant="ghost">Open menu</Button>}
            />
            <DropdownContent checkedIndex={view}>
              {items.map((item, i) => (
                <MenuItem
                  key={item.label}
                  index={i}
                  icon={item.icon}
                  label={item.label}
                  checked={view === i}
                  onSelect={() => setView(i)}
                />
              ))}
            </DropdownContent>
          </DropdownMenu>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Multiple selection">
        <p className="text-subtitle text-muted-foreground">
          Pass <code>checkedIndices</code> instead of <code>checkedIndex</code>{" "}
          and the rows become checkbox items: toggling one keeps the menu
          open, and contiguous checked rows share one background that merges
          and splits as the selection changes — the CheckboxGroup treatment,
          inside a menu.
        </p>
        <ComponentPreview code={multipleCode} minHeightClass="min-h-[160px]">
          <DropdownMenu>
            <DropdownTrigger
              render={<Button variant="ghost">Status</Button>}
            />
            <DropdownContent checkedIndices={statuses}>
              {STATUSES.map((s, i) => (
                <MenuItem
                  key={s}
                  index={i}
                  label={s}
                  checked={statuses.includes(i)}
                  onSelect={() => toggleStatus(i)}
                />
              ))}
            </DropdownContent>
          </DropdownMenu>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Searchable menu">
        <p className="text-subtitle text-muted-foreground">
          Drop a <code>DropdownSearch</code> at the top of the popup and
          filter the rows you render against its value. The field takes
          focus when the menu opens; typing on a focused row jumps back into
          it, arrow keys leave it for the list, and Enter picks the first
          match. <code>DropdownEmpty</code> stands in when nothing matches.
        </p>
        <ComponentPreview code={searchableCode} minHeightClass="min-h-[160px]">
          <DropdownMenu>
            <DropdownTrigger
              render={
                <Button variant="ghost" trailingIcon={ChevronDown}>
                  {language}
                </Button>
              }
            />
            <DropdownContent checkedIndex={matches.indexOf(language)}>
              <DropdownSearch
                value={query}
                onValueChange={setQuery}
                placeholder="Search languages"
              />
              {matches.map((l, i) => (
                <MenuItem
                  key={l}
                  index={i}
                  label={l}
                  checked={language === l}
                  onSelect={() => setLanguage(l)}
                />
              ))}
              {matches.length === 0 && (
                <DropdownEmpty>No languages found</DropdownEmpty>
              )}
            </DropdownContent>
          </DropdownMenu>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Searchable multiple selection">
        <p className="text-subtitle text-muted-foreground">
          The two compose: filter the rows and pass <code>checkedIndices</code>{" "}
          computed against the filtered list. Enter in the field toggles the
          first match and the menu stays open for the next one.
        </p>
        <ComponentPreview code={searchableMultipleCode} minHeightClass="min-h-[160px]">
          <DropdownMenu>
            <DropdownTrigger
              render={
                <Button variant="ghost">Labels · {labels.length}</Button>
              }
            />
            <DropdownContent
              checkedIndices={labelMatches.flatMap((l, i) =>
                labels.includes(l) ? [i] : []
              )}
            >
              <DropdownSearch
                value={labelQuery}
                onValueChange={setLabelQuery}
                placeholder="Search labels"
              />
              {labelMatches.map((l, i) => (
                <MenuItem
                  key={l}
                  index={i}
                  label={l}
                  checked={labels.includes(l)}
                  onSelect={() => toggleLabel(l)}
                />
              ))}
              {labelMatches.length === 0 && (
                <DropdownEmpty>No labels found</DropdownEmpty>
              )}
            </DropdownContent>
          </DropdownMenu>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — Dropdown">
        <PropsTable props={dropdownProps} />
      </DocSection>

      <DocSection title="API Reference — MenuItem">
        <PropsTable props={menuItemProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownMenu">
        <PropsTable props={dropdownMenuProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownTrigger">
        <PropsTable props={dropdownTriggerProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownContent">
        <PropsTable props={dropdownContentProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownSearch">
        <PropsTable props={searchProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownEmpty">
        <PropsTable props={emptyProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownLabel">
        <PropsTable props={labelProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownSeparator">
        <PropsTable props={separatorProps} />
      </DocSection>
    </DocPage>
  );
}
