import { Zone } from "@os/6-components/primitives/Zone.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import { TestBox } from "../../shared/TestLayout";

export function ActivateTest() {
  const description = (
    <div className="space-y-2">
      <p>
        <strong>Activation</strong> triggers the primary action of an item
        (e.g., opening a file, submitting a form).
      </p>
      <ul className="list-disc list-inside space-y-1 text-gray-500">
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            mode: 'manual'
          </code>{" "}
          (Default): Activated via Enter key or Double Click.
        </li>
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            mode: 'automatic'
          </code>
          : Activated immediately upon receiving focus.
        </li>
      </ul>
    </div>
  );

  return (
    <TestBox title="Activation Mode" spec="§3.5" description={description}>
      <div className="flex flex-col gap-6">
        {/* Automatic */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Automatic (Tabs/Preview)
          </div>
          <Zone
            id="act-auto"
            role="listbox"
            options={{ navigate: { orientation: "vertical" }, select: { mode: "single", followFocus: true }, activate: { mode: "automatic" } }}
            className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
          >
            {["Preview A", "Preview B"].map((item) => (
              <FocusItem
                key={item}
                id={`act-auto-${item.split(" ")[1]?.toLowerCase()}`}
                role="option"
                className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-rose-100 aria-[current=true]:text-rose-700 text-sm border border-transparent aria-[current=true]:border-rose-300"
              >
                {item}
              </FocusItem>
            ))}
          </Zone>
          <div className="text-[10px] text-gray-500">
            Focusing triggers activation immediately.
          </div>
        </div>

        {/* Manual */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Manual (Standard List)
          </div>
          <Zone
            id="act-manual"
            role="listbox"
            options={{ navigate: { orientation: "vertical" }, activate: { mode: "manual" } }}
            className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
          >
            {["File 1", "File 2"].map((item) => (
              <FocusItem
                key={item}
                id={`act-manual-${item.split(" ")[1]}`}
                role="option"
                className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-blue-100 aria-[current=true]:text-blue-700 text-sm border border-transparent aria-[current=true]:border-blue-300"
              >
                {item}
              </FocusItem>
            ))}
          </Zone>
          <div className="text-[10px] text-gray-500">
            Press Enter or Double Click to activate.
          </div>
        </div>
      </div>
    </TestBox>
  );
}
