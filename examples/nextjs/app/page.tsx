export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main>
      <h1>hello from next.js</h1>
      <p>
        pod: {process.env.HOSTNAME ?? "local"} · node: {process.version}
      </p>
    </main>
  );
}
