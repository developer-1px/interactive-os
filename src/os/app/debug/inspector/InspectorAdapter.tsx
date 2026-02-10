/**
 * InspectorAdapter — Bridges Real Kernel Data to Unified Inspector
 *
 * Mapps @kernel transactions → InspectorEvent[]
 */

import { kernel } from "@/os-new/kernel.ts";
import {
    InspectorEvent,
    UnifiedInspector,
} from "@os/app/debug/inspector/UnifiedInspector.tsx";

// ─── Adapter Component ───

export function InspectorAdapter() {
    // Subscribe to kernel changes to trigger re-renders
    kernel.useComputed((s) => s);

    const transactions = kernel.getTransactions();

    // Map transactions to InspectorEvents
    const events: InspectorEvent[] = transactions.map((tx) => {
        // 1. Infer Pipeline
        // Since we only have committed transactions, we assume success for now.
        // In the future, the kernel could log failed matches/guards too.
        const pipeline = [
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
            Object.entries(tx.effects).forEach(([key, val]) => {
                effects.push({
                    source: "os", // Defaulting to OS for now (could be 'focus' etc based on key)
                    action: key,
                    targetId: null, // Kernel doesn't log targetId in effects map yet
                    ok: true, // If it's in the effects map, the handler returned it. Execution success is another matter.
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
                type: "KEYBOARD", // Placeholder: We need to correlate this with actual input later
                raw: "Command", // Placeholder
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
                middleware: [], // Middleware timing not yet captured in transaction
            },
            snapshot: {
                // We could dump the whole state, but let's just show relevant parts if we could filter them.
                // For now, let's show the command payload as a proxy for interesting data
                payload: tx.command.payload,
            },
        };
    });

    // Reverse to show newest at bottom? UnifiedInspector maps them in order.
    // Kernel returns oldest -> newest.

    return <UnifiedInspector events={events} />;
}
