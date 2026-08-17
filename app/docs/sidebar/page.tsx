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
    <SidebarGroupAction aria-label="Add project" onClick={addProject}>
      <PlusIcon />
    </SidebarGroupAction>
    <SidebarGroupContent>
      <SidebarMenu>…</SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
  <SidebarSeparator />
  <SidebarGroup>
    <SidebarGroupLabel>Workspace</SidebarGroupLabel>
    <SidebarMenu>…</SidebarMenu>
  </SidebarGroup>
</SidebarContent>`;

const menuFeaturesCode = `const [projectsOpen, setProjectsOpen] = useState(true);

<SidebarMenu>
  <SidebarMenuItem>
    <SidebarMenuButton icon={InboxIcon}>Inbox</SidebarMenuButton>
    <SidebarMenuBadge>12</SidebarMenuBadge>
  </SidebarMenuItem>
  <SidebarMenuItem>
    <SidebarMenuButton icon={SettingsIcon}>Settings</SidebarMenuButton>
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
  { name: "shortcut", type: "string | null", default: '"[" left · "]" right', description: "Bare-key toggle shortcut, side-aware by default. null disables it." },
  { name: "mobileBreakpoint", type: "number", default: "768", description: "Viewport width (px) below which the sidebar renders as a modal sheet." },
  { name: "width", type: "string", default: '"16rem"', description: "Expanded rail width. Also published as --sidebar-width." },
  { name: "widthMobile", type: "string", default: '"18rem"', description: "Sheet width on mobile. Also published as --sidebar-width-mobile." },
];

const sidebarProps: PropDef[] = [
  { name: "side", type: '"left" | "right"', default: '"left"', description: "Which edge the rail lives on. Flex order handles placement, so JSX order stays the same." },
  { name: "variant", type: '"sidebar" | "floating" | "inset"', default: '"sidebar"', description: "Transparent rail, elevated floating card, or the inset pairing where SidebarInset becomes the card." },
  { name: "collapsible", type: '"offcanvas" | "none"', default: '"offcanvas"', description: "Offcanvas slides the rail away; none renders a static, always-open column. (The icon-rail mode is intentionally not supported.)" },
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
  const ChevronsUpDown = useIcon("chevrons-up-down");
  const icons = useIcons();
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
                  className="text-[13px] text-foreground"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                >
                  Acme Inc
                </span>
                <span className="ml-auto inline-flex">
                  <ChevronsUpDown size={14} strokeWidth={1.5} className="text-muted-foreground" />
                </span>
              </SidebarMenuButton>
            }
          />
          <DropdownContent className="min-w-0 w-[var(--radix-dropdown-menu-trigger-width,var(--anchor-width))]" align="start" sideOffset={4} checkedIndex={0}>
            <MenuItem index={0} icon={icons["square-library"]} label="Acme Inc" checked onSelect={() => {}} />
            <MenuItem index={1} icon={icons.rocket} label="Fluid Labs" onSelect={() => {}} />
            <MenuItem index={2} icon={icons.user} label="Personal" onSelect={() => {}} />
            <MenuItem index={3} icon={icons.plus} label="New workspace" onSelect={() => {}} />
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

/** Workspace menu + search — the header block every example shares. */
function DemoHeader() {
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
                <span className="text-[13px] text-foreground">Micka Touillaud</span>
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
  title?: string;
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

/** Standard demo shell: provider scoped to the frame, no cookie writes, no
 *  keyboard shortcut (each preview would otherwise catch the same ⌘B). */
function DemoShell({
  height,
  side,
  variant,
  shortcut = null,
  sidebarChildren,
  insetTitle,
}: {
  height?: string;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  shortcut?: string | null;
  sidebarChildren?: ReactNode;
  insetTitle?: string;
}) {
  return (
    <SidebarShellFrame height={height}>
      <SidebarProvider className="h-full min-h-0" persist={false} shortcut={shortcut}>
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
        <SidebarInset className="min-h-0">
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
          <DemoInsetHeader title="Press [ to toggle" />
          <DemoInsetBody />
        </SidebarInset>
      </SidebarProvider>
    </SidebarShellFrame>
  );
}

function GroupsPreview() {
  const PlusIcon = useIcon("plus");
  const icons = useIcons();
  return (
    <SidebarShellFrame height="h-[420px]">
      <SidebarProvider className="h-full min-h-0" persist={false} shortcut={null}>
        <Sidebar className="h-full">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{SIDEBAR_GROUP_LABEL}</SidebarGroupLabel>
              <SidebarGroupAction aria-label="Add project">
                <PlusIcon />
              </SidebarGroupAction>
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
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarMenu>
                {SIDEBAR_ITEMS.slice(3).map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton icon={icons[item.icon]}>{item.label}</SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
      <SidebarProvider className="h-full min-h-0" persist={false} shortcut={null}>
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
                  <SidebarMenuButton icon={icons.settings}>Settings</SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownTrigger
                      render={
                        <SidebarMenuAction showOnHover aria-label="More options">
                          <MoreIcon />
                        </SidebarMenuAction>
                      }
                    />
                    <DropdownContent align="start" sideOffset={4}>
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
                    <span className="ml-auto inline-flex">
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
            Hover the rows — one highlight travels. The action shows on hover;
            the Projects row collapses its sub-menu.
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SidebarShellFrame>
  );
}

function LoadingPreview() {
  return (
    <SidebarShellFrame height="h-[320px]">
      <SidebarProvider className="h-full min-h-0" persist={false} shortcut={null}>
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
      description="Composable app-shell sidebar with offcanvas collapse, floating and inset variants, a mobile sheet, and cookie-persisted state — menu rows carry the proximity-hover traveling highlight, weight-animated labels, and an animated focus ring."
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
          The trigger, the built-in rail handle on the sidebar&apos;s edge (drag to
          resize, click to collapse), and the bare <code>[</code> key all drive the same
          state. This is the one preview on this page with the shortcut enabled — the
          collapse persists to a cookie in real apps (disabled here).
        </p>
        <ComponentPreview code={collapseCode} padding="none" minHeightClass="h-[380px]">
          <CollapsePreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Right side">
        <ComponentPreview code={rightSideCode} padding="none" minHeightClass="h-[360px]">
          <DemoShell height="h-[360px]" side="right" insetTitle="Notes" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Floating">
        <ComponentPreview code={floatingCode} padding="none" minHeightClass="h-[360px]">
          <DemoShell height="h-[360px]" variant="floating" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Inset">
        <ComponentPreview code={insetCode} padding="none" minHeightClass="h-[360px]">
          <DemoShell height="h-[360px]" variant="inset" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Groups">
        <ComponentPreview code={groupsCode} padding="none" minHeightClass="h-[420px]">
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
          SidebarHeader, SidebarFooter, SidebarContent, SidebarGroup,
          SidebarGroupLabel, SidebarGroupAction, SidebarGroupContent,
          SidebarSeparator, SidebarInput, SidebarRail, SidebarTrigger,
          SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuAction,
          SidebarMenuBadge, SidebarMenuSkeleton, and the SidebarMenuSub family
          all forward standard HTML props. The notable extras:
        </p>
        <PropsTable props={partsProps} />
      </DocSection>
    </DocPage>
  );
}
