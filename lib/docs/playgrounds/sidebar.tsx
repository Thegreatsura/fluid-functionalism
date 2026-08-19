"use client";

import { useState, createElement } from "react";
import Image from "next/image";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarHeader,
  SidebarInput,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupActions,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuAction,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarInset,
  type SidebarVariant,
  type SidebarCollapsible,
} from "@/components/flavored/sidebar";
import { useIcons, type IconComponent } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { fontWeights } from "@/lib/font-weight";
import { Switch } from "@/registry/radix/switch";
import { Button } from "@/registry/radix/button";
import { Tooltip } from "@/registry/radix/tooltip";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
} from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import {
  SIDEBAR_GROUP_LABEL,
  SIDEBAR_ITEMS,
  SIDEBAR_THREADS,
  SIDEBAR_THREADS_ALT,
} from "@/app/components/demo-data";
import { WorkspaceMenuItems } from "@/lib/docs/workspace-demo";
import type { PlaygroundProps } from "./types";

// ── Sidebar playground ───────────────────────────────────
// The controls drive one real app-shell: variant, side, and collapse are the
// layout story; the content switches exercise badges, the sub-menu tree, the
// footer user row, and the loading skeletons.

interface PlayState {
  variant: SidebarVariant;
  collapsible: SidebarCollapsible;
  open: boolean;
  /** Collapsed-peek overlay: reveal the collapsed sidebar on edge hover or
   *  click without pinning it. */
  peek: "none" | "hover" | "click";
  /** Header brand row: the workspace switcher, or a plain logo lockup. */
  brand: "workspace" | "logo";
  /** How the header's search and actions relate to the brand row: stacked
   *  underneath as full-width rows, or sharing its line as icon buttons. */
  headerStack: "vertical" | "horizontal";
  /** Header action rows / icon buttons (New, Invite). */
  headerActions: 0 | 1 | 2;
  /** Same stacking rule for the footer's actions against the user row. */
  footerStack: "vertical" | "horizontal";
  /** Footer action rows / icon buttons (Settings, Theme). */
  footerActions: 0 | 1 | 2;
  /** Leading treatment for the Platform rows: icon column, or thread-style
   *  status dot (filled = active, ring = idle). */
  leading: "icon" | "dot";
  /** Header action buttons clustered on the first group's label (0–3). */
  groupActions: 0 | 1 | 2 | 3;
  /** Section labels act as accordion toggles (SidebarGroup collapsible). */
  collapsibleGroups: boolean;
  badges: boolean;
  subMenu: boolean;
  /** Menu-features treatment: hover row actions + collapsible sub-menu. */
  actions: boolean;
  footerUser: boolean;
  loading: boolean;
}

const DEFAULT_STATE: PlayState = {
  variant: "inset",
  collapsible: "offcanvas",
  open: true,
  peek: "none",
  brand: "workspace",
  headerStack: "horizontal",
  headerActions: 2,
  footerStack: "horizontal",
  footerActions: 2,
  leading: "dot",
  groupActions: 1,
  collapsibleGroups: true,
  badges: false,
  subMenu: true,
  actions: true,
  footerUser: true,
  loading: false,
};

/** "more-horizontal" → "MoreHorizontalIcon", for the generated snippet. */
function iconTag(name: string): string {
  return (
    name
      .split("-")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join("") + "Icon"
  );
}

