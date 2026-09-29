"use client";

import { forwardRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";
import { useIcon, type IconComponent } from "@/lib/icon-context";
import { spring } from "@/lib/springs";
import { Button, type ButtonProps } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Banner is a status message built from parts, the way Card is: Banner owns
// the status color, the icon and the dismiss control; BannerTitle,
// BannerDescription and BannerActions fill the text column.
//
// One status color per banner, and it lands in one place at a time:
//   contrast="low"  — a neutral overlay behind the text; only the icon is
//                     colored.
//   contrast="high" — a light wash of the status color behind the text.
// Text stays on the foreground ramp in both, so it reads the same on every
// status.
//
// The parts sit on one grid, so their placement is pure CSS: actions trail
// the title on a title-only banner, and drop under the text when there is a
// description or the banner is narrower than 24rem.
// ---------------------------------------------------------------------------

type BannerStatus = "default" | "info" | "success" | "warning" | "error";
type BannerContrast = "low" | "high";
type BannerVariant = "inline" | "fixed";

// The status color: the icon's fill, and the wash behind a high-contrast
// banner. Default is the foreground, so a neutral banner reads as ink.
const TONE: Record<BannerStatus, string> = {
  default: "var(--foreground)",
  info: "var(--info)",
  success: "var(--success)",
  warning: "var(--warning)",
  error: "var(--destructive)",
};

// Both fills are translucent, so the banner takes on whatever surface it sits
// on. Grey reads darker than a hue at the same mix, so the neutral wash steps
// down to 8%.
function fillFor(status: BannerStatus, contrast: BannerContrast) {
  if (contrast === "low") return "var(--hover)";
  const amount = status === "default" ? 8 : 12;
  return `color-mix(in oklab, var(--banner-tone) ${amount}%, transparent)`;
}

// ── Status glyphs ────────────────────────────────────────
// The 4 colored statuses get filled shapes with the mark cut out in the page
// color: a solid shape carries the status color at 16–20px far better than a
// 1.5px outline. Drawn here rather than taken from the icon set so they stay
// filled whatever icon library the app uses. The neutral default carries no
// status, so it takes the icon set's regular outline info icon instead.

type ColoredStatus = Exclude<BannerStatus, "default">;

function StatusGlyph({ status, size }: { status: ColoredStatus; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {status === "warning" ? (
        <path
          d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ) : (
        <circle cx="12" cy="12" r="10.5" fill="currentColor" />
      )}
      <g
        className="stroke-background"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {status === "success" ? (
          <path d="m8.5 12.25 2.5 2.5 4.5-5" />
        ) : status === "warning" ? (
          <path d="M12 9.5v3.5M12 17h.01" />
        ) : status === "error" ? (
          <path d="M12 7.5v5M12 16.5h.01" />
        ) : (
          <path d="M12 16.5v-5M12 7.5h.01" />
        )}
      </g>
    </svg>
  );
}

// ── Banner ───────────────────────────────────────────────

interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  /** Which status color the banner carries. @default "default" */
  status?: BannerStatus;
  /** "low" — neutral fill, colored icon. "high" — a light wash of the status
   *  color behind the text. @default "low" */
  contrast?: BannerContrast;
  /** "inline" — a rounded block in the flow of the page. "fixed" — a
   *  full-bleed bar that sticks to the top of its scroll container and pushes
   *  the content below it down. @default "inline" */
  variant?: BannerVariant;
  /** Replaces the status icon. Rendered in the status color. */
  icon?: IconComponent;
  /** Shows a dismiss (✕) button. */
  dismissible?: boolean;
  /** Called when the ✕ is pressed. */
  onDismiss?: () => void;
  /** Accessible name for the ✕. @default "Dismiss" */
  dismissLabel?: string;
  /** Controls visibility. Omitted, the banner hides itself when dismissed.
   *  Either way, closing collapses its height so the content below slides up. */
  open?: boolean;
  /** Pins the banner to one step of the size ladder. Omitted, it follows the
   *  surrounding SizeProvider. */
  size?: SizeVariant;
}

