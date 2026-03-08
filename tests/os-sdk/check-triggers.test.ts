import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { TodoList } from "@apps/todo/app";
import { test, expect } from "vitest";

test("check if triggers are registered", () => {
    // Accessing TodoList to trigger module evaluation
    console.log("TodoList exists:", !!TodoList);

    const cb = ZoneRegistry.getItemCallback("list", "delete-todo");
    console.log("list delete-todo callback:", !!cb);

    const cbBulk = ZoneRegistry.getItemCallback("list", "bulk-delete");
    console.log("list bulk-delete callback:", !!cbBulk);
});
