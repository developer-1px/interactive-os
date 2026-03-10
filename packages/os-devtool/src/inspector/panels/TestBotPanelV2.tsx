/**
 * TestBotPanelV2 — ZIFT version of TestBotPanel.
 *
 * Bootstrapping: OS's own devtool built with OS ZIFT primitives.
 * Uses accordion zone for suite list, toolbar zone for actions.
 * Existing TestBotPanel.tsx is preserved for side-by-side comparison.
 */

import { type SuiteState, TestBotApp } from "@os-devtool/testbot/app";
import { SuitesUI, suiteItemId, ToolbarUI } from "@os-devtool/testbot/zones";

// ── Suite Row (accordion item + content) ─────────────────────────

function SuiteRow({ suite }: { suite: SuiteState }) {
  const itemId = suiteItemId(suite.name);
  const isPending = suite.status === "planned";

  return (
    <div>
      <SuitesUI.Item
        id={itemId}
        className={`w-full px-3 py-2.5 cursor-pointer text-left text-[11px] font-semibold ${
          isPending ? "text-slate-400" : "text-slate-700"
        }`}
      >
        <span>{suite.name}</span>
        {!isPending && (
          <span className="text-[10px] text-slate-400 ml-2">
            {suite.steps.length} steps
          </span>
        )}
      </SuitesUI.Item>

      <SuitesUI.Item.Content for={itemId} className="px-3 pb-2 text-[10px]">
        {suite.steps.length === 0 ? (
          <span className="text-slate-400">Ready to run</span>
        ) : (
          suite.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5 py-0.5">
              <span className="font-mono text-[9px] text-slate-500">
                #{i + 1}
              </span>
              <span className="font-bold uppercase text-[10px]">
                {step.action}
              </span>
              <span className="font-mono truncate">{step.detail}</span>
              {step.error && (
                <span className="text-red-600 text-[10px]">{step.error}</span>
              )}
            </div>
          ))
        )}
      </SuitesUI.Item.Content>
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────

export function TestBotPanelV2() {
  const suites = TestBotApp.useComputed((s) => s.suites);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 font-sans">
      {/* Toolbar */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-800">TestBot v2</h2>
          <ToolbarUI.Zone className="flex items-center gap-1.5">
            <ToolbarUI.Item
              id="tb-run-all"
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold"
            >
              Run All
            </ToolbarUI.Item>
            <ToolbarUI.Item
              id="tb-quick"
              className="px-2 py-1.5 bg-amber-50 text-amber-600 rounded-md text-xs font-semibold"
            >
              Quick
            </ToolbarUI.Item>
          </ToolbarUI.Zone>
        </div>
      </div>

      {/* Suite Accordion */}
      <div className="flex-1 overflow-y-auto p-3">
        <SuitesUI.Zone className="space-y-2" aria-label="Test Suites">
          {suites.map((suite) => (
            <SuiteRow key={suite.name} suite={suite} />
          ))}
        </SuitesUI.Zone>
      </div>
    </div>
  );
}
