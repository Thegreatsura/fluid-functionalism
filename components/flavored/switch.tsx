"use client";

import * as Base from "@/registry/base/switch";
import * as Radix from "@/registry/radix/switch";
import { flavored } from "@/components/flavored/flavored";

export const Switch = flavored(Base.Switch, Radix.Switch, "Flavored(Switch)");
export type { SwitchProps } from "@/registry/base/switch";
