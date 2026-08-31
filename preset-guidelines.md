# Preset system ("Get code")

Playground configurations encode into short, stateless codes (shadcn's
preset principle) that the registry turns into installable blocks:

```
rail state ──encode──▶  sahYNBB9O  ──/r/preset/<code>.json──▶ registry item
     ▲                      │
     └──── ?preset= ────────┘  (share link hydrates the rail)
```

A code is `<component><version><base62>` — `s` = sidebar, `a` = current
field layout. It is the configuration itself, bit-packed: no storage, no
lookup, decodable forever.

## The files

| File | Role |
|---|---|
| `lib/preset/sidebar-options.ts` | PlayState + **codec field tables** + demo content (shared by playground, codec, both generators) |
| `lib/preset/codec.ts` | generic bit-pack/base62 encode–decode |
| `lib/preset/sidebar-install.ts` | state → compilable files (install-grade twin of the playground's teaching snippet) |
| `app/r/preset/[code]/route.ts` | code → registry item, deps flavor-resolved |
| `lib/registry-urls.mjs` | bundler-safe twin of the postbuild's `depUrl` (parity-tested) |

## Rules that must never break

Codes in the wild are permanent. Therefore, in `SIDEBAR_PRESET_FIELDS`:

1. **Never reorder a value array — only append.**
2. **Every field's default stays at index 0.**
3. **Only append new fields at the end.** Bump the version char (`a` → `b`)
   only for incompatible layout changes, keeping the old table registered
   in `codec.ts` so old codes still decode.
4. **Stay under 53 bits total** (JS safe-integer limit).

`tests/preset-codec.test.mjs` enforces 2 and 4 and pins rule 1/3 with a
golden inline snapshot — if that snapshot changes unexpectedly, you broke
every shared link. Fix the table, don't update the snapshot.

## Adding an option to the sidebar playground

1. Add the field to `PlayState` + `DEFAULT_STATE` + **append** it to
   `SIDEBAR_PRESET_FIELDS` (default first, headroom bits).
2. Teach both generators: the snippet (`buildSidebarPlaygroundCode`) and
   the installer (`sidebar-install.ts`).
3. `npm test` — the codec round-trip, the type-checked install matrix
   (real `ts.createProgram` over the project tsconfig), the parse fuzz,
   and dep-existence guards all must stay green.

## Adding a new playground (card, input-message, …)

New component tag in `codec.ts`, its own options/field-table module, an
install generator, and reuse the same route pattern and test harnesses.
The route's dependency URLs must go through `buildDepResolver` so flavor
resolution can never drift from the static payloads.

## Gotchas learned building it

- The route can't import `scripts/postbuild-registry.mjs` (fs at module
  scope breaks bundling) — hence the resolver twin + parity test.
- Virtual-file type-checking needs `host.directoryExists` overridden too,
  not just `fileExists`/`readFile`.
- React 19 ref callbacks must not return a value (cleanup signature).
- `"utils"` stays a plain name in dependency lists — the default shadcn
  registry provides it, matching the static payloads.
