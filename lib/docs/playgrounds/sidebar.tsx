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
  type SidebarSide,
  type SidebarVariant,
  type SidebarCollapsible,
} from "@/components/flavored/sidebar";
import { useIcons, type IconComponent } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { fontWeights } from "@/lib/font-weight";
import { Switch } from "@/registry/radix/switch";
import { Button } from "@/registry/radix/button";
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
  side: SidebarSide;
  collapsible: SidebarCollapsible;
  open: boolean;
  /** Search placement: full bar below the header, or an inline icon button. */
  search: "below" | "inline";
  /** Leading treatment for the Platform rows: icon column, or thread-style
   *  status dot (filled = active, ring = idle). */
  leading: "icon" | "dot";
  /** Header action buttons clustered on the first group's label (0–3). */
  groupActions: 0 | 1 | 2 | 3;
  badges: boolean;
  subMenu: boolean;
  /** Menu-features treatment: hover row actions + collapsible sub-menu. */
  actions: boolean;
  footerUser: boolean;
  loading: boolean;
}

const DEFAULT_STATE: PlayState = {
  variant: "sidebar",
  side: "left",
  collapsible: "offcanvas",
  open: true,
  search: "below",
  leading: "icon",
  groupActions: 0,
  badges: true,
  subMenu: true,
  actions: true,
  footerUser: true,
  loading: false,
};

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
  const providerProps = o.collapsible === "offcanvas" ? ` open={open} onOpenChange={setOpen}` : ``;
  lines.push(`<SidebarProvider${providerProps}>`);
  const sidebarProps = [
    o.side !== "left" ? `side="${o.side}"` : null,
    o.variant !== "sidebar" ? `variant="${o.variant}"` : null,
    o.collapsible !== "offcanvas" ? `collapsible="${o.collapsible}"` : null,
  ]
    .filter(Boolean)
    .join(" ");
  lines.push(`  <Sidebar${sidebarProps ? ` ${sidebarProps}` : ""}>`);
  lines.push(`    <SidebarHeader>{/* workspace row */}</SidebarHeader>`);
  lines.push(`    <SidebarContent>`);
  lines.push(`      <SidebarGroup collapsible>`);
  lines.push(
    `        <SidebarGroupLabel>${o.leading === "dot" ? "fluid-functionalism" : "Platform"}</SidebarGroupLabel>`
  );
  if (o.groupActions > 0) {
    lines.push(`        {/* 1-3 header actions on the label row */}`);
    lines.push(`        <SidebarGroupActions>`);
    for (const action of GROUP_ACTION_SET.slice(0, o.groupActions)) {
      lines.push(`          <SidebarGroupAction aria-label="${action.label}">`);
      lines.push(`            <${action.icon.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("")}Icon />`);
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
    lines.push(`      <SidebarGroup collapsible>`);
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
    lines.push(`      <SidebarGroup collapsible>`);
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
    lines.push(`    <SidebarFooter>{/* user row */}</SidebarFooter>`);
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
      side: pick(["left", "left", "right"] as const),
      collapsible: pick(["offcanvas", "offcanvas", "none"] as const),
      open: true,
      search: pick(["below", "below", "inline"] as const),
      leading: pick(["icon", "icon", "dot"] as const),
      groupActions: pick([0, 0, 1, 2, 3] as const),
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

  // Shared header cluster for both groups.
  const groupActionCluster =
    state.groupActions > 0 ? (
      <SidebarGroupActions>
        {GROUP_ACTION_SET.slice(0, state.groupActions).map((a) => (
          <SidebarGroupAction key={a.icon} aria-label={a.label}>
            {createElement(icons[a.icon], {})}
          </SidebarGroupAction>
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
      >
        <Sidebar
          side={state.side}
          variant={state.variant}
          collapsible={state.collapsible}
          className="h-full"
        >
          <SidebarHeader>
            <div className={state.search === "inline" ? "flex items-center gap-1" : "contents"}>
            <div className={state.search === "inline" ? "min-w-0 flex-1" : "contents"}>
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
            </div>
            {state.search === "inline" && (
              <Button
                variant="ghost"
                size="icon-compact"
                aria-label="Search"
                className="shrink-0 rounded-full"
              >
                {createElement(icons.search, {})}
              </Button>
            )}
            </div>
            {state.search === "below" && (
              <div className="relative">
                {createElement(icons.search, {
                  size: 14,
                  strokeWidth: 1.5,
                  className:
                    "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground",
                })}
                <SidebarInput placeholder="Search…" aria-label="Search" className="pl-8" />
              </div>
            )}
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup collapsible>
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
              <SidebarGroup collapsible>
                <SidebarGroupLabel>portfolio-site</SidebarGroupLabel>
                {groupActionCluster}
                <SidebarMenu>{threadItems(SIDEBAR_THREADS_ALT).map(menuRow)}</SidebarMenu>
              </SidebarGroup>
            )}
            {!state.loading && state.leading === "icon" && state.subMenu && (
              <SidebarGroup collapsible>
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
      <PlayField label="Side">
        <PlaySelect
          value={state.side}
          onChange={(v) => set("side", v as SidebarSide)}
          options={[
            { value: "left", label: "Left" },
            { value: "right", label: "Right" },
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
      <PlayDivider />
      <PlaySection label="Content" />
      <PlayField label="Search">
        <PlaySelect
          value={state.search}
          onChange={(v) => set("search", v as PlayState["search"])}
          options={[
            { value: "below", label: "Below" },
            { value: "inline", label: "Inline" },
          ]}
        />
      </PlayField>
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
      <PlayField label="Label actions">
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
        label="Badges"
        checked={state.badges}
        onToggle={() => set("badges", !state.badges)}
        className={PLAY_SWITCH}
      />
      <Switch
        label="Sub-menu"
        checked={state.leading === "icon" && state.subMenu}
        onToggle={() => set("subMenu", !state.subMenu)}
        disabled={state.leading !== "icon"}
        className={PLAY_SWITCH}
      />
      <Switch
        label="Menu actions"
        checked={state.actions}
        onToggle={() => set("actions", !state.actions)}
        className={PLAY_SWITCH}
      />
      <Switch
        label="Footer user"
        checked={state.footerUser}
        onToggle={() => set("footerUser", !state.footerUser)}
        className={PLAY_SWITCH}
      />
      <Switch
        label="Loading"
        checked={state.loading}
        onToggle={() => set("loading", !state.loading)}
        className={PLAY_SWITCH}
      />
    </PlaygroundPanel>
  );

  return children({
    // Doc-page preview and /demo card share one state; the collapse animates
    // between fixed widths (never height/width "auto"), so it stays correct
    // under the /demo page's scaled card.
    preview: shell("h-[560px]"),
    demoPreview: <div className="w-full max-w-[460px]">{shell("h-[480px]", true)}</div>,
    controls,
    code: buildSidebarPlaygroundCode(state),
  });
}
