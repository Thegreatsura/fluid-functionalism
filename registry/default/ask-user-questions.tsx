"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { useIcon } from "@/lib/icon-context";
import { useProximityHover } from "@/hooks/use-proximity-hover";
import { Button } from "@/components/ui/button";

export interface AskUserOption {
  id?: string;
  title: string;
  description?: string;
}

export interface AskUserQuestion {
  id?: string;
  title: string;
  options: AskUserOption[];
  multiSelect?: boolean;
  allowOther?: boolean;
  otherPlaceholder?: string;
  skippable?: boolean;
  nextLabel?: string;
}

export interface AskUserAnswer {
  questionId: string;
  selectedIds: string[];
  otherText?: string;
  skipped?: boolean;
}

export interface AskUserQuestionsProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  questions: AskUserQuestion[];
  currentIndex?: number;
  defaultCurrentIndex?: number;
  onCurrentIndexChange?: (index: number) => void;
  answers?: Record<string, AskUserAnswer>;
  defaultAnswers?: Record<string, AskUserAnswer>;
  onAnswersChange?: (answers: Record<string, AskUserAnswer>) => void;
  onComplete?: (answers: Record<string, AskUserAnswer>) => void;
  onSkip?: (questionId: string, currentIndex: number) => void;
  skipLabel?: string;
}

function questionKey(q: AskUserQuestion, i: number) {
  return q.id ?? `q-${i}`;
}

function optionKey(o: AskUserOption, i: number) {
  return o.id ?? `o-${i}`;
}

