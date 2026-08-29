"use client";

import { Fragment, createElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { spring } from "@/lib/springs";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarInput,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupActions,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuActions,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/flavored/sidebar";
import { Button } from "@/registry/radix/button";
import { Tooltip, TooltipPortalContainer } from "@/registry/radix/tooltip";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
} from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { useIcons, useIcon, type IconName } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { fontWeights } from "@/lib/font-weight";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { useNarrowFrame } from "@/lib/use-narrow-frame";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { SidebarPlayground, FooterCalloutStack } from "@/lib/docs/playgrounds/sidebar";
import { WorkspaceMenuItems } from "@/lib/docs/workspace-demo";
import {
  Card,
  CardDescription,
  CardGroup,
  CardHeader,
  CardImage,
  CardMedia,
  CardTitle,
} from "@/registry/default/card";
import { BANNER } from "@/lib/docs/playgrounds/card";
import { SIDEBAR_THREADS } from "@/app/components/demo-data";
import { useSurface } from "@/lib/surface-context";
import { surfaceClasses, surfaceHoverClasses } from "@/lib/surface-classes";
import {
  AI_CALLOUT,
  AI_NAV,
  AI_THREADS,
  AI_WORKSPACE,
  WIKI_PRIVATE,
  WIKI_RECENT,
  WIKI_SHARED,
} from "./example-data";

// ── Code snippets ────────────────────────────────────────

const layoutsCode = `import {
  SidebarProvider, Sidebar, SidebarTrigger, SidebarInset,
  SidebarHeader, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from "./components";

// variant is the only thing that changes between the three:
//   "sidebar"  — flush rail, the default
//   "floating" — the rail is its own card over the canvas
//   "inset"    — the MAIN region is the card; the rail recedes
const [current, setCurrent] = useState(nav[0].label);

<SidebarProvider>
  <Sidebar variant="inset">
    <SidebarHeader>{/* workspace row */}</SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarMenu>
          {nav.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                icon={item.icon}
                isActive={item.label === current}
                onClick={() => setCurrent(item.label)}
              >
                {item.label}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>{/* user row */}</SidebarFooter>
  </Sidebar>
  <SidebarInset>
    <header><SidebarTrigger /></header>
    {children}
  </SidebarInset>
</SidebarProvider>`;

const nestingCode = `const [open, setOpen] = useState<string | null>("Agents");

<SidebarMenuItem>
  {/* Level 1 — the row that owns the sub-tree */}
  <SidebarMenuButton
    icon={BrainIcon}
    onClick={() => setOpen((v) => (v === "Agents" ? null : "Agents"))}
    aria-expanded={open === "Agents"}
  >
    Agents
    {/* one chevron-right, sprung 90° to point down while open */}
    <motion.span animate={{ rotate: open === "Agents" ? 90 : 0 }} transition={spring.fast}>
      <ChevronRightIcon />
    </motion.span>
  </SidebarMenuButton>

  {/* The row's own action — a child's hover never reveals it */}
  <SidebarMenuAction showOnHover aria-label="New agent">
    <PlusIcon />
  </SidebarMenuAction>

  {/* Level 2 — collapses on measured height, never an animated "auto" */}
  <SidebarMenuSub open={open === "Agents"}>
    {agents.map((agent) => (
      <SidebarMenuSubItem key={agent.label}>
        <SidebarMenuSubButton
          href="#"
          icon={agent.icon}
          isActive={agent.label === current}
        >
          {agent.label}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    ))}
  </SidebarMenuSub>
</SidebarMenuItem>`;

const actionsCode = `{/* The section label carries actions of its own */}
<SidebarGroup collapsible>
  <SidebarGroupLabel>Threads</SidebarGroupLabel>
  <SidebarGroupActions>
    <SidebarGroupAction aria-label="New thread"><PlusIcon /></SidebarGroupAction>
    <SidebarGroupAction aria-label="Filter"><SlidersIcon /></SidebarGroupAction>
  </SidebarGroupActions>

  <SidebarMenu>
    {/* Status leads instead of an icon: active/unread fill the dot, idle
        rings it, and "unread" is announced to screen readers. The badge
        keeps the rightmost slot; the cluster reveals to its left and owns
        the row's gutter */}
    {threads.map((thread) => (
      <SidebarMenuItem key={thread.label}>
        <SidebarMenuButton status={thread.status}>{thread.label}</SidebarMenuButton>
        <SidebarMenuBadge>{thread.badge}</SidebarMenuBadge>
        <SidebarMenuActions showOnHover>
          <SidebarMenuAction aria-label="Branch"><CornerIcon /></SidebarMenuAction>
          <SidebarMenuAction aria-label="Share"><LinkIcon /></SidebarMenuAction>
          <SidebarMenuAction aria-label="More options"><MoreIcon /></SidebarMenuAction>
        </SidebarMenuActions>
      </SidebarMenuItem>
    ))}
  </SidebarMenu>
</SidebarGroup>`;

const headerFooterCode = `{/* Vertical: every element gets its own full-width row */}
<SidebarHeader>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownTrigger render={<SidebarMenuButton>Aurora AI</SidebarMenuButton>} />
    </SidebarMenuItem>
  </SidebarMenu>
  {/* Search + action rows are ONE block: the field reads as the list's
      first row, on the menu rows' own tight rhythm */}
  <div className="flex flex-col gap-0.5">
    <SidebarInput placeholder="Search threads…" />
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton icon={PlusIcon}>New thread</SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </div>
</SidebarHeader>

{/* Horizontal is the same pieces sharing the brand's line as 24px icon
    buttons, the row inset pr-1.5 onto the section actions' axis:
      <div className="flex items-center gap-1 pr-1.5">
        <div className="min-w-0 flex-1">{brandRow}</div>
        <Button variant="ghost" size="icon-compact" className="size-6" aria-label="Search">…
*/}

<SidebarFooter>
  {/* Anchored callout: a Card on a surface one step above the rail.
      dismissible reveals its ✕ on hover (the default) */}
  <Card size="compact" dismissible onDismiss={hide} href="/docs/sidebar" label="Aurora 2 is here">
    <CardImage src={banner} className="aspect-[2/1] max-h-28" />
    <CardHeader className="gap-0 pt-3">
      <CardTitle>Aurora 2 is here</CardTitle>
      <CardDescription>Longer context, faster agents</CardDescription>
    </CardHeader>
  </Card>

  {/* Actions above, the user row last — identity anchors the outer edge */}
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton icon={SettingsIcon}>Settings</SidebarMenuButton>
    </SidebarMenuItem>
    <SidebarMenuItem>
      <DropdownTrigger render={<SidebarMenuButton>Micka Touillaud</SidebarMenuButton>} />
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarFooter>`;

const stackedCalloutCode = `/* A sonner-style pile in the footer: cards peek 12px apiece behind the
   front one, scaling down 0.05 a step, two peeks max. The inline pile
   fans out on hover; dismissing the front card promotes the next. Each
   card keeps its own step of the brand mesh's intensity ladder. */
const [expanded, setExpanded] = useState(false);
// CARD_H is the front card's measured offsetHeight — never an animated "auto"
const collapsedH = CARD_H + Math.min(callouts.length - 1, 2) * 12;
const expandedH = callouts.length * CARD_H + (callouts.length - 1) * 4;

<SidebarFooter>
  <motion.div
    className="relative"
    animate={{ height: expanded ? expandedH : collapsedH }}
    onMouseEnter={() => setExpanded(true)}
    onMouseLeave={() => setExpanded(false)}
  >
    {callouts.map((c, i) => (
      <motion.div
        key={c.id}
        className="absolute inset-x-0 bottom-0"
        style={{ transformOrigin: "bottom center", zIndex: 100 - i }}
        animate={expanded
          ? { y: -i * (CARD_H + 4), scale: 1, opacity: 1 }
          : { y: -Math.min(i, 2) * 12, scale: 1 - Math.min(i, 2) * 0.05,
              opacity: i <= 2 ? 1 : 0 }}
      >
        <Card size="compact" dismissible onDismiss={() => dismiss(c.id)}>
          {/* full-strength brand glyph on the card's own tint step */}
          <CardMedia icon={c.icon} size={18} className={\`\${c.tint} [&_svg]:text-[#6B97FF]\`} />
          <CardHeader className="gap-[2px] py-3">
            <CardTitle className="truncate">{c.title}</CardTitle>
            <CardDescription className="truncate text-caption">{c.desc}</CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    ))}
  </motion.div>
  {/* user row */}
</SidebarFooter>`;

