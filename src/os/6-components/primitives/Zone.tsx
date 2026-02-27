/**
 * Zone — OS interaction jurisdiction.
 *
 * Zone is the ONLY interaction component.
 * It provides ZoneContext (unified identity + focus config),
 * registers with the kernel, and renders the container div with ARIA props.
 *
 * Pure logic (zoneLogic.ts):
 *   - Config resolution  → createZoneConfig()
 *   - Context value      → createZoneContext()
 *   - Container props    → computeContainerProps()
 *   - Entry building     → buildZoneEntry()
 *
 * Context hook:
 *   - useZoneContext() — { zoneId, scope, config, role }
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry.ts";
import {
  buildZoneEntry,
  computeContainerProps,
  createZoneConfig,
  createZoneContext,
  generateZoneId,
  type ZoneCallbacks,
  type ZoneContextValue,
  type ZoneOptions,
} from "@os/2-contexts/zoneLogic.ts";
import {
  OS_FOCUS,
  OS_STACK_POP,
  OS_STACK_PUSH,
  OS_ZONE_INIT,
} from "@os/3-commands/focus";
import { os } from "@os/kernel.ts";
import type { ZoneRole } from "@os/registries/roleRegistry.ts";
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

export type { ZoneContextValue } from "@os/2-contexts/zoneLogic.ts";

export const ZoneContext = createContext<ZoneContextValue | null>(null);

/** Read zone context: { zoneId, scope, config, role }. */
export function useZoneContext() {
  return useContext(ZoneContext);
}

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

export type { ZoneOptions } from "@os/2-contexts/zoneLogic.ts";

type DivOmit = "id" | "role" | "onSelect" | "onCopy" | "onCut" | "onPaste" | "onCheck";

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
  id, role, options, children, className, style,
  onAction, onSelect, onCheck, onDelete, onMoveUp, onMoveDown,
  onCopy, onCut, onPaste, onUndo, onRedo, onDismiss,
  itemFilter, getItems, getExpandableItems, getTreeLevels, onReorder,
  ...rest
}: ZoneProps) {
  // ─── Pure: ID, config, context ───
  const zoneId = useMemo(() => id || generateZoneId(), [id]);
  const config = useMemo(() => createZoneConfig(role, options), [role, options]);
  const contextValue = useMemo(() => createZoneContext(zoneId, config, role), [zoneId, config, role]);

  // ─── Callbacks ref (stable, avoids deps churn) ───
  const callbacks: ZoneCallbacks = {
    onAction, onSelect, onCheck, onDelete, onMoveUp, onMoveDown,
    onCopy, onCut, onPaste, onUndo, onRedo, onDismiss,
    itemFilter, getItems, getExpandableItems, getTreeLevels, onReorder,
  };
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  // ─── Lifecycle: registration (render-time, headless-safe) ───
  useMemo(() => {
    const existing = ZoneRegistry.get(zoneId);
    ZoneRegistry.register(zoneId, buildZoneEntry(config, role, null, cbRef.current, existing));
  }, [zoneId, config, role]);

  // ─── Lifecycle: commit-phase (dispatch + DOM binding) ───
  const containerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    os.dispatch(OS_ZONE_INIT(zoneId));

    if (!ZoneRegistry.has(zoneId)) {
      ZoneRegistry.register(zoneId, buildZoneEntry(config, role, null, cbRef.current));
    }

    if (containerRef.current) {
      ZoneRegistry.bindElement(zoneId, containerRef.current);
    }

    if (config.project.autoFocus) {
      const items = ZoneRegistry.resolveItems(zoneId);
      os.dispatch(OS_FOCUS({ zoneId, itemId: items[0] ?? null }));
    }

    return () => { ZoneRegistry.unregister(zoneId); };
  }, [zoneId, config, role]);

  // ─── Lifecycle: focus stack (dialog/alertdialog) ───
  useLayoutEffect(() => {
    if (!config.project.autoFocus) return;
    os.dispatch(OS_STACK_PUSH());
    return () => { os.dispatch(OS_STACK_POP()); };
  }, [config.project.autoFocus]);

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
