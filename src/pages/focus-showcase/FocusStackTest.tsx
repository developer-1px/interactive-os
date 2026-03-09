import { Item } from "@os-react/6-project/Item.tsx";
import { ModalPortal } from "@os-react/6-project/widgets/ModalPortal";
import { Zone } from "@os-react/6-project/Zone.tsx";
import { OS_OVERLAY_CLOSE } from "@os-sdk/os";
import { useRef } from "react";
import { TestBox } from "../shared/TestLayout";

// ═══════════════════════════════════════════════════════════════════
// Test Component
// ═══════════════════════════════════════════════════════════════════

export function FocusStackTest() {
  // Scroll test ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const description = (
    <div className="space-y-2">
      <p>
        <strong>Focus Stack &amp; Scroll Sync</strong> tests dialog focus
        management.
      </p>
      <ul className="list-disc list-inside space-y-1 text-gray-500">
        <li>
          <strong>Focus Stack</strong>: Modal open/close restores previous focus
          via{" "}
          <code className="text-xs bg-gray-100 px-1 rounded">
            ModalPortal (ZIFT Kernel)
          </code>
          .
        </li>
        <li>
          <strong>Nested Modals</strong>: Stacked dialogs maintain focus chain.
        </li>
        <li>
          <strong>Scroll Sync</strong>: Focused item auto-scrolls into view.
        </li>
      </ul>
    </div>
  );

  // Items for scroll test
  const scrollItems = Array.from({ length: 15 }, (_, i) => `Item ${i + 1}`);

  return (
    <TestBox title="Focus Stack / Scroll" spec="§3.1" description={description}>
      <div className="flex flex-col gap-4">
        {/* Base List */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Base Zone
          </div>
          <Zone
            id="fs-base"
            role="listbox"
            options={{
              navigate: { orientation: "vertical" },
              select: { mode: "single" },
            }}
            className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
          >
            {["Button 1", "Button 2", "Button 3"].map((item, i) => (
              <Item
                key={item}
                id={`fs-base-${i + 1}`}
                role="option"
                className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-blue-100 aria-[current=true]:text-blue-700 text-sm"
              >
                {item}
                {i === 0 && (
                  <button
                    type="button"
                    id="fs-open-modal"
                    data-trigger-id="fs-open-modal"
                    aria-haspopup="dialog"
                    className="ml-2 text-xs text-blue-500 hover:underline"
                  >
                    Open Modal
                  </button>
                )}
              </Item>
            ))}
          </Zone>
        </div>

        {/* Modal 1 */}
        <ModalPortal
          overlayId="dialog-dialog"
          role="dialog"
          title="Modal 1"
          onAction={(cursor) => {
            if (cursor.focusId === "fs-modal1-close") {
              return OS_OVERLAY_CLOSE({ id: "dialog-dialog" });
            }
            return [];
          }}
        >
          <div className="flex flex-col gap-1 p-4">
            {["Modal Item A", "Modal Item B"].map((mItem, mi) => (
              <Item
                key={mItem}
                id={`fs-modal1-${mi + 1}`}
                role="menuitem"
                className="px-3 py-2 rounded hover:bg-gray-100 aria-[current=true]:bg-violet-100 aria-[current=true]:text-violet-700 text-sm"
              >
                {mItem}
                {mi === 1 && (
                  <button
                    type="button"
                    id="fs-open-sub-modal"
                    data-trigger-id="fs-open-sub-modal"
                    aria-haspopup="dialog"
                    className="ml-2 text-xs text-violet-500 hover:underline"
                  >
                    Open Sub-Modal
                  </button>
                )}
              </Item>
            ))}
            <Item
              id="fs-modal1-close"
              as="button"
              className="mt-2 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
            >
              Close Modal
            </Item>
          </div>
        </ModalPortal>

        {/* Sub-Modal (nested) */}
        <ModalPortal
          overlayId="dialog-dialog-sub"
          role="dialog"
          title="Sub-Modal"
          onAction={(cursor) => {
            if (cursor.focusId === "fs-modal2-close") {
              return OS_OVERLAY_CLOSE({ id: "dialog-dialog-sub" });
            }
            return [];
          }}
        >
          <div className="flex flex-col gap-1 p-4">
            {["Sub Item 1", "Sub Item 2"].map((sItem, si) => (
              <Item
                key={sItem}
                id={`fs-modal2-${si + 1}`}
                role="menuitem"
                className="px-3 py-2 rounded hover:bg-gray-100 aria-[current=true]:bg-pink-100 aria-[current=true]:text-pink-700 text-sm"
              >
                {sItem}
              </Item>
            ))}
            <Item
              id="fs-modal2-close"
              as="button"
              className="mt-2 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
            >
              Close Sub-Modal
            </Item>
          </div>
        </ModalPortal>

        {/* Scroll Sync Test */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Scroll Sync Test
          </div>
          <div
            ref={scrollContainerRef}
            className="h-24 overflow-y-auto border border-gray-200 rounded bg-gray-50"
          >
            <Zone
              id="fs-scroll"
              role="listbox"
              options={{ navigate: { orientation: "vertical" } }}
              className="flex flex-col p-1 gap-0.5"
            >
              {scrollItems.map((item, i) => (
                <Item
                  key={item}
                  id={`fs-scroll-${i + 1}`}
                  role="option"
                  className="px-2 py-1 rounded hover:bg-gray-100 aria-[current=true]:bg-emerald-100 aria-[current=true]:text-emerald-700 text-xs shrink-0"
                >
                  {item}
                </Item>
              ))}
            </Zone>
          </div>
          <div className="text-[10px] text-gray-500">
            Navigate to bottom items to test scroll sync.
          </div>
        </div>
      </div>
    </TestBox>
  );
}
