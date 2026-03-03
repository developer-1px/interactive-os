/**
 * L4. ZoneRegistry — Unit Tests
 *
 * 순수 Map 저장소. DOM element는 mock으로 대체.
 * register/get/unregister, 콜백 필드 보존 검증.
 */

import type {
  ZoneCallback,
  ZoneEntry,
} from "@os-core/engine/registries/zoneRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { afterEach, describe, expect, it } from "vitest";

const mockEntry = (overrides: Partial<ZoneEntry> = {}): ZoneEntry => ({
  config: {} as Partial<ZoneEntry["config"]> as ZoneEntry["config"],
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
    const toggle = { type: "TOGGLE_TODO", payload: { id: "OS.OS_FOCUS" } };
    ZoneRegistry.register(
      "listView",
      mockEntry({ onCheck: toggle as ZoneCallback }),
    );
    expect(ZoneRegistry.get("listView")?.onCheck).toBe(toggle);
  });

  it("preserves onAction callback", () => {
    const action = { type: "START_EDIT", payload: { id: "OS.OS_FOCUS" } };
    ZoneRegistry.register(
      "listView",
      mockEntry({ onAction: action as ZoneCallback }),
    );
    expect(ZoneRegistry.get("listView")?.onAction).toBe(action);
  });

  it("preserves onDelete callback", () => {
    const del = { type: "DELETE_TODO", payload: { id: "OS.OS_FOCUS" } };
    ZoneRegistry.register(
      "listView",
      mockEntry({ onDelete: del as ZoneCallback }),
    );
    expect(ZoneRegistry.get("listView")?.onDelete).toBe(del);
  });

  it("preserves onMoveUp and onMoveDown callbacks", () => {
    const moveUp = { type: "MOVE_UP", payload: { focusId: "OS.OS_FOCUS" } };
    const moveDown = { type: "MOVE_DOWN", payload: { focusId: "OS.OS_FOCUS" } };
    ZoneRegistry.register(
      "listView",
      mockEntry({
        onMoveUp: moveUp as ZoneCallback,
        onMoveDown: moveDown as ZoneCallback,
      }),
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
        onCopy: copy as ZoneCallback,
        onCut: cut as ZoneCallback,
        onPaste: paste as ZoneCallback,
      }),
    );
    const entry = ZoneRegistry.get("listView");
    expect(entry?.onCopy).toBe(copy);
    expect(entry?.onCut).toBe(cut);
    expect(entry?.onPaste).toBe(paste);
  });

  it("overwrites entry on re-register", () => {
    const toggle1 = { type: "TOGGLE_V1" } as ZoneCallback;
    const toggle2 = { type: "TOGGLE_V2" } as ZoneCallback;
    ZoneRegistry.register("z", mockEntry({ onCheck: toggle1 }));
    ZoneRegistry.register("z", mockEntry({ onCheck: toggle2 }));
    expect(ZoneRegistry.get("z")?.onCheck).toBe(toggle2);
  });

  // ─── subscribe / getSnapshot ───────────────────────────────────
  // Note: notifications are deferred via queueMicrotask (render-safe)

  const flush = () => new Promise<void>((r) => queueMicrotask(r));

  it("subscribe fires on new zone registration", async () => {
    const calls: string[] = [];
    const unsub = ZoneRegistry.subscribe(() => calls.push("notified"));
    ZoneRegistry.register("sub-zone", mockEntry());
    await flush();
    expect(calls).toEqual(["notified"]);
    unsub();
    ZoneRegistry.register("sub-zone-2", mockEntry());
    await flush();
    expect(calls).toEqual(["notified"]); // no second call after unsub
  });

  it("subscribe fires on unregister", async () => {
    ZoneRegistry.register("unreg-zone", mockEntry());
    await flush();
    const calls: number[] = [];
    const unsub = ZoneRegistry.subscribe(() => calls.push(1));
    ZoneRegistry.unregister("unreg-zone");
    await flush();
    expect(calls).toEqual([1]);
    unsub();
  });

  it("subscribe does NOT fire on re-register (same id)", async () => {
    ZoneRegistry.register("same-zone", mockEntry());
    await flush();
    const calls: number[] = [];
    const unsub = ZoneRegistry.subscribe(() => calls.push(1));
    ZoneRegistry.register("same-zone", mockEntry()); // re-register
    await flush();
    expect(calls).toEqual([]); // no notification
    unsub();
  });

  it("getSnapshot returns current zone IDs", async () => {
    ZoneRegistry.register("snap-a", mockEntry());
    ZoneRegistry.register("snap-b", mockEntry());
    await flush();
    const snap = ZoneRegistry.getSnapshot();
    expect(snap).toContain("snap-a");
    expect(snap).toContain("snap-b");
  });

  it("getSnapshot updates after unregister", async () => {
    ZoneRegistry.register("snap-c", mockEntry());
    await flush();
    ZoneRegistry.unregister("snap-c");
    await flush();
    expect(ZoneRegistry.getSnapshot()).not.toContain("snap-c");
  });

  it("dedupes notifications for multiple changes in same microtask", async () => {
    const calls: number[] = [];
    const unsub = ZoneRegistry.subscribe(() => calls.push(1));
    ZoneRegistry.register("dup-a", mockEntry());
    ZoneRegistry.register("dup-b", mockEntry());
    ZoneRegistry.register("dup-c", mockEntry());
    await flush();
    expect(calls).toEqual([1]); // only 1 notification despite 3 registers
    unsub();
  });
});
