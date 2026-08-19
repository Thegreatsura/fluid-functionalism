"use client";

import { flavored } from "@/components/flavored/flavored";
import {
  Sidebar as SidebarBase,
  SidebarContent as SidebarContentBase,
} from "@/registry/base/sidebar";
import {
  Sidebar as SidebarRadix,
  SidebarContent as SidebarContentRadix,
} from "@/registry/radix/sidebar";

// Only the primitive-touching parts flavor-switch; everything else has a
// single flavor-neutral implementation re-exported below.
export const Sidebar = flavored(SidebarBase, SidebarRadix, "Flavored(Sidebar)");
export const SidebarContent = flavored(
  SidebarContentBase,
  SidebarContentRadix,
  "Flavored(SidebarContent)"
);

export type { SidebarProps, SidebarContentProps } from "@/registry/base/sidebar";

export {
  SidebarProvider,
  useSidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  SidebarInput,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupActions,
  SidebarGroupContent,
  SIDEBAR_COOKIE_NAME,
} from "@/registry/default/sidebar-core";
export type {
  SidebarContextValue,
  SidebarProviderProps,
  SidebarSide,
  SidebarVariant,
  SidebarCollapsible,
} from "@/registry/default/sidebar-core";
export {
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
} from "@/registry/default/sidebar-menu";
export type {
  SidebarMenuProps,
  SidebarMenuButtonProps,
  SidebarMenuSubProps,
} from "@/registry/default/sidebar-menu";
