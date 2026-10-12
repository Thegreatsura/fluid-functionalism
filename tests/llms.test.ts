import { describe, expect, it } from "vitest";
import { buildLlmsTxt } from "@/lib/docs/llms";
import { componentList, systemList } from "@/lib/docs/components";

describe("/llms.txt", () => {
  const text = buildLlmsTxt();

  it("points agents at the changelog, the skill, and the registry", () => {
    expect(text).toContain("https://www.fluidfunctionalism.com/changelog.md");
    expect(text).toContain("npx skills add mickadesign/fluid-functionalism");
    expect(text).toContain("https://www.fluidfunctionalism.com/r/registry.json");
  });

  it("links every docs page the sidebar lists", () => {
    for (const entry of [...systemList, ...componentList]) {
      expect(text).toContain(`https://www.fluidfunctionalism.com/docs/${entry.slug})`);
    }
  });

  it("follows the tone of voice: no em dashes", () => {
    expect(text).not.toContain("—");
  });
});
