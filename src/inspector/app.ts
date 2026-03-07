import type { Transaction } from "@kernel/core/transaction";
import { defineApp } from "@os-sdk/app/defineApp";
import { OS_ACTIVATE } from "@os-sdk/os";
import { enableMapSet, produce } from "immer";
import { inferSignal } from "./utils/inferSignal";

enableMapSet();

export interface InspectorState {
  searchQuery: string;
  disabledGroups: Set<string>;
  isUserScrolled: boolean;
  scrollTick: number;
}

const INITIAL_STATE: InspectorState = {
  searchQuery: "",
  disabledGroups: new Set(),
  isUserScrolled: false,
  scrollTick: 0,
};

export const InspectorApp = defineApp<InspectorState>(
  "inspector",
  INITIAL_STATE,
);

// ─── Search Zone ───
const searchZone = InspectorApp.createZone("inspector-search");

export const updateSearchQuery = searchZone.command(
  "updateSearchQuery",
  // Map value or text payload, tests usually do string text or value
  (ctx, payload: { value?: string; text?: string }) => ({
    state: produce(ctx.state, (draft) => {
      draft.searchQuery = payload.value ?? payload.text ?? "";
    }),
  }),
);

export const clearSearchQuery = searchZone.command(
  "clearSearchQuery",
  (ctx) => ({
    state: produce(ctx.state, (draft) => {
      draft.searchQuery = "";
    }),
  }),
);

export const InspectorSearchUI = searchZone.bind({
  role: "textbox",
  field: {
    onCommit: updateSearchQuery,
    trigger: "change",
  },
  options: { inputmap: { click: [OS_ACTIVATE()] } },
  triggers: [{ id: "clearBtn", onActivate: clearSearchQuery() }],
});

export const InspectorSearch = {
  ...InspectorSearchUI,
};

// ─── Filters Zone ───
const filtersZone = InspectorApp.createZone("inspector-filters");

export const toggleGroup = filtersZone.command(
  "toggleGroup",
  (ctx, payload: { group: string }) => ({
    state: produce(ctx.state, (draft) => {
      if (draft.disabledGroups.has(payload.group)) {
        draft.disabledGroups.delete(payload.group);
      } else {
        draft.disabledGroups.add(payload.group);
      }
    }),
  }),
);

export const InspectorFiltersUI = filtersZone.bind({
  role: "toolbar",
  options: { inputmap: { click: [OS_ACTIVATE()] } },
  triggers: [
    { id: "groupBtn-kernel", onActivate: toggleGroup({ group: "kernel" }) },
  ],
});

export const InspectorFilters = {
  ...InspectorFiltersUI,
};

// ─── Scroll Zone ───
const scrollZone = InspectorApp.createZone("inspector-scroll");

export const INSPECTOR_SCROLL_TO_BOTTOM = scrollZone.command(
  "INSPECTOR_SCROLL_TO_BOTTOM",
  (ctx) => ({
    state: produce(ctx.state, (draft) => {
      draft.isUserScrolled = false;
      draft.scrollTick++;
    }),
  }),
);

export const setScrollState = scrollZone.command(
  "setScrollState",
  (ctx, payload: { isUserScrolled: boolean }) => ({
    state: produce(ctx.state, (draft) => {
      draft.isUserScrolled = payload.isUserScrolled;
    }),
  }),
);

export const InspectorScrollUI = scrollZone.bind({
  role: "toolbar", // using a generic role
  options: { inputmap: { click: [OS_ACTIVATE()] } },
  triggers: [
    { id: "scrollToBottomBtn", onActivate: INSPECTOR_SCROLL_TO_BOTTOM() },
  ],
});

export function selectFilteredTransactions(
  state: InspectorState,
  transactions: Transaction[],
): Transaction[] {
  let result = transactions;

  if (state.disabledGroups.size > 0) {
    result = result.filter(
      (tx) => !state.disabledGroups.has(inferSignal(tx).group),
    );
  }

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    result = result.filter((tx) => {
      const signal = inferSignal(tx);
      if (signal.command.type.toLowerCase().includes(q)) return true;
      if (signal.trigger.raw.toLowerCase().includes(q)) return true;
      if (signal.trigger.elementId?.toLowerCase().includes(q)) return true;
      if (signal.effects.some((e) => e.toLowerCase().includes(q))) return true;
      if (signal.diff.some((d) => d.path.toLowerCase().includes(q)))
        return true;
      return false;
    });
  }

  return result;
}
