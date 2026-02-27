import { Icon } from "@/components/Icon";
import { useExpanded } from "@/os/5-hooks/useExpanded";
import { Zone } from "@/os/6-components/primitives/Zone";
import { FocusItem } from "@/os/6-components/base/FocusItem";

export function CompositePattern() {
  const { isExpanded } = useExpanded();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Composite Widgets</h3>
      <p className="text-sm text-gray-500 mb-6">
        Nested widgets and interaction across zones (e.g., Toolbar triggering a
        Menu).
      </p>

      {/* A simple composite: Toolbar that owns a dropdown menu */}
      <div className="relative w-fit">
        <Zone
          id="apg-composite-toolbar"
          role="toolbar"
          options={{ navigate: { orientation: "horizontal" } }}
          className="flex border border-gray-300 rounded p-1 bg-gray-50"
        >
          <FocusItem
            id="comp-btn-1"
            role="button"
            className="px-3 py-1.5 rounded hover:bg-gray-200 data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 cursor-pointer"
          >
            Action
          </FocusItem>

          <FocusItem
            id="comp-btn-menu"
            role="button"
            aria-haspopup="menu"
            aria-expanded={isExpanded("comp-btn-menu")}
            className="px-3 py-1.5 rounded hover:bg-gray-200 data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 cursor-pointer flex items-center gap-1"
          >
            <span>Options</span>
            <Icon name="chevron-down" size={14} />
          </FocusItem>
        </Zone>

        {isExpanded("comp-btn-menu") && (
          <Zone
            id="apg-composite-menu"
            role="menu"
            options={{ navigate: { orientation: "vertical" }, dismiss: { escape: "close" } }}
            className="absolute top-full mt-1 left-0 w-48 bg-white border border-gray-200 rounded shadow-lg py-1 z-50"
          >
            <FocusItem
              id="comp-menu-1"
              role="menuitem"
              className="px-4 py-2 hover:bg-gray-100 data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none cursor-pointer"
            >
              Settings
            </FocusItem>
            <FocusItem
              id="comp-menu-2"
              role="menuitem"
              className="px-4 py-2 hover:bg-gray-100 data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none cursor-pointer"
            >
              Logout
            </FocusItem>
          </Zone>
        )}
      </div>
    </div>
  );
}
