"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
  useId,
  forwardRef,
  Children,
  type ReactNode,
  type ReactElement,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type Ref,
  type RefObject,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { useSize, SizeProvider, type SizeVariant } from "@/lib/size-context";
import { useProximityHover, type ItemRect } from "@/hooks/use-proximity-hover";
import type { IconComponent } from "@/lib/icon-context";
import { resolveSlotTemplate, slotElement } from "@/components/ui/sidebar-core";

// SSR-safe layout effect (client components still server-render in Next).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// ─── Menu scope ──────────────────────────────────────────────────────────────
//
// Each menu level (SidebarMenu, and every SidebarMenuSub) runs its own scope:
// one proximity-hover system plus the three traveling overlays — hover
// background, active background, focus ring — that glide between its rows.
// Sub-menus need their own scope because their rows live inside a positioned
// parent row, so they can't share the parent's offset coordinate space.

interface MenuScopeValue {
  isRoot: boolean;
  registerRow: (el: HTMLElement) => () => void;
  setRowButton: (row: HTMLElement, button: HTMLElement | null) => void;
  setRowActive: (row: HTMLElement, active: boolean) => void;
  hoveredRowEl: HTMLElement | null;
  activeRowEl: HTMLElement | null;
  firstRowEl: HTMLElement | null;
  hasActive: boolean;
}

const MenuScopeContext = createContext<MenuScopeValue | null>(null);

interface MenuItemContextValue {
  rowRef: RefObject<HTMLLIElement | null>;
  isHovered: boolean;
  isActiveRow: boolean;
  setActive: (active: boolean) => void;
  setButtonEl: (el: HTMLElement | null) => void;
}

const MenuItemContext = createContext<MenuItemContextValue | null>(null);

