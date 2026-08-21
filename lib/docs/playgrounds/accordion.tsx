"use client";

import { useState } from "react";
import {
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/registry/radix/accordion";
import { Switch } from "@/registry/radix/switch";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import { ACCORDION_ITEMS } from "@/app/components/demo-data";
import type { PlaygroundProps } from "./types";

// ── Accordion playground ─────────────────────────────────
// Layout first (how many open at once, how tall the rows are), then the one
// visual choice the component makes for you: what an open item tints.

interface PlayState {
  type: "single" | "multiple";
  collapsible: boolean;
  size: "default" | "compact";
  highlight: "item" | "trigger";
}

const DEFAULT_STATE: PlayState = {
  type: "single",
  collapsible: true,
  size: "default",
  highlight: "item",
};

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

export function buildAccordionPlaygroundCode(o: PlayState): string {
  const props = [
    `type="${o.type}"`,
    ...(o.type === "single" && o.collapsible ? ["collapsible"] : []),
    ...(o.size === "compact" ? [`size="compact"`] : []),
    ...(o.highlight === "trigger" ? [`highlight="trigger"`] : []),
    o.type === "single" ? `defaultValue="item-1"` : `defaultValue={["item-1"]}`,
  ].join(" ");
  return [
    `import {`,
    `  AccordionGroup, AccordionItem, AccordionTrigger, AccordionContent,`,
    `} from "./components";`,
    ``,
    ...(o.highlight === "trigger"
      ? [
          `{/* highlight="trigger" keeps an open item's tint on the row and`,
          `    leaves its panel on the page's own surface */}`,
        ]
      : []),
    `<AccordionGroup ${props}>`,
    `  {items.map((item, i) => (`,
    `    <AccordionItem key={item.value} value={item.value} index={i}>`,
    `      <AccordionTrigger>{item.title}</AccordionTrigger>`,
    `      <AccordionContent>{item.content}</AccordionContent>`,
    `    </AccordionItem>`,
    `  ))}`,
    `</AccordionGroup>`,
  ].join("\n");
}

export function AccordionPlayground({ children }: PlaygroundProps) {
  const [state, setState] = useState<PlayState>(DEFAULT_STATE);
  const set = <K extends keyof PlayState>(key: K, value: PlayState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const randomize = () =>
    setState({
      type: pick(["single", "single", "multiple"] as const),
      collapsible: Math.random() > 0.3,
      size: pick(["default", "default", "compact"] as const),
      highlight: pick(["item", "item", "trigger"] as const),
    });

  const items = ACCORDION_ITEMS.slice(0, 4);

  // `key` remounts the group when type flips: single and multiple take
  // different defaultValue shapes, and an uncontrolled group keeps the first.
  const group = (
    <AccordionGroup
      key={`${state.type}-${state.size}`}
      {...(state.type === "single"
        ? { type: "single" as const, collapsible: state.collapsible, defaultValue: items[0].value }
        : { type: "multiple" as const, defaultValue: [items[0].value] })}
      size={state.size}
      highlight={state.highlight}
    >
      {items.map((item, i) => (
        <AccordionItem key={item.value} value={item.value} index={i}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </AccordionGroup>
  );

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Layout" />
      <PlayField label="Type">
        <PlaySelect
          value={state.type}
          onChange={(v) => set("type", v as PlayState["type"])}
          options={[
            { value: "single", label: "Single" },
            { value: "multiple", label: "Multiple" },
          ]}
        />
      </PlayField>
      <Switch
        label="Collapsible"
        checked={state.type === "single" && state.collapsible}
        onToggle={() => set("collapsible", !state.collapsible)}
        disabled={state.type !== "single"}
        className={PLAY_SWITCH}
      />
      <PlayField label="Size">
        <PlaySelect
          value={state.size}
          onChange={(v) => set("size", v as PlayState["size"])}
          options={[
            { value: "default", label: "Default" },
            { value: "compact", label: "Compact" },
          ]}
        />
      </PlayField>

      <PlayDivider />
      <PlaySection label="Open item" />
      <PlayField label="Highlight">
        <PlaySelect
          value={state.highlight}
          onChange={(v) => set("highlight", v as PlayState["highlight"])}
          options={[
            { value: "item", label: "Row + panel" },
            { value: "trigger", label: "Row only" },
          ]}
        />
      </PlayField>
    </PlaygroundPanel>
  );

  return children({
    preview: <div className="flex w-full justify-center px-6 py-10">{group}</div>,
    demoPreview: <div className="w-full max-w-[320px]">{group}</div>,
    controls,
    code: buildAccordionPlaygroundCode(state),
  });
}
