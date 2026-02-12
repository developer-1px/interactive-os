/**
 * PipelineAdapter — Feeds kernel transactions to PipelineInspector.
 */

import { PipelineInspector } from "@inspector/panels/PipelineInspector.tsx";
import { kernel } from "@/os-new/kernel.ts";

export function PipelineAdapter() {
    kernel.useComputed((s) => s);
    const transactions = kernel.getTransactions();
    return <PipelineInspector transactions={[...transactions]} />;
}