export function buildSidebarPlaygroundCode(o: PlayState): string {
  const lines: string[] = [];
  lines.push(`import {`);
  lines.push(`  SidebarProvider, Sidebar, SidebarTrigger, SidebarInset,`);
  lines.push(`  SidebarHeader, SidebarContent, SidebarFooter,`);
  lines.push(
    o.groupActions > 0
      ? `  SidebarGroup, SidebarGroupLabel, SidebarGroupActions, SidebarGroupAction,`
      : `  SidebarGroup, SidebarGroupLabel,`
  );
  lines.push(`  SidebarMenu, SidebarMenuItem,`);
  const menuExtras = [
    "SidebarMenuButton",
    ...(o.badges ? ["SidebarMenuBadge"] : []),
    ...(o.actions ? ["SidebarMenuAction"] : []),
    ...(o.subMenu && o.leading === "icon"
      ? ["SidebarMenuSub", "SidebarMenuSubItem", "SidebarMenuSubButton"]
      : []),
    ...(o.loading ? ["SidebarMenuSkeleton"] : []),
  ];
  lines.push(`  ${menuExtras.join(", ")},`);
  lines.push(`} from "./components";`);
  lines.push(``);
  const providerProps =
    (o.collapsible === "offcanvas" ? ` open={open} onOpenChange={setOpen}` : ``) +
    (o.peek !== "none" ? ` peek="${o.peek}"` : ``);
  lines.push(`<SidebarProvider${providerProps}>`);
  const sidebarProps = [
    o.variant !== "sidebar" ? `variant="${o.variant}"` : null,
    o.collapsible !== "offcanvas" ? `collapsible="${o.collapsible}"` : null,
  ]
    .filter(Boolean)
    .join(" ");
  lines.push(`  <Sidebar${sidebarProps ? ` ${sidebarProps}` : ""}>`);
  const headerActions = HEADER_ACTION_SET.slice(0, o.headerActions);
  const brandComment =
    o.brand === "logo" ? `{/* logo lockup */}` : `{/* workspace switcher */}`;
  lines.push(`    <SidebarHeader>`);
  if (o.headerStack === "horizontal") {
    lines.push(`      {/* horizontal: search + actions share the brand line */}`);
    lines.push(`      <div className="flex items-center gap-1">`);
    lines.push(`        ${brandComment}`);
    lines.push(`        <Button variant="ghost" size="icon-compact" aria-label="Search">`);
    lines.push(`          <SearchIcon />`);
    lines.push(`        </Button>`);
    for (const action of headerActions) {
      lines.push(`        <Button variant="ghost" size="icon-compact" aria-label="${action.label}">`);
      lines.push(`          <${iconTag(action.icon)} />`);
      lines.push(`        </Button>`);
    }
    lines.push(`      </div>`);
  } else {
    lines.push(`      ${brandComment}`);
    lines.push(`      <SidebarInput placeholder="Search…" />`);
    if (headerActions.length > 0) {
      lines.push(`      <SidebarMenu>`);
      for (const action of headerActions) {
        lines.push(`        <SidebarMenuItem>`);
        lines.push(`          <SidebarMenuButton icon={${iconTag(action.icon)}}>`);
        lines.push(`            ${action.label}`);
        lines.push(`            {/* shortcut chip, revealed on row hover */}`);
        lines.push(`            <kbd>${action.shortcut}</kbd>`);
        lines.push(`          </SidebarMenuButton>`);
        lines.push(`        </SidebarMenuItem>`);
      }
      lines.push(`      </SidebarMenu>`);
    }
  }
  lines.push(`    </SidebarHeader>`);
  lines.push(`    <SidebarContent>`);
  lines.push(`      <SidebarGroup${o.collapsibleGroups ? " collapsible" : ""}>`);
  lines.push(
    `        <SidebarGroupLabel>${o.leading === "dot" ? "fluid-functionalism" : "Platform"}</SidebarGroupLabel>`
  );
  if (o.groupActions > 0) {
    lines.push(`        {/* 1-3 header actions on the label row */}`);
    lines.push(`        <SidebarGroupActions>`);
    for (const action of GROUP_ACTION_SET.slice(0, o.groupActions)) {
      lines.push(`          <SidebarGroupAction aria-label="${action.label}">`);
      lines.push(`            <${iconTag(action.icon)} />`);
      lines.push(`          </SidebarGroupAction>`);
    }
    lines.push(`        </SidebarGroupActions>`);
  }
  lines.push(`        <SidebarMenu>`);
  if (o.loading) {
    lines.push(`          {items.map((item) => (`);
    lines.push(`            <SidebarMenuSkeleton key={item.label} showIcon />`);
    lines.push(`          ))}`);
  } else {
    lines.push(`          {items.map((item) => (`);
    lines.push(`            <SidebarMenuItem key={item.label}>`);
    if (o.leading === "dot") {
      lines.push(`              {/* thread rows: semantic status drives the dot, `);
      lines.push(`                  data-status, and SR "unread" text */}`);
      lines.push(`              <SidebarMenuButton status={item.status}>`);
    } else {
      lines.push(`              <SidebarMenuButton icon={item.icon} isActive={item.active}>`);
    }
    lines.push(`                {item.label}`);
    lines.push(`              </SidebarMenuButton>`);
    if (o.badges) {
      lines.push(`              {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}`);
    }
    if (o.actions) {
      lines.push(`              <SidebarMenuAction showOnHover aria-label="More options">`);
      lines.push(`                <MoreIcon />`);
      lines.push(`              </SidebarMenuAction>`);
    }
    lines.push(`            </SidebarMenuItem>`);
    lines.push(`          ))}`);
  }
  lines.push(`        </SidebarMenu>`);
  lines.push(`      </SidebarGroup>`);
  if (!o.loading && o.leading === "dot") {
    lines.push(`      <SidebarGroup${o.collapsibleGroups ? " collapsible" : ""}>`);
    lines.push(`        <SidebarGroupLabel>portfolio-site</SidebarGroupLabel>`);
    lines.push(`        <SidebarMenu>`);
    lines.push(`          {moreThreads.map((item) => (`);
    lines.push(`            <SidebarMenuItem key={item.label}>`);
    lines.push(`              <SidebarMenuButton status={item.status}>{item.label}</SidebarMenuButton>`);
    lines.push(`            </SidebarMenuItem>`);
    lines.push(`          ))}`);
    lines.push(`        </SidebarMenu>`);
    lines.push(`      </SidebarGroup>`);
  }
  if (!o.loading && o.leading === "icon" && o.subMenu) {
    lines.push(`      <SidebarGroup${o.collapsibleGroups ? " collapsible" : ""}>`);
    lines.push(`        <SidebarGroupLabel>Teams</SidebarGroupLabel>`);
    if (o.groupActions > 0) {
      lines.push(`        <SidebarGroupActions>{/* same actions */}</SidebarGroupActions>`);
    }
    lines.push(`        <SidebarMenu>`);
    lines.push(`          {teams.map((team) => (`);
    lines.push(`            <SidebarMenuItem key={team.label}>`);
    lines.push(`              <SidebarMenuButton icon={team.icon} onClick={() => toggleTeam(team.label)}>`);
    lines.push(`                {team.label}`);
    lines.push(`                <ChevronIcon className={openTeams[team.label] ? "" : "-rotate-90"} />`);
    lines.push(`              </SidebarMenuButton>`);
    lines.push(`              <SidebarMenuSub open={openTeams[team.label]}>`);
    lines.push(`                {team.children.map((c) => (`);
    lines.push(`                  <SidebarMenuSubItem key={c.label}>`);
    lines.push(`                    <SidebarMenuSubButton href="#">{c.label}</SidebarMenuSubButton>`);
    if (o.badges) {
      lines.push(`                    {c.badge && <SidebarMenuBadge>{c.badge}</SidebarMenuBadge>}`);
    }
    if (o.actions) {
      lines.push(`                    <SidebarMenuAction showOnHover aria-label="More options">`);
      lines.push(`                      <MoreIcon />`);
      lines.push(`                    </SidebarMenuAction>`);
    }
    lines.push(`                  </SidebarMenuSubItem>`);
    lines.push(`                ))}`);
    lines.push(`              </SidebarMenuSub>`);
    lines.push(`            </SidebarMenuItem>`);
    lines.push(`          ))}`);
    lines.push(`        </SidebarMenu>`);
    lines.push(`      </SidebarGroup>`);
  }
  lines.push(`    </SidebarContent>`);
  if (o.footerUser) {
    const footerActions = FOOTER_ACTION_SET.slice(0, o.footerActions);
    lines.push(`    <SidebarFooter>`);
    if (o.footerStack === "horizontal") {
      if (footerActions.length > 0) {
        lines.push(`      {/* horizontal: actions share the user row's line */}`);
        lines.push(`      <div className="flex items-center gap-1">`);
        lines.push(`        {/* user row */}`);
        for (const action of footerActions) {
          lines.push(`        <Button variant="ghost" size="icon-compact" aria-label="${action.label}">`);
          lines.push(`          <${iconTag(action.icon)} />`);
          lines.push(`        </Button>`);
        }
        lines.push(`      </div>`);
      } else {
        lines.push(`      {/* user row */}`);
      }
    } else {
      if (footerActions.length > 0) {
        lines.push(`      {/* vertical: actions stack above the user row */}`);
        lines.push(`      <SidebarMenu>`);
        for (const action of footerActions) {
          lines.push(`        <SidebarMenuItem>`);
          lines.push(`          <SidebarMenuButton icon={${iconTag(action.icon)}}>${action.label}</SidebarMenuButton>`);
          lines.push(`        </SidebarMenuItem>`);
        }
        lines.push(`      </SidebarMenu>`);
      }
      lines.push(`      {/* user row */}`);
    }
    lines.push(`    </SidebarFooter>`);
  }
  lines.push(`  </Sidebar>`);
  lines.push(`  <SidebarInset>`);
  lines.push(`    <header>`);
  lines.push(`      <SidebarTrigger />`);
  lines.push(`    </header>`);
  lines.push(`    {children}`);
  lines.push(`  </SidebarInset>`);
  lines.push(`</SidebarProvider>`);
  return lines.join("\n");
}

