"use client";

import { useState, createElement, type ReactNode } from "react";
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
  SidebarMenuActions,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarInset,
  type SidebarVariant,
} from "@/components/flavored/sidebar";
import { useIcons, type IconName } from "@/lib/icon-context";
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
  Card,
  CardImage,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/registry/default/card";
import { BANNER } from "@/lib/docs/playgrounds/card";
import { useSurface } from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import { SIDEBAR_ITEMS, SIDEBAR_THREADS } from "@/app/components/demo-data";
import { WorkspaceMenuItems } from "@/lib/docs/workspace-demo";
import type { PlaygroundProps } from "./types";

// ── Sidebar playground ───────────────────────────────────
// The panel mirrors the sidebar's own anatomy top to bottom — Layout, Header,
// Sections, the three content levels, Footer — so a control's position tells
// you what it touches. Each content level answers the same few questions:
// what leads the row, whether it nests, how many actions, badges on or off.

type Count3 = 0 | 1 | 2 | 3;
type Count2 = 0 | 1 | 2;
type Stack = "horizontal" | "vertical";

interface PlayState {
  // Layout
  design: SidebarVariant;
  /** What the collapsed edge does: nothing, or peek the sidebar back. */
  collapsedBehavior: "none" | "hover" | "click";
  state: "opened" | "closed" | "loading";
  // Header
  headerPrimary: "dropdown" | "logo" | "none";
  headerStack: Stack;
  headerActions: Count2;
  // Sections
  sectionsCollapsible: boolean;
  sectionActions: Count3;
  // Content level 1
  l1Primary: "threads" | "menu";
  l1Children: boolean;
  l1Actions: Count3;
  l1Badges: boolean;
  // Content level 2 — the deepest level the menu nests to.
  l2Icon: boolean;
  l2Actions: Count3;
  l2Badges: boolean;
  // Footer
  footerPrimary: "dropdown" | "none";
  footerStack: Stack;
  footerActions: Count2;
  /** Anchored promo card above the footer rows. */
  footerPromo: boolean;
}

const DEFAULT_STATE: PlayState = {
  design: "inset",
  collapsedBehavior: "none",
  state: "opened",
  headerPrimary: "dropdown",
  headerStack: "horizontal",
  headerActions: 2,
  sectionsCollapsible: true,
  sectionActions: 1,
  l1Primary: "threads",
  l1Children: false,
  l1Actions: 1,
  l1Badges: false,
  l2Icon: true,
  l2Actions: 1,
  l2Badges: true,
  footerPrimary: "dropdown",
  footerStack: "horizontal",
  footerActions: 2,
  footerPromo: true,
};

// ── Content sets ─────────────────────────────────────────
// Row actions are sliced from the END, so the overflow menu is the one you
// always keep: it stays rightmost and demos the dropdown at every count.
const ROW_ACTION_SET = [
  { icon: "plus", label: "Add" },
  { icon: "pencil", label: "Rename" },
  { icon: "more-horizontal", label: "More options", menu: true },
] as const;

const GROUP_ACTION_SET = [
  { icon: "plus", label: "Add item" },
  { icon: "sliders-horizontal", label: "Section settings" },
  { icon: "more-horizontal", label: "More options" },
] as const;

const SEARCH_SHORTCUT = "⌘K";

const HEADER_ACTION_SET = [
  { icon: "plus", label: "New", shortcut: "⇧⌘O" },
  { icon: "users", label: "Invite", shortcut: "⇧⌘I" },
] as const;

const FOOTER_ACTION_SET = [
  { icon: "settings", label: "Settings" },
  { icon: "moon", label: "Theme" },
] as const;

/** Level-2 rows, hosted by the first level-1 row of each section. */
const L2_ROWS = [
  { icon: "folder", label: "Design system", badge: "4" },
  { icon: "folder", label: "Marketing site", badge: "2" },
  { icon: "folder", label: "Travel app" },
] as const;

const SECTION_LABELS = {
  threads: ["fluid-functionalism", "portfolio-site"],
  menu: ["Platform", "Workspace"],
} as const;

/** Anchored footer promo — the Card component on a surface one step above
 *  the sidebar it sits in, so it reads as a card resting on the rail. */
