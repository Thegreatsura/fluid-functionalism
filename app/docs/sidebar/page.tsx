"use client";

import { createElement, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarInput,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
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
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/flavored/sidebar";
import { Button } from "@/registry/radix/button";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
} from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { useIcons, useIcon } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { fontWeights } from "@/lib/font-weight";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { useNarrowFrame } from "@/lib/use-narrow-frame";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { SidebarPlayground } from "@/lib/docs/playgrounds/sidebar";
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
import { useSurface } from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";
import {
  AI_CALLOUT,
  AI_NAV,
  AI_RUNS,
  AI_SOURCES,
  AI_THREADS,
  AI_TREE,
  AI_WORKSPACE,
} from "./example-data";

// ── Code snippets ────────────────────────────────────────

const layoutsCode = `import {
  SidebarProvider, Sidebar, SidebarTrigger, SidebarInset,
  SidebarHeader, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge,
} from "./components";

// variant is the only thing that changes between the three:
//   "sidebar"  — flush rail, the default
//   "floating" — the rail is its own card over the canvas
//   "inset"    — the MAIN region is the card; the rail recedes
<SidebarProvider>
  <Sidebar variant="inset">
    <SidebarHeader>{/* workspace row */}</SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarMenu>
          {nav.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton icon={item.icon} isActive={item.active}>
                {item.label}
              </SidebarMenuButton>
              {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
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
    <ChevronIcon className={open === "Agents" ? "" : "-rotate-90"} />
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
        {agent.badge && <SidebarMenuBadge>{agent.badge}</SidebarMenuBadge>}
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
        rings it, and "unread" is announced to screen readers */}
    <SidebarMenuItem>
      <SidebarMenuButton status="active">Summarise the Q3 board deck</SidebarMenuButton>
      <SidebarMenuBadge>12</SidebarMenuBadge>
    </SidebarMenuItem>

    {/* Badge keeps the rightmost slot; the action reveals to its left */}
    <SidebarMenuItem>
      <SidebarMenuButton status="unread">Migration plan for Postgres 16</SidebarMenuButton>
      <SidebarMenuBadge>4</SidebarMenuBadge>
      <SidebarMenuAction showOnHover aria-label="More options"><MoreIcon /></SidebarMenuAction>
    </SidebarMenuItem>

    {/* More than one action: the cluster owns the row's gutter */}
    <SidebarMenuItem>
      <SidebarMenuButton status="idle">Rewrite the onboarding emails</SidebarMenuButton>
      <SidebarMenuActions showOnHover>
        <SidebarMenuAction aria-label="Branch"><CornerIcon /></SidebarMenuAction>
        <SidebarMenuAction aria-label="Share"><LinkIcon /></SidebarMenuAction>
        <SidebarMenuAction aria-label="More options"><MoreIcon /></SidebarMenuAction>
      </SidebarMenuActions>
    </SidebarMenuItem>

    {/* Widths are deterministic, so the server and client agree */}
    {indexing && <SidebarMenuSkeleton showIcon />}
  </SidebarMenu>
</SidebarGroup>`;

const headerFooterCode = `{/* Vertical: every element gets its own full-width row */}
<SidebarHeader>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownTrigger render={<SidebarMenuButton>Aurora AI</SidebarMenuButton>} />
    </SidebarMenuItem>
  </SidebarMenu>
  <SidebarInput placeholder="Search threads…" />
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton icon={PlusIcon}>New thread</SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarHeader>

{/* Horizontal is the same pieces sharing the brand's line as icon buttons:
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">{brandRow}</div>
        <Button variant="ghost" size="icon-compact" aria-label="Search">…
*/}

<SidebarFooter>
  {/* Anchored callout: a Card on a surface one step above the rail */}
  <Card size="compact" href="/docs/sidebar" label="Aurora 2 is here">
    <CardImage src={banner} className="aspect-[2/1] max-h-28" />
    <CardHeader className="gap-0 pt-4">
      <CardTitle>Aurora 2 is here</CardTitle>
      <CardDescription>Longer context, faster agents</CardDescription>
    </CardHeader>
  </Card>

  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownTrigger render={<SidebarMenuButton>Micka Touillaud</SidebarMenuButton>} />
    </SidebarMenuItem>
    <SidebarMenuItem>
      <SidebarMenuButton icon={SettingsIcon}>Settings</SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarFooter>`;

