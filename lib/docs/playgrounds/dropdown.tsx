"use client";

import { Fragment, useState } from "react";
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
import { Switch } from "@/registry/radix/switch";
import { useIcons } from "@/lib/icon-context";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import {
  DROPDOWN_PRESET_DEF,
  DROPDOWN_DEFAULT_CODE,
  DROPDOWN_ITEMS,
  DROPDOWN_GROUPS,
  DROPDOWN_DISABLED_LABEL,
  DROPDOWN_DEFAULT_SELECTED,
  DROPDOWN_DEFAULT_PICKED,
  deriveDropdown,
  encodeDropdownPreset,
  decodeDropdownPreset,
  type DropdownMode,
  type DropdownSelection,
} from "@/lib/preset/dropdown-options";
import {
  usePresetGlobals,
  usePresetUrlSync,
  GetCodeDialog,
} from "@/lib/docs/preset-ui";
import type { PlaygroundProps } from "./types";

// ── Dropdown playground ──────────────────────────────────
// A live sandbox: the controls drive a real dropdown — popup or inline panel,
// radio / checkbox / action rows, an optional search field, groups — with the
// matching code kept in sync in the doc page's Code tab.

function buildPlaygroundCode(o: {
  mode: DropdownMode;
  selection: DropdownSelection;
  search: boolean;
  icons: boolean;
  groups: boolean;
  disabledRow: boolean;
}) {
  const isMenu = o.mode === "menu";
  const row = (label: string, i: number, icon?: string) => {
    const props = [
      `index={${i}}`,
      ...(o.icons && icon ? [`icon={${icon}}`] : []),
      `label="${label}"`,
      ...(o.disabledRow && label === DROPDOWN_DISABLED_LABEL ? ["disabled"] : []),
      ...(o.selection === "single"
        ? [`checked={selected === "${label}"}`, `onSelect={() => setSelected("${label}")}`]
        : o.selection === "multiple"
          ? [`checked={picked.includes("${label}")}`, `onSelect={() => toggle("${label}")}`]
          : [`onSelect={() => {}}`]),
    ];
    return `<MenuItem ${props.join(" ")} />`;
  };
  const iconOf = (k: string) => k.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");
  const rows = o.groups
    ? [
        "<DropdownLabel>Account</DropdownLabel>",
        ...DROPDOWN_ITEMS.slice(0, 3).map((it, i) => row(it.label, i, iconOf(it.icon))),
        "<DropdownSeparator />",
        "<DropdownLabel>Appearance</DropdownLabel>",
        ...DROPDOWN_ITEMS.slice(3).map((it, i) => row(it.label, i + 3, iconOf(it.icon))),
      ]
    : [
        ...DROPDOWN_ITEMS.slice(0, 3).map((it, i) => row(it.label, i, iconOf(it.icon))),
        "{/* …three more */}",
      ];
  const container =
    o.selection === "single"
      ? " checkedIndex={checkedIndex === -1 ? undefined : checkedIndex}"
      : o.selection === "multiple"
        ? " checkedIndices={checkedIndices}"
        : "";
  const state =
    o.selection === "single"
      ? `const [selected, setSelected] = useState<string | null>("Email");\nconst checkedIndex = rows.findIndex((r) => r.label === selected);\n\n`
      : o.selection === "multiple"
        ? `const [picked, setPicked] = useState(["Email", "Notifications"]);\nconst checkedIndices = rows.flatMap((r, i) => (picked.includes(r.label) ? [i] : []));\n\n`
        : "";
  // `rows` is what the JSX reads; without a search it is simply the seed list.
  const search = o.search
    ? `const [query, setQuery] = useState("");\nconst rows = ITEMS.filter((r) => r.label.toLowerCase().includes(query.toLowerCase()));\n`
    : o.selection === "none"
      ? ""
      : "const rows = ITEMS;\n";
  const indent = (s: string, n: number) => " ".repeat(n) + s;
  if (!isMenu) {
    return `${search}${state}<Dropdown${container} aria-label="Settings">\n${rows.map((r) => indent(r, 2)).join("\n")}\n</Dropdown>`;
  }
  const trigger =
    o.selection === "single"
      ? "{selected ?? \"Choose\"}"
      : o.selection === "multiple"
        ? "{`Filters · ${picked.length}`}"
        : "Open menu";
  return `${search}${state}<DropdownMenu>
  <DropdownTrigger render={<Button variant="ghost" trailingIcon={ChevronDown}>${trigger}</Button>} />
  <DropdownContent${container}>
${o.search ? indent('<DropdownSearch value={query} onValueChange={setQuery} placeholder="Search…" />', 4) + "\n" : ""}${rows.map((r) => indent(r, 4)).join("\n")}${o.search ? "\n" + indent("{rows.length === 0 && <DropdownEmpty>No results</DropdownEmpty>}", 4) : ""}
  </DropdownContent>
</DropdownMenu>`;
}

