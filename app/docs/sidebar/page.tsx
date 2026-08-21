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
import { PlaygroundLayout } from "@/lib/docs/playground";
import { SidebarPlayground } from "@/lib/docs/playgrounds/sidebar";
import { WorkspaceMenuItems } from "@/lib/docs/workspace-demo";
import {
  SIDEBAR_GROUP_LABEL,
  SIDEBAR_ITEMS,
  SIDEBAR_PROJECTS,
} from "@/app/components/demo-data";

// ── Code snippets ────────────────────────────────────────

const basicCode = `import {
  SidebarProvider, Sidebar, SidebarTrigger, SidebarInset,
  SidebarHeader, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge,
} from "./components";

<SidebarProvider>
  <Sidebar>
    <SidebarHeader>{/* workspace row */}</SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => (
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
    <header>
      <SidebarTrigger />
    </header>
    {children}
  </SidebarInset>
</SidebarProvider>`;

const collapseCode = `// The bare "[" key toggles a left sidebar, "]" a right one (Provider's
// \`shortcut\` prop overrides, null disables). The rail handle on the
// sidebar's edge is built in: drag it to resize, click it to collapse.
// setOpen persists to the "sidebar_state" cookie — read it back in a
// server layout for a flicker-free default:
//
//   const cookieStore = await cookies();
//   const defaultOpen =
//     cookieStore.get("sidebar_state")?.value !== "false";
//   <SidebarProvider defaultOpen={defaultOpen}>…

<SidebarProvider>
  <Sidebar>
    <SidebarContent>…</SidebarContent>
  </Sidebar>
  <SidebarInset>
    <SidebarTrigger />
  </SidebarInset>
</SidebarProvider>`;

const floatingCode = `<Sidebar variant="floating">…</Sidebar>`;

const insetCode = `<Sidebar variant="inset">…</Sidebar>
// The inset variant pairs with SidebarInset, which renders the main
// region as an elevated card.`;





const rowAnatomyCode = `<SidebarMenu>
  <SidebarMenuItem>
    <SidebarMenuButton icon={HomeIcon} isActive>Home</SidebarMenuButton>
  </SidebarMenuItem>

  <SidebarMenuItem>
    <SidebarMenuButton icon={CalendarIcon}>Calendar</SidebarMenuButton>
    {/* Badge keeps the rightmost slot; the action reveals to its left */}
    <SidebarMenuBadge>5</SidebarMenuBadge>
    <SidebarMenuAction showOnHover aria-label="More options">
      <MoreIcon />
    </SidebarMenuAction>
  </SidebarMenuItem>

  {/* Status leads instead of an icon: active/unread fill the dot, idle
      rings it, and "unread" is announced to screen readers */}
  <SidebarMenuItem>
    <SidebarMenuButton status="unread">Dark mode token audit</SidebarMenuButton>
  </SidebarMenuItem>

  {/* More than one action: the cluster owns the row's gutter */}
  <SidebarMenuItem>
    <SidebarMenuButton icon={FolderIcon}>Design system</SidebarMenuButton>
    <SidebarMenuActions showOnHover>
      <SidebarMenuAction aria-label="Add"><PlusIcon /></SidebarMenuAction>
      <SidebarMenuAction aria-label="Rename"><PencilIcon /></SidebarMenuAction>
      <SidebarMenuAction aria-label="More options"><MoreIcon /></SidebarMenuAction>
    </SidebarMenuActions>
  </SidebarMenuItem>
</SidebarMenu>`;

const sectionsCode = `<SidebarContent>
  {/* collapsible turns the label into the section's accordion */}
  <SidebarGroup collapsible>
    <SidebarGroupLabel>Platform</SidebarGroupLabel>
    <SidebarGroupActions>
      <SidebarGroupAction aria-label="Add item"><PlusIcon /></SidebarGroupAction>
      <SidebarGroupAction aria-label="Section settings"><SlidersIcon /></SidebarGroupAction>
    </SidebarGroupActions>
    <SidebarMenu>…</SidebarMenu>
  </SidebarGroup>

  <SidebarSeparator />

  {/* Uncontrolled, starting closed; pass open/onOpenChange to own it */}
  <SidebarGroup collapsible defaultOpen={false}>
    <SidebarGroupLabel>Starts collapsed</SidebarGroupLabel>
    <SidebarMenu>…</SidebarMenu>
  </SidebarGroup>
</SidebarContent>`;

