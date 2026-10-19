"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape, nestedRadius } from "@/lib/shape-context";
import { SizeProvider, useSize, typeClass, type SizeVariant } from "@/lib/size-context";
import { useIcons } from "@/lib/icon-context";
import { Elevated } from "@/lib/elevated";
import { popupMotionClass, popupScrollAreaClass, popupViewportClass } from "@/lib/popup";
import { useFluidHover, useRegisterFluidHoverItem, type UseFluidHoverReturn } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  type CalendarOrientation,
  type CalendarProps,
  type DateRange,
} from "@/components/ui/calendar";

// ---------------------------------------------------------------------------
// Date picker core
//
// Everything both flavors share: the field and ghost triggers, the date
// popover's contents (calendar + presets), the time fields with their slot
// lists, and the label formatting. The flavor files differ only in the
// popover primitive they pass in as `Popover`.
//
// Labels and times are formatted with Intl; nothing here imports a date
// library. Times are "HH:mm" strings on the same day as the date.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Time helpers (pure, exported for the unit tests)
// ---------------------------------------------------------------------------

const DAY_MINUTES = 24 * 60;
const LAST_MINUTE = DAY_MINUTES - 1;

/** "HH:mm" → minutes after midnight, or null. */
export function timeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Minutes after midnight → "HH:mm". */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Reads a typed time: `1130`, `11:30`, `11.30`, `930`, `9`, `11:30am`,
 * `9pm`, `12am`. Returns minutes after midnight, or null when it isn't a
 * time.
 */
export function parseTime(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, "");
  const m = /^(\d{1,2})(?:[:.h]?(\d{2}))?(a|am|p|pm)?$/.exec(s);
  if (!m) {
    // Three or four bare digits: "930", "1130".
    const d = /^(\d{3,4})(a|am|p|pm)?$/.exec(s);
    if (!d) return null;
    const digits = d[1].padStart(4, "0");
    return parseTime(`${digits.slice(0, 2)}:${digits.slice(2)}${d[2] ?? ""}`);
  }
  let h = Number(m[1]);
  const min = m[2] === undefined ? 0 : Number(m[2]);
  const suffix = m[3];
  if (min > 59) return null;
  if (suffix) {
    if (h < 1 || h > 12) return null;
    const pm = suffix.startsWith("p");
    if (h === 12) h = pm ? 12 : 0;
    else if (pm) h += 12;
  } else if (h > 23) {
    return null;
  }
  return h * 60 + min;
}

/** `15min`, `1h`, `1h 15min`. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/** 12 or 24 hours: the override, else the locale's own clock. */
export function resolveHourCycle(locale?: string, override?: 12 | 24): 12 | 24 {
  if (override) return override;
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return cycle === "h11" || cycle === "h12" ? 12 : 24;
}

/** Minutes after midnight as the locale shows a time: `11:00` or `11:00 AM`. */
export function formatTime(minutes: number, hourCycle: 12 | 24, locale?: string): string {
  const date = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60);
  return new Intl.DateTimeFormat(locale, {
    hour: hourCycle === 12 ? "numeric" : "2-digit",
    minute: "2-digit",
    hourCycle: hourCycle === 12 ? "h12" : "h23",
  }).format(date);
}

/** Changing the start keeps the duration: the end moves with it, and
 *  stops at the end of the day. */
export function shiftEnd(prevStart: number, prevEnd: number, nextStart: number): number {
  const duration = Math.max(prevEnd - prevStart, 0);
  return Math.min(nextStart + duration, LAST_MINUTE);
}

export interface TimeSlot {
  minutes: number;
  /** Minutes after the range start, for an end list. */
  duration?: number;
}

/** Start (or single) slots: the whole day in `step` minutes. End slots:
 *  from one step after `after` to the end of the same day. */
export function buildSlots(step: number, after?: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const safeStep = Math.max(1, Math.round(step));
  if (after === undefined) {
    for (let t = 0; t < DAY_MINUTES; t += safeStep) slots.push({ minutes: t });
    return slots;
  }
  for (let t = after + safeStep; t <= LAST_MINUTE; t += safeStep) {
    slots.push({ minutes: t, duration: t - after });
  }
  if (slots.length === 0 && after < LAST_MINUTE) {
    slots.push({ minutes: LAST_MINUTE, duration: LAST_MINUTE - after });
  }
  return slots;
}

/** The slot nearest a time, by index. */
export function nearestSlotIndex(slots: TimeSlot[], minutes: number): number {
  let best = -1;
  let bestDistance = Infinity;
  slots.forEach((slot, i) => {
    const d = Math.abs(slot.minutes - minutes);
    if (d < bestDistance) {
      best = i;
      bestDistance = d;
    }
  });
  return best;
}

