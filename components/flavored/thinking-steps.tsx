"use client";

import * as Base from "@/registry/base/thinking-steps";
import * as Radix from "@/registry/radix/thinking-steps";
import { flavored } from "@/components/flavored/flavored";

export const ThinkingSteps = flavored(
  Base.ThinkingSteps,
  Radix.ThinkingSteps,
  "Flavored(ThinkingSteps)"
);
export const ThinkingStepsHeader = flavored(
  Base.ThinkingStepsHeader,
  Radix.ThinkingStepsHeader,
  "Flavored(ThinkingStepsHeader)"
);
export const ThinkingStepsContent = flavored(
  Base.ThinkingStepsContent,
  Radix.ThinkingStepsContent,
  "Flavored(ThinkingStepsContent)"
);
// The step/detail/source/image parts don't touch the collapsible primitive
// directly (ThinkingStepDetails does, via its own nested Root), but they all
// route through the switch anyway so the whole tree stays one flavor.
export const ThinkingStep = flavored(
  Base.ThinkingStep,
  Radix.ThinkingStep,
  "Flavored(ThinkingStep)"
);
export const ThinkingStepDetails = flavored(
  Base.ThinkingStepDetails,
  Radix.ThinkingStepDetails,
  "Flavored(ThinkingStepDetails)"
);
export const ThinkingStepSources = flavored(
  Base.ThinkingStepSources,
  Radix.ThinkingStepSources,
  "Flavored(ThinkingStepSources)"
);
export const ThinkingStepSource = flavored(
  Base.ThinkingStepSource,
  Radix.ThinkingStepSource,
  "Flavored(ThinkingStepSource)"
);
export const ThinkingStepImage = flavored(
  Base.ThinkingStepImage,
  Radix.ThinkingStepImage,
  "Flavored(ThinkingStepImage)"
);

export type {
  ThinkingStepsProps,
  ThinkingStepsHeaderProps,
  ThinkingStepsContentProps,
  ThinkingStepProps,
  ThinkingStepDetailsProps,
  ThinkingStepSourcesProps,
  ThinkingStepSourceProps,
  ThinkingStepImageProps,
  StepStatus,
} from "@/registry/base/thinking-steps";

export default ThinkingSteps;
