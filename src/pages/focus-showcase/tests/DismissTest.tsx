import { FocusGroup } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { TestBox } from "../../shared/TestLayout";

export function DismissTest() {

  const description = (
    <div className="space-y-2">
      <p>
        <strong>Dismiss</strong> strategies handle how a group reacts to Escape
        or Outside Clicks.
      </p>
      <ul className="list-disc list-inside space-y-1 text-gray-500">
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            escape: 'deselect'
          </code>
          : Clears the current selection.
        </li>
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            escape: 'close'
          </code>
          : Fires <code className="text-xs">onDismiss</code> (closes
          menu/modal).
        </li>
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            escape: 'none'
          </code>
          : Escape key does nothing.
        </li>
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            outsideClick: 'close'
          </code>
          : Dismisses when clicking outside.
        </li>
      </ul>
    </div>
  );

  return (
    <TestBox
      title="Dismiss / Escape"
      description={description}
    >
      <div className="flex flex-col gap-6">
        {/* Deselect */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Escape = Deselect
          </div>
          <FocusGroup
            id="dis-esc"
            role="listbox"
            navigate={{ orientation: "vertical" }}
            select={{ mode: "single" }}
            dismiss={{ escape: "deselect" }}
            className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
          >
            {["Item 1", "Item 2"].map((item) => (
              <FocusItem
                key={item}
                id={`dis-esc-${item.split(" ")[1]}`}
                role="option"
                className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[selected=true]:bg-indigo-100 aria-[selected=true]:text-indigo-700 text-sm border border-transparent aria-[selected=true]:border-indigo-300"
              >
                {item}
              </FocusItem>
            ))}
          </FocusGroup>
          <div className="text-[10px] text-gray-500">
            Select an item, then press Escape to deselect.
          </div>
        </div>

        {/* Close */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Escape = Close (Menu)
          </div>
          <FocusGroup
            id="dis-close"
            role="menu"
            navigate={{ orientation: "vertical" }}
            dismiss={{ escape: "close" }}
            className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
          >
            {["Menu Item A", "Menu Item B"].map((item) => (
              <FocusItem
                key={item}
                id={`dis-close-${item.split(" ")[2]}`}
                role="menuitem"
                className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-violet-100 aria-[current=true]:text-violet-700 text-sm border border-transparent aria-[current=true]:border-violet-300"
              >
                {item}
              </FocusItem>
            ))}
          </FocusGroup>
          <div className="text-[10px] text-gray-500">
            Press Escape to trigger onDismiss (console).
          </div>
        </div>

        {/* Outside Click */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Outside Click = Close
          </div>
          <FocusGroup
            id="dis-outside"
            role="listbox"
            navigate={{ orientation: "vertical" }}
            select={{ mode: "single" }}
            dismiss={{ outsideClick: "close" }}
            className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
          >
            {["Outside 1", "Outside 2"].map((item) => (
              <FocusItem
                key={item}
                id={`dis-out-${item.split(" ")[1]}`}
                role="option"
                className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[selected=true]:bg-amber-100 aria-[selected=true]:text-amber-700 text-sm border border-transparent aria-[selected=true]:border-amber-300"
              >
                {item}
              </FocusItem>
            ))}
          </FocusGroup>
          <div className="text-[10px] text-gray-500">
            Select an item, then click outside to dismiss.
          </div>
        </div>
      </div>
    </TestBox>
  );
}
