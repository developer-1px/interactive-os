/**
 * Delete button — focusId-based targeting verification
 *
 * After DynamicTrigger removal: zone.trigger() passes (focusId) => BaseCommand
 * directly to TriggerBase, which registers it in ZoneRegistry without thunk wrapping.
 * Both headless and browser paths now use the same function.
 *
 * @see packages/os-react/src/6-project/trigger/TriggerBase.tsx
 * @see packages/os-sdk/src/app/defineApp/trigger.ts
 */

import { TodoApp } from "@apps/todo/app";
import { createHeadlessPage } from "@os-devtool/testing/page";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import type { AppPageInternal } from "@os-sdk/app/defineApp/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

type P = AppPageInternal<any>;
let page: P;

import TodoPage from "../../../../src/pages/TodoPage";

beforeEach(() => {
  page = createHeadlessPage(TodoApp, TodoPage);
  page.goto("/");
});

afterEach(() => {
  page.cleanup();
});

describe("delete-todo trigger uses focusId for per-item targeting", () => {
  it("deletes the focused item (not first/last)", () => {
    page.locator("#todo_3").click();

    const orderBefore = [...page.state.data.todoOrder];
    expect(orderBefore).toContain("todo_3");

    page.click("delete-todo");

    expect(page.state.data.todoOrder).not.toContain("todo_3");
  });

  it("deletes any focused item sequentially", () => {
    page.locator("#todo_2").click();
    page.click("delete-todo");
    expect(page.state.data.todoOrder).not.toContain("todo_2");

    page.locator("#todo_4").click();
    page.click("delete-todo");
    expect(page.state.data.todoOrder).not.toContain("todo_4");
  });

  it("onActivate in ZoneRegistry is a function that uses focusId", () => {
    const deleteTriggerCb = ZoneRegistry.findItemCallback("delete-todo");
    expect(deleteTriggerCb).toBeTruthy();
    expect(deleteTriggerCb!.onActivate).toBeTruthy();

    // Function must produce different commands for different focusIds
    const cmd1 = deleteTriggerCb!.onActivate!("todo_1");
    const cmd2 = deleteTriggerCb!.onActivate!("todo_3");
    expect(cmd1).not.toEqual(cmd2);
  });
});
