// Close-animation checks for the site's popups, in both flavors. A popup that
// closes should fade out, not vanish. Base UI 1.9 unmounted several popups the
// moment they closed, and nothing on the site showed it, so this opens each
// popup in headless Chromium, closes it, and watches what happens.
//
// A sampler records, on every frame after the close action, whether the popup
// is still rendered and its rendered opacity (the product of its own and its
// ancestors' opacity). Verdicts:
//
//   cut         gone within 30ms (or 3 frames) of the close while still at
//               full opacity
//   stuck       still rendered 700ms after the close
//   not opened  the popup never appeared
//   error       a page error or console error during the case
//
// The checkbox case clicks a checkbox square twice and expects one toggle per
// click.
//
//   node scripts/deps-watch/verify-popups.mjs --url <site origin> [--flavor base|radix|both] [--json out.json]
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { chromium } from "playwright-core";

const { values: opts } = parseArgs({
  options: {
    url: { type: "string" },
    flavor: { type: "string", default: "both" },
    json: { type: "string" },
  },
});
if (!opts.url) {
  console.error("usage: verify-popups.mjs --url <site origin> [--flavor base|radix|both] [--json out.json]");
  process.exit(2);
}
if (!["base", "radix", "both"].includes(opts.flavor)) {
  console.error(`--flavor must be base, radix or both, not "${opts.flavor}"`);
  process.exit(2);
}
const origin = opts.url.replace(/\/+$/, "");
const flavors = opts.flavor === "both" ? ["radix", "base"] : [opts.flavor];

const CUT_MS = 30;
const CUT_FRAMES = 3;
const CUT_OPACITY = 0.95;
const STUCK_MS = 700;

// Runs in the page. Finds the popup (the last visible match: portals mount at
// the end of <body>), then samples it every frame until STUCK_MS after the
// close action. The close time is the first `on` event after arming, caught
// in the capture phase so it lands before any handler reacts.
function arm({ selector, on, keepParent, stuckMs }) {
  const visible = (el) =>
    el.isConnected && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  const opacity = (el) => {
    let op = 1;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
    return Math.round(op * 100) / 100;
  };
  const find = () => {
    const pool = selector.startsWith("text:")
      ? [...document.querySelectorAll("div")].filter(
          (d) => d.children.length === 0 && d.textContent.trim() === selector.slice(5),
        )
      : [...document.querySelectorAll(selector)];
    return pool.filter(visible);
  };
  const found = find();
  const target = found.at(-1);
  // The submenu case: the menu before the last one is the parent.
  const parent = keepParent ? found.at(-2) : null;
  const state = { armedAt: performance.now(), closeAt: null, samples: [], done: false };
  window.__dw = state;
  if (!target || (keepParent && !parent)) {
    state.done = true;
    return { opened: false, count: found.length };
  }
  addEventListener(on, () => (state.closeAt ??= performance.now()), { capture: true, once: true });
  const tick = () => {
    const now = performance.now();
    state.samples.push([now, visible(target) ? opacity(target) : null, parent ? visible(parent) : null]);
    const from = state.closeAt ?? state.armedAt;
    if (now - from < stuckMs + 60 && now - state.armedAt < 5000) requestAnimationFrame(tick);
    else state.done = true;
  };
  requestAnimationFrame(tick);
  // Radix and Base UI prefix the ids they generate, which tells which
  // primitive drew the popup.
  const ids = [target.closest("[id]"), ...target.querySelectorAll("[id]")].map((el) => el?.id ?? "").join(" ");
  const drawnBy = /\bradix-/.test(ids) ? "radix" : /\bbase-ui-/.test(ids) ? "base" : null;
  return { opened: true, count: found.length, drawnBy };
}

