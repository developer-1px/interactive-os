import { Field } from "@os-react/6-project/field/Field.tsx";
import { Item } from "@os-react/6-project/Item.tsx";
import { Zone } from "@os-react/6-project/Zone.tsx";
import { defineApp } from "@os-sdk/app/defineApp";
import { TestBox } from "../shared/TestLayout";

// ─── Minimal app for trigger demonstration ───

const TestApp = defineApp<Record<string, never>>("aria-interaction-test", {});
const triggerZone = TestApp.createZone("trigger-section");

const TEST_ACTION = triggerZone.command("TEST_ACTION", (ctx) => ({
  state: ctx.state,
}));

const TriggerUI = triggerZone.bind("toolbar", {
  triggers: {
    TestButton: () => TEST_ACTION(),
  },
});

export function AriaInteractionTest() {
  const description = (
    <div className="space-y-2">
      <p>Verifies interaction primitives:</p>
      <ul className="list-disc list-inside space-y-1 text-gray-500">
        <li>
          <strong>Trigger</strong>: Dispatches commands on click/Enter
          (prop-getter).
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

  return (
    <TestBox title="ARIA Interactions" spec="§9" description={description}>
      <div className="flex flex-col gap-4">
        {/* 1. Trigger Section (prop-getter in bind) */}
        <div className="border p-2 rounded bg-gray-50">
          <div className="text-[10px] font-mono text-gray-500 mb-2 uppercase">
            Trigger (Button)
          </div>
          <TriggerUI.Zone aria-label="Test triggers">
            <TriggerUI.Item id="test-trigger-btn">
              <button
                type="button"
                {...TriggerUI.triggers.TestButton()}
                className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-100 active:bg-gray-200 text-sm"
              >
                Click Me
              </button>
            </TriggerUI.Item>
          </TriggerUI.Zone>
        </div>

        {/* 2. Selection Section */}
        <div className="border p-2 rounded bg-gray-50">
          <div className="text-[10px] font-mono text-gray-500 mb-2 uppercase">
            Selection (Listbox)
          </div>
          <Zone
            id="test-select-group"
            role="listbox"
            options={{
              navigate: { orientation: "vertical" },
              select: { mode: "single" },
            }}
            className="flex flex-col gap-1"
          >
            {["Item 1", "Item 2", "Item 3"].map((text, i) => (
              <Item
                key={i}
                id={`test-select-${i + 1}`}
                role="option"
                className="px-2 py-1 bg-white border border-gray-200 rounded text-sm cursor-pointer aria-[selected=true]:bg-blue-50 aria-[selected=true]:border-blue-300 aria-[current=true]:ring-1 ring-blue-400"
              >
                {text}
              </Item>
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
