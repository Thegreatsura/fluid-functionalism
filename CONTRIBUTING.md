# Contributing

An issue first, then a pull request that follows 5 rules.

## Start with an issue

Open an issue before a pull request, so the direction is agreed before the work starts. There's a form for bugs and one for ideas. A security problem goes to a [private report](https://github.com/mickadesign/fluid-functionalism/security/advisories/new) instead (see [SECURITY.md](SECURITY.md)).

## Set up

You need Node 22, the version CI runs.

```bash
npm ci
npm run dev              # docs site on http://localhost:3000
```

## Where things live

- `registry/radix/` and `registry/base/`: the 2 flavors of every component that touches a primitive. Same file name, same props, same behavior.
- `registry/default/`: single-source components, hooks and libs (springs, sizes, surfaces, icons).
- `registry/blocks/`: compositions built from the components.
- `registry.json`: what each item installs: its files, its npm dependencies, and the items it pulls in.
- `public/r/`: the built registry people install from. Generated, and committed.
- `app/docs/<name>/page.tsx`: each component's docs page. `/compare-bases` shows both flavors side by side.

## 5 rules

1. **Both flavors change together.** A fix or a new prop in `registry/radix/<name>.tsx` gets the same change in `registry/base/<name>.tsx`.
2. **Rebuild the registry.** After any change under `registry/` or to `registry.json`, run `npm run registry:build` and commit `public/r`. CI fails when it drifts.
3. **Registry files install alone.** Each one lands in someone else's app, so it imports only what its `registry.json` item declares, and its comments make sense there (no paths into this repo). A new npm dependency gets a `^` floor at the version you tested, like `@base-ui/react@^1.9.0`.
4. **Motion comes from the system.** Springs come from `registry/default/lib/springs.ts`, in the 3 speeds [motion-guidelines.md](motion-guidelines.md) describes. No hand-picked durations.
5. **Copy follows the tone guide.** Docs text, comments and pull request text follow [tone-of-voice.md](tone-of-voice.md): plain words, present tense, no em dashes.

A new component also gets a docs page, a props table, a Copy prompt and a README row: [component-documentation-guidelines.md](component-documentation-guidelines.md) has the checklist.

## Check your work

```bash
npm run lint             # 0 errors; registry/ is held to the React Compiler rules
npm test
npm run build
npm run registry:build   # then commit public/r
```

When you change a popup (dropdown, select, combobox, dialog, tooltip), also run the close-animation check against your local site, in both flavors:

```bash
npm run deps:popups -- --url http://localhost:3000
```

## Pull requests

- One change per pull request, linked to its issue.
- Titles follow the history: `fix(dropdown): …`, `feat(registry): …`, `docs(readme): …`.
- The pull request template's checklist repeats the rules above, so tick it before you ask for a review.

By contributing, you agree that your work is released under the [MIT license](LICENSE), and you follow the [code of conduct](CODE_OF_CONDUCT.md).
