import { Item, Zone } from "@os-react/internal";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { Icon } from "@/components/Icon";
import {
  ClickFocusPattern,
  clickFocusTests,
} from "./patterns/ClickFocusPattern";
import { CrossZonePattern, crossZoneTests } from "./patterns/CrossZonePattern";
import { ExpandPattern, expandTests } from "./patterns/ExpandPattern";
import {
  FieldLifecyclePattern,
  fieldLifecycleTests,
} from "./patterns/FieldLifecyclePattern";
import { OverlayPattern, overlayTests } from "./patterns/OverlayPattern";
import { SelectionPattern, selectionTests } from "./patterns/SelectionPattern";
import { ValuePattern, valueTests } from "./patterns/ValuePattern";

export interface TestCase {
  name: string;
  status: "pass" | "fail" | "todo";
  gap?: string;
}

const PATTERNS: Record<
  string,
  { name: string; component: React.FC; tests: TestCase[] }
> = {
  "click-focus": {
    name: "Click → Focus",
    component: ClickFocusPattern,
    tests: clickFocusTests,
  },
  "cross-zone": {
    name: "Cross-Zone",
    component: CrossZonePattern,
    tests: crossZoneTests,
  },
  selection: {
    name: "Selection",
    component: SelectionPattern,
    tests: selectionTests,
  },
  expand: {
    name: "Expand / Collapse",
    component: ExpandPattern,
    tests: expandTests,
  },
  "field-lifecycle": {
    name: "Field Lifecycle",
    component: FieldLifecyclePattern,
    tests: fieldLifecycleTests,
  },
  overlay: {
    name: "Overlay Lifecycle",
    component: OverlayPattern,
    tests: overlayTests,
  },
  value: {
    name: "Value Controls",
    component: ValuePattern,
    tests: valueTests,
  },
};

const DEFAULT_PATTERN = "click-focus";

function StatusBadge({ tests }: { tests: TestCase[] }) {
  const pass = tests.filter((t) => t.status === "pass").length;
  const fail = tests.filter((t) => t.status === "fail").length;
  const total = tests.length;

  if (fail === 0)
    return (
      <span className="text-[10px] font-mono text-emerald-600">
        {pass}/{total}
      </span>
    );
  return (
    <span className="text-[10px] font-mono text-red-500">
      {pass}/{total}
    </span>
  );
}

function TestList({ tests }: { tests: TestCase[] }) {
  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <h4 className="text-sm font-semibold text-gray-600 mb-3">
        Headless Tests
      </h4>
      <div className="space-y-1">
        {tests.map((t) => (
          <div
            key={t.name}
            className="flex items-start gap-2 text-xs font-mono"
          >
            <span className="flex-shrink-0 mt-0.5">
              {t.status === "pass" && (
                <span className="text-emerald-500">✓</span>
              )}
              {t.status === "fail" && <span className="text-red-500">✗</span>}
              {t.status === "todo" && <span className="text-gray-400">○</span>}
            </span>
            <span
              className={
                t.status === "fail"
                  ? "text-red-600"
                  : t.status === "todo"
                    ? "text-gray-400"
                    : "text-gray-700"
              }
            >
              {t.name}
              {t.gap && (
                <span className="ml-1 text-amber-500 font-normal">
                  ({t.gap})
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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

  const entry = PATTERNS[activePattern];

  // Summary stats
  const allTests = Object.values(PATTERNS).flatMap((p) => p.tests);
  const totalPass = allTests.filter((t) => t.status === "pass").length;
  const totalFail = allTests.filter((t) => t.status === "fail").length;
  const totalTodo = allTests.filter((t) => t.status === "todo").length;

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
          <div className="mt-2 flex gap-3 text-[10px] font-mono">
            <span className="text-emerald-600">{totalPass} pass</span>
            <span className="text-red-500">{totalFail} fail</span>
            {totalTodo > 0 && (
              <span className="text-gray-400">{totalTodo} todo</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <Zone
            id="os-test-sidebar"
            role="tablist"
            options={{ navigate: { orientation: "vertical" } }}
            className="flex flex-col gap-1"
          >
            {Object.entries(PATTERNS).map(([key, { name, tests }]) => (
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
                  flex items-center justify-between
                  px-3 py-2 text-sm text-left rounded-md transition-colors
                  hover:bg-gray-50 aria-selected:bg-emerald-50 aria-selected:text-emerald-700
                  data-[focused=true]:ring-2 data-[focused=true]:ring-emerald-300 data-[focused=true]:outline-none
                "
              >
                <span>{name}</span>
                <StatusBadge tests={tests} />
              </Item>
            ))}
          </Zone>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 flex flex-col">
        <header className="px-8 py-6 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-bold">{entry?.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            OS pipeline interaction chain exercise
          </p>
        </header>

        <main className="flex-1 overflow-auto p-8 flex justify-center items-start">
          <div className="max-w-4xl w-full">
            {entry && (
              <>
                <entry.component />
                <TestList tests={entry.tests} />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
