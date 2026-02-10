/**
 * UnifiedInspector — Unified Sections (Refined v10)
 *
 * All detail sections (Pipeline, State, Effects, Kernel) use the SAME
 * visual pattern: [Section Label] → [Uniform Row List]
 * No more mixed styles between sections.
 */

import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  ChevronDown,
  Command,
  Database,
  GitBranch,
  Hash,
  Layers,
  MousePointer2,
} from "lucide-react";
import { useState, useEffect } from "react";

// ─── Types ───

export type PipelineStep = {
  name: string;
  status: "pass" | "fail" | "skip";
  detail?: string;
};

export interface InspectorEvent {
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

// ─── Component ───

export function UnifiedInspector({ events }: { events: InspectorEvent[] }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Auto-expand new events (optional, maybe just the latest)
  useEffect(() => {
    if (events.length > 0) {
      const lastId = events[events.length - 1].id;
      setExpandedIds((prev) => {
        const next = new Set(prev);
        // next.add(lastId); // Auto-expand latest? Maybe too noisy.
        return next;
      });
    }
  }, [events.length]);

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
        <span className="ml-2 text-[#999] text-[9px]">
          ({events.length} events)
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-4 text-center text-[#999] italic">
            No events captured yet.
          </div>
        ) : (
          events.map((evt, i) => (
            <TimelineNode
              key={evt.id}
              evt={evt}
              index={i + 1}
              expanded={expandedIds.has(evt.id)}
              onToggle={() => toggle(evt.id)}
            />
          ))
        )}
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
  evt: InspectorEvent;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isFail = evt.pipeline.some((s) => s.status === "fail");
  const isNoOp = evt.pipeline[0]?.status === "fail"; // Optional chaining just in case
  const icon =
    evt.input.type === "MOUSE" ? (
      <MousePointer2 size={10} />
    ) : (
      <Command size={10} />
    );

  return (
    <div
      className={`flex flex-col border-b border-[#f0f0f0] ${expanded ? "bg-white" : "hover:bg-[#fafafa]"}`}
    >
      {/* Header Row (Icon + Number + Text — all middle-aligned) */}
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onToggle();
        }}
        className="flex items-center gap-2 px-2 py-2 cursor-pointer bg-transparent border-none text-left w-full"
      >
        {/* Icon */}
        <div
          className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center bg-white shadow-sm ${isFail ? "text-[#e53e3e] border-[#fecaca]" : "text-[#64748b] border-[#e2e8f0]"}`}
        >
          {icon}
        </div>

        {/* #Number + Input */}
        <span className="font-mono text-[9px] text-[#a0aec0] font-bold select-none">
          #{index}
        </span>
        <span
          className={`font-bold text-[11px] truncate ${isFail ? "text-[#dc2626]" : "text-[#1e293b]"}`}
        >
          {evt.input.raw}
        </span>

        {/* Command Badge */}
        {evt.command && !isFail && (
          <span className="px-1 py-px rounded bg-[#eff6ff] text-[#2563eb] text-[9px] font-semibold border border-[#bfdbfe]">
            {evt.command.type}
          </span>
        )}

        {/* Time */}
        <span className="ml-auto text-[9px] text-[#cbd5e1] font-mono tabular-nums shrink-0">
          {evt.time.split(".")[0]}
        </span>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="flex flex-col gap-2 pl-9 pr-2 pb-3">
          {/* ── Pipeline ── */}
          {evt.pipeline.length > 0 && (
            <Section title="Pipeline">
              {evt.pipeline.map((step) => (
                <Row key={step.name}>
                  <span
                    className={`inline-block w-1 h-1 rounded-full shrink-0 ${step.status === "pass" ? "bg-[#22c55e]" : step.status === "fail" ? "bg-[#ef4444]" : "bg-[#d1d5db]"}`}
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
          )}

          {/* ── State ── */}
          {!isNoOp && evt.diffs.length > 0 && (
            <Section title="State">
              {evt.diffs.map((d) => (
                <Row key={d.path}>
                  <ArrowRightLeft
                    size={9}
                    className="text-[#94a3b8] shrink-0"
                  />
                  <span
                    className="text-[#475569] font-mono truncate"
                    title={d.path}
                  >
                    {d.path}
                  </span>
                  <span className="ml-auto flex items-center gap-1 shrink-0 font-mono">
                    <span className="text-[#ef4444] line-through opacity-60">
                      {String(d.from)}
                    </span>
                    <span className="text-[#cbd5e1]">→</span>
                    <span className="text-[#16a34a] font-bold">
                      {String(d.to)}
                    </span>
                  </span>
                </Row>
              ))}
            </Section>
          )}

          {/* ── Effects ── */}
          {!isNoOp && evt.effects.length > 0 && (
            <Section title="Effects">
              {evt.effects.map((eff, idx) => (
                <Row key={`${eff.source}-${eff.action}-${idx}`}>
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
                <Hash size={9} className="text-[#94a3b8] shrink-0" />
                <span className="text-[#94a3b8] shrink-0">handler</span>
                <span className="font-mono text-[#2563eb] font-bold">
                  {evt.kernel.handlerScope}
                </span>
              </Row>
              <Row>
                <GitBranch size={9} className="text-[#94a3b8] shrink-0" />
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
    <div>
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
    <div>
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
