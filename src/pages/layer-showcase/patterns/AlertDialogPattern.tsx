/**
 * Layer Playground: AlertDialog Showcase
 *
 * Demonstrates OS alertdialog overlay:
 *   - Trigger click → modal alertdialog opens
 *   - Focus trap (Tab cycles within alertdialog)
 *   - Escape does NOT close (alertdialog spec)
 *   - Only Cancel/Confirm buttons can close
 */

import { OS_OVERLAY_OPEN } from "@os-sdk/os";

import { defineApp } from "@os-sdk/app/defineApp";
import { Dialog } from "@os-react/6-project/widgets/radix/Dialog";
import { Icon } from "@/components/Icon";

// ─── App Definition ───

export const AlertDialogShowcaseApp = defineApp("layer-alertdialog-showcase", {});

// Trigger zone
const triggerZone = AlertDialogShowcaseApp.createZone("alertdialog-trigger-zone");
triggerZone.bind({
  role: "toolbar",
  getItems: () => ["OpenAlertDialog"],
  triggers: {
    OpenAlertDialog: () =>
      OS_OVERLAY_OPEN({
        id: "layer-alertdialog",
        type: "alertdialog",
        entry: "first",
      }),
  },
});

// AlertDialog zone: focus trap, NO escape dismiss
const alertZone = AlertDialogShowcaseApp.createZone("layer-alertdialog");
alertZone.bind({
  role: "group",
  getItems: () => ["alert-cancel", "alert-confirm"],
  options: {
    tab: { behavior: "trap" as const },
    // No dismiss.escape — alertdialog blocks Escape
  },
});

// ─── React Component ───

export function AlertDialogPattern() {
  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold mb-3">AlertDialog</h3>
      <p className="text-sm text-gray-500 mb-4">
        A modal dialog that requires explicit confirmation.{" "}
        <kbd>Escape</kbd> does NOT close it. Only Cancel or Confirm buttons
        can dismiss the dialog.
      </p>

      <Dialog id="layer-alertdialog" role="alertdialog">
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="
              inline-flex items-center gap-2 px-4 py-2
              bg-red-600 text-white text-sm font-medium rounded-lg
              hover:bg-red-700 transition-colors
              focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none
            "
          >
            <Icon name="alert-triangle" size={14} />
            Delete Item
          </button>
        </Dialog.Trigger>

        <Dialog.Content
          title="Confirm Delete"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          contentClassName="bg-white rounded-xl shadow-2xl p-6 w-80"
        >
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this item? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-2">
            <Dialog.Close
              id="alert-cancel"
              className="
                px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md
                hover:bg-gray-50 transition-colors
                data-[focused=true]:ring-2 data-[focused=true]:ring-red-300
              "
            >
              Cancel
            </Dialog.Close>
            <Dialog.Close
              id="alert-confirm"
              className="
                px-4 py-2 text-sm text-white bg-red-600 rounded-md
                hover:bg-red-700 transition-colors
                data-[focused=true]:ring-2 data-[focused=true]:ring-red-300
              "
            >
              Delete
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
