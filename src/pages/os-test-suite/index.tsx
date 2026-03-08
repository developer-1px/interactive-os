import { Item, Zone } from "@os-react/internal";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { Icon } from "@/components/Icon";
import { ClickFocusPattern } from "./patterns/ClickFocusPattern";
import { CrossZonePattern } from "./patterns/CrossZonePattern";
import { FieldLifecyclePattern } from "./patterns/FieldLifecyclePattern";

const PATTERNS: Record<string, { name: string; component: React.FC }> = {
  "click-focus": { name: "Click → Focus", component: ClickFocusPattern },
  "cross-zone": { name: "Cross-Zone", component: CrossZonePattern },
  "field-lifecycle": {
    name: "Field Lifecycle",
    component: FieldLifecyclePattern,
  },
};

const DEFAULT_PATTERN = "click-focus";

export default function OsTestSuitePage() {
  const params = useParams({ strict: false }) as { pattern?: string };
  const navigate = useNavigate();
  const activePattern =
    params.pattern && params.pattern in PATTERNS
      ? params.pattern
      : DEFAULT_PATTERN;

  useEffect(() => {
    if (!params.pattern) {
      navigate({
        to: "/playground/os-test/$pattern",
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
            <Icon name="flask" size={20} className="text-emerald-600" />
            <h1 className="font-bold text-gray-800">OS Test Suite</h1>
          </div>
          <p className="mt-1 text-[10px] text-gray-400">
            Pipeline interaction chain verification
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <Zone
            id="os-test-sidebar"
            role="tablist"
            options={{ navigate: { orientation: "vertical" } }}
            className="flex flex-col gap-1"
          >
            {Object.entries(PATTERNS).map(([key, { name }]) => (
              <Item
                key={key}
                id={`os-test-tab-${key}`}
                role="tab"
                as="button"
                aria-selected={activePattern === key}
                onClick={() =>
                  navigate({
                    to: "/playground/os-test/$pattern",
                    params: { pattern: key },
                  })
                }
                className="
                  px-3 py-2 text-sm text-left rounded-md transition-colors
                  hover:bg-gray-50 aria-selected:bg-emerald-50 aria-selected:text-emerald-700
                  data-[focused=true]:ring-2 data-[focused=true]:ring-emerald-300 data-[focused=true]:outline-none
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
            OS pipeline interaction chain exercise
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
