import { Icon } from "@/components/Icon";
import { useExpanded } from "@/os/5-hooks/useExpanded";
import { useSelection } from "@/os/5-hooks/useSelection";
import { FocusGroup } from "@/os/6-components/base/FocusGroup";
import { FocusItem } from "@/os/6-components/base/FocusItem";

function TreeContent() {
  const { isExpanded } = useExpanded();
  const selection = useSelection("apg-tree");
  const isSelected = (id: string) => selection.includes(id);

  return (
    <>
      <FocusItem
        id="node-1"
        role="treeitem"
        aria-level={1}
        aria-selected={isSelected("node-1")}
        className="
            flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer
            hover:bg-gray-50 aria-selected:bg-indigo-100 aria-selected:text-indigo-800
            data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:outline-none
          "
      >
        <Icon
          name={isExpanded("node-1") ? "chevron-down" : "chevron-right"}
          size={14}
          className="text-gray-400"
        />
        <Icon name="folder" size={16} className="text-amber-500" />
        <span>Documents</span>
      </FocusItem>

      {isExpanded("node-1") && (
        <>
          <FocusItem
            id="node-1-1"
            role="treeitem"
            aria-level={2}
            aria-selected={isSelected("node-1-1")}
            className="
                flex items-center gap-2 px-2 py-1.5 ml-5 rounded text-sm cursor-pointer
                hover:bg-gray-50 aria-selected:bg-indigo-100 aria-selected:text-indigo-800
                data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:outline-none
              "
          >
            <div className="w-3" /> {/* Spacer */}
            <Icon name="file-text" size={16} className="text-blue-500" />
            <span>Resume.pdf</span>
          </FocusItem>

          <FocusItem
            id="node-1-2"
            role="treeitem"
            aria-level={2}
            aria-selected={isSelected("node-1-2")}
            className="
                flex items-center gap-2 px-2 py-1.5 ml-5 rounded text-sm cursor-pointer
                hover:bg-gray-50 aria-selected:bg-indigo-100 aria-selected:text-indigo-800
                data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:outline-none
              "
          >
            <div className="w-3" />
            <Icon name="file-text" size={16} className="text-blue-500" />
            <span>CoverLetter.pdf</span>
          </FocusItem>
        </>
      )}

      <FocusItem
        id="node-2"
        role="treeitem"
        aria-level={1}
        aria-selected={isSelected("node-2")}
        className="
            flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer
            hover:bg-gray-50 aria-selected:bg-indigo-100 aria-selected:text-indigo-800
            data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:outline-none
          "
      >
        <Icon
          name={isExpanded("node-2") ? "chevron-down" : "chevron-right"}
          size={14}
          className="text-gray-400"
        />
        <Icon name="folder" size={16} className="text-amber-500" />
        <span>Pictures</span>
      </FocusItem>

      {isExpanded("node-2") && (
        <>
          <FocusItem
            id="node-2-1"
            role="treeitem"
            aria-level={2}
            aria-selected={isSelected("node-2-1")}
            className="
                flex items-center gap-2 px-2 py-1.5 ml-5 rounded text-sm cursor-pointer
                hover:bg-gray-50 aria-selected:bg-indigo-100 aria-selected:text-indigo-800
                data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:outline-none
              "
          >
            <div className="w-3" />
            <Icon name="file-image" size={16} className="text-emerald-500" />
            <span>Vacation.jpg</span>
          </FocusItem>
        </>
      )}
    </>
  );
}

export function TreePattern() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Multiselect Tree</h3>
      <p className="text-sm text-gray-500 mb-4">
        Supports: <kbd>Arrow</kbd> navigation, <kbd>Left</kbd>/<kbd>Right</kbd>{" "}
        to expand/collapse, <kbd>Space</kbd> to select, <kbd>Shift+Click</kbd>{" "}
        or <kbd>Shift+Arrow</kbd> for range selection.
      </p>

      <FocusGroup
        id="apg-tree"
        role="tree"
        navigate={{ orientation: "vertical" }}
        select={{ mode: "multiple", range: true }}
        aria-multiselectable="true"
        aria-label="Example Tree"
        getExpandableItems={() => new Set(["node-1", "node-2"])}
      >
        <TreeContent />
      </FocusGroup>
    </div>
  );
}