// ---------------------------------------------------------------------------
// Date labels (exported for the unit tests)
// ---------------------------------------------------------------------------

/** `Wed Oct 21`, or `Wed Oct 21, 2027` outside the current year. */
export function formatDateLabel(date: Date, locale?: string, now = new Date()): string {
  const withYear = date.getFullYear() !== now.getFullYear();
  const parts = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  }).formatToParts(date);
  return parts
    .map((part, i) =>
      // Drop the comma English puts after the weekday: "Wed Oct 21".
      part.type === "literal" && parts[i - 1]?.type === "weekday" ? part.value.replace(",", "") : part.value
    )
    .join("");
}

/** `Oct 21 → Oct 24`, with years when the range leaves the current year. */
export function formatRangeLabel(range: DateRange, locale?: string, now = new Date()): string {
  if (!range.from) return "";
  const year = now.getFullYear();
  const withYear =
    range.from.getFullYear() !== year || (!!range.to && range.to.getFullYear() !== year);
  const fmt = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
  if (!range.to) return `${fmt.format(range.from)} →`;
  return `${fmt.format(range.from)} → ${fmt.format(range.to)}`;
}

// ---------------------------------------------------------------------------
// Popover contract: what a flavor file provides
// ---------------------------------------------------------------------------

export interface DatePickerPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "trigger": the anchor is a button that toggles the popover, and focus
   *  moves inside on open (the date). "anchor": the anchor is a field that
   *  only positions the popover and keeps focus (a time). */
  kind: "trigger" | "anchor";
  /** The trigger button, or the field to anchor to. */
  anchor: ReactElement;
  /** The field, for kind "anchor": presses on it are not outside presses. */
  anchorRef?: RefObject<HTMLElement | null>;
  /** True while Escape belongs to the content (a range pick to undo). */
  escapeBlocked?: () => boolean;
  align?: "start" | "center" | "end";
  className?: string;
  children: ReactNode;
}

/**
 * The popup surface both flavors render inside their positioner: the spring
 * scale-in, the elevated card, and the exit that holds the unmount until it
 * finishes. `onExitComplete` releases the flavor's deferred unmount.
 */
export const DatePickerPopupFrame = forwardRef<
  HTMLDivElement,
  {
    open: boolean;
    onExitComplete: () => void;
    className?: string;
    children: ReactNode;
  }
>(({ open, onExitComplete, className, children }, ref) => (
  <motion.div
    className={cn("outline-none", popupMotionClass)}
    initial={{ opacity: 0, y: "var(--popup-enter-y)", scaleY: 0.96 }}
    animate={
      open
        ? { opacity: 1, y: 0, scaleY: 1 }
        : { opacity: 0, y: "var(--popup-enter-y)", scaleY: 0.96 }
    }
    transition={open ? spring.fast : spring.fast.exit}
    onAnimationComplete={() => {
      if (!open) onExitComplete();
    }}
  >
    <Elevated
      ref={ref}
      offset={2}
      shadowLevel={3}
      data-slot="date-picker-popup"
      className={cn("rounded-xl outline-none select-none", className)}
    >
      {children}
    </Elevated>
  </motion.div>
));
DatePickerPopupFrame.displayName = "DatePickerPopupFrame";

// ---------------------------------------------------------------------------
// Segments: one small fluid hover scope across the trigger's parts
// ---------------------------------------------------------------------------

interface SegmentScope {
  registerItem: UseFluidHoverReturn["registerItem"];
}

function useSegment(scope: SegmentScope, index: number) {
  const ref = useRef<HTMLElement>(null);
  useRegisterFluidHoverItem(scope.registerItem, index, ref);
  return ref;
}

// ---------------------------------------------------------------------------
// Time field: an editable time with its own slot-list popover
// ---------------------------------------------------------------------------

interface TimeFieldProps {
  Popover: ComponentType<DatePickerPopoverProps>;
  value: number | null;
  onCommit: (minutes: number) => void;
  slots: TimeSlot[];
  hourCycle: 12 | 24;
  locale?: string;
  placeholder: string;
  label: string;
  disabled?: boolean;
  scope: SegmentScope;
  index: number;
  segmentClass: string;
  /** Where the list opens when there is no value (now, or the start). */
  fallback: number;
  /** An icon inside the field, before the time (the start's clock, the
   *  end's arrow), so it shares the field's hover and click target. */
  prefix?: ReactNode;
  /** A muted note after the time, inside the field (the end's duration). */
  suffix?: ReactNode;
}