export function DropdownPlayground({ children }: PlaygroundProps) {
  const icons = useIcons();

  const [mode, setMode] = useState<DropdownMode>("menu");
  const [selection, setSelection] = useState<DropdownSelection>("single");
  const [search, setSearch] = useState(false);
  const [showIcons, setShowIcons] = useState(true);
  const [groups, setGroups] = useState(false);
  const [disabledRow, setDisabledRow] = useState(false);

  // Live selection state, by label so it survives filtering.
  const [selected, setSelected] = useState<string | null>(DROPDOWN_DEFAULT_SELECTED);
  const [picked, setPicked] = useState<string[]>([...DROPDOWN_DEFAULT_PICKED]);
  const [query, setQuery] = useState("");

  const d = deriveDropdown({ mode, selection, search, icons: showIcons, groups, disabledRow });

  const code = buildPlaygroundCode({
    mode,
    selection,
    search: d.search,
    icons: showIcons,
    groups: d.groups,
    disabledRow,
  });

  // ── Get code (presets) ─────────────────────────────────
  // The RAW rail values are encoded; the derived constraints (search only in
  // the popup, search replaces groups) re-apply on decode and in the
  // generator.
  const globals = usePresetGlobals();
  const presetCode = encodeDropdownPreset({
    mode,
    selection,
    search,
    icons: showIcons,
    groups,
    disabledRow,
    ...globals,
  });
  usePresetUrlSync(presetCode, DROPDOWN_DEFAULT_CODE, (raw) => {
    const res = decodeDropdownPreset(raw);
    if (res.ok) {
      const p = res.preset;
      setMode(p.mode);
      setSelection(p.selection);
      setSearch(p.search);
      setShowIcons(p.icons);
      setGroups(p.groups);
      setDisabledRow(p.disabledRow);
    }
  });

  const randomize = () => {
    const pick = <T,>(arr: readonly T[]) =>
      arr[Math.floor(Math.random() * arr.length)];
    setMode(pick(["menu", "inline"] as const));
    setSelection(pick(["single", "multiple", "none"] as const));
    setSearch(Math.random() > 0.6);
    setShowIcons(Math.random() > 0.3);
    setGroups(Math.random() > 0.6);
    setDisabledRow(Math.random() > 0.7);
    setQuery("");
  };

  const toggle = (label: string) =>
    setPicked((c) => (c.includes(label) ? c.filter((x) => x !== label) : [...c, label]));

  const rows = d.search
    ? DROPDOWN_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : DROPDOWN_ITEMS;
  const checkedIndex = rows.findIndex((item) => item.label === selected);
  const checkedIndices = rows.flatMap((item, i) => (picked.includes(item.label) ? [i] : []));

  const renderRow = (item: (typeof DROPDOWN_ITEMS)[number], index: number) => (
    <MenuItem
      key={item.label}
      index={index}
      icon={showIcons ? icons[item.icon] : undefined}
      label={item.label}
      disabled={disabledRow && item.label === DROPDOWN_DISABLED_LABEL}
      checked={
        selection === "single"
          ? selected === item.label
          : selection === "multiple"
            ? picked.includes(item.label)
            : undefined
      }
      onSelect={() => {
        if (selection === "single") setSelected(item.label);
        else if (selection === "multiple") toggle(item.label);
      }}
    />
  );

  const content = (
    <>
      {d.groups
        ? DROPDOWN_GROUPS.map((group) => {
            const first = rows.findIndex((item) => item.group === group);
            return (
              <Fragment key={group}>
                {first > 0 && <DropdownSeparator />}
                <DropdownLabel>{group}</DropdownLabel>
                {rows
                  .filter((item) => item.group === group)
                  .map((item, i) => renderRow(item, first + i))}
              </Fragment>
            );
          })
        : rows.map(renderRow)}
      {d.search && rows.length === 0 && <DropdownEmpty>No results</DropdownEmpty>}
    </>
  );

  const selectionProps =
    selection === "single"
      ? { checkedIndex: checkedIndex === -1 ? undefined : checkedIndex }
      : selection === "multiple"
        ? { checkedIndices }
        : {};

  const triggerLabel =
    selection === "single"
      ? (selected ?? "Choose")
      : selection === "multiple"
        ? `Filters · ${picked.length}`
        : "Open menu";

  const preview =
    mode === "menu" ? (
      <DropdownMenu>
        <DropdownTrigger
          render={
            <Button variant="ghost" trailingIcon={icons["chevron-down"]}>
              {triggerLabel}
            </Button>
          }
        />
        <DropdownContent {...selectionProps}>
          {d.search && (
            <DropdownSearch value={query} onValueChange={setQuery} placeholder="Search…" />
          )}
          {content}
        </DropdownContent>
      </DropdownMenu>
    ) : (
      <Dropdown {...selectionProps} aria-label="Settings">
        {content}
      </Dropdown>
    );

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Dropdown" />
      <div>
        <PlayField label="Mode">
          <PlaySelect
            value={mode}
            onChange={(v) => setMode(v as DropdownMode)}
            options={[
              { value: "menu", label: "Menu" },
              { value: "inline", label: "Inline panel" },
            ]}
          />
        </PlayField>
        <PlayField label="Selection">
          <PlaySelect
            value={selection}
            onChange={(v) => setSelection(v as DropdownSelection)}
            options={[
              { value: "single", label: "Single" },
              { value: "multiple", label: "Multiple" },
              { value: "none", label: "Actions" },
            ]}
          />
        </PlayField>
        <Switch
          label="Search"
          checked={d.search}
          onToggle={() => setSearch((v) => !v)}
          disabled={mode !== "menu"}
          className={PLAY_SWITCH}
        />
      </div>

      <PlayDivider />
      <PlaySection label="Rows" />
      <div>
        <Switch
          label="Icons"
          checked={showIcons}
          onToggle={() => setShowIcons((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Groups"
          checked={d.groups}
          onToggle={() => setGroups((v) => !v)}
          disabled={d.search}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Disabled row"
          checked={disabledRow}
          onToggle={() => setDisabledRow((v) => !v)}
          className={PLAY_SWITCH}
        />
      </div>

      <PlayDivider />
      {/* shadcn's preset principle: the exact configuration above, as a
          stateless code the registry can turn into an installable block. */}
      <GetCodeDialog def={DROPDOWN_PRESET_DEF} code={presetCode} />
    </PlaygroundPanel>
  );

  return children({
    preview,
    demoPreview: preview,
    controls,
    code,
  });
}
