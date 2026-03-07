/**
 * Layer Playground: Dialog Showcase
 *
 * Demonstrates OS dialog overlay lifecycle:
 *   - Trigger click → modal dialog opens
 *   - Focus trap (Tab cycles within dialog)
 *   - Escape closes dialog + focus restores to trigger
 *
 * Uses zone-level trigger binding (overlay config).
 * Exported app is headless-testable.
 */

import { OS_OVERLAY_OPEN } from "@os-core/4-command/overlay/overlay";
import { Item, Zone } from "@os-react/internal";
import { defineApp } from "@os-sdk/app/defineApp";
import { Dialog } from "@os-react/6-project/widgets/radix/Dialog";
import { Icon } from "@/components/Icon";

// ─── App Definition ───

export const DialogShowcaseApp = defineApp("layer-dialog-showcase", {});

// Trigger zone: toolbar with a button that opens dialog
const triggerZone = DialogShowcaseApp.createZone("dialog-trigger-zone");
const TriggerUI = triggerZone.bind({
  role: "toolbar",
  getItems: () => ["open-dialog-btn"],
  triggers: [
    {
      id: "open-dialog-btn",
      onActivate: OS_OVERLAY_OPEN({
        id: "layer-dialog",
        type: "dialog",
        entry: "first",
      }),
      overlay: { id: "layer-dialog", type: "dialog" },
    },
  ],
});

// Dialog zone: focus trap + escape dismiss
const dialogZone = DialogShowcaseApp.createZone("layer-dialog");
dialogZone.bind({
  role: "group",
  getItems: () => ["dialog-close", "dialog-name", "dialog-email", "dialog-save"],
  options: {
    tab: { behavior: "trap" as const },
    dismiss: { escape: "close" as const },
  },
});

// ─── React Component ───

export function DialogPattern() {
  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold mb-3">Dialog (Modal)</h3>
      <p className="text-sm text-gray-500 mb-4">
        Click the button to open a modal dialog. <kbd>Tab</kbd> is trapped
        within the dialog. <kbd>Escape</kbd> closes it and restores focus to
        the trigger.
      </p>

      <Dialog id="layer-dialog" role="dialog">
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="
              inline-flex items-center gap-2 px-4 py-2
              bg-violet-600 text-white text-sm font-medium rounded-lg
              hover:bg-violet-700 transition-colors
              focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:outline-none
            "
          >
            <Icon name="external-link" size={14} />
            Open Dialog
          </button>
        </Dialog.Trigger>

        <Dialog.Content
          title="Example Dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          contentClassName="bg-white rounded-xl shadow-2xl p-6 w-96"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <Item
                id="dialog-name"
                as="input"
                type="text"
                placeholder="Enter name"
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                  focus:ring-2 focus:ring-violet-400 focus:outline-none
                  data-[focused=true]:ring-2 data-[focused=true]:ring-violet-400
                "
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Item
                id="dialog-email"
                as="input"
                type="email"
                placeholder="Enter email"
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                  focus:ring-2 focus:ring-violet-400 focus:outline-none
                  data-[focused=true]:ring-2 data-[focused=true]:ring-violet-400
                "
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close
                id="dialog-close"
                className="
                  px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md
                  hover:bg-gray-50 transition-colors
                  data-[focused=true]:ring-2 data-[focused=true]:ring-violet-300
                "
              >
                Cancel
              </Dialog.Close>
              <Dialog.Close
                id="dialog-save"
                className="
                  px-4 py-2 text-sm text-white bg-violet-600 rounded-md
                  hover:bg-violet-700 transition-colors
                  data-[focused=true]:ring-2 data-[focused=true]:ring-violet-300
                "
              >
                Save
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
