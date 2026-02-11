import { FocusGroup } from "@os/6-components/base/FocusGroup.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import { TestBox } from "../../shared/TestLayout";

export function SelectTest() {
  const description = (
    <div className="space-y-2">
      <p>
        <strong>Selection Modes</strong> determine how users interact with
        items.
      </p>
      <ul className="list-disc list-inside space-y-1 text-gray-500">
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            mode: 'single'
          </code>
          : Standard Radio/Tab behavior.
        </li>
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            mode: 'multiple'
          </code>
          : Checkbox/Grid behavior.
        </li>
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            toggle: true
          </code>
          : Allows deselecting (Ctrl+Click).
        </li>
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            range: true
          </code>
          : Shift+Click range selection.
        </li>
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            followFocus: true
          </code>
          : Selection follows focus (Tabs/Radio).
        </li>
      </ul>
    </div>
  );

  return (
    <TestBox title="Selection Strategies" description={description}>
      <div className="flex flex-col gap-6">
        {/* Multi-Select Grid */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Multi-Select + Toggle + Range
          </div>
          <FocusGroup
            id="sel-range"
            role="grid"
            navigate={{ orientation: "horizontal" }}
            select={{ mode: "multiple", toggle: true, range: true }}
            className="grid grid-cols-4 bg-gray-50 p-2 rounded border border-gray-200 gap-2"
          >
            {Array.from({ length: 4 }, (_, i) => (
              <FocusItem
                key={i}
                id={`sel-range-${i}`}
                role="gridcell"
                className="aspect-square flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 aria-[selected=true]:bg-emerald-100 aria-[selected=true]:text-emerald-700 aria-[selected=true]:ring-1 ring-emerald-400 data-[focused=true]:ring-2 data-[focused=true]:ring-blue-500 data-[focused=true]:ring-offset-1 data-[focused=true]:z-10 text-xs cursor-pointer"
              >
                {i}
              </FocusItem>
            ))}
          </FocusGroup>
          <div className="text-[10px] text-gray-500">
            Try Ctrl+Click or Shift+Click
          </div>
        </div>

        {/* Toggle List */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Single + Toggle
          </div>
          <FocusGroup
            id="sel-toggle"
            role="listbox"
            navigate={{ orientation: "vertical" }}
            select={{ mode: "single", toggle: true }}
            className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
          >
            {["Option 1", "Option 2"].map((opt, i) => (
              <FocusItem
                key={opt}
                id={`sel-toggle-${i}`}
                role="option"
                className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[selected=true]:bg-amber-100 aria-[selected=true]:text-amber-700 data-[focused=true]:ring-2 data-[focused=true]:ring-blue-500 data-[focused=true]:ring-inset text-sm border border-transparent aria-[selected=true]:border-amber-300"
              >
                {opt}
              </FocusItem>
            ))}
          </FocusGroup>
        </div>

        {/* Follow Focus (Radio) */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Follow Focus (Radio)
          </div>
          <FocusGroup
            id="sel-radio"
            role="radiogroup"
            navigate={{ orientation: "vertical" }}
            select={{ mode: "single", followFocus: true, disallowEmpty: true }}
            className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
          >
            {["A", "B"].map((opt) => (
              <FocusItem
                key={opt}
                id={`sel-radio-${opt.toLowerCase()}`}
                role="radio"
                className="px-3 py-1.5 flex items-center gap-3 rounded hover:bg-gray-100 group data-[focused=true]:ring-2 data-[focused=true]:ring-blue-500 data-[focused=true]:ring-inset"
              >
                <div className="w-3 h-3 rounded-full border border-gray-400 group-aria-[selected=true]:border-rose-500 group-aria-[selected=true]:bg-rose-100 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 opacity-0 group-aria-[selected=true]:opacity-100" />
                </div>
                <span className="text-sm text-gray-600 group-aria-[selected=true]:text-rose-600">
                  {opt}
                </span>
              </FocusItem>
            ))}
          </FocusGroup>
        </div>
      </div>
    </TestBox>
  );
}
