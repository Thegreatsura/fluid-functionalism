// The fluid-functionalism skill's audit script measures a running page against
// FF's invariants. Its token sets are hand-copied from the registry, so the
// drift guards here fail when the registry moves and the audit does not — an
// audit judging pages against last year's tokens would flag correct FF code.
//
// The end-to-end checks need a browser, which CI does not have. Run them
// locally with the script's dependency installed:
//   (cd skills/fluid-functionalism/scripts && npm install)
//   FF_AUDIT_E2E=1 npx vitest run tests/skill-audit.test.mjs
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  DURATION_TOKENS_MS,
  LADDER_PX,
  classifyHover,
  isOnLadder,
  isOnToken,
  parseDurations,
} from "../skills/fluid-functionalism/scripts/audit.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

describe("audit helpers", () => {
  it("parses computed transition durations in s and ms", () => {
    expect(parseDurations("0.15s, 80ms")).toEqual([150, 80]);
    expect(parseDurations("0s")).toEqual([0]);
    expect(parseDurations("0.08s,0.16s")).toEqual([80, 160]);
  });

  it("treats Tailwind's bare 150ms transition as off-token", () => {
    expect(isOnToken(80)).toBe(true);
    expect(isOnToken(150)).toBe(false);
    expect(isOnToken(200)).toBe(false);
  });

  it("accepts the ladder within a pixel of tolerance", () => {
    expect(isOnLadder(36)).toBe(true);
    expect(isOnLadder(28.4)).toBe(true);
    expect(isOnLadder(40)).toBe(false);
  });

  it("names FF's hook before anything else it observes", () => {
    expect(classifyHover({ ffAttr: true, overlayMoved: true, rowFill: true })).toBe("glide");
    expect(classifyHover({ ffAttr: false, overlayMoved: true, rowFill: false })).toBe("custom-glide");
    expect(classifyHover({ ffAttr: false, overlayMoved: false, rowFill: true })).toBe("per-row");
    expect(classifyHover({ ffAttr: false, overlayMoved: false, rowFill: false })).toBe("none");
  });
});

describe("audit tokens match the registry", () => {
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (path.endsWith(".tsx") || path.endsWith(".ts")) files.push(path);
    }
  };
  walk(join(root, "registry"));
  const source = files.map((f) => readFileSync(f, "utf8")).join("\n");

  it("knows every CSS duration the registry uses routinely", () => {
    const counts = {};
    for (const [, ms] of source.matchAll(/\bduration-(\d+)\b/g)) counts[ms] = (counts[ms] ?? 0) + 1;
    // Three or fewer uses is an exception, and the audit is right to report it.
    const routine = Object.entries(counts)
      .filter(([, n]) => n > 3)
      .map(([ms]) => Number(ms));
    for (const ms of routine) {
      expect(
        DURATION_TOKENS_MS,
        `registry/ uses duration-${ms} routinely; add ${ms} to DURATION_TOKENS_MS in skills/fluid-functionalism/scripts/audit.mjs`,
      ).toContain(ms);
    }
  });

  it("uses the size ladder that size-context ships", () => {
    const sizeContext = readFileSync(join(root, "registry/default/lib/size-context.tsx"), "utf8");
    const controls = [...sizeContext.matchAll(/control:\s*"h-(\d+)"/g)].map(([, n]) => Number(n) * 4);
    expect(controls.length).toBeGreaterThan(0);
    expect([...LADDER_PX].sort()).toEqual([...new Set(controls)].sort());
  });
});

const fixture = (name) => pathToFileURL(join(root, "tests/fixtures/skill-audit", name)).href;
const audit = (url) => {
  const out = join(mkdtempSync(join(tmpdir(), "ff-audit-")), "audit.json");
  execFileSync(
    "node",
    [join(root, "skills/fluid-functionalism/scripts/audit.mjs"), url, "--widths", "1280", "--json", out],
    { stdio: "pipe", timeout: 120_000 },
  );
  return JSON.parse(readFileSync(out, "utf8")).results[0];
};

describe.skipIf(!process.env.FF_AUDIT_E2E)("audit end to end", () => {
  it("reports a per-row hover that goes dark between rows, off-token timing, and a shifting tab", () => {
    const r = audit(fixture("blink.html"));
    const nav = r.hover.find((h) => h.label.startsWith("Profile"));
    expect(nav.kind).toBe("per-row");
    expect(nav.gapDark).toBe(true);
    expect(Object.keys(r.transitions.off)).toEqual(expect.arrayContaining(["150", "200"]));
    expect(r.transitions.all).toBeGreaterThan(0);
    expect(r.ladder["40"]).toBeTruthy();
    expect(r.tabs[0].shift).toBeGreaterThan(0.5);
  }, 150_000);

  it("recognises FF's glide and a ghost-span tab row that holds still", () => {
    const r = audit(fixture("glide.html"));
    const nav = r.hover.find((h) => h.label.startsWith("Profile"));
    expect(nav.kind).toBe("glide");
    expect(r.transitions.off).toEqual({});
    expect(r.tabs[0].shift).toBeLessThanOrEqual(0.5);
    expect(r.tabs[0].label).toBe("Overview / Usage / Logs");
  }, 150_000);
});
