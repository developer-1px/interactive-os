import { describe, expect, it } from "vitest";
import { defineApp } from "@os-sdk/app/defineApp";

// @spec docs/1-project/os-core/action-centric-trigger/notes/2026-0308-1935-[plan]-payload-trigger.md

describe("action-centric-trigger", () => {
    it("zone.trigger(id, onActivate) returns an object with data-trigger-id, not a React component", () => {
        const TestApp = defineApp("test", {});
        const zone = TestApp.createZone("myZone");

        const onActivateCmd = () => ({ type: "TEST_CMD", payload: undefined } as unknown as import("@kernel/core/tokens").BaseCommand);
        const trigger = zone.trigger("my-trigger", onActivateCmd);

        // After transformation, `trigger()` is a factory function returning HTML attrs
        // It should no longer be a React component holding `render` or `$$typeof`
        const result = (trigger as unknown as () => Record<string, unknown>)();

        expect(result).toBeDefined();
        // 1. Must return data-trigger-id
        expect(result["data-trigger-id"]).toBe("my-trigger");


        // 2. Must not inject onClick or any React event handler
        expect((result as any).onClick).toBeUndefined();
        expect((result as any).onPointerDown).toBeUndefined();
        expect((result as any).onKeyDown).toBeUndefined();

        // 3. Keep original binding info
        expect(trigger.id).toBe("my-trigger");
        expect(trigger.onActivate).toBe(onActivateCmd);
    });

    it("zone.overlay() trigger component is replaced with an attribute-returning getter", () => {
        const TestApp = defineApp("test", {});
        const zone = TestApp.createZone("myZone");

        const overlay = zone.overlay("my-menu", { role: "menu" });

        // The returned `.Trigger` should now be a function returning spreadable props
        const result = (overlay.Trigger as unknown as () => Record<string, unknown>)();

        expect(result).toBeDefined();
        expect(result["data-trigger-id"]).toBe("my-menu-trigger");
        expect(result["aria-haspopup"]).toBe("true");

        // No event handlers
        expect((result as any).onClick).toBeUndefined();
    });

    it("trigger(payload) returns data-trigger-payload attribute", () => {
        const TestApp = defineApp("test", {});
        const zone = TestApp.createZone("myZone");

        const deleteTodo = zone.trigger("delete-todo", (todoId: string) =>
            ({ type: "DELETE_TODO", payload: { todoId } } as unknown as import("@kernel/core/tokens").BaseCommand)
        );

        // Call prop-getter WITH payload
        const result = (deleteTodo as unknown as (payload?: string) => Record<string, unknown>)("abc-123");

        expect(result["data-trigger-id"]).toBe("delete-todo");
        expect(result["data-trigger-payload"]).toBe("abc-123");
    });

    it("trigger() without payload omits data-trigger-payload", () => {
        const TestApp = defineApp("test", {});
        const zone = TestApp.createZone("myZone");

        const undoButton = zone.trigger("undo", () =>
            ({ type: "UNDO", payload: undefined } as unknown as import("@kernel/core/tokens").BaseCommand)
        );

        // Call prop-getter WITHOUT payload
        const result = (undoButton as unknown as (payload?: string) => Record<string, unknown>)();

        expect(result["data-trigger-id"]).toBe("undo");
        expect(result["data-trigger-payload"]).toBeUndefined();
    });

    it("onActivate handler signature uses payload, not focusId", () => {
        const TestApp = defineApp("test", {});
        const zone = TestApp.createZone("myZone");

        let receivedPayload: string | undefined;
        const moveUp = zone.trigger("move-up", (payload: string) => {
            receivedPayload = payload;
            return { type: "MOVE_UP", payload: { itemId: payload } } as unknown as import("@kernel/core/tokens").BaseCommand;
        });

        // Verify the registered onActivate function receives payload correctly
        const handler = moveUp.onActivate;
        handler("item-42");
        expect(receivedPayload).toBe("item-42");
    });
});

