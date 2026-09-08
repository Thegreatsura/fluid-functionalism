# Fluid hover highlight: one component, 19 copies retired

Status: done 2026-09-07. Phases 0 to 5 landed in one session; see the
`refactor(fluid-hover)` commits. Phase 4 outcome: ask-user-questions and the
input-message suggestions migrated (same overlay, differently named key);
tabs, tabs-subtle, and thinking-steps stay as they are on purpose. The
guardrail is a regex over any session-keyed `bg-hover` fill, allowlist empty.
Not verified live: nav-menu (nothing on the site renders it) and the reduced
motion path (covered by the unit test only).

## Why

Every list that uses `useFluidHover` renders the same overlay by hand: a
`motion.div` keyed on `sessionRef.current`, `initial` and `animate` spreading a
rect, `exit` on `spring.fast.exit`, opacity on a fixed 0.08s. There are 19
copies across 17 registry files (Base and Radix flavours count twice). The docs
page says "1 highlight per list"; the code should say it too.

The duplication also blocks a known fix. The overlay animates `top`, `left`,
`width`, `height`, so `MotionConfig reducedMotion="user"` does not reduce it
(see the straggler note in `motion-guidelines.md`). One shared component gates
that once, and every list is covered.

## Inventory (what the copies actually vary on)

| Site | Entry rect (`initial`) | Class | Transition | Notes |
|---|---|---|---|---|
| accordion ×2, checkbox-group ×2, radio-group ×2, combobox ×2, table | `activeRect` | `shape.bg` (table: none) | `spring.fast` | plain |
| select ×2 | `activeRect` | `shape.bg` | `spring.fast` | whole `AnimatePresence` wrapped in `open &&` |
| card | `activeRect` | `shape.container` + `z-0` | `spring.fast` | rows sit at `z-10` above it |
| dropdown ×4, color-picker | `checkedRect ?? activeRect` | `shape.bg` / `menuShape.bg` | `spring.fast` | fades in from the checked row |
| nav-menu | `activeRouteRect ?? activeRect` | `shape.bg` | `spring.fast` | fades in from the active route |
| sidebar-menu | `hoverAnchorRect ?? hoverRect` | `shape.bg` | `spring.fast`, or `{ duration: 0 }` on reflow | snap-on-reflow guard (see [[sidebar-component]] memory); rects gated on `isMeasured` |

Not in the inventory, because they render hover differently (no session key):
tabs ×2, tabs-subtle ×2 (`hoveredIndex`), ask-user-questions, input-message
suggestions, thinking-steps (`inset-0` per row). Phase 4 decides on those.

So the whole surface is four knobs: the rect, an optional entry rect, a class,
and a transition that can be forced to snap.

## The component

`registry/default/fluid-hover-highlight.tsx`, shipped as a second file of the
`use-fluid-hover` registry item (the hook file stays `.ts` and dependency-free;
the item gains `dependencies: ["framer-motion"]` and
`registryDependencies: ["springs"]`, which every consumer already has).

```tsx
interface FluidHoverHighlightProps {
  /** The rect to sit on. `null` hides it (runs the exit fade). */
  rect: ItemRect | null;
  /** `sessionRef.current` from the hook. A new session re-keys the overlay so
   *  it fades in at `from ?? rect` instead of sliding over from its last spot. */
  session: number;
  /** Where the overlay fades in from on a new session. Dropdowns pass the
   *  checked row, the nav menu the active route, the sidebar its anchor. */
  from?: ItemRect | null;
  /** Radius, z-index, anything else. Base classes are
   *  `absolute bg-hover pointer-events-none`. */
  className?: string;
  /** Positional spring. Defaults to `spring.fast`. Pass `false` to snap
   *  (the sidebar's reflow guard). Opacity is always 0.08s. */
  transition?: Transition | false;
}
```

Behaviour, all inside the component:

- Owns its `AnimatePresence`, so consumers drop theirs.
- `useReducedMotion()` true: positional transition becomes `{ duration: 0 }`.
  The highlight jumps between rows and only the opacity fade remains, which is
  the rule in `motion-guidelines.md` ("fewer and gentler, not none"). This
  reads the OS media query directly, so installed consumers get it without
  wrapping their app in `MotionConfig`.
- Exit is always `spring.fast.exit`.
- Zero layout opinions: no z-index, no radius. The consumer passes them.

