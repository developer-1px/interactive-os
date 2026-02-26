import { describe, expect, it, vi } from "vitest";
import type { AppHandle, ZoneHandle } from "@/os/defineApp.types";
import {
  _resetClipboardStore,
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

  // Mock State
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

  it("onCopy with selection should copy all selected items to clipboard store", () => {
    _resetClipboardStore();
    const zone = createCollectionZone(mockApp, "test", config);
    const bindings = zone.collectionBindings();

    const result = bindings.onCopy({ focusId: "B", selection: ["A", "B"] }) as unknown as Record<string, unknown>;

    expect(result).toBeDefined();
    // Copy does not modify app state
    expect(result["state"]).toBe(mockState);
    // No OS_CLIPBOARD_SET dispatch — _clipboardStore is single source of truth
    // clipboardWrite should have text for native clipboard
    const cw = result["clipboardWrite"] as Record<string, unknown>;
    expect(cw).toBeDefined();
    expect(cw["text"]).toContain("Item A");
    expect(cw["text"]).toContain("Item B");

    // readClipboard should reflect what was copied
    const preview = zone.readClipboard() as { id: string };
    expect(preview).toBeDefined();
    expect(preview.id).toBe("A");
  });

  it("onCopy without selection should copy focused item only", () => {
    _resetClipboardStore();
    const zone = createCollectionZone(mockApp, "test", config);
    const bindings = zone.collectionBindings();

    const result = bindings.onCopy({ focusId: "B", selection: [] }) as unknown as Record<string, unknown>;

    expect(result).toBeDefined();
    expect(result["state"]).toBe(mockState);
    expect((result["clipboardWrite"] as Record<string, unknown>)["text"]).toBe("Item B");

    // readClipboard should return the single copied item
    const preview = zone.readClipboard() as { id: string };
    expect(preview.id).toBe("B");
  });

  it("copyText writes text data to clipboard store", () => {
    _resetClipboardStore();
    const zone = createCollectionZone(mockApp, "test", config);

    zone.copyText("Hello World");

    const preview = zone.readClipboard() as { type: string; value: string };
    expect(preview).toBeDefined();
    expect(preview.type).toBe("text");
    expect(preview.value).toBe("Hello World");
  });

  it("readClipboard returns null when clipboard is empty", () => {
    _resetClipboardStore();
    const zone = createCollectionZone(mockApp, "test", config);

    expect(zone.readClipboard()).toBeNull();
  });
});
