// Liveness endpoint. Readiness is handled by the preStop sleep and the
// server's own SIGTERM handling; see the recipe.
export const dynamic = "force-dynamic";

export function GET() {
  return new Response("ok");
}
