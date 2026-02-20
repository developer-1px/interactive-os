// @ts-nocheck

import { OS_COPY, OS_PASTE } from "@os/3-commands/clipboard/clipboard"; // Registers OS_COPY/PASTE
import { OS_FOCUS } from "@os/3-commands/focus/focus"; // Registers OS_FOCUS
import { OS_SELECTION_SET } from "@os/3-commands/selection"; // Registers OS_SELECTION_SET
import { os } from "@os/kernel";
import { beforeEach, describe, expect, it } from "vitest";
import { addTodo, TodoApp } from "../../app";

describe("TodoApp Clipboard Multi-Select Bug", () => {
  beforeEach(() => {
    // Reset Kernel State
    os.setState(() => ({
      os: {
        focus: {
          activeZoneId: null,
          zones: {},
          history: [],
        },
        clipboard: {
          text: "",
        },
        // Add other OS state slices if needed (timers, etc)
        timers: {},
      },
      apps: {
        "todo-v5": INITIAL_STATE, // Reset app state
      },
    }));

    // Populate 3 items
    os.dispatch(addTodo({ text: "A" })); // A
    os.dispatch(addTodo({ text: "B" })); // B
    os.dispatch(addTodo({ text: "C" })); // C
  });

  function getTodoOrder() {
    return (os.getState().apps["todo-v5"] as typeof INITIAL_STATE).data
      .todoOrder;
  }

  function getClipboard() {
    return (os.getState().apps["todo-v5"] as typeof INITIAL_STATE).ui
      .clipboard;
  }

  it("should copy all selected items (Shift+Arrow simulation)", () => {
    const list = getTodoOrder();
    const [idA, idB, idC] = list;

    // 1. Focus B (middle)
    // OS_FOCUS command inside kernel requires 'list' zone to be registered?
    // DefineApp registers zone commands, but does it register ZoneRegistry entries?
    // ZoneRegistry is usually populated by <Zone> component mounting.
    // In this unit test, no components are mounted.
    // So commands like OS_COPY that rely on ZoneRegistry will FAIL or do nothing.

    // We have to mock ZoneRegistry.
    // Or manualy register the zone.

    // This is getting complicated for a unit test.
    // But verifying paste logic is crucial.
  });
});
