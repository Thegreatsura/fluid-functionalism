# Dependency watch

A weekly check that what people install still works at the newest versions of the packages it pulls in, with draft fixes when it doesn't.

The registry ships 26 npm packages into people's apps, and installers get the newest version each registry range allows, not the version in this repo's lockfile. Base UI 1.9 cut 4 close animations and failed the typecheck in fresh installs while the site still ran 1.4.1. Nothing on the site showed it.

## The scripts

| Command | What it does |
|---|---|
| `npm run deps:inventory -- --md inv.md --json inv.json` | Lists every package in 4 tiers (shipped, env, site, tooling): the site's version, the registry range, the latest release, every release since the site's version, the ones from the last 8 days, and the release notes link. Shipped packages also get a usage map: which registry files import them, and which subpaths and names. |
| `npm run deps:popups -- --url http://localhost:3000` | Opens the site in headless Chromium and checks, in both flavors, that every popup plays its close animation instead of vanishing, that a programmatic close animates too, and that a checkbox square toggles once per click. Needs a running site. |
| `npm run deps:install` | Serves this checkout's `public/r` on localhost, scaffolds a fresh `shadcn@latest` Next app per flavor, installs every item into it with the newest packages the ranges allow, then runs `tsc`, the app's own ESLint and `next build`. This is the setup an installer gets. |

Each script prints a summary and exits non-zero on a failure. `--json` writes the full result.

Headless Chromium comes from `npx playwright-core install chromium-headless-shell`. Set `CHROMIUM_PATH` to use another build.

## The weekly run

A scheduled Claude Code routine follows these steps every Monday morning.

1. **Inventory.** Run `deps:inventory --days 8`. Read the release notes for every release since the site's version of each shipped and env package, and for site and tooling packages with a release this week. Note every change that touches a subpath or name in the usage map, and every change marked breaking or behavior-changing.
2. **Upgrade on a scratch branch.** Raise every package to its latest version within its current major: `npm install <name>@<latest>` for each. Majors wait for step 5.
3. **Check.** In this order: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`, `npm run registry:build`, then `npx next start` and `deps:popups` against it, then `deps:install`. Keep each command's output for the report.
4. **Act.**
   - **Everything passes:** open one PR, `deps: weekly update <date>`, with the version bumps, the rebuilt `public/r`, and each shipped package's registry range raised to `^<new version>`. The body lists what moved, the release notes that touch the usage map, and the check results.
   - **Something fails:** find the package that caused it (move them one at a time when several moved), fix the code, and open a draft PR per cause. Its body shows the failing check before and after the fix. Fixes stay minimal, and the Radix and Base UI flavors stay in step: a fix to shared behavior in one flavor gets the same fix in the other.
   - **No fix within the run:** no PR. The report names the package, the version, the failing check and its output.
5. **Majors.** Try each package with a major gap on its own branch, shipped packages first and tooling last. Open a draft PR only when every check passes after the upgrade, or after a contained fix. Otherwise list it in the report with what broke.
6. **No duplicates.** Branches start with `deps-watch/`. Before opening a PR, check for an open one from an earlier run on the same package and update that instead.
7. **Report.** End with a short summary: what moved, what was checked, which PRs were opened or updated, and what needs a person.

## Rules

- Never push to `main`, never merge, never force-push.
- Every shipped package gets a `^` floor at the version the site was checked on. No bare package names in `registry.json` dependencies.
- If a check can't run in the environment (no Chromium, no network), say so in the report and carry on with the rest. A skipped check is never reported as a pass.
