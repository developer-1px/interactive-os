# Plan: createTrigger id 지원 + DocsViewer prev/next link 전환

> Discussion Clear: OS gap(createDynamicTrigger id 미전달) 수정 -> DocsViewer prev/next를 link + createTrigger(id) 패턴으로 전환

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `trigger.ts:createDynamicTrigger` | `(appId, factory)` 시그니처. id 전달 불가 | `(appId, factory, options?: { id })`. `createElement(Trigger, { id: options?.id, onActivate, children, ...rest })` | Clear | - | +1 test | 하위호환 (options 미전달 시 기존 동작) |
| 2 | `trigger.ts:createSimpleTrigger` | `(appId, command)` 시그니처. id 전달 불가 | `(appId, command, options?: { id })`. 동일 패턴 | Clear | - | +1 test | 동일 |
| 3 | `index.ts:createTrigger` (runtime) | factory/command만 하위 함수에 전달 | 두 번째 인자 `options?: { id }` 수용, 하위 함수에 전달 | Clear | #1, #2 | tsc 0 | overload 분기 |
| 4 | `types.ts:createTrigger` (type overloads) | factory/command overload에 options 없음 | 양쪽에 `options?: { id?: string }` 두 번째 인자 추가 | Clear | #3 | tsc 0 | - |
| 5 | `app.ts:SelectDocTrigger` | `DocsApp.createTrigger(selectDoc)` 단일 generic | PrevDocTrigger + NextDocTrigger 분리 정의 (id 포함). SelectDocTrigger 유지 (sidebar용) | Clear | #3 | tsc 0 | - |
| 6 | `DocsViewer.tsx:502-543` | `<SelectDocTrigger><button>` | `<PrevDocTrigger><a>` / `<NextDocTrigger><a>` | Clear | #5 | 기존 docs-viewer 테스트 유지 | href 처리 |
| 7 | 테스트 | 없음 | createDynamicTrigger + createSimpleTrigger id 옵션 -> data-trigger-id 출력 검증 | Clear | #1, #2 | +2 tests | - |

## 라우팅

승인 후 -> /project (os-core/trigger-id) -- OS gap 수정 + 앱 적용 2단계
