/**
 * App Keybinding Registration — Unit Tests
 *
 * Tests that app-level custom keybindings can be registered/unregistered
 * via Keybindings.registerAll, and that they resolve correctly alongside
 * OS defaults.
 *
 * This validates the infrastructure that WidgetConfig.keybindings will use.
 */

import { afterEach, describe, expect, it } from "vitest";
import { Keybindings } from "../../keybindings";

// Side-effect import: registers all OS default keybindings
import "../../osDefaults";

// Mock app command factory
const mockDuplicate = Object.assign(
  (payload?: any) => ({ type: "todo/duplicateTodo", payload }),
  { type: "todo/duplicateTodo" },
);

const mockToggleView = Object.assign(
  (payload?: any) => ({ type: "todo/toggleView", payload }),
  { type: "todo/toggleView" },
);

describe("App Keybinding Registration", () => {
  let unregister: (() => void) | null = null;

  afterEach(() => {
    // Cleanup registered keybindings
    unregister?.();
    unregister = null;
  });

  it("registers app keybinding that resolves correctly", () => {
    unregister = Keybindings.registerAll([
      { key: "Meta+D", command: mockDuplicate, when: "navigating" },
    ]);

    const result = Keybindings.resolve("Meta+D", { isEditing: false });
    expect(result).not.toBeNull();
    expect(result?.command).toBe(mockDuplicate);
  });

  it("app keybinding does not resolve when editing", () => {
    unregister = Keybindings.registerAll([
      { key: "Meta+D", command: mockDuplicate, when: "navigating" },
    ]);

    const result = Keybindings.resolve("Meta+D", { isEditing: true });
    expect(result).toBeNull();
  });

  it("unregister removes app keybinding", () => {
    unregister = Keybindings.registerAll([
      { key: "Meta+D", command: mockDuplicate, when: "navigating" },
    ]);

    // Before unregister
    expect(Keybindings.resolve("Meta+D", { isEditing: false })).not.toBeNull();

    // Unregister
    unregister();
    unregister = null;

    // After unregister
    expect(Keybindings.resolve("Meta+D", { isEditing: false })).toBeNull();
  });

  it("multiple app keybindings register and resolve", () => {
    unregister = Keybindings.registerAll([
      { key: "Meta+D", command: mockDuplicate, when: "navigating" },
      { key: "Meta+Shift+V", command: mockToggleView, when: "navigating" },
    ]);

    expect(Keybindings.resolve("Meta+D", { isEditing: false })?.command).toBe(
      mockDuplicate,
    );

    expect(
      Keybindings.resolve("Meta+Shift+V", { isEditing: false })?.command,
    ).toBe(mockToggleView);
  });

  it("app keybinding does not conflict with OS defaults", () => {
    unregister = Keybindings.registerAll([
      { key: "Meta+D", command: mockDuplicate, when: "navigating" },
    ]);

    // OS default still works
    const arrowDown = Keybindings.resolve("ArrowDown", { isEditing: false });
    expect(arrowDown).not.toBeNull();

    // App custom works
    const metaD = Keybindings.resolve("Meta+D", { isEditing: false });
    expect(metaD).not.toBeNull();
    expect(metaD?.command).toBe(mockDuplicate);
  });
});
