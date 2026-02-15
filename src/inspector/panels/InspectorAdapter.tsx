/**
 * InspectorAdapter — Bridges Real Kernel Data to Unified Inspector
 *
 * Reads kernel transactions → passes directly to UnifiedInspector.
 * Pipeline inference lives in UnifiedInspector (pure function, testable).
 */

import { UnifiedInspector } from "@inspector/panels/UnifiedInspector.tsx";
import { kernel } from "@/os/kernel.ts";

export function InspectorAdapter() {
  // Subscribe to kernel changes to trigger re-renders
  kernel.useComputed((s) => s);
  const transactions = kernel.inspector.getTransactions();
  const storeState = kernel.getState();

  return (
    <UnifiedInspector
      transactions={[...transactions]}
      storeState={storeState}
    />
  );
}
