import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getInfo = createServerFn().handler(() => ({
  pod: process.env.HOSTNAME ?? "local",
  node: process.version,
}));

export const Route = createFileRoute("/")({
  loader: () => getInfo(),
  component: Home,
});

function Home() {
  const info = Route.useLoaderData();
  return (
    <main>
      <h1>hello from tanstack start</h1>
      <p>
        pod: {info.pod} · node: {info.node}
      </p>
    </main>
  );
}