const collapseCode = `// The bare "[" key toggles a left sidebar, "]" a right one (Provider's
// \`shortcut\` prop overrides, null disables). The rail handle on the
// sidebar's edge is built in: drag it to resize, click it to collapse.
// \`peek\` gives the collapsed edge a hover or click strip that floats the
// rail back as an overlay without pinning it.
// setOpen persists to the "sidebar_state" cookie — read it back in a
// server layout for a flicker-free default:
//
//   const cookieStore = await cookies();
//   const defaultOpen =
//     cookieStore.get("sidebar_state")?.value !== "false";
//   <SidebarProvider defaultOpen={defaultOpen}>…

<SidebarProvider peek="hover">
  <Sidebar>
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

// ── Props tables ─────────────────────────────────────────
// Grouped the way the sidebar is built — shell, sections, rows — so a prop
// is where you'd look for the part it belongs to.

const providerProps: PropDef[] = [
  { name: "open", type: "boolean", description: "Controlled open state — pair with onOpenChange." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Fires when the trigger, rail, or shortcut wants to toggle." },
  { name: "defaultOpen", type: "boolean", default: "true", description: "Uncontrolled initial state. Read the sidebar_state cookie in a server layout to restore the last visit." },
  { name: "persist", type: "boolean", default: "true", description: "Write the desktop state to the sidebar_state cookie (7 days). Mobile drawer state never persists." },
  { name: "peek", type: '"none" | "hover" | "click"', default: '"none"', description: "What the collapsed edge does: an edge strip reveals the sidebar as a floating overlay, on hover or on click. Escape or an outside press dismisses; peeking never pins it or writes the cookie." },
  { name: "shortcut", type: "string | null", default: '"[" left · "]" right', description: "Bare-key toggle, side-aware; null disables. Focus-scoped: the innermost provider containing focus answers." },
  { name: "mobileBreakpoint", type: "number", default: "768", description: "Width (px) below which the sidebar becomes a modal drawer." },
  { name: "width / widthMobile", type: "string", default: '"16rem" / "18rem"', description: "Rail and drawer widths, also published as --sidebar-width and --sidebar-width-mobile." },
];

const sidebarProps: PropDef[] = [
  { name: "variant", type: '"sidebar" | "floating" | "inset"', default: '"sidebar"', description: "Transparent rail, elevated floating card, or the inset pairing where SidebarInset becomes the card." },
  { name: "collapsible", type: '"offcanvas" | "none"', default: '"offcanvas"', description: "Offcanvas slides the rail away; none renders a static, always-open column. (The icon-rail mode is intentionally not supported.)" },
  { name: "rail", type: "boolean", default: "true", description: "The built-in resize/collapse handle: drag to resize (192–360px), click to collapse, drag past the minimum to collapse. false hides it; the trigger and shortcut still toggle." },
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

/** Every preview stage on this page. 640px gives the rail room to be a rail;
 *  below the sheet breakpoint there is no rail on screen, so the stage drops
 *  to roughly square rather than leaving a phone-height column of mock page. */
const SHELL_HEIGHT = "h-[360px] md:h-[640px]";

/** Bounded app-shell frame every preview runs inside — the provider fills it
 *  instead of the viewport. */
function SidebarShellFrame({
  height = SHELL_HEIGHT,
  children,
}: {
  height?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative flex w-full overflow-hidden bg-background ${height}`}
    >
      {children}
    </div>
  );
}

