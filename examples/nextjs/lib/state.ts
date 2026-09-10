// Process-wide readiness flag. Flipped by instrumentation.ts on SIGTERM.
export const state = { ready: true };
