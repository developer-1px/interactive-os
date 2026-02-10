/**
 * UnifiedInspectorMock — Unified Sections (Refined v10)
 *
 * All detail sections (Pipeline, State, Effects, Kernel) use the SAME
 * visual pattern: [Section Label] → [Uniform Row List]
 * No more mixed styles between sections.
 */

import {
  AlertTriangle,
  Check,
  ChevronDown,
  Command,
  Database,
  Layers,
  MousePointer2,
} from "lucide-react";
import { useState } from "react";

// ─── Types ───

type PipelineStep = {
  name: string;
  status: "pass" | "fail" | "skip";
  detail?: string;
};

interface MockEvent {
  id: string;
  time: string;
  input: { type: "KEYBOARD" | "MOUSE"; raw: string };
  command: { type: string; payload?: unknown } | null;
  pipeline: PipelineStep[];
  diffs: Array<{ path: string; from: string; to: string }>;
  effects: Array<{
    source: "focus" | "os";
    action: string;
    targetId: string | null;
    ok: boolean;
    reason?: string;
  }>;
  snapshot?: Record<string, unknown>;
  kernel?: {
    handlerScope: string;
    bubblePath: string[];
    middleware: Array<{ name: string; duration: number }>;
  };
}

// ─── Mock Data ───

const MOCK_EVENTS: MockEvent[] = [
  {
    id: "tx-1042",
    time: "10:42:05.120",
    input: { type: "KEYBOARD", raw: "ArrowDown" },
    command: { type: "NAVIGATE", payload: { direction: "DOWN" } },
    pipeline: [
      { name: "MATCH", status: "pass", detail: "NAVIGATE" },
      { name: "WHEN", status: "pass", detail: "zone:main-list" },
      { name: "EXEC", status: "pass" },
    ],
    diffs: [
      { path: "focus.activeId", from: "item-1", to: "item-2" },
      { path: "focus.selection", from: "[1]", to: "[2]" },
    ],
    effects: [
      {
        source: "focus",
        action: "scrollIntoView",
        targetId: "item-2",
        ok: true,
      },
      { source: "focus", action: "focus", targetId: "item-2", ok: true },
    ],
    kernel: {
      handlerScope: "zone:main-list",
      bubblePath: ["item-1", "zone:main-list", "GLOBAL"],
      middleware: [{ name: "logger", duration: 0.2 }],
    },
    snapshot: { "focus.activeZone": "main-list", "focus.activeId": "item-2" },
  },
  {
    id: "tx-1043",
    time: "10:42:06.340",
    input: { type: "KEYBOARD", raw: "KeyA" },
    command: null,
    pipeline: [
      { name: "MATCH", status: "fail", detail: "No binding" },
      { name: "WHEN", status: "skip" },
      { name: "EXEC", status: "skip" },
    ],
    diffs: [],
    effects: [],
  },
  {
    id: "tx-1044",
    time: "10:42:07.800",
    input: { type: "KEYBOARD", raw: "Enter" },
    command: { type: "OPEN_ITEM", payload: {} },
    pipeline: [
      { name: "MATCH", status: "pass", detail: "OPEN_ITEM" },
      { name: "WHEN", status: "fail", detail: "isEditing (blocked)" },
      { name: "EXEC", status: "skip" },
    ],
    diffs: [],
    effects: [],
    kernel: {
      handlerScope: "descendant:item-2",
      bubblePath: ["item-2", "zone:main-list", "GLOBAL"],
      middleware: [],
    },
    snapshot: { "focus.activeZone": "main-list", "focus.activeId": "item-2" },
  },
  {
    id: "tx-1045",
    time: "10:42:09.100",
    input: { type: "MOUSE", raw: "Click(btn-save)" },
    command: { type: "SAVE_DRAFT", payload: { force: true } },
    pipeline: [
      { name: "MATCH", status: "pass", detail: "SAVE_DRAFT" },
      { name: "WHEN", status: "pass" },
      { name: "EXEC", status: "pass" },
    ],
    diffs: [
      { path: "data.draft.saved", from: "false", to: "true" },
      { path: "data.draft.savedAt", from: "null", to: "T10:42:09" },
    ],
    effects: [
      { source: "os", action: "toast", targetId: null, ok: true },
      {
        source: "os",
        action: "analytics.track",
        targetId: null,
        ok: false,
        reason: "Offline",
      },
    ],
    kernel: {
      handlerScope: "GLOBAL",
      bubblePath: ["btn-save", "toolbar", "GLOBAL"],
      middleware: [{ name: "analytics", duration: 1.5 }],
    },
    snapshot: { "data.draft.saved": true, "data.draft.savedAt": "10:42:09" },
  },
];

