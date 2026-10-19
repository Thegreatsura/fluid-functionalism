"use client";

import { useState } from "react";
import {
  DatePicker,
  type DateRange,
  type DatePickerPreset,
  type TimeRange,
} from "@/components/ui/date-picker";
import { Switch } from "@/registry/radix/switch";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import type { PlaygroundProps } from "./types";

// ── DatePicker playground ────────────────────────────────
// What gets picked (a date, a range, a date with a time or a time range)
// and how the trigger sits on the page (a field, or inline text).

type Time = "none" | "time" | "timeRange";

interface PlayState {
  mode: "single" | "range";
  variant: "field" | "ghost";
  time: Time;
  presets: boolean;
}

const DEFAULT_STATE: PlayState = {
  mode: "single",
  variant: "field",
  time: "none",
  presets: false,
};

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** 4 ranges counted from today. */
export function demoPresets(today = new Date()): DatePickerPreset[] {
  return [
    { label: "Next 7 days", range: { from: today, to: addDays(today, 6) } },
    { label: "Next 14 days", range: { from: today, to: addDays(today, 13) } },
    { label: "Next 30 days", range: { from: today, to: addDays(today, 29) } },
    { label: "This weekend", range: { from: addDays(today, (6 - today.getDay() + 7) % 7), to: addDays(today, ((6 - today.getDay() + 7) % 7) + 1) } },
  ];
}

export function buildDatePickerPlaygroundCode(o: PlayState): string {
  const range = o.mode === "range";
  const time = !range && o.time !== "none" ? o.time : "none";
  const props = [
    ...(range ? [`mode="range"`] : []),
    ...(o.variant === "ghost" ? [`variant="ghost"`] : []),
    `value={${range ? "range" : "date"}}`,
    `onValueChange={${range ? "setRange" : "setDate"}}`,
    ...(time === "time" ? ["time={time}", "onTimeChange={setTime}"] : []),
    ...(time === "timeRange" ? ["timeRange={time}", "onTimeRangeChange={setTime}"] : []),
    ...(range && o.presets ? ["presets={presets}"] : []),
  ];
  return [
    `import { DatePicker${range ? ", type DateRange" : ""}${time === "timeRange" ? ", type TimeRange" : ""} } from "./components";`,
    ``,
    range
      ? `const [range, setRange] = useState<DateRange | undefined>();`
      : `const [date, setDate] = useState<Date | undefined>(new Date());`,
    ...(time === "time" ? [`const [time, setTime] = useState<string | null>("11:00");`] : []),
    ...(time === "timeRange"
      ? [`const [time, setTime] = useState<TimeRange | null>({ start: "11:00", end: "12:45" });`]
      : []),
    ...(range && o.presets
      ? [`const presets = [{ label: "Next 7 days", range: { from: today, to: in6Days } }];`]
      : []),
    ``,
    `<DatePicker`,
    ...props.map((p) => `  ${p}`),
    `/>`,
  ].join("\n");
}

export function DatePickerPlayground({ children }: PlaygroundProps) {
  const [state, setState] = useState<PlayState>(DEFAULT_STATE);
  const set = <K extends keyof PlayState>(key: K, value: PlayState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const [date, setDate] = useState<Date | undefined>(() => new Date());
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [time, setTime] = useState<string | null>("11:00");
  const [timeRange, setTimeRange] = useState<TimeRange | null>({ start: "11:00", end: "12:45" });
  const [presets] = useState(() => demoPresets());

  const randomize = () =>
    setState({
      mode: pick(["single", "range"] as const),
      variant: pick(["field", "ghost"] as const),
      time: pick(["none", "time", "timeRange"] as const),
      presets: Math.random() > 0.5,
    });

  const range_ = state.mode === "range";
  const picker = range_ ? (
    <DatePicker
      key="range"
      mode="range"
      variant={state.variant}
      value={range}
      onValueChange={setRange}
      presets={state.presets ? presets : undefined}
    />
  ) : state.time === "time" ? (
    <DatePicker
      key="time"
      variant={state.variant}
      value={date}
      onValueChange={setDate}
      time={time}
      onTimeChange={setTime}
    />
  ) : state.time === "timeRange" ? (
    <DatePicker
      key="timeRange"
      variant={state.variant}
      value={date}
      onValueChange={setDate}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
    />
  ) : (
    <DatePicker key="single" variant={state.variant} value={date} onValueChange={setDate} />
  );

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlayField label="Mode">
        <PlaySelect
          value={state.mode}
          onChange={(v) => set("mode", v as PlayState["mode"])}
          options={[
            { value: "single", label: "Date" },
            { value: "range", label: "Range" },
          ]}
        />
      </PlayField>
      <PlayField label="Trigger">
        <PlaySelect
          value={state.variant}
          onChange={(v) => set("variant", v as PlayState["variant"])}
          options={[
            { value: "field", label: "Field" },
            { value: "ghost", label: "Ghost" },
          ]}
        />
      </PlayField>
      <PlayField label="Time" disabled={range_}>
        <PlaySelect
          value={state.time}
          onChange={(v) => set("time", v as Time)}
          options={[
            { value: "none", label: "None" },
            { value: "time", label: "One time" },
            { value: "timeRange", label: "Start → end" },
          ]}
        />
      </PlayField>
      <Switch
        label="Presets"
        checked={state.presets}
        disabled={!range_}
        onToggle={() => set("presets", !state.presets)}
        className={PLAY_SWITCH}
      />
    </PlaygroundPanel>
  );

  return children({
    preview: <div className="flex w-full justify-center px-6 py-16">{picker}</div>,
    demoPreview: <div className="flex w-full justify-center">{picker}</div>,
    controls,
    code: buildDatePickerPlaygroundCode(state),
  });
}
