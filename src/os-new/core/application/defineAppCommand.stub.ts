/**
 * defineAppCommand — Stub for Gap 1 Resolution
 *
 * 앱 스코프 state만 읽고 쓰는 축약 커맨드 정의 API.
 * 커널 전체 state가 아닌 앱 state만으로 작업할 수 있게 해준다.
 *
 * @status STUB — 구조 설계 필요
 * @see docs/0-inbox/2026-02-11_Kernel_App_Migration_Gaps.md#gap-1
 *
 * @example 목표 API:
 *   const ADD_TODO = todoSlice.defineAppCommand("ADD_TODO",
 *     (appState: TodoState) => (payload: { text: string }) => ({
 *       ...appState,
 *       data: { ...appState.data, todos: [...appState.data.todos, payload] }
 *     })
 *   );
 *
 *   // 내부적으로는 kernel.defineCommand로 변환:
 *   // (ctx) => (payload) => ({
 *   //   state: { ...ctx.state, apps: { ...ctx.state.apps, [appId]: reducer(ctx.state.apps[appId], payload) } }
 *   // })
 */

import type { AppSliceHandle } from "./appSlice";

// TODO: 개밥먹기로 ergonomics 검증 후 구현
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function defineAppCommand<S, P = void>(
    _slice: AppSliceHandle<S>,
    _type: string,
    _handler: (state: S) => (payload: P) => S,
): void {
    throw new Error(
        "[defineAppCommand] STUB — not yet implemented. See Gap 1 in migration docs.",
    );
}
