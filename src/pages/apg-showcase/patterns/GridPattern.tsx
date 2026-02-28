import { useSelection } from "@/os/5-hooks/useSelection";
import { Zone } from "@/os/6-components/primitives/Zone";
import { Item } from "@/os/6-components/primitives/Item";

export function GridPattern() {
  const selection = useSelection("apg-grid");

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-2">2D Grid (Multi-Select)</h3>
      <p className="text-sm text-gray-500 mb-6">
        Navigate with <kbd>Arrow Keys</kbd>. Hold <kbd>Shift</kbd> to select
        ranges.
      </p>

      <Zone
        id="apg-grid"
        role="grid"
        options={{ navigate: { orientation: "both" }, select: { mode: "multiple", range: true } }}
        aria-multiselectable="true"
        aria-label="Interactive Data Grid"
        className="grid grid-cols-5 gap-0 border-l border-t border-gray-200"
      >
        {Array.from({ length: 25 }, (_, i) => {
          const row = Math.floor(i / 5) + 1;
          const col = (i % 5) + 1;
          const id = `cell-${i}`;
          const isSelected = selection.includes(id);

          return (
            <Item
              key={id}
              id={id}
              role="gridcell"
              aria-rowindex={row}
              aria-colindex={col}
              aria-selected={isSelected}
              className="
                h-16 flex items-center justify-center border-r border-b border-gray-200
                text-sm font-medium transition-colors cursor-cell
                hover:bg-gray-50 aria-selected:bg-indigo-600 aria-selected:text-white
                data-[focused=true]:ring-4 data-[focused=true]:ring-indigo-400 data-[focused=true]:ring-inset data-[focused=true]:z-10 relative
              "
            >
              {row},{col}
            </Item>
          );
        })}
      </Zone>
    </div>
  );
}
