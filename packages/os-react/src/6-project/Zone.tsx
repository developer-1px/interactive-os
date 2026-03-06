/**
 * Zone — OS interaction jurisdiction.
 *
 * Zone is the ONLY interaction component.
 * It provides ZoneContext (unified identity + focus config),
 * registers with the kernel, and renders the container div with ARIA props.
 *
 * Pure logic (zoneContext.ts):
 *   - Config resolution  → createZoneConfig()
 *   - Context value      → createZoneContext()
 *   - Container props    → computeContainerProps()
 *   - Entry building     → buildZoneEntry()
 *
 * Context hook:
 *   - useZoneContext() — { zoneId, scope, config, role }
 */

import {
  buildZoneEntry,
  computeContainerProps,
  createZoneConfig,
  createZoneContext,
  generateZoneId,
  type ZoneCallbacks,
  type ZoneContextValue,
  type ZoneOptions,
} from "@os-core/3-inject/zoneContext.ts";

import { OS_FOCUS } from "@os-core/4-command/focus/focus.ts";
import type { AppState } from "@os-core/engine/kernel.ts";
import { os } from "@os-core/engine/kernel.ts";
import type { ZoneRole } from "@os-core/engine/registries/roleRegistry.ts";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry.ts";
import { ensureZone } from "@os-core/schema/state/utils.ts";
import { produce } from "immer";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

// ═══════════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════════

export type { ZoneContextValue } from "@os-core/3-inject/zoneContext.ts";

export const ZoneContext = createContext<ZoneContextValue | null>(null);

/** Read zone context: { zoneId, scope, config, role }. */
export function useZoneContext() {
  return useContext(ZoneContext);
}

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

export type { ZoneOptions } from "@os-core/3-inject/zoneContext.ts";

type DivOmit =
  | "id"
  | "role"
  | "onSelect"
  | "onCopy"
  | "onCut"
  | "onPaste"
  | "onCheck";

export interface ZoneProps
  extends Omit<ComponentProps<"div">, DivOmit | keyof ZoneCallbacks>,
    ZoneCallbacks {
  id?: string;
  role?: ZoneRole;
  options?: ZoneOptions;
  children: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════
// Zone — the only interaction component
// ═══════════════════════════════════════════════════════════════════

export function Zone({
  id,
  role,
  options,
  children,
  className,
  style,
  onAction,
  onSelect,
  onCheck,
  onDelete,
  onMoveUp,
  onMoveDown,
  onCopy,
  onCut,
  onPaste,
  onUndo,
  onRedo,
  onDismiss,
  itemFilter,
  getItems,
  getExpandableItems,
  getTreeLevels,
  onReorder,
  ...rest
}: ZoneProps) {
  // ─── Pure: ID, config, context ───
  const zoneId = useMemo(() => id || generateZoneId(), [id]);
  const config = useMemo(
    () => createZoneConfig(role, options),
    [role, options],
  );
  const contextValue = useMemo(
    () => createZoneContext(zoneId, config, role),
    [zoneId, config, role],
  );

  // ─── Callbacks ref (stable, avoids deps churn) ───
  const callbacks: ZoneCallbacks = {
    onAction,
    onSelect,
    onCheck,
    onDelete,
    onMoveUp,
    onMoveDown,
    onCopy,
    onCut,
    onPaste,
    onUndo,
    onRedo,
    onDismiss,
    itemFilter,
    getItems,
    getExpandableItems,
    getTreeLevels,
    onReorder,
  };
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  // ─── Lifecycle: registration (render-time, headless-safe) ───
  useMemo(() => {
    const existing = ZoneRegistry.get(zoneId);
    ZoneRegistry.register(
      zoneId,
      buildZoneEntry(config, role, null, cbRef.current, existing),
    );
  }, [zoneId, config, role]);

  // ─── Lifecycle: commit-phase (dispatch + DOM binding) ───
  const containerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!ZoneRegistry.has(zoneId)) {
      ZoneRegistry.register(
        zoneId,
        buildZoneEntry(config, role, null, cbRef.current),
      );
    }

    if (containerRef.current) {
      ZoneRegistry.bindElement(zoneId, containerRef.current);
    }

    // ─── Declarative initial values (Zero Drift: no useEffect dispatch) ───
    const initialValues = config.value?.initial;
    if (initialValues && Object.keys(initialValues).length > 0) {
      os.setState((s: AppState) =>
        produce(s, (draft) => {
          const z = ensureZone(draft.os, zoneId);
          for (const [itemId, value] of Object.entries(initialValues)) {
            if (z.valueNow[itemId] === undefined) {
              z.valueNow[itemId] = value;
            }
          }
        }),
      );
    }

    // ─── AutoFocus (Zero Drift WP5+6: overlay entry → OS_FOCUS) ───
    if (config.project?.autoFocus) {
      // WP5: Check overlay stack for entry hint ("first" | "last")
      const overlayEntry = os
        .getState()
        .os.overlays.stack.find((e) => e.id === zoneId);
      const entry = overlayEntry?.entry ?? "first";

      // WP6: Resolve items and dispatch OS_FOCUS
      const items = ZoneRegistry.resolveItems(zoneId);
      if (items.length > 0) {
        const targetItem =
          entry === "last" ? items[items.length - 1] : items[0];
        os.dispatch(OS_FOCUS({ zoneId, itemId: targetItem }));
      }
    }

    return () => {
      ZoneRegistry.unregister(zoneId);
    };
  }, [zoneId, config, role]);

  // ─── Reactive: active zone subscription ───
  const isActive = os.useComputed((s) => s.os.focus.activeZoneId === zoneId);

  // ─── Pure: container props ───
  const containerProps = computeContainerProps(zoneId, config, isActive, role);

  // ─── Render ───
  return (
    <ZoneContext.Provider value={contextValue}>
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is dynamic */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        {...containerProps}
        className={className || undefined}
        style={{ outline: "none", ...style }}
        {...rest}
      >
        {children}
      </div>
    </ZoneContext.Provider>
  );
}