// ─── Component ───

export function UnifiedInspectorMock() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(["tx-1042"]),
  );

  const toggle = (id: string) => {
    const next = new Set(expandedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedIds(next);
  };

  return (
    <div className="flex flex-col w-full h-full bg-white text-[#333] font-sans text-[10px] select-none">
      <div className="h-8 px-3 border-b border-[#e8e8e8] bg-white flex items-center shrink-0 sticky top-0 z-20">
        <Layers size={13} className="text-[#007acc] mr-2" />
        <span className="font-bold text-[#555]">Trace Log</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {MOCK_EVENTS.map((evt, i) => (
          <TimelineNode
            key={evt.id}
            evt={evt}
            index={i + 1}
            expanded={expandedIds.has(evt.id)}
            onToggle={() => toggle(evt.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Node ───

function TimelineNode({
  evt,
  index,
  expanded,
  onToggle,
}: {
  evt: MockEvent;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isFail = evt.pipeline.some((s) => s.status === "fail");
  const isNoOp = evt.pipeline[0].status === "fail";
  const icon =
    evt.input.type === "MOUSE" ? (
      <MousePointer2 size={10} />
    ) : (
      <Command size={10} />
    );

  return (
    <div
      className={`flex border-b border-[#f0f0f0] ${expanded ? "bg-white" : "hover:bg-[#fafafa]"}`}
    >
      {/* Gutter */}
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onToggle();
        }}
        className="w-10 shrink-0 flex flex-col items-center pt-2 cursor-pointer select-none gap-0.5 bg-transparent border-none p-0"
      >
        <div
          className={`w-5 h-5 rounded-full border flex items-center justify-center bg-white shadow-sm ${isFail ? "text-[#e53e3e] border-[#fecaca]" : "text-[#64748b] border-[#e2e8f0]"}`}
        >
          {icon}
        </div>
        <span className="text-[8px] font-mono text-[#b0b8c4] leading-none">
          {index}
        </span>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 py-1.5 pr-2">
        {/* Header */}
        <button
          type="button"
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onToggle();
          }}
          className="flex items-baseline gap-1.5 cursor-pointer leading-tight bg-transparent border-none p-0 text-left w-full"
        >
          <span
            className={`font-bold text-[11px] ${isFail ? "text-[#dc2626]" : "text-[#1e293b]"}`}
          >
            {evt.input.raw}
          </span>
          {evt.command && !isFail && (
            <span className="px-1 py-px rounded bg-[#eff6ff] text-[#2563eb] text-[9px] font-semibold border border-[#bfdbfe]">
              {evt.command.type}
            </span>
          )}
          <span className="ml-auto text-[9px] text-[#cbd5e1] font-mono tabular-nums">
            {evt.time.split(".")[0]}
          </span>
        </button>

        {/* Collapsed Summary */}
        {!expanded && (
          <div className="flex items-center gap-1 mt-1 text-[9px] text-[#94a3b8]">
            {evt.pipeline.map((s) => (
              <span key={s.name} className="flex items-center gap-0.5">
                <span
                  className={`inline-block w-1 h-1 rounded-full ${s.status === "pass" ? "bg-[#22c55e]" : s.status === "fail" ? "bg-[#ef4444]" : "bg-[#d1d5db]"}`}
                />
                <span
                  className={
                    s.status === "fail" ? "text-[#dc2626] font-bold" : ""
                  }
                >
                  {s.name}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Expanded */}
        {expanded && (
          <div className="mt-2 flex flex-col gap-0">
            {/* ── Pipeline ── */}
            <Section title="Pipeline">
              {evt.pipeline.map((step) => (
                <Row key={step.name}>
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${step.status === "pass" ? "bg-[#22c55e]" : step.status === "fail" ? "bg-[#ef4444]" : "bg-[#d1d5db]"}`}
                  />
                  <span
                    className={`font-mono font-bold w-10 shrink-0 ${step.status === "pass" ? "text-[#475569]" : step.status === "fail" ? "text-[#dc2626]" : "text-[#94a3b8]"}`}
                  >
                    {step.name}
                  </span>
                  {step.detail && (
                    <span
                      className={`truncate ${step.status === "fail" ? "text-[#ef4444] font-bold" : "text-[#64748b]"}`}
                    >
                      {step.detail}
                    </span>
                  )}
                </Row>
              ))}
            </Section>

            {/* ── State ── */}
            {!isNoOp && evt.diffs.length > 0 && (
              <Section title="State">
                {evt.diffs.map((d) => (
                  <Row key={d.path}>
                    <span
                      className="text-[#475569] font-mono truncate"
                      title={d.path}
                    >
                      {d.path}
                    </span>
                    <span className="ml-auto flex items-center gap-1 shrink-0 font-mono">
                      <span className="text-[#ef4444] line-through opacity-60">
                        {d.from}
                      </span>
                      <span className="text-[#cbd5e1]">→</span>
                      <span className="text-[#16a34a] font-bold">{d.to}</span>
                    </span>
                  </Row>
                ))}
              </Section>
            )}

            {/* ── Effects ── */}
            {!isNoOp && evt.effects.length > 0 && (
              <Section title="Effects">
                {evt.effects.map((eff) => (
                  <Row key={`${eff.source}-${eff.action}-${eff.targetId}`}>
                    {eff.ok ? (
                      <Check size={9} className="text-[#16a34a] shrink-0" />
                    ) : (
                      <AlertTriangle
                        size={9}
                        className="text-[#ef4444] shrink-0"
                      />
                    )}
                    <span className="font-mono text-[#334155]">
                      {eff.action}
                      <span className="text-[#94a3b8]">
                        ({eff.targetId || "global"})
                      </span>
                    </span>
                    {!eff.ok && (
                      <span className="text-[#dc2626] italic ml-auto shrink-0">
                        — {eff.reason}
                      </span>
                    )}
                  </Row>
                ))}
              </Section>
            )}

            {/* ── Kernel ── */}
            {!isNoOp && evt.kernel && (
              <Section title="Kernel">
                <Row>
                  <span className="text-[#94a3b8] shrink-0">handler</span>
                  <span className="font-mono text-[#2563eb] font-bold">
                    {evt.kernel.handlerScope}
                  </span>
                </Row>
                <Row>
                  <span className="text-[#94a3b8] shrink-0">path</span>
                  <span className="text-[#475569]">
                    {evt.kernel.bubblePath.join(" › ")}
                  </span>
                </Row>
              </Section>
            )}

            {/* ── Snapshot ── */}
            {evt.snapshot && <RawDataToggle data={evt.snapshot} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Unified Building Blocks ───

/** Section: The ONE pattern for all detail groups. Label + bordered row list. */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-[#f1f5f9] pt-1.5 pb-1 mt-1 first:border-0 first:mt-0 first:pt-0">
      <div className="text-[8px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
        {title}
      </div>
      <div className="flex flex-col gap-px rounded border border-[#f1f5f9] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/** Row: The ONE pattern for all data rows within a Section. */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 text-[9px] bg-white hover:bg-[#fafafa] transition-colors">
      {children}
    </div>
  );
}

function RawDataToggle({ data }: { data: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-[#f1f5f9] pt-1.5 mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-2 py-1 rounded border border-[#f1f5f9] bg-white text-[#94a3b8] hover:text-[#64748b] hover:bg-[#fafafa] transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Database size={9} />
          <span className="font-bold text-[8px] uppercase tracking-wider">
            Snapshot
          </span>
        </div>
        <ChevronDown
          size={10}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-1 p-2 rounded border border-[#e2e8f0] bg-[#1e293b] overflow-x-auto">
          <pre className="text-[9px] font-mono text-[#e2e8f0] leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
