// Liveness endpoint. Readiness lives in app/api/readyz.
export const dynamic = "force-dynamic";

export function GET() {
  return new Response("ok");
}
