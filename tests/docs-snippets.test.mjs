// Guards against "preview vs snippet" drift: the docs' code snippets and the
// playground's generated code must keep teaching the load-bearing classes the
// shipped blocks actually use. A retune of a block that doesn't reach the
// docs (or vice versa) fails here instead of shipping silently.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { FLAVORED_SINGLE_SOURCE } from "../scripts/postbuild-registry.mjs";

const root = new URL("..", import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), "utf-8");

describe("docs snippets carry the load-bearing design details", () => {
  const gridSrc = read("registry/default/lib/sidebar-menu-grid.ts");
  const grid = gridSrc.match(/SIDEBAR_MENU_GRID =\s*\n?\s*"([^"]+)"/)[1];
  const page = read("app/docs/sidebar/page.tsx");
  const playground = read("lib/docs/playgrounds/sidebar.tsx");
  const blocks = [
    "registry/blocks/sidebar-workspace-header.tsx",
    "registry/blocks/sidebar-user-footer.tsx",
    "registry/blocks/sidebar-app/search-field.tsx",
    "registry/blocks/sidebar-app/inset-topbar.tsx",
  ]
    .map(read)
    .join("\n");

  it("the sidebar page's popup-grid snippet stays in lockstep with the shipped lib", () => {
    // Best case: the snippet interpolates the live constant — drift-proof by
    // construction. Otherwise every grid class must appear verbatim.
    if (!page.includes("${SIDEBAR_MENU_POPUP}")) {
      for (const cls of grid.split(" ")) {
        expect(page, `page snippet is missing "${cls}"`).toContain(cls);
      }
    }
  });

  // One entry per finetune that must survive into what a reader copies.
  const LOAD_BEARING = [
    "delay-200 duration-160", // topbar trigger's late fade after a pin
    "[&>span:first-child]:hidden", // brand trigger drops its hover fill layer
    "left-1.5", // 20px tile centred on the rows' 16px leading axis
    "-ml-0.5", // footer avatar pulled onto the leading axis
    "group/search", // search field's hover-reveal shortcut chip scope
  ];
  for (const literal of LOAD_BEARING) {
    it(`"${literal}" ships in a block and is taught by the docs`, () => {
      expect(blocks, `no block ships "${literal}"`).toContain(literal);
      expect(
        page + playground,
        `the sidebar docs/codegen no longer teach "${literal}"`
      ).toContain(literal);
    });
  }
});

describe("emitted payloads embed only installable sources", () => {
  const dirs = ["public/r", "public/r/base", "public/r/radix"];
  const payloads = dirs.flatMap((d) =>
    readdirSync(join(root, d))
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({ name: join(d, f), data: JSON.parse(read(join(d, f))) }))
  );
  it("no payload imports docs-only paths; flavored payloads are neutralized", () => {
    for (const { name, data } of payloads) {
      // Flat payloads (and true dual-flavor sources) may keep @/registry/
      // imports — the shadcn CLI rewrites those on install. Only the flavored
      // CLONES of single-source items must be neutralized to
      // @/components/ui/* so registryDependencies pick the flavor.
      const flavored =
        (name.includes("/base/") || name.includes("/radix/")) &&
        FLAVORED_SINGLE_SOURCE.has(data.name);
      for (const file of data.files ?? []) {
        if (typeof file.content !== "string") continue;
        expect(file.content, `${name} → ${file.path}`).not.toContain("@/lib/docs");
        if (flavored) {
          expect(file.content, `${name} → ${file.path}`).not.toContain(
            'from "@/registry/'
          );
        }
      }
    }
  });
});
