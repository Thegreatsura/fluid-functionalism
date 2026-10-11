"use client";

// Docs-site icon playground data: the multi-library icon map behind the
// "press I to cycle icon library" switcher. Lucide is the default set that
// ships with icon-context; the other four ship as their own registry libs
// (icons-tabler, icons-phosphor, icons-hugeicons, icons-untitledui), which
// is also how the starter installs the library a visitor picked.

import { defaultIcons, type IconComponent, type IconName } from "@/lib/icon-context";
import { tablerIcons } from "@/registry/default/lib/icons-tabler";
import { phosphorIcons } from "@/registry/default/lib/icons-phosphor";
import { hugeiconsIcons } from "@/registry/default/lib/icons-hugeicons";
import { untitleduiIcons } from "@/registry/default/lib/icons-untitledui";

export type IconLibrary = "lucide" | "tabler" | "phosphor" | "hugeicons" | "untitledui";

export const iconLibraryOrder: IconLibrary[] = ["lucide", "tabler", "phosphor", "hugeicons", "untitledui"];

export const iconLibraryLabels: Record<IconLibrary, string> = {
  lucide: "Lucide",
  tabler: "Tabler",
  phosphor: "Phosphor",
  hugeicons: "HugeIcons",
  untitledui: "Untitled UI",
};

// ── Unified Map ─────────────────────────────────────────────

export const iconMap: Record<IconLibrary, Record<IconName, IconComponent>> = {
  lucide: defaultIcons,
  tabler: tablerIcons,
  phosphor: phosphorIcons,
  hugeicons: hugeiconsIcons,
  untitledui: untitleduiIcons,
};
