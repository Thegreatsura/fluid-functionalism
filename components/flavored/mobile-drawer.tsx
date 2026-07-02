"use client";

import * as Base from "@/registry/base/mobile-drawer";
import * as Radix from "@/registry/radix/mobile-drawer";
import { flavored } from "@/components/flavored/flavored";

export const MobileDrawer = flavored(
  Base.MobileDrawer,
  Radix.MobileDrawer,
  "Flavored(MobileDrawer)"
);

export default MobileDrawer;
