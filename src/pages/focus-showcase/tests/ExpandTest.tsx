import { useFocusExpansion } from "@os/features/focus/hooks/useFocusExpansion";
import { FocusGroup } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { TestBox } from "../../shared/TestLayout";

export function ExpandTest() {
  const description = (
    <div className="space-y-2">
      <p>
        <strong>Expand/Collapse</strong> controls hierarchical item states
        (Tree, Accordion).
      </p>
      <ul className="list-disc list-inside space-y-1 text-gray-500">
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            ArrowRight
          </code>
          : Expand collapsed item
        </li>
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            ArrowLeft
          </code>
          : Collapse expanded item (or move to parent)
        </li>
        <li>
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            Enter/Space
          </code>
          : Toggle expansion
        </li>
        <li>
          State projected via{" "}
          <code className="text-gray-700 bg-gray-100 px-1 rounded">
            aria-expanded
          </code>
        </li>
      </ul>
    </div>
  );

  return (
    <TestBox title="Expand / Collapse" description={description}>
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-gray-500 uppercase">
          Tree Widget
        </div>
        <FocusGroup
          id="tree-widget"
          role="tree"
          navigate={{ orientation: "vertical" }}
          className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200"
        >
          <TreeItems />
        </FocusGroup>
        <div className="text-[10px] text-gray-500">
          Use Arrow keys to expand/collapse.
        </div>
      </div>
    </TestBox>
  );
}

function TreeItems() {
  const { isExpanded } = useFocusExpansion();

  // Tree data structure
  const treeData = [
    { id: "tree-parent-1", label: "Documents", children: ["doc-1", "doc-2"] },
    { id: "tree-parent-2", label: "Images", children: ["img-1"] },
    { id: "tree-leaf", label: "readme.txt", children: [] },
  ];

  return (
    <>
      {treeData.map((item) => (
        <div key={item.id} className="flex flex-col">
          <FocusItem
            id={item.id}
            role="treeitem"
            className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-sky-100 aria-[current=true]:text-sky-700 text-sm flex items-center gap-2 group"
          >
            {item.children.length > 0 ? (
              <span className="w-4 h-4 flex items-center justify-center text-gray-400 group-aria-[expanded=true]:rotate-90">
                ▶
              </span>
            ) : (
              <span className="w-4 h-4 flex items-center justify-center text-gray-300">
                •
              </span>
            )}
            <span>{item.label}</span>
          </FocusItem>
          {/* Children - shown when expanded */}
          {item.children.length > 0 && isExpanded(item.id) && (
            <div className="ml-6">
              {item.children.map((childId, childIdx) => (
                <FocusItem
                  key={childId}
                  id={`tree-child-${treeData.indexOf(item) + 1}-${childIdx + 1}`}
                  role="treeitem"
                  className="px-3 py-1 rounded hover:bg-gray-100 aria-[current=true]:bg-sky-50 aria-[current=true]:text-sky-600 text-xs flex items-center gap-2"
                >
                  <span className="text-gray-300">└</span>
                  <span>{childId}</span>
                </FocusItem>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
