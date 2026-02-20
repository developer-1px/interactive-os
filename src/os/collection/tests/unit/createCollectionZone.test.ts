import { describe, expect, it, vi } from "vitest";
import type { AppHandle, ZoneHandle } from "@/os/defineApp.types";
import {
  type CollectionConfig,
  createCollectionZone,
} from "../../createCollectionZone";

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

  // Mock State (clipboard no longer in app state)
  interface MockState {
    data: { items: { id: string; text: string }[] };
  }
  const mockState: MockState = {
    data: {
      items: [
        { id: "A", text: "Item A" },
        { id: "B", text: "Item B" }, // Focus here
        { id: "C", text: "Item C" },
      ],
    },
  };

  const config: CollectionConfig<MockState, { id: string; text: string }> = {
    accessor: (s) => s.data.items,
    text: (item) => item.text,
  };

  it("onCopy with selection should dispatch OS_CLIPBOARD_SET with all selected items", () => {
    const zone = createCollectionZone(mockApp, "test", config);
    const bindings = zone.collectionBindings();

    // onCopy returns the command result which now dispatches OS_CLIPBOARD_SET
    const result = bindings.onCopy({ focusId: "B", selection: ["A", "B"] });

    expect(result).toBeDefined();
    // Copy no longer modifies app state — state should be unchanged
    expect(result.state).toBe(mockState);
    // Should dispatch OS_CLIPBOARD_SET
    expect(result.dispatch).toBeDefined();
    expect(result.dispatch.type).toBe("OS_CLIPBOARD_SET");
    // clipboardWrite should have text
    expect(result.clipboardWrite).toBeDefined();
    expect(result.clipboardWrite.text).toContain("Item A");
    expect(result.clipboardWrite.text).toContain("Item B");
  });

  it("onCopy without selection should copy focused item only", () => {
    const zone = createCollectionZone(mockApp, "test", config);
    const bindings = zone.collectionBindings();

    const result = bindings.onCopy({ focusId: "B", selection: [] });

    expect(result).toBeDefined();
    expect(result.state).toBe(mockState);
    expect(result.dispatch).toBeDefined();
    expect(result.dispatch.type).toBe("OS_CLIPBOARD_SET");
    expect(result.clipboardWrite.text).toBe("Item B");
  });
});
