# Security

How to report a vulnerability in Fluid Functionalism without making it public.

## Report it privately

Use GitHub's private reporting: [report a vulnerability](https://github.com/mickadesign/fluid-functionalism/security/advisories/new). Only the maintainer sees the report, and the conversation stays in that advisory. Don't open a public issue for a security problem.

Include the component or page, the install command or URL, and the steps that show the problem. A small repo or a screen recording helps.

## What's covered

- The code the registry installs into your app: everything under `registry/`, served as `https://www.fluidfunctionalism.com/r/*.json`.
- The routes that build install payloads on request: `/r/preset`, `/r/setup` and `/r/starter`.
- The docs site at [fluidfunctionalism.com](https://www.fluidfunctionalism.com).

A vulnerability in a package the registry installs (Radix, Base UI, Motion, Lucide and the others in `registry.json`) belongs to that project first. Report it there, then here if a component needs a fix or a higher version floor.

## Versions

The registry has no versions yet: every install takes the current `main`. A fix reaches your app the next time you run `npx shadcn@latest add` for that component with `--overwrite`.

## How dependencies stay safe

- Dependabot opens a pull request when a package in the lockfile gets a security advisory.
- A weekly check upgrades every package the registry installs, runs the site's checks and a fresh install in both flavors, and opens a pull request when something needs a fix. `scripts/deps-watch/README.md` describes it.
- The weekly check also raises each package's `^` floor in `registry.json` to the version it tested, so an install never gets an older one.
