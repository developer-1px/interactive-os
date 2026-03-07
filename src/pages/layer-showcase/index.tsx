import { Item, Zone } from "@os-react/internal";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { Icon } from "@/components/Icon";
import { DialogPattern } from "./patterns/DialogPattern";
import { AlertDialogPattern } from "./patterns/AlertDialogPattern";
import { MenuPattern } from "./patterns/MenuPattern";
import { PopoverPattern } from "./patterns/PopoverPattern";
import { ListboxDropdownPattern } from "./patterns/ListboxDropdownPattern";
import { TooltipPattern } from "./patterns/TooltipPattern";
import { NestedPattern } from "./patterns/NestedPattern";

const PATTERNS: Record<
  string,
  { name: string; component: React.FC }
> = {
  dialog: { name: "Dialog", component: DialogPattern },
  alertdialog: { name: "AlertDialog", component: AlertDialogPattern },
  menu: { name: "Menu", component: MenuPattern },
  popover: { name: "Popover", component: PopoverPattern },
  "listbox-dropdown": { name: "Listbox Dropdown", component: ListboxDropdownPattern },
  tooltip: { name: "Tooltip", component: TooltipPattern },
  nested: { name: "Nested Overlay", component: NestedPattern },
};

const DEFAULT_PATTERN = "dialog";

export default function LayerShowcasePage() {
  const params = useParams({ strict: false }) as { pattern?: string };
  const navigate = useNavigate();
  const activePattern =
    params.pattern && params.pattern in PATTERNS
      ? params.pattern
      : DEFAULT_PATTERN;

  useEffect(() => {
    if (!params.pattern) {
      navigate({
        to: "/playground/layers/$pattern",
        params: { pattern: DEFAULT_PATTERN },
        replace: true,
      });
    }
  }, [params.pattern, navigate]);

  const ActiveComponent = PATTERNS[activePattern]?.component;

  return (
    <div className="flex bg-gray-50 h-screen overflow-hidden text-gray-900">
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Icon name="layers" size={20} className="text-violet-600" />
            <h1 className="font-bold text-gray-800">Layer Playground</h1>
          </div>
          <p className="mt-1 text-[10px] text-gray-400">
            Overlay lifecycle dogfooding
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <Zone
            id="layer-sidebar"
            role="tablist"
            options={{ navigate: { orientation: "vertical" } }}
            className="flex flex-col gap-1"
          >
            {Object.entries(PATTERNS).map(([key, { name }]) => (
              <Item
                key={key}
                id={`layer-tab-${key}`}
                role="tab"
                as="button"
                aria-selected={activePattern === key}
                onClick={() =>
                  navigate({
                    to: "/playground/layers/$pattern",
                    params: { pattern: key },
                  })
                }
                className="
                  px-3 py-2 text-sm text-left rounded-md transition-colors
                  hover:bg-gray-50 aria-selected:bg-violet-50 aria-selected:text-violet-700
                  data-[focused=true]:ring-2 data-[focused=true]:ring-violet-300 data-[focused=true]:outline-none
                "
              >
                {name}
              </Item>
            ))}
          </Zone>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 flex flex-col">
        <header className="px-8 py-6 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-bold">
            {PATTERNS[activePattern]?.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            OS overlay system verification
          </p>
        </header>

        <main className="flex-1 overflow-auto p-8 flex justify-center items-start">
          <div className="max-w-4xl w-full">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </main>
      </div>
    </div>
  );
}
