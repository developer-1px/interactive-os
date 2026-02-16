/**
 * ARIA Standard Showcase
 * Demonstrates standard ARIA patterns using FocusGroup facade.
 */

import { usePlaywrightSpecs } from "@inspector/testbot/playwright/loader";
import { FocusGroup } from "@os/6-components/base/FocusGroup.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import { kernel } from "@os/kernel.ts";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/lib/Icon";
import { useFocusExpansion } from "@/os/5-hooks/useFocusExpansion";

// @ts-expect-error — spec-wrapper plugin transforms at build time
import runComplexPatterns from "./tests/e2e/complex-patterns.spec.ts";
// @ts-expect-error
import runDisclosure from "./tests/e2e/disclosure.spec.ts";
// @ts-expect-error
import runGrid from "./tests/e2e/grid.spec.ts";
// @ts-expect-error
import runListbox from "./tests/e2e/listbox.spec.ts";
// @ts-expect-error
import runMenu from "./tests/e2e/menu.spec.ts";
// @ts-expect-error
import runRadiogroup from "./tests/e2e/radiogroup.spec.ts";
// @ts-expect-error
import runTabs from "./tests/e2e/tabs.spec.ts";
// @ts-expect-error
import runToolbar from "./tests/e2e/toolbar.spec.ts";
// @ts-expect-error
import runTree from "./tests/e2e/tree.spec.ts";

const ARIA_SPECS = [
  runTabs,
  runMenu,
  runDisclosure,
  runGrid,
  runListbox,
  runRadiogroup,
  runToolbar,
  runTree,
  runComplexPatterns,
];

export function AriaShowcasePage() {
  usePlaywrightSpecs("aria-showcase", ARIA_SPECS);

  return <AriaShowcaseContent />;
}