function byDomOrder(a: HTMLElement, b: HTMLElement) {
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

function sameElements(a: HTMLElement[], b: HTMLElement[]) {
  return a.length === b.length && a.every((el, i) => el === b[i]);
}

interface MenuScope {
  value: MenuScopeValue;
  containerProps: {
    onMouseEnter: () => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
    onFocus: (e: React.FocusEvent) => void;
    onBlur: (e: React.FocusEvent) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
  };
  overlays: ReactNode;
}

function useMenuScope(
  containerRef: RefObject<HTMLElement | null>,
  isRoot: boolean
): MenuScope {
  const {
    activeIndex,
    setActiveIndex,
    itemRects,
    isMeasured,
    sessionRef,
    handlers,
    registerItem,
  } = useProximityHover(containerRef);

  const rowsRef = useRef<Set<HTMLElement>>(new Set());
  const rowButtonsRef = useRef<Map<HTMLElement, HTMLElement>>(new Map());
  const activeMapRef = useRef<Map<HTMLElement, boolean>>(new Map());
  const [orderedRows, setOrderedRows] = useState<HTMLElement[]>([]);
  const orderedRowsRef = useRef(orderedRows);
  orderedRowsRef.current = orderedRows;
  const registeredCountRef = useRef(0);
  const [activeRowEl, setActiveRowEl] = useState<HTMLElement | null>(null);
  const [focusedRowEl, setFocusedRowEl] = useState<HTMLElement | null>(null);

  const recomputeActive = useCallback(() => {
    let first: HTMLElement | null = null;
    for (const el of orderedRowsRef.current) {
      if (activeMapRef.current.get(el)) {
        first = el;
        break;
      }
    }
    setActiveRowEl((prev) => (prev === first ? prev : first));
  }, []);

  // Rows register by element; indexes are derived from DOM order so consumers
  // never pass an index prop and conditional rows just work.
  const syncRows = useCallback(() => {
    const sorted = [...rowsRef.current].sort(byDomOrder);
    setOrderedRows((prev) => (sameElements(prev, sorted) ? prev : sorted));
    sorted.forEach((el, i) => registerItem(i, el));
    for (let i = sorted.length; i < registeredCountRef.current; i++) {
      registerItem(i, null);
    }
    registeredCountRef.current = sorted.length;
    recomputeActive();
  }, [registerItem, recomputeActive]);

  const registerRow = useCallback(
    (el: HTMLElement) => {
      rowsRef.current.add(el);
      syncRows();
      return () => {
        rowsRef.current.delete(el);
        rowButtonsRef.current.delete(el);
        activeMapRef.current.delete(el);
        syncRows();
      };
    },
    [syncRows]
  );

  const setRowButton = useCallback((row: HTMLElement, button: HTMLElement | null) => {
    if (button) rowButtonsRef.current.set(row, button);
    else rowButtonsRef.current.delete(row);
  }, []);

  const setRowActive = useCallback(
    (row: HTMLElement, active: boolean) => {
      activeMapRef.current.set(row, active);
      recomputeActive();
    },
    [recomputeActive]
  );

  // A row's rect spans the whole <li> — which grows when it hosts an expanded
  // sub-menu — so overlay heights are clamped to the row's button box.
  const overlayRect = useCallback(
    (row: HTMLElement | null): ItemRect | null => {
      if (!row) return null;
      const idx = orderedRowsRef.current.indexOf(row);
      const rect = idx === -1 ? null : itemRects[idx];
      if (!rect) return null;
      const button = rowButtonsRef.current.get(row);
      const height = button ? Math.min(rect.height, button.offsetHeight) : rect.height;
      return { ...rect, height };
    },
    [itemRects]
  );

  // Events that originate inside a nested sub-menu belong to that sub-menu's
  // own scope; this scope steps aside so the two sets of overlays never fight.
  const isForeign = useCallback(
    (target: HTMLElement) => {
      const sub = target.closest('[data-sidebar="menu-sub"]');
      return !!sub && sub !== containerRef.current;
    },
    [containerRef]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isForeign(e.target as HTMLElement)) {
        setActiveIndex(null);
        return;
      }
      handlers.onMouseMove(e);
    },
    [isForeign, setActiveIndex, handlers]
  );

  const onFocus = useCallback(
    (e: React.FocusEvent) => {
      const target = e.target as HTMLElement;
      if (isForeign(target)) {
        setFocusedRowEl(null);
        setActiveIndex(null);
        return;
      }
      // Only the row's main button drives the traveling highlight and ring —
      // actions keep their own static focus rings.
      if (!target.closest('[data-sidebar="menu-button"],[data-sidebar="menu-sub-button"]')) return;
      const row = target.closest(
        '[data-sidebar="menu-item"],[data-sidebar="menu-sub-item"]'
      ) as HTMLElement | null;
      if (!row) return;
      const idx = orderedRowsRef.current.indexOf(row);
      if (idx === -1) return;
      setActiveIndex(idx);
      setFocusedRowEl(target.matches(":focus-visible") ? row : null);
    },
    [isForeign, setActiveIndex]
  );

  const onBlur = useCallback(
    (e: React.FocusEvent) => {
      if (containerRef.current?.contains(e.relatedTarget as Node)) return;
      setFocusedRowEl(null);
      setActiveIndex(null);
    },
    [containerRef, setActiveIndex]
  );

  // Arrow/Home/End over every button in DOM order, sub rows included — only
  // the root scope binds it so nested scopes don't double-handle.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key))
        return;
      const container = containerRef.current;
      if (!container) return;
      const items = Array.from(
        container.querySelectorAll<HTMLElement>(
          '[data-sidebar="menu-button"], [data-sidebar="menu-sub-button"]'
        )
      ).filter((el) => !el.closest('[data-sidebar="menu-sub"][data-state="closed"]'));
      const currentIdx = items.indexOf(e.target as HTMLElement);
      if (currentIdx === -1) return;
      e.preventDefault();
      if (e.key === "Home") items[0]?.focus();
      else if (e.key === "End") items[items.length - 1]?.focus();
      else {
        const next = ["ArrowDown", "ArrowRight"].includes(e.key)
          ? (currentIdx + 1) % items.length
          : (currentIdx - 1 + items.length) % items.length;
        items[next]?.focus();
      }
    },
    [containerRef]
  );

  const hoveredRowEl = activeIndex !== null ? orderedRows[activeIndex] ?? null : null;

  const value = useMemo<MenuScopeValue>(
    () => ({
      isRoot,
      registerRow,
      setRowButton,
      setRowActive,
      hoveredRowEl,
      activeRowEl,
      firstRowEl: orderedRows[0] ?? null,
      hasActive: activeRowEl !== null,
    }),
    [isRoot, registerRow, setRowButton, setRowActive, hoveredRowEl, activeRowEl, orderedRows]
  );

  const shape = useShape();
  const activeRect = overlayRect(activeRowEl);
  const hoverRect = overlayRect(hoveredRowEl);
  const focusRect = overlayRect(focusedRowEl);

  const overlays = isMeasured ? (
    <>
      {/* Active row background */}
      <AnimatePresence>
        {activeRect && (
          <motion.div
            className={`absolute ${shape.bg} bg-active pointer-events-none`}
            initial={false}
            animate={{
              top: activeRect.top,
              left: activeRect.left,
              width: activeRect.width,
              height: activeRect.height,
              opacity: 1,
            }}
            exit={{ opacity: 0, transition: spring.moderate.exit }}
            transition={{ ...spring.moderate, opacity: { duration: 0.08 } }}
          />
        )}
      </AnimatePresence>

      {/* Hover background */}
      <AnimatePresence>
        {hoverRect && (
          <motion.div
            key={sessionRef.current}
            className={`absolute ${shape.bg} bg-hover pointer-events-none`}
            initial={{
              opacity: 0,
              top: activeRect?.top ?? hoverRect.top,
              left: activeRect?.left ?? hoverRect.left,
              width: activeRect?.width ?? hoverRect.width,
              height: activeRect?.height ?? hoverRect.height,
            }}
            animate={{
              opacity: 1,
              top: hoverRect.top,
              left: hoverRect.left,
              width: hoverRect.width,
              height: hoverRect.height,
            }}
            exit={{ opacity: 0, transition: spring.fast.exit }}
            transition={{ ...spring.fast, opacity: { duration: 0.08 } }}
          />
        )}
      </AnimatePresence>

      {/* Focus ring */}
      <AnimatePresence>
        {focusRect && (
          <motion.div
            className={`absolute ${shape.focusRing} pointer-events-none z-20 border border-[color:var(--focus-ring,#6B97FF)]`}
            initial={false}
            animate={{
              left: focusRect.left - 2,
              top: focusRect.top - 2,
              width: focusRect.width + 4,
              height: focusRect.height + 4,
            }}
            exit={{ opacity: 0, transition: spring.fast.exit }}
            transition={{ ...spring.fast, opacity: { duration: 0.08 } }}
          />
        )}
      </AnimatePresence>
    </>
  ) : null;

  return {
    value,
    containerProps: {
      onMouseEnter: handlers.onMouseEnter,
      onMouseMove,
      onMouseLeave: handlers.onMouseLeave,
      onFocus,
      onBlur,
      onKeyDown: isRoot ? onKeyDown : undefined,
    },
    overlays,
  };
}

