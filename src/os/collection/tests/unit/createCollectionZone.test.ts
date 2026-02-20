import { describe, expect, it, vi } from "vitest";
import type { AppHandle, ZoneHandle } from "@/os/defineApp.types";
import {
  type CollectionConfig,
  createCollectionZone,
} from "../../createCollectionZone";

// unused import removed

describe("createCollectionZone", () => {
  // Mock AppHandle & ZoneHandle
  const mockCommand = vi.fn((type, handler) => {
    const factory = (payload: any) => handler({ state: mockState }, payload);
    factory.type = type;
    return factory;
  });

  const mockZone = {
    command: mockCommand,
    createZone: vi.fn(),
    bind: vi.fn((config) => config),
  } as unknown as ZoneHandle<any>;

  const mockApp = {
    createZone: vi.fn(() => mockZone),
  } as unknown as AppHandle<any>;

  // Mock State
  interface MockState {
    data: { items: { id: string; text: string }[] };
    ui: { clipboard: any };
  }
  const mockState: MockState = {
    data: {
      items: [
        { id: "A", text: "Item A" },
        { id: "B", text: "Item B" }, // Focus here
        { id: "C", text: "Item C" },
      ],
    },
    ui: { clipboard: null },
  };

  const config: CollectionConfig<MockState, { id: string; text: string }> = {
    accessor: (s) => s.data.items,
    clipboard: {
      accessor: (s) => s.ui.clipboard,
      set: (draft, val) => {
        draft.ui.clipboard = val;
      },
      toText: (items) => items.map((i) => i.text).join("\n"),
    },
  };

  it("onCopy with selection should copy all selected items", () => {
    const zone = createCollectionZone(mockApp, "test", config);
    const bindings = zone.collectionBindings();

    // 1. Simulate onCopy with Selection [A, B]
    // Note: ZoneCursor interface { focusId: string; selection: string[] }
    // Even if focus is B, if selecton is [A, B], copy should payload ids=[A, B]

    // We need to spy on the copy command execution
    // The command factory created by mockCommand will execute handler
    // But handler returns { state: ... }

    // Let's call bindings.onCopy and see what it returns/calls
    const result = bindings.onCopy({ focusId: "B", selection: ["A", "B"] });

    // result is the return value of copy({ ids: ["A", "B"] })
    // The handler (in mockCommand) executes and returns state update object

    expect(result).toBeDefined();
    // The state reducer is inside result.state (if using produce)
    // Actually our mockCommand executes handler immediately and returns the result object.

    // Check if result.state has updated clipboard
    // createCollectionZone uses produce() inside handler.
    // produce(state, recipe) -> nextState

    // Since we mocked command factory to execute handler({ state: mockState }, payload)
    // result should be { state: nextState, ... }

    const nextState = result.state;
    expect(nextState.ui.clipboard).not.toBeNull();
    expect(nextState.ui.clipboard.items).toHaveLength(2);
    expect(nextState.ui.clipboard.items[0].id).toBe("A");
    expect(nextState.ui.clipboard.items[1].id).toBe("B");
  });

  it("onCopy without selection should copy focused item", () => {
    const zone = createCollectionZone(mockApp, "test", config);
    const bindings = zone.collectionBindings();

    const result = bindings.onCopy({ focusId: "B", selection: [] });

    const nextState = result.state;
    expect(nextState.ui.clipboard.items).toHaveLength(1);
    expect(nextState.ui.clipboard.items[0].id).toBe("B");
  });
});
