"use client";

import { createElement, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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
import { Tooltip } from "@/registry/radix/tooltip";
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
import { useSurface } from "@/lib/surface-context";
import { surfaceClasses, surfaceHoverClasses } from "@/lib/surface-classes";
import {
  AI_CALLOUT,
  AI_NAV,
  AI_THREADS,
  AI_TREE,
  AI_WORKSPACE,
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

{/* Horizontal is the same pieces sharing the brand's line as icon buttons:
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">{brandRow}</div>
        <Button variant="ghost" size="icon-compact" aria-label="Search">…
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
          <CardHeader className="gap-[2px] py-3 pr-10">
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
// rail back as an overlay without pinning it.
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
  { name: "side", type: '"left" | "right"', default: '"left"', description: "Which edge the rail lives on. The provider mirrors it into the default shortcut — \"[\" left, \"]\" right — and the trigger's icon, the rail handle, and the drawer's slide all follow." },
  { name: "variant", type: '"sidebar" | "floating" | "inset"', default: '"sidebar"', description: "Transparent rail, elevated floating card, or the inset pairing where SidebarInset becomes the card." },
  { name: "collapsible", type: '"offcanvas" | "none"', default: '"offcanvas"', description: "Offcanvas slides the rail away; none renders a static, always-open column. (The icon-rail mode is intentionally not supported.)" },
  { name: "rail", type: "boolean", default: "true", description: "The built-in resize/collapse handle: drag to resize (192–360px), click to collapse, drag past the minimum to collapse. false hides it; the trigger and shortcut still toggle." },
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
function SidebarShellFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className={`relative flex w-full overflow-hidden bg-background ${SHELL_HEIGHT}`}
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
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">
            <DemoHeaderRow />
          </div>
          <Tooltip content={tipWithShortcut("Search", SEARCH_SHORTCUT)} side="bottom">
            <Button
              variant="ghost"
              size="icon-compact"
              aria-label="Search"
              className="shrink-0"
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

function DemoInsetHeader({ title }: { title?: ReactNode }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2">
      <SidebarTrigger />
      <span className="text-[13px] text-muted-foreground">{title}</span>
    </header>
  );
}

/** The page the rail sits beside: a heading and two cards. Abstract enough
 *  not to compete with the sidebar, structured enough to read as a page
 *  rather than a stack of grey bars. */
function DemoInsetBody() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <div className="h-2 w-16 rounded-full bg-hover" />
        <div className="h-4 w-2/5 rounded-md bg-hover" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="h-20 rounded-lg bg-hover" />
        <div className="h-20 rounded-lg bg-hover" />
      </div>
    </div>
  );
}

/** Two examples are *about* the rail-and-main pairing, so they keep both
 *  halves at every width — the rail just narrows to leave the main region
 *  something to be. The other three are rail-only and never render this. */
function DemoInsetContent({ title }: { title?: ReactNode }) {
  return (
    <>
      <DemoInsetHeader title={title} />
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
  return (
    <div
      className="w-full self-stretch"
      // mousemove covers a pointer already resting inside at mount, and
      // pointerdown covers touch (no hover) — otherwise the pinned tooltip
      // could never be handed off and would sit over the demo forever.
      onMouseEnter={() => setCursorInside(true)}
      onMouseMove={() => setCursorInside(true)}
      onPointerDown={() => setCursorInside(true)}
      onMouseLeave={() => setCursorInside(false)}
    >
      <SidebarShellFrame>
        <DemoProvider narrowWidth="11rem" peek="hover" open={open} onOpenChange={setOpen}>
          <Sidebar
            variant="inset"
            // Pinned only while the rail exists to anchor it — never while
            // collapsed, and never against the visitor's own hover.
            railTooltipOpen={!cursorInside && open ? true : undefined}
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
    </div>
  );
}

/** Nesting: level 1 rows that own a level 2 sub-tree — an agent roster and
 *  the sources a retrieval agent reads, both open at once so the two levels
 *  can be seen holding their own highlights. */
function NestingPreview() {
  const icons = useIcons();
  const [open, setOpen] = useState<Record<string, boolean>>({
    Agents: true,
    Knowledge: true,
  });
  const [current, setCurrent] = useState("Support triage");

  return (
    <DemoRailShell insetTitle="Open a branch, then a child">
      <SidebarContent>
        <SidebarGroup collapsible>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
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
            })}

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

  // No Share here — it already sits on the row as a hover action.
  const threadMenu = (
    <DropdownContent className="min-w-[240px] w-[240px]" align="start" sideOffset={4}>
      <MenuItem index={0} icon={icons.pencil} label="Rename" onSelect={() => {}} />
      <MenuItem index={1} icon={icons.x} label="Delete" onSelect={() => {}} />
    </DropdownContent>
  );

  return (
    <DemoRailShell insetTitle="Hover a row — tap on touch">
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
            {AI_THREADS.map((thread) => (
              <SidebarMenuItem key={thread.label}>
                <SidebarMenuButton status={thread.status}>{thread.label}</SidebarMenuButton>
                <SidebarMenuBadge>{thread.badge}</SidebarMenuBadge>
                <SidebarMenuActions showOnHover>
                  <Tooltip content="Branch thread" side="top">
                    <SidebarMenuAction aria-label="Branch thread">
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
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <DemoFooterUser />
      </SidebarFooter>
    </DemoRailShell>
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
      {/* On the icon row the dismiss control floats over the text rather than
          over a banner, so that row reserves the 36px it occupies plus air. */}
      <CardHeader
        className={variant === "banner" ? "gap-0 pt-3" : "gap-[2px] py-3 pr-10"}
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
          <div className="flex items-center gap-1">
            <div className="min-w-0 flex-1">
              <DemoHeaderRow />
            </div>
            <Tooltip content={tipWithShortcut("Search", SEARCH_SHORTCUT)} side="bottom">
              <Button variant="ghost" size="icon-compact" aria-label="Search" className="shrink-0">
                {createElement(icons.search, {})}
              </Button>
            </Tooltip>
            <Tooltip content={tipWithShortcut("New thread", "⇧⌘O")} side="bottom">
              <Button variant="ghost" size="icon-compact" aria-label="New thread" className="shrink-0">
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
          One prop, three app shells: <code>sidebar</code> is a flush rail,{" "}
          <code>floating</code> lifts the rail into its own card, and{" "}
          <code>inset</code> makes the main region the card instead.
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
          A level 1 row can own a level 2 sub-tree, collapsing on its measured
          height. Each level runs its own highlight, so the two never fight
          over which row is lit. Two levels is the whole vocabulary.
        </p>
        <ComponentPreview code={nestingCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <NestingPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Actions & badges">
        <p className="text-body text-muted-foreground">
          A row leads with an icon or a status dot and can carry a badge, an
          action, or a cluster. Hover-revealed actions cost the label nothing
          at rest, and the badge keeps the rightmost slot beside them.
        </p>
        <ComponentPreview code={actionsCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <ActionsPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Header, footer & callout">
        <p className="text-body text-muted-foreground">
          The same pieces in two packings: vertical gives each element its own
          full-width row, horizontal collapses the extras into icon buttons on
          the brand&apos;s line. The callout is a Card, with media or an icon.
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
          More than one callout shares the footer as a sonner-style pile: the
          front card leads and the rest peek out behind it, each a step apart
          on the brand ladder. Hovering fans the inline pile into a column,
          and dismissing the front card promotes the one below.
        </p>
        <ComponentPreview code={stackedCalloutCode} padding="none" minHeightClass={SHELL_HEIGHT}>
          <StackedCalloutPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Collapse, peek & resize">
        <p className="text-body text-muted-foreground">
          Three ways to toggle: the trigger, the rail (drag to resize, click to
          collapse), and the <code>[</code> key. With{" "}
          <code>peek=&quot;hover&quot;</code> a collapsed edge floats the rail
          back without pinning it. State persists to a cookie.
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
