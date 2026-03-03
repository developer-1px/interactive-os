import { OS_FOCUS } from "@os-core/4-command/focus";
import { os } from "@os-core/engine/kernel";
import { KeyboardListener } from "@os-react/1-listen/keyboard/KeyboardListener";
import { PointerListener } from "@os-react/1-listen/pointer/PointerListener";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { produce } from "immer";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { TreegridPattern } from "@/pages/apg-showcase/patterns/TreegridPattern";

/**
 * TreegridPattern uses an email inbox with threads:
 * - "Treegrid Design Discussion" (thread:thread-1) -- expandable
 *   - "Re: Treegrid Design Discussion" (msg:thread-1/reply-1a)
 *   - "Re: Treegrid Design Discussion" (msg:thread-1/reply-1b)
 * - "Sprint Planning Q1" (thread:thread-2) -- expandable
 *   - "Re: Sprint Planning Q1" (msg:thread-2/reply-2a)
 * - "Accessibility Audit Report" (msg:msg-3) -- standalone
 * - "Team Offsite Logistics" (msg:msg-4) -- standalone
 */

describe("TreegridPattern (APG Showcase) - E2E", () => {
  beforeEach(() => {
    os.setState((state) =>
      produce(state, (draft) => {
        draft.os.focus.zones = {};
        draft.os.focus.activeZoneId = null;
      }),
    );
  });

  it("should render treegrid with correct structure", () => {
    render(
      <>
        <KeyboardListener />
        <TreegridPattern />
      </>,
    );

    // Zone has role=treegrid
    const treegrid = screen.getByRole("treegrid");
    expect(treegrid).toBeTruthy();
    expect(treegrid.getAttribute("aria-label")).toBe("Email Inbox");

    // Column headers
    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBe(3);
  });

  it("should expand and collapse threads using ArrowRight / ArrowLeft", async () => {
    const user = userEvent.setup();

    render(
      <>
        <KeyboardListener />
        <TreegridPattern />
      </>,
    );

    // Find the first thread row
    const rows = screen.getAllByRole("row");
    // First row is the column header row, second is first thread
    const threadRow = rows[1];
    expect(threadRow.getAttribute("aria-expanded")).not.toBe("true");

    // Focus the thread
    threadRow.focus();
    os.dispatch(
      OS_FOCUS({ zoneId: "apg-treegrid", itemId: "thread:thread-1" }),
    );
    await new Promise((r) => setTimeout(r, 50));

    // ArrowRight should expand
    await user.keyboard("{ArrowRight}");
    await new Promise((r) => setTimeout(r, 200));

    expect(threadRow.getAttribute("aria-expanded")).toBe("true");

    // Replies should now be visible
    const allRows = screen.getAllByRole("row");
    // 1 header + 4 top-level + 2 expanded replies = 7
    expect(allRows.length).toBe(7);

    // ArrowLeft should collapse
    await user.keyboard("{ArrowLeft}");
    await new Promise((r) => setTimeout(r, 200));

    expect(threadRow.getAttribute("aria-expanded")).not.toBe("true");

    // Replies hidden: 1 header + 4 top-level = 5
    const afterCollapse = screen.getAllByRole("row");
    expect(afterCollapse.length).toBe(5);
  });

  it("should navigate between rows with ArrowDown / ArrowUp", async () => {
    const user = userEvent.setup();

    render(
      <>
        <KeyboardListener />
        <TreegridPattern />
      </>,
    );

    const rows = screen.getAllByRole("row");
    const firstThread = rows[1];

    firstThread.focus();
    os.dispatch(
      OS_FOCUS({ zoneId: "apg-treegrid", itemId: "thread:thread-1" }),
    );
    await new Promise((r) => setTimeout(r, 50));

    // ArrowDown moves to next row
    await user.keyboard("{ArrowDown}");
    await new Promise((r) => setTimeout(r, 100));

    // Focused item should now be thread-2
    const state = os.getState();
    const zone = state.os.focus.zones["apg-treegrid"];
    expect(zone?.focusedItemId).toBe("thread:thread-2");
  });

  it("should select rows with click", async () => {
    render(
      <>
        <KeyboardListener />
        <PointerListener />
        <TreegridPattern />
      </>,
    );

    const rows = screen.getAllByRole("row");
    const secondThread = rows[2]; // thread-2

    await act(async () => {
      fireEvent.pointerDown(secondThread, {
        clientX: 100,
        clientY: 100,
      });
      fireEvent.pointerUp(secondThread, {
        clientX: 100,
        clientY: 100,
      });
      await new Promise((r) => setTimeout(r, 50));
    });

    const state = os.getState();
    const zone = state.os.focus.zones["apg-treegrid"];
    expect(zone?.focusedItemId).toBe("thread:thread-2");
  });
});
