import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { produce } from "immer";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
// Ensure listeners are mounted for the test
import { KeyboardListener } from "@/os/1-listeners/keyboard/KeyboardListener";
import { MouseListener } from "@/os/1-listeners/mouse/MouseListener";
import { OS_FOCUS } from "@/os/3-commands/focus";
import { os } from "@/os/kernel";
import { TreePattern } from "../../patterns/TreePattern";

describe("TreePattern (APG Showcase) - E2E", () => {
  beforeEach(() => {
    os.setState((state) =>
      produce(state, (draft) => {
        draft.os.focus.zones = {};
        draft.os.focus.activeZoneId = null;
      }),
    );
  });

  it("should expand and collapse using ArrowRight / ArrowLeft", async () => {
    const user = userEvent.setup();

    render(
      <>
        <KeyboardListener />
        <TreePattern />
      </>,
    );

    // Initial state check
    const docNode = screen.getByRole("treeitem", { name: /Documents/i });
    expect(docNode.getAttribute("aria-expanded")).not.toBe("true"); // initially collapsed

    // Focus the node to simulate real interaction constraints
    // Using explicit OS dispatch since FocusItem relies on global FocusListener/MouseListener which aren't mounted in this minimal test
    docNode.focus();
    os.dispatch(OS_FOCUS({ zoneId: "apg-tree", itemId: "node-1" }));
    await new Promise((r) => setTimeout(r, 50)); // allow state to settle

    // ArrowRight should expand the node
    await user.keyboard("{ArrowRight}");
    await new Promise((r) => setTimeout(r, 200));

    // Should now be expanded
    expect(docNode.getAttribute("aria-expanded")).toBe("true");

    // Children should now be visible
    expect(screen.getByRole("treeitem", { name: /Resume.pdf/i })).toBeTruthy();

    // ArrowLeft should collapse it back down
    await user.keyboard("{ArrowLeft}");
    await new Promise((r) => setTimeout(r, 200));
    expect(docNode.getAttribute("aria-expanded")).not.toBe("true");

    // Resume should be hidden again (React unmounts it per TreePattern structure)
    expect(screen.queryByRole("treeitem", { name: /Resume.pdf/i })).toBeNull();
  });

  it("should allow multi-selection with Shift+Arrow keys", async () => {
    const user = userEvent.setup();

    render(
      <>
        <KeyboardListener />
        <TreePattern />
      </>,
    );

    const docNode = screen.getByRole("treeitem", { name: /Documents/i });
    const picNode = screen.getByRole("treeitem", { name: /Pictures/i });

    docNode.focus();
    await act(async () => {
      os.dispatch(OS_FOCUS({ zoneId: "apg-tree", itemId: "node-1" }));
      await new Promise((r) => setTimeout(r, 50));
    });

    // Let's press Shift+ArrowDown to select both Documents and Pictures
    await act(async () => {
      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
      await new Promise((r) => setTimeout(r, 200));
    });

    expect(docNode.getAttribute("aria-selected")).toBe("true");
    expect(picNode.getAttribute("aria-selected")).toBe("true");
  });

  it("should allow multi-selection with Shift+Click", async () => {
    const user = userEvent.setup();

    render(
      <>
        <KeyboardListener />
        <MouseListener />
        <TreePattern />
      </>,
    );

    const docNode = screen.getByRole("treeitem", { name: /Documents/i });
    const picNode = screen.getByRole("treeitem", { name: /Pictures/i });

    // Normal click to focus and establish anchor
    await act(async () => {
      await user.click(docNode);
      await new Promise((r) => setTimeout(r, 50));
    });

    // Shift+click on the second node
    await act(async () => {
      fireEvent.mouseDown(picNode, { shiftKey: true });
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(docNode.getAttribute("aria-selected")).toBe("true");
    expect(picNode.getAttribute("aria-selected")).toBe("true");
  });
});
