// Takes three seconds. Use it to watch in-flight requests finish during shutdown.
export const dynamic = "force-dynamic";

export async function GET() {
  await new Promise((r) => setTimeout(r, 3000));
  return new Response("done");
}
