"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import {
  DayPicker,
  dateMatchModifiers,
  labelDayButton,
  rangeContainsModifiers,
  useDayPicker,
  type CalendarDay,
  type CalendarMonth,
  type CustomComponents,
  type DateRange,
  type DayButtonProps,
  type DayPickerProps,
  type DayProps,
  type Formatters,
  type Labels,
  type Matcher,
  type Modifiers,
  type MonthCaptionProps,
  type MonthProps,
  type WeekNumberProps,
  type WeekProps,
} from "@daypicker/react";
import { cn } from "@/lib/utils";
import { omit } from "@/lib/omit";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { useSize, typeClass, type SizeVariant } from "@/lib/size-context";
import { useIcons } from "@/lib/icon-context";
import { POPUP_NAV_KEYS } from "@/lib/popup";
import { useKeyboardNavGate } from "@/hooks/use-keyboard-nav-gate";
import {
  useFluidHover,
  useRegisterFluidHoverItem,
  type ItemRect,
  type UseFluidHoverReturn,
} from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Calendar
//
// DayPicker owns the date math, the roving tabindex, the grid keys
// (arrows, PageUp/PageDown, Home/End), locale and selection rules. Every
// part it renders is replaced here by a div with the matching ARIA role, so
// the grid lays out with flex instead of table rules and one fluid hover
// scope can span both months. DayPicker's own `animate` stays off: the
// month slide below is ours.
// ---------------------------------------------------------------------------

type CalendarOrientation = "auto" | "horizontal" | "vertical";

/** Days since the epoch for a local calendar date. Comparing these instead
 *  of Date objects keeps every range check free of time-of-day and DST. */