const nestingCode = `const [open, setOpen] = useState(true);

<SidebarMenuItem>
  <SidebarMenuButton
    icon={FolderIcon}
    onClick={() => setOpen((v) => !v)}
    aria-expanded={open}
  >
    Projects
    <ChevronIcon className={open ? "" : "-rotate-90"} />
  </SidebarMenuButton>

  {/* The row's own action — a child's hover never reveals it */}
  <SidebarMenuAction showOnHover aria-label="More options">
    <MoreIcon />
  </SidebarMenuAction>

  {/* Collapses on measured height, never an animated "auto" */}
  <SidebarMenuSub open={open}>
    {projects.map((p) => (
      <SidebarMenuSubItem key={p}>
        <SidebarMenuSubButton href="#" isActive={p === current}>
          {p}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    ))}
  </SidebarMenuSub>
</SidebarMenuItem>`;

const scrollEdgesCode = `{/* SidebarContent scrolls on its own: the viewport carries the
    scroll-fade mask and the frame draws the hairline, both driven by
    scroll timelines rather than a listener. Nothing to wire up. */}
<SidebarContent>
  <SidebarGroup>
    <SidebarGroupLabel>Platform</SidebarGroupLabel>
    <SidebarMenu>{/* more rows than the frame can hold */}</SidebarMenu>
  </SidebarGroup>
</SidebarContent>`;

const stateCode = `const [open, setOpen] = useState(true);

<SidebarProvider open={open} onOpenChange={setOpen} persist={false}>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          {loading
            ? items.map((item) => <SidebarMenuSkeleton key={item.label} showIcon />)
            : items.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton icon={item.icon}>{item.label}</SidebarMenuButton>
                </SidebarMenuItem>
              ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <SidebarInset>
    <CustomTrigger /> {/* useSidebar().toggleSidebar */}
  </SidebarInset>
</SidebarProvider>

function CustomTrigger() {
  const { toggleSidebar, state } = useSidebar();
  return <Button onClick={toggleSidebar}>Sidebar is {state}</Button>;
}`;

// ── Props tables ─────────────────────────────────────────
// Grouped the way the sidebar is built — shell, sections, rows — so a prop
// is where you'd look for the part it belongs to.

