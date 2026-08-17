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
import { useIcons } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { fontWeights } from "@/lib/font-weight";
import { Switch } from "@/registry/radix/switch";
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
  SIDEBAR_PROJECTS,
} from "@/app/components/demo-data";
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
  lines.push(`  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem,`);
  const menuExtras = [
    "SidebarMenuButton",
    ...(o.badges ? ["SidebarMenuBadge"] : []),
    ...(o.actions ? ["SidebarMenuAction"] : []),
    ...(o.subMenu ? ["SidebarMenuSub", "SidebarMenuSubItem", "SidebarMenuSubButton"] : []),
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
  lines.push(`      <SidebarGroup>`);
  lines.push(`        <SidebarGroupLabel>Platform</SidebarGroupLabel>`);
  lines.push(`        <SidebarMenu>`);
  if (o.loading) {
    lines.push(`          {items.map((item) => (`);
    lines.push(`            <SidebarMenuSkeleton key={item.label} showIcon />`);
    lines.push(`          ))}`);
  } else {
    lines.push(`          {items.map((item) => (`);
    lines.push(`            <SidebarMenuItem key={item.label}>`);
    lines.push(`              <SidebarMenuButton icon={item.icon} isActive={item.active}>`);
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
    if (o.subMenu) {
      lines.push(`          <SidebarMenuItem>`);
      if (o.actions) {
        lines.push(`            <SidebarMenuButton icon={FolderIcon} onClick={() => setProjectsOpen((v) => !v)}>`);
        lines.push(`              Projects`);
        lines.push(`              <ChevronIcon className={projectsOpen ? "" : "-rotate-90"} />`);
        lines.push(`            </SidebarMenuButton>`);
        lines.push(`            <SidebarMenuSub open={projectsOpen}>`);
      } else {
        lines.push(`            <SidebarMenuButton icon={FolderIcon}>Projects</SidebarMenuButton>`);
        lines.push(`            <SidebarMenuSub>`);
      }
      lines.push(`              {projects.map((p) => (`);
      lines.push(`                <SidebarMenuSubItem key={p}>`);
      lines.push(`                  <SidebarMenuSubButton href="#">{p}</SidebarMenuSubButton>`);
      lines.push(`                </SidebarMenuSubItem>`);
      lines.push(`              ))}`);
      lines.push(`            </SidebarMenuSub>`);
      lines.push(`          </SidebarMenuItem>`);
    }
  }
  lines.push(`        </SidebarMenu>`);
  lines.push(`      </SidebarGroup>`);
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

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

export function SidebarPlayground({ children }: PlaygroundProps) {
  const [state, setState] = useState<PlayState>(DEFAULT_STATE);
  const [projectsOpen, setProjectsOpen] = useState(true);
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
      badges: Math.random() > 0.3,
      subMenu: Math.random() > 0.3,
      actions: Math.random() > 0.4,
      footerUser: Math.random() > 0.4,
      loading: Math.random() > 0.85,
    });
  };

  const FolderIcon = icons["folder"];
  const ChevronsUpDown = icons["chevrons-up-down"];

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
        shortcut={null}
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
                          {createElement(ChevronsUpDown, {
                            size: 14,
                            strokeWidth: 1.5,
                            className: "text-muted-foreground",
                          })}
                        </span>
                      </SidebarMenuButton>
                    }
                  />
                  <DropdownContent align="start" sideOffset={4} checkedIndex={0}>
                    <MenuItem index={0} icon={icons["square-library"]} label="Acme Inc" checked onSelect={() => {}} />
                    <MenuItem index={1} icon={icons.rocket} label="Fluid Labs" onSelect={() => {}} />
                    <MenuItem index={2} icon={icons.user} label="Personal" onSelect={() => {}} />
                    <MenuItem index={3} icon={icons.plus} label="New workspace" onSelect={() => {}} />
                  </DropdownContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="relative">
              {createElement(icons.search, {
                size: 14,
                strokeWidth: 1.5,
                className:
                  "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground",
              })}
              <SidebarInput placeholder="Search…" aria-label="Search" className="pl-8" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{SIDEBAR_GROUP_LABEL}</SidebarGroupLabel>
              <SidebarMenu>
                {state.loading
                  ? SIDEBAR_ITEMS.map((item) => (
                      <SidebarMenuSkeleton key={item.label} showIcon />
                    ))
                  : SIDEBAR_ITEMS.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton icon={icons[item.icon]} isActive={item.active}>
                          {item.label}
                        </SidebarMenuButton>
                        {state.badges && item.badge && (
                          <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                        )}
                        {state.actions && !item.badge && (
                          <DropdownMenu>
                            <DropdownTrigger
                              render={
                                <SidebarMenuAction showOnHover aria-label="More options">
                                  {createElement(icons["more-horizontal"], {})}
                                </SidebarMenuAction>
                              }
                            />
                            <DropdownContent align="start" sideOffset={4}>
                              <MenuItem index={0} icon={icons.pencil} label="Rename" onSelect={() => {}} />
                              <MenuItem index={1} icon={icons.link} label="Share" onSelect={() => {}} />
                              <MenuItem index={2} icon={icons.x} label="Delete" onSelect={() => {}} />
                            </DropdownContent>
                          </DropdownMenu>
                        )}
                      </SidebarMenuItem>
                    ))}
                {!state.loading && state.subMenu && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      icon={FolderIcon}
                      onClick={state.actions ? () => setProjectsOpen((v) => !v) : undefined}
                      aria-expanded={state.actions ? projectsOpen : undefined}
                    >
                      Projects
                      {state.actions && (
                        <span className="ml-auto inline-flex">
                          {createElement(icons["chevron-down"], {
                            size: 14,
                            strokeWidth: 1.5,
                            className: `text-muted-foreground transition-transform duration-80 ${
                              projectsOpen ? "" : "-rotate-90"
                            }`,
                          })}
                        </span>
                      )}
                    </SidebarMenuButton>
                    <SidebarMenuSub open={state.actions ? projectsOpen : true}>
                      {SIDEBAR_PROJECTS.map((p) => (
                        <SidebarMenuSubItem key={p}>
                          <SidebarMenuSubButton href="#" onClick={(e) => e.preventDefault()}>
                            {p}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroup>
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
                          <span className="text-[13px] text-foreground">Micka Touillaud</span>
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
                    <DropdownContent side="top" align="start" sideOffset={6}>
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
        <SidebarInset className="min-h-0">
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
      <Switch
        label="Badges"
        checked={state.badges}
        onToggle={() => set("badges", !state.badges)}
        className={PLAY_SWITCH}
      />
      <Switch
        label="Sub-menu"
        checked={state.subMenu}
        onToggle={() => set("subMenu", !state.subMenu)}
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
    demoPreview: <div className="w-full max-w-[460px]">{shell("h-[280px]", true)}</div>,
    controls,
    code: buildSidebarPlaygroundCode(state),
  });
}