## Phases

Each phase is its own commit. Base and Radix flavours of a component migrate
in the same commit (both flavours are required and must stay in sync).

### Phase 0: guardrails first

1. Add a vitest + Testing Library test for the component: renders at `rect`,
   `initial` uses `from` when given, a `session` change remounts (new DOM
   node), `rect: null` unmounts, `transition: false` yields `duration: 0`, and
   reduced motion yields `duration: 0` for position but not for opacity (mock
   `useReducedMotion`). The repo has vitest but no DOM environment and no
   Testing Library (checked 2026-09-07), so this phase adds `jsdom` and
   `@testing-library/react` as dev dependencies and a `vitest.config.ts` that
   applies `environment: "jsdom"` to `tests/**/*.test.tsx` only, so the
   existing `.mjs` preset tests keep running in node.
2. Add a registry-consistency assertion: no file under `registry/` contains
   `key={sessionRef.current}` once Phase 3 lands. Write it now, skipped, and
   un-skip it at the end. This is what stops the 20th copy.
3. Record the baseline: on the docs pages for each inventory row, hover across
   the gaps, leave, re-enter, and open with a checked row. Screenshots are not
   enough for motion; note what you see (fade in fresh, travel, no slide on
   entry). This is the acceptance list for every later phase.

### Phase 1: the component, proven on the docs page

1. Write `fluid-hover-highlight.tsx` and the test.
2. Register it in `registry.json` (second file of `use-fluid-hover`, plus the
   two dependencies), run `npm run registry:build`, run the
   registry-consistency and postbuild tests.
3. Replace `HoverOverlay` in `app/docs/fluid-hover/demos.tsx` with it, and make
   the "Blink or glide" Code tab show it. This is the first consumer:
   zero risk, and the page is where the reader meets the API.

### Phase 2: the plain sites (9 sites, one commit per component pair)

accordion, checkbox-group, radio-group, combobox, table, card, select.

- Card passes `className={cn("z-0", shape.container)}`.
- Select: replace the outer `open &&` with `rect={open ? activeRect : null}`.
  This changes one thing: closing now runs the exit fade instead of removing
  the overlay outright. The popup is already fading out at that moment, so it
  should be invisible. Verify it on the Select page, both flavours.
- Everything else is a mechanical swap. Run the acceptance list per component.

### Phase 3: the entry-rect sites (7 sites)

- dropdown ×4 and color-picker: `from={checkedRect}`.
- nav-menu: `from={activeRouteRect}`.
- sidebar-menu: `from={hoverAnchorRect}`, `transition={snapping ? false : undefined}`.
  Keep the selection overlay (`spring.moderate`) as it is; it is not hover.
  Re-run the sidebar reflow cases from the [[sidebar-component]] memory: size
  step flip while hovering, collapse a group while hovering, sub-menu open.
- Un-skip the Phase 0 guardrail test.

### Phase 4: the outliers, decided one by one

tabs, tabs-subtle, ask-user-questions, input-message suggestions,
thinking-steps. Each renders hover without the session key, so their highlight
can slide in from its last position on re-entry. Decide per component whether
that is a bug worth fixing by adopting the shared component, or a deliberate
difference. Do not fold them in blindly; tabs in particular share the overlay
with the selected indicator.

### Phase 5: docs and records

- `motion-guidelines.md`: remove the hover overlays from the straggler list,
  add the component to the "Fluid hover" section, and add "use
  `FluidHoverHighlight`, never hand-roll the overlay" to the new-component
  checklist in `component-documentation-guidelines.md`.
- `registry.json` description of `use-fluid-hover` mentions the component.
- README component table: no change needed.
- Memory: update the fluid-hover note.

## Risks and how each is handled

- **Behaviour drift during the swap.** The acceptance list in Phase 0 and
  one component pair per commit keep any regression bisectable.
- **`initial` semantics.** framer applies `initial` only on mount. The
  component keys on `session`, exactly as the copies do, so `from` only takes
  effect on a fresh entry. Same as today.
- **Reduced motion cannot be emulated in the Browser pane.** Verify it by
  wrapping a docs demo in `<MotionConfig reducedMotion="always">` on a scratch
  branch, or with the OS setting. The unit test covers the logic.
- **Sidebar snap guard.** `transition: false` must map to `{ duration: 0 }`
  for position while opacity keeps its 0.08s, otherwise a reflow flashes.
  Covered by the unit test and the Phase 3 reflow cases.
