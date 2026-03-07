import { Item, Zone } from "@os-react/internal";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { Icon } from "@/components/Icon";
import { AccordionPattern } from "./patterns/AccordionPattern";
import { AlertPattern } from "./patterns/AlertPattern";
import { BreadcrumbPattern } from "./patterns/BreadcrumbPattern";
import { ButtonPattern } from "./patterns/ButtonPattern";
import { CarouselPattern } from "./patterns/CarouselPattern";
import { CheckboxPattern } from "./patterns/CheckboxPattern";
import { CompositePattern } from "./patterns/CompositePattern";
import { DisclosurePattern } from "./patterns/DisclosurePattern";
import { FeedPattern } from "./patterns/FeedPattern";
import { GridPattern } from "./patterns/GridPattern";
import { LandmarksPattern } from "./patterns/LandmarksPattern";
import { LinkPattern } from "./patterns/LinkPattern";
import { ListboxPattern } from "./patterns/ListboxPattern";
import { MenuButtonPattern } from "./patterns/MenuButtonPattern";
import { MenuPattern } from "./patterns/MenuPattern";
import { MeterPattern } from "./patterns/MeterPattern";
import { RadioGroupPattern } from "./patterns/RadioGroupPattern";
import { SliderMultiThumbPattern } from "./patterns/SliderMultiThumbPattern";
import { SliderPattern } from "./patterns/SliderPattern";
import { SpinbuttonPattern } from "./patterns/SpinbuttonPattern";
import { SwitchPattern } from "./patterns/SwitchPattern";
import { TablePattern } from "./patterns/TablePattern";
import { TabsPattern } from "./patterns/TabsPattern";
import { ToolbarPattern } from "./patterns/ToolbarPattern";
import { TooltipPattern } from "./patterns/TooltipPattern";
import { TreegridPattern } from "./patterns/TreegridPattern";
import { TreePattern } from "./patterns/TreePattern";
import { WindowSplitterPattern } from "./patterns/WindowSplitterPattern";

/**
 * APG pattern test status:
 * - "dt"   : DT standard .apg.md exists + headless tests pass
 * - "test" : .apg.test.ts exists + pass, DT not yet written
 * - "none" : no headless tests
 */
type PatternStatus = "dt" | "test" | "none";

const STATUS_ICON: Record<PatternStatus, string> = {
  dt: "\u{1F7E2}",
  test: "\u{1F7E1}",
  none: "",
};

const PATTERNS: Record<
  string,
  { name: string; component: React.FC; status: PatternStatus }
> = {
  accordion: { name: "Accordion", component: AccordionPattern, status: "dt" },
  alert: { name: "Alert", component: AlertPattern, status: "none" },
  breadcrumb: { name: "Breadcrumb", component: BreadcrumbPattern, status: "none" },
  button: { name: "Button", component: ButtonPattern, status: "dt" },
  carousel: { name: "Carousel", component: CarouselPattern, status: "test" },
  checkbox: { name: "Checkbox", component: CheckboxPattern, status: "test" },
  composite: { name: "Composite", component: CompositePattern, status: "none" },
  disclosure: { name: "Disclosure", component: DisclosurePattern, status: "test" },
  feed: { name: "Feed", component: FeedPattern, status: "test" },
  grid: { name: "Grid", component: GridPattern, status: "none" },
  landmarks: { name: "Landmarks", component: LandmarksPattern, status: "none" },
  link: { name: "Link", component: LinkPattern, status: "none" },
  listbox: { name: "Listbox", component: ListboxPattern, status: "dt" },
  menu: { name: "Menu", component: MenuPattern, status: "test" },
  "menu-button": { name: "Menu Button", component: MenuButtonPattern, status: "test" },
  meter: { name: "Meter", component: MeterPattern, status: "test" },
  radiogroup: { name: "RadioGroup", component: RadioGroupPattern, status: "test" },
  slider: { name: "Slider", component: SliderPattern, status: "none" },
  "slider-multithumb": {
    name: "Slider (Multi)",
    component: SliderMultiThumbPattern,
    status: "none",
  },
  spinbutton: { name: "Spinbutton", component: SpinbuttonPattern, status: "none" },
  switch: { name: "Switch", component: SwitchPattern, status: "test" },
  table: { name: "Table", component: TablePattern, status: "none" },
  tabs: { name: "Tabs", component: TabsPattern, status: "dt" },
  toolbar: { name: "Toolbar", component: ToolbarPattern, status: "test" },
  tooltip: { name: "Tooltip", component: TooltipPattern, status: "test" },
  tree: { name: "Tree", component: TreePattern, status: "test" },
  treegrid: { name: "Treegrid", component: TreegridPattern, status: "test" },
  "window-splitter": {
    name: "Window Splitter",
    component: WindowSplitterPattern,
    status: "none",
  },
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

  const ActiveComponent = PATTERNS[activePattern]?.component;

  return (
    <div className="flex bg-gray-50 h-screen overflow-hidden text-gray-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Icon name="layout" size={20} className="text-indigo-600" />
            <h1 className="font-bold text-gray-800">APG Suite</h1>
          </div>
          <div className="mt-2 text-[10px] text-gray-400 flex gap-3">
            <span>{"\u{1F7E2}"} DT</span>
            <span>{"\u{1F7E1}"} Test</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <Zone
            id="apg-sidebar"
            role="tablist"
            options={{ navigate: { orientation: "vertical" } }}
            className="flex flex-col gap-1"
          >
            {Object.entries(PATTERNS).map(([key, { name, status }]) => (
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
                  px-3 py-2 text-sm text-left rounded-md transition-colors flex items-center gap-2
                  hover:bg-gray-50 aria-selected:bg-indigo-50 aria-selected:text-indigo-700
                  data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:outline-none
                "
              >
                {STATUS_ICON[status] && (
                  <span className="text-xs leading-none">{STATUS_ICON[status]}</span>
                )}
                <span>{name}</span>
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
  );
}
