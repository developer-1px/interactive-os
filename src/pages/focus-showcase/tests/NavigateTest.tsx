import { FocusGroup } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { TestBox } from "../../shared/TestLayout";

export function NavigateTest() {

  const description = (
    <div className="space-y-2">
      <p>
        <strong>Navigation Strategies</strong> define how arrow keys move focus
        within a group.
      </p>
      <ul className="list-disc list-inside space-y-1 text-gray-500">
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            orientation
          </code>
          : 'vertical' | 'horizontal' | 'both'
        </li>
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">loop</code>:
          Wraps focus from start to end (and vice-versa).
        </li>
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            seamless
          </code>
          : Cross-zone navigation at boundaries.
        </li>
      </ul>
    </div>
  );

  return (
    <TestBox
      title="Directional Navigation"
      description={description}
    >
      <div className="flex flex-col gap-6">
        {/* Vertical List with Loop */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Vertical + Loop
          </div>
          <FocusGroup
            id="nav-list"
            role="listbox"
            navigate={{ orientation: "vertical", loop: true }}
            className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
          >
            {["Apple", "Banana", "Cherry"].map((fruit) => (
              <FocusItem
                key={fruit}
                id={`nav-${fruit.toLowerCase()}`}
                role="option"
                className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-blue-100 aria-[current=true]:text-blue-700 aria-[current=true]:border-l-2 border-blue-500 text-sm border-l-2 border-transparent"
              >
                {fruit}
              </FocusItem>
            ))}
          </FocusGroup>
        </div>

        {/* Horizontal Toolbar (No Loop) */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Horizontal (Clamped)
          </div>
          <FocusGroup
            id="nav-toolbar"
            role="toolbar"
            navigate={{ orientation: "horizontal", loop: false }}
            className="flex bg-gray-50 p-2 rounded border border-gray-200 gap-1"
          >
            {["Bold", "Italic", "Underline"].map((action) => (
              <FocusItem
                key={action}
                id={`nav-${action.toLowerCase()}`}
                role="button"
                className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-purple-100 aria-[current=true]:text-purple-700 text-sm border border-transparent aria-[current=true]:border-purple-300"
              >
                {action[0]}
              </FocusItem>
            ))}
          </FocusGroup>
        </div>

        {/* Grid 2D */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Spatial 2D Grid
          </div>
          <FocusGroup
            id="nav-grid"
            role="grid"
            navigate={{ orientation: "both" }}
            className="grid grid-cols-3 bg-gray-50 p-2 rounded border border-gray-200 gap-2"
          >
            {Array.from({ length: 9 }, (_, i) => (
              <FocusItem
                key={i}
                id={`nav-cell-${i}`}
                role="gridcell"
                className="aspect-square flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 aria-[current=true]:bg-emerald-100 aria-[current=true]:text-emerald-700 aria-[current=true]:ring-1 ring-emerald-400 text-xs cursor-pointer"
              >
                {i}
              </FocusItem>
            ))}
          </FocusGroup>
        </div>

        {/* Seamless Cross-Zone */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase">
            Seamless Cross-Zone
          </div>
          <div className="flex gap-2">
            <FocusGroup
              id="nav-seamless-a"
              role="toolbar"
              navigate={{ orientation: "horizontal", seamless: true }}
              className="flex bg-gray-50 p-2 rounded border border-gray-200 gap-1"
            >
              {["A1", "A2"].map((item) => (
                <FocusItem
                  key={item}
                  id={`nav-sm-${item.toLowerCase()}`}
                  role="button"
                  className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-rose-100 aria-[current=true]:text-rose-700 text-sm border border-transparent aria-[current=true]:border-rose-300"
                >
                  {item}
                </FocusItem>
              ))}
            </FocusGroup>
            <FocusGroup
              id="nav-seamless-b"
              role="toolbar"
              navigate={{ orientation: "horizontal", seamless: true }}
              className="flex bg-gray-50 p-2 rounded border border-gray-200 gap-1"
            >
              {["B1", "B2"].map((item) => (
                <FocusItem
                  key={item}
                  id={`nav-sm-${item.toLowerCase()}`}
                  role="button"
                  className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-cyan-100 aria-[current=true]:text-cyan-700 text-sm border border-transparent aria-[current=true]:border-cyan-300"
                >
                  {item}
                </FocusItem>
              ))}
            </FocusGroup>
          </div>
          <div className="text-[10px] text-gray-500">
            Arrow Right from A2 → B1 (cross-zone)
          </div>
        </div>
      </div>
    </TestBox>
  );
}