// Header action cluster options for the first group's label, sliced by the
// "Label actions" control (1–3).
const GROUP_ACTION_SET = [
  { icon: "plus", label: "Add item" },
  { icon: "sliders-horizontal", label: "Section settings" },
  { icon: "more-horizontal", label: "More options" },
] as const;

// Header actions, sliced by the "Header actions" control. Vertical stacking
// renders them as labelled rows (shortcut chip revealed on hover);
// horizontal stacking collapses them to icon buttons beside the brand.
const HEADER_ACTION_SET = [
  { icon: "plus", label: "New", shortcut: "⇧⌘O" },
  { icon: "users", label: "Invite", shortcut: "⇧⌘I" },
] as const;

// Footer actions, sliced by the "Footer actions" control — same two
// treatments, driven by the footer's own stacking rule.
const FOOTER_ACTION_SET = [
  { icon: "settings", label: "Settings" },
  { icon: "moon", label: "Theme" },
] as const;

// Second group: four collapsible sub-menu examples under their own title.
const TEAM_GROUPS = [
  {
    icon: "users",
    label: "Engineering",
    children: [
      { label: "Frontend", badge: "4" },
      { label: "Backend", badge: "6" },
      { label: "Infrastructure", badge: "2" },
    ],
  },
  {
    icon: "palette",
    label: "Design",
    children: [{ label: "Brand", badge: "1" }, { label: "Product", badge: "2" }, { label: "Website", badge: "5" }],
  },
  {
    icon: "rocket",
    label: "Marketing",
    children: [{ label: "Campaigns", badge: "3" }, { label: "Social", badge: "8" }, { label: "Newsletter", badge: "1" }],
  },
  {
    icon: "globe",
    label: "Support",
    children: [{ label: "Inbox", badge: "9" }, { label: "Knowledge base", badge: "4" }, { label: "Escalations", badge: "2" }],
  },
] as const;

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

