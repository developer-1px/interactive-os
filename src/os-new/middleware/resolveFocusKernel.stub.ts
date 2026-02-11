/**
 * resolveFocusKernelMiddleware — Stub for Gap 2 Resolution
 *
 * 커널 미들웨어로 OS.FOCUS placeholder를 실제 focusedItemId로 치환.
 * 현재 Zustand 경로의 resolveFocusMiddleware와 동등한 기능.
 *
 * @status STUB — OS.FOCUS 패턴 유지 vs context injection 전환 결정 필요
 * @see docs/0-inbox/2026-02-11_Kernel_App_Migration_Gaps.md#gap-2
 *
 * 두 가지 접근법:
 *
 * A) Payload 치환 (현재 방식 유지):
 *    before(ctx) {
 *      if (ctx.command.payload?.id === "OS.FOCUS") {
 *        ctx.command.payload.id = getCurrentFocusedItemId();
 *      }
 *    }
 *
 * B) Context Injection (커널 네이티브 방식):
 *    const FocusCtx = defineContext("focus", () => getCurrentFocusedItemId());
 *    // 커맨드에서: ctx.inject(FocusCtx) 로 접근
 *    // → payload에 OS.FOCUS 쓸 필요 없음
 *    // → 하지만 기존 커맨드 전부 수정해야 함
 */

import type { Middleware } from "@kernel/core/tokens";

// TODO: 개밥먹기로 어떤 접근법이 나은지 검증 후 구현
export function createResolveFocusMiddleware(): Middleware {
    return {
        id: "resolve-focus",
        before(_ctx) {
            throw new Error(
                "[resolveFocusKernelMiddleware] STUB — not yet implemented. See Gap 2.",
            );
        },
    };
}
