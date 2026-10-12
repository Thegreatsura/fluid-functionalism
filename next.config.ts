import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The root layout reads content/changelog/ on every route (the sidebar's
  // New dots, lib/changelog/load.ts). File tracing only finds those files
  // for /changelog itself, so every route ships them explicitly.
  outputFileTracingIncludes: {
    "/**": ["./content/changelog/**/*"],
  },
  async redirects() {
    return [
      // The fluid hover hook was published as `use-proximity-hover` until
      // 2026-09-07. Installed components still list it as a registry
      // dependency, so the old URL must keep resolving.
      {
        source: "/r/use-proximity-hover.json",
        destination: "/r/use-fluid-hover.json",
        permanent: true,
      },
      // Short link to the agent skill page, for sharing.
      {
        source: "/skill",
        destination: "/docs/skill",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