- **Installed consumers.** Old installs keep their inline copies and work
  unchanged. Re-installing pulls the new item with the extra file; the
  `use-proximity-hover.json` redirect keeps their dependency list resolving.

## Size

About 19 × 25 lines removed, one ~60-line component and one test added.

## Follow-ups landed 2026-09-08

- **Gap clicks route to the lit row.** `handlers.onClick` in the hook; every
  highlight consumer attaches it (tabs and the accordion do not).
- **The travel is a transform.** `FluidHoverHighlight` is pinned to the
  container's padding corner and animates framer `x` / `y`; `width` /
  `height` stay layout values and only change with the target's size.
- **The state is in the DOM.** `data-fluid-hover-active` on the highlighted
  item, `data-fluid-hover-active-index` on the container (`ACTIVE_ATTR`,
  `ACTIVE_INDEX_ATTR` exported from the hook).

## CSS anchor positioning spike (2026-09-08)

Question: could the highlight be placed by CSS anchor positioning, so the
browser owns the geometry and JS only picks the index?

Setup: five rows with `anchor-name: --row-N`, a highlight with
`position-anchor` and `top/left/width/height` from `anchor()` /
`anchor-size()`, `transition` on the four insets, 300ms linear. Sampled the
highlight's bounding rect every frame after each change.

Results in the Browser pane's Chromium (Chrome 152):

| Change | Frames between start and end | Verdict |
|---|---|---|
| Plain pixel insets (baseline) | 35 | interpolated |
| Switch `position-anchor` to another row | 34 | interpolated |
| Switch the anchor name held in a custom property inside `anchor()` | 34 | interpolated |
| The anchor row itself moves (a row above grows) | 33 | interpolated |

So in Chromium the highlight travels between anchors with a plain CSS
transition, and follows a reflow underneath it for free, which is the
sidebar's snap case solved without code.

What it would take:

- The hook keeps the nearest-index pick (it still needs row rects for that,
  read on the move or measured as today) and writes `position-anchor` to the
  highlight. `itemRects` would no longer feed the overlay at all.
- `spring.fast` is critically damped at 0.08s; `transition-timing-function:
  linear(...)` reproduces it.
- Session re-keying, the `from` rect (start on another anchor, then switch),
  and `transition: none` for the snap case all map directly.
- Anchor names must be unique per list (`anchor-scope` on the container, or a
  per-instance prefix), and nested menus (the sidebar's sub-trees) need care.

Not verified: Safari and Firefox. Their interpolation of `anchor()`-valued
insets across an anchor switch is the open question, and the reason not to
ship this yet. Keep framer's transform path as the default and revisit when
the spike passes in all three engines.

## Simplifications landed 2026-09-08

- **The highlight takes the hook.** `<FluidHoverHighlight hover={hover} />`
  resolves `itemRects[activeIndex]`, `isMeasured`, and the session itself;
  `hidden` keeps a list's state while showing nothing. `rect` + `session`
  remain for lists that resolve their own rect (the sidebar). 21 call sites
  moved; every consumer lost its `activeRect` line and its `sessionRef` read.
- **One registration path.** Every row uses `useRegisterFluidHoverItem`,
  which now accepts an undefined registrar or index. 17 hand-written effects
  gone; nav-item keeps its own because it registers a slug too.
- **No measuring on `children`.** 10 redundant `measureItems()` effects
  deleted (registration and the observers already cover them). The four
  "on open" callers (dropdown popups, color-picker, input-message) use
  `remeasure()`, replacing three double-rAF blocks. `measureItems` stays for
  the accordion's per-frame sync inside its height animation, and the two
  entry points are documented apart.

## Not done: splitting hover from the rect cache

The plan's step 1 assumed the measured-rect cache mostly served hover. It
does not. Of 21 consumers, 17 read `itemRects` for something else: focus
rings (every list), the checked or selected row (dropdown, select, combobox,
radio, color-picker, nav-menu), and the merged selection blocks (checkbox
group, dropdown, combobox, ask-user-questions). Only card, table, input-group
and the input-message suggestions are hover-only. A split into a lean hover
hook plus a rect-cache hook would give those four a smaller import and make
the other 17 call two hooks. Left as is; revisit only if the selection
overlays get their own rework.