const Banner = forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      status = "default",
      contrast = "low",
      variant = "inline",
      icon: Icon,
      dismissible = false,
      onDismiss,
      dismissLabel = "Dismiss",
      open: openProp,
      size,
      role,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const shape = useShape();
    const sizeClasses = useSize(size);
    const compact = sizeClasses.variant === "compact";
    const XIcon = useIcon("x");
    const InfoIcon = useIcon("info");
    const reduceMotion = useReducedMotion() ?? false;
    const fixed = variant === "fixed";

    const [openState, setOpenState] = useState(true);
    const open = openProp ?? openState;

    const handleDismiss = () => {
      onDismiss?.();
      if (openProp === undefined) setOpenState(false);
    };

    const iconSize = compact ? 16 : 20;
    // A custom icon, or the neutral default's info icon, comes from the icon
    // set as an outline at its usual 1.5 stroke; the colored statuses get
    // their filled glyph.
    const OutlineIcon = Icon ?? (status === "default" ? InfoIcon : undefined);

    const body = (
      <div
        ref={ref}
        role={role ?? (status === "error" || status === "warning" ? "alert" : "status")}
        data-slot="banner"
        data-status={status}
        data-contrast={contrast}
        data-variant={variant}
        className={cn(
          "group/banner @container/banner relative grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center text-foreground",
          // With a description the icon and ✕ hold to the title line instead
          // of centring on the whole block.
          "has-data-[slot=banner-description]:items-start",
          compact ? "px-3 py-2.5" : "px-4 py-3.5",
          // A fixed bar runs edge to edge: square corners, no frame.
          !fixed && shape.container,
          className
        )}
        style={
          {
            "--banner-tone": TONE[status],
            "--banner-fill": fillFor(status, contrast),
            // A fixed bar stays opaque over the page scrolling under it;
            // inline, the fill blends with the surface below.
            backgroundColor: fixed ? "var(--background)" : undefined,
            backgroundImage: "linear-gradient(var(--banner-fill), var(--banner-fill))",
            ...style,
          } as CSSProperties
        }
        {...props}
      >
        {/* The glyph box is one title line tall, so it lines up with the
            first line whether it centres or tops. */}
        <span
          aria-hidden="true"
          className={cn(
            "col-start-1 row-start-1 flex items-center justify-center text-[color:var(--banner-tone)]",
            compact ? "mr-2.5 h-[18px]" : "mr-3 h-5"
          )}
        >
          {OutlineIcon ? (
            <OutlineIcon size={iconSize} strokeWidth={1.5} />
          ) : (
            status !== "default" && <StatusGlyph status={status} size={iconSize} />
          )}
        </span>

        {children}

        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={dismissLabel}
            className={cn(
              "col-start-4 row-start-1 flex size-7 cursor-pointer items-center justify-center text-muted-foreground outline-none transition-colors duration-80 hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
              // Pulled into the padding so the glyph, not the 28px box, sits
              // on the title line and the inset edge.
              compact ? "-my-[5px] -mr-1.5 ml-1.5" : "-my-1 -mr-1.5 ml-2",
              shape.button
            )}
          >
            <XIcon size={compact ? 13 : 15} strokeWidth={1.5} />
          </button>
        )}
      </div>
    );

    // The height opens and closes on a one-row grid whose track springs
    // between 0fr and 1fr. At rest the row is exactly the content height, so
    // rewrapping text never waits on a measurement, and fr resolves from
    // layout, so a scaled ancestor can't skew it the way it skews a framer
    // "auto" target.
    const banner = (
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="banner"
            initial={{ gridTemplateRows: "0fr", opacity: 0 }}
            animate={{ gridTemplateRows: "1fr", opacity: 1 }}
            exit={{
              gridTemplateRows: "0fr",
              opacity: 0,
              transition: reduceMotion ? { duration: 0 } : spring.moderate.exit,
            }}
            transition={reduceMotion ? { duration: 0 } : spring.moderate}
            // w-full: the banner is a container (for its narrow layout), so it
            // can't size to its content and has to take the full row.
            className={cn("grid w-full", fixed && "sticky top-0 z-40")}
          >
            <div className="min-h-0 overflow-hidden">{body}</div>
          </motion.div>
        )}
      </AnimatePresence>
    );

    return size ? <SizeProvider size={size}>{banner}</SizeProvider> : banner;
  }
);

Banner.displayName = "Banner";

// ── BannerTitle ──────────────────────────────────────────

const BannerTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, style, ...props }, ref) => {
    const compact = useSize().variant === "compact";
    return (
      <p
        ref={ref}
        data-slot="banner-title"
        className={cn(
          "col-start-2 row-start-1 min-w-0 text-foreground",
          compact ? "text-[13px] leading-[18px]" : "text-[14px] leading-5",
          className
        )}
        style={{ fontVariationSettings: fontWeights.medium, ...style }}
        {...props}
      />
    );
  }
);

