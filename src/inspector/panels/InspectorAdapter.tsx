/**
 * InspectorAdapter — Bridges Real Kernel Data to Unified Inspector
 *
 * Reads kernel transactions → passes directly to UnifiedInspector.
 * Pipeline inference lives in UnifiedInspector (pure function, testable).
 */

import { UnifiedInspector } from "@inspector/panels/UnifiedInspector.tsx";
import { useState, useSyncExternalStore } from "react";
import { os } from "@/os/kernel.ts";

export function InspectorAdapter() {
  // Intentional: Inspector must re-render on ALL state changes.
  // Uses useSyncExternalStore directly — useComputed is primitive-only.
  useSyncExternalStore(os.subscribe, os.getState, os.getState);

  // clearTransactions() doesn't trigger state change → needs explicit re-render
  const [, bumpVersion] = useState(0);

  const transactions = os.inspector.getTransactions();
  const storeState = os.getState();

  return (
    <UnifiedInspector
      transactions={[...transactions]}
      storeState={storeState as any}
      onClear={() => {
        os.inspector.clearTransactions();
        bumpVersion((n) => n + 1);
      }}
    />
  );
}
