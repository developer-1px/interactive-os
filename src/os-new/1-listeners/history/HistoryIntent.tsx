/**
 * HistoryIntent - OS History Command Router
 *
 * Routes programmatic OS_UNDO and OS_REDO commands to active Zone's
 * bound commands. Will be enhanced when kernel event subscription API
 * supports command-level filtering.
 *
 * @status STUB — Awaiting kernel.onCommand() API
 */

export function HistoryIntent() {
  // TODO: Replace with kernel.onCommand() when available
  // Previously used useCommandListener (legacy pipeline)
  return null;
}

HistoryIntent.displayName = "HistoryIntent";