const AskUserQuestions = forwardRef<HTMLDivElement, AskUserQuestionsProps>(
  function AskUserQuestions(
    {
      questions,
      currentIndex: controlledIndex,
      defaultCurrentIndex = 0,
      onCurrentIndexChange,
      answers: controlledAnswers,
      defaultAnswers,
      onAnswersChange,
      onComplete,
      onSkip,
      skipLabel = "Skip",
      className,
      ...rest
    },
    ref
  ) {
    // ── Controlled / uncontrolled state ──────────────────────────
    const [internalIndex, setInternalIndex] = useState(defaultCurrentIndex);
    const isIndexControlled = controlledIndex !== undefined;
    const index = isIndexControlled ? (controlledIndex as number) : internalIndex;
    const setIndex = useCallback(
      (next: number) => {
        if (!isIndexControlled) setInternalIndex(next);
        onCurrentIndexChange?.(next);
      },
      [isIndexControlled, onCurrentIndexChange]
    );

    const [internalAnswers, setInternalAnswers] = useState<
      Record<string, AskUserAnswer>
    >(defaultAnswers ?? {});
    const isAnswersControlled = controlledAnswers !== undefined;
    const answers = isAnswersControlled
      ? (controlledAnswers as Record<string, AskUserAnswer>)
      : internalAnswers;

    const answersRef = useRef(answers);
    useEffect(() => {
      answersRef.current = answers;
    }, [answers]);

    const writeAnswers = useCallback(
      (
        updater: (
          prev: Record<string, AskUserAnswer>
        ) => Record<string, AskUserAnswer>
      ) => {
        const next = updater(answersRef.current);
        answersRef.current = next;
        if (!isAnswersControlled) setInternalAnswers(next);
        onAnswersChange?.(next);
        return next;
      },
      [isAnswersControlled, onAnswersChange]
    );

    const shape = useShape();
    const ArrowRight = useIcon("arrow-right");

    const reactId = useId();
    const total = questions.length;
    const safeIndex = Math.max(0, Math.min(index, Math.max(0, total - 1)));
    const question = questions[safeIndex];
    const qId = question ? questionKey(question, safeIndex) : "";
    const currentAnswer = answers[qId];

    const isMulti = !!question?.multiSelect;
    const isSkippable = question?.skippable !== false;
    const allowOther = !!question?.allowOther;
    const selectedIds = useMemo(
      () => currentAnswer?.selectedIds ?? [],
      [currentAnswer]
    );
    const otherText = currentAnswer?.otherText ?? "";

    const options = question?.options ?? [];
    const otherIndex = allowOther ? options.length : -1;
    const rowCount = options.length + (allowOther ? 1 : 0);

    // ── Refs & proximity hover ───────────────────────────────────
    const rowsContainerRef = useRef<HTMLDivElement>(null);
    const otherInputRef = useRef<HTMLInputElement>(null);
    // Stable IDs for contiguous-selection runs (see selectedGroups below).
    const groupIdCounterRef = useRef(0);
    const prevGroupMapRef = useRef(new Map<number, number>());
    const {
      activeIndex,
      setActiveIndex,
      itemRects,
      sessionRef,
      handlers,
      registerItem,
      measureItems,
    } = useProximityHover(rowsContainerRef);

    // Remeasure on row count change, question change, shape change
    useEffect(() => {
      measureItems();
    }, [measureItems, qId, rowCount, shape]);

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // Reset transient state when question changes
    useEffect(() => {
      setActiveIndex(null);
      setFocusedIndex(null);
    }, [safeIndex, setActiveIndex]);

    // Skip the slide-in animation on first mount
    const hasMounted = useRef(false);
    useEffect(() => {
      hasMounted.current = true;
    }, []);

    // ── Answer actions ───────────────────────────────────────────
    const goNext = useCallback(
      (snapshot: Record<string, AskUserAnswer>) => {
        if (safeIndex >= total - 1) {
          onComplete?.(snapshot);
        } else {
          setIndex(safeIndex + 1);
        }
      },
      [safeIndex, total, onComplete, setIndex]
    );

    const handleSingleSelect = useCallback(
      (optId: string) => {
        if (!question) return;
        const text = answers[qId]?.otherText;
        const snapshot = writeAnswers((prev) => ({
          ...prev,
          [qId]: {
            questionId: qId,
            selectedIds: [optId],
            otherText: text || undefined,
            skipped: false,
          },
        }));
        goNext(snapshot);
      },
      [question, qId, answers, writeAnswers, goNext]
    );

    const handleMultiToggle = useCallback(
      (optId: string) => {
        if (!question) return;
        writeAnswers((prev) => {
          const existing = prev[qId];
          const set = new Set(existing?.selectedIds ?? []);
          if (set.has(optId)) set.delete(optId);
          else set.add(optId);
          return {
            ...prev,
            [qId]: {
              questionId: qId,
              selectedIds: Array.from(set),
              otherText: existing?.otherText,
              skipped: false,
            },
          };
        });
      },
      [question, qId, writeAnswers]
    );

    const handleOtherChange = useCallback(
      (text: string) => {
        if (!question) return;
        writeAnswers((prev) => ({
          ...prev,
          [qId]: {
            questionId: qId,
            selectedIds: prev[qId]?.selectedIds ?? [],
            otherText: text,
            skipped: false,
          },
        }));
      },
      [question, qId, writeAnswers]
    );

    const handleOtherSubmit = useCallback(() => {
      if (!question) return;
      const text = (answers[qId]?.otherText ?? "").trim();
      if (!text) return;
      const snapshot = writeAnswers((prev) => ({
        ...prev,
        [qId]: {
          questionId: qId,
          selectedIds: prev[qId]?.selectedIds ?? [],
          otherText: text,
          skipped: false,
        },
      }));
      goNext(snapshot);
    }, [question, qId, answers, writeAnswers, goNext]);

    const handleSkip = useCallback(() => {
      if (!question) return;
      const snapshot = writeAnswers((prev) => ({
        ...prev,
        [qId]: {
          questionId: qId,
          selectedIds: prev[qId]?.selectedIds ?? [],
          otherText: prev[qId]?.otherText,
          skipped: true,
        },
      }));
      onSkip?.(qId, safeIndex);
      goNext(snapshot);
    }, [question, qId, writeAnswers, onSkip, safeIndex, goNext]);

    const handleMultiNext = useCallback(() => {
      goNext(answers);
    }, [goNext, answers]);

    // ── Keyboard shortcuts: 1-9 ──────────────────────────────────
    useEffect(() => {
      if (!question) return;
      const handler = (e: KeyboardEvent) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
        const code = e.key;
        if (code < "1" || code > "9") return;
        const idx = parseInt(code, 10) - 1;
        if (idx >= 0 && idx < options.length) {
          e.preventDefault();
          const oid = optionKey(options[idx], idx);
          if (isMulti) handleMultiToggle(oid);
          else handleSingleSelect(oid);
        } else if (idx === options.length && allowOther) {
          e.preventDefault();
          otherInputRef.current?.focus();
        }
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [
      question,
      options,
      isMulti,
      allowOther,
      handleSingleSelect,
      handleMultiToggle,
    ]);

    // ── Arrow key navigation between rows ────────────────────────
    const focusRow = (idx: number) => {
      const el = rowsContainerRef.current?.querySelector(
        `[data-proximity-index="${idx}"]`
      ) as HTMLElement | null;
      el?.focus();
    };

    const handleRowKey = (
      e: ReactKeyboardEvent<HTMLDivElement>,
      idx: number
    ) => {
      if (rowCount === 0) return;
      if (["ArrowDown", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        focusRow((idx + 1) % rowCount);
      } else if (["ArrowUp", "ArrowLeft"].includes(e.key)) {
        e.preventDefault();
        focusRow((idx - 1 + rowCount) % rowCount);
      } else if (e.key === "Home") {
        e.preventDefault();
        focusRow(0);
      } else if (e.key === "End") {
        e.preventDefault();
        focusRow(rowCount - 1);
      }
    };

    if (!question) {
      return (
        <div
          ref={ref}
          className={cn(
            "w-full max-w-[520px] p-5 bg-card border border-border",
            shape.container,
            className
          )}
          {...rest}
        >
          <p className="text-[13px] text-muted-foreground">No questions.</p>
        </div>
      );
    }

    // ── Layout calculations for hover/focus indicators ───────────
    const activeRect =
      activeIndex !== null ? itemRects[activeIndex] : null;
    const focusRect =
      focusedIndex !== null ? itemRects[focusedIndex] : null;

    // ── Selected-row grouping (merges contiguous selections) ─────
    // Mirrors the CheckboxGroup pattern: contiguous selected indices
    // collapse into a single rounded background block; stable IDs let
    // framer-motion morph block size/position when neighbours toggle.
    const selectedIndices = useMemo(() => {
      const set = new Set<number>();
      options.forEach((opt, i) => {
        if (selectedIds.includes(optionKey(opt, i))) set.add(i);
      });
      if (allowOther && otherText.length > 0) set.add(otherIndex);
      return set;
    }, [options, selectedIds, allowOther, otherText, otherIndex]);

    const selectedGroups = useMemo(() => {
      const runs: { start: number; end: number }[] = [];
      const sorted = [...selectedIndices].sort((a, b) => a - b);
      for (const idx of sorted) {
        const last = runs[runs.length - 1];
        if (last && idx === last.end + 1) last.end = idx;
        else runs.push({ start: idx, end: idx });
      }

      // Stable run IDs so a growing/shrinking run animates instead of
      // exit+re-enter when neighbours flip.
      const usedIds = new Set<number>();
      const nextGroupMap = new Map<number, number>();
      const groups = runs.map((run) => {
        let stableId: number | null = null;
        for (let i = run.start; i <= run.end; i++) {
          const prev = prevGroupMapRef.current.get(i);
          if (prev !== undefined && !usedIds.has(prev)) {
            stableId = prev;
            break;
          }
        }
        const id = stableId ?? ++groupIdCounterRef.current;
        usedIds.add(id);
        for (let i = run.start; i <= run.end; i++) nextGroupMap.set(i, id);
        return { ...run, id };
      });
      prevGroupMapRef.current = nextGroupMap;
      return groups;
    }, [selectedIndices]);

    // True when the user is hovering a row that ISN'T part of any selected
    // run — we dim the selected backgrounds slightly to draw attention to
    // the hover target.
    const isHoveringNonSelected =
      activeIndex !== null && !selectedIndices.has(activeIndex);

    const showFooter = (total > 1 && isSkippable) || isMulti;
    const showSkip = total > 1 && isSkippable;

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full max-w-[520px] bg-card border border-border",
          shape.container,
          className
        )}
        {...rest}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={qId}
            initial={
              hasMounted.current ? { opacity: 0, y: 6 } : { opacity: 1, y: 0 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.1 } }}
            transition={springs.moderate}
            className="flex flex-col gap-3.5 p-4 sm:p-5"
          >
            {/* Header */}
            <div className="flex items-center text-[12px] text-muted-foreground">
              <span>
                Question {safeIndex + 1} of {total}
              </span>
            </div>

            {/* Question title */}
            <h3
              id={`${reactId}-${qId}-title`}
              className="text-[16px] text-foreground leading-snug"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              {question.title}
            </h3>

            {/* Options + Other (proximity-tracked container) */}
            <div
              ref={rowsContainerRef}
              role={isMulti ? "group" : "radiogroup"}
              aria-labelledby={`${reactId}-${qId}-title`}
              onMouseEnter={handlers.onMouseEnter}
              onMouseMove={handlers.onMouseMove}
              onMouseLeave={handlers.onMouseLeave}
              className="relative flex flex-col gap-0.5 -mx-3"
            >
              {/* Selected-row backgrounds (merged for contiguous selections) */}
              <AnimatePresence>
                {selectedGroups.map((group) => {
                  const startRect = itemRects[group.start];
                  const endRect = itemRects[group.end];
                  if (!startRect || !endRect) return null;
                  const mergedTop = startRect.top;
                  const mergedHeight =
                    endRect.top + endRect.height - startRect.top;
                  const mergedLeft = Math.min(startRect.left, endRect.left);
                  const mergedWidth = Math.max(startRect.width, endRect.width);
                  return (
                    <motion.div
                      key={`selected-${group.id}`}
                      aria-hidden
                      className={cn(
                        "absolute pointer-events-none bg-accent",
                        shape.mergedBg
                      )}
                      initial={false}
                      animate={{
                        top: mergedTop,
                        left: mergedLeft,
                        width: mergedWidth,
                        height: mergedHeight,
                        opacity: isHoveringNonSelected ? 0.8 : 1,
                      }}
                      exit={{ opacity: 0, transition: { duration: 0.12 } }}
                      transition={{
                        ...springs.moderate,
                        opacity: { duration: 0.08 },
                      }}
                    />
                  );
                })}
              </AnimatePresence>

              {/* Single morphing hover indicator */}
              <AnimatePresence>
                {activeRect && (
                  <motion.div
                    key={`hover-${sessionRef.current}`}
                    aria-hidden
                    className={cn(
                      "absolute pointer-events-none bg-hover",
                      shape.bg
                    )}
                    initial={{
                      opacity: 0,
                      top: activeRect.top,
                      left: activeRect.left,
                      width: activeRect.width,
                      height: activeRect.height,
                    }}
                    animate={{
                      opacity: 1,
                      top: activeRect.top,
                      left: activeRect.left,
                      width: activeRect.width,
                      height: activeRect.height,
                    }}
                    exit={{ opacity: 0, transition: { duration: 0.06 } }}
                    transition={{
                      ...springs.fast,
                      opacity: { duration: 0.08 },
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Single morphing focus ring */}
              <AnimatePresence>
                {focusRect && (
                  <motion.div
                    aria-hidden
                    className={cn(
                      "absolute pointer-events-none border border-[#6B97FF] z-20",
                      shape.focusRing
                    )}
                    initial={{
                      opacity: 0,
                      top: focusRect.top - 2,
                      left: focusRect.left - 2,
                      width: focusRect.width + 4,
                      height: focusRect.height + 4,
                    }}
                    animate={{
                      opacity: 1,
                      top: focusRect.top - 2,
                      left: focusRect.left - 2,
                      width: focusRect.width + 4,
                      height: focusRect.height + 4,
                    }}
                    exit={{ opacity: 0, transition: { duration: 0.06 } }}
                    transition={{
                      ...springs.fast,
                      opacity: { duration: 0.08 },
                    }}
                  />
                )}
              </AnimatePresence>

              {options.map((opt, i) => {
                const oid = optionKey(opt, i);
                const isSelected = selectedIds.includes(oid);
                const isHover = activeIndex === i;
                const isFocus = focusedIndex === i;
                const showArrow = !isMulti && (isFocus || isHover);
                return (
                  <Row
                    key={oid}
                    index={i}
                    registerItem={registerItem}
                    role={isMulti ? "checkbox" : "radio"}
                    isSelected={isSelected}
                    tabIndex={
                      isMulti
                        ? 0
                        : selectedIds[0] === oid ||
                          (!selectedIds.length && i === 0)
                        ? 0
                        : -1
                    }
                    onFocusVisible={() => setFocusedIndex(i)}
                    onBlurAny={() =>
                      setFocusedIndex((prev) => (prev === i ? null : prev))
                    }
                    onClick={() =>
                      isMulti ? handleMultiToggle(oid) : handleSingleSelect(oid)
                    }
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        if (isMulti) handleMultiToggle(oid);
                        else handleSingleSelect(oid);
                        return;
                      }
                      handleRowKey(e, i);
                    }}
                    shape={shape}
                    aria-checked={isSelected}
                    chipContent={i + 1}
                    chipFilled={isSelected}
                    isMulti={isMulti}
                    showArrow={showArrow}
                    arrowIcon={
                      <ArrowRight
                        size={14}
                        strokeWidth={2}
                        className="h-3.5 w-3.5"
                      />
                    }
                  >
                    <span>
                      <span
                        className="text-foreground transition-colors duration-80"
                        style={{
                          fontVariationSettings: isSelected
                            ? fontWeights.semibold
                            : fontWeights.medium,
                        }}
                      >
                        {opt.title}
                      </span>
                      {opt.description && (
                        <>
                          {" "}
                          <span className="text-muted-foreground">
                            {opt.description}
                          </span>
                        </>
                      )}
                    </span>
                  </Row>
                );
              })}

              {allowOther && (
                <Row
                  index={otherIndex}
                  registerItem={registerItem}
                  role={null}
                  isSelected={otherText.length > 0}
                  tabIndex={-1}
                  onFocusVisible={() => setFocusedIndex(otherIndex)}
                  onBlurAny={() =>
                    setFocusedIndex((prev) =>
                      prev === otherIndex ? null : prev
                    )
                  }
                  onClick={() => otherInputRef.current?.focus()}
                  shape={shape}
                  chipContent={otherIndex + 1}
                  chipFilled={otherText.length > 0}
                  isMulti={isMulti}
                  ariaLabel={
                    question.otherPlaceholder ?? "Describe in your own words"
                  }
                  showArrow={
                    !isMulti &&
                    (focusedIndex === otherIndex ||
                      activeIndex === otherIndex) &&
                    otherText.trim().length > 0
                  }
                  arrowIcon={
                    <ArrowRight
                      size={14}
                      strokeWidth={2}
                      className="h-3.5 w-3.5"
                    />
                  }
                  onArrowClick={
                    !isMulti && otherText.trim().length > 0
                      ? handleOtherSubmit
                      : undefined
                  }
                >
                  <span className="inline-grid w-full">
                    <input
                      ref={otherInputRef}
                      type="text"
                      value={otherText}
                      placeholder={
                        question.otherPlaceholder ??
                        "Describe in your own words…"
                      }
                      aria-label={
                        question.otherPlaceholder ?? "Describe in your own words"
                      }
                      onChange={(e) => handleOtherChange(e.target.value)}
                      onFocus={() => setFocusedIndex(otherIndex)}
                      onBlur={() =>
                        setFocusedIndex((prev) =>
                          prev === otherIndex ? null : prev
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isMulti) {
                          e.preventDefault();
                          handleOtherSubmit();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "col-start-1 row-start-1 bg-transparent outline-none text-[13px] text-foreground placeholder:text-muted-foreground w-full"
                      )}
                      style={{ fontVariationSettings: fontWeights.medium }}
                    />
                  </span>
                </Row>
              )}
            </div>

            {/* Footer */}
            {showFooter && (
              <div className="flex items-center justify-end gap-2 pt-1">
                {showSkip && (
                  <Button variant="ghost" size="sm" onClick={handleSkip}>
                    {skipLabel}
                  </Button>
                )}
                {isMulti && (
                  <Button
                    variant="primary"
                    size="sm"
                    trailingIcon={ArrowRight}
                    onClick={handleMultiNext}
                    disabled={
                      selectedIds.length === 0 &&
                      otherText.trim().length === 0
                    }
                  >
                    {question.nextLabel ??
                      (safeIndex >= total - 1 ? "Finish" : "Continue")}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }
);

AskUserQuestions.displayName = "AskUserQuestions";

// ── Row sub-component ─────────────────────────────────────────

interface RowProps {
  index: number;
  registerItem: (index: number, element: HTMLElement | null) => void;
  role: "radio" | "checkbox" | null;
  isSelected: boolean;
  tabIndex: number;
  onFocusVisible: () => void;
  onBlurAny: () => void;
  onClick: () => void;
  onKeyDown?: (e: ReactKeyboardEvent<HTMLDivElement>) => void;
  shape: ReturnType<typeof useShape>;
  chipContent: React.ReactNode;
  chipFilled: boolean;
  isMulti: boolean;
  ariaLabel?: string;
  "aria-checked"?: boolean;
  showArrow?: boolean;
  arrowIcon?: React.ReactNode;
  onArrowClick?: () => void;
  children: React.ReactNode;
}

function Row({
  index,
  registerItem,
  role,
  isSelected,
  tabIndex,
  onFocusVisible,
  onBlurAny,
  onClick,
  onKeyDown,
  shape,
  chipContent,
  chipFilled,
  isMulti,
  ariaLabel,
  showArrow,
  arrowIcon,
  onArrowClick,
  children,
  ...aria
}: RowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerItem(index, rowRef.current);
    return () => registerItem(index, null);
  }, [index, registerItem]);

  return (
    <div
      ref={rowRef}
      data-proximity-index={index}
      data-state={isSelected ? "checked" : "unchecked"}
      role={role ?? undefined}
      aria-checked={role === "radio" || role === "checkbox" ? !!aria["aria-checked"] : undefined}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches(":focus-visible")) {
          onFocusVisible();
        }
      }}
      onBlur={onBlurAny}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        "relative z-10 flex items-center gap-3 px-3 min-h-10 py-1.5 cursor-pointer select-none outline-none",
        shape.item
      )}
    >
      {/* Selected background is drawn at the container level so contiguous
          selections can merge into a single block (see AskUserQuestions's
          selectedGroups / merged-bg block). Row keeps z-10 to sit above it. */}

      {/* Body — left, fills row */}
      <span className="min-w-0 flex-1 text-[13px] leading-snug inline-flex items-center gap-0">
        {children}
      </span>

      {/* End slot — chip with optional arrow overlay */}
      <span className="shrink-0 w-7 h-7 relative inline-flex items-center justify-center">
        {/* Chip — number or icon */}
        <span
          aria-hidden
          className={cn(
            "absolute inline-flex items-center justify-center w-5 h-5 text-[11px] transition-opacity duration-80",
            isMulti && shape.bg,
            isMulti
              ? chipFilled
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground"
              : chipFilled
              ? "text-foreground"
              : "text-muted-foreground",
            showArrow && "opacity-0"
          )}
          style={{
            fontVariationSettings: chipFilled
              ? fontWeights.semibold
              : fontWeights.medium,
          }}
        >
          {chipContent}
        </span>

        {/* Arrow overlay — covers chip on hover/focus in single-select */}
        <AnimatePresence>
          {showArrow && (
            <motion.span
              aria-hidden={!onArrowClick}
              role={onArrowClick ? "button" : undefined}
              onClick={
                onArrowClick
                  ? (e) => {
                      e.stopPropagation();
                      onArrowClick();
                    }
                  : undefined
              }
              className={cn(
                "absolute inset-0 inline-flex items-center justify-center bg-foreground text-background",
                shape.bg,
                onArrowClick && "cursor-pointer"
              )}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: 0.6,
                transition: { duration: 0.06 },
              }}
              transition={{
                ...springs.fast,
                opacity: { duration: 0.08 },
              }}
            >
              {arrowIcon}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </div>
  );
}

export { AskUserQuestions };
export default AskUserQuestions;
