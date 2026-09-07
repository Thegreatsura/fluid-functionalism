// ---------------------------------------------------------------------------
// Install-grade code generation for combobox presets. Emits ONE compilable
// component reproducing what the playground preview renders for the encoded
// state — same list, same field, same selection model. tests/preset-combobox
// .test.mjs compiles the output across the state space through a real
// ts.createProgram over the project tsconfig.
// ---------------------------------------------------------------------------

import type { PresetFile } from "./sidebar-install";
import type { PresetGenerator } from "./generators";
import {
  type ComboboxPreset,
  COMBOBOX_FRAMEWORKS,
  COMBOBOX_TIMEZONES,
  COMBOBOX_COPY,
} from "./combobox-options";

function comboboxDemoFile(p: ComboboxPreset): string {
  const isLong = p.list === "long";
  const copy = COMBOBOX_COPY[p.list];
  const l: string[] = [];

  l.push(`"use client";`);
  l.push(``);
  l.push(`import { useState } from "react";`);
  const parts = [
    "Combobox",
    p.multiple ? "ComboboxChips" : "ComboboxInput",
    "ComboboxContent",
    "ComboboxList",
    "ComboboxItem",
    "ComboboxEmpty",
  ];
  l.push(`import {`);
  l.push(`  ${parts.join(",\n  ")},`);
  l.push(`} from "@/components/ui/combobox";`);
  if (p.icon) l.push(`import { useIcon } from "@/lib/icon-context";`);
  l.push(``);

  // ── Demo content ──
  l.push(`// Seed options for the generated combobox — replace with your own.`);
  if (isLong) {
    l.push(`// String items are their own value and label.`);
    l.push(`const ITEMS = [`);
    for (const tz of COMBOBOX_TIMEZONES) l.push(`  ${JSON.stringify(tz)},`);
    l.push(`];`);
  } else {
    l.push(`const ITEMS = [`);
    for (const f of COMBOBOX_FRAMEWORKS) {
      l.push(`  { value: ${JSON.stringify(f.value)}, label: ${JSON.stringify(f.label)} },`);
    }
    l.push(`];`);
  }
  l.push(``);

  // ── Component ──
  l.push(`export function ComboboxDemo() {`);
  if (p.icon) l.push(`  const SearchIcon = useIcon("search");`);
  if (p.multiple) l.push(`  const [values, setValues] = useState<string[]>([]);`);
  else l.push(`  const [value, setValue] = useState("");`);
  l.push(`  return (`);

  const rootProps: string[] = ["items={ITEMS}"];
  if (p.multiple) rootProps.push("multiple", "value={values}", "onValueChange={setValues}");
  else rootProps.push("value={value}", "onValueChange={setValue}");
  if (!p.autoHighlight) rootProps.push("autoHighlight={false}");
  if (p.disabled) rootProps.push("disabled");
  l.push(`    <Combobox ${rootProps.join(" ")}>`);

  const Field = p.multiple ? "ComboboxChips" : "ComboboxInput";
  const fieldProps: string[] = [`placeholder=${JSON.stringify(p.multiple ? (isLong ? "Add timezones…" : "Add frameworks…") : copy.placeholder)}`];
  if (p.variant !== "bordered") fieldProps.push(`variant="${p.variant}"`);
  if (p.icon) fieldProps.push("icon={SearchIcon}");
  if (p.clearable) fieldProps.push("clearable");
  if (p.error) fieldProps.push(`error=${JSON.stringify(COMBOBOX_COPY.error)}`);
  fieldProps.push(`className="w-[280px] max-w-full"`);
  l.push(`      <${Field}`);
  for (const fp of fieldProps) l.push(`        ${fp}`);
  l.push(`      />`);

  l.push(`      <ComboboxContent>`);
  l.push(`        <ComboboxEmpty>${copy.empty}</ComboboxEmpty>`);
  l.push(`        <ComboboxList>`);
  if (isLong) {
    l.push(`          {(item) => {`);
    l.push(`            const tz = item as (typeof ITEMS)[number];`);
    l.push(`            return (`);
    l.push(`              <ComboboxItem key={tz} value={tz}>`);
    l.push(`                {tz}`);
    l.push(`              </ComboboxItem>`);
    l.push(`            );`);
    l.push(`          }}`);
  } else {
    l.push(`          {(item) => {`);
    l.push(`            const { value, label } = item as (typeof ITEMS)[number];`);
    l.push(`            return (`);
    l.push(`              <ComboboxItem key={value} value={value}>`);
    l.push(`                {label}`);
    l.push(`              </ComboboxItem>`);
    l.push(`            );`);
    l.push(`          }}`);
  }
  l.push(`        </ComboboxList>`);
  l.push(`      </ComboboxContent>`);
  l.push(`    </Combobox>`);
  l.push(`  );`);
  l.push(`}`);
  return l.join("\n") + "\n";
}

export function generateComboboxPresetFiles(p: ComboboxPreset): PresetFile[] {
  return [
    {
      path: "components/combobox-demo.tsx",
      type: "registry:component",
      target: "components/combobox-demo.tsx",
      content: comboboxDemoFile(p),
    },
  ];
}

/** Registry dependencies the generated file needs, as plain names — the
 *  route flavors them with the same helpers postbuild uses. */
export function comboboxPresetRegistryDeps(p: ComboboxPreset): string[] {
  const deps = new Set<string>(["utils", "combobox"]);
  if (p.icon) deps.add("icon-context");
  return [...deps];
}

/** npm dependencies beyond what registryDependencies pull transitively. */
export function comboboxPresetNpmDeps(_p: ComboboxPreset): string[] {
  return ["lucide-react"];
}

export const COMBOBOX_PRESET_GENERATOR: PresetGenerator = {
  title: "Combobox (playground preset)",
  description:
    "A combobox generated from a fluidfunctionalism.com playground configuration — the exact variant you built, installable.",
  files: (p) => generateComboboxPresetFiles(p as unknown as ComboboxPreset),
  registryDeps: (p) => comboboxPresetRegistryDeps(p as unknown as ComboboxPreset),
  npmDeps: (p) => comboboxPresetNpmDeps(p as unknown as ComboboxPreset),
};
