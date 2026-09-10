import { state } from "@/lib/state";

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(state.ready ? "ready" : "not ready", { status: state.ready ? 200 : 503 });
}
