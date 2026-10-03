import { describe, expect, it } from "vitest";
import { buildInstallPrompt, buildPresetPrompt } from "@/lib/docs/install-prompt";
import { PROMPT_ENTRIES } from "@/lib/docs/prompt-entries";
import {
  CARD_DEFAULT_CODE,
  CARD_PRESET_DEF,
} from "@/lib/preset/components";

const skillInstall = "npx skills add mickadesign/fluid-functionalism";

describe("Copy prompts", () => {
  const prompts = [
    {
      kind: "doc page",
      value: buildInstallPrompt({ slug: "card", base: "radix" }),
    },
    {
      kind: "installable playground preset",
      value: buildPresetPrompt({
        def: CARD_PRESET_DEF,
        code: CARD_DEFAULT_CODE,
        base: "radix",
      }),
    },
  ];

  // The craft ships in the skill; a brief points there instead of pasting it.
  it.each(prompts)("leaves the craft to the skill in the $kind prompt", ({ value }) => {
    expect(value).not.toContain("Craft (");
    for (const point of PROMPT_ENTRIES.card.craft ?? []) {
      expect(value).not.toContain(point);
    }
    expect(value).toContain(skillInstall);
  });
});