function DemoHeaderRow() {
  const ChevronDown = useIcon("chevron-down");
  const shape = useShape();
  return (
    <SidebarMenu aria-label="Workspace">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownTrigger
            render={
              <SidebarMenuButton aria-label="Switch workspace">
                <span
                  className={`flex size-5 shrink-0 items-center justify-center bg-foreground text-[10px] text-background ${
                    shape.bgRadius >= 20 ? "rounded-full" : "rounded-md"
                  }`}
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
                <span className="ml-auto inline-flex">
                  <ChevronDown size={14} strokeWidth={1.5} className="text-muted-foreground" />
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

function DemoSearch() {
  const SearchIcon = useIcon("search");
  return (
    <div className="relative">
      <SearchIcon
        size={14}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <SidebarInput placeholder="Search…" aria-label="Search" className="pl-8" />
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
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">
            <DemoHeaderRow />
          </div>
          <Button
            variant="ghost"
            size="icon-compact"
            aria-label="Search"
            className="shrink-0"
          >
            <SearchIcon />
          </Button>
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
                <Image
                  src="/micka.png"
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 shrink-0 rounded-full"
                />
                <span className="min-w-0 truncate text-[13px] text-foreground">Micka Touillaud</span>
                <span className="ml-auto inline-flex">
                  <ChevronsUpDown size={14} strokeWidth={1.5} className="text-muted-foreground" />
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

/** The product's top-level nav — Chat, Agents, Knowledge, Runs, Evals. */
function DemoMenu({ badges = true }: { badges?: boolean }) {
  const icons = useIcons();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {AI_NAV.map((item) => (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton icon={icons[item.icon]} isActive={item.active}>
              {item.label}
            </SidebarMenuButton>
            {badges && item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function DemoInsetHeader({
  title = "Dashboard",
  triggerSide = "left",
}: {
  title?: ReactNode;
  triggerSide?: "left" | "right";
}) {
  // A right-hand sidebar puts its trigger at the bar's far end; the trigger
  // icon mirrors the side by itself.
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2">
      {triggerSide === "left" && <SidebarTrigger />}
      <span className="text-[13px] text-muted-foreground">{title}</span>
      {triggerSide === "right" && <SidebarTrigger className="ml-auto" />}
    </header>
  );
}

function DemoInsetBody() {
  return (
    <div className="flex flex-col gap-3 px-2 py-4">
      <div className="h-4 w-2/3 rounded-md bg-hover" />
      <div className="h-4 w-1/2 rounded-md bg-hover" />
      <div className="h-24 rounded-lg bg-hover" />
    </div>
  );
}

/** Two examples are *about* the rail-and-main pairing, so they keep both
 *  halves at every width — the rail just narrows to leave the main region
 *  something to be. The other three are rail-only and never render this. */
function DemoInsetContent({
  title,
  triggerSide,
}: {
  title?: ReactNode;
  triggerSide?: "left" | "right";
}) {
  return (
    <>
      <DemoInsetHeader title={title} triggerSide={triggerSide} />
      <DemoInsetBody />
    </>
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
  insetTitle: ReactNode;
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
  height,
  side,
  variant,
  sidebarChildren,
  insetTitle,
}: {
  height?: string;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  sidebarChildren?: ReactNode;
  insetTitle?: ReactNode;
}) {
  return (
    <SidebarShellFrame height={height}>
      <DemoProvider narrowWidth="11rem">
        <Sidebar side={side} variant={variant} className="h-full">
          {sidebarChildren ?? (
            <>
              <DemoHeader />
              <SidebarContent>
                <DemoMenu />
              </SidebarContent>
              <SidebarFooter>
                <DemoFooterUser />
              </SidebarFooter>
            </>
          )}
        </Sidebar>
        {/* The floating card sits in a p-2 gutter — pad the main region's
            top so its header lines up with the card's. The inset variant's
            main is itself the card (own m-2), so it needs no extra padding. */}
        <SidebarInset className={variant === "floating" ? "min-h-0 pt-2" : "min-h-0"}>
          <DemoInsetContent title={insetTitle} triggerSide={side} />
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

/** Collapse, peek & resize: the whole shell, since collapsing is about what
 *  the main region does with the space. */
function CollapsePreview() {
  return (
    <SidebarShellFrame>
      <DemoProvider narrowWidth="11rem" peek="hover">
        <Sidebar className="h-full">
          <DemoHeader />
          <SidebarContent>
            <DemoMenu />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-h-0">
          <DemoInsetContent title={<SidebarStateReadout />} />
        </SidebarInset>
      </DemoProvider>
    </SidebarShellFrame>
  );
}

/** Nesting: level 1 rows that own a level 2 sub-tree — an agent roster and
 *  the sources a retrieval agent reads, both open at once so the two levels
 *  can be seen holding their own highlights. */
function NestingPreview() {
  const icons = useIcons();
  const MoreIcon = useIcon("more-horizontal");
  const [open, setOpen] = useState<Record<string, boolean>>({
    Agents: true,
    Knowledge: true,
  });
  const [current, setCurrent] = useState("Support triage");

  return (
    <DemoRailShell insetTitle="Open a branch, then a child">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton icon={icons["message-circle"]}>Chat</SidebarMenuButton>
              <SidebarMenuBadge>3</SidebarMenuBadge>
            </SidebarMenuItem>

            {AI_TREE.map((branch) => {
              const isOpen = open[branch.label];
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
                      {createElement(icons["chevron-down"], {
                        size: 16,
                        strokeWidth: 1.5,
                        className: `text-muted-foreground transition-[opacity,transform] duration-80 ${
                          isOpen
                            ? "opacity-0 group-hover/parent-row:opacity-100 group-focus-within/parent-row:opacity-100"
                            : "-rotate-90 opacity-100"
                        }`,
                      })}
                    </span>
                  </SidebarMenuButton>

                  {/* The row's own action — a child's hover never reveals it */}
                  <DropdownMenu>
                    <DropdownTrigger
                      render={
                        <SidebarMenuAction showOnHover aria-label={`${branch.label} options`}>
                          <MoreIcon />
                        </SidebarMenuAction>
                      }
                    />
                    <DropdownContent className="min-w-[240px] w-[240px]" align="start" sideOffset={4}>
                      <MenuItem index={0} icon={icons.plus} label="New" onSelect={() => {}} />
                      <MenuItem index={1} icon={icons.pencil} label="Rename" onSelect={() => {}} />
                      <MenuItem index={2} icon={icons.x} label="Delete" onSelect={() => {}} />
                    </DropdownContent>
                  </DropdownMenu>

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
                        {child.badge && <SidebarMenuBadge>{child.badge}</SidebarMenuBadge>}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              );
            })}

            <SidebarMenuItem>
              <SidebarMenuButton icon={icons.check}>Evals</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </DemoRailShell>
  );
}

/** Actions & badges: everything a row and a section label can carry —
 *  status dots on assistant threads, counts, hover-revealed actions, an
 *  action cluster, scores in the badge slot, and skeletons while sources
 *  index. */
function ActionsPreview() {
  const icons = useIcons();
  const MoreIcon = useIcon("more-horizontal");
  const [indexing, setIndexing] = useState(true);

  const threadMenu = (
    <DropdownContent className="min-w-[240px] w-[240px]" align="start" sideOffset={4}>
      <MenuItem index={0} icon={icons.pencil} label="Rename" onSelect={() => {}} />
      <MenuItem index={1} icon={icons.link} label="Share" onSelect={() => {}} />
      <MenuItem index={2} icon={icons.x} label="Delete" onSelect={() => {}} />
    </DropdownContent>
  );

  return (
    <DemoRailShell insetTitle="Hover a row — tap on touch">
      <SidebarContent>
        {/* A section label that collapses its rows and carries its own actions */}
        <SidebarGroup collapsible>
          <SidebarGroupLabel>Threads</SidebarGroupLabel>
          <SidebarGroupActions>
            <SidebarGroupAction aria-label="New thread">
              {createElement(icons.plus, {})}
            </SidebarGroupAction>
            <SidebarGroupAction aria-label="Filter threads">
              {createElement(icons["sliders-horizontal"], {})}
            </SidebarGroupAction>
          </SidebarGroupActions>
          <SidebarMenu>
            {AI_THREADS.map((thread, i) => (
              <SidebarMenuItem key={thread.label}>
                <SidebarMenuButton status={thread.status}>{thread.label}</SidebarMenuButton>
                {thread.badge && <SidebarMenuBadge>{thread.badge}</SidebarMenuBadge>}
                {/* One action beside a badge; the cluster on the last row */}
                {i === AI_THREADS.length - 1 ? (
                  <SidebarMenuActions showOnHover>
                    <SidebarMenuAction aria-label="Branch thread">
                      {createElement(icons["corner-down-right"], {})}
                    </SidebarMenuAction>
                    <SidebarMenuAction aria-label="Share thread">
                      {createElement(icons.link, {})}
                    </SidebarMenuAction>
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
                ) : (
                  i === 1 && (
                    <DropdownMenu>
                      <DropdownTrigger
                        render={
                          <SidebarMenuAction showOnHover aria-label="More options">
                            <MoreIcon />
                          </SidebarMenuAction>
                        }
                      />
                      {threadMenu}
                    </DropdownMenu>
                  )
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* The badge slot holds a result as readily as a count */}
        <SidebarGroup>
          <SidebarGroupLabel>Eval runs</SidebarGroupLabel>
          <SidebarMenu>
            {AI_RUNS.map((run) => (
              <SidebarMenuItem key={run.label}>
                <SidebarMenuButton icon={icons[run.icon]}>{run.label}</SidebarMenuButton>
                <SidebarMenuBadge>{run.badge}</SidebarMenuBadge>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Sources</SidebarGroupLabel>
          <SidebarGroupActions>
            <SidebarGroupAction
              aria-label={indexing ? "Show indexed sources" : "Show indexing"}
              onClick={() => setIndexing((v) => !v)}
            >
              {createElement(icons["rotate-ccw"], {})}
            </SidebarGroupAction>
          </SidebarGroupActions>
          <SidebarMenu>
            {indexing
              ? AI_SOURCES.map((source) => (
                  <SidebarMenuSkeleton key={source.label} showIcon />
                ))
              : AI_SOURCES.map((source) => (
                  <SidebarMenuItem key={source.label}>
                    <SidebarMenuButton icon={icons[source.icon]}>
                      {source.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </DemoRailShell>
  );
}

/** The anchored callout — a Card on a surface one step above the rail.
 *  CardImage / CardMedia stay DIRECT children: Card finds the media by
 *  scanning its own children, and a fragment wrapper would hide it. */
function DemoCallout({ variant }: { variant: "media" | "icon" }) {
  const substrate = useSurface();
  const shape = useShape();
  const icons = useIcons();
  const surface = `${shape.container} overflow-hidden ${surfaceClasses(
    Math.min(substrate + 1, 8),
    2
  )}`;

  const card = (
    <Card
      size="compact"
      href="/docs/sidebar"
      label={`${AI_CALLOUT.title} — ${AI_CALLOUT.media}`}
      className={`${surface}${variant === "icon" ? " min-h-0 pl-2.5" : ""}`}
    >
      {variant === "media" ? (
        <CardImage src={BANNER} className="aspect-[2/1] max-h-28" />
      ) : (
        <CardMedia icon={icons.brain} size={18} />
      )}
      <CardHeader className={variant === "media" ? "gap-0 pt-4" : "gap-0 py-3"}>
        <CardTitle className="truncate">{AI_CALLOUT.title}</CardTitle>
        <CardDescription className="truncate">
          {variant === "media" ? AI_CALLOUT.media : AI_CALLOUT.icon}
        </CardDescription>
      </CardHeader>
    </Card>
  );

  return variant === "icon" ? (
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
            <DemoSearch />
            <SidebarMenu aria-label="Header actions">
              <SidebarMenuItem>
                <SidebarMenuButton icon={icons.plus}>New thread</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        ) : (
          <div className="flex items-center gap-1">
            <div className="min-w-0 flex-1">
              <DemoHeaderRow />
            </div>
            <Button variant="ghost" size="icon-compact" aria-label="Search" className="shrink-0">
              {createElement(icons.search, {})}
            </Button>
            <Button variant="ghost" size="icon-compact" aria-label="New thread" className="shrink-0">
              {createElement(icons.plus, {})}
            </Button>
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
        <DemoCallout variant={vertical ? "media" : "icon"} />
        {vertical ? (
          <>
            <DemoFooterUser />
            <SidebarMenu aria-label="Footer actions">
              <SidebarMenuItem>
                <SidebarMenuButton icon={icons.settings}>Settings</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton icon={icons.lightbulb}>What&apos;s new</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        ) : (
          <div className="flex items-center gap-1">
            <div className="min-w-0 flex-1">
              <DemoFooterUser />
            </div>
            <Button variant="ghost" size="icon-compact" aria-label="Settings" className="shrink-0">
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
      description="A refined, composable sidebar that collapses offcanvas, resizes from its edge, and becomes a drawer on mobile."
      slug="sidebar"
    >
      <DocSection title="Playground">
        <SidebarPlaygroundSection />
      </DocSection>

      <DocSection title="Layouts">
        <p className="text-body text-muted-foreground">
          One prop, three app shells. <code>sidebar</code> is a flush rail
          against the canvas; <code>floating</code> lifts the rail into its own
          card, for when navigation should read as a distinct layer;{" "}
          <code>inset</code> does the opposite and makes the main region the
          card, for when the content is the star. Everything else below —
          content, header, footer — is identical in all three.
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
          A level 1 row can own a level 2 sub-tree — here an agent roster and
          the sources behind a retrieval agent, both open at once. The sub-tree
          collapses on its measured height rather than an animated{" "}
          <code>auto</code>. A parent&apos;s chevron and actions answer to the
          row itself, so hovering a child never lights them, and each sub-menu
          runs its own highlight: the two levels never fight over which row is
          lit. Two levels is the whole vocabulary — deeper trees belong in the
          main region, not the rail.
        </p>
        <ComponentPreview code={nestingCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <NestingPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Actions & badges">
        <p className="text-body text-muted-foreground">
          A row leads with an icon or a status dot and can carry a badge, one
          action, or a cluster of them. Hover-revealed actions cost the label
          nothing at rest: the row reserves their width only while they show.
          The badge slot takes a result as readily as a count, section labels
          carry actions of their own and collapse everything under them, and
          skeleton rows hold the shape while data lands — their widths are
          deterministic, so the server and client agree.
        </p>
        <ComponentPreview code={actionsCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <ActionsPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Header, footer & callout">
        <p className="text-body text-muted-foreground">
          Both ends of the rail take the same pieces in two packings. Vertical
          gives each element its own full-width row — brand, search, a primary
          action, then a user row and settings beneath a callout. Horizontal
          collapses the extras into icon buttons sharing the brand&apos;s line,
          buying back two rows of height. The callout is a Card on a surface one
          step above the rail, with media or an inline icon.
        </p>
        <ComponentPreview code={headerFooterCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <HeaderFooterPreview stack="vertical" />
        </ComponentPreview>
        <ComponentPreview code={headerFooterCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <HeaderFooterPreview stack="horizontal" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Collapse, peek & resize">
        <p className="text-body text-muted-foreground">
          Three ways to toggle: the trigger, the rail on the sidebar&apos;s edge
          (drag to resize, click to collapse), and the <code>[</code> key —{" "}
          <code>]</code> for a right sidebar. The key goes to the sidebar that
          has focus. This one also sets <code>peek=&quot;hover&quot;</code>:
          collapsed, its edge floats the rail back as an overlay without pinning
          it or writing the cookie. State otherwise persists to a cookie.
        </p>
        <ComponentPreview code={collapseCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <CollapsePreview />
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