function TimeField({
  Popover,
  value,
  onCommit,
  slots,
  hourCycle,
  locale,
  placeholder,
  label,
  disabled,
  scope,
  index,
  segmentClass,
  fallback,
  prefix,
  suffix,
}: TimeFieldProps) {
  const sizeClasses = useSize();
  const compact = sizeClasses.variant === "compact";
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const segmentRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(scope.registerItem, index, segmentRef);

  const hover = useFluidHover(listRef, { gapClick: true });
  const { activeIndex, setActiveIndex, registerItem, remeasure } = hover;
  const { onMouseMove, onMouseEnter, onMouseLeave, onClick } = hover.handlers;

  const display = value === null ? "" : formatTime(value, hourCycle, locale);
  const text = draft ?? display;
  const selectedIndex = value === null ? -1 : slots.findIndex((s) => s.minutes === value);

  // Opening lands on the value, or on the slot nearest `fallback`.
  const openList = () => {
    if (disabled || open) return;
    setOpen(true);
    const target = selectedIndex >= 0 ? selectedIndex : nearestSlotIndex(slots, fallback);
    setActiveIndex(target >= 0 ? target : null);
  };
  const closeList = () => {
    setOpen(false);
    setDraft(null);
    setActiveIndex(null);
  };

  // Center the lit row once the list is laid out, and keep a keyboard
  // move in view.
  const scrollToActive = useCallback((center: boolean) => {
    const list = listRef.current;
    if (!list) return;
    const row = list.querySelector<HTMLElement>("[data-fluid-hover-active]");
    const viewport = list.closest<HTMLElement>("[data-slot=scroll-area-viewport]");
    if (!row || !viewport) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (center) {
      viewport.scrollTop = top - viewport.clientHeight / 2 + row.offsetHeight / 2;
    } else if (top < viewport.scrollTop) {
      viewport.scrollTop = top - 4;
    } else if (bottom > viewport.scrollTop + viewport.clientHeight) {
      viewport.scrollTop = bottom - viewport.clientHeight + 4;
    }
  }, []);
  useEffect(() => {
    if (open) remeasure();
  }, [open, remeasure]);
  // The popup can mount a frame after `open`; center once its rows are
  // measured, once per open.
  const centeredRef = useRef(false);
  useEffect(() => {
    if (!open) {
      centeredRef.current = false;
      return;
    }
    if (!hover.isMeasured || centeredRef.current) return;
    centeredRef.current = true;
    const id = requestAnimationFrame(() => scrollToActive(true));
    return () => cancelAnimationFrame(id);
  }, [open, hover.isMeasured, scrollToActive]);

  // An end list starts one step after its start; a typed end at or before
  // the start is not a time it offers, so the draft is dropped instead.
  const floor = slots[0]?.duration !== undefined ? slots[0].minutes - slots[0].duration : -1;
  const commitDraft = () => {
    if (draft === null) return;
    const parsed = parseTime(draft);
    if (parsed !== null && parsed > floor) onCommit(parsed);
    setDraft(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        openList();
        return;
      }
      const dir = e.key === "ArrowDown" ? 1 : -1;
      const next = Math.min(Math.max((activeIndex ?? selectedIndex ?? 0) + dir, 0), slots.length - 1);
      setActiveIndex(next);
      setDraft(formatTime(slots[next].minutes, hourCycle, locale));
      requestAnimationFrame(() => scrollToActive(false));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (draft !== null && parseTime(draft) !== null) {
        commitDraft();
      } else if (activeIndex !== null && slots[activeIndex]) {
        onCommit(slots[activeIndex].minutes);
      }
      closeList();
      return;
    }
    if (e.key === "Escape") {
      if (open || draft !== null) {
        e.preventDefault();
        e.stopPropagation();
        closeList();
      }
    }
  };

  const activeId = activeIndex !== null && open ? `${listId}-${activeIndex}` : undefined;
  // The field sizes to its text through an invisible copy in the same grid
  // cell, so `11:00` and `11:00 AM` both sit snug in any font.
  const field = (
    <span
      ref={segmentRef}
      data-slot="date-picker-time"
      className={cn(
        segmentClass,
        "cursor-text gap-1.5 has-[input:focus-visible]:ring-1 has-[input:focus-visible]:ring-[color:var(--focus-ring,#6B97FF)]",
        sizeClasses.field
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {prefix}
      <span className="inline-grid">
      <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-pre tabular-nums">
        {text || placeholder}
      </span>
    <input
      ref={inputRef}
      type="text"
      inputMode="text"
      // A text input's intrinsic width (~20ch) would size the grid cell;
      // size 1 drops it so the invisible text copy decides the width.
      size={1}
      role="combobox"
      aria-label={label}
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-activedescendant={activeId}
      aria-autocomplete="list"
      autoComplete="off"
      spellCheck={false}
      disabled={disabled}
      placeholder={placeholder}
      value={text}
      className={cn(
        "col-start-1 row-start-1 w-full min-w-0 bg-transparent p-0 text-center tabular-nums text-inherit outline-none placeholder:text-muted-foreground",
        sizeClasses.field,
        // The field's shape radius would clip the text selection's corners;
        // the rounded focus ring belongs to the whole segment instead.
        "rounded-none"
      )}
      onFocus={(e) => {
        e.currentTarget.select();
        openList();
      }}
      onClick={openList}
      onBlur={(e) => {
        if (listRef.current?.contains(e.relatedTarget as Node)) return;
        commitDraft();
        closeList();
      }}
      onChange={(e) => {
        const next = e.target.value;
        setDraft(next);
        if (!open) setOpen(true);
        const parsed = parseTime(next);
        if (parsed !== null) {
          const i = nearestSlotIndex(slots, parsed);
          setActiveIndex(i >= 0 ? i : null);
          requestAnimationFrame(() => scrollToActive(true));
        }
      }}
      onKeyDown={onKeyDown}
    />
      </span>
      {/* The note steps aside while the time is being edited, keeping its
          space so the field doesn't shrink under the cursor. */}
      {suffix && (
        <span
          data-editing={open || draft !== null || undefined}
          className={cn("inline-flex", (open || draft !== null) && "invisible")}
        >
          {suffix}
        </span>
      )}
    </span>
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => (next ? openList() : (commitDraft(), closeList()))}
      kind="anchor"
      anchor={field}
      anchorRef={segmentRef}
      align="start"
    >
      <ScrollArea
        className={cn(popupScrollAreaClass, "max-h-[min(240px,var(--popup-available-height,240px))]")}
        viewportClassName={cn(popupViewportClass, "scroll-fade")}
      >
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className={cn("relative flex flex-col p-1", slots.some((s) => s.duration !== undefined) ? "min-w-[180px]" : "min-w-[112px]")}
          // Rows never take focus: the field keeps it while the list moves.
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={onMouseEnter}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
        >
          <FluidHoverHighlight hover={hover} hidden={!open} className="rounded-lg" />
          {slots.map((slot, i) => (
            <TimeRow
              key={slot.minutes}
              id={`${listId}-${i}`}
              index={i}
              registerItem={registerItem}
              label={formatTime(slot.minutes, hourCycle, locale)}
              duration={slot.duration === undefined ? undefined : formatDuration(slot.duration)}
              selected={i === selectedIndex}
              active={i === activeIndex}
              compact={compact}
              onPick={() => {
                onCommit(slot.minutes);
                closeList();
              }}
            />
          ))}
        </div>
      </ScrollArea>
    </Popover>
  );
}

