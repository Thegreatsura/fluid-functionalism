"use client";

import { useMemo } from "react";
import { useIcons, type IconName } from "@/lib/icon-context";
import type { CommandMenuItemData } from "@/registry/default/command-menu";
import { COMMAND_MENU_ITEMS } from "@/lib/preset/command-menu-options";

// ---------------------------------------------------------------------------
// Demo actions shared by the command menu doc page, its playground, the
// /demo slide, and the preset generator (which owns the data): a small
// app's palette, with every field the rows can show. Icons are slot names,
// resolved against the site's icon library at render.
// ---------------------------------------------------------------------------

export {
  COMMAND_MENU_GROUPS,
  COMMAND_MENU_ITEMS,
  COMMAND_MENU_SUGGESTIONS,
  COMMAND_MENU_TABS,
  COMMAND_MENU_TYPES,
  COMMAND_MENU_SORTS,
  COMMAND_MENU_COPY,
} from "@/lib/preset/command-menu-options";

export interface CommandMenuItemOptions {
  /** Keep the rows' descriptions. @default true */
  descriptions?: boolean;
  /** Keep the rows' shortcut caps. @default true */
  shortcuts?: boolean;
  /** Only these groups. Default: every group. */
  groups?: readonly string[];
}

/** The demo actions with icons resolved for the current icon library. */
export function useCommandMenuItems({
  descriptions = true,
  shortcuts = true,
  groups,
}: CommandMenuItemOptions = {}): CommandMenuItemData[] {
  const icons = useIcons();
  return useMemo(
    () =>
      COMMAND_MENU_ITEMS.filter((item) => !groups || groups.includes(item.group)).map(
        ({ icon, description, shortcut, ...item }) => ({
          ...item,
          icon: icons[icon as IconName],
          ...(descriptions && description !== undefined && { description }),
          ...(shortcuts && shortcut !== undefined && { shortcut }),
        })
      ),
    [icons, descriptions, shortcuts, groups]
  );
}