function AriaShowcaseContent() {
  // State management for interactive examples
  const [selectedTab, setSelectedTab] = useState("tab-account");
  // menuChecked removed — menu checkboxes now use kernel selection
  const [pressedTools, setPressedTools] = useState<Record<string, boolean>>({
    bold: true,
  });
  // expandedTreeNodes removed - now using store-driven expansion
  const [isComboOpen, setIsComboOpen] = useState(false);
  const [isComboInvalid, setIsComboInvalid] = useState(false);
  const [radioValue, setRadioValue] = useState("all");
  const [gridSelection, setGridSelection] = useState<Record<string, boolean>>(
    {},
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  const toggleTool = (id: string) => {
    setPressedTools((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // toggleTreeNode removed - now using store-driven expansion

  const toggleGridCell = (id: string) => {
    setGridSelection((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          ARIA Standard Showcase
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Standard ARIA widget patterns implemented with FocusGroup. now with
          interactive states.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0 auto-rows-[auto_1fr]">
        {/* 1. Tabs */}
        {/* 
                    ARIA States: 
                    - aria-selected: Visual indication of active tab
                    - aria-disabled: Visual indication of disabled tab
                */}
        <AriaCard title="Tabs" ariaRole="tablist">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <FocusGroup
              id="demo-tablist"
              role="tablist"
              navigate={{ orientation: "horizontal", loop: true }}
              aria-label="Account settings"
              className="flex bg-gray-100 border-b border-gray-200"
            >
              <FocusItem
                id="tab-account"
                role="tab"
                as="button"
                aria-controls="panel-account"
                onClick={() => setSelectedTab("tab-account")}
                className="
                                    px-4 py-2 text-sm font-medium border-b-2 
                                    aria-selected:border-indigo-500 aria-selected:bg-white aria-selected:text-indigo-600
                                    aria-[selected=false]:border-transparent aria-[selected=false]:text-gray-500 aria-[selected=false]:hover:text-gray-700
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:ring-inset
                                "
              >
                Account
              </FocusItem>
              <FocusItem
                id="tab-security"
                role="tab"
                as="button"
                aria-controls="panel-security"
                onClick={() => setSelectedTab("tab-security")}
                className="
                                    px-4 py-2 text-sm font-medium border-b-2 
                                    aria-selected:border-indigo-500 aria-selected:bg-white aria-selected:text-indigo-600
                                    aria-[selected=false]:border-transparent aria-[selected=false]:text-gray-500 aria-[selected=false]:hover:text-gray-700
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:ring-inset
                                "
              >
                Security
              </FocusItem>
              <FocusItem
                id="tab-disabled"
                role="tab"
                aria-disabled="true"
                disabled
                className="
                                    px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-300 cursor-not-allowed
                                    aria-disabled:opacity-50
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-gray-200 data-[focused=true]:ring-inset
                                "
              >
                Disabled
              </FocusItem>
            </FocusGroup>
            <div
              id="panel-account"
              role="tabpanel"
              aria-labelledby="tab-account"
              className="p-4 text-sm text-gray-600 h-24"
            >
              {selectedTab === "tab-account"
                ? "Account settings panel..."
                : selectedTab === "tab-security"
                  ? "Security settings panel..."
                  : "Content hidden"}
            </div>
          </div>
        </AriaCard>

        {/* 2. Menu */}
        {/* 
                    ARIA States:
                    - aria-checked: Checkbox menu items
                    - aria-disabled: Disabled menu items
                */}
        <AriaCard title="Menu" ariaRole="menu">
          <FocusGroup
            id="demo-menu"
            role="menu"
            navigate={{ orientation: "vertical", loop: true }}
            select={{ mode: "multiple", toggle: true }}
            tab={{ behavior: "trap" }}
            aria-label="File actions"
            className="w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
          >
            <FocusItem
              id="menu-new"
              role="menuitem"
              className="px-4 py-2 text-sm hover:bg-gray-100 data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none"
            >
              New File
            </FocusItem>
            <FocusItem
              id="menu-open"
              role="menuitem"
              className="px-4 py-2 text-sm hover:bg-gray-100 data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none"
            >
              Open...
            </FocusItem>

            <div role="separator" className="my-1 border-t border-gray-200" />

            <FocusItem
              id="menu-ruler"
              role="menuitemcheckbox"
              as="button"
              className="
                                group w-full px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-100 
                                data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none
                                cursor-pointer
                            "
            >
              <span>Show Ruler</span>
              <span className="text-indigo-600 opacity-0 group-data-[selected=true]:opacity-100 transition-opacity">
                ✓
              </span>
            </FocusItem>
            <FocusItem
              id="menu-grid"
              role="menuitemcheckbox"
              as="button"
              className="
                                group w-full px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-100 
                                data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none
                                cursor-pointer
                            "
            >
              <span>Show Grid</span>
              <span className="text-indigo-600 opacity-0 group-data-[selected=true]:opacity-100 transition-opacity">
                ✓
              </span>
            </FocusItem>

            <div role="separator" className="my-1 border-t border-gray-200" />

            <FocusItem
              id="menu-disabled"
              role="menuitem"
              disabled
              aria-disabled="true"
              className="px-4 py-2 text-sm text-gray-300 aria-disabled:cursor-not-allowed data-[focused=true]:bg-gray-50 data-[focused=true]:outline-none"
            >
              Unavailable
            </FocusItem>
          </FocusGroup>
        </AriaCard>

        {/* 3. Listbox */}
        {/* 
                    ARIA States:
                    - aria-selected: Handled natively by focus in single select usually, but can also be distinct.
                    Here we use focus as selection for simple lists, but let's add multi-select visual later if needed.
                */}
        <AriaCard title="Listbox" ariaRole="listbox">
          <FocusGroup
            id="demo-listbox"
            role="listbox"
            navigate={{ orientation: "vertical" }}
            select={{ mode: "single", followFocus: true }}
            aria-label="Select a user"
            className="w-full bg-white border border-gray-200 rounded-lg shadow-sm max-h-48 overflow-y-auto"
          >
            {[
              "Wade Cooper",
              "Arlene Mccoy",
              "Devon Webb",
              "Tom Cook",
              "Tanya Fox",
            ].map((name, i) => (
              <FocusItem
                key={name}
                id={`user-${i}`}
                role="option"
                className="
                                    px-4 py-2.5 text-sm 
                                    hover:bg-gray-50 
                                    aria-[selected=true]:bg-indigo-50 aria-[selected=true]:text-indigo-700
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:ring-inset data-[focused=true]:z-10
                                "
              >
                {name}
              </FocusItem>
            ))}
          </FocusGroup>
        </AriaCard>

        {/* 4. Radiogroup */}
        <AriaCard title="Radio Group" ariaRole="radiogroup">
          <FocusGroup
            id="demo-radiogroup"
            role="radiogroup"
            navigate={{ orientation: "vertical" }}
            select={{ mode: "single", followFocus: true, disallowEmpty: true }}
            aria-labelledby="radio-label"
            className="space-y-2"
          >
            <div
              id="radio-label"
              className="text-xs font-semibold text-gray-500 mb-2"
            >
              Notification Preference
            </div>
            {[
              { id: "all", label: "All notifications" },
              { id: "mentions", label: "Mentions only" },
              { id: "none", label: "None" },
            ].map((opt) => (
              <FocusItem
                key={opt.id}
                id={`radio-${opt.id}`}
                role="radio"
                aria-checked={radioValue === opt.id}
                onFocus={() => setRadioValue(opt.id)}
                className="
                                    group flex items-center gap-3 p-2 rounded-lg 
                                    hover:bg-gray-50 
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300
                                    aria-checked:bg-indigo-50
                                "
              >
                <div
                  className="
                                    w-4 h-4 rounded-full border-2 flex items-center justify-center 
                                    border-gray-300 group-aria-checked:border-indigo-500
                                "
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-500 opacity-0 group-aria-checked:opacity-100" />
                </div>
                <span className="text-sm group-aria-checked:font-medium group-aria-checked:text-indigo-700">
                  {opt.label}
                </span>
              </FocusItem>
            ))}
          </FocusGroup>
        </AriaCard>

        {/* 5. Toolbar */}
        {/* 
                    ARIA States:
                    - aria-pressed: Toggle button state
                */}
        <AriaCard title="Toolbar" ariaRole="toolbar">
          <FocusGroup
            id="demo-toolbar"
            role="toolbar"
            navigate={{ orientation: "horizontal", loop: true }}
            aria-label="Text formatting"
            className="flex gap-1 p-2 bg-gray-100 rounded-lg border border-gray-200"
          >
            {[
              { id: "bold", label: "B", title: "Bold, togglable" },
              { id: "italic", label: "I", title: "Italic, togglable" },
              { id: "underline", label: "U", title: "Underline, togglable" },
              { id: "strike", label: "S", title: "Strikethrough, togglable" },
            ].map((btn) => (
              <FocusItem
                key={btn.id}
                id={`tool-${btn.id}`}
                role="button"
                as="button"
                aria-label={btn.title}
                aria-pressed={!!pressedTools[btn.id]}
                onClick={() => toggleTool(btn.id)}
                className="
                                    w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-all
                                    text-gray-600 hover:bg-gray-200 
                                    aria-pressed:bg-indigo-600 aria-pressed:text-white aria-pressed:shadow-inner
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:ring-offset-1
                                "
              >
                {btn.label}
              </FocusItem>
            ))}
            <div className="w-px bg-gray-300 mx-1" />
            <FocusItem
              id="tool-disabled"
              role="button"
              aria-disabled="true"
              className="
                                w-8 h-8 flex items-center justify-center rounded text-sm text-gray-400 cursor-not-allowed
                                aria-disabled:opacity-50
                                data-[focused=true]:ring-2 data-[focused=true]:ring-gray-300
                            "
            >
              D
            </FocusItem>
          </FocusGroup>
        </AriaCard>

        {/* 6. Grid */}
        {/* 
                    ARIA States:
                    - aria-selected: Cell selection
                */}
        <AriaCard title="Grid" ariaRole="grid">
          <FocusGroup
            id="demo-grid"
            role="grid"
            navigate={{ orientation: "both" }}
            select={{ mode: "multiple", range: true }}
            aria-label="Calendar"
            className="grid grid-cols-4 gap-1 p-2 bg-gray-100 rounded-lg border border-gray-200"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <FocusItem
                key={i}
                id={`cell-${i}`}
                role="gridcell"
                aria-colindex={(i % 4) + 1}
                aria-rowindex={Math.floor(i / 4) + 1}
                aria-selected={!!gridSelection[`cell-${i}`]}
                onClick={() => toggleGridCell(`cell-${i}`)}
                className="
                                    aspect-square flex items-center justify-center rounded text-xs transition-colors
                                    bg-white hover:bg-gray-50 
                                    aria-selected:bg-indigo-600 aria-selected:text-white
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:ring-inset data-[focused=true]:z-10
                                "
              >
                {i + 1}
              </FocusItem>
            ))}
          </FocusGroup>
        </AriaCard>

        {/* 7. Tree */}
        {/* 
                    ARIA States:
                    - aria-expanded: Expand/collapse nodes (store-driven)
                */}
        <AriaCard title="Tree (Store-Driven)" ariaRole="tree">
          <FocusGroup
            id="demo-tree"
            role="tree"
            navigate={{ orientation: "vertical" }}
            aria-label="File explorer"
            className="w-full bg-white border border-gray-200 rounded-lg p-2"
          >
            <TreeContent />
          </FocusGroup>
        </AriaCard>

        {/* 8. Menubar */}
        <AriaCard title="Menubar" ariaRole="menubar">
          <FocusGroup
            id="demo-menubar"
            role="menubar"
            navigate={{ orientation: "horizontal" }}
            aria-label="Application menu"
            className="flex bg-gray-800 text-white rounded-lg overflow-hidden"
          >
            {["File", "Edit", "View", "Help"].map((item) => (
              <FocusItem
                key={item}
                id={`menubar-${item.toLowerCase()}`}
                role="menuitem"
                aria-haspopup="menu"
                className="
                                    px-4 py-2 text-sm 
                                    hover:bg-gray-700 
                                    data-[focused=true]:bg-indigo-600 data-[focused=true]:font-bold
                                "
              >
                {item}
              </FocusItem>
            ))}
          </FocusGroup>
        </AriaCard>

        {/* 9. Combobox */}
        {/* 
                    ARIA States:
                    - aria-expanded: Controls visibility of listbox
                    - aria-invalid: Error state
                */}
        <AriaCard title="Combobox" ariaRole="combobox">
          <div className="relative">
            <FocusGroup
              id="combo-wrapper"
              navigate={{ orientation: "vertical" }}
              className="w-full"
            >
              <FocusItem
                id="combo-trigger"
                role="combobox"
                aria-expanded={isComboOpen}
                aria-invalid={isComboInvalid}
                aria-controls="combo-listbox"
                aria-autocomplete="list"
                onClick={() => setIsComboOpen(!isComboOpen)}
                className={`
                                  w-full px-3 py-2.5 border rounded-lg text-sm bg-white cursor-pointer
                                  flex items-center gap-2 transition-all
                                  ${isComboInvalid
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-gray-200 hover:border-gray-300"
                  }
                                  data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-200 data-[focused=true]:border-indigo-400
                                  aria-[invalid=true]:data-[focused=true]:ring-red-200 aria-[invalid=true]:data-[focused=true]:border-red-400
                              `}
              >
                <Icon
                  name="search"
                  size={16}
                  className={isComboInvalid ? "text-red-400" : "text-gray-400"}
                />
                <span className="flex-1 text-left">
                  {isComboInvalid ? "Invalid selection" : "Select a fruit..."}
                </span>
                <Icon
                  name={isComboOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  className={isComboInvalid ? "text-red-400" : "text-gray-400"}
                />
              </FocusItem>
            </FocusGroup>

            <div className="flex items-center gap-2 mt-3">
              <label className="text-xs text-gray-500 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isComboInvalid}
                  onChange={(e) => setIsComboInvalid(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5"
                />
                <Icon name="alert-circle" size={12} className="text-gray-400" />
                Toggle Invalid
              </label>
            </div>

            {isComboOpen && (
              <FocusGroup
                id="combo-listbox"
                role="listbox"
                navigate={{ orientation: "vertical" }}
                aria-label="Suggestions"
                className="absolute z-50 top-12 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-44 overflow-y-auto py-1"
              >
                {[
                  { name: "Apple", icon: "🍎" },
                  { name: "Banana", icon: "🍌" },
                  { name: "Cherry", icon: "🍒" },
                  { name: "Date", icon: "🌴" },
                ].map((fruit, i) => (
                  <FocusItem
                    key={fruit.name}
                    id={`combo-opt-${i}`}
                    role="option"
                    className="
                                            px-3 py-2 text-sm flex items-center gap-2
                                            hover:bg-gray-50 cursor-pointer
                                            data-[focused=true]:bg-indigo-50 data-[focused=true]:text-indigo-700
                                        "
                  >
                    <span className="text-base">{fruit.icon}</span>
                    <span>{fruit.name}</span>
                  </FocusItem>
                ))}
              </FocusGroup>
            )}
          </div>
        </AriaCard>

        {/* 10. Accordion */}
        <AriaCard title="Accordion" ariaRole="accordion">
          <FocusGroup
            id="demo-accordion"
            navigate={{ orientation: "vertical" }}
            aria-label="FAQ"
            className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <AccordionContent />
          </FocusGroup>
        </AriaCard>

        {/* 11. Dialog */}
        <AriaCard title="Dialog" ariaRole="dialog">
          <DialogDemo
            isOpen={isDialogOpen}
            onOpen={() => setIsDialogOpen(true)}
            onClose={() => setIsDialogOpen(false)}
          />
        </AriaCard>

        {/* 12. Alert Dialog */}
        <AriaCard title="Alert Dialog" ariaRole="alertdialog">
          <AlertDialogDemo
            isOpen={isAlertDialogOpen}
            onOpen={() => setIsAlertDialogOpen(true)}
            onClose={() => setIsAlertDialogOpen(false)}
          />
        </AriaCard>

        {/* 13. Disclosure */}
        <AriaCard title="Disclosure" ariaRole="disclosure">
          <DisclosureContent />
        </AriaCard>

        {/* 14. Feed */}
        <AriaCard title="Feed" ariaRole="feed">
          <FocusGroup
            id="demo-feed"
            role="feed"
            navigate={{ orientation: "vertical" }}
            aria-label="Recent updates"
            className="space-y-2"
          >
            {[
              {
                id: "feed-1",
                author: "Alice",
                time: "2m ago",
                text: "Shipped the new focus pipeline! 🚀",
              },
              {
                id: "feed-2",
                author: "Bob",
                time: "15m ago",
                text: "Fixed the grid navigation edge case.",
              },
              {
                id: "feed-3",
                author: "Carol",
                time: "1h ago",
                text: "Added ARIA role presets for all composite widgets.",
              },
            ].map((post) => (
              <FocusItem
                key={post.id}
                id={post.id}
                role="article"
                aria-label={`Post by ${post.author}`}
                className="
                  p-3 rounded-lg border border-gray-200 bg-white
                  hover:border-gray-300 transition-colors
                  data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:border-indigo-300
                "
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {post.author[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {post.author}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {post.time}
                  </span>
                </div>
                <p className="text-sm text-gray-600 pl-8">{post.text}</p>
              </FocusItem>
            ))}
          </FocusGroup>
        </AriaCard>
      </div>
    </div>
  );
}

function AriaCard({
  title,
  ariaRole,
  children,
}: {
  title: string;
  ariaRole: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm grid grid-rows-subgrid row-span-2 mb-6">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between rounded-t-xl">
        <h3 className="font-bold text-sm text-gray-700">{title}</h3>
        <code className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
          role="{ariaRole}"
        </code>
      </div>
      <div className="p-4 rounded-b-xl">{children}</div>
    </div>
  );
}

function TreeContent() {
  const { isExpanded } = useFocusExpansion();

  return (
    <>
      <FocusItem
        id="tree-src"
        role="treeitem"
        aria-level={1}
        className="
                    group px-2 py-1 text-sm rounded flex items-center gap-2 cursor-pointer
                    hover:bg-gray-50
                    data-[focused=true]:bg-indigo-50 data-[focused=true]:ring-1 data-[focused=true]:ring-indigo-300
                "
      >
        <Icon
          name={isExpanded("tree-src") ? "chevron-down" : "chevron-right"}
          size={12}
          className="text-gray-400 flex-shrink-0"
        />
        <Icon
          name={isExpanded("tree-src") ? "folder-open" : "folder"}
          size={16}
          className="text-amber-500 flex-shrink-0"
        />
        <span>src</span>
      </FocusItem>

      {isExpanded("tree-src") && (
        <>
          <FocusItem
            id="tree-components"
            role="treeitem"
            aria-level={2}
            className="ml-5 px-2 py-1 text-sm hover:bg-gray-50 data-[focused=true]:bg-indigo-50 rounded flex items-center gap-2"
          >
            <span className="w-3 flex-shrink-0" />
            {/* chevron placeholder */}
            <Icon
              name="folder"
              size={16}
              className="text-amber-500 flex-shrink-0"
            />
            <span>components</span>
          </FocusItem>
          <FocusItem
            id="tree-app"
            role="treeitem"
            aria-level={2}
            className="ml-5 px-2 py-1 text-sm hover:bg-gray-50 data-[focused=true]:bg-indigo-50 rounded flex items-center gap-2"
          >
            <span className="w-3 flex-shrink-0" />
            {/* chevron placeholder */}
            <Icon
              name="file-code"
              size={16}
              className="text-blue-500 flex-shrink-0"
            />
            <span>App.tsx</span>
          </FocusItem>
          <FocusItem
            id="tree-index"
            role="treeitem"
            aria-level={2}
            className="ml-5 px-2 py-1 text-sm hover:bg-gray-50 data-[focused=true]:bg-indigo-50 rounded flex items-center gap-2"
          >
            <span className="w-3 flex-shrink-0" />
            {/* chevron placeholder */}
            <Icon
              name="file-code"
              size={16}
              className="text-blue-500 flex-shrink-0"
            />
            <span>index.tsx</span>
          </FocusItem>
        </>
      )}

      <FocusItem
        id="tree-public"
        role="treeitem"
        aria-level={1}
        className="
                    group px-2 py-1 text-sm rounded flex items-center gap-2 cursor-pointer
                    hover:bg-gray-50
                    data-[focused=true]:bg-indigo-50 data-[focused=true]:ring-1 data-[focused=true]:ring-indigo-300
                "
      >
        <Icon
          name={isExpanded("tree-public") ? "chevron-down" : "chevron-right"}
          size={12}
          className="text-gray-400 flex-shrink-0"
        />
        <Icon
          name={isExpanded("tree-public") ? "folder-open" : "folder"}
          size={16}
          className="text-amber-500 flex-shrink-0"
        />
        <span>public</span>
      </FocusItem>

      {isExpanded("tree-public") && (
        <FocusItem
          id="tree-favicon"
          role="treeitem"
          aria-level={2}
          className="ml-5 px-2 py-1 text-sm hover:bg-gray-50 data-[focused=true]:bg-indigo-50 rounded flex items-center gap-2"
        >
          <span className="w-3 flex-shrink-0" />
          {/* chevron placeholder */}
          <Icon
            name="file-image"
            size={16}
            className="text-green-500 flex-shrink-0"
          />
          <span>favicon.ico</span>
        </FocusItem>
      )}
    </>
  );
}

function AccordionContent() {
  const { isExpanded } = useFocusExpansion();

  const items = [
    {
      id: "acc-1-trigger",
      icon: "help" as const,
      iconColor: "text-indigo-500",
      question: "What is FocusGroup?",
      answer:
        "FocusGroup is a headless primitive for managing focus navigation, selection, and accessibility.",
    },
    {
      id: "acc-2-trigger",
      icon: "layers" as const,
      iconColor: "text-emerald-500",
      question: "How does it handle state?",
      answer:
        "It uses Zustand stores scoped to each group to manage focus, selection, and now expansion states.",
    },
    {
      id: "acc-3-trigger",
      icon: "zap" as const,
      iconColor: "text-amber-500",
      question: "Is it performant?",
      answer:
        "Yes! It uses fine-grained subscriptions and minimal re-renders through Zustand selectors.",
    },
  ];

  return (
    <div className="divide-y divide-gray-100">
      {items.map((item) => (
        <div key={item.id}>
          <FocusItem
            id={item.id}
            as="button"
            role="button"
            aria-expanded={isExpanded(item.id)}
            aria-controls={`${item.id}-panel`}
            className="
                            w-full px-4 py-3.5 flex items-center gap-3 text-left text-sm
                            hover:bg-gray-50 transition-colors
                            data-[focused=true]:bg-indigo-50 data-[focused=true]:ring-inset data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300
                        "
          >
            <div className={`p-1.5 rounded-lg bg-gray-100 ${item.iconColor}`}>
              <Icon name={item.icon} size={16} />
            </div>
            <span className="flex-1 font-medium text-gray-700">
              {item.question}
            </span>
            <Icon
              name={isExpanded(item.id) ? "chevron-up" : "chevron-down"}
              size={16}
              className="text-gray-400 flex-shrink-0"
            />
          </FocusItem>
          {isExpanded(item.id) && (
            <div
              id={`${item.id}-panel`}
              className="px-4 py-3 pl-14 text-sm text-gray-600 bg-gray-50/50 border-l-2 border-indigo-200 ml-4"
            >
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DisclosureContent() {
  const isOpen = kernel.useComputed(
    (state) =>
      state.os.focus.zones["demo-disclosure"]?.expandedItems?.includes(
        "disclosure-trigger",
      ) ?? false,
  );

  return (
    <div className="w-full">
      <FocusGroup
        id="demo-disclosure"
        role="disclosure"
        aria-label="Disclosure"
      >
        <FocusItem
          id="disclosure-trigger"
          as="button"
          role="button"
          aria-expanded={isOpen}
          aria-controls="disclosure-panel"
          className="
            w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700
            bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors
            data-[focused=true]:outline-none data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300
          "
        >
          <div className="flex items-center gap-2">
            <Icon name="info" size={16} className="text-indigo-500" />
            <span>Show additional details</span>
          </div>
          <Icon
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={16}
            className="text-gray-400"
          />
        </FocusItem>
      </FocusGroup>
      {isOpen && (
        <div
          id="disclosure-panel"
          className="mt-2 px-4 py-3 text-sm text-gray-600 bg-indigo-50 rounded-lg border border-indigo-100"
        >
          <p>
            The <strong>disclosure</strong> pattern is the simplest
            expand/collapse: a single trigger toggles visibility of a single
            panel. Unlike accordion, disclosures are independent — multiple can
            be open simultaneously.
          </p>
        </div>
      )}
    </div>
  );
}

function DialogDemo({
  isOpen,
  onOpen,
  onClose,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const handleClose = useCallback(() => {
    onClose();
    // Defer focus restore to after dialog unmount + STACK_POP cleanup.
    // setTimeout(0) runs after React's synchronous useLayoutEffect cleanup
    // but is more reliable than double-rAF which can race with effects.
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  }, [onClose]);

  // Observe kernel dismiss: when dialog zone becomes inactive after being open,
  // close the dialog and restore focus to trigger.
  const dialogActive = kernel.useComputed(
    (state) => state.os.focus.activeZoneId === "demo-dialog",
  );
  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (dialogActive) {
      wasActiveRef.current = true;
    } else if (wasActiveRef.current && isOpen) {
      wasActiveRef.current = false;
      handleClose();
    }
  }, [dialogActive, isOpen, handleClose]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        id="btn-dialog-trigger"
        onClick={onOpen}
        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Open Dialog
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <FocusGroup
            id="demo-dialog"
            role="dialog"
            aria-label="Example dialog"
            aria-modal="true"
            className="bg-white rounded-xl shadow-2xl w-80 p-0 overflow-hidden border border-gray-200"
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Dialog Title</h3>
              <p className="text-xs text-gray-500 mt-1">
                Focus is trapped inside. Press Escape to close.
              </p>
            </div>
            <div className="p-5 space-y-2">
              <FocusItem
                id="dialog-btn-1"
                as="button"
                className="w-full px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400"
              >
                Focusable Item 1
              </FocusItem>
              <FocusItem
                id="dialog-btn-2"
                as="button"
                className="w-full px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400"
              >
                Focusable Item 2
              </FocusItem>
              <FocusItem
                id="dialog-btn-close"
                as="button"
                onClick={handleClose}
                className="w-full px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:ring-offset-1"
              >
                Close Dialog
              </FocusItem>
            </div>
          </FocusGroup>
        </div>
      )}
    </>
  );
}

function AlertDialogDemo({
  isOpen,
  onOpen,
  onClose,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const handleClose = useCallback(() => {
    onClose();
    // Defer focus restore to after dialog unmount + STACK_POP cleanup.
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  }, [onClose]);

  // Observe kernel dismiss: when alertdialog zone becomes inactive after being open,
  // close the dialog and restore focus to trigger.
  const alertActive = kernel.useComputed(
    (state) => state.os.focus.activeZoneId === "demo-alertdialog",
  );
  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (alertActive) {
      wasActiveRef.current = true;
    } else if (wasActiveRef.current && isOpen) {
      wasActiveRef.current = false;
      handleClose();
    }
  }, [alertActive, isOpen, handleClose]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        id="btn-alert-trigger"
        onClick={onOpen}
        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
      >
        Delete Item
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <FocusGroup
            id="demo-alertdialog"
            role="alertdialog"
            aria-label="Confirm deletion"
            aria-modal="true"
            aria-describedby="alert-desc"
            className="bg-white rounded-xl shadow-2xl w-80 overflow-hidden border border-red-200"
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Icon
                    name="alert-triangle"
                    size={20}
                    className="text-red-600"
                  />
                </div>
                <h3 className="font-bold text-gray-800">Delete permanently?</h3>
              </div>
              <p id="alert-desc" className="text-sm text-gray-500 mb-4">
                This action cannot be undone. The item will be permanently
                removed.
              </p>
              <div className="flex gap-2">
                <FocusItem
                  id="alert-cancel"
                  as="button"
                  onClick={handleClose}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 data-[focused=true]:ring-2 data-[focused=true]:ring-gray-400"
                >
                  Cancel
                </FocusItem>
                <FocusItem
                  id="alert-confirm"
                  as="button"
                  onClick={handleClose}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 data-[focused=true]:ring-2 data-[focused=true]:ring-red-300 data-[focused=true]:ring-offset-1"
                >
                  Delete
                </FocusItem>
              </div>
            </div>
          </FocusGroup>
        </div>
      )}
    </>
  );
}

export default AriaShowcasePage;
