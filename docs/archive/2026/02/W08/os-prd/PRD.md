# PRD — OS Code Quality Hardening

> Single Source of Truth for WHAT (T7/T8/T9)
> Last updated: 2026-02-16

## 목표

OS 코드의 타입 안전성과 테스트 커버리지를 강화하여, 향후 리팩토링의 안전한 기반을 만든다.

## Phase 1: T7 — ⚠️ 커맨드 테스트 보강

### Acceptance Criteria

| # | SPEC 커맨드 | 현재 | 목표 | 검증 방법 |
|---|-----------|------|------|----------|
| AC-1 | SYNC_FOCUS | ⚠️ | ✅ | unit test: focusin 시 activeZone 변경 없이 focusedItemId만 갱신 |
| AC-2 | RECOVER | ⚠️ | ✅ | unit test: recoveryTargetId 우선, fallback to lastFocusedId |
| AC-3 | STACK_PUSH/POP | ⚠️ | ✅ | 이미 `stack.test.ts` 9개 존재 → SPEC 상태만 ✅로 승격 |
| AC-4 | OS_MOVE_UP/DOWN | ⚠️ | ✅ | unit test: onMoveUp/Down 콜백 dispatch 검증 |
| AC-5 | OS_UNDO/REDO | ⚠️ | ✅ | 이미 `history.test` + dogfooding E2E → SPEC 상태만 ✅로 승격 |
| AC-6 | FIELD_* (3개) | ⚠️ | ✅ | 이미 `field.test.ts` 14개 → SPEC 상태만 ✅로 승격 |
| AC-7 | OVERLAY_* (2개) | ⚠️ | ✅ | 이미 `overlay.test.ts` 9개 → SPEC 상태만 ✅로 승격 |
| AC-8 | macFallbackMiddleware | ⚠️ | ✅ | unit test: Mac 특수 키 (Home/End → Cmd+Left/Right 등) 처리 검증 |

### 실제 테스트 작성 대상 (AC-3/5/6/7은 SPEC 갱신만)

1. **SYNC_FOCUS** — `activeZoneId`를 건드리지 않고 `focusedItemId`만 갱신하는지
2. **RECOVER** — `recoveryTargetId` → `lastFocusedId` fallback 순서
3. **OS_MOVE_UP/DOWN** — zone의 `onMoveUp`/`onMoveDown` 콜백 dispatch
4. **macFallbackMiddleware** — unhandled keyboard → Mac 키 변환

### 엣지 케이스

- SYNC_FOCUS: zone이 미등록 상태일 때 → 무시 (크래시 없음)
- RECOVER: recoveryTargetId와 lastFocusedId 모두 null → 변경 없음
- OS_MOVE_UP: 콜백 미등록 zone → 무시

## Phase 2: T8 — kernel.dispatch 타입 개선

### Acceptance Criteria

| # | 기준 | 검증 |
|---|------|------|
| AC-9 | `kernel.dispatch(CMD())` — `as any` 없이 컴파일 | tsc --noEmit |
| AC-10 | 기존 `as any` 중 kernel dispatch 관련 30+개 제거 | grep -c "as any" 감소 |
| AC-11 | 모든 기존 테스트 통과 (회귀 없음) | vitest + playwright |

### 설계 방향 (TBD — /discussion 필요)

- Option A: `dispatch` 시그니처를 `Command<string, unknown>`으로 완화
- Option B: OS 커맨드 union type 도입, dispatch overload
- Option C: branded Command type + type predicate

## Phase 3: T9 — defineApp.ts 분할

### Acceptance Criteria

| # | 기준 | 검증 |
|---|------|------|
| AC-12 | defineApp.ts 300줄 이하 | wc -l |
| AC-13 | 분리된 모듈 각각 200줄 이하 | wc -l |
| AC-14 | `as any` 10개 이하 (현재 25개) | grep -c |
| AC-15 | 모든 기존 테스트 통과 | vitest + playwright |
| AC-16 | 기존 앱 코드 import 경로 변경 0 (barrel 유지) | grep 검증 |

### 분할 후보 경계 (TBD — /discussion 필요)

1. `defineApp.ts` — 핵심 팩토리 (defineApp 함수 시그니처)
2. `zoneHandle.ts` — ZoneHandle, createZone, bind
3. `boundComponents.ts` — BoundComponents (Zone, Item, Field, When)
4. `appPersistence.ts` — persistence middleware
5. `appKeybindings.ts` — keybinding registration
