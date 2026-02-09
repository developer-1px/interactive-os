import { processCommand } from "./pipeline.ts";
import type { Command, ScopeToken } from "./tokens.ts";

const queue: Command[] = [];
let processing = false;

/**
 * dispatch — the single entry point.
 * Accepts a typed Command (created by CommandFactory).
 */
export function dispatch(
  cmd: Command<string, any>,
  options?: { scope?: ScopeToken[] },
): void {
  // Attach scope to command for processing
  const enriched = options?.scope ? { ...cmd, scope: options.scope } : cmd;
  queue.push(enriched as Command);

  if (processing) return;

  processing = true;
  try {
    while (queue.length > 0) {
      const next = queue.shift()!;
      processCommand(next, next.scope);
    }
  } finally {
    processing = false;
  }
}