BannerTitle.displayName = "BannerTitle";

// ── BannerDescription ────────────────────────────────────
// 70% foreground rather than muted-foreground: the muted grey drops under
// 4.5:1 on the tinted and neutral fills.

const BannerDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const compact = useSize().variant === "compact";
  return (
    <p
      ref={ref}
      data-slot="banner-description"
      className={cn(
        "col-start-2 row-start-2 mt-0.5 min-w-0 text-foreground/70",
        compact ? "text-[13px] leading-[18px]" : "text-[14px] leading-5",
        className
      )}
      {...props}
    />
  );
});

BannerDescription.displayName = "BannerDescription";

// ── BannerActions ────────────────────────────────────────
// Trailing on the title row by default (pulled into the padding so a 28px
// button doesn't grow a one-line banner). Under the text, aligned with the
// title, when the banner has a description or is narrower than 24rem. Each
// BannerAction places itself by variant, so the order flips with the layout
// (see BANNER_ACTION_ORDER).

const BannerActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const compact = useSize().variant === "compact";
    return (
      <div
        ref={ref}
        data-slot="banner-actions"
        className={cn(
          "col-start-3 row-start-1 flex flex-wrap items-center gap-2",
          compact ? "-my-[5px] ml-2.5" : "-my-1 ml-3",
          // With a description
          "group-has-data-[slot=banner-description]/banner:col-start-2 group-has-data-[slot=banner-description]/banner:row-start-3 group-has-data-[slot=banner-description]/banner:my-0 group-has-data-[slot=banner-description]/banner:ml-0",
          compact
            ? "group-has-data-[slot=banner-description]/banner:mt-2.5"
            : "group-has-data-[slot=banner-description]/banner:mt-3",
          // Narrow banner
          "@max-sm/banner:col-start-2 @max-sm/banner:row-start-3 @max-sm/banner:my-0 @max-sm/banner:ml-0",
          compact ? "@max-sm/banner:mt-2.5" : "@max-sm/banner:mt-3",
          className
        )}
        {...props}
      />
    );
  }
);

BannerActions.displayName = "BannerActions";

// ── BannerAction ─────────────────────────────────────────
// The library Button at its compact 28px size, so it presses like every
// other button and a one-line banner doesn't grow. Primary is ink on any
// status; secondary's see-through tint darkens (or, in dark mode, lightens)
// whatever fill the banner has. Ghost text steps up from muted to 70%
// foreground, which holds 4.5:1 on every banner fill.

type BannerActionVariant = "primary" | "secondary" | "ghost";

// Where each variant sits, whatever order the actions are written in.
// Trailing the title, the strongest action goes last, at the edge: ghost,
// secondary, primary. Under the text it leads, where the eye starts the row:
// primary, secondary, ghost. Tab order follows the markup, so write primary
// first.
const BANNER_ACTION_ORDER: Record<BannerActionVariant, string> = {
  primary:
    "order-3 group-has-data-[slot=banner-description]/banner:order-1 @max-sm/banner:order-1",
  secondary: "order-2",
  ghost:
    "order-1 group-has-data-[slot=banner-description]/banner:order-3 @max-sm/banner:order-3",
};

interface BannerActionProps extends Omit<ButtonProps, "variant" | "size" | "asChild"> {
  /** @default "secondary" */
  variant?: BannerActionVariant;
  /** Renders a link instead of a button. */
  href?: string;
  /** Opens the href in a new tab. */
  external?: boolean;
}

const BannerAction = forwardRef<HTMLButtonElement, BannerActionProps>(
  ({ variant = "secondary", href, external = false, className, children, ...props }, ref) => {
    const classes = cn(
      BANNER_ACTION_ORDER[variant],
      variant === "ghost" && "text-foreground/70",
      className
    );

    if (href) {
      return (
        <Button
          ref={ref}
          asChild
          variant={variant}
          size="compact"
          data-slot="banner-action"
          className={classes}
          {...props}
        >
          <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
          >
            {children}
          </a>
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size="compact"
        data-slot="banner-action"
        className={classes}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

BannerAction.displayName = "BannerAction";

export { Banner, BannerTitle, BannerDescription, BannerActions, BannerAction };
export type {
  BannerProps,
  BannerStatus,
  BannerContrast,
  BannerVariant,
  BannerActionProps,
  BannerActionVariant,
};
