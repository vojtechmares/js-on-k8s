// Every setting comes from the environment. Fail fast on missing values.
// Recipe: https://js-on-k8s.dev/recipes/config-from-environment/

const required = (name) => {
  const value = process.env[name];
  if (value === undefined || value === "") throw new Error(`Missing env var ${name}`);
  return value;
};

export const config = {
  port: Number(process.env.PORT ?? 3000),
  logLevel: process.env.LOG_LEVEL ?? "info",
  greeting: process.env.GREETING ?? "hello",
  // Uncomment when the service gets a database:
  // databaseUrl: required("DATABASE_URL"),
  shutdownTimeoutMs: Number(process.env.SHUTDOWN_TIMEOUT_MS ?? 10_000),
  maxInFlight: Number(process.env.MAX_IN_FLIGHT ?? 200),
  maxLoopLagMs: Number(process.env.MAX_LOOP_LAG_MS ?? 200),
};

export { required };