// ─── SidebarMenu ─────────────────────────────────────────────────────────────

export interface SidebarMenuProps extends HTMLAttributes<HTMLUListElement> {
  /** Pins the menu's rows to one step of the size ladder. Omitted, they
   *  follow the surrounding SizeProvider. */
  size?: SizeVariant;
}

const SidebarMenu = forwardRef<HTMLUListElement, SidebarMenuProps>(
  ({ className, size, children, ...props }, ref) => {
    const containerRef = useRef<HTMLUListElement>(null);
    const { value, containerProps, overlays } = useMenuScope(containerRef, true);

    const content = (
      <MenuScopeContext.Provider value={value}>
        <ul
          ref={(node) => {
            containerRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLUListElement | null>).current = node;
          }}
          data-sidebar="menu"
          className={cn("relative flex w-full min-w-0 flex-col gap-0.5 select-none", className)}
          {...containerProps}
          {...props}
        >
          {overlays}
          {children}
        </ul>
      </MenuScopeContext.Provider>
    );

    return size ? <SizeProvider size={size}>{content}</SizeProvider> : content;
  }
);
SidebarMenu.displayName = "SidebarMenu";

// ─── SidebarMenuItem / SidebarMenuSubItem ────────────────────────────────────

export type SidebarMenuItemProps = LiHTMLAttributes<HTMLLIElement>;

