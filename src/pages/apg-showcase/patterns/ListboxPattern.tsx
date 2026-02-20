import { useSelection } from "@/os/5-hooks/useSelection";
import { FocusGroup } from "@/os/6-components/base/FocusGroup";
import { FocusItem } from "@/os/6-components/base/FocusItem";

const OPTIONS = [
  "Apple",
  "Banana",
  "Cherry",
  "Date",
  "Elderberry",
  "Fig",
  "Grape",
  "Honeydew",
];

export function ListboxPattern() {
  const singleSelection = useSelection("apg-listbox-single");
  const multiSelection = useSelection("apg-listbox-multi");

  return (
    <div className="flex gap-8">
      {/* Single Select */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Single Select Listbox</h3>

        <FocusGroup
          id="apg-listbox-single"
          role="listbox"
          navigate={{ orientation: "vertical" }}
          select={{ mode: "single", followFocus: true }}
          aria-label="Choose a fruit"
          className="border border-gray-300 rounded overflow-hidden max-h-64 overflow-y-auto"
        >
          {OPTIONS.map((opt) => {
            const id = `s-opt-${opt}`;
            return (
              <FocusItem
                key={id}
                id={id}
                role="option"
                aria-selected={singleSelection.includes(id)}
                className="
                  px-4 py-2 cursor-pointer transition-colors
                  hover:bg-gray-100 aria-selected:bg-indigo-100 aria-selected:text-indigo-800 aria-selected:font-bold
                  data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:outline-none data-[focused=true]:ring-inset relative z-10
                "
              >
                {opt}
              </FocusItem>
            );
          })}
        </FocusGroup>
      </div>

      {/* Multi Select */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Multi Select Listbox</h3>

        <FocusGroup
          id="apg-listbox-multi"
          role="listbox"
          navigate={{ orientation: "vertical" }}
          select={{ mode: "multiple", range: true }}
          aria-multiselectable="true"
          aria-label="Choose multiple fruits"
          className="border border-gray-300 rounded overflow-hidden max-h-64 overflow-y-auto"
        >
          {OPTIONS.map((opt) => {
            const id = `m-opt-${opt}`;
            const selected = multiSelection.includes(id);
            return (
              <FocusItem
                key={id}
                id={id}
                role="option"
                aria-selected={selected}
                className="
                  px-4 py-2 cursor-pointer transition-colors flex items-center justify-between
                  hover:bg-gray-100 aria-selected:bg-indigo-600 aria-selected:text-white
                  data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:outline-none data-[focused=true]:ring-inset relative z-10
                "
              >
                <span>{opt}</span>
                {selected && <span>✓</span>}
              </FocusItem>
            );
          })}
        </FocusGroup>
      </div>
    </div>
  );
}
