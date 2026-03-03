import { apgShowcaseScripts, TestBotRegistry } from "@os-devtool/testing";
import { Item } from "@os-react/6-project/Item";
import { Zone } from "@os-react/6-project/Zone";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { Icon } from "@/components/Icon";
import { AccordionPattern } from "./patterns/AccordionPattern";
import { AlertPattern } from "./patterns/AlertPattern";
import { CompositePattern } from "./patterns/CompositePattern";
import { GridPattern } from "./patterns/GridPattern";
import { ListboxPattern } from "./patterns/ListboxPattern";
import { MenuPattern } from "./patterns/MenuPattern";
import { RadioGroupPattern } from "./patterns/RadioGroupPattern";
import { SliderPattern } from "./patterns/SliderPattern";
import { SwitchPattern } from "./patterns/SwitchPattern";
import { TabsPattern } from "./patterns/TabsPattern";
import { ToolbarPattern } from "./patterns/ToolbarPattern";
import { TreePattern } from "./patterns/TreePattern";

const PATTERNS: Record<string, { name: string; component: React.FC }> = {
  accordion: { name: "Accordion", component: AccordionPattern },
  alert: { name: "Alert", component: AlertPattern },
  tabs: { name: "Tabs", component: TabsPattern },
  tree: { name: "Tree", component: TreePattern },
  menu: { name: "Menu", component: MenuPattern },
  grid: { name: "Grid", component: GridPattern },
  listbox: { name: "Listbox", component: ListboxPattern },
  toolbar: { name: "Toolbar", component: ToolbarPattern },
  slider: { name: "Slider", component: SliderPattern },
  switch: { name: "Switch", component: SwitchPattern },
  radiogroup: { name: "RadioGroup", component: RadioGroupPattern },
  composite: { name: "Composite", component: CompositePattern },
};

const DEFAULT_PATTERN = "accordion";

export default function ApgShowcasePage() {
  const params = useParams({ strict: false }) as { pattern?: string };
  const navigate = useNavigate();
  const activePattern =
    params.pattern && params.pattern in PATTERNS
      ? params.pattern
      : DEFAULT_PATTERN;

  // Redirect bare /playground/apg to /playground/apg/accordion
  useEffect(() => {
    if (!params.pattern) {
      navigate({
        to: "/playground/apg/$pattern",
        params: { pattern: DEFAULT_PATTERN },
        replace: true,
      });
    }
  }, [params.pattern, navigate]);

  // Register ALL APG test scripts with TestBot on mount
  useEffect(() => {
    return TestBotRegistry.register(apgShowcaseScripts);
  }, []);

  const ActiveComponent = PATTERNS[activePattern]?.component;

  return (
    <>
      <div className="flex bg-gray-50 h-screen overflow-hidden text-gray-900">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Icon name="layout" size={20} className="text-indigo-600" />
            <h1 className="font-bold text-gray-800">APG Suite</h1>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <Zone
              id="apg-sidebar"
              role="tablist"
              options={{ navigate: { orientation: "vertical" } }}
              className="flex flex-col gap-1"
            >
              {Object.entries(PATTERNS).map(([key, { name }]) => (
                <Item
                  key={key}
                  id={`tab-${key}`}
                  role="tab"
                  as="button"
                  aria-selected={activePattern === key}
                  onClick={() =>
                    navigate({
                      to: "/playground/apg/$pattern",
                      params: { pattern: key },
                    })
                  }
                  className="
                  px-3 py-2 text-sm text-left rounded-md transition-colors
                  hover:bg-gray-50 aria-selected:bg-indigo-50 aria-selected:text-indigo-700
                  data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:outline-none
                "
                >
                  {name}
                </Item>
              ))}
            </Zone>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 flex flex-col">
          <header className="px-8 py-6 border-b border-gray-200 bg-white">
            <h2 className="text-2xl font-bold">
              {PATTERNS[activePattern]?.name} Pattern
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              100% strictly compliant implementation.
            </p>
          </header>

          <main className="flex-1 overflow-auto p-8 flex justify-center items-start">
            <div className="max-w-4xl w-full">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
