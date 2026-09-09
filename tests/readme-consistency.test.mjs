/**
 * The README on GitHub is hand-written and drifts the same way the registry
 * lists do: a new component lands on the site and in public/r, but the
 * README's tables keep the old roster (three components were missing for a
 * while). Two invariants keep it honest:
 *
 *  - every docs entry in lib/docs/components.ts is linked from the README,
 *  - every registry name the README's tables advertise exists in public/r,
 *    so `npx shadcn@latest add @fluid/<name>` cannot 404 for a reader.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const readme = readFileSync(join(ROOT, "README.md"), "utf-8");

describe("README", () => {
  it("links every component and system docs page", async () => {
    const { componentList, systemList } = await import("../lib/docs/components.ts");
    for (const entry of [...componentList, ...systemList]) {
      expect(
        readme.includes(`https://www.fluidfunctionalism.com/docs/${entry.slug})`),
        `README.md has no link to /docs/${entry.slug} (${entry.name})`
      ).toBe(true);
    }
  });

  it("every registry name in a table cell resolves to a public/r payload", () => {
    // Table rows are `| [Name](url) | \`name\` · \`base/name\` | ... |`; the
    // second cell holds nothing but registry names.
    const rows = readme.split("\n").filter((line) => /^\| \[/.test(line));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const cell = row.split("|")[2] ?? "";
      const names = [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
      expect(names.length, `row has no registry name: ${row}`).toBeGreaterThan(0);
      for (const name of names) {
        expect(
          existsSync(join(ROOT, "public/r", `${name}.json`)),
          `README.md advertises "${name}" but public/r/${name}.json does not exist`
        ).toBe(true);
      }
    }
  });

  it("uses no em dashes (tone-of-voice.md rule 6)", () => {
    const lines = readme.split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => l.includes("—"));
    expect(lines, "em dash found").toEqual([]);
  });
});
