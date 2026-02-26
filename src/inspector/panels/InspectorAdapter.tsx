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
  // tx-aware snapshot: re-render on ANY dispatch (state change or not).
  // useSyncExternalStore compares snapshot by Object.is — txCount changes on every dispatch.
  const getSnapshot = () => os.inspector.getTransactions().length;
  useSyncExternalStore(os.subscribe, getSnapshot, getSnapshot);

  // clearTransactions() doesn't trigger dispatch → needs explicit re-render
  const [, bumpVersion] = useState(0);

  const transactions = os.inspector.getTransactions();
  const storeState = os.getState();

  return (
    <UnifiedInspector
      transactions={[...transactions]}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inspector store state mismatch
      storeState={storeState as any}
      onClear={() => {
        os.inspector.clearTransactions();
        bumpVersion((n) => n + 1);
      }}
    />
  );
}