function FooterPromo({ onDismiss }: { onDismiss: () => void }) {
  const substrate = useSurface();
  const shape = useShape();
  return (
    <Card
      size="compact"
      dismissible
      onDismiss={onDismiss}
      href="/docs"
      label="See what's new in Fluid Functionalism"
      className={`${shape.container} overflow-hidden ${surfaceClasses(
        Math.min(substrate + 1, 8),
        2
      )}`}
    >
      {/* Capped so a drag-resized rail doesn't grow the banner with it. */}
      <CardImage src={BANNER} className="aspect-[2/1] max-h-28" />
      <CardHeader className="gap-0 pt-4">
        <CardTitle>See what&apos;s new</CardTitle>
        <CardDescription>Fresh in Fluid Functionalism</CardDescription>
      </CardHeader>
    </Card>
  );
}

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

/** "more-horizontal" → "MoreHorizontalIcon", for the generated snippet. */
function iconTag(name: string): string {
  return (
    name
      .split("-")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join("") + "Icon"
  );
}

// ── Generated code ───────────────────────────────────────

function rowActionLines(count: Count3, indent: string): string[] {
  if (count === 0) return [];
  const actions = ROW_ACTION_SET.slice(-count);
  if (count === 1) {
    return [
      `${indent}<SidebarMenuAction showOnHover aria-label="${actions[0].label}">`,
      `${indent}  <${iconTag(actions[0].icon)} />`,
      `${indent}</SidebarMenuAction>`,
    ];
  }
  return [
    `${indent}{/* more than one action: the cluster owns the row's gutter */}`,
    `${indent}<SidebarMenuActions showOnHover>`,
    ...actions.flatMap((a) => [
      `${indent}  <SidebarMenuAction aria-label="${a.label}">`,
      `${indent}    <${iconTag(a.icon)} />`,
      `${indent}  </SidebarMenuAction>`,
    ]),
    `${indent}</SidebarMenuActions>`,
  ];
}

