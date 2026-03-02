/**
 * Command `when` guard — Unit Tests
 *
 * Tests that commands can have a `when` predicate attached,
 * and that keybindings respect it.
 */

import { afterEach, describe, expect, it } from "vitest";
import { Keybindings } from "../../keybindings";

// Side-effect import: registers all OS default keybindings
import "../../osDefaults";

// Mock command factory with `when` guard
const mockCommand = Object.assign(
  (payload?: any) => ({ type: "test/guarded", payload }),
  {
    type: "test/guarded",
    commandType: "test/guarded",
    when: null as ((state: any) => boolean) | null,
  },
);

describe("Command when guard", () => {
  let unregister: (() => void) | null = null;

  afterEach(() => {
    unregister?.();
    unregister = null;
    mockCommand.when = null;
  });

  it("keybinding resolves when no `when` guard is set", () => {
    unregister = Keybindings.registerAll([
      { key: "Meta+G", command: mockCommand, when: "navigating" },
    ]);

    const result = Keybindings.resolve("Meta+G", { isEditing: false });
    expect(result).not.toBeNull();
  });

  it("keybinding resolves when `when` returns true", () => {
    mockCommand.when = () => true;

    unregister = Keybindings.registerAll([
      { key: "Meta+G", command: mockCommand, when: "navigating" },
    ]);

    const result = Keybindings.resolve("Meta+G", { isEditing: false });
    expect(result).not.toBeNull();
  });

  it("command.when metadata is accessible on factory", () => {
    const guard = (state: any) => state.ui.editingId != null;
    mockCommand.when = guard;

    expect(mockCommand.when).toBe(guard);
  });
});