const collapseCode = `// The bare "[" key toggles a left sidebar, "]" a right one (Provider's
// \`shortcut\` prop overrides, null disables). The rail handle on the
// sidebar's edge is built in: drag it to resize, click it to collapse.
// \`peek\` gives the collapsed edge a hover or click strip that floats the
// rail back as an overlay without pinning it — in hover mode, resting on
// the trigger peeks it too.
// setOpen persists to the "sidebar_state" cookie — read it back in a
// server layout for a flicker-free default:
//
//   const cookieStore = await cookies();
//   const defaultOpen =
//     cookieStore.get("sidebar_state")?.value !== "false";
//   <SidebarProvider defaultOpen={defaultOpen}>…

<SidebarProvider peek="hover">
  {/* railTooltipOpen pins the rail's tooltip open (the demo spotlights the
      handle until your cursor takes over); undefined restores hover */}
  <Sidebar variant="inset" railTooltipOpen={spotlight || undefined}>
    <SidebarContent>…</SidebarContent>
  </Sidebar>
  <SidebarInset>
    <SidebarTrigger />
    <StateReadout />
  </SidebarInset>
</SidebarProvider>

// Own the state instead, or just read it — useSidebar is the same hook
// SidebarTrigger is built on:
//   <SidebarProvider open={open} onOpenChange={setOpen}>
function StateReadout() {
  const { state, toggleSidebar } = useSidebar();
  return <button onClick={toggleSidebar}>Sidebar is {state}</button>;
}`;

const noIconRailCode = `// ❌ The icon rail. Collapsing to a strip of glyphs keeps the
// sidebar's cost without its value: every destination takes a
// hover, a beat, a tooltip — and section labels have no icon to
// shrink to, so the structure collapses to a divider. The nav
// becomes a quiz — which is why \`collapsible\` here is only
// "offcanvas" | "none".

// ✅ Collapsed means gone. The canvas gets every pixel back, and
// peek="hover" floats the REAL sidebar — labels and all — the
// moment the cursor reaches the collapsed edge or the trigger.
<SidebarProvider peek="hover">
  <Sidebar variant="inset">…</Sidebar>
  <SidebarInset>
    <SidebarTrigger />
  </SidebarInset>
</SidebarProvider>`;

const alignmentCode = `// One rhythm everywhere: 24px icon buttons, gap-1, inside the
// section's p-2 with pr-1.5 — so every trailing icon centre lands
// 26px in from the sidebar's inner edge, 28px to the next column.
// Header buttons, row action clusters and footer buttons all share
// the same axes; the guides trace the measured centres.

<SidebarHeader>
  <div className="flex items-center gap-1 pr-1.5">
    {/* brand … */}
    <Button variant="ghost" size="icon-compact" className="size-6" />
    <Button variant="ghost" size="icon-compact" className="size-6" />
    <Button variant="ghost" size="icon-compact" className="size-6" />
  </div>
</SidebarHeader>

<SidebarMenuItem>
  <SidebarMenuButton icon={Icon}>{label}</SidebarMenuButton>
  <SidebarMenuActions showOnHover>{/* 3 actions */}</SidebarMenuActions>
</SidebarMenuItem>

<SidebarFooter>
  <div className="flex items-center justify-end gap-1 pr-1.5">
    {/* icon buttons, as many as the row holds */}
  </div>
</SidebarFooter>`;

// ── Props tables ─────────────────────────────────────────
// Grouped the way the sidebar is built — shell, sections, rows — so a prop
// is where you'd look for the part it belongs to.

const providerProps: PropDef[] = [
  { name: "open", type: "boolean", description: "Controlled open state — pair with onOpenChange." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Fires when the trigger, rail, or shortcut wants to toggle." },
  { name: "defaultOpen", type: "boolean", default: "true", description: "Uncontrolled initial state. Read the sidebar_state cookie in a server layout to restore the last visit." },
  { name: "persist", type: "boolean", default: "true", description: "Write the desktop state to the sidebar_state cookie (7 days). Mobile drawer state never persists." },
  { name: "peek", type: '"none" | "hover" | "click"', default: '"none"', description: "What the collapsed edge does: an edge strip reveals the sidebar as a floating overlay, on hover or on click — and in hover mode, resting on the trigger peeks it too. Escape or an outside press dismisses; peeking never pins it or writes the cookie." },
  { name: "shortcut", type: "string | null", default: '"[" left · "]" right', description: "Bare-key toggle, side-aware; null disables. Focus-scoped: the innermost provider containing focus answers." },
  { name: "mobileBreakpoint", type: "number", default: "768", description: "Width (px) below which the sidebar becomes a modal drawer." },
  { name: "width / widthMobile", type: "string", default: '"16rem" / "18rem"', description: "Rail and drawer widths, also published as --sidebar-width and --sidebar-width-mobile." },
];

const sidebarProps: PropDef[] = [
  { name: "side", type: '"left" | "right"', default: '"left"', description: "Which edge the rail lives on. The provider mirrors it into the default shortcut — \"[\" left, \"]\" right — and the trigger's icon, the rail handle, and the drawer's slide all follow." },
  { name: "variant", type: '"sidebar" | "floating" | "inset"', default: '"sidebar"', description: "Transparent rail, elevated floating card, or the inset pairing where SidebarInset becomes the card." },
  { name: "collapsible", type: '"offcanvas" | "none"', default: '"offcanvas"', description: "Offcanvas slides the rail away; none renders a static, always-open column. (The icon-rail mode is intentionally not supported.)" },
  { name: "rail", type: "boolean", default: "true", description: "The built-in resize/collapse handle: drag to resize (160–360px), click to collapse, drag past the minimum to collapse. false hides it; the trigger and shortcut still toggle." },
  { name: "railTooltipOpen", type: "boolean", description: "Pins the rail's tooltip open (true) or closed (false); undefined leaves it on hover. Dragging always hides it — the collapse demo uses it to spotlight the handle." },
  { name: "bordered", type: "boolean", default: "true", description: "The sidebar variant's inner-edge border." },
  { name: "SidebarTrigger", type: "ButtonProps", description: "Ghost icon button calling toggleSidebar(). Its tooltip carries the shortcut key." },
  { name: "SidebarContent viewportClassName", type: "string", description: "Extra classes for the scroll viewport — a ScrollArea carrying the scroll-fade mask, with the boundary hairline on its frame." },
];

/** Sections — SidebarGroup and its label row. */
const sectionProps: PropDef[] = [
  { name: "SidebarGroup collapsible", type: "boolean", default: "false", description: "Turns the group's label into an accordion toggle for everything after it. Hover raises the label's contrast and reveals a chevron." },
  { name: "SidebarGroup open / defaultOpen / onOpenChange", type: "boolean · (open) => void", description: "Control the accordion, or leave it uncontrolled." },
  { name: "SidebarGroupActions", type: "part", description: "Clusters 1–3 SidebarGroupAction buttons on the label row. A collapsible label keeps its chevron one gap clear of them." },
  { name: "SidebarGroupLabel / SidebarGroupAction render", type: "ReactElement", description: "Both accept render / asChild for composition." },
];

/** Content level 1 — the top-level rows and everything they carry. */
const level1Props: PropDef[] = [
  { name: "SidebarMenuButton isActive", type: "boolean", default: "false", description: "Marks the current row: aria-current, the traveling active background, and the semibold weight shift." },
  { name: "SidebarMenuButton icon", type: "IconComponent", description: "Leading icon — stroke width animates 1.5 → 2 with the row's state." },
  { name: "SidebarMenuButton status", type: '"active" | "unread" | "idle"', description: "Leads with a status dot instead of an icon: active/unread fill it, idle rings it. Stamps data-status, adds visually-hidden \"unread\" text, and active implies isActive." },
  { name: "SidebarMenuButton dot", type: '"filled" | "ring"', description: "Visual-only dot for when the status vocabulary doesn't fit. Overrides the status-derived dot; ignored when icon is set." },
  { name: "SidebarMenuButton size / variant", type: '"default" | "sm" | "lg" · "default" | "outline"', description: "Row height (default follows the size ladder; lg is a 48px two-line row) and an outline treatment for standalone rows." },
  { name: "SidebarMenuButton render / asChild", type: "ReactElement · boolean", description: "Render into a custom element, e.g. render={<Link href=…/>}." },
  { name: "SidebarMenuBadge", type: "part", description: "Trailing count. Keeps the rightmost slot when the row also has actions." },
  { name: "SidebarMenuAction showOnHover", type: "boolean", default: "false", description: "Hide the action until the row is hovered or focused. The row reserves its width only while it shows, so the label runs full width at rest. Tracks the row's own button — a child's hover never reveals it." },
  { name: "SidebarMenuActions", type: "part", description: "Clusters more than one action on a row and publishes the count, so the row reserves exactly the gutter the cluster needs." },
  { name: "SidebarMenu size", type: '"default" | "compact"', description: "Pins the menu's rows to one step of the size ladder; omitted, they follow the surrounding SizeProvider." },
  { name: "SidebarMenuSkeleton showIcon", type: "boolean", default: "false", description: "Placeholder row while data lands. Widths are deterministic, so SSR and client agree." },
];

/** Content level 2 — the sub-tree a row can own. */
const level2Props: PropDef[] = [
  { name: "SidebarMenuSub open", type: "boolean", default: "true", description: "Built-in collapse on the sub-tree's measured height, never an animated auto — wire it to state alongside a toggling row." },
  { name: "SidebarMenuSubButton", type: '{ size, icon, isActive }', description: "Nested row: 24 / 28px tall, text stays at the parent rows' size. Renders an <a> by default; also accepts render / asChild." },
  { name: "SidebarMenuBadge / SidebarMenuAction", type: "part", description: "Behave as they do at level 1, scoped to the nested row: an action here reveals on its own row, not on its siblings or its parent." },
  { name: "Highlight scope", type: "—", description: "Each sub-menu runs its own hover/active/focus overlays, so a nested row and its parent never fight over which one is lit." },
];

// ── Shared demo scaffolding ──────────────────────────────

/** Every preview stage on this page. 640px gives the rail room to be a rail.
 *  On a phone the previews are rail-only, and the rails run 300–580px of
 *  content, so 560 shows almost all of it without scrolling — the stage is
 *  the point on a page where the prose is deliberately short. */
const SHELL_HEIGHT = "h-[560px] md:h-[640px]";

/** Bounded app-shell frame every preview runs inside — the provider fills it
 *  instead of the viewport. */
/** The z-20 lifts every shell demo above the Inspect rulers (z-10) so the
 *  sidebar masks the ticks and numbers — the crosshair layer (z-30) still
 *  draws over it. */
function SidebarShellFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className={`relative z-20 flex w-full overflow-hidden bg-background ${SHELL_HEIGHT}`}
    >
      {children}
    </div>
  );
}

