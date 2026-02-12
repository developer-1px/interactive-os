/**
 * L5. resolveFocusId — Unit Tests
 *
 * 순수 함수. DOM 불필요.
 * "OS.FOCUS" 플레이스홀더를 실제 focused item ID로 치환한다.
 */

import { describe, expect, it } from "vitest";
import { resolveFocusId } from "./resolveFocusId";

// Helper: 가짜 Command 생성
const makeCommand = (type: string, payload?: Record<string, any>) => ({
    type,
    ...(payload !== undefined ? { payload } : {}),
});

describe("resolveFocusId", () => {
    it("replaces OS.FOCUS placeholder with actual ID", () => {
        const cmd = makeCommand("TOGGLE_TODO", { id: "OS.FOCUS" });
        const result = resolveFocusId(cmd as any, "42");
        expect(result.payload.id).toBe("42");
    });

    it("leaves non-placeholder values untouched", () => {
        const cmd = makeCommand("TOGGLE_TODO", { id: "123" });
        const result = resolveFocusId(cmd as any, "42");
        expect(result.payload.id).toBe("123");
    });

    it("replaces multiple OS.FOCUS fields", () => {
        const cmd = makeCommand("SOME_CMD", { id: "OS.FOCUS", target: "OS.FOCUS" });
        const result = resolveFocusId(cmd as any, "99");
        expect(result.payload.id).toBe("99");
        expect(result.payload.target).toBe("99");
    });

    it("handles mixed placeholder and literal fields", () => {
        const cmd = makeCommand("CMD", { id: "OS.FOCUS", name: "hello" });
        const result = resolveFocusId(cmd as any, "5");
        expect(result.payload.id).toBe("5");
        expect(result.payload.name).toBe("hello");
    });

    it("returns command as-is when no payload exists", () => {
        const cmd = makeCommand("NOOP");
        const result = resolveFocusId(cmd as any, "42");
        expect(result).toEqual(cmd);
    });

    it("does not mutate original command", () => {
        const cmd = makeCommand("CMD", { id: "OS.FOCUS" });
        const original = { ...cmd, payload: { ...cmd.payload } };
        resolveFocusId(cmd as any, "42");
        expect(cmd.payload.id).toBe("OS.FOCUS"); // unchanged
    });
});
