/**
 * Layer Playground: Nested Overlay Showcase
 *
 * Demonstrates nested dialog LIFO:
 *   - Button opens Dialog 1
 *   - Inside Dialog 1, button opens Dialog 2
 *   - Escape closes Dialog 2 first (LIFO)
 *   - Escape again closes Dialog 1
 *   - Focus restores correctly through the chain
 */

import { OS_OVERLAY_OPEN } from "@os-core/4-command/overlay/overlay";
import { Item } from "@os-react/internal";
import { defineApp } from "@os-sdk/app/defineApp";
import { Dialog } from "@os-react/6-project/widgets/radix/Dialog";
import { Icon } from "@/components/Icon";

// ─── App Definition ───

export const NestedShowcaseApp = defineApp("layer-nested-showcase", {});

// Trigger zone
const triggerZone = NestedShowcaseApp.createZone("nested-trigger-zone");
triggerZone.bind({
  role: "toolbar",
  getItems: () => ["OpenNestedBtn"],
  triggers: {
    OpenNestedBtn: () =>
      OS_OVERLAY_OPEN({
        id: "nested-dialog-1",
        type: "dialog",
        entry: "first",
      }),
  },
});

// Dialog 1
const dialog1Zone = NestedShowcaseApp.createZone("nested-dialog-1");
dialog1Zone.bind({
  role: "group",
  getItems: () => ["d1-close", "D1OpenNested"],
  options: {
    tab: { behavior: "trap" as const },
    dismiss: { escape: "close" as const },
  },
  triggers: {
    D1OpenNested: () =>
      OS_OVERLAY_OPEN({
        id: "nested-dialog-2",
        type: "dialog",
        entry: "first",
      }),
  },
});

// Dialog 2
const dialog2Zone = NestedShowcaseApp.createZone("nested-dialog-2");
dialog2Zone.bind({
  role: "group",
  getItems: () => ["d2-ok", "d2-cancel"],
  options: {
    tab: { behavior: "trap" as const },
    dismiss: { escape: "close" as const },
  },
});

// ─── React Component ───

export function NestedPattern() {
  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold mb-3">Nested Overlay (LIFO)</h3>
      <p className="text-sm text-gray-500 mb-4">
        Opens a dialog, which contains a button to open a second dialog.{" "}
        <kbd>Escape</kbd> closes the topmost dialog first (LIFO stack).
        Focus restores correctly through the chain.
      </p>

      <Dialog id="nested-dialog-1" role="dialog">
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
            <Icon name="layers" size={14} />
            Open Settings
          </button>
        </Dialog.Trigger>

        <Dialog.Content
          title="Settings"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          contentClassName="bg-white rounded-xl shadow-2xl p-6 w-96"
        >
          <p className="text-sm text-gray-600 mb-4">
            This is the first dialog. Click below to open a nested confirmation.
          </p>

          <Dialog id="nested-dialog-2" role="dialog">
            <Dialog.Trigger asChild>
              <Item
                id="D1OpenNested"
                as="button"
                className="
                  px-4 py-2 text-sm bg-amber-500 text-white rounded-md
                  hover:bg-amber-600 transition-colors mb-2
                  data-[focused=true]:ring-2 data-[focused=true]:ring-amber-300
                "
              >
                Open Nested Dialog
              </Item>
            </Dialog.Trigger>

            <Dialog.Content
              title="Confirm"
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30"
              contentClassName="bg-white rounded-xl shadow-2xl p-6 w-72"
            >
              <p className="text-sm text-gray-600 mb-4">Are you sure?</p>
              <div className="flex justify-end gap-2">
                <Dialog.Close
                  id="d2-cancel"
                  className="px-3 py-1.5 text-sm border rounded-md data-[focused=true]:ring-2"
                >
                  No
                </Dialog.Close>
                <Dialog.Close
                  id="d2-ok"
                  className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-md data-[focused=true]:ring-2"
                >
                  Yes
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog>

          <Dialog.Close
            id="d1-close"
            className="
              block mt-3 px-4 py-2 text-sm text-gray-600 border rounded-md
              hover:bg-gray-50 transition-colors
              data-[focused=true]:ring-2 data-[focused=true]:ring-violet-300
            "
          >
            Close Settings
          </Dialog.Close>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