function DemoHeaderRow() {
  const ChevronDown = useIcon("chevron-down");
  const shape = useShape();
  const { isPeeking } = useSidebar();
  return (
    // @container: the row hides its dropdown chevron once it gets too narrow
    // to show a useful slice of the name (squeezed by trailing header actions
    // or a mid-drag width) — the text keeps whatever room is left.
    <SidebarMenu aria-label="Workspace" className="@container">
      <SidebarMenuItem>
        {/* While the sidebar is only PEEKING, the pointer's one way to pin it
            open is covered by the overlay itself — so the trigger takes the
            logo's slot. A sibling positioned over the row (the menu-action
            pattern), never a button nested inside the row button. Trigger and
            tile cross-fade in place; the constant pl-9 keeps the name pinned
            while they swap. */}
        <SidebarTrigger
          size="icon-compact"
          aria-hidden={!isPeeking || undefined}
          tabIndex={isPeeking ? undefined : -1}
          // The Button's first child is its hover/press bg layer — hidden here
          // because its box is off-axis from the tile slot the trigger
          // overlays, so a fill reads as a second, non-concentric rectangle.
          className={`absolute left-0.5 top-1/2 z-20 -translate-y-1/2 [&>span:first-child]:hidden [&_svg]:size-4 transition-opacity duration-80 ${
            isPeeking ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
        <DropdownMenu>
          <DropdownTrigger
            render={
              <SidebarMenuButton aria-label="Switch workspace" className="pl-9">
                <span
                  aria-hidden
                  className={`pointer-events-none absolute left-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center bg-foreground text-[10px] text-background transition-opacity duration-80 ${
                    shape.bgRadius >= 20 ? "rounded-full" : "rounded-md"
                  } ${isPeeking ? "opacity-0" : "opacity-100"}`}
                  style={{ fontVariationSettings: fontWeights.semibold }}
                >
                  A
                </span>
                <span
                  className="min-w-0 truncate text-[13px] text-foreground"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                >
                  {AI_WORKSPACE}
                </span>
                <span className="ml-auto inline-flex @max-[7rem]:hidden">
                  <ChevronDown size={16} strokeWidth={1.5} className="text-muted-foreground" />
                </span>
              </SidebarMenuButton>
            }
          />
          <DropdownContent className="min-w-[240px] w-[var(--radix-dropdown-menu-trigger-width,var(--anchor-width))]" align="start" sideOffset={4} checkedIndex={0}>
            <WorkspaceMenuItems />
          </DropdownContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

const SEARCH_SHORTCUT = "⌘K";

/** Tooltip content with the action's keystroke, on the same inverted surface
 *  treatment the sidebar trigger's tooltip uses. The label re-applies the
 *  surface's text-box trim (a flex row escapes it) and the chip pulls its
 *  box back with -my-1, so the tooltip keeps its single-line height. */
function tipWithShortcut(label: string, shortcut: string) {
  return (
    <span className="flex items-center gap-2">
      <span className="[text-box:trim-both_cap_alphabetic]">{label}</span>
      <kbd className="-my-1 flex h-4 min-w-4 items-center justify-center rounded border border-background/30 px-1 font-sans text-[10px] text-background/80">
        {shortcut}
      </kbd>
    </span>
  );
}

function DemoSearch() {
  const SearchIcon = useIcon("search");
  return (
    <div className="group/search relative">
      <SearchIcon
        size={14}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <SidebarInput placeholder="Search…" aria-label="Search" className="pl-8 pr-12" />
      {/* Revealed on hover / focus — the placeholder owns the field at rest. */}
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-sans text-[11px] text-muted-foreground opacity-0 transition-opacity duration-80 group-hover/search:opacity-100 group-focus-within/search:opacity-100">
        {SEARCH_SHORTCUT}
      </kbd>
    </div>
  );
}

/** Workspace menu + search — the header block every example shares.
 *  `search="inline"` swaps the full bar for a round icon button beside the
 *  workspace row. */
function DemoHeader({ search = "below" }: { search?: "below" | "inline" }) {
  const SearchIcon = useIcon("search");
  if (search === "inline") {
    return (
      <SidebarHeader>
        {/* 24px buttons, row inset pr-1.5: centres land on the section
            actions' axis, 26px from the sidebar's inner edge. */}
        <div className="flex items-center gap-1 pr-1.5">
          <div className="min-w-0 flex-1">
            <DemoHeaderRow />
          </div>
          <Tooltip content={tipWithShortcut("Search", SEARCH_SHORTCUT)} side="bottom">
            <Button
              variant="ghost"
              size="icon-compact"
              aria-label="Search"
              className="size-6 shrink-0"
            >
              <SearchIcon />
            </Button>
          </Tooltip>
        </div>
      </SidebarHeader>
    );
  }
  return (
    <SidebarHeader>
      <DemoHeaderRow />
      <DemoSearch />
    </SidebarHeader>
  );
}

function DemoFooterUser() {
  const ChevronsUpDown = useIcon("chevrons-up-down");
  const icons = useIcons();
  return (
    <SidebarMenu aria-label="User">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownTrigger
            render={
              <SidebarMenuButton aria-label="Open user menu">
                {/* -ml-0.5 centres the 20px avatar on the rows' leading icon
                    axis (24px in); the chevron rides a 24px slot pulled
                    -mr-0.5 onto the trailing action axis — same idiom as the
                    nesting rows' chevron box. */}
                <Image
                  src="/micka.png"
                  alt=""
                  width={20}
                  height={20}
                  data-guide-img
                  className="-ml-0.5 size-5 shrink-0 rounded-full"
                />
                <span className="min-w-0 truncate text-[13px] text-foreground">Micka Touillaud</span>
                <span data-guide className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center">
                  <ChevronsUpDown size={16} strokeWidth={1.5} className="text-muted-foreground" />
                </span>
              </SidebarMenuButton>
            }
          />
          <DropdownContent className="min-w-[240px] w-[var(--radix-dropdown-menu-trigger-width,var(--anchor-width))]" side="top" align="start" sideOffset={6}>
            <MenuItem index={0} icon={icons.user} label="Profile" onSelect={() => {}} />
            <MenuItem index={1} icon={icons.settings} label="Settings" onSelect={() => {}} />
            <MenuItem index={2} icon={icons["arrow-left"]} label="Log out" onSelect={() => {}} />
          </DropdownContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** The product's top-level nav — Chat, Agents, Knowledge, Runs, Evals under
 *  a section label that collapses the lot. The Layouts previews render it
 *  FLAT (`nested={false}`): those examples are about the shell, so plain
 *  selectable rows keep the rail quiet — and match the flat layoutsCode
 *  snippet. The collapse example keeps the tree: each row owns a sub-tree,
 *  one starting open (five expanded sub-trees would outrun the frame, and a
 *  mix of open and closed is what a real tree looks like anyway). */
function DemoMenu({ nested = true }: { nested?: boolean }) {
  const icons = useIcons();
  const [open, setOpen] = useState<Record<string, boolean>>({ Chat: true });
  const [current, setCurrent] = useState(
    nested ? AI_NAV[0].children[0].label : AI_NAV[0].label
  );

  return (
    <SidebarGroup collapsible>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {AI_NAV.map((item) => {
          if (!nested) {
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  icon={icons[item.icon]}
                  isActive={item.label === current}
                  onClick={() => setCurrent(item.label)}
                >
                  {item.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }
          const isOpen = !!open[item.label];
          return (
            <SidebarMenuItem key={item.label}>
              {/* Parents only expand/collapse — the current-page highlight
                  lives on the selected child alone. */}
              <SidebarMenuButton
                className="group/parent-row"
                icon={icons[item.icon]}
                onClick={() => setOpen((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
                aria-expanded={isOpen}
                style={{ "--row-gutter": "var(--row-gutter-hover)" } as CSSProperties}
              >
                {item.label}
                {/* The chevron rides the label's trailing edge: at rest it
                    only shows on a closed row, so an open tree isn't a column
                    of arrows. One chevron-right glyph, sprung 90° to point
                    down while the row is open. */}
                <span className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center">
                  <motion.span
                    className="inline-flex"
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={spring.fast}
                  >
                    {createElement(icons["chevron-right"], {
                      size: 16,
                      strokeWidth: 1.5,
                      className: `text-muted-foreground transition-opacity duration-80 ${
                        isOpen
                          ? "opacity-0 group-hover/parent-row:opacity-100 group-focus-within/parent-row:opacity-100"
                          : "opacity-100"
                      }`,
                    })}
                  </motion.span>
                </span>
              </SidebarMenuButton>

              <SidebarMenuSub open={isOpen}>
                {item.children.map((child) => (
                  <SidebarMenuSubItem key={child.label}>
                    <SidebarMenuSubButton
                      href="#"
                      isActive={child.label === current}
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrent(child.label);
                      }}
                    >
                      {child.label}
                    </SidebarMenuSubButton>
                    {child.badge && <SidebarMenuBadge>{child.badge}</SidebarMenuBadge>}
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/** Two examples are *about* the rail-and-main pairing, so they keep both
 *  halves at every width — the rail just narrows to leave the main region
 *  something to be. The other three are rail-only and never render this.
 *  The region itself stays blank on purpose: a bare topbar with the trigger
 *  and optional caption — skeleton page furniture competed with the rail. */
function DemoInsetContent({ title }: { title?: ReactNode }) {
  // While the sidebar is peeked the topbar trigger hides; pinning fades it
  // back in slightly late, so it appears at its settled position instead of
  // riding the inset's slide.
  const { isPeeking } = useSidebar();
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 px-1.5">
      <SidebarTrigger
        className={`transition-opacity delay-200 duration-160 ${
          isPeeking ? "opacity-0" : "opacity-100"
        }`}
      />
      <span className="text-[13px] text-muted-foreground">{title}</span>
    </header>
  );
}

/** Every preview's provider: scoped to the frame, no cookie writes, and
 *  pinned to a rail (`mobileBreakpoint={0}`) because a drawer inside a 325px
 *  frame hides the thing being demonstrated — the playground above is where
 *  the real drawer lives. The toggle key needs no opt-out: only the innermost
 *  provider containing focus answers a keypress. */
function DemoProvider({
  children,
  narrowWidth,
  ...props
}: {
  children: ReactNode;
  /** Rail width once the frame is too narrow for a 16rem rail. */
  narrowWidth?: string;
} & Omit<React.ComponentProps<typeof SidebarProvider>, "children">) {
  const narrow = useNarrowFrame();
  return (
    <SidebarProvider
      className="h-full min-h-0"
      persist={false}
      mobileBreakpoint={0}
      width={narrow ? narrowWidth : undefined}
      {...props}
    >
      {children}
    </SidebarProvider>
  );
}

/** Rail-only shell: the three examples whose subject lives entirely inside
 *  the sidebar. On a phone the mock main region is dropped and the rail takes
 *  the whole frame; above the breakpoint it sits beside the usual page. */
function DemoRailShell({
  children,
  insetTitle,
}: {
  children: ReactNode;
  insetTitle?: ReactNode;
}) {
  const narrow = useNarrowFrame();
  return (
    <SidebarShellFrame>
      <DemoProvider narrowWidth="100%">
        <Sidebar collapsible="none" className="h-full">
          {children}
        </Sidebar>
        {!narrow && (
          <SidebarInset className="min-h-0">
            <DemoInsetContent title={insetTitle} />
          </SidebarInset>
        )}
      </DemoProvider>
    </SidebarShellFrame>
  );
}

/** Standard demo shell — rail and main together, for the examples about that
 *  relationship. */
function DemoShell({
  variant,
  insetTitle,
}: {
  variant?: "sidebar" | "floating" | "inset";
  insetTitle?: ReactNode;
}) {
  return (
    <SidebarShellFrame>
      <DemoProvider narrowWidth="11rem">
        <Sidebar variant={variant} className="h-full">
          <DemoHeader />
          <SidebarContent>
            <DemoMenu nested={false} />
          </SidebarContent>
          <SidebarFooter>
            <DemoFooterUser />
          </SidebarFooter>
        </Sidebar>
        {/* The floating card sits in a p-2 gutter — pad the main region's
            top so its header lines up with the card's. The inset variant's
            main is itself the card (own m-2), so it needs no extra padding. */}
        <SidebarInset className={variant === "floating" ? "min-h-0 pt-2" : "min-h-0"}>
          <DemoInsetContent title={insetTitle} />
        </SidebarInset>
      </DemoProvider>
    </SidebarShellFrame>
  );
}

// ── Section previews ─────────────────────────────────────

/** Anything can read the state the trigger writes — this is the same hook
 *  SidebarTrigger itself is built on. */
function SidebarStateReadout() {
  const { state } = useSidebar();
  return (
    <>
      Sidebar is {state} — press <code>[</code>
    </>
  );
}

/** Stacked callouts: the footer pile as its own subject — hover fans the
 *  inline pile out, dismissing the front card promotes the next, and each
 *  card keeps its own step of the brand-blue ladder. Emptying the pile
 *  brings it back a beat later so the demo stays stocked. */
function StackedCalloutPreview() {
  const [restockKey, setRestockKey] = useState(0);
  const [hidden, setHidden] = useState(false);
  const onEmpty = () => {
    setHidden(true);
    setTimeout(() => {
      setRestockKey((k) => k + 1);
      setHidden(false);
    }, 1600);
  };
  return (
    <DemoRailShell insetTitle="Hover the pile — dismiss to promote">
      <DemoHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Threads</SidebarGroupLabel>
          <SidebarMenu>
            {AI_THREADS.slice(0, 3).map((thread) => (
              <SidebarMenuItem key={thread.label}>
                <SidebarMenuButton status={thread.status}>{thread.label}</SidebarMenuButton>
                <SidebarMenuBadge>{thread.badge}</SidebarMenuBadge>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!hidden && (
          <FooterCalloutStack key={restockKey} variant="inline" onEmpty={onEmpty} />
        )}
        <DemoFooterUser />
      </SidebarFooter>
    </DemoRailShell>
  );
}

/** Collapse, peek & resize: the whole shell, since collapsing is about what
 *  the main region does with the space. The rail's tooltip is pinned open as
 *  the section's subject — a real hover takes over (it follows the cursor
 *  along the handle), and it pins again once the pointer leaves the preview.
 *  Inset layout, simple thread rows: nothing competes with the rail. */
function CollapsePreview() {
  const [cursorInside, setCursorInside] = useState(false);
  const [open, setOpen] = useState(true);
  // Same in-view gate as the actions demo: never pin the rail tooltip while
  // the section is off screen, or it shifts back into the viewport detached.
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { amount: 0.5 });
  // And the same local tooltip portal, so the pinned rail tooltip scrolls
  // with the page instead of chasing its anchor a frame behind.
  const [frameEl, setFrameEl] = useState<HTMLElement | null>(null);
  return (
    <div
      ref={(el) => {
        frameRef.current = el;
        setFrameEl(el);
      }}
      className="relative w-full self-stretch"
      // mousemove covers a pointer already resting inside at mount, and
      // pointerdown covers touch (no hover) — otherwise the pinned tooltip
      // could never be handed off and would sit over the demo forever.
      onMouseEnter={() => setCursorInside(true)}
      onMouseMove={() => setCursorInside(true)}
      onPointerDown={() => setCursorInside(true)}
      onMouseLeave={() => setCursorInside(false)}
    >
      <TooltipPortalContainer value={frameEl}>
      <SidebarShellFrame>
        <DemoProvider narrowWidth="11rem" peek="hover" open={open} onOpenChange={setOpen}>
          <Sidebar
            variant="inset"
            // Pinned only while the rail exists to anchor it — never while
            // collapsed, and never against the visitor's own hover.
            railTooltipOpen={inView && !cursorInside && open ? true : undefined}
            className="h-full"
          >
            <DemoHeader />
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Threads</SidebarGroupLabel>
                <SidebarMenu>
                  {AI_THREADS.slice(0, 5).map((thread) => (
                    <SidebarMenuItem key={thread.label}>
                      <SidebarMenuButton status={thread.status}>{thread.label}</SidebarMenuButton>
                      <SidebarMenuBadge>{thread.badge}</SidebarMenuBadge>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <SidebarInset className="min-h-0">
            <DemoInsetContent title={<SidebarStateReadout />} />
          </SidebarInset>
        </DemoProvider>
      </SidebarShellFrame>
      </TooltipPortalContainer>
    </div>
  );
}

// ── Why no icon rail? — scripted comparison ──────────────

/** One clock drives both panels so the contrast is the point: while the left
 *  cursor is still quizzing tooltips one icon at a time, the right cursor's
 *  single hover already brought the whole sidebar back. */
const RAIL_PHASES = ["rest", "hover-0", "hover-1", "hover-2", "hover-3", "away"] as const;
type RailPhase = (typeof RAIL_PHASES)[number];
const RAIL_PHASE_MS: Record<RailPhase, number> = {
  rest: 900,
  "hover-0": 1600,
  "hover-1": 1600,
  "hover-2": 1600,
  "hover-3": 1600,
  away: 1500,
};

/** Two labeled sections of three — the peek shows them as-is; the rail has
 *  nowhere to put the labels, so between its groups all that survives is a
 *  divider. */
const RAIL_GROUPS: readonly {
  label: string;
  items: readonly { icon: IconName; label: string }[];
}[] = [
  {
    label: "Workspace",
    items: [
      { icon: "message-circle", label: "Chat" },
      { icon: "brain", label: "Agents" },
      { icon: "square-library", label: "Knowledge" },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: "play", label: "Runs" },
      { icon: "star", label: "Evals" },
      { icon: "settings", label: "Settings" },
    ],
  },
];

/** The cursor quizzes these rail indices — from the first item down and
 *  across the divider, where the section context is exactly what the rail
 *  can't show. */
const RAIL_HOVER_TARGETS = [0, 1, 2, 3] as const;

/* Geometry the cursors aim at: the rail opens with the size-6 workspace tile
   (mb-1), so its size-8 icons start at y=40 in a gap-1 column (centers 36px
   apart, first at y=56); the divider between groups (my-1 h-px, plus the
   column gap on both sides) pushes the second group down 13px. The peek
   trigger is size-7 inset pl-3.5 pt-3.5 into the corner (center at 28,28). */
const railIconCenterY = (index: number) =>
  index < 3 ? 56 + 36 * index : 177 + 36 * (index - 3);

function FakeCursor({ x, y }: { x: number; y: number }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-30"
      initial={false}
      animate={{ x, y }}
      transition={spring.slow}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          d="m4 4 7.07 17 2.51-7.39L21 11.07z"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="fill-foreground stroke-background"
        />
      </svg>
    </motion.span>
  );
}

function CompareLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-caption text-muted-foreground text-center">
      {children}
    </span>
  );
}

function IconRailVsPeekPreview({ paused }: { paused: boolean }) {
  const icons = useIcons();
  const shape = useShape();
  // Same surface math as the real peek card: one step above the substrate,
  // wearing the overlay shadow.
  const substrate = useSurface();
  const floatingLevel = Math.min(substrate + 1, 8);
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { amount: 0.35 });
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<RailPhase>("rest");
  // Pausing clears the timer and freezes the current phase in place; resuming
  // picks the loop back up from that phase.
  const phaseRef = useRef<RailPhase>("rest");
  phaseRef.current = phase;

  useEffect(() => {
    if (!inView || reduced || paused) return;
    let index = RAIL_PHASES.indexOf(phaseRef.current);
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const current = RAIL_PHASES[index];
      setPhase(current);
      timer = setTimeout(() => {
        index = (index + 1) % RAIL_PHASES.length;
        step();
      }, RAIL_PHASE_MS[current]);
    };
    step();
    return () => clearTimeout(timer);
  }, [inView, reduced, paused]);

  // Reduced motion holds the frame that tells the story — a tooltip mid-quiz
  // on the left, the peek open on the right — with no cursors and no loop.
  const effective: RailPhase = reduced ? "hover-1" : phase;
  const hoverStep = effective.startsWith("hover-")
    ? Number(effective.slice("hover-".length))
    : null;
  const hoverIndex = hoverStep === null ? null : RAIL_HOVER_TARGETS[hoverStep];
  const engaged = hoverIndex !== null;
  const railItems = RAIL_GROUPS.flatMap((group) => group.items);
  const PanelLeftIcon = icons["panel-left"];

  return (
    <div
      ref={containerRef}
      className="flex w-full flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center"
    >
      <div className="flex w-full min-w-0 max-w-[340px] flex-col gap-2">
        <div
          className={`relative z-20 h-80 overflow-hidden border border-border bg-background ${shape.container}`}
        >
          <div className="absolute inset-y-0 left-0 flex w-11 flex-col items-center gap-1 border-r border-border/60 pt-2">
            <span
              aria-hidden
              className={`mb-1 flex size-6 shrink-0 items-center justify-center bg-foreground text-[11px] text-background ${
                shape.bgRadius >= 20 ? "rounded-full" : "rounded-md"
              }`}
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              A
            </span>
            {RAIL_GROUPS.map((group, g) => (
              <Fragment key={group.label}>
                {/* The section label has no icon to shrink to — all that's
                    left of it is this line. */}
                {g > 0 && <span aria-hidden className="my-1 h-px w-6 bg-border" />}
                {group.items.map((item, i) => {
                  const index = g * 3 + i;
                  return (
                    <span
                      key={item.label}
                      className={`flex size-8 items-center justify-center rounded-lg transition-colors duration-80 ${
                        hoverIndex === index
                          ? "bg-hover text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {createElement(icons[item.icon], { size: 16, strokeWidth: 1.5 })}
                    </span>
                  );
                })}
              </Fragment>
            ))}
          </div>
          {/* The tooltip arrives late on purpose — the hover-and-wait IS the cost. */}
          <AnimatePresence>
            {hoverIndex !== null && (
              <motion.span
                key={hoverIndex}
                className="absolute z-20 rounded-md bg-foreground px-2 py-1 text-[11px] leading-none text-background"
                style={{ left: 52, top: railIconCenterY(hoverIndex) - 10 }}
                initial={{ opacity: 0, x: -4 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: { ...spring.fast, delay: reduced ? 0 : 0.5 },
                }}
                exit={{ opacity: 0, transition: spring.fast.exit }}
              >
                {railItems[hoverIndex].label}
              </motion.span>
            )}
          </AnimatePresence>
          {!reduced && (
            <FakeCursor
              x={hoverIndex !== null ? 20 : 210}
              y={hoverIndex !== null ? railIconCenterY(hoverIndex) + 2 : 260}
            />
          )}
        </div>
        <CompareLabel>
          <span aria-hidden="true">❌</span> Icon rail: six glyphs, one tooltip
          at a time
        </CompareLabel>
      </div>

      <div className="flex w-full min-w-0 max-w-[340px] flex-col gap-2">
        <div
          className={`relative z-20 h-80 overflow-hidden border border-border bg-background ${shape.container}`}
        >
          {/* All the chrome a collapsed sidebar leaves behind: the trigger,
              inset 14px into the corner. Hover shows only while the cursor is
              actually on it — once the peek covers it, no state lingers
              behind. */}
          <div className="flex items-start pl-3.5 pt-3.5">
            <span
              className={`flex size-7 items-center justify-center rounded-md transition-colors duration-80 ${
                effective === "hover-0" ? "bg-hover text-foreground" : "text-muted-foreground"
              }`}
            >
              <PanelLeftIcon size={16} strokeWidth={1.5} />
            </span>
          </div>
          {/* The peek card wears the real overlay treatment: one surface
              above the substrate, overlay shadow, no border — same recipe as
              the component's own peek, in its floating-variant gutter. */}
          <AnimatePresence>
            {engaged && (
              <motion.div
                className={`absolute inset-y-2 left-2 z-10 flex w-44 flex-col gap-0.5 overflow-hidden p-2 ${shape.container} ${surfaceClasses(floatingLevel, 3)}`}
                initial={{ x: "-108%" }}
                animate={{ x: 0, transition: spring.moderate }}
                exit={{ x: "-108%", transition: spring.moderate.exit }}
              >
                <div className="flex items-center gap-2 px-1 pb-1 pt-0.5">
                  <span
                    className={`flex size-5 items-center justify-center bg-foreground text-[10px] text-background ${
                      shape.bgRadius >= 20 ? "rounded-full" : "rounded-md"
                    }`}
                    style={{ fontVariationSettings: fontWeights.semibold }}
                  >
                    A
                  </span>
                  <span
                    className="text-[12px] text-foreground"
                    style={{ fontVariationSettings: fontWeights.semibold }}
                  >
                    {AI_WORKSPACE}
                  </span>
                </div>
                {/* The same six items, with the structure the rail dropped:
                    both section labels, shown normally. */}
                {RAIL_GROUPS.map((group, g) => (
                  <Fragment key={group.label}>
                    {/* Regular SidebarGroupLabel metrics: h-8, px-2, 12px. */}
                    <span className="flex h-8 shrink-0 items-center px-2 text-[12px] text-muted-foreground/70">
                      {group.label}
                    </span>
                    {group.items.map((item, i) => {
                      const isActive = g === 0 && i === 0;
                      return (
                        <div
                          key={item.label}
                          className={`flex h-7 shrink-0 items-center gap-2 rounded-lg px-2 ${
                            isActive ? "bg-active" : ""
                          }`}
                        >
                          <span className="text-muted-foreground">
                            {createElement(icons[item.icon], { size: 14, strokeWidth: 1.5 })}
                          </span>
                          <span className="text-[12px] text-foreground">{item.label}</span>
                          {/* The active row keeps its menu action visible —
                              one more thing the rail has no room for. */}
                          {isActive && (
                            <span className="ml-auto text-muted-foreground">
                              {createElement(icons["more-vertical"], {
                                size: 14,
                                strokeWidth: 1.5,
                              })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {/* One hover on the trigger opens the peek; then the cursor is
              already picking a destination while the other panel is still
              waiting on tooltips. */}
          {!reduced && (
            <FakeCursor
              x={effective === "hover-0" ? 26 : engaged ? 72 : 210}
              y={effective === "hover-0" ? 26 : engaged ? 90 : 260}
            />
          )}
        </div>
        <CompareLabel>
          <span aria-hidden="true">✅</span> Peek on hover: the whole sidebar,
          one hover
        </CompareLabel>
      </div>
    </div>
  );
}

/** The comparison's frame: adds the play/pause playback button (the same
 *  header slot the thinking-steps demos use) so the loop can be held on any
 *  frame. */
function IconRailVsPeekDemo() {
  const [paused, setPaused] = useState(false);
  const PauseIcon = useIcon("pause");
  const PlayIcon = useIcon("play");
  return (
    <ComponentPreview
      code={noIconRailCode}
      padding="responsive"
      playbackButton={{
        icon: paused ? (
          <PlayIcon size={16} strokeWidth={1.5} />
        ) : (
          <PauseIcon size={16} strokeWidth={1.5} />
        ),
        tooltip: paused ? "Play" : "Pause",
        onClick: () => setPaused((v) => !v),
      }}
    >
      <IconRailVsPeekPreview paused={paused} />
    </ComponentPreview>
  );
}

// ── Icon alignment — measured guides ─────────────────────

// Thread rows: the same status-dot content the playground's first example
// shows (SIDEBAR_THREADS from demo-data).

const ALIGN_HEADER_ICONS: readonly { icon: IconName; label: string }[] = [
  { icon: "search", label: "Search" },
  { icon: "plus", label: "New thread" },
  { icon: "sliders-horizontal", label: "Filters" },
];

const ALIGN_FOOTER_ICONS: readonly { icon: IconName; label: string }[] = [
  { icon: "settings", label: "Settings" },
  { icon: "inbox", label: "Inbox" },
];

/** Icon alignment: header buttons, row action clusters and footer buttons
 *  all on the same vertical axes. The guides aren't drawn from constants —
 *  every icon's centre is MEASURED and each distinct axis gets a line, so
 *  the demo proves the rhythm rather than asserting it. One row keeps its
 *  cluster pinned visible (until the visitor's cursor takes over) so the
 *  guides visibly thread header, row and footer at once. */
function AlignmentPreview() {
  const icons = useIcons();
  const MoreIcon = useIcon("more-vertical");
  const [cursorInside, setCursorInside] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { amount: 0.5 });
  const [guides, setGuides] = useState<number[]>([]);

  useEffect(() => {
    const root = frameRef.current;
    if (!root) return;
    const measure = () => {
      const rootRect = root.getBoundingClientRect();
      const xs: number[] = [];
      // Each icon contributes both edges of its 24px slot (the size-6
      // button box, centred on the glyph), so every column reads as a pair
      // of rails around the button. Row icons are scoped to the Threads
      // group — the footer's user row carries an off-rhythm trailing
      // chevron that would draw near-miss lines.
      root
        .querySelectorAll(
          '[data-guide] svg, [data-guide-img], [data-sidebar="menu-action"] svg, [data-sidebar="group-action"] svg, [data-guide-rows] [data-sidebar="menu-button"] svg, [data-guide-rows] [data-sidebar="menu-button"] .size-2'
        )
        .forEach((el) => {
          const rect = el.getBoundingClientRect();
          const center = rect.left + rect.width / 2 - rootRect.left;
          xs.push(center - 12, center + 12);
        });
      xs.sort((a, b) => a - b);
      // Merge edges within 2px — hidden clusters overlay the visible one.
      const merged: number[] = [];
      for (const x of xs) {
        if (!merged.length || x - merged[merged.length - 1] > 2) merged.push(x);
      }
      setGuides(merged);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative w-full self-stretch"
      onMouseEnter={() => setCursorInside(true)}
      onMouseMove={() => setCursorInside(true)}
      onPointerDown={() => setCursorInside(true)}
      onMouseLeave={() => setCursorInside(false)}
    >
      <DemoRailShell>
        <SidebarHeader>
          <div className="flex items-center gap-1 pr-1.5">
            {/* The workspace dropdown, on the grid: tile nudged -ml-0.5 onto
                the leading axis, chevron in a -mr-0.5 24px slot — and the
                wrapper's -mr-1.5 puts that slot on the next 28px column
                beside the three buttons. */}
            <div className="min-w-0 flex-1 -mr-1.5">
              <SidebarMenu aria-label="Workspace">
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownTrigger
                      render={
                        <SidebarMenuButton aria-label="Switch workspace">
                          <span
                            aria-hidden
                            data-guide-img
                            className="-ml-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-foreground text-[10px] text-background"
                            style={{ fontVariationSettings: fontWeights.semibold }}
                          >
                            A
                          </span>
                          <span
                            className="min-w-0 truncate text-[13px] text-foreground"
                            style={{ fontVariationSettings: fontWeights.semibold }}
                          >
                            {AI_WORKSPACE}
                          </span>
                          <span
                            data-guide
                            className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center"
                          >
                            {createElement(icons["chevron-down"], {
                              size: 16,
                              strokeWidth: 1.5,
                              className: "text-muted-foreground",
                            })}
                          </span>
                        </SidebarMenuButton>
                      }
                    />
                    <DropdownContent
                      className="min-w-[240px] w-[var(--radix-dropdown-menu-trigger-width,var(--anchor-width))]"
                      align="start"
                      sideOffset={4}
                      checkedIndex={0}
                    >
                      <WorkspaceMenuItems />
                    </DropdownContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
            <div data-guide className="flex items-center gap-1">
              {ALIGN_HEADER_ICONS.map((entry) => (
                <Button
                  key={entry.label}
                  variant="ghost"
                  size="icon-compact"
                  aria-label={entry.label}
                  className="size-6 shrink-0"
                >
                  {createElement(icons[entry.icon])}
                </Button>
              ))}
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup collapsible data-guide-rows="">
            <SidebarGroupLabel>Threads</SidebarGroupLabel>
            {/* The section header's own actions sit on the same trailing
                axes as everything else. */}
            <SidebarGroupActions>
              <SidebarGroupAction aria-label="New thread">
                {createElement(icons.plus, {})}
              </SidebarGroupAction>
              <SidebarGroupAction aria-label="Filter threads">
                {createElement(icons["sliders-horizontal"], {})}
              </SidebarGroupAction>
              <SidebarGroupAction aria-label="More options">
                {createElement(icons["more-horizontal"], {})}
              </SidebarGroupAction>
            </SidebarGroupActions>
            <SidebarMenu>
              {/* Badges keep the rightmost slot; the hover cluster slides in
                  left of them. */}
              {SIDEBAR_THREADS.map((thread, i) => {
                const pinned = inView && !cursorInside && i === 1;
                return (
                  <SidebarMenuItem key={thread.label}>
                    {/* "active" implies the row-active treatment — mapped to
                        "unread" (same filled dot) so no page reads as
                        selected here. */}
                    <SidebarMenuButton
                      status={thread.status === "active" ? "unread" : thread.status}
                      className={pinned ? "bg-hover" : undefined}
                      style={
                        pinned
                          ? ({ "--row-gutter": "var(--row-gutter-hover)" } as CSSProperties)
                          : undefined
                      }
                    >
                      {thread.label}
                    </SidebarMenuButton>
                    {thread.badge && <SidebarMenuBadge>{thread.badge}</SidebarMenuBadge>}
                    <SidebarMenuActions
                      showOnHover
                      className={pinned ? "opacity-100" : undefined}
                    >
                      <SidebarMenuAction aria-label="Branch thread">
                        {createElement(icons["corner-down-right"], {})}
                      </SidebarMenuAction>
                      <SidebarMenuAction aria-label="Share thread">
                        {createElement(icons.link, {})}
                      </SidebarMenuAction>
                      <SidebarMenuAction aria-label="More options">
                        <MoreIcon />
                      </SidebarMenuAction>
                    </SidebarMenuActions>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {/* The header's inline pattern, mirrored: the user row keeps the
              leading run and the two icons sit past its chevron, on the
              same trailing axes as everything above. */}
          <div className="flex items-center gap-1 pr-1.5">
            {/* -mr-1.5 hands the row's trailing padding back to the rhythm,
                so its chevron slot lands on the next 28px column beside the
                icon buttons. */}
            <div className="min-w-0 flex-1 -mr-1.5">
              <DemoFooterUser />
            </div>
            <div data-guide className="flex items-center gap-1">
              {ALIGN_FOOTER_ICONS.map((entry) => (
                <Button
                  key={entry.label}
                  variant="ghost"
                  size="icon-compact"
                  aria-label={entry.label}
                  className="size-6 shrink-0"
                >
                  {createElement(icons[entry.icon])}
                </Button>
              ))}
            </div>
          </div>
        </SidebarFooter>
      </DemoRailShell>
      {/* One line per measured axis, on the accent so they read as guides,
          not chrome. */}
      {guides.map((x) => (
        <span
          key={x}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-20 w-px opacity-40"
          style={{ left: x - 0.5, backgroundColor: "var(--focus-ring, #6B97FF)" }}
        />
      ))}
    </div>
  );
}

/** Nesting: level 1 rows that own a level 2 sub-tree — an agent roster and
 *  the sources a retrieval agent reads, both open at once so the two levels
 *  can be seen holding their own highlights. */
function NestingPreview() {
  const icons = useIcons();
  // Recent's branches start open (level 2 on show); Private's and Shared's
  // start closed. No page is selected until the visitor picks one.
  const [open, setOpen] = useState<Record<string, boolean>>({
    Today: true,
    Yesterday: true,
  });
  const [current, setCurrent] = useState("");

  // One branch renderer for both sections — a parent row that folds its
  // children under it, chevron sprung 90° while open. Archive branches start
  // closed (absent from the `open` map).
  const renderBranch = (branch: (typeof WIKI_PRIVATE)[number]) => {
    // Coerce: a label absent from the map must read as CLOSED — an undefined
    // `open` would fall through to SidebarMenuSub's open-by-default.
    const isOpen = !!open[branch.label];
    return (
      <SidebarMenuItem key={branch.label}>
        <SidebarMenuButton
          className="group/parent-row"
          icon={icons[branch.icon]}
          onClick={() =>
            setOpen((prev) => ({ ...prev, [branch.label]: !prev[branch.label] }))
          }
          aria-expanded={isOpen}
          style={{ "--row-gutter": "var(--row-gutter-hover)" } as CSSProperties}
        >
          {branch.label}
          <span className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center">
            <motion.span
              className="inline-flex"
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={spring.fast}
            >
              {createElement(icons["chevron-right"], {
                size: 16,
                strokeWidth: 1.5,
                className: `text-muted-foreground transition-opacity duration-80 ${
                  isOpen
                    ? "opacity-0 group-hover/parent-row:opacity-100 group-focus-within/parent-row:opacity-100"
                    : "opacity-100"
                }`,
              })}
            </motion.span>
          </span>
        </SidebarMenuButton>

        <SidebarMenuSub open={isOpen}>
          {branch.children.map((child) => (
            <SidebarMenuSubItem key={child.label}>
              <SidebarMenuSubButton
                href="#"
                icon={icons[child.icon]}
                isActive={child.label === current}
                onClick={(event) => {
                  event.preventDefault();
                  setCurrent(child.label);
                }}
              >
                {child.label}
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </SidebarMenuItem>
    );
  };

  return (
    <DemoRailShell>
      <DemoHeader />
      <SidebarContent>
        {/* One wiki, three sections, one per state: Private folded to its
            label, Shared open with its branches closed, Recent fully open
            down to level 2 — the whole accordion range in one sidebar. */}
        <SidebarGroup collapsible defaultOpen={false}>
          <SidebarGroupLabel>Private</SidebarGroupLabel>
          <SidebarMenu>
            {WIKI_PRIVATE.map(renderBranch)}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup collapsible>
          <SidebarGroupLabel>Shared</SidebarGroupLabel>
          <SidebarMenu>
            {WIKI_SHARED.map(renderBranch)}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup collapsible>
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarMenu>
            {WIKI_RECENT.map(renderBranch)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </DemoRailShell>
  );
}

/** Actions & badges: everything a row and a section label can carry —
 *  status dots on assistant threads, counts, and the hover-revealed action
 *  cluster (branch / share / overflow menu, tooltipped) on every thread —
 *  inside the full shell, header and footer included, like the other
 *  examples. */
function ActionsPreview() {
  const icons = useIcons();
  const MoreIcon = useIcon("more-vertical");
  // Until the visitor's own cursor takes over, one row wears the hovered
  // state as the section's subject: hover bg, action cluster visible, and
  // the Branch tooltip pinned open — same hand-off the collapse demo uses
  // for its rail tooltip.
  const [cursorInside, setCursorInside] = useState(false);
  const SPOTLIGHT_INDEX = 3;
  // Pin only while the demo is actually on screen — a force-opened tooltip
  // whose anchor scrolls away gets shifted back into the viewport and reads
  // as a detached black chip over whatever section is there instead.
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { amount: 0.5 });
  // Portal the demo's tooltips into the frame itself (the /demo page's
  // pattern): a body-portaled tooltip chases its anchor a frame behind
  // during scroll, so the pinned chip visibly swims. In-flow, it just
  // scrolls with the page.
  const [frameEl, setFrameEl] = useState<HTMLElement | null>(null);

  // No Share here — it already sits on the row as a hover action.
  const threadMenu = (
    <DropdownContent className="min-w-[240px] w-[240px]" align="start" sideOffset={4}>
      <MenuItem index={0} icon={icons.pencil} label="Rename" onSelect={() => {}} />
      <MenuItem index={1} icon={icons.x} label="Delete" onSelect={() => {}} />
    </DropdownContent>
  );

  return (
    <div
      ref={(el) => {
        frameRef.current = el;
        setFrameEl(el);
      }}
      className="relative w-full self-stretch"
      // mousemove covers a pointer already resting inside at mount, and
      // pointerdown covers touch — otherwise the pinned hover could never
      // be handed off.
      onMouseEnter={() => setCursorInside(true)}
      onMouseMove={() => setCursorInside(true)}
      onPointerDown={() => setCursorInside(true)}
      onMouseLeave={() => setCursorInside(false)}
    >
      <TooltipPortalContainer value={frameEl}>
      <DemoRailShell>
        <DemoHeader />
        <SidebarContent>
          {/* A section label that collapses its rows and carries its own actions */}
          <SidebarGroup collapsible>
            <SidebarGroupLabel>Threads</SidebarGroupLabel>
            <SidebarGroupActions>
              <Tooltip content="New thread" side="top">
                <SidebarGroupAction aria-label="New thread">
                  {createElement(icons.plus, {})}
                </SidebarGroupAction>
              </Tooltip>
              <Tooltip content="Filter threads" side="top">
                <SidebarGroupAction aria-label="Filter threads">
                  {createElement(icons["sliders-horizontal"], {})}
                </SidebarGroupAction>
              </Tooltip>
            </SidebarGroupActions>
            <SidebarMenu>
              {/* Every thread carries the full cluster: branch, share, and the
                  overflow menu — the badge keeps the rightmost slot beside it.
                  The dropdown trigger goes without a tooltip, like every other
                  dropdown trigger in the sidebar. */}
              {AI_THREADS.map((thread, i) => {
                const pinned = inView && !cursorInside && i === SPOTLIGHT_INDEX;
                return (
                  <SidebarMenuItem key={thread.label}>
                    {/* "active" implies the row-active treatment — mapped to
                        "unread" here (same filled dot) so no page reads as
                        selected in this example. */}
                    <SidebarMenuButton
                      status={thread.status === "active" ? "unread" : thread.status}
                      className={pinned ? "bg-hover" : undefined}
                      // The wide gutter normally arrives with :hover — the
                      // pinned row opts in statically so the label truncates
                      // clear of the visible cluster instead of under it.
                      style={
                        pinned
                          ? ({ "--row-gutter": "var(--row-gutter-hover)" } as CSSProperties)
                          : undefined
                      }
                    >
                      {thread.label}
                    </SidebarMenuButton>
                    <SidebarMenuBadge>{thread.badge}</SidebarMenuBadge>
                    <SidebarMenuActions
                      showOnHover
                      className={pinned ? "opacity-100" : undefined}
                    >
                      <Tooltip
                        content="Branch thread"
                        side="top"
                        forceOpen={pinned || undefined}
                      >
                        {/* The tooltip's anchor also wears its own hover
                            treatment while pinned. */}
                        <SidebarMenuAction
                          aria-label="Branch thread"
                          className={pinned ? "bg-hover text-foreground" : undefined}
                        >
                          {createElement(icons["corner-down-right"], {})}
                        </SidebarMenuAction>
                      </Tooltip>
                      <Tooltip content="Share thread" side="top">
                        <SidebarMenuAction aria-label="Share thread">
                          {createElement(icons.link, {})}
                        </SidebarMenuAction>
                      </Tooltip>
                      <DropdownMenu>
                        <DropdownTrigger
                          render={
                            <SidebarMenuAction aria-label="More options">
                              <MoreIcon />
                            </SidebarMenuAction>
                          }
                        />
                        {threadMenu}
                      </DropdownMenu>
                    </SidebarMenuActions>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <DemoFooterUser />
        </SidebarFooter>
      </DemoRailShell>
      </TooltipPortalContainer>
    </div>
  );
}

/** The anchored callout — a Card on a surface one step above the rail.
 *  CardImage / CardMedia stay DIRECT children: Card finds the media by
 *  scanning its own children, and a fragment wrapper would hide it. */
function DemoCallout({ variant }: { variant: "banner" | "inline" }) {
  const substrate = useSurface();
  const shape = useShape();
  const icons = useIcons();
  // Dismiss really removes the card; the demo brings it back a beat later so
  // the section keeps its subject.
  const [dismissed, setDismissed] = useState(false);
  const dismiss = () => {
    setDismissed(true);
    setTimeout(() => setDismissed(false), 1600);
  };
  // Rests one step above the rail and rises another under the pointer, so the
  // card itself answers the hover rather than anything inside it.
  const level = Math.min(substrate + 1, 8);
  const surface = `${shape.container} overflow-hidden transition-[background-color,box-shadow] duration-80 ${surfaceClasses(
    level,
    2
  )} ${surfaceHoverClasses(
    level + 1,
    3
  )} shadow-[var(--shadow-2-inset)] hover:shadow-[var(--shadow-3-inset)]`;

  if (dismissed) return null;

  const card = (
    <Card
      size="compact"
      dismissible
      onDismiss={dismiss}
      href="/docs/sidebar"
      label={`${AI_CALLOUT.title} — ${AI_CALLOUT.media}`}
      className={`${surface}${variant === "inline" ? " min-h-0 pl-2.5" : ""}`}
    >
      {variant === "banner" ? (
        <CardImage src={BANNER} className="aspect-[2/1] max-h-28" />
      ) : (
        <CardMedia icon={icons.brain} size={18} />
      )}
      {/* The dismiss clearance is hover-only (Card pads the header while the
          ✕ is revealed), so the resting title keeps the full row. */}
      <CardHeader
        className={variant === "banner" ? "gap-0 pt-3" : "gap-[2px] py-3"}
      >
        <CardTitle className="truncate">{AI_CALLOUT.title}</CardTitle>
        <CardDescription className="truncate text-caption">
          {variant === "banner" ? AI_CALLOUT.media : AI_CALLOUT.icon}
        </CardDescription>
      </CardHeader>
    </Card>
  );

  return variant === "inline" ? (
    <CardGroup orientation="inline" proximityHover={false}>
      {card}
    </CardGroup>
  ) : (
    card
  );
}

/** Header, footer & callout: the two ends of the rail, stacked vertically —
 *  every element on its own full-width row — against the horizontal packing
 *  that collapses the same pieces into icon buttons. */
function HeaderFooterPreview({ stack }: { stack: "vertical" | "horizontal" }) {
  const icons = useIcons();
  const vertical = stack === "vertical";
  return (
    <DemoRailShell
      insetTitle={vertical ? "Vertical stacking" : "Horizontal stacking"}
    >
      <SidebarHeader>
        {vertical ? (
          <>
            <DemoHeaderRow />
            {/* Search and the action rows are ONE block: the header's gap-2
                separates it from the brand row, while inside it the search
                field reads as the list's first row (menu row rhythm). */}
            <div className="flex flex-col gap-0.5">
              <DemoSearch />
              <SidebarMenu aria-label="Header actions">
                <SidebarMenuItem>
                  <SidebarMenuButton icon={icons.plus}>
                    New thread
                    {/* Shortcut chip, revealed on row hover — a labeled row
                        wants no tooltip. */}
                    <span className="ml-auto inline-flex opacity-0 transition-opacity duration-80 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100">
                      <kbd className="font-sans text-[11px] text-muted-foreground">⇧⌘O</kbd>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1 pr-1.5">
            <div className="min-w-0 flex-1">
              <DemoHeaderRow />
            </div>
            <Tooltip content={tipWithShortcut("Search", SEARCH_SHORTCUT)} side="bottom">
              <Button variant="ghost" size="icon-compact" aria-label="Search" className="size-6 shrink-0">
                {createElement(icons.search, {})}
              </Button>
            </Tooltip>
            <Tooltip content={tipWithShortcut("New thread", "⇧⌘O")} side="bottom">
              <Button variant="ghost" size="icon-compact" aria-label="New thread" className="size-6 shrink-0">
                {createElement(icons.plus, {})}
              </Button>
            </Tooltip>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Threads</SidebarGroupLabel>
          <SidebarMenu>
            {AI_THREADS.slice(0, 3).map((thread) => (
              <SidebarMenuItem key={thread.label}>
                <SidebarMenuButton status={thread.status}>{thread.label}</SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <DemoCallout variant={vertical ? "banner" : "inline"} />
        {vertical ? (
          <>
            {/* Actions stack above the user row, so identity stays anchored
                to the sidebar's outer edge — mirroring the brand row up top. */}
            <SidebarMenu aria-label="Footer actions">
              <SidebarMenuItem>
                <SidebarMenuButton icon={icons.settings}>Settings</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton icon={icons.lightbulb}>What&apos;s new</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <DemoFooterUser />
          </>
        ) : (
          <div className="flex items-center gap-1 pr-1.5">
            <div className="min-w-0 flex-1">
              <DemoFooterUser />
            </div>
            <Button variant="ghost" size="icon-compact" aria-label="Settings" className="size-6 shrink-0">
              {createElement(icons.settings, {})}
            </Button>
          </div>
        )}
      </SidebarFooter>
    </DemoRailShell>
  );
}

// ── Playground ───────────────────────────────────────────

function SidebarPlaygroundSection() {
  return (
    <SidebarPlayground>
      {({ preview, controls, code }) => (
        <PlaygroundLayout
          controls={controls}
          preview={
            <ComponentPreview code={code} padding="none" minHeightClass={SHELL_HEIGHT}>
              {preview}
            </ComponentPreview>
          }
        />
      )}
    </SidebarPlayground>
  );
}

// ── Page ─────────────────────────────────────────────────

export default function SidebarDoc() {
  return (
    <DocPage
      title="Sidebar"
      description="A sidebar built from composable parts. Drag its edge to resize, collapse it away, and on mobile it becomes a drawer."
      slug="sidebar"
    >
      <DocSection title="Playground">
        <SidebarPlaygroundSection />
      </DocSection>

      <DocSection title="Layouts">
        <p className="text-body text-muted-foreground">
          One prop picks the shell: <code>sidebar</code> sits flush with the
          page, <code>floating</code> puts the rail in its own card,{" "}
          <code>inset</code> makes your content the card.
        </p>
        <ComponentPreview code={layoutsCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <DemoShell insetTitle="Sidebar — the default" />
        </ComponentPreview>
        <ComponentPreview code={layoutsCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <DemoShell variant="floating" insetTitle="Floating — the rail is the card" />
        </ComponentPreview>
        <ComponentPreview code={layoutsCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <DemoShell variant="inset" insetTitle="Inset — the main region is the card" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Nesting">
        <p className="text-body text-muted-foreground">
          2 levels of nesting, one section level and one parent level.
        </p>
        <ComponentPreview code={nestingCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <NestingPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Actions & badges">
        <p className="text-body text-muted-foreground">
          Add badge indicator and up to 3 actions. Actions show on hover so
          the label keeps maximum readability.
        </p>
        <ComponentPreview code={actionsCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <ActionsPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Header, footer & callout">
        <p className="text-body text-muted-foreground">
          Stack the header two ways: each element on its own row, or icon
          buttons beside the brand. The callout is a Card with an image or an
          icon.
        </p>
        <ComponentPreview code={headerFooterCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <HeaderFooterPreview stack="vertical" />
        </ComponentPreview>
        <ComponentPreview code={headerFooterCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <HeaderFooterPreview stack="horizontal" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Stacked callouts">
        <p className="text-body text-muted-foreground">
          Callouts stack into a pile — the front card leads, the rest peek
          out behind. Hover to fan them out; dismiss the front and the next
          steps up.
        </p>
        <ComponentPreview code={stackedCalloutCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <StackedCalloutPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Collapse, peek & resize">
        <p className="text-body text-muted-foreground">
          Toggle with the trigger, the rail (drag to resize, click to
          collapse), or the <code>[</code> key.{" "}
          <code>peek=&quot;hover&quot;</code> floats the collapsed sidebar out
          without pinning it. Width and state survive a reload.
        </p>
        <ComponentPreview code={collapseCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <CollapsePreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Why no icon rail?">
        <p className="text-body text-muted-foreground">
          Hot take baked into this component: there&apos;s no icon-only
          collapsed mode. On purpose.
        </p>
        <p className="text-body text-muted-foreground">
          Icon rails look tidy in screenshots but fail in use. Six ambiguous
          glyphs, and you suddenly need to tooltip most of them until
          you&apos;ve found the right one.
        </p>
        <p className="text-body text-muted-foreground">
          Nesting, section labels and complementary actions are impossible to
          reflect. It only benefits power users on simple sidebars — and
          it&apos;s your worst way to educate users.
        </p>
        <p className="text-body text-muted-foreground">
          Half a sidebar is confusing for everybody. Convert yours now.
        </p>
        <IconRailVsPeekDemo />
      </DocSection>

      <DocSection title="Icon alignment">
        <p className="text-body text-muted-foreground">
          One rhythm everywhere: 24px icon buttons whose centres land 26px
          from the sidebar&apos;s inner edge, 28px to the next column —
          header, row actions and footer alike. The guides are measured from
          the rendered icons, not drawn from constants.
        </p>
        <ComponentPreview
          code={alignmentCode}
          padding="none"
          minHeightClass={SHELL_HEIGHT}
        >
          <AlignmentPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — SidebarProvider">
        <PropsTable props={providerProps} />
      </DocSection>

      <DocSection title="API Reference — Sidebar">
        <PropsTable props={sidebarProps} />
      </DocSection>

      <DocSection title="API Reference — Sections">
        <PropsTable props={sectionProps} />
      </DocSection>

      <DocSection title="API Reference — Content level 1">
        <PropsTable props={level1Props} />
      </DocSection>

      <DocSection title="API Reference — Content level 2">
        <PropsTable props={level2Props} />
      </DocSection>
    </DocPage>
  );
}