export function buildSidebarPlaygroundCode(o: PlayState): string {
  const lines: string[] = [];
  const loading = o.state === "loading";
  // Threads are leaves — only the icon menu nests.
  const nests = o.l1Primary === "menu" && o.l1Children;

  lines.push(`import {`);
  lines.push(`  SidebarProvider, Sidebar, SidebarTrigger, SidebarInset,`);
  lines.push(`  SidebarHeader, SidebarContent, SidebarFooter,`);
  lines.push(
    o.sectionActions > 0
      ? `  SidebarGroup, SidebarGroupLabel, SidebarGroupActions, SidebarGroupAction,`
      : `  SidebarGroup, SidebarGroupLabel,`
  );
  lines.push(`  SidebarMenu, SidebarMenuItem,`);
  const maxActions = Math.max(o.l1Actions, o.l2Actions);
  const anyBadge = o.l1Badges || o.l2Badges;
  const menuExtras = [
    "SidebarMenuButton",
    ...(anyBadge ? ["SidebarMenuBadge"] : []),
    ...(maxActions > 0 ? ["SidebarMenuAction"] : []),
    ...(maxActions > 1 ? ["SidebarMenuActions"] : []),
    ...(nests ? ["SidebarMenuSub", "SidebarMenuSubItem", "SidebarMenuSubButton"] : []),
    ...(loading ? ["SidebarMenuSkeleton"] : []),
  ];
  lines.push(`  ${menuExtras.join(", ")},`);
  lines.push(`} from "./components";`);
  lines.push(``);

  const providerProps =
    ` open={open} onOpenChange={setOpen}` +
    (o.collapsedBehavior !== "none" ? ` peek="${o.collapsedBehavior}"` : ``);
  lines.push(`<SidebarProvider${providerProps}>`);
  lines.push(`  <Sidebar${o.design !== "sidebar" ? ` variant="${o.design}"` : ""}>`);

  // Header
  const headerActions = HEADER_ACTION_SET.slice(0, o.headerActions);
  const brandComment =
    o.headerPrimary === "logo"
      ? `{/* logo lockup */}`
      : o.headerPrimary === "dropdown"
        ? `{/* workspace switcher */}`
        : null;
  lines.push(`    <SidebarHeader>`);
  if (o.headerStack === "horizontal") {
    lines.push(`      {/* horizontal: search + actions share the brand line */}`);
    lines.push(`      <div className="flex items-center gap-1">`);
    if (brandComment) lines.push(`        ${brandComment}`);
    lines.push(`        <Button variant="ghost" size="icon-compact" aria-label="Search">`);
    lines.push(`          <SearchIcon />`);
    lines.push(`        </Button>`);
    for (const a of headerActions) {
      lines.push(`        <Button variant="ghost" size="icon-compact" aria-label="${a.label}">`);
      lines.push(`          <${iconTag(a.icon)} />`);
      lines.push(`        </Button>`);
    }
    lines.push(`      </div>`);
  } else {
    if (brandComment) lines.push(`      ${brandComment}`);
    lines.push(`      <SidebarInput placeholder="Search…" />`);
    if (headerActions.length > 0) {
      lines.push(`      <SidebarMenu>`);
      for (const a of headerActions) {
        lines.push(`        <SidebarMenuItem>`);
        lines.push(`          <SidebarMenuButton icon={${iconTag(a.icon)}}>`);
        lines.push(`            ${a.label}`);
        lines.push(`            {/* shortcut chip, revealed on row hover */}`);
        lines.push(`            <kbd>${a.shortcut}</kbd>`);
        lines.push(`          </SidebarMenuButton>`);
        lines.push(`        </SidebarMenuItem>`);
      }
      lines.push(`      </SidebarMenu>`);
    }
  }
  lines.push(`    </SidebarHeader>`);

  // Content
  lines.push(`    <SidebarContent>`);
  lines.push(`      <SidebarGroup${o.sectionsCollapsible ? " collapsible" : ""}>`);
  lines.push(`        <SidebarGroupLabel>${SECTION_LABELS[o.l1Primary][0]}</SidebarGroupLabel>`);
  if (o.sectionActions > 0) {
    lines.push(`        <SidebarGroupActions>`);
    for (const a of GROUP_ACTION_SET.slice(0, o.sectionActions)) {
      lines.push(`          <SidebarGroupAction aria-label="${a.label}">`);
      lines.push(`            <${iconTag(a.icon)} />`);
      lines.push(`          </SidebarGroupAction>`);
    }
    lines.push(`        </SidebarGroupActions>`);
  }
  lines.push(`        <SidebarMenu>`);
  if (loading) {
    lines.push(`          {items.map((item) => (`);
    lines.push(`            <SidebarMenuSkeleton key={item.label} showIcon />`);
    lines.push(`          ))}`);
  } else {
    lines.push(`          {items.map((item) => (`);
    lines.push(`            <SidebarMenuItem key={item.label}>`);
    if (o.l1Primary === "threads") {
      lines.push(`              {/* semantic status drives the dot, data-status,`);
      lines.push(`                  and the screen-reader "unread" text */}`);
      lines.push(`              <SidebarMenuButton status={item.status}>{item.label}</SidebarMenuButton>`);
    } else {
      lines.push(`              <SidebarMenuButton icon={item.icon} isActive={item.active}>`);
      lines.push(`                {item.label}`);
      lines.push(`              </SidebarMenuButton>`);
    }
    if (o.l1Badges) {
      lines.push(`              {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}`);
    }
    lines.push(...rowActionLines(o.l1Actions, `              `));
    if (nests) {
      lines.push(`              <SidebarMenuSub open={item.open}>`);
      lines.push(`                {item.children.map((child) => (`);
      lines.push(`                  <SidebarMenuSubItem key={child.label}>`);
      lines.push(
        o.l2Icon
          ? `                    <SidebarMenuSubButton icon={child.icon} href="#">`
          : `                    <SidebarMenuSubButton href="#">`
      );
      lines.push(`                      {child.label}`);
      lines.push(`                    </SidebarMenuSubButton>`);
      if (o.l2Badges) {
        lines.push(`                    {child.badge && <SidebarMenuBadge>{child.badge}</SidebarMenuBadge>}`);
      }
      lines.push(...rowActionLines(o.l2Actions, `                    `));
      lines.push(`                  </SidebarMenuSubItem>`);
      lines.push(`                ))}`);
      lines.push(`              </SidebarMenuSub>`);
    }
    lines.push(`            </SidebarMenuItem>`);
    lines.push(`          ))}`);
  }
  lines.push(`        </SidebarMenu>`);
  lines.push(`      </SidebarGroup>`);
  if (!loading) {
    lines.push(`      <SidebarGroup${o.sectionsCollapsible ? " collapsible" : ""}>`);
    lines.push(`        <SidebarGroupLabel>${SECTION_LABELS[o.l1Primary][1]}</SidebarGroupLabel>`);
    lines.push(`        <SidebarMenu>{/* same row anatomy */}</SidebarMenu>`);
    lines.push(`      </SidebarGroup>`);
  }
  lines.push(`    </SidebarContent>`);

  // Footer
  if (o.footerPrimary === "dropdown" || o.footerActions > 0 || o.footerPromo) {
    const footerActions = FOOTER_ACTION_SET.slice(0, o.footerActions);
    const promoOnly =
      o.footerPromo && o.footerPrimary === "none" && footerActions.length === 0;
    lines.push(
      promoOnly
        ? `    {/* nothing under the card — it sits flush on the edge */}\n    <SidebarFooter className="pb-0">`
        : `    <SidebarFooter>`
    );
    if (o.footerPromo) {
      lines.push(`      {/* anchored promo: Card on a surface one step above */}`);
      lines.push(`      <Card size="compact" dismissible onDismiss={hide} href="/docs">`);
      lines.push(`        <CardImage src={banner} className="aspect-[2/1] max-h-28" />`);
      lines.push(`        <CardHeader>`);
      lines.push(`          <CardTitle>See what's new</CardTitle>`);
      lines.push(`          <CardDescription>Fresh in Fluid Functionalism</CardDescription>`);
      lines.push(`        </CardHeader>`);
      lines.push(`      </Card>`);
    }
    if (o.footerStack === "horizontal") {
      if (footerActions.length > 0) {
        lines.push(`      <div className="flex items-center gap-1">`);
        if (o.footerPrimary === "dropdown") lines.push(`        {/* user row */}`);
        for (const a of footerActions) {
          lines.push(`        <Button variant="ghost" size="icon-compact" aria-label="${a.label}">`);
          lines.push(`          <${iconTag(a.icon)} />`);
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
        for (const a of footerActions) {
          lines.push(`        <SidebarMenuItem>`);
          lines.push(`          <SidebarMenuButton icon={${iconTag(a.icon)}}>${a.label}</SidebarMenuButton>`);
          lines.push(`        </SidebarMenuItem>`);
        }
        lines.push(`      </SidebarMenu>`);
      }
      if (o.footerPrimary === "dropdown") lines.push(`      {/* user row */}`);
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

// ── Component ────────────────────────────────────────────

export function SidebarPlayground({ children }: PlaygroundProps) {
  const [state, setState] = useState<PlayState>(DEFAULT_STATE);
  const [closedRows, setClosedRows] = useState<Record<string, boolean>>({});
  const icons = useIcons();
  const shape = useShape();
  const set = <K extends keyof PlayState>(key: K, value: PlayState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  // Nested rows start open, so switching a level on shows the tree at once.
  const isRowOpen = (key: string) => !closedRows[key];
  const toggleRow = (key: string) =>
    setClosedRows((prev) => ({ ...prev, [key]: !prev[key] }));

  const randomize = () => {
    setState({
      design: pick(["sidebar", "floating", "inset"] as const),
      collapsedBehavior: pick(["none", "none", "hover", "click"] as const),
      state: pick(["opened", "opened", "opened", "closed", "loading"] as const),
      headerPrimary: pick(["dropdown", "dropdown", "logo", "none"] as const),
      headerStack: pick(["horizontal", "vertical"] as const),
      headerActions: pick([0, 1, 2, 2] as const),
      sectionsCollapsible: Math.random() > 0.25,
      sectionActions: pick([0, 1, 2, 3] as const),
      l1Primary: pick(["threads", "menu"] as const),
      l1Children: Math.random() > 0.5,
      l1Actions: pick([0, 1, 1, 2, 3] as const),
      l1Badges: Math.random() > 0.5,
      l2Icon: Math.random() > 0.4,
      l2Actions: pick([0, 1, 2] as const),
      l2Badges: Math.random() > 0.5,
      footerPrimary: pick(["dropdown", "dropdown", "none"] as const),
      footerStack: pick(["horizontal", "horizontal", "vertical"] as const),
      footerActions: pick([0, 1, 2, 2] as const),
      footerPromo: Math.random() > 0.4,
    });
  };

  const ChevronsUpDown = icons["chevrons-up-down"];

  /** Tooltip content with the action's keystroke, on the same inverted
   *  surface treatment the sidebar trigger's tooltip uses. */
  const tipWithShortcut = (label: string, shortcut: string) => (
    <span className="flex items-center gap-2">
      {label}
      <kbd className="flex h-4 min-w-4 items-center justify-center rounded border border-background/30 px-1 font-sans text-[10px] text-background/80">
        {shortcut}
      </kbd>
    </span>
  );
  const loading = state.state === "loading";
  const headerHorizontal = state.headerStack === "horizontal";
  const footerHorizontal = state.footerStack === "horizontal";
  const headerActionSet = HEADER_ACTION_SET.slice(0, state.headerActions);
  // Only icon menus nest; a thread row is a leaf.
  const l1CanNest = state.l1Primary === "menu";
  const l1Children = l1CanNest && state.l1Children;
  const footerActionSet = FOOTER_ACTION_SET.slice(0, state.footerActions);
  // A promo card with no rows under it has nothing to be spaced from, so the
  // footer drops its bottom padding and the card sits flush on the edge.
  const promoOnlyFooter =
    state.footerPromo && state.footerPrimary === "none" && footerActionSet.length === 0;

  /** Row actions for one level: a single action uses the canonical part,
   *  more than one goes through the cluster that owns the row's gutter. */
  const rowActions = (count: Count3) => {
    if (count === 0) return null;
    const chosen = ROW_ACTION_SET.slice(-count);
    const render = (a: (typeof ROW_ACTION_SET)[number], standalone: boolean) => {
      const button = (
        <SidebarMenuAction showOnHover={standalone} aria-label={a.label}>
          {createElement(icons[a.icon as IconName], {})}
        </SidebarMenuAction>
      );
      if (!("menu" in a && a.menu)) {
        return (
          <Tooltip key={a.icon} content={a.label} side="top">
            {button}
          </Tooltip>
        );
      }
      return (
        <DropdownMenu key={a.icon}>
          <DropdownTrigger render={button} />
          {/* 240px matches the header/footer trigger width, so every menu in
              the sidebar reads as one family. */}
          <DropdownContent className="min-w-0 w-[240px]" align="start" sideOffset={4}>
            <MenuItem index={0} icon={icons.pencil} label="Rename" onSelect={() => {}} />
            <MenuItem index={1} icon={icons.link} label="Share" onSelect={() => {}} />
            <MenuItem index={2} icon={icons.x} label="Delete" onSelect={() => {}} />
          </DropdownContent>
        </DropdownMenu>
      );
    };
    if (count === 1) return render(chosen[0], true);
    return (
      <SidebarMenuActions showOnHover>
        {chosen.map((a) => render(a, false))}
      </SidebarMenuActions>
    );
  };

  const groupActionCluster =
    state.sectionActions > 0 ? (
      <SidebarGroupActions>
        {GROUP_ACTION_SET.slice(0, state.sectionActions).map((a) => (
          <Tooltip key={a.icon} content={a.label} side="top">
            <SidebarGroupAction aria-label={a.label}>
              {createElement(icons[a.icon], {})}
            </SidebarGroupAction>
          </Tooltip>
        ))}
      </SidebarGroupActions>
    ) : null;

  const brandLockup = (
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
  );

  const brandDropdown = (
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
  );

  // Level-1 rows follow the primary-element choice: thread titles carry
  // semantic status, menu rows carry an icon.
  const level1 =
    state.l1Primary === "threads"
      ? SIDEBAR_THREADS.map((t) => ({
          key: t.label,
          label: t.label,
          badge: t.badge,
          status: t.status as "active" | "unread" | "idle" | undefined,
          icon: undefined as IconName | undefined,
          active: undefined as boolean | undefined,
        }))
      : SIDEBAR_ITEMS.map((i) => ({
          key: i.label,
          label: i.label,
          badge: i.badge,
          status: undefined as "active" | "unread" | "idle" | undefined,
          icon: i.icon as IconName | undefined,
          active: i.active,
        }));

  const chevron = (open: boolean) => (
    <span className="ml-auto -mr-0.5 inline-flex w-6 justify-center">
      {createElement(icons["chevron-down"], {
        size: 14,
        strokeWidth: 1.5,
        className: `text-muted-foreground transition-transform duration-80 ${
          open ? "" : "-rotate-90"
        }`,
      })}
    </span>
  );

  const subTree = (parentKey: string): ReactNode => (
    <SidebarMenuSub open={isRowOpen(parentKey)}>
      {L2_ROWS.map((row) => (
        <SidebarMenuSubItem key={row.label}>
          <SidebarMenuSubButton
            icon={state.l2Icon ? icons[row.icon] : undefined}
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            {row.label}
          </SidebarMenuSubButton>
          {state.l2Badges && "badge" in row && row.badge && (
            <SidebarMenuBadge>{row.badge}</SidebarMenuBadge>
          )}
          {rowActions(state.l2Actions)}
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );

  const contentSection = (index: 0 | 1) => (
    <SidebarGroup collapsible={state.sectionsCollapsible}>
      <SidebarGroupLabel>{SECTION_LABELS[state.l1Primary][index]}</SidebarGroupLabel>
      {groupActionCluster}
      <SidebarMenu>
        {loading
          ? level1.slice(0, 4).map((row) => <SidebarMenuSkeleton key={row.key} showIcon />)
          : level1
              .slice(index === 0 ? 0 : 3, index === 0 ? 3 : 5)
              .map((row, i) => {
                const key = `${index}/${row.key}`;
                const hasChildren = l1Children && i === 0;
                return (
                  <SidebarMenuItem key={row.key}>
                    <SidebarMenuButton
                      icon={row.icon ? icons[row.icon] : undefined}
                      status={row.status}
                      isActive={row.active}
                      onClick={hasChildren ? () => toggleRow(key) : undefined}
                      aria-expanded={hasChildren ? isRowOpen(key) : undefined}
                    >
                      {row.label}
                      {hasChildren && chevron(isRowOpen(key))}
                    </SidebarMenuButton>
                    {state.l1Badges && row.badge && (
                      <SidebarMenuBadge>{row.badge}</SidebarMenuBadge>
                    )}
                    {rowActions(state.l1Actions)}
                    {hasChildren && subTree(key)}
                  </SidebarMenuItem>
                );
              })}
      </SidebarMenu>
    </SidebarGroup>
  );

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
        open={state.state !== "closed"}
        onOpenChange={(next) => set("state", next ? "opened" : "closed")}
        peek={state.collapsedBehavior}
      >
        <Sidebar variant={state.design} className="h-full">
          <SidebarHeader>
            {/* Stacking rule: vertical keeps the brand row on its own line
                with search and actions stacked beneath as full-width rows;
                horizontal collapses them to icon buttons sharing its line. */}
            <div className={headerHorizontal ? "flex items-center gap-1" : "contents"}>
              <div className={headerHorizontal ? "min-w-0 flex-1" : "contents"}>
                {state.headerPrimary === "logo"
                  ? // Not interactive, so it renders outside SidebarMenu — a
                    // menu row would track the traveling hover background.
                    brandLockup
                  : state.headerPrimary === "dropdown"
                    ? brandDropdown
                    : null}
              </div>
              {headerHorizontal && (
                <>
                  <Tooltip content={tipWithShortcut("Search", SEARCH_SHORTCUT)} side="bottom">
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
                    <Tooltip key={a.icon} content={tipWithShortcut(a.label, a.shortcut)} side="bottom">
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
                <div className="group/search relative">
                  {createElement(icons.search, {
                    size: 14,
                    strokeWidth: 1.5,
                    className:
                      "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground",
                  })}
                  <SidebarInput
                    placeholder="Search…"
                    aria-label="Search"
                    className="pl-8 pr-12"
                  />
                  {/* Revealed on hover / focus, like the action rows' chips —
                      the placeholder owns the field at rest. */}
                  <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-sans text-[11px] text-muted-foreground opacity-0 transition-opacity duration-80 group-hover/search:opacity-100 group-focus-within/search:opacity-100">
                    {SEARCH_SHORTCUT}
                  </kbd>
                </div>
                {headerActionSet.length > 0 && (
                  <SidebarMenu aria-label="Actions">
                    {headerActionSet.map((a) => (
                      <SidebarMenuItem key={a.icon}>
                        <SidebarMenuButton icon={icons[a.icon]}>
                          {a.label}
                          <span className="ml-auto inline-flex opacity-0 transition-opacity duration-80 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100">
                            <kbd className="font-sans text-[11px] text-muted-foreground">
                              {a.shortcut}
                            </kbd>
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
            {contentSection(0)}
            {!loading && contentSection(1)}
          </SidebarContent>
          {(state.footerPrimary === "dropdown" ||
            footerActionSet.length > 0 ||
            state.footerPromo) && (
            <SidebarFooter className={promoOnlyFooter ? "pb-0" : undefined}>
              {state.footerPromo && <FooterPromo onDismiss={() => set("footerPromo", false)} />}
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
              {/* Skip the row wrapper entirely when there's no user row and no
                  horizontal actions — an empty div would still take the
                  footer's gap and hold the card off the edge. */}
              {(state.footerPrimary === "dropdown" ||
                (footerHorizontal && footerActionSet.length > 0)) && (
              <div className={footerHorizontal ? "flex items-center gap-1" : "contents"}>
                {state.footerPrimary === "dropdown" && (
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
                              <span className="min-w-0 truncate text-[13px] text-foreground">
                                Micka Touillaud
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
                        <DropdownContent
                          className="min-w-[240px] w-[var(--radix-dropdown-menu-trigger-width,var(--anchor-width))]"
                          side="top"
                          align="start"
                          sideOffset={6}
                        >
                          <MenuItem index={0} icon={icons.user} label="Profile" onSelect={() => {}} />
                          <MenuItem index={1} icon={icons.settings} label="Settings" onSelect={() => {}} />
                          <MenuItem index={2} icon={icons["arrow-left"]} label="Log out" onSelect={() => {}} />
                        </DropdownContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  </SidebarMenu>
                )}
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
              )}
            </SidebarFooter>
          )}
        </Sidebar>
        <SidebarInset className={state.design === "floating" ? "min-h-0 pt-2" : "min-h-0"}>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2">
            <SidebarTrigger />
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

  const countOptions = (max: 2 | 3) => [
    { value: "0", label: "None" },
    { value: "1", label: "One" },
    { value: "2", label: "Two" },
    ...(max === 3 ? [{ value: "3", label: "Three" }] : []),
  ];

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Layout" />
      <PlayField label="Design">
        <PlaySelect
          value={state.design}
          onChange={(v) => set("design", v as SidebarVariant)}
          options={[
            { value: "sidebar", label: "Sidebar" },
            { value: "floating", label: "Floating" },
            { value: "inset", label: "Inset" },
          ]}
        />
      </PlayField>
      <PlayField label="Collapsed behavior">
        <PlaySelect
          value={state.collapsedBehavior}
          onChange={(v) => set("collapsedBehavior", v as PlayState["collapsedBehavior"])}
          options={[
            { value: "none", label: "None" },
            { value: "hover", label: "On hover" },
            { value: "click", label: "On click" },
          ]}
        />
      </PlayField>
      <PlayField label="State">
        <PlaySelect
          value={state.state}
          onChange={(v) => set("state", v as PlayState["state"])}
          options={[
            { value: "opened", label: "Opened" },
            { value: "closed", label: "Closed" },
            { value: "loading", label: "Loading" },
          ]}
        />
      </PlayField>

      <PlayDivider />
      <PlaySection label="Header" />
      <PlayField label="Primary element">
        <PlaySelect
          value={state.headerPrimary}
          onChange={(v) => set("headerPrimary", v as PlayState["headerPrimary"])}
          options={[
            { value: "dropdown", label: "Dropdown" },
            { value: "logo", label: "Brand logo" },
            { value: "none", label: "None" },
          ]}
        />
      </PlayField>
      <PlayField label="Stacking">
        <PlaySelect
          value={state.headerStack}
          onChange={(v) => set("headerStack", v as Stack)}
          options={[
            { value: "horizontal", label: "Horizontal" },
            { value: "vertical", label: "Vertical" },
          ]}
        />
      </PlayField>
      <PlayField label="Header actions">
        <PlaySelect
          value={String(state.headerActions)}
          onChange={(v) => set("headerActions", Number(v) as Count2)}
          options={countOptions(2)}
        />
      </PlayField>

      <PlayDivider />
      <PlaySection label="Sections" />
      <Switch
        label="Collapsible"
        checked={state.sectionsCollapsible}
        onToggle={() => set("sectionsCollapsible", !state.sectionsCollapsible)}
        className={PLAY_SWITCH}
      />
      <PlayField label="Section actions">
        <PlaySelect
          value={String(state.sectionActions)}
          onChange={(v) => set("sectionActions", Number(v) as Count3)}
          options={countOptions(3)}
        />
      </PlayField>

      <PlayDivider />
      <PlaySection label="Content level 1" />
      <PlayField label="Primary element">
        <PlaySelect
          value={state.l1Primary}
          onChange={(v) => set("l1Primary", v as PlayState["l1Primary"])}
          options={[
            { value: "menu", label: "Menu" },
            { value: "threads", label: "Thread" },
          ]}
        />
      </PlayField>
      {/* Threads are leaves — a discussion doesn't own a sub-tree. */}
      <Switch
        label="Has children"
        checked={l1CanNest && state.l1Children}
        onToggle={() => set("l1Children", !state.l1Children)}
        disabled={!l1CanNest}
        className={PLAY_SWITCH}
      />
      <PlayField label="Actions">
        <PlaySelect
          value={String(state.l1Actions)}
          onChange={(v) => set("l1Actions", Number(v) as Count3)}
          options={countOptions(3)}
        />
      </PlayField>
      <Switch
        label="Badges"
        checked={state.l1Badges}
        onToggle={() => set("l1Badges", !state.l1Badges)}
        className={PLAY_SWITCH}
      />

      <PlayDivider />
      <PlaySection label="Content level 2" />
      <Switch
        label="Leading icon"
        checked={l1Children && state.l2Icon}
        onToggle={() => set("l2Icon", !state.l2Icon)}
        disabled={!l1Children}
        className={PLAY_SWITCH}
      />
      <PlayField label="Actions">
        <PlaySelect
          value={String(state.l2Actions)}
          onChange={(v) => set("l2Actions", Number(v) as Count3)}
          options={countOptions(3)}
        />
      </PlayField>
      <Switch
        label="Badges"
        checked={l1Children && state.l2Badges}
        onToggle={() => set("l2Badges", !state.l2Badges)}
        disabled={!l1Children}
        className={PLAY_SWITCH}
      />

      <PlayDivider />
      <PlaySection label="Footer" />
      <PlayField label="Primary element">
        <PlaySelect
          value={state.footerPrimary}
          onChange={(v) => set("footerPrimary", v as PlayState["footerPrimary"])}
          options={[
            { value: "dropdown", label: "Dropdown" },
            { value: "none", label: "None" },
          ]}
        />
      </PlayField>
      <PlayField label="Stacking">
        <PlaySelect
          value={state.footerStack}
          onChange={(v) => set("footerStack", v as Stack)}
          options={[
            { value: "horizontal", label: "Horizontal" },
            { value: "vertical", label: "Vertical" },
          ]}
        />
      </PlayField>
      <PlayField label="Footer actions">
        <PlaySelect
          value={String(state.footerActions)}
          onChange={(v) => set("footerActions", Number(v) as Count2)}
          options={countOptions(2)}
        />
      </PlayField>
      <Switch
        label="Promo card"
        checked={state.footerPromo}
        onToggle={() => set("footerPromo", !state.footerPromo)}
        className={PLAY_SWITCH}
      />
    </PlaygroundPanel>
  );

  return children({
    // Doc-page preview and /demo card share one state; the collapse animates
    // between fixed widths (never height/width "auto"), so it stays correct
    // under the /demo page's scaled card. The doc preview fills the
    // ComponentPreview stage edge to edge.
    preview: shell("h-full self-stretch"),
    demoPreview: <div className="w-full max-w-[460px]">{shell("h-[480px]", true)}</div>,
    controls,
    code: buildSidebarPlaygroundCode(state),
  });
}
