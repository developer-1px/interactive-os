import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { produce } from "immer";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { KeyboardListener } from "@/os/1-listeners/keyboard/KeyboardListener";
import { PointerListener } from "@/os/1-listeners/pointer/PointerListener";
import { OS_FOCUS } from "@/os/3-commands/focus";
import { os } from "@/os/kernel";
import { TreePattern } from "../../patterns/TreePattern";

/**
 * TreePattern uses VS Code-style file explorer data:
 * - "src" (folder:src) — expandable
 *   - "components" (folder:src/components) — expandable
 *   - "hooks" (folder:src/hooks) — expandable
 *   - App.tsx, index.ts
 * - "docs" (folder:docs) — expandable
 * - package.json, tsconfig.json
 */

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

    // "src" is a folder at root — treeitem with accessible name
    const srcNode = screen.getByRole("treeitem", { name: /src/i });
    expect(srcNode.getAttribute("aria-expanded")).not.toBe("true");

    // Focus the "src" folder
    srcNode.focus();
    os.dispatch(OS_FOCUS({ zoneId: "apg-explorer", itemId: "folder:src" }));
    await new Promise((r) => setTimeout(r, 50));

    // ArrowRight should expand the node
    await user.keyboard("{ArrowRight}");
    await new Promise((r) => setTimeout(r, 200));

    expect(srcNode.getAttribute("aria-expanded")).toBe("true");

    // Children should now be visible — "components" is a child folder
    expect(screen.getByRole("treeitem", { name: /components/i })).toBeTruthy();

    // ArrowLeft should collapse it
    await user.keyboard("{ArrowLeft}");
    await new Promise((r) => setTimeout(r, 200));
    expect(srcNode.getAttribute("aria-expanded")).not.toBe("true");

    // Children should be hidden
    expect(screen.queryByRole("treeitem", { name: /components/i })).toBeNull();
  });

  it("should allow multi-selection with Shift+Arrow keys", async () => {
    const user = userEvent.setup();

    render(
      <>
        <KeyboardListener />
        <TreePattern />
      </>,
    );

    const srcNode = screen.getByRole("treeitem", { name: /src/i });
    const docsNode = screen.getByRole("treeitem", { name: /^docs$/i });

    srcNode.focus();
    await act(async () => {
      os.dispatch(OS_FOCUS({ zoneId: "apg-explorer", itemId: "folder:src" }));
      await new Promise((r) => setTimeout(r, 50));
    });

    // Shift+ArrowDown to select both src and docs
    await act(async () => {
      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
      await new Promise((r) => setTimeout(r, 200));
    });

    expect(srcNode.getAttribute("aria-selected")).toBe("true");
    expect(docsNode.getAttribute("aria-selected")).toBe("true");
  });

  it("should allow multi-selection with Shift+Click", async () => {
    const user = userEvent.setup();

    render(
      <>
        <KeyboardListener />
        <PointerListener />
        <TreePattern />
      </>,
    );

    const srcNode = screen.getByRole("treeitem", { name: /src/i });
    const docsNode = screen.getByRole("treeitem", { name: /^docs$/i });

    // Click to focus and establish anchor
    await act(async () => {
      await user.click(srcNode);
      await new Promise((r) => setTimeout(r, 50));
    });

    // Shift+click on docs
    await act(async () => {
      fireEvent.mouseDown(docsNode, { shiftKey: true });
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(srcNode.getAttribute("aria-selected")).toBe("true");
    expect(docsNode.getAttribute("aria-selected")).toBe("true");
  });
});
