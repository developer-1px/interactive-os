import { Zone } from "@os/6-components/primitives/Zone.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import { Field } from "@os/6-components/field/Field.tsx";
import { Trigger } from "@os/6-components/primitives/Trigger.tsx";
import { useState } from "react";
import { TestBox } from "../../shared/TestLayout";

export function AriaInteractionTest() {
  const [actionCount, setActionCount] = useState(0);

  const description = (
    <div className="space-y-2">
      <p>Verifies interaction primitives:</p>
      <ul className="list-disc list-inside space-y-1 text-gray-500">
        <li>
          <strong>Trigger</strong>: Dispatches commands on click/Enter.
        </li>
        <li>
          <strong>Selection</strong>: <code>aria-selected</code> via Zone
          configuration.
        </li>
        <li>
          <strong>Field</strong>: Input focus and activation.
        </li>
      </ul>
    </div>
  );

  // Mock Command for Trigger
  const mockCommand = {
    type: "TEST_ACTION",
    payload: { id: "test-trigger" },
  };

  // Custom dispatch for the test trigger to update DOM for assertion
  const handleTriggerDispatch = () => {
    const btn = document.getElementById("test-trigger-btn");
    if (btn) btn.setAttribute("data-clicked", "true");
    setActionCount((c) => c + 1);
  };

  return (
    <TestBox title="ARIA Interactions" spec="§9" description={description}>
      <div className="flex flex-col gap-4">
        {/* 1. Trigger Section */}
        <div className="border p-2 rounded bg-gray-50">
          <div className="text-[10px] font-mono text-gray-500 mb-2 uppercase">
            Trigger (Button)
          </div>
          <Trigger
            id="test-trigger-btn"
            onActivate={mockCommand}
            dispatch={handleTriggerDispatch}
            className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-100 active:bg-gray-200 text-sm"
          >
            Click Me ({actionCount})
          </Trigger>
        </div>

        {/* 2. Selection Section */}
        <div className="border p-2 rounded bg-gray-50">
          <div className="text-[10px] font-mono text-gray-500 mb-2 uppercase">
            Selection (Listbox)
          </div>
          <Zone
            id="test-select-group"
            role="listbox"
            options={{ navigate: { orientation: "vertical" }, select: { mode: "single" } }}
            className="flex flex-col gap-1"
          >
            {["Item 1", "Item 2", "Item 3"].map((text, i) => (
              <FocusItem
                key={i}
                id={`test-select-${i + 1}`}
                role="option"
                className="px-2 py-1 bg-white border border-gray-200 rounded text-sm cursor-pointer aria-[selected=true]:bg-blue-50 aria-[selected=true]:border-blue-300 aria-[current=true]:ring-1 ring-blue-400"
              >
                {text}
              </FocusItem>
            ))}
          </Zone>
        </div>

        {/* 3. Field Section */}
        <div className="border p-2 rounded bg-gray-50">
          <div className="text-[10px] font-mono text-gray-500 mb-2 uppercase">
            Field (Input)
          </div>
          <Field.Editable
            name="test-field-input"
            value=""
            placeholder="Focus me..."
            className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm focus:outline-none data-[focused=true]:border-blue-500 data-[focused=true]:ring-1 ring-blue-500"
          />
        </div>
      </div>
    </TestBox>
  );
}
