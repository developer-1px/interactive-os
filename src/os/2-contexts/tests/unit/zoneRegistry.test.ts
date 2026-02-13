/**
 * L4. ZoneRegistry — Unit Tests
 *
 * 순수 Map 저장소. DOM element는 mock으로 대체.
 * register/get/unregister, 콜백 필드 보존 검증.
 */

import { afterEach, describe, expect, it } from "vitest";
import type { ZoneEntry } from "../../zoneRegistry";
import { ZoneRegistry } from "../../zoneRegistry";

const mockEntry = (overrides: Partial<ZoneEntry> = {}): ZoneEntry => ({
  config: {} as any,
  element: document.createElement("div"),
  parentId: null,
  ...overrides,
});

describe("ZoneRegistry", () => {
  afterEach(() => {
    // Cleanup all registered zones
    for (const key of [...ZoneRegistry.keys()]) {
      ZoneRegistry.unregister(key);
    }
  });

  it("registers and retrieves a zone entry", () => {
    ZoneRegistry.register("test-zone", mockEntry());
    expect(ZoneRegistry.get("test-zone")).toBeDefined();
    expect(ZoneRegistry.has("test-zone")).toBe(true);
  });

  it("returns undefined for unregistered zone", () => {
    expect(ZoneRegistry.get("nonexistent")).toBeUndefined();
    expect(ZoneRegistry.has("nonexistent")).toBe(false);
  });

  it("unregister removes the entry", () => {
    ZoneRegistry.register("test-zone", mockEntry());
    ZoneRegistry.unregister("test-zone");
    expect(ZoneRegistry.get("test-zone")).toBeUndefined();
  });

  it("preserves onCheck callback", () => {
    const toggle = { type: "TOGGLE_TODO", payload: { id: "OS.FOCUS" } };
    ZoneRegistry.register("listView", mockEntry({ onCheck: toggle as any }));
    expect(ZoneRegistry.get("listView")?.onCheck).toBe(toggle);
  });

  it("preserves onAction callback", () => {
    const action = { type: "START_EDIT", payload: { id: "OS.FOCUS" } };
    ZoneRegistry.register("listView", mockEntry({ onAction: action as any }));
    expect(ZoneRegistry.get("listView")?.onAction).toBe(action);
  });

  it("preserves onDelete callback", () => {
    const del = { type: "DELETE_TODO", payload: { id: "OS.FOCUS" } };
    ZoneRegistry.register("listView", mockEntry({ onDelete: del as any }));
    expect(ZoneRegistry.get("listView")?.onDelete).toBe(del);
  });

  it("preserves onMoveUp and onMoveDown callbacks", () => {
    const moveUp = { type: "MOVE_UP", payload: { focusId: "OS.FOCUS" } };
    const moveDown = { type: "MOVE_DOWN", payload: { focusId: "OS.FOCUS" } };
    ZoneRegistry.register(
      "listView",
      mockEntry({ onMoveUp: moveUp as any, onMoveDown: moveDown as any }),
    );
    const entry = ZoneRegistry.get("listView");
    expect(entry?.onMoveUp).toBe(moveUp);
    expect(entry?.onMoveDown).toBe(moveDown);
  });

  it("preserves clipboard callbacks", () => {
    const copy = { type: "COPY", payload: {} };
    const cut = { type: "CUT", payload: {} };
    const paste = { type: "PASTE", payload: {} };
    ZoneRegistry.register(
      "listView",
      mockEntry({
        onCopy: copy as any,
        onCut: cut as any,
        onPaste: paste as any,
      }),
    );
    const entry = ZoneRegistry.get("listView");
    expect(entry?.onCopy).toBe(copy);
    expect(entry?.onCut).toBe(cut);
    expect(entry?.onPaste).toBe(paste);
  });

  it("overwrites entry on re-register", () => {
    const toggle1 = { type: "TOGGLE_V1" } as any;
    const toggle2 = { type: "TOGGLE_V2" } as any;
    ZoneRegistry.register("z", mockEntry({ onCheck: toggle1 }));
    ZoneRegistry.register("z", mockEntry({ onCheck: toggle2 }));
    expect(ZoneRegistry.get("z")?.onCheck).toBe(toggle2);
  });
});
