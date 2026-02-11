/**
 * ClipboardIntent - OS Clipboard Command Router
 *
 * Routes programmatic OS_COPY, OS_CUT, OS_PASTE commands
 * to the active Zone's bound commands.
 *
 * Note: Most real clipboard interactions come through ClipboardSensor
 * (native DOM events). This will be enhanced when kernel event
 * subscription API supports command-level filtering.
 *
 * @status STUB — Awaiting kernel.onCommand() API
 */

export function ClipboardIntent() {
  // TODO: Replace with kernel.onCommand() when available
  // Previously used useCommandListener (legacy pipeline)
  return null;
}

ClipboardIntent.displayName = "ClipboardIntent";
