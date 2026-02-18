/**
 * InspectorStore — Global Inspector UI state
 *
 * Manages open/close, active tab, panel expansion.
 * Persists to localStorage so state survives page reload.
 */

import { useSyncExternalStore } from "react";

// ─── Types ───

interface InspectorState {
  isOpen: boolean;
  activeTab: string;
  isPanelExpanded: boolean;
}

// ─── Persistence ───

const STORAGE_KEY = "inspector-ui";

function loadPersistedState(): Partial<InspectorState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      ...(typeof parsed.isOpen === "boolean" ? { isOpen: parsed.isOpen } : {}),
      ...(typeof parsed.activeTab === "string"
        ? { activeTab: parsed.activeTab }
        : {}),
      ...(typeof parsed.isPanelExpanded === "boolean"
        ? { isPanelExpanded: parsed.isPanelExpanded }
        : {}),
    };
  } catch {
    return {};
  }
}

function persistState(s: InspectorState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isOpen: s.isOpen,
        activeTab: s.activeTab,
        isPanelExpanded: s.isPanelExpanded,
      }),
    );
  } catch {
    // localStorage unavailable — ignore
  }
}

// ─── Vanilla Store ───

const DEFAULT_STATE: InspectorState = {
  isOpen: true,
  activeTab: "EVENTS",
  isPanelExpanded: false,
};

let state: InspectorState = { ...DEFAULT_STATE, ...loadPersistedState() };

const listeners = new Set<() => void>();

function emit() {
  persistState(state);
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

function setState(partial: Partial<InspectorState>) {
  state = { ...state, ...partial };
  emit();
}

function setActiveTab(tab: string) {
  setState({
    activeTab: tab,
    isPanelExpanded: state.activeTab === tab ? !state.isPanelExpanded : true,
  });
}

// ─── React Hook ───

interface InspectorHookState extends InspectorState {
  setActiveTab: (tab: string) => void;
  togglePanel: () => void;
}

export function useInspectorStore<T>(
  selector: (s: InspectorHookState) => T,
): T {
  return useSyncExternalStore(
    subscribe,
    () =>
      selector({
        ...getSnapshot(),
        setActiveTab,
        togglePanel: () =>
          setState({ isPanelExpanded: !state.isPanelExpanded }),
      }),
    () =>
      selector({
        ...getSnapshot(),
        setActiveTab,
        togglePanel: () =>
          setState({ isPanelExpanded: !state.isPanelExpanded }),
      }),
  );
}

// ─── Static API ───

export const InspectorStore = {
  isOpen: () => getSnapshot().isOpen,

  toggle: () => setState({ isOpen: !state.isOpen }),

  setOpen: (open: boolean) => setState({ isOpen: open }),

  setActiveTab: (tab: string) => setActiveTab(tab),

  setPanelExpanded: (expanded: boolean) =>
    setState({ isPanelExpanded: expanded }),
};
