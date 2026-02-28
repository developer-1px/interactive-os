import { useState } from "react";
import { Zone } from "@/os/6-components/primitives/Zone";
import { Item } from "@/os/6-components/primitives/Item";

export function MenuPattern() {
  const [checks, setChecks] = useState<Record<string, boolean>>({
    ruler: true,
  });
  const [radioValue, setRadioValue] = useState<string>("left");

  const toggleCheck = (id: string) => {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col items-center">
      <h3 className="text-lg font-semibold mb-2 w-full text-center">
        Menubar & Menu
      </h3>
      <p className="text-sm text-gray-500 mb-6 w-full text-center">
        Try <kbd>Space</kbd> or <kbd>Enter</kbd> to toggle checkboxes and
        radios.
      </p>

      {/* Menubar */}
      <Zone
        id="apg-menubar"
        role="menubar"
        options={{ navigate: { orientation: "horizontal", loop: true } }}
        className="flex bg-gray-100 rounded-t-md border border-gray-200 border-b-0 w-64 p-1"
      >
        {["File", "Edit", "View"].map((item) => (
          <Item
            key={item}
            id={`mb-${item.toLowerCase()}`}
            role="menuitem"
            className="
              px-3 py-1 text-sm rounded cursor-pointer
              hover:bg-gray-200 data-[focused=true]:bg-indigo-600 data-[focused=true]:text-white data-[focused=true]:outline-none
            "
          >
            {item}
          </Item>
        ))}
      </Zone>

      {/* Dropdown Menu (simulated as always open for preview) */}
      <Zone
        id="apg-menu"
        role="menu"
        options={{ navigate: { orientation: "vertical", loop: true } }}
        onCheck={(c) => {
          if (c.focusId?.startsWith("check-"))
            toggleCheck(c.focusId.replace("check-", ""));
          if (c.focusId?.startsWith("radio-"))
            setRadioValue(c.focusId.replace("radio-", ""));
          return [];
        }}
        onAction={(c) => {
          if (c.focusId?.startsWith("check-"))
            toggleCheck(c.focusId.replace("check-", ""));
          if (c.focusId?.startsWith("radio-"))
            setRadioValue(c.focusId.replace("radio-", ""));
          return [];
        }}
        className="w-64 bg-white border border-gray-200 rounded-b-md shadow-md py-1"
      >
        <Item
          id="cmd-new"
          role="menuitem"
          className="px-4 py-1.5 text-sm hover:bg-gray-50 data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none"
        >
          New Window
        </Item>
        <Item
          id="cmd-open"
          role="menuitem"
          className="px-4 py-1.5 text-sm hover:bg-gray-50 data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none"
        >
          Open File...
        </Item>

        <div role="separator" className="my-1 border-t border-gray-100" />

        <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
          Show
        </div>
        <Item
          id="check-ruler"
          role="menuitemcheckbox"
          aria-checked={!!checks["ruler"]}
          className="
            group px-4 py-1.5 text-sm flex items-center justify-between cursor-pointer
            hover:bg-gray-50 data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none
          "
        >
          <span>Ruler</span>
          <span className="text-indigo-600 opacity-0 group-aria-checked:opacity-100">
            ✓
          </span>
        </Item>
        <Item
          id="check-grid"
          role="menuitemcheckbox"
          aria-checked={!!checks["grid"]}
          className="
            group px-4 py-1.5 text-sm flex items-center justify-between cursor-pointer
            hover:bg-gray-50 data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none
          "
        >
          <span>GridLines</span>
          <span className="text-indigo-600 opacity-0 group-aria-checked:opacity-100">
            ✓
          </span>
        </Item>

        <div role="separator" className="my-1 border-t border-gray-100" />

        <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
          Alignment
        </div>
        {["Left", "Center", "Right"].map((align) => {
          const val = align.toLowerCase();
          return (
            <Item
              key={val}
              id={`radio-${val}`}
              role="menuitemradio"
              aria-checked={radioValue === val}
              className="
                group px-4 py-1.5 text-sm flex items-center gap-2 cursor-pointer
                hover:bg-gray-50 data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none
              "
            >
              <div className="w-3 h-3 rounded-full border border-gray-300 flex items-center justify-center group-aria-checked:border-indigo-600">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 opacity-0 group-aria-checked:opacity-100" />
              </div>
              <span>{align}</span>
            </Item>
          );
        })}
      </Zone>
    </div>
  );
}
