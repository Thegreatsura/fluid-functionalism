// The API reference of /docs/date-picker: its PropsTables and the API
// section of /docs/date-picker.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const datePickerProps: PropDef[] = [
  {
    name: "mode",
    type: '"single" | "range"',
    default: '"single"',
    description: "One date, or a start and an end.",
  },
  {
    name: "value / defaultValue",
    type: "Date | DateRange",
    description: "The picked date or range. A range reaches `onValueChange` only once both ends are set.",
  },
  {
    name: "onValueChange",
    type: "(value: Date | DateRange | undefined) => void",
    description: "Called when a date or a complete range is picked, or the field is cleared.",
  },
  {
    name: "variant",
    type: '"outline" | "ghost"',
    default: '"outline"',
    description: "Outline: a bordered field that matches Select. Ghost: inline text with a hover fill.",
  },
  {
    name: "placeholder",
    type: "string",
    default: '"Pick a date" / "Pick dates"',
    description: "Shown while there is no value.",
  },
  {
    name: "presets",
    type: "{ label: string; range: DateRange }[]",
    description: "Range mode: ranges listed beside the calendar. Off by default.",
  },
  {
    name: "time / defaultTime",
    type: "string | null",
    description: 'One time on the same day, as "HH:mm". `null` shows an empty field.',
  },
  {
    name: "onTimeChange",
    type: "(time: string | null) => void",
    description: "Called when a time is picked, typed, or cleared.",
  },
  {
    name: "timeRange / defaultTimeRange",
    type: "{ start: string; end: string } | null",
    description: "A start and an end on the same day, with the duration shown.",
  },
  {
    name: "onTimeRangeChange",
    type: "(range: TimeRange | null) => void",
    description: "Called when either time changes. Moving the start keeps the duration.",
  },
  {
    name: "step",
    type: "number",
    default: "15",
    description: "Minutes between time slots.",
  },
  {
    name: "hourCycle",
    type: "12 | 24",
    description: "Overrides the clock. Unset, it follows `locale` (or the browser's language): 12h for en-US, 24h for fr-FR.",
  },
  {
    name: "locale",
    type: "string",
    description: "BCP 47 locale for the labels and times. Defaults to the browser's.",
  },
  {
    name: "numberOfMonths",
    type: "1 | 2",
    default: "1 single, 2 range",
    description: "Months in the date popover.",
  },
  {
    name: "orientation",
    type: '"auto" | "horizontal" | "vertical"',
    default: '"auto"',
    description: "Two months side by side, stacked, or side by side when the viewport fits both.",
  },
  {
    name: "calendarProps",
    type: "Partial<CalendarProps>",
    description: "Passed to the calendar inside: `booked`, `available`, `disabled`, `cellSize`, `showWeekNumber` and the rest.",
  },
  {
    name: "clearable",
    type: "boolean",
    default: "true",
    description: "Outline variant: a clear button once a value is set.",
  },
  {
    name: "open / defaultOpen / onOpenChange",
    type: "boolean",
    description: "Controls the date popover.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables the whole picker.",
  },
  {
    name: "size",
    type: '"default" | "compact"',
    description: "Pins the trigger and popovers to one step of the size ladder.",
  },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [{ title: "DatePicker", props: datePickerProps }];
