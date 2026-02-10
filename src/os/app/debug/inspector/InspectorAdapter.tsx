/**
 * InspectorAdapter — Bridges Real Kernel Data to Unified Inspector
 *
 * Reads kernel transactions (including meta) → InspectorEvent[]
 * No separate telemetry collection — all data comes from the kernel.
 */

import {
  type InspectorEvent,
  UnifiedInspector,
} from "@os/app/debug/inspector/UnifiedInspector.tsx";
import { kernel } from "@/os-new/kernel.ts";

// ─── Adapter Component ───

export function InspectorAdapter() {
  // Subscribe to kernel changes to trigger re-renders
  kernel.useComputed((s) => s);

  const transactions = kernel.getTransactions();

  // Map transactions to InspectorEvents
  const events: InspectorEvent[] = transactions.map((tx) => {
    // Read input info from tx.meta (provided by OS at dispatch time)
    const inputMeta = tx.meta?.input as
      | { type?: string; key?: string; code?: string; elementId?: string }
      | undefined;

    // 1. Infer Pipeline
    const pipeline = [
      {
        name: "LISTEN",
        status: inputMeta ? "pass" : "skip",
        detail: inputMeta?.code ?? "OS",
      } as const,
      { name: "MATCH", status: "pass", detail: tx.command.type } as const,
      { name: "WHEN", status: "pass", detail: tx.handlerScope } as const,
      {
        name: "EXEC",
        status: "pass",
        detail: `${tx.changes.length} mutations`,
      } as const,
    ];

    // 2. Map State Diffs
    const diffs = tx.changes.map((c) => ({
      path: c.path,
      from: String(c.from),
      to: String(c.to),
    }));

    // 3. Map Effects
    const effects: InspectorEvent["effects"] = [];
    if (tx.effects) {
      Object.entries(tx.effects).forEach(([key, _val]) => {
        effects.push({
          source: "os",
          action: key,
          targetId: null,
          ok: true,
        });
      });
    }

    // 4. Construct Event
    return {
      id: `tx-${tx.id}`,
      time: new Date(tx.timestamp).toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
      }),
      input: {
        type: (inputMeta?.type === "MOUSE"
          ? "MOUSE"
          : inputMeta?.type === "FOCUS"
            ? "FOCUS"
            : "KEYBOARD") as "KEYBOARD" | "MOUSE" | "FOCUS",
        raw:
          inputMeta?.key ??
          ((tx.command.payload as any)?.key || tx.command.type),
        elementId: inputMeta?.elementId,
      },
      command: {
        type: tx.command.type,
        payload: tx.command.payload,
      },
      pipeline,
      diffs,
      effects,
      kernel: {
        handlerScope: tx.handlerScope,
        bubblePath: tx.bubblePath,
        middleware: [],
      },
      snapshot: tx.meta,
    };
  });

  return <UnifiedInspector events={events} />;
}
