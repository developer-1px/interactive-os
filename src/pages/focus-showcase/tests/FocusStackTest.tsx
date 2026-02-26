import { FocusGroup } from "@os/6-components/base/FocusGroup.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import { Item } from "@os/6-components/primitives/Item.tsx";
import { Dialog } from "@os/6-components/radix/Dialog.tsx";
import { useRef } from "react";
import { TestBox } from "../../shared/TestLayout";

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
            Dialog (ZIFT Kernel)
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
          <FocusGroup
            id="fs-base"
            role="listbox"
            navigate={{ orientation: "vertical" }}
            select={{ mode: "single" }}
            className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
          >
            {["Button 1", "Button 2", "Button 3"].map((item, i) => (
              <FocusItem
                key={item}
                id={`fs-base-${i + 1}`}
                role="option"
                className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-blue-100 aria-[current=true]:text-blue-700 text-sm"
              >
                {item}
                {i === 0 && (
                  <Dialog>
                    <Dialog.Trigger>
                      <button
                        type="button"
                        id="fs-open-modal"
                        className="ml-2 text-xs text-blue-500 hover:underline"
                      >
                        Open Modal
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Content
                      title="Modal 1"
                      zoneClassName="flex flex-col gap-1 p-4"
                    >
                      {["Modal Item A", "Modal Item B"].map((mItem, mi) => (
                        <Item
                          key={mItem}
                          id={`fs-modal1-${mi + 1}`}
                          role="menuitem"
                          className="px-3 py-2 rounded hover:bg-gray-100 aria-[current=true]:bg-violet-100 aria-[current=true]:text-violet-700 text-sm"
                        >
                          {mItem}
                          {mi === 1 && (
                            <Dialog>
                              <Dialog.Trigger>
                                <button
                                  type="button"
                                  id="fs-open-sub-modal"
                                  className="ml-2 text-xs text-violet-500 hover:underline"
                                >
                                  Open Sub-Modal
                                </button>
                              </Dialog.Trigger>
                              <Dialog.Content
                                title="Sub-Modal"
                                zoneClassName="flex flex-col gap-1 p-4"
                              >
                                {["Sub Item 1", "Sub Item 2"].map(
                                  (sItem, si) => (
                                    <Item
                                      key={sItem}
                                      id={`fs-modal2-${si + 1}`}
                                      role="menuitem"
                                      className="px-3 py-2 rounded hover:bg-gray-100 aria-[current=true]:bg-pink-100 aria-[current=true]:text-pink-700 text-sm"
                                    >
                                      {sItem}
                                    </Item>
                                  ),
                                )}
                                <Dialog.Close className="mt-2 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100">
                                  Close Sub-Modal
                                </Dialog.Close>
                              </Dialog.Content>
                            </Dialog>
                          )}
                        </Item>
                      ))}
                      <Dialog.Close className="mt-2 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100">
                        Close Modal
                      </Dialog.Close>
                    </Dialog.Content>
                  </Dialog>
                )}
              </FocusItem>
            ))}
          </FocusGroup>
        </div>

        {/* Scroll Sync Test */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Scroll Sync Test
          </div>
          <div
            ref={scrollContainerRef}
            className="h-24 overflow-y-auto border border-gray-200 rounded bg-gray-50"
          >
            <FocusGroup
              id="fs-scroll"
              role="listbox"
              navigate={{ orientation: "vertical" }}
              className="flex flex-col p-1 gap-0.5"
            >
              {scrollItems.map((item, i) => (
                <FocusItem
                  key={item}
                  id={`fs-scroll-${i + 1}`}
                  role="option"
                  className="px-2 py-1 rounded hover:bg-gray-100 aria-[current=true]:bg-emerald-100 aria-[current=true]:text-emerald-700 text-xs shrink-0"
                >
                  {item}
                </FocusItem>
              ))}
            </FocusGroup>
          </div>
          <div className="text-[10px] text-gray-500">
            Navigate to bottom items to test scroll sync.
          </div>
        </div>
      </div>
    </TestBox>
  );
}
