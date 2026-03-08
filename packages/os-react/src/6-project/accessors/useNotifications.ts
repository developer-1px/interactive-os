/**
 * useNotifications — OS hook to get the notification stack.
 *
 * Encapsulates OS internal state path so apps don't need to know
 * `s.os.notifications.stack`.
 */

import { os } from "@os-core/engine/kernel";
import type { NotificationEntry } from "@os-core/schema/state/OSState";

export function useNotifications(): readonly NotificationEntry[] {
  return os.useComputed((s) => s.os.notifications.stack);
}
