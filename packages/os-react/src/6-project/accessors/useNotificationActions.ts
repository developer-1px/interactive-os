/**
 * useNotificationActions — OS hook for notification dismiss/action.
 *
 * Encapsulates os.dispatch(OS_NOTIFY_DISMISS) so React components
 * don't need to import the os singleton.
 */

import type { BaseCommand } from "@kernel/core/tokens";
import { OS_NOTIFY_DISMISS } from "@os-core/4-command/toast/toast";
import { os } from "@os-core/engine/kernel";

export function useNotificationActions() {
  return {
    dismiss: (id: string) => {
      os.dispatch(OS_NOTIFY_DISMISS({ id }));
    },
    executeAction: (actionCommand: BaseCommand, id: string) => {
      os.dispatch(actionCommand);
      os.dispatch(OS_NOTIFY_DISMISS({ id }));
    },
  };
}