function useMenuRow(rowRef: RefObject<HTMLLIElement | null>) {
  const scope = useContext(MenuScopeContext);
  const registerRow = scope?.registerRow;
  const setRowButton = scope?.setRowButton;
  const setRowActive = scope?.setRowActive;

  useIsoLayoutEffect(() => {
    const el = rowRef.current;
    if (!el || !registerRow) return;
    return registerRow(el);
  }, [registerRow, rowRef]);

  const setActive = useCallback(
    (active: boolean) => {
      if (rowRef.current && setRowActive) setRowActive(rowRef.current, active);
    },
    [setRowActive, rowRef]
  );

  const setButtonEl = useCallback(
    (el: HTMLElement | null) => {
      if (rowRef.current && setRowButton) setRowButton(rowRef.current, el);
    },
    [setRowButton, rowRef]
  );

  const isHovered = rowRef.current !== null && scope?.hoveredRowEl === rowRef.current;
  const isActiveRow = rowRef.current !== null && scope?.activeRowEl === rowRef.current;

  return useMemo(
    () => ({ rowRef, isHovered, isActiveRow, setActive, setButtonEl }),
    [rowRef, isHovered, isActiveRow, setActive, setButtonEl]
  );
}

const SidebarMenuItem = forwardRef<HTMLLIElement, SidebarMenuItemProps>(
  ({ className, children, ...props }, ref) => {
    const rowRef = useRef<HTMLLIElement>(null);
    const item = useMenuRow(rowRef);
    return (
      <MenuItemContext.Provider value={item}>
        <li
          ref={(node) => {
            rowRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLLIElement | null>).current = node;
          }}
          data-sidebar="menu-item"
          className={cn("group/menu-item relative", className)}
          {...props}
        >
          {children}
        </li>
      </MenuItemContext.Provider>
    );
  }
);
SidebarMenuItem.displayName = "SidebarMenuItem";

export type SidebarMenuSubItemProps = LiHTMLAttributes<HTMLLIElement>;

const SidebarMenuSubItem = forwardRef<HTMLLIElement, SidebarMenuSubItemProps>(
  ({ className, children, ...props }, ref) => {
    const rowRef = useRef<HTMLLIElement>(null);
    const item = useMenuRow(rowRef);
    return (
      <MenuItemContext.Provider value={item}>
        <li
          ref={(node) => {
            rowRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLLIElement | null>).current = node;
          }}
          data-sidebar="menu-sub-item"
          className={cn("group/menu-sub-item relative", className)}
          {...props}
        >
          {children}
        </li>
      </MenuItemContext.Provider>
    );
  }
);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

// ─── Row label (ghost-span weight animation) ─────────────────────────────────

/** Splits leading string children out as the label so it can get the
 *  ghost-span weight treatment; remaining element children (dots, trailing
 *  icons) render as flex siblings after it — outside the text-box-trimmed
 *  span, which would clip an inline SVG, and where `ml-auto` can push a
 *  trailing control to the row's end. */
function MenuRowLabel({
  content,
  lit,
  emphasized,
  textClass,
}: {
  content: ReactNode;
  lit: boolean;
  emphasized: boolean;
  textClass: string;
}) {
  const nodes = Children.toArray(content);
  const textParts: string[] = [];
  let i = 0;
  while (i < nodes.length && (typeof nodes[i] === "string" || typeof nodes[i] === "number")) {
    textParts.push(String(nodes[i]));
    i++;
  }
  const label = textParts.join("");
  const rest = nodes.slice(i);

  if (!label) {
    return (
      <span
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 transition-colors duration-80",
          lit ? "text-foreground" : "text-muted-foreground",
          textClass
        )}
      >
        {content}
      </span>
    );
  }

  return (
    <>
      <span className={cn("inline-grid min-w-0 text-left", textClass)}>
        {/* Ghost: reserves width at the heaviest weight, hidden from AT */}
        <span
          className="col-start-1 row-start-1 invisible [text-box:trim-both_cap_alphabetic]"
          style={{ fontVariationSettings: fontWeights.semibold }}
          aria-hidden="true"
        >
          {label}
        </span>
        {/* Visible: animates between weights in the same cell */}
        <span
          className={cn(
            "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80 [text-box:trim-both_cap_alphabetic]",
            lit ? "text-foreground" : "text-muted-foreground"
          )}
          style={{
            fontVariationSettings: emphasized ? fontWeights.semibold : fontWeights.normal,
          }}
        >
          {label}
        </span>
      </span>
      {rest}
    </>
  );
}

