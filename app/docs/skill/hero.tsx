"use client";

import { DocSection } from "@/lib/docs/DocPage";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { cn } from "@/registry/default/lib/utils";
import { MenuExample } from "./menu-example";
import { CopyExample, PressExample, TabsExample } from "./examples";

/** One example per recipe the skill teaches: weight without reflow, fluid
 *  hover, the icon swap, and a press that never warps. */
const EXAMPLES = [
  { label: "Tabs", caption: "Active labels get heavier without shifting neighboring tabs.", Example: TabsExample },
  { label: "Menu", caption: "One highlight follows your pointer smoothly between menu items.", Example: MenuExample },
  { label: "Copy field", caption: "Hover and click anywhere on the text to copy.", Example: CopyExample },
  { label: "Button press", caption: "Buttons scale down the same size no matter the width.", Example: PressExample },
];

/** The Examples section: one subsection per example, every one looping
 *  while it is on screen. Subsection titles use the docs' h3 (15px
 *  semibold), tucked against their caption like a section title is. */
export function SkillExamples() {
  return (
    <DocSection title="Examples">
      <p className="text-body leading-relaxed text-muted-foreground">
        What your agent writes on its own, next to what it writes with the skill.
      </p>
      {EXAMPLES.map(({ label, caption, Example }, i) => (
        <div key={label} className={cn("flex flex-col gap-4", i === 0 ? "mt-2" : "mt-6")}>
          <h3
            className="-mb-2 text-[15px] text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            {label}
          </h3>
          <p className="text-body leading-relaxed text-muted-foreground">{caption}</p>
          <ComponentPreview hideHeader inspectable={false}>
            <div className="flex w-full justify-center">
              <Example />
            </div>
          </ComponentPreview>
        </div>
      ))}
    </DocSection>
  );
}
