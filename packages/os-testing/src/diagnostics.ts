/**
 * formatDiagnostics — Pure diagnostic formatter
 *
 * Returns a human-readable diagnostic string.
 * No side effects — just reads transactions + zone state.
 *
 * Rules:
 * 1. Filter by last tx's changes paths (Δ none → last 5)
 * 2. ⚠️ Δ none = command executed, state unchanged (strongest signal)
 * 3. Zone snapshot = items count + focusedItemId + selection
 * 4. Target ≤ 15 lines
 */

import type { Transaction } from "@kernel/core/transaction";
import type { AppState } from "@os-core/engine/kernel";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";

/** Minimal kernel interface for formatDiagnostics (structural typing) */
interface DiagnosticKernel {
  inspector: {
    getTransactions(): readonly Transaction[];
  };
  getState(): AppState;
}

export function formatDiagnostics(kernel: DiagnosticKernel): string {
  const txs = kernel.inspector.getTransactions();
  const state = kernel.getState();
  const lines: string[] = [];

  lines.push("═══ OS Diagnostic ═══");

  if (txs.length === 0) {
    lines.push("(no transactions)");
    lines.push("═══════════════════════");
    return lines.join("\n");
  }

  const lastTx = txs[txs.length - 1]!;
  const lastHasNoChanges = lastTx.changes.length === 0;

  // Last: header
  lines.push(
    `Last: ${lastTx.command.type}${lastHasNoChanges ? " ⚠️ Δ none" : ""}`,
  );
  lines.push("");

  // Filter relevant transactions
  let relevantTxs: readonly Transaction[];
  if (lastHasNoChanges) {
    relevantTxs = txs.slice(-5);
  } else {
    const lastPrefixes = new Set(
      lastTx.changes.map((c) => c.path.split(".").slice(0, 3).join(".")),
    );
    relevantTxs = txs.filter((tx) => {
      if (tx.changes.length === 0) return true;
      return tx.changes.some((c) => {
        const prefix = c.path.split(".").slice(0, 3).join(".");
        return lastPrefixes.has(prefix);
      });
    });
  }

  // Transaction listing
  for (const tx of relevantTxs) {
    const noChanges = tx.changes.length === 0;
    lines.push(`  #${tx.id} ${tx.command.type}${noChanges ? " ⚠️ Δ none" : ""}`);
    if (!noChanges) {
      for (const change of tx.changes) {
        lines.push(
          `    Δ ${change.path}: ${JSON.stringify(change.from)} → ${JSON.stringify(change.to)}`,
        );
      }
    }
  }

  // Zone snapshot
  const activeZoneId = state.os.focus.activeZoneId;
  if (activeZoneId) {
    const zone = state.os.focus.zones[activeZoneId];
    if (zone) {
      const entry = ZoneRegistry.get(activeZoneId);
      const items = entry?.getItems?.() ?? [];
      const sel = Object.entries(zone.items ?? {})
        .filter(([, s]) => s?.["aria-selected"])
        .map(([id]) => `"${id}"`)
        .join(", ");
      lines.push("");
      lines.push(
        `Zone "${activeZoneId}": items=${items.length}, focused="${zone.focusedItemId ?? ""}", selection=[${sel}]`,
      );
    }
  }

  lines.push("═══════════════════════");
  return lines.join("\n");
}