// ─── SidebarMenuButton ───────────────────────────────────────────────────────

export const sidebarMenuButtonVariants = cva(
  "peer/menu-button relative z-10 flex w-full cursor-pointer select-none items-center gap-2 px-2 text-left outline-none group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 group-has-[[data-sidebar=menu-badge]]/menu-item:pr-8",
  {
    variants: {
      variant: {
        default: "",
        outline: "border border-border bg-background",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface SidebarMenuButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  isActive?: boolean;
  size?: "default" | "sm" | "lg";
  icon?: IconComponent;
  render?: ReactElement;
  asChild?: boolean;
}

const SidebarMenuButton = forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  (
    {
      isActive = false,
      size = "default",
      variant,
      icon: Icon,
      render,
      asChild,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const scope = useContext(MenuScopeContext);
    const item = useContext(MenuItemContext);
    const shape = useShape();
    const sizeClasses = useSize();
    const buttonRef = useRef<HTMLElement | null>(null);

    const setActive = item?.setActive;
    useIsoLayoutEffect(() => {
      setActive?.(isActive);
      return () => setActive?.(false);
    }, [isActive, setActive]);

    const setButtonEl = item?.setButtonEl;
    useIsoLayoutEffect(() => {
      setButtonEl?.(buttonRef.current);
      return () => setButtonEl?.(null);
    }, [setButtonEl]);

    const lit = isActive || (item?.isHovered ?? false);
    const heightClass =
      size === "sm"
        ? "h-7"
        : size === "lg"
          ? "h-12"
          : sizeClasses.variant === "compact"
            ? "h-7"
            : "h-8";
    const textClass = size === "sm" ? "text-[12px]" : sizeClasses.text;

    // Roving tabindex: the active row's button is the menu's tab stop; with no
    // active row, the root scope's first row keeps the menu keyboard-reachable.
    const row = item?.rowRef.current ?? null;
    const tabIdx = isActive
      ? 0
      : scope?.hasActive
        ? -1
        : scope?.isRoot && row !== null && row === scope.firstRowEl
          ? 0
          : -1;

    const { template, content } = resolveSlotTemplate(render, asChild, children);

    const inner = (
      <>
        {Icon && (
          <Icon
            size={sizeClasses.icon}
            strokeWidth={lit ? 2 : 1.5}
            className={cn(
              "shrink-0 transition-[color,stroke-width] duration-80",
              lit ? "text-foreground" : "text-muted-foreground"
            )}
          />
        )}
        <MenuRowLabel content={content} lit={lit} emphasized={isActive} textClass={textClass} />
      </>
    );

    return slotElement(
      template,
      "button",
      {
        ref: (node: HTMLElement | null) => {
          buttonRef.current = node;
          if (typeof ref === "function") ref(node as HTMLButtonElement | null);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        },
        type: template ? undefined : "button",
        "data-sidebar": "menu-button",
        "data-size": size,
        "data-active": isActive ? "true" : undefined,
        "aria-current": isActive ? "page" : undefined,
        tabIndex: tabIdx,
        className: cn(
          sidebarMenuButtonVariants({ variant }),
          heightClass,
          shape.item,
          className
        ),
        ...props,
      },
      inner
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";

// ─── SidebarMenuAction ───────────────────────────────────────────────────────

export interface SidebarMenuActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  showOnHover?: boolean;
  render?: ReactElement;
  asChild?: boolean;
}

const SidebarMenuAction = forwardRef<HTMLButtonElement, SidebarMenuActionProps>(
  ({ className, showOnHover = false, render, asChild, children, onClick, ...props }, ref) => {
    const shape = useShape();
    const sizeClasses = useSize();
    const { template, content } = resolveSlotTemplate(render, asChild, children);
    return slotElement(
      template,
      "button",
      {
        ref: ref as Ref<HTMLElement>,
        type: template ? undefined : "button",
        "data-sidebar": "menu-action",
        className: cn(
          "absolute right-1 z-10 flex size-6 items-center justify-center text-muted-foreground outline-none",
          sizeClasses.variant === "compact" ? "top-0.5" : "top-1",
          "hover:bg-hover hover:text-foreground transition-[color,background-color,opacity] duration-80",
          "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          "[&_svg]:size-3.5 [&_svg]:shrink-0",
          shape.item,
          showOnHover &&
            "opacity-0 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100 data-[state=open]:opacity-100 aria-expanded:opacity-100",
          className
        ),
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
          // The action often sits on a row composed via `render` — keep its
          // click from also triggering the row.
          event.stopPropagation();
          onClick?.(event);
        },
        ...props,
      },
      content
    );
  }
);
SidebarMenuAction.displayName = "SidebarMenuAction";

// ─── SidebarMenuBadge ────────────────────────────────────────────────────────

export type SidebarMenuBadgeProps = HTMLAttributes<HTMLDivElement>;

const SidebarMenuBadge = forwardRef<HTMLDivElement, SidebarMenuBadgeProps>(
  ({ className, ...props }, ref) => {
    const item = useContext(MenuItemContext);
    const sizeClasses = useSize();
    const lit = item?.isActiveRow ?? false;
    return (
      <div
        ref={ref}
        data-sidebar="menu-badge"
        className={cn(
          "pointer-events-none absolute right-2 z-10 flex h-5 min-w-5 items-center justify-center px-1 tabular-nums",
          sizeClasses.variant === "compact" ? "top-1 text-[10px]" : "top-1.5 text-[11px]",
          "transition-[color,font-variation-settings] duration-80",
          lit ? "text-foreground" : "text-muted-foreground",
          className
        )}
        style={{
          fontVariationSettings: lit ? fontWeights.semibold : fontWeights.normal,
        }}
        {...props}
      />
    );
  }
);
SidebarMenuBadge.displayName = "SidebarMenuBadge";

// ─── SidebarMenuSkeleton ─────────────────────────────────────────────────────

export interface SidebarMenuSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  showIcon?: boolean;
}

// Deterministic width cycle (not Math.random) so server and client render the
// same markup — a random width per render is a hydration mismatch.
const SKELETON_WIDTHS = ["62%", "74%", "55%", "82%", "68%"];

const SidebarMenuSkeleton = forwardRef<HTMLDivElement, SidebarMenuSkeletonProps>(
  ({ className, showIcon = false, ...props }, ref) => {
    const sizeClasses = useSize();
    const id = useId();
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    const width = SKELETON_WIDTHS[sum % SKELETON_WIDTHS.length];
    return (
      <div
        ref={ref}
        data-sidebar="menu-skeleton"
        className={cn(
          "flex items-center gap-2 px-2",
          sizeClasses.variant === "compact" ? "h-7" : "h-8",
          className
        )}
        {...props}
      >
        {showIcon && (
          <div
            data-sidebar="menu-skeleton-icon"
            className="size-4 shrink-0 animate-pulse rounded-md bg-hover"
          />
        )}
        <div
          data-sidebar="menu-skeleton-text"
          className="h-4 flex-1 animate-pulse rounded-md bg-hover"
          style={{ maxWidth: width }}
        />
      </div>
    );
  }
);
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

// ─── SidebarMenuSub ──────────────────────────────────────────────────────────

export interface SidebarMenuSubProps extends HTMLAttributes<HTMLUListElement> {
  /** Built-in measured-height collapse. Omitted, the sub-menu is always
   *  visible; wire it to state (with a toggling SidebarMenuButton) for a
   *  collapsible tree. */
  open?: boolean;
}

const SidebarMenuSub = forwardRef<HTMLUListElement, SidebarMenuSubProps>(
  ({ className, open = true, children, ...props }, ref) => {
    const containerRef = useRef<HTMLUListElement>(null);
    const { value, containerProps, overlays } = useMenuScope(containerRef, false);

    // Measured-height collapse: animate between 0 and the content's real
    // offsetHeight — never to "auto", which framer measures wrong under a
    // scaled ancestor.
    const [contentHeight, setContentHeight] = useState<number | null>(null);
    useIsoLayoutEffect(() => {
      const el = containerRef.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const measure = () => setContentHeight(el.offsetHeight);
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);
    const measured = contentHeight !== null;

    return (
      <motion.div
        data-slot="sidebar-menu-sub-wrapper"
        className="overflow-hidden"
        initial={false}
        style={measured ? undefined : { height: open ? "auto" : 0 }}
        animate={measured ? { height: open ? contentHeight : 0, opacity: open ? 1 : 0 } : undefined}
        transition={open ? spring.moderate : spring.moderate.exit}
      >
        <MenuScopeContext.Provider value={value}>
          <ul
            ref={(node) => {
              containerRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLUListElement | null>).current = node;
            }}
            data-sidebar="menu-sub"
            data-state={open ? "open" : "closed"}
            aria-hidden={open ? undefined : true}
            className={cn(
              "relative mx-3.5 flex min-w-0 translate-x-px flex-col gap-0.5 border-l border-border px-2.5 py-0.5 select-none",
              className
            )}
            {...containerProps}
            {...props}
          >
            {overlays}
            {children}
          </ul>
        </MenuScopeContext.Provider>
      </motion.div>
    );
  }
);
SidebarMenuSub.displayName = "SidebarMenuSub";

// ─── SidebarMenuSubButton ────────────────────────────────────────────────────

export interface SidebarMenuSubButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  isActive?: boolean;
  size?: "sm" | "md";
  icon?: IconComponent;
  render?: ReactElement;
  asChild?: boolean;
}

const SidebarMenuSubButton = forwardRef<HTMLAnchorElement, SidebarMenuSubButtonProps>(
  ({ isActive = false, size = "md", icon: Icon, render, asChild, className, children, ...props }, ref) => {
    const item = useContext(MenuItemContext);
    const shape = useShape();
    const sizeClasses = useSize();
    const buttonRef = useRef<HTMLElement | null>(null);

    const setActive = item?.setActive;
    useIsoLayoutEffect(() => {
      setActive?.(isActive);
      return () => setActive?.(false);
    }, [isActive, setActive]);

    const setButtonEl = item?.setButtonEl;
    useIsoLayoutEffect(() => {
      setButtonEl?.(buttonRef.current);
      return () => setButtonEl?.(null);
    }, [setButtonEl]);

    const lit = isActive || (item?.isHovered ?? false);
    const tabIdx = isActive ? 0 : -1;

    const { template, content } = resolveSlotTemplate(render, asChild, children);

    return slotElement(
      template,
      "a",
      {
        ref: (node: HTMLElement | null) => {
          buttonRef.current = node;
          if (typeof ref === "function") ref(node as HTMLAnchorElement | null);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        },
        "data-sidebar": "menu-sub-button",
        "data-size": size,
        "data-active": isActive ? "true" : undefined,
        "aria-current": isActive ? "page" : undefined,
        tabIndex: tabIdx,
        className: cn(
          "relative z-10 flex w-full cursor-pointer select-none items-center gap-2 px-2 text-left outline-none",
          size === "sm" ? "h-6" : sizeClasses.variant === "compact" ? "h-6" : "h-7",
          shape.item,
          className
        ),
        ...props,
      },
      <>
        {Icon && (
          <Icon
            size={sizeClasses.icon}
            strokeWidth={lit ? 2 : 1.5}
            className={cn(
              "shrink-0 transition-[color,stroke-width] duration-80",
              lit ? "text-foreground" : "text-muted-foreground"
            )}
          />
        )}
        {/* Sub-rows keep the parent rows' type size — only the row height
            steps down. */}
        <MenuRowLabel
          content={content}
          lit={lit}
          emphasized={isActive}
          textClass={size === "sm" ? "text-[12px]" : sizeClasses.text}
        />
      </>
    );
  }
);
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
};