const providerProps: PropDef[] = [
  { name: "open", type: "boolean", description: "Controlled open state — pair with onOpenChange." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Fires when the trigger, rail, or shortcut wants to toggle." },
  { name: "defaultOpen", type: "boolean", default: "true", description: "Uncontrolled initial state. Read the sidebar_state cookie in a server layout to restore the last visit." },
  { name: "persist", type: "boolean", default: "true", description: "Write the desktop state to the sidebar_state cookie (7 days). Mobile sheet state never persists." },
  { name: "peek", type: '"none" | "hover" | "click"', default: '"none"', description: "What the collapsed edge does: an edge strip reveals the sidebar as a floating overlay, on hover or on click. Escape or an outside press dismisses; peeking never pins it or writes the cookie." },
  { name: "shortcut", type: "string | null", default: '"[" left · "]" right', description: "Bare-key toggle, side-aware; null disables. Focus-scoped: the innermost provider containing focus answers." },
  { name: "mobileBreakpoint", type: "number", default: "768", description: "Width (px) below which the sidebar becomes a modal sheet." },
  { name: "width / widthMobile", type: "string", default: '"16rem" / "18rem"', description: "Rail and sheet widths, also published as --sidebar-width and --sidebar-width-mobile." },
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
                  Acme Inc
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

function DemoMenu({ badges = true }: { badges?: boolean }) {
  const icons = useIcons();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{SIDEBAR_GROUP_LABEL}</SidebarGroupLabel>
      <SidebarMenu>
        {SIDEBAR_ITEMS.map((item) => (
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

/** What the inset shows depends on whether the sidebar is a rail or a sheet.
 *  Above the breakpoint it plays a page for the rail to sit beside. Below it
 *  the sheet covers the whole frame, so a mock page demonstrates nothing and
 *  the short stage is better spent on the one control that matters. Reads
 *  `isMobile` from the provider rather than a media query, so the swap lands
 *  exactly when the sheet does. */
function DemoInsetContent({
  title,
  triggerSide,
  header,
  mobileExtra,
}: {
  title?: ReactNode;
  triggerSide?: "left" | "right";
  /** Replaces the standard topbar on the desktop side. */
  header?: ReactNode;
  /** Controls a preview can't afford to lose when the topbar goes away. */
  mobileExtra?: ReactNode;
}) {
  const { isMobile, toggleSidebar } = useSidebar();

  if (isMobile) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
        <Button variant="secondary" onClick={toggleSidebar}>
          Open sidebar
        </Button>
        {mobileExtra}
      </div>
    );
  }

  return (
    <>
      {header ?? <DemoInsetHeader title={title} triggerSide={triggerSide} />}
      <DemoInsetBody />
    </>
  );
}

/** Standard demo shell: provider scoped to the frame, no cookie writes. The
 *  toggle key needs no opt-out: only the innermost provider containing focus
 *  answers a keypress (mounted-provider registry). */
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
      <SidebarProvider className="h-full min-h-0" persist={false}>
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
      </SidebarProvider>
    </SidebarShellFrame>
  );
}

// ── Section previews ─────────────────────────────────────

function CollapsePreview() {
  return (
    <SidebarShellFrame height={SHELL_HEIGHT}>
      <SidebarProvider className="h-full min-h-0" persist={false}>
        <Sidebar className="h-full">
          <DemoHeader />
          <SidebarContent>
            <DemoMenu />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-h-0">
          <DemoInsetContent
            title={
              <>
                Press <code>[</code> to toggle
              </>
            }
          />
        </SidebarInset>
      </SidebarProvider>
    </SidebarShellFrame>
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

/** Rows: what one can carry, and how the label yields room for it. */
function RowAnatomyPreview() {
  const icons = useIcons();
  const MoreIcon = useIcon("more-horizontal");
  const rowMenu = (
    <DropdownContent className="min-w-[240px] w-[240px]" align="start" sideOffset={4}>
      <MenuItem index={0} icon={icons.pencil} label="Rename" onSelect={() => {}} />
      <MenuItem index={1} icon={icons.link} label="Share" onSelect={() => {}} />
      <MenuItem index={2} icon={icons.x} label="Delete" onSelect={() => {}} />
    </DropdownContent>
  );
  return (
    <SidebarShellFrame height={SHELL_HEIGHT}>
      <SidebarProvider className="h-full min-h-0" persist={false}>
        <Sidebar collapsible="none" className="h-full">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Leading</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton icon={icons.home} isActive>
                    Home
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton icon={icons.inbox}>Inbox</SidebarMenuButton>
                  <SidebarMenuBadge>12</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  {/* Badge and action share the row: the badge keeps the
                      rightmost slot, the action reveals to its left. */}
                  <SidebarMenuButton icon={icons.calendar}>Calendar</SidebarMenuButton>
                  <SidebarMenuBadge>5</SidebarMenuBadge>
                  <DropdownMenu>
                    <DropdownTrigger
                      render={
                        <SidebarMenuAction showOnHover aria-label="More options">
                          <MoreIcon />
                        </SidebarMenuAction>
                      }
                    />
                    {rowMenu}
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Status instead of an icon</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton status="active">Sidebar component height</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton status="unread">Dark mode token audit</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton status="idle">Scrollbar fade regression</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>More than one action</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton icon={icons.folder}>Design system</SidebarMenuButton>
                  <SidebarMenuActions showOnHover>
                    <SidebarMenuAction aria-label="Add">
                      {createElement(icons.plus, {})}
                    </SidebarMenuAction>
                    <SidebarMenuAction aria-label="Rename">
                      {createElement(icons.pencil, {})}
                    </SidebarMenuAction>
                    <DropdownMenu>
                      <DropdownTrigger
                        render={
                          <SidebarMenuAction aria-label="More options">
                            <MoreIcon />
                          </SidebarMenuAction>
                        }
                      />
                      {rowMenu}
                    </DropdownMenu>
                  </SidebarMenuActions>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-h-0">
          <DemoInsetContent title="Hover a row" />
        </SidebarInset>
      </SidebarProvider>
    </SidebarShellFrame>
  );
}

/** Sections: collapsible labels and the actions that ride them. */
function SectionsPreview() {
  const icons = useIcons();
  const PlusIcon = useIcon("plus");
  const SlidersIcon = useIcon("sliders-horizontal");
  return (
    <SidebarShellFrame height={SHELL_HEIGHT}>
      <SidebarProvider className="h-full min-h-0" persist={false}>
        <Sidebar collapsible="none" className="h-full">
          <SidebarContent>
            <SidebarGroup collapsible>
              <SidebarGroupLabel>{SIDEBAR_GROUP_LABEL}</SidebarGroupLabel>
              <SidebarGroupActions>
                <SidebarGroupAction aria-label="Add item">
                  <PlusIcon />
                </SidebarGroupAction>
                <SidebarGroupAction aria-label="Section settings">
                  <SlidersIcon />
                </SidebarGroupAction>
              </SidebarGroupActions>
              <SidebarMenu>
                {SIDEBAR_ITEMS.slice(0, 3).map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton icon={icons[item.icon]} isActive={item.active}>
                      {item.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup collapsible defaultOpen={false}>
              <SidebarGroupLabel>Starts collapsed</SidebarGroupLabel>
              <SidebarMenu>
                {SIDEBAR_ITEMS.slice(3).map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton icon={icons[item.icon]}>{item.label}</SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Not collapsible</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton icon={icons.star}>Favorites</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-h-0">
          <DemoInsetContent title="Click a section label" />
        </SidebarInset>
      </SidebarProvider>
    </SidebarShellFrame>
  );
}

/** Nesting: a row that owns a sub-tree. */
function NestingPreview() {
  const icons = useIcons();
  const FolderIcon = useIcon("folder");
  const MoreIcon = useIcon("more-horizontal");
  const [open, setOpen] = useState(true);
  const [current, setCurrent] = useState<string>(SIDEBAR_PROJECTS[0]);
  return (
    <SidebarShellFrame height={SHELL_HEIGHT}>
      <SidebarProvider className="h-full min-h-0" persist={false}>
        <Sidebar collapsible="none" className="h-full">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{SIDEBAR_GROUP_LABEL}</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton icon={icons.inbox}>Inbox</SidebarMenuButton>
                  <SidebarMenuBadge>12</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="group/parent-row"
                    icon={FolderIcon}
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    style={
                      { "--row-gutter": "var(--row-gutter-hover)" } as CSSProperties
                    }
                  >
                    Projects
                    <span className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center">
                      {createElement(icons["chevron-down"], {
                        size: 16,
                        strokeWidth: 1.5,
                        className: `text-muted-foreground transition-[opacity,transform] duration-80 ${
                          open
                            ? "opacity-0 group-hover/parent-row:opacity-100 group-focus-within/parent-row:opacity-100"
                            : "-rotate-90 opacity-100"
                        }`,
                      })}
                    </span>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownTrigger
                      render={
                        <SidebarMenuAction showOnHover aria-label="More options">
                          <MoreIcon />
                        </SidebarMenuAction>
                      }
                    />
                    <DropdownContent className="min-w-[240px] w-[240px]" align="start" sideOffset={4}>
                      <MenuItem index={0} icon={icons.pencil} label="Rename" onSelect={() => {}} />
                      <MenuItem index={1} icon={icons.link} label="Share" onSelect={() => {}} />
                      <MenuItem index={2} icon={icons.x} label="Delete" onSelect={() => {}} />
                    </DropdownContent>
                  </DropdownMenu>
                  <SidebarMenuSub open={open}>
                    {SIDEBAR_PROJECTS.map((project) => (
                      <SidebarMenuSubItem key={project}>
                        <SidebarMenuSubButton
                          href="#"
                          isActive={project === current}
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrent(project);
                          }}
                        >
                          {project}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton icon={icons.star}>Favorites</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-h-0">
          <DemoInsetContent title="Hover the parent, then a child" />
        </SidebarInset>
      </SidebarProvider>
    </SidebarShellFrame>
  );
}

/** Scroll edges: enough rows to overflow, so the fade and hairline show. */
function ScrollEdgesPreview() {
  const icons = useIcons();
  const rows = Array.from({ length: 7 }, () => SIDEBAR_ITEMS).flat();
  return (
    <SidebarShellFrame height={SHELL_HEIGHT}>
      <SidebarProvider className="h-full min-h-0" persist={false}>
        <Sidebar collapsible="none" className="h-full">
          <DemoHeader search="below" />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{SIDEBAR_GROUP_LABEL}</SidebarGroupLabel>
              <SidebarMenu>
                {rows.map((item, i) => (
                  <SidebarMenuItem key={`${item.label}-${i}`}>
                    <SidebarMenuButton icon={icons[item.icon]}>{item.label}</SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <DemoFooterUser />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="min-h-0">
          <DemoInsetContent title="Scroll the rail" />
        </SidebarInset>
      </SidebarProvider>
    </SidebarShellFrame>
  );
}

function ControlledStateReadout() {
  const { state, toggleSidebar } = useSidebar();
  return (
    <Button variant="secondary" size="compact" onClick={toggleSidebar}>
      Sidebar is {state}
    </Button>
  );
}

/** State: what the rail shows before its data lands, and who owns open. */
function StatePreview() {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const icons = useIcons();
  return (
    <SidebarShellFrame height={SHELL_HEIGHT}>
      <SidebarProvider
        className="h-full min-h-0"
        persist={false}
        shortcut={null}
        open={open}
        onOpenChange={setOpen}
      >
        <Sidebar className="h-full">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{SIDEBAR_GROUP_LABEL}</SidebarGroupLabel>
              <SidebarMenu>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <SidebarMenuSkeleton key={i} showIcon />
                    ))
                  : SIDEBAR_ITEMS.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton icon={icons[item.icon]} isActive={item.active}>
                          {item.label}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-h-0">
          <DemoInsetContent
            header={
              <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2">
                <ControlledStateReadout />
                <Button variant="secondary" size="compact" onClick={() => setLoading((v) => !v)}>
                  {loading ? "Show rows" : "Show skeletons"}
                </Button>
              </header>
            }
            mobileExtra={
              <>
                <ControlledStateReadout />
                <Button variant="secondary" size="compact" onClick={() => setLoading((v) => !v)}>
                  {loading ? "Show rows" : "Show skeletons"}
                </Button>
              </>
            }
          />
        </SidebarInset>
      </SidebarProvider>
    </SidebarShellFrame>
  );
}

export default function SidebarDoc() {
  return (
    <DocPage
      title="Sidebar"
      description="An app-shell sidebar that collapses offcanvas, resizes from its edge, and becomes a sheet on mobile. One highlight travels between rows instead of many flashing on and off."
      slug="sidebar"
    >
      <DocSection title="Playground">
        <SidebarPlaygroundSection />
      </DocSection>

      <DocSection title="Basic">
        <ComponentPreview code={basicCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <DemoShell />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Collapse & trigger">
        <p className="text-body text-muted-foreground">
          Three ways to toggle: the trigger, the rail on the sidebar&apos;s edge (drag
          to resize, click to collapse), and the <code>[</code> key — <code>]</code> for
          a right sidebar. The key goes to the sidebar that has focus. State persists
          to a cookie.
        </p>
        <ComponentPreview code={collapseCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <CollapsePreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Floating">
        <p className="text-body text-muted-foreground">
          Elevate the sidebar. The rail floats as its own card over the canvas —
          use it when navigation should read as a distinct layer.
        </p>
        <ComponentPreview code={floatingCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <DemoShell height={SHELL_HEIGHT} variant="floating" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Inset">
        <p className="text-body text-muted-foreground">
          Elevate the content. The main region becomes the card while the sidebar
          recedes into the canvas — use it when the content is the star.
        </p>
        <ComponentPreview code={insetCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <DemoShell height={SHELL_HEIGHT} variant="inset" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Row anatomy">
        <p className="text-body text-muted-foreground">
          A row leads with an icon or a status dot, and can carry a badge, one
          action, or a cluster of them. Hover-revealed actions cost the label
          nothing at rest: the row reserves their width only while they show,
          so the label runs full width until you reach for something.
        </p>
        <ComponentPreview code={rowAnatomyCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <RowAnatomyPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Sections">
        <p className="text-body text-muted-foreground">
          A section label can be the accordion that collapses everything under
          it, and can carry its own actions. Hover raises the label&apos;s
          contrast and reveals its chevron; collapsed, the chevron stays as the
          cue to reopen.
        </p>
        <ComponentPreview code={sectionsCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <SectionsPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Nesting">
        <p className="text-body text-muted-foreground">
          A row can own a sub-tree, collapsing on its measured height rather
          than an animated <code>auto</code>. Its chevron and actions answer to
          the row itself — hovering a child never lights the parent&apos;s
          controls — and the sub-menu runs its own highlight, so the two levels
          never fight over which row is lit.
        </p>
        <ComponentPreview code={nestingCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <NestingPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Scroll edges">
        <p className="text-body text-muted-foreground">
          When the rail outgrows its frame the content dissolves at the edge it
          continues past, and a hairline marks the boundary. Both are
          scroll-driven CSS — no listener, no measurement — and the true start
          and end stay crisp until there is something to scroll to.
        </p>
        <ComponentPreview code={scrollEdgesCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <ScrollEdgesPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="State">
        <p className="text-body text-muted-foreground">
          Skeleton rows hold the shape while data lands — their widths are
          deterministic, so the server and client agree. Open state can stay
          uncontrolled, or you can own it and read it back through{" "}
          <code>useSidebar</code>.
        </p>
        <ComponentPreview code={stateCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <StatePreview />
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
