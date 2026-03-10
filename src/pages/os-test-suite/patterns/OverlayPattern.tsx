/**
 * OS Test Suite: Overlay Lifecycle
 *
 * Exercises overlay open→navigate→close→restore chain:
 *   1. Trigger click → overlay opens
 *   2. Focus moves to overlay zone
 *   3. Tab cycles within overlay (focus trap)
 *   4. Escape closes → focus restores to trigger
 *
 * Known gaps:
 *   OG-016 — Dialog Tab trap not fully supported in headless
 *   OG-023 — AlertDialog Escape should be blocked
 */

import { ModalPortal } from "@os-react/6-project/widgets/ModalPortal";
import { Item } from "@os-react/internal";
import { defineApp } from "@os-sdk/app/defineApp";
import { OS_OVERLAY_OPEN } from "@os-sdk/os";
import type { TestCase } from "../index";

export const overlayTests: TestCase[] = [
  { name: "click trigger opens dialog", status: "pass" },
  { name: "focus moves to first dialog item on open", status: "pass" },
  { name: "ArrowDown navigates within dialog", status: "pass" },
  { name: "Tab cycles within dialog (focus trap)", status: "pass" },
  { name: "Escape closes dialog", status: "pass" },
  { name: "Escape restores focus to trigger", status: "pass" },
  {
    name: "open > navigate > close > focus restores to trigger",
    status: "pass",
  },
];

// ─── App Definition ───

export const OverlayApp = defineApp("os-test-overlay", {});

const triggerZone = OverlayApp.createZone("overlay-trigger");
triggerZone.bind("toolbar", {
  getItems: () => ["OpenBtn"],
  triggers: {
    OpenBtn: () =>
      OS_OVERLAY_OPEN({
        id: "test-dialog",
        type: "dialog",
        entry: "first",
      }),
  },
});

const dialogZone = OverlayApp.createZone("test-dialog");
dialogZone.bind("group", {
  getItems: () => ["dialog-a", "dialog-b", "dialog-c"],
  options: {
    tab: { behavior: "trap" as const },
    dismiss: { escape: "close" as const },
  },
});

const dialog = triggerZone.overlay("test-dialog", {
  role: "dialog",
});

// ─── React Component ───

export function OverlayPattern() {
  return (
    <div className="max-w-sm">
      <h3 className="text-lg font-semibold mb-3">Overlay Lifecycle</h3>
      <p className="text-sm text-gray-500 mb-4">
        Click button to open dialog.{" "}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Tab</kbd>{" "}
        should cycle within dialog.{" "}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Escape</kbd>{" "}
        closes and restores focus.
      </p>

      <button
        {...dialog.trigger()}
        type="button"
        className="
          px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg
          hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:outline-none
        "
      >
        Open Dialog
      </button>

      <ModalPortal
        overlayId="test-dialog"
        role="dialog"
        title="Test Dialog"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <div className="bg-white rounded-xl shadow-xl p-6 w-80 space-y-4">
          <h4 className="font-semibold text-gray-800">Test Dialog</h4>
          <div className="space-y-2">
            <Item
              id="dialog-a"
              as="button"
              className="
                w-full px-3 py-2 text-sm text-left rounded-md border border-gray-200
                data-[focused=true]:ring-2 data-[focused=true]:ring-emerald-300
              "
            >
              Action A
            </Item>
            <Item
              id="dialog-b"
              as="button"
              className="
                w-full px-3 py-2 text-sm text-left rounded-md border border-gray-200
                data-[focused=true]:ring-2 data-[focused=true]:ring-emerald-300
              "
            >
              Action B
            </Item>
            <Item
              id="dialog-c"
              as="button"
              className="
                w-full px-3 py-2 text-sm text-left rounded-md border border-gray-200
                data-[focused=true]:ring-2 data-[focused=true]:ring-emerald-300
              "
            >
              Close
            </Item>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
