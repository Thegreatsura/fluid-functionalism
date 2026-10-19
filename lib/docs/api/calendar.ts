// The API reference of /docs/calendar: its PropsTable and the API section
// of /docs/calendar.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const calendarProps: PropDef[] = [
  {
    name: "mode",
    type: '"single" | "range"',
    default: '"single"',
    description: "One day, or a start and an end.",
  },
  {
    name: "selected",
    type: "Date | DateRange",
    description: "The selected day or range. With `onSelect` it is controlled; without, it seeds the calendar's own state.",
  },
  {
    name: "onSelect",
    type: "(value: Date | DateRange | undefined) => void",
    description: "Called on every pick. In range mode the first pick returns a range with no `to`.",
  },
  {
    name: "booked",
    type: "Matcher | Matcher[]",
    description: "Days that are taken: unavailable, struck through, and announced as booked.",
  },
  {
    name: "available",
    type: "Matcher | Matcher[]",
    description: "When set, every day it does not match is unavailable.",
  },
  {
    name: "disabled",
    type: "Matcher | Matcher[]",
    description: "Days that can't be picked, such as `{ before: today }`.",
  },
  {
    name: "numberOfMonths",
    type: "1 | 2",
    default: "1",
    description: "Months on screen. Two months share one fluid hover and hide outside days.",
  },
  {
    name: "orientation",
    type: '"auto" | "horizontal" | "vertical"',
    default: '"auto"',
    description: "Two months side by side, stacked, or side by side when the container fits both.",
  },
  {
    name: "cellSize",
    type: "number",
    default: "36 (32 compact)",
    description: "Day cell size in px. Text stays on the type scale; bigger cells add air.",
  },
  {
    name: "fill",
    type: "boolean",
    default: "false",
    description: "Stretches the columns to the container. `cellSize` then caps the row height.",
  },
  {
    name: "showWeekNumber",
    type: "boolean",
    default: "false",
    description: "A muted ISO week column. Display only.",
  },
  {
    name: "showOutsideDays",
    type: "boolean",
    default: "true (1 month)",
    description: "Days of the neighbouring months. Always off with 2 months.",
  },
  {
    name: "size",
    type: '"default" | "compact"',
    description: "Pins the calendar to one step of the size ladder.",
  },
  {
    name: "min / max",
    type: "number",
    description: "Range mode: fewest and most nights a range may span.",
  },
  {
    name: "weekStartsOn · locale · timeZone · month · onMonthChange · …",
    type: "DayPickerProps",
    description: "Every other DayPicker prop passes through.",
  },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [{ title: "Calendar", props: calendarProps }];
