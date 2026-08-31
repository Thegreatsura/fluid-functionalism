// Bundler-safe registry dependency-URL resolution, shared by the dynamic
// preset route (which can't import scripts/postbuild-registry.mjs — that
// script touches the filesystem at module scope). The postbuild keeps its
// own resolver; tests/preset-route.test.mjs asserts the two agree for every
// item × flavor, so they cannot drift.
import { DUAL_FLAVOR_SLUGS } from "./dual-flavor-slugs.mjs";

export const REGISTRY_BASE_URL = "https://www.fluidfunctionalism.com/r";

/**
 * Build a depUrl(dep, flavor) resolver from the registry manifest's items.
 *  - Dual-flavour deps and single-source deps that carry flavoured payload
 *    variants resolve to the matching flavour subpath.
 *  - Other custom deps resolve to the flat URL.
 *  - Anything not in the manifest (e.g. "utils") stays a plain name for the
 *    default shadcn registry.
 */
export function buildDepResolver(items) {
  const dual = new Set(DUAL_FLAVOR_SLUGS);
  const names = new Set(
    items
      .filter((i) => typeof i.name === "string")
      .map((i) => i.name.replace(/-base$/, ""))
  );
  const flavoredSingleSource = new Set(
    items
      .filter(
        (i) =>
          typeof i.name === "string" &&
          !i.name.endsWith("-base") &&
          !dual.has(i.name) &&
          (i.registryDependencies ?? []).some((d) => dual.has(d))
      )
      .map((i) => i.name)
  );
  return function depUrl(dep, flavor /* 'flat' | 'radix' | 'base' */) {
    // "utils" ships in the manifest too, but the postbuild deliberately
    // leaves it a plain name (the default shadcn registry provides it).
    if (dep === "utils" || !names.has(dep)) return dep;
    if (dual.has(dep) || flavoredSingleSource.has(dep)) {
      if (flavor === "base") return `${REGISTRY_BASE_URL}/base/${dep}.json`;
      if (flavor === "radix") return `${REGISTRY_BASE_URL}/radix/${dep}.json`;
    }
    return `${REGISTRY_BASE_URL}/${dep}.json`;
  };
}
