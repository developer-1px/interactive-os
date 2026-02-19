/**
 * InspectedElementStore — Shared state for the currently inspected DOM element.
 *
 * Communication flow:
 *   DebugManager (vite-plugins/) --CustomEvent--> this store (src/)
 *   ElementPanel reads from this store via vanilla hook.
 *
 * CustomEvent protocol:
 *   "inspector:element-selected"  → detail: { element: HTMLElement | null }
 *   "inspector:active-changed"    → detail: { active: boolean }
 */

import { useSyncExternalStore } from "react";

// ─── Types ───

export interface DebugSource {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  loc?: number;
}

export interface BoxModelData {
  width: number;
  height: number;
  display: string;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  borderTop: number;
  borderRight: number;
  borderBottom: number;
  borderLeft: number;
  rowGap: number;
  colGap: number;
  borderRadius: string;
}

export interface OSContext {
  zoneId: string | null;
  itemId: string | null;
}

export interface FiberPropsEntry {
  componentName: string;
  props: Record<string, unknown>;
}

export interface InspectedElementState {
  element: HTMLElement | null;
  isInspectorActive: boolean;

  // Derived data (computed when element changes)
  source: DebugSource | null;
  componentStack: string[];
  osComponentType: string | null;
  boxModel: BoxModelData | null;
  osContext: OSContext | null;
  fiberProps: FiberPropsEntry[];
  tagName: string;
  primitiveName: string;
}

// ─── Fiber Traversal Helpers (duplicated from vite-plugins/utils to avoid cross-boundary import) ───

function findFiberKey(el: HTMLElement): string | undefined {
  for (const k in el) {
    if (k.startsWith("__reactFiber$")) return k;
  }
  return undefined;
}

function getDebugSource(el: HTMLElement): DebugSource | null {
  const inspectorLine = el.getAttribute("data-inspector-line");
  const locAttr = el.getAttribute("data-inspector-loc");
  if (inspectorLine) {
    const parts = inspectorLine.split(":");
    const fileName = parts[0] ?? "";
    const line = parts[1] ?? "0";
    const col = parts[2] ?? "0";
    return {
      fileName,
      lineNumber: parseInt(line, 10),
      columnNumber: parseInt(col, 10),
      ...(locAttr ? { loc: parseInt(locAttr, 10) } : {}),
    };
  }

  const fiberKey = findFiberKey(el);
  if (!fiberKey) return null;
  // @ts-expect-error React internals
  let fiber = el[fiberKey];
  while (fiber) {
    if (fiber._debugSource) return fiber._debugSource;
    fiber = fiber.return;
  }
  return null;
}

function getComponentStack(el: HTMLElement): string[] {
  const fiberKey = findFiberKey(el);
  if (!fiberKey) return [];
  // @ts-expect-error React internals
  let fiber = el[fiberKey];
  const stack: string[] = [];
  while (fiber) {
    const type = fiber.type;
    let name = "";
    if (typeof type === "function") {
      name = type.displayName || type.name || "";
    } else if (type && typeof type === "object" && type.$$typeof) {
      const wrappedType = type.type || type.render;
      if (wrappedType) name = wrappedType.displayName || wrappedType.name || "";
    }
    if (name && name !== "Anonymous" && !stack.includes(name)) {
      stack.unshift(name);
    }
    fiber = fiber.return;
  }
  return stack;
}

const OS_COMPONENT_PATTERNS: Record<string, string> = {
  Zone: "Zone",
  FocusGroup: "Zone",
  Item: "Item",
  FocusItem: "Item",
  Field: "Field",
  Trigger: "Trigger",
};

function getOSComponentType(el: HTMLElement): string | null {
  const fiberKey = findFiberKey(el);
  if (!fiberKey) return null;
  // @ts-expect-error React internals
  let fiber = el[fiberKey];
  while (fiber) {
    const type = fiber.type;
    let name = "";
    if (typeof type === "function") {
      name = type.displayName || type.name || "";
    } else if (type && typeof type === "object" && type.$$typeof) {
      const wrappedType = type.type || type.render;
      if (wrappedType) name = wrappedType.displayName || wrappedType.name || "";
    }
    for (const [pattern] of Object.entries(OS_COMPONENT_PATTERNS)) {
      if (name === pattern || name.includes(pattern)) {
        return OS_COMPONENT_PATTERNS[pattern] ?? null;
      }
    }
    fiber = fiber.return;
  }
  return null;
}

