import { buildLlmsTxt } from "@/lib/docs/llms";

// /llms.txt, built once at deploy from the docs lists.
export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
