/**
 * dumpTransactions — Headless diagnostic log for LLM issue reproduction.
 *
 * Reads the kernel's transaction log (preview-aware) and prints
 * a human/LLM-readable summary of each transaction's trigger,
 * command, scope, and state diff.
 *
 * Usage:
 *   import { dumpTransactions } from "@inspector/utils/dumpTransactions";
 *
 *   os.inspector.clearTransactions();
 *   page.keyboard.press("Tab");
 *   dumpTransactions(os, "After Tab");
 */

import type { Transaction } from "@kernel/core/transaction";
import { inferSignal } from "./inferSignal";

interface InspectorProvider {
    inspector: {
        getTransactions(): readonly Transaction[];
    };
}

/**
 * Print kernel transaction log as structured diagnostic output.
 *
 * @param kernel - Any object with inspector.getTransactions() (e.g. `os`)
 * @param label  - Section label for the log block
 */
export function dumpTransactions(
    kernel: InspectorProvider,
    label: string,
): void {
    const txs = kernel.inspector.getTransactions();
    const lines: string[] = [];

    lines.push("");
    lines.push(`══════ ${label} ══════`);
    lines.push(`Total transactions: ${txs.length}`);

    for (const tx of txs) {
        const signal = inferSignal(tx);
        const diffStr =
            signal.diff.length > 0
                ? signal.diff
                    .map(
                        (d) =>
                            `    ${d.path}: ${JSON.stringify(d.from)} → ${JSON.stringify(d.to)}`,
                    )
                    .join("\n")
                : "    (no state change)";

        lines.push(
            `  [${signal.type}] ${signal.trigger.kind} "${signal.trigger.raw}" → ${signal.command.type} (scope: ${signal.group})`,
        );
        lines.push(diffStr);
    }

    lines.push(`══════ END ══════`);
    lines.push("");

    console.log(lines.join("\n"));
}
