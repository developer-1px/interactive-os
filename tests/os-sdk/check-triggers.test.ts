import { TodoList } from "@apps/todo/app";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { test } from "vitest";

test("check if triggers are registered", ({ expect }) => {
  // Accessing TodoList to trigger module evaluation
  expect(TodoList).toBeTruthy();

  const cb = ZoneRegistry.getItemCallback("list", "delete-todo");
  expect(cb).toBeTruthy();

  const cbBulk = ZoneRegistry.getItemCallback("list", "bulk-delete");
  expect(cbBulk).toBeTruthy();
});