export function SidebarPlayground({ children }: PlaygroundProps) {
  const [state, setState] = useState<PlayState>(DEFAULT_STATE);
  const [openTeams, setOpenTeams] = useState<Record<string, boolean>>({ Engineering: true });
  const toggleTeam = (label: string) =>
    setOpenTeams((prev) => ({ ...prev, [label]: !prev[label] }));
  const icons = useIcons();
  const shape = useShape();
  const set = <K extends keyof PlayState>(key: K, value: PlayState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const randomize = () => {
    setState({
      variant: pick(["sidebar", "floating", "inset"] as const),
      collapsible: pick(["offcanvas", "offcanvas", "none"] as const),
      open: true,
      peek: pick(["none", "none", "hover", "click"] as const),
      brand: pick(["workspace", "workspace", "logo"] as const),
      headerStack: pick(["vertical", "vertical", "horizontal"] as const),
      headerActions: pick([0, 1, 2, 2] as const),
      footerStack: pick(["vertical", "horizontal", "horizontal"] as const),
      footerActions: pick([0, 1, 2, 2] as const),
      leading: pick(["icon", "icon", "dot"] as const),
      groupActions: pick([0, 0, 1, 2, 3] as const),
      collapsibleGroups: Math.random() > 0.25,
      badges: Math.random() > 0.3,
      subMenu: Math.random() > 0.3,
      actions: Math.random() > 0.4,
      footerUser: Math.random() > 0.4,
      loading: Math.random() > 0.85,
    });
  };

  const ChevronsUpDown = icons["chevrons-up-down"];

  // One row for both leading modes; group 1 and the dot-mode second category
  // share it. The 240px more-menu matches the workspace/user rows' trigger
  // width (16rem sidebar minus the p-2 header) so all menus read as one
  // family.
  const menuRow = (item: {
    key: string;
    label: string;
    icon?: IconComponent;
    status?: "active" | "unread" | "idle";
    active?: boolean;
    badge?: string;
  }) => (
    <SidebarMenuItem key={item.key}>
      <SidebarMenuButton icon={item.icon} status={item.status} isActive={item.active}>
        {item.label}
      </SidebarMenuButton>
      {state.badges && item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
      {state.actions && (
        <DropdownMenu>
          <DropdownTrigger
            render={
              <SidebarMenuAction showOnHover aria-label="More options">
                {createElement(icons["more-horizontal"], {})}
              </SidebarMenuAction>
            }
          />
          <DropdownContent className="min-w-0 w-[240px]" align="start" sideOffset={4}>
            <MenuItem index={0} icon={icons.pencil} label="Rename" onSelect={() => {}} />
            <MenuItem index={1} icon={icons.link} label="Share" onSelect={() => {}} />
            <MenuItem index={2} icon={icons.x} label="Delete" onSelect={() => {}} />
          </DropdownContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  );

  const threadItems = (list: typeof SIDEBAR_THREADS) =>
    list.map((item) => ({
      badge: undefined,
      ...item,
      key: item.label,
      icon: undefined,
      active: undefined,
    }));

  const headerHorizontal = state.headerStack === "horizontal";
  const footerHorizontal = state.footerStack === "horizontal";
  const headerActionSet = HEADER_ACTION_SET.slice(0, state.headerActions);
  const footerActionSet = FOOTER_ACTION_SET.slice(0, state.footerActions);

  // Shared header cluster for both groups.
  const groupActionCluster =
    state.groupActions > 0 ? (
      <SidebarGroupActions>
        {GROUP_ACTION_SET.slice(0, state.groupActions).map((a) => (
          <Tooltip key={a.icon} content={a.label} side="top">
            <SidebarGroupAction aria-label={a.label}>
              {createElement(icons[a.icon], {})}
            </SidebarGroupAction>
          </Tooltip>
        ))}
      </SidebarGroupActions>
    ) : null;

  // The doc page's ComponentPreview already draws the frame; only the /demo
  // card's standalone preview brings its own border.
  const shell = (height: string, framed = false) => (
    <div
      className={`relative flex w-full overflow-hidden bg-background ${height} ${
        framed ? "rounded-xl border border-border" : ""
      }`}
    >
      <SidebarProvider
        className="h-full min-h-0"
        persist={false}
        open={state.collapsible === "offcanvas" ? state.open : true}
        onOpenChange={(next) => set("open", next)}
        peek={state.peek}
      >
        <Sidebar
          variant={state.variant}
          collapsible={state.collapsible}
          className="h-full"
        >
          <SidebarHeader>
            {/* Stacking rule: vertical keeps the brand row on its own line
                with search and actions stacked beneath as full-width rows;
                horizontal collapses them to icon buttons sharing its line. */}
            <div className={headerHorizontal ? "flex items-center gap-1" : "contents"}>
              <div className={headerHorizontal ? "min-w-0 flex-1" : "contents"}>
                {state.brand === "logo" ? (
                  // Logo lockup: not interactive, so it renders OUTSIDE
                  // SidebarMenu — a menu row would track the traveling hover
                  // background and light up like a control.
                  <div className="flex h-8 items-center gap-2 px-2">
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
                  </div>
                ) : (
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
                                {createElement(icons["chevron-down"], {
                                  size: 14,
                                  strokeWidth: 1.5,
                                  className: "text-muted-foreground",
                                })}
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
                )}
              </div>
              {headerHorizontal && (
                <>
                  <Tooltip content="Search" side="bottom">
                    <Button
                      variant="ghost"
                      size="icon-compact"
                      aria-label="Search"
                      className="shrink-0"
                    >
                      {createElement(icons.search, {})}
                    </Button>
                  </Tooltip>
                  {headerActionSet.map((a) => (
                    <Tooltip key={a.icon} content={a.label} side="bottom">
                      <Button
                        variant="ghost"
                        size="icon-compact"
                        aria-label={a.label}
                        className="shrink-0"
                      >
                        {createElement(icons[a.icon], {})}
                      </Button>
                    </Tooltip>
                  ))}
                </>
              )}
            </div>
            {!headerHorizontal && (
              // Search and the action rows are ONE block: the header's gap-2
              // separates it from the brand row, while inside it the search
              // field reads as the list's first row (menu row rhythm).
              <div className="flex flex-col gap-0.5">
                <div className="relative">
                  {createElement(icons.search, {
                    size: 14,
                    strokeWidth: 1.5,
                    className:
                      "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground",
                  })}
                  <SidebarInput placeholder="Search…" aria-label="Search" className="pl-8" />
                </div>
                {headerActionSet.length > 0 && (
                  // The shortcut chip is hover-revealed, so the label owns
                  // the row at rest.
                  <SidebarMenu aria-label="Actions">
                    {headerActionSet.map((a) => (
                      <SidebarMenuItem key={a.icon}>
                        <SidebarMenuButton icon={icons[a.icon]}>
                          {a.label}
                          <span className="ml-auto inline-flex opacity-0 transition-opacity duration-80 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100">
                            <kbd className="font-sans text-[11px] text-muted-foreground">{a.shortcut}</kbd>
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                )}
              </div>
            )}
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup collapsible={state.collapsibleGroups}>
              <SidebarGroupLabel>
                {state.leading === "dot" ? "fluid-functionalism" : SIDEBAR_GROUP_LABEL}
              </SidebarGroupLabel>
              {groupActionCluster}
              <SidebarMenu>
                {state.loading
                  ? SIDEBAR_ITEMS.map((item) => (
                      <SidebarMenuSkeleton key={item.label} showIcon />
                    ))
                  : (state.leading === "dot"
                      ? // Status dots read as thread state, so the rows carry
                        // discussion titles (with semantic status) instead of
                        // page names.
                        threadItems(SIDEBAR_THREADS)
                      : SIDEBAR_ITEMS.map((item) => ({
                          badge: undefined,
                          ...item,
                          key: item.label,
                          icon: icons[item.icon],
                          status: undefined,
                        }))
                    ).map(menuRow)}
              </SidebarMenu>
            </SidebarGroup>
            {!state.loading && state.leading === "dot" && (
              // Second thread category — flat rows; sub-menu trees belong to
              // icon mode only.
              <SidebarGroup collapsible={state.collapsibleGroups}>
                <SidebarGroupLabel>portfolio-site</SidebarGroupLabel>
                {groupActionCluster}
                <SidebarMenu>{threadItems(SIDEBAR_THREADS_ALT).map(menuRow)}</SidebarMenu>
              </SidebarGroup>
            )}
            {!state.loading && state.leading === "icon" && state.subMenu && (
              <SidebarGroup collapsible={state.collapsibleGroups}>
                <SidebarGroupLabel>Teams</SidebarGroupLabel>
                {groupActionCluster}
                <SidebarMenu>
                  {TEAM_GROUPS.slice(0, 2).map((team) => (
                    <SidebarMenuItem key={team.label}>
                      <SidebarMenuButton
                        icon={icons[team.icon]}
                        onClick={() => toggleTeam(team.label)}
                        aria-expanded={!!openTeams[team.label]}
                      >
                        {team.label}
                        <span className="ml-auto -mr-0.5 inline-flex w-6 justify-center">
                          {createElement(icons["chevron-down"], {
                            size: 14,
                            strokeWidth: 1.5,
                            className: `text-muted-foreground transition-transform duration-80 ${
                              openTeams[team.label] ? "" : "-rotate-90"
                            }`,
                          })}
                        </span>
                      </SidebarMenuButton>
                      <SidebarMenuSub open={!!openTeams[team.label]}>
                        {team.children.map((c) => (
                          <SidebarMenuSubItem key={c.label}>
                            <SidebarMenuSubButton href="#" onClick={(e) => e.preventDefault()}>
                              {c.label}
                            </SidebarMenuSubButton>
                            {state.badges && "badge" in c && c.badge && (
                              <SidebarMenuBadge>{c.badge}</SidebarMenuBadge>
                            )}
                            {state.actions && (
                              <DropdownMenu>
                                <DropdownTrigger
                                  render={
                                    <SidebarMenuAction showOnHover aria-label="More options">
                                      {createElement(icons["more-horizontal"], {})}
                                    </SidebarMenuAction>
                                  }
                                />
                                <DropdownContent className="min-w-0 w-[240px]" align="start" sideOffset={4}>
                                  <MenuItem index={0} icon={icons.pencil} label="Rename" onSelect={() => {}} />
                                  <MenuItem index={1} icon={icons.link} label="Share" onSelect={() => {}} />
                                  <MenuItem index={2} icon={icons.x} label="Delete" onSelect={() => {}} />
                                </DropdownContent>
                              </DropdownMenu>
                            )}
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )}
          </SidebarContent>
          {state.footerUser && (
            <SidebarFooter>
              {/* Vertical stacking puts the actions above the user row, so
                  identity stays anchored to the sidebar's outer edge —
                  mirroring the brand row at the top. */}
              {!footerHorizontal && footerActionSet.length > 0 && (
                <SidebarMenu aria-label="Footer actions">
                  {footerActionSet.map((a) => (
                    <SidebarMenuItem key={a.icon}>
                      <SidebarMenuButton icon={icons[a.icon]}>{a.label}</SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
              <div className={footerHorizontal ? "flex items-center gap-1" : "contents"}>
                <SidebarMenu
                  aria-label="User"
                  className={footerHorizontal ? "min-w-0 flex-1" : undefined}
                >
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
                              {createElement(ChevronsUpDown, {
                                size: 14,
                                strokeWidth: 1.5,
                                className: "text-muted-foreground",
                              })}
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
                {footerHorizontal &&
                  footerActionSet.map((a) => (
                    <Tooltip key={a.icon} content={a.label} side="top">
                      <Button
                        variant="ghost"
                        size="icon-compact"
                        aria-label={a.label}
                        className="shrink-0"
                      >
                        {createElement(icons[a.icon], {})}
                      </Button>
                    </Tooltip>
                  ))}
              </div>
            </SidebarFooter>
          )}
        </Sidebar>
        <SidebarInset className={state.variant === "floating" ? "min-h-0 pt-2" : "min-h-0"}>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2">
            {state.collapsible === "offcanvas" && <SidebarTrigger />}
            <span className="text-[13px] text-muted-foreground">Dashboard</span>
          </header>
          <div className="flex flex-col gap-3 px-2 py-4">
            <div className="h-4 w-2/3 rounded-md bg-hover" />
            <div className="h-4 w-1/2 rounded-md bg-hover" />
            <div className="h-24 rounded-lg bg-hover" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Layout" />
      <PlayField label="Variant">
        <PlaySelect
          value={state.variant}
          onChange={(v) => set("variant", v as SidebarVariant)}
          options={[
            { value: "sidebar", label: "Sidebar" },
            { value: "floating", label: "Floating" },
            { value: "inset", label: "Inset" },
          ]}
        />
      </PlayField>
      <PlayField label="Collapsible">
        <PlaySelect
          value={state.collapsible}
          onChange={(v) => set("collapsible", v as SidebarCollapsible)}
          options={[
            { value: "offcanvas", label: "Offcanvas" },
            { value: "none", label: "None" },
          ]}
        />
      </PlayField>
      <Switch
        label="Open"
        checked={state.collapsible === "offcanvas" ? state.open : true}
        onToggle={() => set("open", !state.open)}
        disabled={state.collapsible !== "offcanvas"}
        className={PLAY_SWITCH}
      />
      <PlayField label="Collapsed peek">
        <PlaySelect
          value={state.peek}
          onChange={(v) => set("peek", v as PlayState["peek"])}
          options={[
            { value: "none", label: "None" },
            { value: "hover", label: "On hover" },
            { value: "click", label: "On click" },
          ]}
        />
      </PlayField>
      <Switch
        label="Loading"
        checked={state.loading}
        onToggle={() => set("loading", !state.loading)}
        className={PLAY_SWITCH}
      />
      <PlayDivider />
      <PlaySection label="Header" />
      <PlayField label="Brand">
        <PlaySelect
          value={state.brand}
          onChange={(v) => set("brand", v as PlayState["brand"])}
          options={[
            { value: "workspace", label: "Workspace" },
            { value: "logo", label: "Logo" },
          ]}
        />
      </PlayField>
      <PlayField label="Stacking">
        <PlaySelect
          value={state.headerStack}
          onChange={(v) => set("headerStack", v as PlayState["headerStack"])}
          options={[
            { value: "vertical", label: "Vertical" },
            { value: "horizontal", label: "Horizontal" },
          ]}
        />
      </PlayField>
      <PlayField label="Header actions">
        <PlaySelect
          value={String(state.headerActions)}
          onChange={(v) => set("headerActions", Number(v) as PlayState["headerActions"])}
          options={[
            { value: "0", label: "None" },
            { value: "1", label: "One" },
            { value: "2", label: "Two" },
          ]}
        />
      </PlayField>
      <PlayDivider />
      <PlaySection label="Sections" />
      <PlayField label="Section actions">
        <PlaySelect
          value={String(state.groupActions)}
          onChange={(v) => set("groupActions", Number(v) as PlayState["groupActions"])}
          options={[
            { value: "0", label: "None" },
            { value: "1", label: "One" },
            { value: "2", label: "Two" },
            { value: "3", label: "Three" },
          ]}
        />
      </PlayField>
      <Switch
        label="Collapsible sections"
        checked={state.collapsibleGroups}
        onToggle={() => set("collapsibleGroups", !state.collapsibleGroups)}
        className={PLAY_SWITCH}
      />
      <Switch
        label="Sub-menus"
        checked={state.leading === "icon" && state.subMenu}
        onToggle={() => set("subMenu", !state.subMenu)}
        disabled={state.leading !== "icon"}
        className={PLAY_SWITCH}
      />
      <PlayDivider />
      <PlaySection label="Rows" />
      <PlayField label="Leading">
        <PlaySelect
          value={state.leading}
          onChange={(v) => set("leading", v as PlayState["leading"])}
          options={[
            { value: "icon", label: "Icon" },
            { value: "dot", label: "Status dot" },
          ]}
        />
      </PlayField>
      <Switch
        label="Badges"
        checked={state.badges}
        onToggle={() => set("badges", !state.badges)}
        className={PLAY_SWITCH}
      />
      <Switch
        label="Row actions"
        checked={state.actions}
        onToggle={() => set("actions", !state.actions)}
        className={PLAY_SWITCH}
      />
      <PlayDivider />
      <PlaySection label="Footer" />
      <PlayField label="Stacking">
        <PlaySelect
          value={state.footerStack}
          onChange={(v) => set("footerStack", v as PlayState["footerStack"])}
          options={[
            { value: "vertical", label: "Vertical" },
            { value: "horizontal", label: "Horizontal" },
          ]}
        />
      </PlayField>
      <PlayField label="Footer actions">
        <PlaySelect
          value={String(state.footerActions)}
          onChange={(v) => set("footerActions", Number(v) as PlayState["footerActions"])}
          options={[
            { value: "0", label: "None" },
            { value: "1", label: "One" },
            { value: "2", label: "Two" },
          ]}
        />
      </PlayField>
      <Switch
        label="Footer user"
        checked={state.footerUser}
        onToggle={() => set("footerUser", !state.footerUser)}
        className={PLAY_SWITCH}
      />
    </PlaygroundPanel>
  );

  return children({
    // Doc-page preview and /demo card share one state; the collapse animates
    // between fixed widths (never height/width "auto"), so it stays correct
    // under the /demo page's scaled card.
    // Fills the ComponentPreview stage edge to edge (the stage sets the
    // height; the shell stretches into it).
    preview: shell("h-full self-stretch"),
    demoPreview: <div className="w-full max-w-[460px]">{shell("h-[480px]", true)}</div>,
    controls,
    code: buildSidebarPlaygroundCode(state),
  });
}
