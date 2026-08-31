import { NextResponse } from "next/server";
import { decodeSidebarPreset } from "@/lib/preset/codec";
import {
  generateSidebarPresetFiles,
  presetRegistryDeps,
  presetNpmDeps,
} from "@/lib/preset/sidebar-install";
// Same flavor rules as the postbuild's resolver — a parity test keeps the
// two in lockstep (tests/preset-route.test.mjs).
import { buildDepResolver } from "@/lib/registry-urls.mjs";
import registryManifest from "@/registry.json";

const depUrl = buildDepResolver(registryManifest.items);

// A preset code is a deterministic, stateless encoding of the playground
// configuration (see lib/preset/codec.ts) — the response is immutable.
const CACHE = "public, max-age=31536000, immutable";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: raw } = await params;
  const code = raw.replace(/\.json$/, "");
  const decoded = decodeSidebarPreset(code);
  if (!decoded.ok) {
    return NextResponse.json(
      { error: decoded.error },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  const preset = decoded.preset;
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: `sidebar-preset-${code}`,
    type: "registry:block",
    title: "Sidebar (playground preset)",
    description:
      "A sidebar generated from a fluidfunctionalism.com playground configuration — the exact variant you built, installable.",
    docs: `Reopen or tweak this configuration: https://www.fluidfunctionalism.com/docs/sidebar?preset=${code}`,
    dependencies: presetNpmDeps(preset),
    registryDependencies: presetRegistryDeps(preset).map((dep) =>
      depUrl(dep, preset.flavor)
    ),
    files: generateSidebarPresetFiles(preset).map((f) => ({
      path: f.path,
      type: f.type,
      target: f.target,
      content: f.content,
    })),
  };
  return NextResponse.json(item, {
    headers: { "Cache-Control": CACHE, "Content-Type": "application/json" },
  });
}
