// One JSON object per line on stdout, via pino. Nothing else.
// Recipe: https://js-on-k8s.dev/recipes/logging/

import pino from "pino";

export function createLogger(level = "info") {
  return pino({
    level,
    // Keep the output stable and small: no pid/hostname, ISO timestamps.
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}