export function dayNumber(date: Date) {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * The three day matchers, mapped onto what DayPicker understands. `booked`
 * and every day outside `available` join `disabled`, so none of them can be
 * picked or focused; `booked` also stays a modifier of its own for the
 * line-through and the accessible label. Exported for the unit test.
 */
export function resolveDayMatchers({
  booked,
  available,
  disabled,
}: {
  booked?: Matcher | Matcher[];
  available?: Matcher | Matcher[];
  disabled?: Matcher | Matcher[];
}) {
  // A Matcher[] and a Date[] both read as "any of these", so arrays flatten.
  const flat = (m: Matcher | Matcher[] | undefined): Matcher[] =>
    m === undefined ? [] : Array.isArray(m) ? m : [m];
  const outside: Matcher[] =
    available === undefined ? [] : [(date: Date) => !dateMatchModifiers(date, available)];
  const unavailable = [...flat(disabled), ...outside];
  const list = [...flat(booked), ...unavailable];
  return {
    disabled: list,
    modifiers: {
      booked: booked ?? false,
      unavailable: unavailable.length > 0 ? unavailable : false,
    } as Record<string, Matcher | Matcher[]>,
  };
}

/** ISO 8601 week numbers by default: they need a Monday start, so the
 *  Monday start comes with them unless the caller picked a Sunday week, in
 *  which case the locale's own numbering applies. Exported for the test. */
export function resolveWeekNumbering(
  showWeekNumber: boolean | undefined,
  weekStartsOn: DayPickerProps["weekStartsOn"],
  ISOWeek: boolean | undefined
) {
  if (ISOWeek !== undefined) return ISOWeek;
  if (!showWeekNumber) return false;
  return weekStartsOn === undefined || weekStartsOn === 1;
}

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

interface CalendarContextValue {
  compact: boolean;
  fill: boolean;
  pill: boolean;
  mode: "single" | "range";
  /** Single mode: the selected day number. */
  selectedDay: number | null;
  /** Range mode: the committed range. */
  range: DateRange | undefined;
  /** A range whose start is picked and whose end is not yet. */
  picking: boolean;
  /** Everything that can't be picked, for the preview's booked-day check. */
  disabledMatchers: Matcher[];
  orientation: "horizontal" | "vertical";
  numberOfMonths: number;
  outsideHidden: boolean;
  showWeekNumber: boolean;
  /** DayPicker's autoFocus: the first focus is the script's, not a key's. */
  autoFocus: boolean;
  /** The caller's hideNavigation / disableNavigation (DayPicker's own nav
   *  is always hidden; the captions render ours). */
  navHidden: boolean;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

function useCalendarContext() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("Calendar parts must be inside <Calendar>");
  return ctx;
}

interface GridContextValue {
  registerItem: UseFluidHoverReturn["registerItem"];
  gridStart: number;
  /** The band to draw: committed, or start → hovered day while picking. */
  band: { from: number; to: number } | null;
  /** The day the pointer or focus proposes as the end, while picking. */
  previewEnd: number | null;
  direction: number;
  reduceMotion: boolean;
}

const GridContext = createContext<GridContextValue | null>(null);

function useGridContext() {
  const ctx = useContext(GridContext);
  if (!ctx) throw new Error("Calendar parts must be inside <Calendar>");
  return ctx;
}

const MonthContext = createContext<{ calendarMonth: CalendarMonth; displayIndex: number } | null>(null);

/** False inside a month grid that is sliding out: its days stay on screen
 *  for the crossfade but leave the hover scope and the tab order. */
const PanelPresentContext = createContext(true);

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const INDEX_ATTR = "data-calendar-index";
/** Parts the pointer passes over without lighting a day (captions, the
 *  weekday row, week numbers, booked days). */
const INERT_ATTR = "data-calendar-inert";
const MONTH_GAP = 24;
const CALENDAR_PAD = 8;

function isDisabledDay(el: HTMLElement) {
  return (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true";
}

// ---------------------------------------------------------------------------
// Months: the one fluid hover scope across every month on screen
// ---------------------------------------------------------------------------

function Months({ className, style, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const cal = useCalendarContext();
  const { months, formatters, labels } = useDayPicker();
  const shape = useShape();
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const hover = useFluidHover(containerRef, { axis: "xy", isItemDisabled: isDisabledDay });
  const { activeIndex, setActiveIndex, itemRects, isMeasured, handlers, registerItem } = hover;
  const { onMouseMove, onMouseEnter, onMouseLeave, onClick } = handlers;

  const firstDay = months[0]?.weeks[0]?.days[0]?.date;
  const gridStart = firstDay ? dayNumber(firstDay) : 0;
  const monthKey = months[0] ? months[0].date.getTime() : 0;

  // A month change re-registers every day under new indices. The highlight
  // and the ring snap to where focus lands instead of gliding from the old
  // grid's geometry (the keyboard crossing a month boundary), and the grids
  // slide in the direction of travel.
  const [lastMonthKey, setLastMonthKey] = useState(monthKey);
  const [direction, setDirection] = useState(0);
  const [snap, setSnap] = useState(false);
  if (monthKey !== lastMonthKey) {
    setLastMonthKey(monthKey);
    setDirection(monthKey > lastMonthKey ? 1 : -1);
    setSnap(true);
  }
  useEffect(() => {
    if (!snap || !isMeasured) return;
    const id = requestAnimationFrame(() => setSnap(false));
    return () => cancelAnimationFrame(id);
  }, [snap, isMeasured]);

  // Keyboard focus ring: earned by navigation keys, or by focus arriving
  // with :focus-visible (Tab from outside). DayPicker's autoFocus is a
  // script focus, which Chrome marks focus-visible regardless, so the first
  // focus after mount only counts when the gate was seeded by a keyboard
  // trigger.
  const { keyboardNavRef, trackKeyboardNav } = useKeyboardNavGate(true);
  const autoFocusPendingRef = useRef(cal.autoFocus);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inertRef = useRef(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (focusedIndex !== null) setFocusedIndex(null);
    if (snap) setSnap(false);
    const target = e.target as Element;
    if (target.closest?.(`[${INERT_ATTR}]`)) {
      if (!inertRef.current) {
        inertRef.current = true;
        onMouseLeave();
      }
      return;
    }
    if (inertRef.current) {
      inertRef.current = false;
      onMouseEnter();
    }
    onMouseMove(e);
  };

  const handleFocus = (e: FocusEvent) => {
    const el = (e.target as HTMLElement).closest?.(`[${INDEX_ATTR}]`);
    if (!el) return;
    const idx = Number(el.getAttribute(INDEX_ATTR));
    setActiveIndex(idx);
    const fromScript = autoFocusPendingRef.current;
    autoFocusPendingRef.current = false;
    const ring =
      keyboardNavRef.current ||
      (!fromScript && (e.target as HTMLElement).matches(":focus-visible"));
    setFocusedIndex(ring ? idx : null);
  };

  const handleBlur = (e: FocusEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setFocusedIndex(null);
    setActiveIndex(null);
  };

  // While a range end is being picked, the band follows the lit day.
  const previewDate =
    cal.picking && activeIndex !== null && firstDay ? addDays(firstDay, activeIndex) : null;
  let previewEnd: number | null = null;
  let band: { from: number; to: number } | null = null;
  if (cal.mode === "range" && cal.range?.from) {
    const from = dayNumber(cal.range.from);
    if (cal.picking) {
      if (previewDate && cal.range.from) {
        const a = cal.range.from < previewDate ? cal.range.from : previewDate;
        const b = cal.range.from < previewDate ? previewDate : cal.range.from;
        const blocked =
          cal.disabledMatchers.length > 0 &&
          rangeContainsModifiers({ from: a, to: b }, cal.disabledMatchers);
        if (!blocked) {
          previewEnd = dayNumber(previewDate);
          band = { from: Math.min(from, previewEnd), to: Math.max(from, previewEnd) };
        }
      }
    } else if (cal.range.to) {
      band = { from, to: dayNumber(cal.range.to) };
    }
  }

  const gridCtx = useMemo(
    () => ({ registerItem, gridStart, band, previewEnd, direction, reduceMotion }),
    // band is rebuilt each render; compare its parts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registerItem, gridStart, band?.from, band?.to, previewEnd, direction, reduceMotion]
  );

  const focusRect: ItemRect | null =
    isMeasured && focusedIndex !== null ? (itemRects[focusedIndex] ?? null) : null;
  const cellRadius = cal.pill ? "rounded-full" : shape.bg;
  const vertical = cal.numberOfMonths > 1 && cal.orientation === "vertical";

  return (
    <div
      ref={containerRef}
      data-slot="calendar-months"
      data-orientation={cal.numberOfMonths > 1 ? cal.orientation : undefined}
      className={cn(
        "relative isolate flex",
        vertical ? "flex-col gap-4" : "flex-row flex-wrap gap-x-6 gap-y-4",
        cal.fill && "w-full",
        className
      )}
      style={style}
      onKeyDownCapture={(e) => {
        if (POPUP_NAV_KEYS.includes(e.key)) trackKeyboardNav(e);
      }}
      onMouseDown={() => {
        keyboardNavRef.current = false;
        setFocusedIndex(null);
      }}
      onMouseEnter={() => {
        inertRef.current = false;
        onMouseEnter();
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      <FluidHoverHighlight
        hover={hover}
        className={cn("z-[1]", cellRadius)}
        transition={snap ? false : undefined}
      />
      <AnimatePresence>
        {focusRect && (
          <motion.div
            data-slot="calendar-focus-ring"
            className={cn(
              "pointer-events-none absolute left-0 top-0 z-[3] border border-[color:var(--focus-ring,#6B97FF)]",
              cal.pill ? "rounded-full" : shape.focusRing
            )}
            initial={{
              opacity: 0,
              x: focusRect.left - 2,
              y: focusRect.top - 2,
              width: focusRect.width + 4,
              height: focusRect.height + 4,
            }}
            animate={{
              opacity: 1,
              x: focusRect.left - 2,
              y: focusRect.top - 2,
              width: focusRect.width + 4,
              height: focusRect.height + 4,
            }}
            exit={{ opacity: 0, transition: spring.fast.exit }}
            transition={{
              ...(snap || reduceMotion ? { duration: 0 } : spring.fast),
              opacity: { duration: 0.08 },
            }}
          />
        )}
      </AnimatePresence>
      {vertical && months[0] && (
        <div
          aria-hidden
          {...{ [INERT_ATTR]: "" }}
          className="sticky top-0 z-[4] flex bg-inherit"
        >
          {cal.showWeekNumber && <span className="w-[var(--cell-size)] shrink-0" />}
          {months[0].weeks[0].days.map((day) => (
            <WeekdayCell key={day.isoDate}>
              {formatters.formatWeekdayName(day.date, day.dateLib.options, day.dateLib)}
            </WeekdayCell>
          ))}
          <span className="sr-only">{labels.labelWeekNumberHeader?.()}</span>
        </div>
      )}
      <GridContext.Provider value={gridCtx}>{children}</GridContext.Provider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Month, caption and navigation
// ---------------------------------------------------------------------------

function Month({ calendarMonth, displayIndex, className, style, children, ...props }: MonthProps) {
  const cal = useCalendarContext();
  const value = useMemo(() => ({ calendarMonth, displayIndex }), [calendarMonth, displayIndex]);
  return (
    <MonthContext.Provider value={value}>
      <div
        data-slot="calendar-month"
        className={cn("flex flex-col", cal.fill && "min-w-0 flex-1", className)}
        style={style}
        {...props}
      >
        {children}
      </div>
    </MonthContext.Provider>
  );
}

function NavButton({ direction }: { direction: "previous" | "next" }) {
  const { previousMonth, nextMonth, goToMonth, labels, dayPickerProps } = useDayPicker();
  const icons = useIcons();
  const Chevron = icons["chevron-right"];
  const target = direction === "previous" ? previousMonth : nextMonth;
  const label =
    direction === "previous"
      ? labels.labelPrevious(previousMonth)
      : labels.labelNext(nextMonth);
  const tooltip = direction === "previous" ? "Previous month" : "Next month";
  const flip = (direction === "previous") !== (dayPickerProps.dir === "rtl");
  return (
    <Tooltip content={tooltip}>
      <Button
        type="button"
        variant="ghost"
        size="icon-compact"
        aria-label={label}
        aria-disabled={target ? undefined : true}
        data-calendar-nav={direction}
        disabled={!target}
        onClick={() => {
          if (!target) return;
          goToMonth(target);
          if (direction === "previous") dayPickerProps.onPrevClick?.(target);
          else dayPickerProps.onNextClick?.(target);
        }}
        // The pair shares one fluid hover highlight, so each button's own
        // hover fill stays off; the press feedback is kept.
        className="relative z-[1] !size-[calc(var(--cell-size)*0.78)] group-hover:[&>span:first-child]:!bg-transparent group-hover:[&>span:first-child]:!shadow-none"
      >
        <Chevron size={16} className={cn(flip && "rotate-180")} />
      </Button>
    </Tooltip>
  );
}

function NavGroup({ buttons }: { buttons: ("previous" | "next")[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(ref, { axis: "x", isItemDisabled: isDisabledDay, gapClick: false });
  const shape = useShape();
  const { setActiveIndex } = hover;
  return (
    <div
      ref={ref}
      data-slot="calendar-nav"
      className="relative flex items-center"
      {...hover.handlers}
      onFocus={(e) => {
        const idx = buttons.indexOf(
          (e.target as HTMLElement).getAttribute("data-calendar-nav") as "previous" | "next"
        );
        if (idx >= 0 && (e.target as HTMLElement).matches(":focus-visible")) setActiveIndex(idx);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setActiveIndex(null);
      }}
    >
      <FluidHoverHighlight hover={hover} className={cn("z-0", shape.button)} />
      {buttons.map((b, i) => (
        <NavSlot key={b} index={i} registerItem={hover.registerItem}>
          <NavButton direction={b} />
        </NavSlot>
      ))}
    </div>
  );
}

function NavSlot({
  index,
  registerItem,
  children,
}: {
  index: number;
  registerItem: UseFluidHoverReturn["registerItem"];
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  return (
    <span ref={ref} className="relative flex">
      {children}
    </span>
  );
}

/** The month name. The one sliding out stays visible for the crossfade but
 *  leaves the live region, so a month change is announced once. */
function CaptionText({
  compact,
  direction,
  offset,
  children,
}: {
  compact: boolean;
  direction: number;
  offset: number;
  children: ReactNode;
}) {
  const present = useIsPresent();
  return (
    <motion.span
      role={present ? "status" : undefined}
      aria-live={present ? "polite" : undefined}
      aria-hidden={present ? undefined : true}
      className={cn(
        "col-start-1 row-start-1 whitespace-nowrap text-foreground [text-box:trim-both_cap_alphabetic]",
        typeClass("body", compact ? "compact" : "default")
      )}
      style={{ fontVariationSettings: fontWeights.semibold }}
      initial={{ opacity: 0, x: direction * offset }}
      animate={{ opacity: 1, x: 0, transition: spring.moderate }}
      exit={{ opacity: 0, x: -direction * offset, transition: spring.moderate.exit }}
    >
      {children}
    </motion.span>
  );
}

function MonthCaption({ calendarMonth, displayIndex, className, style, ...props }: MonthCaptionProps) {
  const cal = useCalendarContext();
  const { formatters } = useDayPicker();
  const grid = useGridContext();
  const last = displayIndex === cal.numberOfMonths - 1;
  const first = displayIndex === 0;
  const twoUp = cal.numberOfMonths > 1 && cal.orientation === "horizontal";
  const hideNav = cal.navHidden;

  // Single month and stacked months: caption left, both chevrons right of
  // the first caption. Side by side: captions centered, previous at the far
  // left, next at the far right.
  const navStart: ("previous" | "next")[] = !hideNav && twoUp && first ? ["previous"] : [];
  const navEnd: ("previous" | "next")[] = hideNav
    ? []
    : twoUp
      ? last
        ? ["next"]
        : []
      : first
        ? ["previous", "next"]
        : [];
  const key = calendarMonth.date.getTime();
  const offset = grid.reduceMotion ? 0 : 10;

  return (
    <div
      data-slot="calendar-caption"
      {...{ [INERT_ATTR]: "" }}
      className={cn(
        "relative flex h-[var(--cell-size)] items-center gap-1",
        twoUp ? "justify-center" : "justify-between pl-2",
        "mb-1",
        className
      )}
      style={style}
      {...omit(props, ["children"])}
    >
      {twoUp && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          {navStart.length > 0 && <NavGroup buttons={navStart} />}
        </div>
      )}
      <span className="relative inline-grid overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout" custom={grid.direction}>
          <CaptionText
            key={key}
            compact={cal.compact}
            direction={grid.direction}
            offset={offset}
          >
            {formatters.formatCaption(
              calendarMonth.date,
              calendarMonth.weeks[0]?.days[0]?.dateLib.options,
              calendarMonth.weeks[0]?.days[0]?.dateLib
            )}
          </CaptionText>
        </AnimatePresence>
      </span>
      {twoUp ? (
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          {navEnd.length > 0 && <NavGroup buttons={navEnd} />}
        </div>
      ) : (
        navEnd.length > 0 && <NavGroup buttons={navEnd} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

function MonthGrid({ className, style, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <div
      data-slot="calendar-grid"
      className={cn("flex flex-col", className)}
      style={style}
      {...(props as HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </div>
  );
}

function WeekdayCell({ children, className }: { children: ReactNode; className?: string }) {
  const cal = useCalendarContext();
  return (
    <span
      className={cn(
        "flex h-[calc(var(--cell-size)*0.8)] items-center justify-center text-muted-foreground",
        cal.fill ? "min-w-0 flex-1" : "w-[var(--cell-size)]",
        typeClass("caption", cal.compact ? "compact" : "default"),
        className
      )}
    >
      {children}
    </span>
  );
}

function Weekdays({ className, style, children }: HTMLAttributes<HTMLElement>) {
  const cal = useCalendarContext();
  // Stacked months show one weekday row, pinned above both grids.
  if (cal.numberOfMonths > 1 && cal.orientation === "vertical") return null;
  return (
    <div
      role="row"
      aria-hidden
      {...{ [INERT_ATTR]: "" }}
      className={cn("flex", className)}
      style={style}
    >
      {children}
    </div>
  );
}

function Weekday({ className, style, children, ...props }: HTMLAttributes<HTMLElement>) {
  const cal = useCalendarContext();
  return (
    <div
      role="columnheader"
      className={cn(
        "flex h-[calc(var(--cell-size)*0.8)] items-center justify-center text-muted-foreground",
        cal.fill ? "min-w-0 flex-1" : "w-[var(--cell-size)]",
        typeClass("caption", cal.compact ? "compact" : "default"),
        className
      )}
      style={style}
      aria-label={(props as { "aria-label"?: string })["aria-label"]}
    >
      {children}
    </div>
  );
}

function WeekNumberHeader({ className, style, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <div
      role="columnheader"
      aria-label={(props as { "aria-label"?: string })["aria-label"]}
      className={cn("w-[var(--cell-size)] shrink-0", className)}
      style={style}
    />
  );
}

/**
 * The weeks of one month. Each month slides 10px in the direction of
 * travel and crossfades with the grid it replaces; the box springs between
 * 5- and 6-week heights from a measured offsetHeight (never "auto", which
 * overshoots under a scaled ancestor). Reduced motion keeps the crossfade.
 */
function Weeks({ className, style, children }: HTMLAttributes<HTMLElement>) {
  const month = useContext(MonthContext);
  const grid = useGridContext();
  const height = useMotionValue<number | "auto">("auto");
  const measuredRef = useRef(false);
  const [clip, setClip] = useState(false);

  const onHeight = useCallback(
    (h: number) => {
      if (!measuredRef.current || grid.reduceMotion) {
        measuredRef.current = true;
        height.set(h);
        return;
      }
      if (height.get() === h) return;
      setClip(true);
      animate(height, h, { ...spring.moderate, onComplete: () => setClip(false) });
    },
    [grid.reduceMotion, height]
  );

  const key = month ? month.calendarMonth.date.getTime() : 0;
  const offset = grid.reduceMotion ? 0 : 10;

  return (
    <motion.div
      data-slot="calendar-weeks"
      className={cn("relative", clip && "overflow-hidden")}
      style={{ height }}
    >
      <AnimatePresence initial={false} mode="popLayout" custom={grid.direction}>
        <WeeksPanel
          key={key}
          className={className}
          style={style}
          direction={grid.direction}
          offset={offset}
          onHeight={onHeight}
        >
          {children}
        </WeeksPanel>
      </AnimatePresence>
    </motion.div>
  );
}

function WeeksPanel({
  className,
  style,
  children,
  direction,
  offset,
  onHeight,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  direction: number;
  offset: number;
  onHeight: (h: number) => void;
}) {
  const present = useIsPresent();
  const ref = useRef<HTMLDivElement>(null);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !present) return;
    onHeight(el.offsetHeight);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => onHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [present, onHeight]);
  return (
    <PanelPresentContext.Provider value={present}>
      <motion.div
        ref={ref}
        role="rowgroup"
        aria-hidden={present ? undefined : true}
        className={cn("flex flex-col", !present && "pointer-events-none", className)}
        style={style}
        initial={{ opacity: 0, x: direction * offset }}
        animate={{ opacity: 1, x: 0, transition: spring.moderate }}
        exit={{ opacity: 0, x: -direction * offset, transition: spring.moderate.exit }}
      >
        {children}
      </motion.div>
    </PanelPresentContext.Provider>
  );
}

function Week({ className, style, children }: WeekProps) {
  return (
    <div role="row" className={cn("flex", className)} style={style}>
      {children}
    </div>
  );
}

function WeekNumber({ className, style, children, ...props }: WeekNumberProps) {
  const cal = useCalendarContext();
  return (
    <div
      role="rowheader"
      aria-label={(props as { "aria-label"?: string })["aria-label"]}
      {...{ [INERT_ATTR]: "" }}
      className={cn(
        "flex w-[var(--cell-size)] shrink-0 items-center justify-center tabular-nums text-muted-foreground opacity-60",
        cal.fill ? "max-h-[var(--cell-size)]" : "h-[var(--cell-size)]",
        typeClass("caption", cal.compact ? "compact" : "default"),
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

/**
 * One gridcell. Draws its slice of the range band: from its center to the
 * edge facing the rest of the range, full width in the middle, rounded only
 * where a week row (or a month, when outside days are hidden) ends.
 */
function Day({ day, modifiers, className, style, children, ...props }: DayProps) {
  const cal = useCalendarContext();
  const grid = useGridContext();
  const n = dayNumber(day.date);
  const band = grid.band;
  const visible = !modifiers.hidden;
  const inBand = !!band && visible && band.from !== band.to && n >= band.from && n <= band.to;
  const weekday = (day.date.getDay() - weekStartIndex(day) + 7) % 7;
  const nextDay = addDays(day.date, 1);
  const lastOfMonth = nextDay.getMonth() !== day.date.getMonth();
  const firstOfMonth = day.date.getDate() === 1;
  const roundLeft = inBand && n > band!.from && (weekday === 0 || (firstOfMonth && cal.outsideHidden));
  const roundRight = inBand && n < band!.to && (weekday === 6 || (lastOfMonth && cal.outsideHidden));
  const radius = cal.pill ? "9999px" : "8px";

  return (
    <div
      role="gridcell"
      aria-selected={(props as { "aria-selected"?: boolean })["aria-selected"]}
      aria-label={(props as { "aria-label"?: string })["aria-label"]}
      data-day={(props as { "data-day"?: string })["data-day"]}
      data-today={modifiers.today || undefined}
      data-outside={day.outside || undefined}
      data-hidden={modifiers.hidden || undefined}
      className={cn(
        "relative flex items-center justify-center p-0",
        cal.fill
          ? "aspect-square max-h-[var(--cell-size)] min-w-0 flex-1"
          : "size-[var(--cell-size)]",
        className
      )}
      style={style}
    >
      {inBand && (
        <span
          aria-hidden
          data-slot="calendar-range-band"
          className="pointer-events-none absolute inset-y-0 bg-[var(--tint)]"
          style={{
            left: n > band!.from ? 0 : "50%",
            right: n < band!.to ? 0 : "50%",
            borderTopLeftRadius: roundLeft ? radius : 0,
            borderBottomLeftRadius: roundLeft ? radius : 0,
            borderTopRightRadius: roundRight ? radius : 0,
            borderBottomRightRadius: roundRight ? radius : 0,
          }}
        />
      )}
      {children}
    </div>
  );
}

/** Which weekday a row starts on, read off the day's own week. */
function weekStartIndex(day: CalendarDay) {
  return day.dateLib.startOfWeek(day.date).getDay();
}

function DayButton({ day, modifiers, className, style, children, ...props }: DayButtonProps) {
  const cal = useCalendarContext();
  const grid = useGridContext();
  const present = useContext(PanelPresentContext);
  const ref = useRef<HTMLButtonElement>(null);

  // DayPicker moves focus by flagging the day; the button takes it.
  useEffect(() => {
    if (modifiers.focused && present) ref.current?.focus();
  }, [modifiers.focused, present]);

  const n = dayNumber(day.date);
  const index = n - grid.gridStart;
  // Outside days and a grid sliding out stay out of the hover scope.
  useRegisterFluidHoverItem(present && !day.outside ? grid.registerItem : undefined, index, ref);

  const band = grid.band;
  const isEnd =
    cal.mode === "single"
      ? cal.selectedDay === n
      : (!!cal.range?.from && dayNumber(cal.range.from) === n) ||
        (!!cal.range?.to && !cal.picking && dayNumber(cal.range.to) === n) ||
        grid.previewEnd === n;
  const isPreviewEnd = cal.picking && grid.previewEnd === n && !(cal.range?.from && dayNumber(cal.range.from) === n);
  const inMiddle = !!band && n > band.from && n < band.to;
  const booked = !!modifiers.booked;
  const unavailable = !!modifiers.disabled;
  const compact = cal.compact;

  return (
    <button
      ref={ref}
      {...props}
      tabIndex={present ? props.tabIndex : -1}
      {...{ [INDEX_ATTR]: day.outside ? undefined : index }}
      {...(unavailable ? { [INERT_ATTR]: "" } : {})}
      data-selected={isEnd || undefined}
      data-range-middle={inMiddle || undefined}
      data-booked={booked || undefined}
      data-unavailable={unavailable || undefined}
      data-preview-end={isPreviewEnd || undefined}
      className={cn(
        "relative z-[2] flex items-center justify-center p-0 outline-none select-none tabular-nums",
        "transition-[color,background-color,font-variation-settings] duration-80",
        cal.fill ? "aspect-square h-full max-w-full" : "size-[var(--cell-size)]",
        cal.pill ? "rounded-full" : "rounded-lg",
        typeClass("body", compact ? "compact" : "default"),
        isEnd
          ? "bg-foreground text-background"
          : unavailable
            ? cn("cursor-default text-muted-foreground opacity-50", booked && "line-through")
            : day.outside
              ? "cursor-pointer text-muted-foreground opacity-60"
              : "cursor-pointer text-foreground",
        isPreviewEnd &&
          "before:pointer-events-none before:absolute before:-inset-[2px] before:rounded-[inherit] before:border before:border-foreground",
        className
      )}
      style={{
        ...style,
        fontVariationSettings:
          isEnd || modifiers.today ? fontWeights.semibold : fontWeights.normal,
      }}
    >
      <span className="[text-box:trim-both_cap_alphabetic]">{children}</span>
      {modifiers.today && (
        <span
          aria-hidden
          data-slot="calendar-today-dot"
          className="absolute bottom-[14%] left-1/2 size-1 -translate-x-1/2 rounded-full bg-current"
        />
      )}
    </button>
  );
}

function Root(props: { rootRef?: React.Ref<HTMLDivElement> } & HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="calendar" {...omit(props, ["rootRef"])} />;
}

const components: Partial<CustomComponents> = {
  Root: Root as CustomComponents["Root"],
  Months: Months as CustomComponents["Months"],
  Month: Month as CustomComponents["Month"],
  MonthCaption: MonthCaption as CustomComponents["MonthCaption"],
  MonthGrid: MonthGrid as unknown as CustomComponents["MonthGrid"],
  Weekdays: Weekdays as unknown as CustomComponents["Weekdays"],
  Weekday: Weekday as unknown as CustomComponents["Weekday"],
  WeekNumberHeader: WeekNumberHeader as unknown as CustomComponents["WeekNumberHeader"],
  Weeks: Weeks as unknown as CustomComponents["Weeks"],
  Week: Week as unknown as CustomComponents["Week"],
  WeekNumber: WeekNumber as unknown as CustomComponents["WeekNumber"],
  Day: Day as unknown as CustomComponents["Day"],
  DayButton: DayButton as CustomComponents["DayButton"],
};

// ---------------------------------------------------------------------------
// Calendar (root)
// ---------------------------------------------------------------------------

type PassThrough = Omit<
  DayPickerProps,
  | "mode"
  | "selected"
  | "onSelect"
  | "required"
  | "disabled"
  | "numberOfMonths"
  | "showOutsideDays"
  | "animate"
  | "min"
  | "max"
  | "excludeDisabled"
  | "resetOnSelect"
>;

interface CalendarBaseProps extends PassThrough {
  /** Days that are taken: unavailable, struck through, and announced as
   *  booked. Any DayPicker matcher. */
  booked?: Matcher | Matcher[];
  /** When set, every day it does NOT match is unavailable. */
  available?: Matcher | Matcher[];
  /** Days that can't be picked (`{ before: today }` for the past). */
  disabled?: Matcher | Matcher[];
  /** 1 or 2 months side by side or stacked. */
  numberOfMonths?: 1 | 2;
  /** Two months: side by side, stacked, or side by side when the container
   *  fits both. Default "auto". */
  orientation?: CalendarOrientation;
  /** Cell size in px. Default 36, or 32 at the compact size. */
  cellSize?: number;
  /** Stretch the columns to the container's width; `cellSize` then caps
   *  the row height. */
  fill?: boolean;
  /** Days of the neighbouring months. Default true for 1 month, always off
   *  for 2 so no date shows twice. */
  showOutsideDays?: boolean;
  /** Pins the calendar to one step of the size ladder. */
  size?: SizeVariant;
}

interface CalendarSingleProps extends CalendarBaseProps {
  mode?: "single";
  selected?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
  required?: boolean;
}

interface CalendarRangeProps extends CalendarBaseProps {
  mode: "range";
  selected?: DateRange | undefined;
  onSelect?: (range: DateRange | undefined) => void;
  required?: boolean;
  /** Fewest nights a range may span. */
  min?: number;
  /** Most nights a range may span. */
  max?: number;
}

type CalendarProps = CalendarSingleProps | CalendarRangeProps;

function Calendar(props: CalendarProps) {
  const {
    mode = "single",
    selected: selectedProp,
    onSelect,
    booked,
    available,
    disabled,
    numberOfMonths = 1,
    orientation = "auto",
    cellSize: cellSizeProp,
    fill = false,
    showOutsideDays: showOutsideDaysProp,
    size,
    showWeekNumber,
    weekStartsOn,
    ISOWeek: ISOWeekProp,
    labels: labelsProp,
    formatters: formattersProp,
    className,
    style,
    autoFocus,
    ...rest
  } = props as CalendarBaseProps & {
    mode?: "single" | "range";
    selected?: Date | DateRange;
    onSelect?: (value: Date | DateRange | undefined) => void;
  };
  const sizeClasses = useSize(size);
  const compact = sizeClasses.variant === "compact";
  const shape = useShape();
  const cellSize = cellSizeProp ?? (compact ? 32 : 36);
  const twoMonths = numberOfMonths > 1;
  const showOutsideDays = twoMonths ? false : (showOutsideDaysProp ?? true);

  // Controlled like DayPicker: an `onSelect` makes `selected` the source of
  // truth; without one, `selected` only seeds internal state.
  const [internal, setInternal] = useState<Date | DateRange | undefined>(selectedProp);
  const value = onSelect ? selectedProp : internal;
  const range = mode === "range" ? (value as DateRange | undefined) : undefined;
  const picking = mode === "range" && !!range?.from && !range.to;
  // The range in place before a pick started, for Escape to restore.
  const beforePickRef = useRef<DateRange | undefined>(undefined);

  const commit = useCallback(
    (next: Date | DateRange | undefined) => {
      if (!onSelect) setInternal(next);
      onSelect?.(next);
    },
    [onSelect]
  );

  const matchers = useMemo(
    () => resolveDayMatchers({ booked, available, disabled }),
    [booked, available, disabled]
  );

  const labels = useMemo<Partial<Labels>>(
    () => ({
      labelDayButton: (date, modifiers: Modifiers, options, dateLib) => {
        const base = labelDayButton(date, modifiers, options, dateLib);
        return modifiers.booked ? `${base}, booked` : base;
      },
      ...labelsProp,
    }),
    [labelsProp]
  );

  // Week numbers read like the day numbers beside them: 1, not 01.
  const formatters = useMemo<Partial<Formatters>>(
    () => ({ formatWeekNumber: (n: number) => String(n), ...formattersProp }),
    [formattersProp]
  );

  // "auto": side by side when the container fits both months, stacked
  // otherwise. The width two months need is known from the cell size, so
  // the decision is one comparison per container resize.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(true);
  const neededWidth =
    (7 + (showWeekNumber ? 1 : 0)) * cellSize * 2 + MONTH_GAP + CALENDAR_PAD * 2;
  useIsoLayoutEffect(() => {
    if (orientation !== "auto" || !twoMonths) return;
    const parent = wrapperRef.current?.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const cs = getComputedStyle(parent);
      const width =
        parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      setFits(width >= neededWidth);
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [orientation, twoMonths, neededWidth]);
  const resolvedOrientation: "horizontal" | "vertical" =
    orientation === "auto" ? (fits ? "horizontal" : "vertical") : orientation;

  const ctx = useMemo<CalendarContextValue>(
    () => ({
      compact,
      fill,
      pill: shape.variant === "pill",
      mode,
      selectedDay:
        mode === "single" && value instanceof Date ? dayNumber(value) : null,
      range,
      picking,
      disabledMatchers: matchers.disabled,
      orientation: resolvedOrientation,
      numberOfMonths,
      outsideHidden: !showOutsideDays,
      showWeekNumber: !!showWeekNumber,
      autoFocus: !!autoFocus,
      navHidden: !!rest.hideNavigation || !!rest.disableNavigation,
    }),
    [compact, fill, shape.variant, mode, value, range, picking, matchers.disabled, resolvedOrientation, numberOfMonths, showOutsideDays, showWeekNumber, autoFocus, rest.hideNavigation, rest.disableNavigation]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Escape before the second pick puts the previous range back.
    if (e.key === "Escape" && picking) {
      e.stopPropagation();
      commit(beforePickRef.current);
    }
  };

  const ISOWeek = resolveWeekNumbering(showWeekNumber, weekStartsOn, ISOWeekProp);

  const shared = {
    ...rest,
    numberOfMonths,
    showOutsideDays,
    showWeekNumber,
    weekStartsOn,
    ISOWeek,
    autoFocus,
    labels,
    formatters,
    hideNavigation: true,
    disabled: matchers.disabled,
    modifiers: { ...matchers.modifiers, ...rest.modifiers },
    components: { ...components, ...rest.components },
    className: cn("p-2", fill && "w-full", className),
  };

  const picker =
    mode === "range" ? (
      <DayPicker
        {...(shared as Omit<DayPickerProps, "mode">)}
        mode="range"
        selected={range}
        excludeDisabled
        resetOnSelect
        required={(props as CalendarRangeProps).required as false | undefined}
        min={(props as CalendarRangeProps).min}
        max={(props as CalendarRangeProps).max}
        onSelect={(next: DateRange | undefined) => {
          if (next?.from && !next.to && !picking) beforePickRef.current = range;
          commit(next);
        }}
      />
    ) : (
      <DayPicker
        {...(shared as Omit<DayPickerProps, "mode">)}
        mode="single"
        selected={value instanceof Date ? value : undefined}
        required={(props as CalendarSingleProps).required as false | undefined}
        onSelect={(next: Date | undefined) => commit(next)}
      />
    );

  return (
    <CalendarContext.Provider value={ctx}>
      <div
        ref={wrapperRef}
        data-slot="calendar-root"
        className={cn("bg-inherit", fill ? "w-full" : "w-fit")}
        style={{ "--cell-size": `${cellSize}px`, ...style } as CSSProperties}
        onKeyDown={handleKeyDown}
      >
        {picker}
      </div>
    </CalendarContext.Provider>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
export type { CalendarProps, CalendarSingleProps, CalendarRangeProps, CalendarOrientation, DateRange, Matcher };