function TimeRow({
  id,
  index,
  registerItem,
  label,
  duration,
  selected,
  active,
  compact,
  onPick,
}: {
  id: string;
  index: number;
  registerItem: UseFluidHoverReturn["registerItem"];
  label: string;
  duration?: string;
  selected: boolean;
  active: boolean;
  compact: boolean;
  onPick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  const sizeClasses = useSize();
  return (
    <div
      ref={ref}
      id={id}
      role="option"
      aria-selected={selected}
      data-fluid-hover-index={index}
      className={cn(
        // The duration hugs the time: start-aligned, a small gap.
        "relative z-10 flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg tabular-nums",
        sizeClasses.control,
        sizeClasses.itemPx,
        typeClass("body", compact ? "compact" : "default"),
        "transition-[color] duration-80",
        selected || active ? "text-foreground" : "text-muted-foreground"
      )}
      onClick={onPick}
    >
      <span className="inline-grid">
        <span
          aria-hidden
          // Trimmed like the visible label, so both boxes match and the time
          // shares a baseline with the duration.
          className="invisible col-start-1 row-start-1 [text-box:trim-both_cap_alphabetic]"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          {label}
        </span>
        <span
          className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80 [text-box:trim-both_cap_alphabetic]"
          style={{ fontVariationSettings: selected ? fontWeights.semibold : fontWeights.normal }}
        >
          {label}
        </span>
      </span>
      {/* A description, a step quieter than the time it follows. */}
      {duration && (
        <span className="text-muted-foreground opacity-60 [text-box:trim-both_cap_alphabetic]">
          {duration}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export interface DatePickerPreset {
  label: string;
  range: DateRange;
}

function sameDay(a?: Date, b?: Date) {
  return !!a && !!b && a.toDateString() === b.toDateString();
}

function PresetList({
  presets,
  value,
  onPick,
}: {
  presets: DatePickerPreset[];
  value: DateRange | undefined;
  onPick: (preset: DatePickerPreset) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(ref, { axis: "xy" });
  const { setActiveIndex } = hover;
  return (
    <div
      ref={ref}
      role="group"
      aria-label="Presets"
      data-slot="date-picker-presets"
      className="relative flex flex-col p-1"
      {...hover.handlers}
      onFocus={(e) => {
        const i = Number((e.target as HTMLElement).getAttribute("data-preset-index"));
        if (!Number.isNaN(i)) setActiveIndex(i);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setActiveIndex(null);
      }}
    >
      <FluidHoverHighlight hover={hover} className="rounded-lg" />
      {presets.map((preset, i) => (
        <PresetRow
          key={preset.label}
          index={i}
          registerItem={hover.registerItem}
          preset={preset}
          active={hover.activeIndex === i}
          selected={sameDay(value?.from, preset.range.from) && sameDay(value?.to, preset.range.to)}
          onPick={() => onPick(preset)}
        />
      ))}
    </div>
  );
}

function PresetRow({
  index,
  registerItem,
  preset,
  active,
  selected,
  onPick,
}: {
  index: number;
  registerItem: UseFluidHoverReturn["registerItem"];
  preset: DatePickerPreset;
  active: boolean;
  selected: boolean;
  onPick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  const sizeClasses = useSize();
  return (
    <button
      ref={ref}
      type="button"
      data-preset-index={index}
      aria-pressed={selected}
      onClick={onPick}
      className={cn(
        "relative z-10 flex shrink-0 cursor-pointer items-center rounded-lg text-left whitespace-nowrap outline-none",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
        sizeClasses.control,
        sizeClasses.itemPx,
        sizeClasses.text,
        "transition-[color] duration-80",
        selected || active ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <span className="inline-grid">
        <span
          aria-hidden
          className="invisible col-start-1 row-start-1"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          {preset.label}
        </span>
        <span
          className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80 [text-box:trim-both_cap_alphabetic]"
          style={{ fontVariationSettings: selected ? fontWeights.semibold : fontWeights.normal }}
        >
          {preset.label}
        </span>
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// DatePicker
// ---------------------------------------------------------------------------

export interface TimeRange {
  /** "HH:mm" */
  start: string;
  /** "HH:mm", later the same day. */
  end: string;
}

type CalendarPassThrough = Omit<
  CalendarProps,
  "mode" | "selected" | "onSelect" | "numberOfMonths" | "orientation" | "month" | "onMonthChange" | "size"
>;

interface DatePickerBaseProps {
  /** "field" matches Select; "ghost" is inline text with a hover fill. */
  variant?: "field" | "ghost";
  /** Pins the trigger and popovers to one step of the size ladder. */
  size?: SizeVariant;
  placeholder?: string;
  /** Disables the whole picker. */
  disabled?: boolean;
  /** Shows a clear button once a value is set (field only). Default true. */
  clearable?: boolean;
  /** Months in the date popover. Default 1 for single, 2 for range. */
  numberOfMonths?: 1 | 2;
  orientation?: CalendarOrientation;
  /** Props for the calendar inside: booked, available, disabled, cellSize,
   *  showWeekNumber, weekStartsOn, locale and the rest. */
  calendarProps?: Partial<CalendarPassThrough>;
  /** Controls the date popover. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** One time on the same day. `null` shows an empty field. */
  time?: string | null;
  defaultTime?: string | null;
  onTimeChange?: (time: string | null) => void;
  /** A start → end time on the same day, with the duration shown. */
  timeRange?: TimeRange | null;
  defaultTimeRange?: TimeRange | null;
  onTimeRangeChange?: (range: TimeRange | null) => void;
  /** Minutes between slots. Default 15. */
  step?: number;
  /** 12 or 24 hours. Default: the locale's clock. */
  hourCycle?: 12 | 24;
  /** BCP 47 locale for labels and times. Default: the browser's. */
  locale?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

interface DatePickerSingleProps extends DatePickerBaseProps {
  mode?: "single";
  value?: Date | undefined;
  defaultValue?: Date | undefined;
  onValueChange?: (date: Date | undefined) => void;
  presets?: never;
}

interface DatePickerRangeProps extends DatePickerBaseProps {
  mode: "range";
  value?: DateRange | undefined;
  defaultValue?: DateRange | undefined;
  onValueChange?: (range: DateRange | undefined) => void;
  /** Ranges listed beside the calendar. Off by default. */
  presets?: DatePickerPreset[];
}

type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps;

/** How long a single pick stays on screen before the popover closes, so the
 *  selected day's fill is seen landing. */
const pickAckMs = 200;
const PRESETS_WIDTH = 152;

function useControllable<T>(value: T | undefined, defaultValue: T | undefined, onChange?: (v: T) => void, controlled?: boolean) {
  const [internal, setInternal] = useState<T | undefined>(defaultValue);
  const isControlled = controlled ?? value !== undefined;
  const current = isControlled ? value : internal;
  const set = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );
  return [current, set] as const;
}

function DatePickerCore(props: DatePickerProps & { Popover: ComponentType<DatePickerPopoverProps> }) {
  const {
    Popover,
    mode = "single",
    variant = "field",
    size,
    placeholder,
    disabled,
    clearable = true,
    numberOfMonths: numberOfMonthsProp,
    orientation = "auto",
    calendarProps,
    step = 15,
    hourCycle: hourCycleProp,
    locale,
    className,
    id,
    "aria-label": ariaLabel,
  } = props;
  const presets = mode === "range" ? (props as DatePickerRangeProps).presets : undefined;
  const numberOfMonths = numberOfMonthsProp ?? (mode === "range" ? 2 : 1);

  const [value, setValue] = useControllable<Date | DateRange | undefined>(
    props.value,
    props.defaultValue,
    props.onValueChange as ((v: Date | DateRange | undefined) => void) | undefined,
    "value" in props
  );
  const hasTime = "time" in props || "defaultTime" in props;
  const hasTimeRange = "timeRange" in props || "defaultTimeRange" in props;
  const [time, setTime] = useControllable<string | null>(
    props.time,
    props.defaultTime ?? null,
    props.onTimeChange,
    "time" in props
  );
  const [timeRange, setTimeRange] = useControllable<TimeRange | null>(
    props.timeRange,
    props.defaultTimeRange ?? null,
    props.onTimeRangeChange,
    "timeRange" in props
  );
  const [open, setOpenState] = useControllable<boolean>(
    props.open,
    props.defaultOpen ?? false,
    props.onOpenChange,
    "open" in props
  );

  const shape = useShape();
  const sizeClasses = useSize(size);
  const compact = sizeClasses.variant === "compact";
  const icons = useIcons();
  const CalendarIcon = icons.calendar;
  const ClockIcon = icons.clock;
  const ArrowIcon = icons["arrow-right"];
  // Time fields lead with a decorative icon, drawn like the date's calendar.
  const timeIcon = (Icon: typeof CalendarIcon) => (
    <Icon
      aria-hidden
      size={sizeClasses.icon}
      strokeWidth={1.5}
      className="shrink-0 text-muted-foreground"
    />
  );
  const ClearIcon = icons.x;
  const hourCycle = useMemo(() => resolveHourCycle(locale, hourCycleProp), [locale, hourCycleProp]);

  // While a range is being picked, its partial value lives here; the
  // consumer only ever sees complete ranges.
  const [draft, setDraft] = useState<DateRange | undefined>(undefined);
  const [month, setMonth] = useState<Date | undefined>(undefined);
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
  const ackRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (ackRef.current !== null) clearTimeout(ackRef.current);
  }, []);

  const cellSize = calendarProps?.cellSize ?? (compact ? 32 : 36);
  const setOpen = (next: boolean) => {
    if (ackRef.current !== null) {
      clearTimeout(ackRef.current);
      ackRef.current = null;
    }
    if (next) {
      // Opens on the value's month, laid out for the room the viewport has.
      const anchor = value instanceof Date ? value : (value as DateRange | undefined)?.from;
      setMonth(anchor ?? new Date());
      if (orientation === "auto" && numberOfMonths > 1 && typeof window !== "undefined") {
        const needed =
          (7 + (calendarProps?.showWeekNumber ? 1 : 0)) * cellSize * 2 + 24 + 24 +
          (presets?.length ? PRESETS_WIDTH : 0);
        setLayout(window.innerWidth - 16 >= needed ? "horizontal" : "vertical");
      }
    } else {
      setDraft(undefined);
    }
    setOpenState(next);
  };
  const resolvedOrientation = orientation === "auto" ? layout : orientation;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const range = mode === "range" ? (value as DateRange | undefined) : undefined;
  const single = mode === "single" ? (value as Date | undefined) : undefined;
  const hasValue = mode === "range" ? !!range?.from : !!single;
  const dateLabel =
    mode === "range"
      ? range?.from
        ? formatRangeLabel(range, locale)
        : (placeholder ?? "Pick dates")
      : single
        ? formatDateLabel(single, locale)
        : (placeholder ?? "Pick a date");

  // Segment hover scope: date, time(s), clear.
  const segmentsRef = useRef<HTMLDivElement>(null);
  const segmentHover = useFluidHover(segmentsRef, { axis: "x", gapClick: false });
  const scope = useMemo(() => ({ registerItem: segmentHover.registerItem }), [segmentHover.registerItem]);
  const dateRef = useSegment(scope, 0);
  const clearRef = useSegment(scope, 9);

  const field = variant === "field";
  // Segments sit 2px inside the field (plus its 1px border); their corners
  // nest inside its radius: 8 - 3 = 5px rounded, 20 - 3 = 17px pill.
  const innerRadius = field
    ? nestedRadius(shape.bgRadius, 3) === 5
      ? "rounded-[5px]"
      : "rounded-[17px]"
    : shape.bg;
  const segmentClass = cn(
    "relative z-[1] inline-flex h-full items-center outline-none",
    "transition-[color] duration-80",
    "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
    compact ? "px-1.5" : "px-2",
    innerRadius
  );

  const dateTrigger = (
    <button
      ref={dateRef as RefObject<HTMLButtonElement>}
      type="button"
      id={id}
      disabled={disabled}
      aria-label={ariaLabel ? `${ariaLabel}: ${dateLabel}` : undefined}
      data-slot="date-picker-trigger"
      data-placeholder={hasValue ? undefined : ""}
      className={cn(
        segmentClass,
        sizeClasses.gap,
        "cursor-pointer whitespace-nowrap",
        field && !hasTime && !hasTimeRange && "flex-1",
        hasValue ? "text-foreground" : "text-muted-foreground",
        open && "text-foreground"
      )}
    >
      {field && (
        <CalendarIcon
          size={sizeClasses.icon}
          strokeWidth={1.5}
          className="shrink-0 text-muted-foreground"
        />
      )}
      <span className="[text-box:trim-both_cap_alphabetic]">{dateLabel}</span>
    </button>
  );

  const calendarSelected = mode === "range" ? (draft ?? range) : single;
  const onCalendarSelect = (next: Date | DateRange | undefined) => {
    if (mode === "single") {
      setValue(next as Date | undefined);
      if (next) {
        if (ackRef.current !== null) clearTimeout(ackRef.current);
        ackRef.current = window.setTimeout(() => {
          ackRef.current = null;
          setOpen(false);
        }, pickAckMs);
      }
      return;
    }
    const r = next as DateRange | undefined;
    if (r?.from && !r.to) {
      setDraft(r);
      return;
    }
    const wasPicking = !!draft;
    setDraft(undefined);
    if (!wasPicking) {
      setValue(r);
      return;
    }
    // A pick that lands the end commits and closes. Escape restoring the
    // previous range lands here too, sharing no endpoint with the draft.
    const completes = !!r?.from && !!r.to && (sameDay(r.from, draft?.from) || sameDay(r.to, draft?.from));
    if (completes) {
      setValue(r);
      if (ackRef.current !== null) clearTimeout(ackRef.current);
      ackRef.current = window.setTimeout(() => {
        ackRef.current = null;
        setOpen(false);
      }, pickAckMs);
    }
  };

  const showPresets = mode === "range" && !!presets?.length;
  const stacked = resolvedOrientation === "vertical";

  const calendar = (
    <Calendar
      {...(calendarProps as Record<string, unknown>)}
      {...(mode === "range"
        ? { mode: "range" as const, selected: calendarSelected as DateRange | undefined }
        : { mode: "single" as const, selected: calendarSelected as Date | undefined, required: true })}
      onSelect={onCalendarSelect as never}
      numberOfMonths={numberOfMonths}
      orientation={numberOfMonths > 1 ? resolvedOrientation : undefined}
      month={month}
      onMonthChange={setMonth}
      autoFocus
    />
  );

  const datePopover = (
    <Popover
      open={!!open}
      onOpenChange={setOpen}
      kind="trigger"
      anchor={dateTrigger}
      escapeBlocked={() => !!draft}
      align="start"
    >
      <div
        className={cn(
          // Same box as the popup: its corners follow the popup's 12px.
          "flex rounded-[inherit] bg-inherit p-1",
          showPresets && stacked ? "flex-col" : "flex-row",
          stacked && numberOfMonths > 1 &&
            "max-h-[min(560px,var(--popup-available-height,560px))] overflow-y-auto"
        )}
      >
        {showPresets && (
          <div
            className={cn(
              "shrink-0",
              stacked ? "border-b border-border pb-1" : "w-[152px] border-r border-border pr-1"
            )}
          >
            <PresetList
              presets={presets!}
              value={range}
              onPick={(preset) => {
                setDraft(undefined);
                setValue(preset.range);
                if (preset.range.from) setMonth(preset.range.from);
              }}
            />
          </div>
        )}
        {/* 4px in from the popup's 12px corners: 8px keeps them concentric. */}
        <div className="rounded-lg bg-inherit">{calendar}</div>
      </div>
    </Popover>
  );

  // Time segments.
  const startMinutes = hasTimeRange ? timeToMinutes(timeRange?.start) : null;
  const endMinutes = hasTimeRange ? timeToMinutes(timeRange?.end) : null;
  const daySlots = useMemo(() => buildSlots(step), [step]);
  const endSlots = useMemo(
    () => buildSlots(step, startMinutes ?? nowMinutes - (nowMinutes % step)),
    [step, startMinutes, nowMinutes]
  );
  const timeSegments = hasTime ? (
    <TimeField
      Popover={Popover}
      value={timeToMinutes(time)}
      onCommit={(m) => setTime(minutesToTime(m))}
      slots={daySlots}
      hourCycle={hourCycle}
      locale={locale}
      placeholder="Time"
      label="Time"
      disabled={disabled}
      scope={scope}
      index={1}
      segmentClass={segmentClass}
      fallback={nowMinutes}
      prefix={timeIcon(ClockIcon)}
    />
  ) : hasTimeRange ? (
    <>
      <TimeField
        Popover={Popover}
        value={startMinutes}
        onCommit={(m) => {
          const prevStart = startMinutes ?? m;
          const prevEnd = endMinutes ?? Math.min(m + 60, LAST_MINUTE);
          setTimeRange({
            start: minutesToTime(m),
            end: minutesToTime(endMinutes === null ? prevEnd : shiftEnd(prevStart, prevEnd, m)),
          });
        }}
        slots={daySlots}
        hourCycle={hourCycle}
        locale={locale}
        placeholder="Start"
        label="Start time"
        disabled={disabled}
        scope={scope}
        index={1}
        segmentClass={segmentClass}
        fallback={nowMinutes}
        prefix={timeIcon(ClockIcon)}
      />
      <TimeField
        Popover={Popover}
        value={endMinutes}
        onCommit={(m) => {
          const start = startMinutes ?? Math.max(m - 60, 0);
          if (m <= start) return;
          setTimeRange({ start: minutesToTime(start), end: minutesToTime(m) });
        }}
        slots={endSlots}
        hourCycle={hourCycle}
        locale={locale}
        placeholder="End"
        label="End time"
        disabled={disabled}
        scope={scope}
        index={2}
        segmentClass={segmentClass}
        fallback={(startMinutes ?? nowMinutes) + 60}
        prefix={timeIcon(ArrowIcon)}
        suffix={
          startMinutes !== null && endMinutes !== null && endMinutes > startMinutes ? (
            <span
              data-slot="date-picker-duration"
              className="whitespace-nowrap text-muted-foreground"
            >
              {formatDuration(endMinutes - startMinutes)}
            </span>
          ) : undefined
        }
      />
    </>
  ) : null;

  const clearable_ = field && clearable && (hasValue || (hasTime && !!time) || (hasTimeRange && !!timeRange));
  const content = (
    <div
      ref={segmentsRef}
      role="group"
      aria-label={ariaLabel}
      data-slot="date-picker"
      data-variant={variant}
      className={cn(
        "group/date-picker relative inline-flex items-center",
        sizeClasses.control,
        sizeClasses.text,
        field
          ? cn(
              "border border-border bg-transparent p-0.5",
              shape.input,
              compact ? "min-w-[128px]" : "min-w-[160px]"
            )
          : "",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...segmentHover.handlers}
    >
      <FluidHoverHighlight hover={segmentHover} className={cn("z-0", innerRadius)} />
      {datePopover}
      {(hasTime || hasTimeRange) && (
        <span aria-hidden className="relative z-[1] mx-0.5 h-4 w-px shrink-0 bg-border" />
      )}
      {timeSegments}
      <AnimatePresence initial={false}>
        {clearable_ && (
          <motion.button
            ref={clearRef as RefObject<HTMLButtonElement>}
            key="clear"
            type="button"
            aria-label="Clear"
            data-slot="date-picker-clear"
            className={cn(
              "relative z-[1] ml-auto inline-flex h-full shrink-0 cursor-pointer items-center justify-center text-muted-foreground outline-none hover:text-foreground",
              "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
              compact ? "w-6" : "w-7",
              innerRadius
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: spring.fast }}
            exit={{ opacity: 0, transition: spring.fast.exit }}
            onClick={() => {
              setValue(undefined);
              setDraft(undefined);
              if (hasTime) setTime(null);
              if (hasTimeRange) setTimeRange(null);
            }}
          >
            <ClearIcon size={sizeClasses.icon} strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );

  return size ? <SizeProvider size={size}>{content}</SizeProvider> : content;
}

DatePickerCore.displayName = "DatePickerCore";

export { DatePickerCore };
export type {
  DatePickerProps,
  DatePickerSingleProps,
  DatePickerRangeProps,
  DateRange,
};
