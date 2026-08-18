"use client";

import { useState, type ReactNode } from "react";
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
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
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

const rightSideCode = `<SidebarProvider>
  <Sidebar side="right">…</Sidebar>
  <SidebarInset>
    <header>
      …
      {/* trigger shows the right-panel icon automatically */}
      <SidebarTrigger className="ml-auto" />
    </header>
  </SidebarInset>
</SidebarProvider>
// Flex order handles the side — Sidebar can stay first in the JSX,
// and the "]" key becomes the default toggle.`;

const floatingCode = `<Sidebar variant="floating">…</Sidebar>`;

const insetCode = `<Sidebar variant="inset">…</Sidebar>
// The inset variant pairs with SidebarInset, which renders the main
// region as an elevated card.`;

const groupsCode = `<SidebarContent>
  <SidebarGroup>
    <SidebarGroupLabel>Platform</SidebarGroupLabel>
    {/* 1–3 header actions, clustered on the label row */}
    <SidebarGroupActions>
      <SidebarGroupAction aria-label="Add project" onClick={addProject}>
        <PlusIcon />
      </SidebarGroupAction>
      <SidebarGroupAction aria-label="More options">
        <MoreIcon />
      </SidebarGroupAction>
    </SidebarGroupActions>
    <SidebarGroupContent>
      <SidebarMenu>…</SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
  <SidebarSeparator />
  {/* collapsible: the label becomes the group's accordion toggle —
      hover raises its contrast and reveals a chevron */}
  <SidebarGroup collapsible>
    <SidebarGroupLabel>Workspace</SidebarGroupLabel>
    <SidebarMenu>…</SidebarMenu>
  </SidebarGroup>
  <SidebarSeparator />
  {/* thread-style rows: a status dot instead of an icon */}
  <SidebarGroup collapsible>
    <SidebarGroupLabel>fluid-functionalism</SidebarGroupLabel>
    <SidebarGroupActions>
      <SidebarGroupAction aria-label="New thread">
        <PlusIcon />
      </SidebarGroupAction>
    </SidebarGroupActions>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton status="active">
          Sidebar component height in demo
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton status="unread">Sidebar component creation</SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</SidebarContent>`;

const menuFeaturesCode = `const [projectsOpen, setProjectsOpen] = useState(true);

<SidebarMenu>
  <SidebarMenuItem>
    <SidebarMenuButton icon={InboxIcon}>Inbox</SidebarMenuButton>
    <SidebarMenuBadge>12</SidebarMenuBadge>
  </SidebarMenuItem>
  <SidebarMenuItem>
    <SidebarMenuButton icon={ClockIcon}>Recent</SidebarMenuButton>
    {/* showOnHover reveals the action on row hover or focus; compose a
        Dropdown via render={<DropdownTrigger/>} for a real menu */}
    <SidebarMenuAction showOnHover aria-label="More options">
      <MoreIcon />
    </SidebarMenuAction>
  </SidebarMenuItem>
  <SidebarMenuItem>
    <SidebarMenuButton
      icon={FolderIcon}
      onClick={() => setProjectsOpen((v) => !v)}
    >
      Projects
      <ChevronIcon className={projectsOpen ? "rotate-180" : ""} />
    </SidebarMenuButton>
    <SidebarMenuSub open={projectsOpen}>
      {projects.map((p) => (
        <SidebarMenuSubItem key={p}>
          <SidebarMenuSubButton href="#" isActive={p === current}>
            {p}
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  </SidebarMenuItem>
</SidebarMenu>`;

const loadingCode = `<SidebarContent>
  <SidebarGroup>
    <SidebarInput placeholder="Search…" />
  </SidebarGroup>
  <SidebarGroup>
    <SidebarGroupLabel>Platform</SidebarGroupLabel>
    <SidebarMenu>
      {Array.from({ length: 5 }).map((_, i) => (
        <SidebarMenuSkeleton key={i} showIcon />
      ))}
    </SidebarMenu>
  </SidebarGroup>
</SidebarContent>`;

const controlledCode = `const [open, setOpen] = useState(true);

<SidebarProvider open={open} onOpenChange={setOpen} persist={false}>
  <Sidebar>…</Sidebar>
  <SidebarInset>
    <CustomTrigger /> {/* useSidebar().toggleSidebar */}
  </SidebarInset>
</SidebarProvider>

function CustomTrigger() {
  const { toggleSidebar, state } = useSidebar();
  return <Button onClick={toggleSidebar}>Sidebar is {state}</Button>;
}`;

// ── Props tables ─────────────────────────────────────────