function getBoxModel(el: HTMLElement): BoxModelData {
  const styles = window.getComputedStyle(el);
  const getVal = (val: string) => parseFloat(val) || 0;
  const rect = el.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    display: styles.display,
    marginTop: getVal(styles.marginTop),
    marginRight: getVal(styles.marginRight),
    marginBottom: getVal(styles.marginBottom),
    marginLeft: getVal(styles.marginLeft),
    paddingTop: getVal(styles.paddingTop),
    paddingRight: getVal(styles.paddingRight),
    paddingBottom: getVal(styles.paddingBottom),
    paddingLeft: getVal(styles.paddingLeft),
    borderTop: getVal(styles.borderTopWidth),
    borderRight: getVal(styles.borderRightWidth),
    borderBottom: getVal(styles.borderBottomWidth),
    borderLeft: getVal(styles.borderLeftWidth),
    rowGap: getVal(styles.rowGap) || getVal(styles.gap),
    colGap: getVal(styles.columnGap) || getVal(styles.gap),
    borderRadius: styles.borderRadius,
  };
}

function getOSContext(el: HTMLElement): OSContext | null {
  const zoneEl = el.closest("[data-zone-id]");
  const itemEl = el.closest("[data-item-id]");
  if (!zoneEl && !itemEl) return null;
  return {
    zoneId: zoneEl?.getAttribute("data-zone-id") ?? null,
    itemId: itemEl?.getAttribute("data-item-id") ?? null,
  };
}

function getFiberProps(el: HTMLElement): FiberPropsEntry[] {
  const fiberKey = findFiberKey(el);
  if (!fiberKey) return [];
  // @ts-expect-error React internals
  let fiber = el[fiberKey];
  const results: FiberPropsEntry[] = [];
  const seen = new Set<string>();

  while (fiber && results.length < 5) {
    const type = fiber.type;
    let name = "";
    if (typeof type === "function") {
      name = type.displayName || type.name || "";
    } else if (type && typeof type === "object" && type.$$typeof) {
      const wrappedType = type.type || type.render;
      if (wrappedType) name = wrappedType.displayName || wrappedType.name || "";
    }

    if (name && !seen.has(name) && fiber.memoizedProps) {
      seen.add(name);
      const raw = fiber.memoizedProps;
      const sanitized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (k === "children") {
          sanitized[k] =
            typeof v === "string"
              ? v
              : Array.isArray(v)
                ? `[${v.length} children]`
                : "ReactNode";
        } else if (typeof v === "function") {
          sanitized[k] = `ƒ ${v.name || "anonymous"}()`;
        } else if (v && typeof v === "object" && "$$typeof" in (v as any)) {
          sanitized[k] = "ReactElement";
        } else {
          sanitized[k] = v;
        }
      }
      results.push({ componentName: name, props: sanitized });
    }
    fiber = fiber.return;
  }
  return results;
}

// ─── Derivation helper ───

function deriveAll(el: HTMLElement | null) {
  if (!el) {
    return {
      source: null,
      componentStack: [],
      osComponentType: null,
      boxModel: null,
      osContext: null,
      fiberProps: [],
      tagName: "",
      primitiveName: "",
    };
  }
  return {
    source: getDebugSource(el),
    componentStack: getComponentStack(el),
    osComponentType: getOSComponentType(el),
    boxModel: getBoxModel(el),
    osContext: getOSContext(el),
    fiberProps: getFiberProps(el),
    tagName: el.tagName.toLowerCase(),
    primitiveName: el.getAttribute("data-primitive") || "",
  };
}

// ─── Vanilla Store ───

const DEFAULT_STATE: InspectedElementState = {
  element: null,
  isInspectorActive: false,
  source: null,
  componentStack: [],
  osComponentType: null,
  boxModel: null,
  osContext: null,
  fiberProps: [],
  tagName: "",
  primitiveName: "",
};

let state: InspectedElementState = { ...DEFAULT_STATE };

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot() {
  return state;
}

// ─── React Hook ───
// Consumer uses no-arg: useInspectedElementStore() → full state

export function useInspectedElementStore(): InspectedElementState;
export function useInspectedElementStore<T>(
  selector: (s: InspectedElementState) => T,
): T;
export function useInspectedElementStore<T>(
  selector?: (s: InspectedElementState) => T,
): T | InspectedElementState {
  const sel = selector ?? ((s: InspectedElementState) => s as unknown as T);
  return useSyncExternalStore(
    subscribe,
    () => sel(getSnapshot()),
    () => sel(getSnapshot()),
  );
}

// ─── Actions ───

function setElement(el: HTMLElement | null) {
  state = { ...state, element: el, ...deriveAll(el) };
  emit();
}

function setInspectorActive(active: boolean) {
  state = { ...state, isInspectorActive: active };
  emit();
  if (!active) setElement(null);
}

// ─── CustomEvent Listeners (bridge from vite-plugins) ───

function handleElementSelected(e: Event) {
  const detail = (e as CustomEvent).detail;
  setElement(detail?.element ?? null);
}

function handleActiveChanged(e: Event) {
  const detail = (e as CustomEvent).detail;
  setInspectorActive(detail?.active ?? false);
}

// Auto-subscribe on module load
window.addEventListener("inspector:element-selected", handleElementSelected);
window.addEventListener("inspector:active-changed", handleActiveChanged);