/** Reads the sampler once it has run its course and turns it into a verdict. */
async function readout(page, armed, { keepParent = false } = {}) {
  if (!armed.opened) return { verdict: "FAIL", detail: "not opened" };
  await page.waitForFunction(() => window.__dw?.done, null, { timeout: 10000 });
  const { armedAt, closeAt, samples } = await page.evaluate(() => window.__dw);
  const t0 = closeAt ?? armedAt;
  const after = samples.filter(([t]) => t >= t0).map(([t, op, parent]) => [Math.round(t - t0), op, parent]);
  const goneIdx = after.findIndex(([, op]) => op === null);
  const goneAtMs = goneIdx >= 0 ? after[goneIdx][0] : null;
  const shown = (goneIdx >= 0 ? samples.slice(0, samples.length - after.length + goneIdx) : samples).filter(
    ([, op]) => op !== null,
  );
  const lastOpacity = shown.at(-1)?.[1] ?? null;
  const fading = after.filter(([, op]) => op !== null).map(([, op]) => op);
  const minOpacity = fading.length ? Math.min(...fading) : lastOpacity;
  // Every frame up to the first one without the popup, as "ms:opacity".
  const trace = after
    .slice(0, goneIdx >= 0 ? goneIdx + 1 : 12)
    .map(([t, op]) => `${t}:${op ?? "gone"}`)
    .join(" ");
  const result = { goneAtMs, minOpacity, trace };
  const notes = [];
  if (closeAt === null) notes.push("close event not seen, timed from arming");

  if (after.some(([t, op]) => t >= STUCK_MS && op !== null)) {
    return { ...result, verdict: "FAIL", detail: ["stuck: still rendered after 700ms", ...notes].join("; ") };
  }
  // On a slow machine a cut lands later than 30ms but still within a frame
  // or two of the close, while a played exit renders several frames.
  if (goneAtMs !== null && (goneAtMs <= CUT_MS || goneIdx < CUT_FRAMES) && (lastOpacity ?? 1) >= CUT_OPACITY) {
    return {
      ...result,
      verdict: "FAIL",
      detail: [`cut: gone at ${goneAtMs}ms (frame ${goneIdx + 1}) at opacity ${lastOpacity ?? 1}`, ...notes].join("; "),
    };
  }
  if (keepParent && after.some(([, , parent]) => parent === false)) {
    return { ...result, verdict: "FAIL", detail: ["parent menu closed with the submenu", ...notes].join("; ") };
  }
  return { ...result, verdict: "PASS", detail: [`min opacity ${minOpacity}`, ...notes].join("; ") };
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const results = [];

for (const flavor of flavors) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  // The site reads the primitive choice from the ff_base cookie and still
  // migrates the older localStorage key, so both say the same thing.
  await context.addCookies([{ name: "ff_base", value: flavor, url: origin }]);
  await context.addInitScript((value) => {
    try {
      localStorage.setItem("ff:base", value);
    } catch {
      // No storage in this context; the cookie still picks the flavor.
    }
  }, flavor);
  const page = await context.newPage();
  let errors = [];
  page.on("pageerror", (error) => errors.push(String(error).split("\n")[0]));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text().split("\n")[0]);
  });

  const go = async (path) => {
    await page.goto(origin + path, { waitUntil: "networkidle" });
    // Hydration and the docs chrome settle after the network does.
    await page.waitForTimeout(1200);
  };
  const sampler = (popup) => page.evaluate(arm, { stuckMs: STUCK_MS, keepParent: false, on: "keydown", ...popup });

  /** Opens a popup with `open`, then closes it with `close` and reads the sampler. */
  const closeCase = async ({ path, open, popup, close, keepParent }) => {
    await go(path);
    await open();
    await page.waitForTimeout(600);
    const armed = await sampler({ ...popup, keepParent });
    if (armed.opened) await close();
    const out = await readout(page, armed, { keepParent });
    return { ...out, drawnBy: armed.drawnBy ?? null };
  };

  const run = async (name, caseFlavor, fn) => {
    errors = [];
    let out;
    try {
      out = await fn();
    } catch (error) {
      out = { verdict: "FAIL", detail: `script error: ${String(error.message ?? error).split("\n")[0]}` };
    }
    // A popup drawn by the other primitive means the flavor switch didn't
    // take, and the result says nothing about this flavor.
    if (out.verdict === "PASS" && out.drawnBy && out.drawnBy !== caseFlavor) {
      out = { ...out, verdict: "FAIL", detail: `drawn by ${out.drawnBy}, not ${caseFlavor}: the flavor switch didn't take` };
    }
    if (errors.length) {
      out = {
        ...out,
        verdict: "FAIL",
        detail: [out.detail, `${errors.length} page/console error(s): ${errors.slice(0, 3).join(" | ")}`]
          .filter(Boolean)
          .join("; "),
      };
    }
    const result = { case: name, flavor: caseFlavor, ...out, errors: [...errors] };
    results.push(result);
    console.error(`${result.verdict.padEnd(4)} ${caseFlavor.padEnd(5)} ${name}  ${result.detail ?? ""}`);
  };

  const menuTrigger = () => page.locator('[aria-haspopup="menu"]', { hasText: "Open menu" }).first();
  const selectTrigger = () => page.locator('[aria-haspopup="listbox"], [role="combobox"]').first();

  await run("dropdown: Escape", flavor, () =>
    closeCase({
      path: "/docs/dropdown",
      open: () => menuTrigger().click(),
      popup: { selector: '[role="menu"]' },
      close: () => page.keyboard.press("Escape"),
    }),
  );

  await run("dropdown: pick an item", flavor, () =>
    closeCase({
      path: "/docs/dropdown",
      open: () => menuTrigger().click(),
      popup: { selector: '[role="menu"]', on: "pointerup" },
      close: () => page.locator('[role="menu"] [role^="menuitem"]:not([aria-haspopup])').first().click(),
    }),
  );

  await run("submenu: ArrowLeft", flavor, () =>
    closeCase({
      path: "/docs/dropdown",
      open: async () => {
        // The first menu on the page that holds a submenu trigger.
        const subTrigger = page.locator('[role="menu"] [aria-haspopup="menu"]');
        const triggers = page.locator('button[aria-haspopup="menu"], [role="button"][aria-haspopup="menu"]');
        const n = await triggers.count();
        for (let i = 0; i < n; i++) {
          const trigger = triggers.nth(i);
          if (!(await trigger.isVisible())) continue;
          await trigger.scrollIntoViewIfNeeded();
          await trigger.click();
          await page.waitForTimeout(500);
          if (await subTrigger.count()) break;
          await page.keyboard.press("Escape");
          await page.waitForTimeout(300);
        }
        if (!(await subTrigger.count())) throw new Error("no menu with a submenu found");
        await subTrigger.first().focus();
        await page.keyboard.press("ArrowRight");
      },
      popup: { selector: '[role="menu"]' },
      keepParent: true,
      close: () => page.keyboard.press("ArrowLeft"),
    }),
  );

  await run("select: Escape", flavor, () =>
    closeCase({
      path: "/docs/select",
      open: () => selectTrigger().click(),
      popup: { selector: '[role="listbox"]' },
      close: () => page.keyboard.press("Escape"),
    }),
  );

  // Picking holds the popup about 300ms to acknowledge the choice, then fades.
  await run("select: pick an item", flavor, () =>
    closeCase({
      path: "/docs/select",
      open: () => selectTrigger().click(),
      popup: { selector: '[role="listbox"]', on: "pointerup" },
      close: () => page.locator('[role="listbox"] [role="option"]').nth(1).click(),
    }),
  );

  await run("combobox: Escape", flavor, () =>
    closeCase({
      path: "/docs/combobox",
      open: () => page.locator('[role="combobox"]').first().click(),
      popup: { selector: '[role="listbox"]' },
      close: () => page.keyboard.press("Escape"),
    }),
  );

  await run("dialog: Escape", flavor, () =>
    closeCase({
      path: "/docs/dialog",
      open: () => page.locator("button", { hasText: "Open dialog" }).first().click(),
      popup: { selector: '[role="dialog"]' },
      close: () => page.keyboard.press("Escape"),
    }),
  );

  // Running a command closes the menu from code, not from a dismiss gesture.
  await run("command menu: run a command", flavor, () =>
    closeCase({
      path: "/docs/dialog",
      open: async () => {
        await page.keyboard.press("ControlOrMeta+k");
        await page.waitForTimeout(700);
        await page.keyboard.type("Radius");
        await page.waitForTimeout(300);
      },
      popup: { selector: '[role="dialog"]' },
      close: () => page.keyboard.press("Enter"),
    }),
  );

  // The color picker is built on Base UI in both flavors, so it runs once.
  if (flavor === "base") {
    await run("color picker: Escape", "base", () =>
      closeCase({
        path: "/docs/color-picker",
        open: () => page.locator("button[aria-haspopup]").first().click(),
        popup: { selector: '[role="menu"], [role="dialog"]' },
        close: () => page.keyboard.press("Escape"),
      }),
    );
  }

  // /compare-bases renders each component twice, Radix first and Base UI
  // second, whatever the site flavor.
  const nth = flavor === "radix" ? 0 : 1;

  // The pointer leaves downward, away from the tooltip, in a few steps that
  // stay inside the viewport: Radix keeps a hoverable tooltip open while the
  // pointer could still be heading for it and only checks again on the next
  // move, and a pointer outside the window sends no moves at all.
  let away = null;
  await run("tooltip: pointer leaves", flavor, () =>
    closeCase({
      path: "/compare-bases",
      open: async () => {
        const trigger = page.locator('button:has-text("Hover me")').nth(nth);
        await trigger.evaluate((el) => el.scrollIntoView({ block: "center" }));
        await trigger.hover();
        const box = await trigger.boundingBox();
        away = { x: box.x + box.width / 2, y: box.y + box.height + 120 };
        await page.waitForTimeout(600);
      },
      popup: { selector: "text:A helpful tooltip", on: "pointermove" },
      close: () => page.mouse.move(away.x, away.y, { steps: 4 }),
    }),
  );

  await run("uncontrolled dialog: Escape", flavor, () =>
    closeCase({
      path: "/compare-bases",
      open: async () => {
        const trigger = page.locator('button:has-text("Open dialog")').nth(nth);
        await trigger.scrollIntoViewIfNeeded();
        await trigger.click();
      },
      popup: { selector: '[role="dialog"]' },
      close: () => page.keyboard.press("Escape"),
    }),
  );

  await run("checkbox square: two clicks", flavor, async () => {
    await go("/compare-bases");
    const row = page.locator("div.grid", { hasText: "Checkbox Group" }).first();
    // Cell 0 is the row label, then Radix, then Base UI.
    const item = row
      .locator(":scope > *")
      .nth(nth + 1)
      .locator('[role="checkbox"][data-fluid-hover-index]')
      .first();
    const square = item.locator(".appearance-none").first();
    await item.scrollIntoViewIfNeeded();
    const box = await square.boundingBox();
    if (!box) throw new Error("checkbox square not found");
    const states = [await item.getAttribute("aria-checked")];
    for (let i = 0; i < 2; i++) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(250);
      states.push(await item.getAttribute("aria-checked"));
    }
    const flips = states.slice(1).filter((s, i) => s !== states[i]).length;
    const detail = `aria-checked ${states.join(" > ")}`;
    return flips === 2 ? { verdict: "PASS", detail } : { verdict: "FAIL", detail: `${flips} toggles in 2 clicks: ${detail}` };
  });

  await context.close();
}
await browser.close();

const failed = results.filter((r) => r.verdict !== "PASS");
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|");
const md = [
  `${results.length} cases on ${origin}, ${failed.length} failed.`,
  "",
  "| Case | Flavor | Verdict | Gone at | Detail |",
  "|---|---|---|---|---|",
  ...results.map(
    (r) =>
      `| ${r.case} | ${r.flavor} | ${r.verdict} | ${r.goneAtMs == null ? "" : `${r.goneAtMs}ms`} | ${cell(r.detail)} |`,
  ),
  "",
].join("\n");
process.stdout.write(md);
if (opts.json) {
  writeFileSync(opts.json, JSON.stringify({ url: origin, flavors, ranAt: new Date().toISOString(), results }, null, 2));
}
process.exit(failed.length ? 1 : 0);