const providerProps: PropDef[] = [
  { name: "defaultOpen", type: "boolean", default: "true", description: "Uncontrolled initial open state. Read the sidebar_state cookie in a server layout to restore the last visit." },
  { name: "open", type: "boolean", description: "Controlled open state — pair with onOpenChange." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the trigger, rail, or shortcut wants to change the open state." },
  { name: "persist", type: "boolean", default: "true", description: "Write the desktop open state to the sidebar_state cookie (7 days). Mobile sheet state never persists." },
  { name: "shortcut", type: "string | null", default: '"[" left · "]" right', description: "Bare-key toggle shortcut, side-aware by default; null disables it. Focus-scoped across providers: the innermost one containing focus answers, else the app-level (last-mounted) one." },
  { name: "mobileBreakpoint", type: "number", default: "768", description: "Viewport width (px) below which the sidebar renders as a modal sheet." },
  { name: "width", type: "string", default: '"16rem"', description: "Expanded rail width. Also published as --sidebar-width." },
  { name: "widthMobile", type: "string", default: '"18rem"', description: "Sheet width on mobile. Also published as --sidebar-width-mobile." },
];

const sidebarProps: PropDef[] = [
  { name: "side", type: '"left" | "right"', default: '"left"', description: "Which edge the rail lives on. Flex order handles placement, so JSX order stays the same." },
  { name: "variant", type: '"sidebar" | "floating" | "inset"', default: '"sidebar"', description: "Transparent rail, elevated floating card, or the inset pairing where SidebarInset becomes the card." },
  { name: "collapsible", type: '"offcanvas" | "none"', default: '"offcanvas"', description: "Offcanvas slides the rail away; none renders a static, always-open column. (The icon-rail mode is intentionally not supported.)" },
  { name: "bordered", type: "boolean", default: "true", description: "The sidebar variant's inner-edge border. Set false for a borderless rail (the rail handle's hover hairline still shows)." },
];

const menuButtonProps: PropDef[] = [
  { name: "isActive", type: "boolean", default: "false", description: "Marks the current row: aria-current, the traveling active background, and the semibold weight shift." },
  { name: "icon", type: "IconComponent", description: "Leading icon — stroke width animates 1.5 → 2 with the row's hover/active state." },
  { name: "size", type: '"default" | "sm" | "lg"', default: '"default"', description: "Row height. default follows the size ladder (32px, 28px compact); lg is a 48px two-line row." },
  { name: "variant", type: '"default" | "outline"', default: '"default"', description: "Outline adds a border and opaque background for standalone rows." },
  { name: "render", type: "ReactElement", description: "Render into a custom element, e.g. render={<Link href=…/>}." },
  { name: "asChild", type: "boolean", default: "false", description: "shadcn-style alternative to render: merge into the single child element." },
];

const partsProps: PropDef[] = [
  { name: "SidebarContent viewportClassName", type: "string", description: "Extra classes for the desktop scroll viewport (a ScrollArea with the scroll-fade edge treatment built in)." },
  { name: "SidebarGroup collapsible", type: "boolean", default: "false", description: "The group's label becomes an accordion toggle for everything after it — hover raises the label's contrast and reveals a chevron. Uncontrolled via defaultOpen; controlled via open / onOpenChange." },
  { name: "SidebarGroupActions", type: "—", description: "Cluster of 1–3 SidebarGroupAction buttons on the label row's right edge. A collapsible label keeps its chevron clear of the cluster automatically." },
  { name: "SidebarMenuButton status", type: '"active" | "unread" | "idle"', description: "Semantic thread state: drives the status dot (active/unread → filled, idle → ring), stamps data-status on the button, appends visually-hidden \"unread\" text for screen readers, and active implies isActive." },
  { name: "SidebarMenuButton dot", type: '"filled" | "ring"', description: "Visual-only status dot — the escape hatch when the semantic status vocabulary doesn't fit. Overrides the status-derived dot; ignored when icon is set." },
  { name: "SidebarMenu size", type: '"default" | "compact"', description: "Pins the menu's rows to one step of the size ladder; omitted, rows follow the surrounding SizeProvider." },
  { name: "SidebarMenuSub open", type: "boolean", default: "true", description: "Built-in measured-height collapse — wire to state alongside a toggling row for a collapsible tree." },
  { name: "SidebarMenuSubButton size", type: '"sm" | "md"', default: '"md"', description: "Sub-row height (24 / 28px) — text stays at the parent rows' size. Renders an <a> by default; also accepts icon, render / asChild, and isActive." },
  { name: "SidebarMenuAction showOnHover", type: "boolean", default: "false", description: "Hide the row action until the row is hovered or focused." },
  { name: "SidebarRail", type: "—", description: "Built into the desktop shell: drag to resize (192–360px), click to collapse, tooltip with the shortcut key. Hovering brightens the edge border." },
  { name: "SidebarTrigger", type: "ButtonProps", description: "Ghost icon button calling toggleSidebar(). While collapsed, hovering it shows an “Expand sidebar” tooltip with the shortcut key by default." },
  { name: "SidebarMenuSkeleton showIcon", type: "boolean", default: "false", description: "Adds the leading icon placeholder. Text widths are deterministic, so SSR and client agree." },
  { name: "SidebarGroupLabel / SidebarGroupAction render", type: "ReactElement", description: "Both group parts accept render / asChild for composition (e.g. a collapsible group trigger)." },
];

// ── Shared demo scaffolding ──────────────────────────────

/** Bounded app-shell frame every preview runs inside — the provider fills it
 *  instead of the viewport. */
function SidebarShellFrame({
  height = "h-[420px]",
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
          <DropdownContent className="min-w-0 w-[var(--radix-dropdown-menu-trigger-width,var(--anchor-width))]" align="start" sideOffset={4} checkedIndex={0}>
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
            className="shrink-0 rounded-full"
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
          <DropdownContent className="min-w-0 w-[var(--radix-dropdown-menu-trigger-width,var(--anchor-width))]" side="top" align="start" sideOffset={6}>
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
          <DemoInsetHeader title={insetTitle} triggerSide={side} />
          <DemoInsetBody />
        </SidebarInset>
      </SidebarProvider>
    </SidebarShellFrame>
  );
}

// ── Section previews ─────────────────────────────────────

function CollapsePreview() {
  return (
    <SidebarShellFrame height="h-[380px]">
      <SidebarProvider className="h-full min-h-0" persist={false}>
        <Sidebar className="h-full">
          <DemoHeader />
          <SidebarContent>
            <DemoMenu />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-h-0">
          <DemoInsetHeader
            title={
              <>
                Press <code>[</code> to toggle
              </>
            }
          />
          <DemoInsetBody />
        </SidebarInset>
      </SidebarProvider>
    </SidebarShellFrame>
  );
}

function GroupsPreview() {
  const PlusIcon = useIcon("plus");
  const MoreIcon = useIcon("more-horizontal");
  const icons = useIcons();
  return (
    <SidebarShellFrame height="h-[520px]">
      <SidebarProvider className="h-full min-h-0" persist={false}>
        <Sidebar className="h-full">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{SIDEBAR_GROUP_LABEL}</SidebarGroupLabel>
              {/* Cluster of 1–3 header actions on the label row. */}
              <SidebarGroupActions>
                <SidebarGroupAction aria-label="Add project">
                  <PlusIcon />
                </SidebarGroupAction>
                <SidebarGroupAction aria-label="More options">
                  <MoreIcon />
                </SidebarGroupAction>
              </SidebarGroupActions>
              <SidebarGroupContent>
                <SidebarMenu>
                  {SIDEBAR_ITEMS.slice(0, 3).map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton icon={icons[item.icon]} isActive={item.active}>
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
            {/* Collapsible: the label itself is the toggle — hover raises its
                contrast and reveals the chevron. */}
            <SidebarGroup collapsible>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {SIDEBAR_ITEMS.slice(3).map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton icon={icons[item.icon]}>{item.label}</SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
            {/* Thread-style rows: a status dot instead of an icon — filled
                reads active, ring reads idle. Collapsible label + one action. */}
            <SidebarGroup collapsible>
              <SidebarGroupLabel>fluid-functionalism</SidebarGroupLabel>
              <SidebarGroupActions>
                <SidebarGroupAction aria-label="New thread">
                  <PlusIcon />
                </SidebarGroupAction>
              </SidebarGroupActions>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton status="active">
                    Sidebar component height in demo
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton status="idle">Sidebar component creation</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton status="unread">Dark mode token audit</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-h-0">
          <DemoInsetHeader />
          <DemoInsetBody />
        </SidebarInset>
      </SidebarProvider>
    </SidebarShellFrame>
  );
}

function MenuFeaturesPreview() {
  const icons = useIcons();
  const FolderIcon = useIcon("folder");
  const MoreIcon = useIcon("more-horizontal");
  const ChevronDown = useIcon("chevron-down");
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [current, setCurrent] = useState<string>(SIDEBAR_PROJECTS[0]);
  return (
    <SidebarShellFrame height="h-[460px]">
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
                  <SidebarMenuButton icon={icons.clock}>Recent</SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownTrigger
                      render={
                        <SidebarMenuAction showOnHover aria-label="More options">
                          <MoreIcon />
                        </SidebarMenuAction>
                      }
                    />
                    {/* Fixed 240px = the header/footer rows' trigger width, so
                        every sidebar menu reads as one family. */}
                    <DropdownContent className="min-w-0 w-[240px]" align="start" sideOffset={4}>
                      <MenuItem index={0} icon={icons.pencil} label="Rename" onSelect={() => {}} />
                      <MenuItem index={1} icon={icons.link} label="Share" onSelect={() => {}} />
                      <MenuItem index={2} icon={icons.x} label="Delete" onSelect={() => {}} />
                    </DropdownContent>
                  </DropdownMenu>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={FolderIcon}
                    onClick={() => setProjectsOpen((v) => !v)}
                    aria-expanded={projectsOpen}
                  >
                    Projects
                    <span className="ml-auto -mr-0.5 inline-flex w-6 justify-center">
                      <ChevronDown
                        size={14}
                        strokeWidth={1.5}
                        className={`text-muted-foreground transition-transform duration-80 ${
                          projectsOpen ? "" : "-rotate-90"
                        }`}
                      />
                    </span>
                  </SidebarMenuButton>
                  <SidebarMenuSub open={projectsOpen}>
                    {SIDEBAR_PROJECTS.map((p) => (
                      <SidebarMenuSubItem key={p}>
                        <SidebarMenuSubButton
                          href="#"
                          isActive={p === current}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrent(p);
                          }}
                        >
                          {p}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-h-0">
          <div className="flex h-full items-center justify-center p-6 text-center text-[13px] text-muted-foreground">
            One highlight travels between rows. Actions show on hover; Projects
            collapses its sub-menu.
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SidebarShellFrame>
  );
}

function LoadingPreview() {
  return (
    <SidebarShellFrame height="h-[320px]">
      <SidebarProvider className="h-full min-h-0" persist={false}>
        <Sidebar collapsible="none" className="h-full">
          <SidebarContent>
            <SidebarGroup>
              <DemoSearch />
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>{SIDEBAR_GROUP_LABEL}</SidebarGroupLabel>
              <SidebarMenu>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuSkeleton key={i} showIcon />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-h-0">
          <DemoInsetBody />
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

function ControlledPreview() {
  const [open, setOpen] = useState(true);
  return (
    <SidebarShellFrame height="h-[360px]">
      <SidebarProvider
        className="h-full min-h-0"
        persist={false}
        shortcut={null}
        open={open}
        onOpenChange={setOpen}
      >
        <Sidebar className="h-full">
          <SidebarContent>
            <DemoMenu badges={false} />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-h-0">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2">
            <ControlledStateReadout />
          </header>
          <DemoInsetBody />
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
            <ComponentPreview code={code} padding="none" minHeightClass="h-[560px]">
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
      description="An app-shell sidebar that collapses offcanvas, resizes from its edge, and becomes a sheet on mobile. One highlight travels between rows instead of many flashing on and off."
      slug="sidebar"
    >
      <DocSection title="Playground">
        <SidebarPlaygroundSection />
      </DocSection>

      <DocSection title="Basic">
        <ComponentPreview code={basicCode} padding="none" minHeightClass="h-[420px]">
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
        <ComponentPreview code={collapseCode} padding="none" minHeightClass="h-[380px]">
          <CollapsePreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Right side">
        <ComponentPreview code={rightSideCode} padding="none" minHeightClass="h-[360px]">
          <DemoShell
            height="h-[360px]"
            side="right"
            insetTitle={
              <>
                Press <code>]</code> to toggle
              </>
            }
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Floating">
        <p className="text-body text-muted-foreground">
          Elevate the sidebar. The rail floats as its own card over the canvas —
          use it when navigation should read as a distinct layer.
        </p>
        <ComponentPreview code={floatingCode} padding="none" minHeightClass="h-[360px]">
          <DemoShell height="h-[360px]" variant="floating" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Inset">
        <p className="text-body text-muted-foreground">
          Elevate the content. The main region becomes the card while the sidebar
          recedes into the canvas — use it when the content is the star.
        </p>
        <ComponentPreview code={insetCode} padding="none" minHeightClass="h-[360px]">
          <DemoShell height="h-[360px]" variant="inset" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Groups">
        <ComponentPreview code={groupsCode} padding="none" minHeightClass="h-[520px]">
          <GroupsPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Menu features">
        <ComponentPreview code={menuFeaturesCode} padding="none" minHeightClass="h-[460px]">
          <MenuFeaturesPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Loading">
        <ComponentPreview code={loadingCode} padding="none" minHeightClass="h-[320px]">
          <LoadingPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Controlled & useSidebar">
        <ComponentPreview code={controlledCode} padding="none" minHeightClass="h-[360px]">
          <ControlledPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — SidebarProvider">
        <PropsTable props={providerProps} />
      </DocSection>

      <DocSection title="API Reference — Sidebar">
        <PropsTable props={sidebarProps} />
      </DocSection>

      <DocSection title="API Reference — SidebarMenuButton">
        <PropsTable props={menuButtonProps} />
      </DocSection>

      <DocSection title="API Reference — Parts">
        <p className="text-body text-muted-foreground">
          Every part forwards standard HTML props. The notable extras:
        </p>
        <PropsTable props={partsProps} />
      </DocSection>
    </DocPage>
  );
}
