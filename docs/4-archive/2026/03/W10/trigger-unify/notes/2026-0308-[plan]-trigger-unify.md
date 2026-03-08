# Plan — Zone-level Trigger 일원화

> 2026-03-08 | /discussion Clear → /plan

## Goal

`AppHandle.createTrigger()` 3개 오버로드를 `zone.trigger(id, cmd)` + `zone.overlay(id, config)` 2-API로 통합.
선언 3곳(bind triggers[] + createTrigger + export) → 1곳(bind triggers 객체).

## Constraints

- C1. Playwright subset 유지 (`page.click(id)`)
- C2. Item sub-trigger(ExpandTrigger, CheckTrigger) 스코프 밖 — DOM 전용
- C3. 원칙 #30 top-down only
- C4. Zero Drift
- C5. pre-commit hook 통과 (tsc + lint + vitest)
- C6. role default triggers = 별도 프로젝트 제외

## 변환 명세표

### Phase 1: API 신설

| # | 대상 | Before | After | 의존 | 검증 |
|---|------|--------|-------|------|------|
| 1 | `types.ts:ZoneHandle` | 4 메서드 (command, defineEffect, createZone, bind) | +`trigger(id, cmdOrFactory)` → `React.FC & TriggerBinding` | — | tsc 0 |
| 2 | `types.ts:ZoneHandle` | overlay 없음 | +`overlay(id, config)` → `CompoundTriggerComponents` | — | tsc 0 |
| 3 | `types.ts:ZoneBindings.triggers` | `TriggerBinding[]` | `Record<string, TriggerBinding> \| TriggerBinding[]` | — | tsc 0 |
| 4 | `index.ts:createZone()` | trigger/overlay 없음 | `trigger()` 구현: typeof 판별 + TriggerBinding + React.FC | →#1 | tsc 0, +2 unit |
| 5 | `index.ts:createZone()` | overlay 없음 | `overlay()` 구현: createCompoundTrigger 위임 | →#2 | tsc 0, +1 unit |

### Phase 2: 소비자 마이그레이션 — 앱

| # | 대상 | Before | After | 의존 | 검증 |
|---|------|--------|-------|------|------|
| 6 | `todo/app.ts` bind triggers[] (L274-295) | 배열 5개 `[{id, onActivate: (focusId)=>cmd}]` | 삭제 — #7가 대체 | →#4 | todo 테스트 유지 |
| 7 | `todo/app.ts` TodoList.triggers (L498-509) | `TodoApp.createTrigger(factory, {id})` × 6 | `listCollection.trigger(id, factory)` × 6 | →#4 | tsc 0 |
| 8 | `todo/app.ts` DeleteDialog (L501-505) | `TodoApp.createTrigger({role:"alertdialog"})` | `listCollection.overlay("todo-delete-dialog", config)` | →#5 | tsc 0 |
| 9 | `todo/app.ts` Sidebar.triggers (L519-523) | `TodoApp.createTrigger(selectCategory, {id})` | `sidebarCollection.trigger()` | →#4 | tsc 0 |
| 10 | `todo/app.ts` ClearDialog (L555-559) | `TodoApp.createTrigger({role:"alertdialog"})` | `toolbarZone.overlay()` | →#5 | tsc 0 |
| 11 | `todo/widgets/TodoToolbar.tsx` (L21-30) | `TodoApp.createTrigger(cmd, {id})` × 3 (bottom-up) | app.ts로 이동, `toolbarZone.trigger()` (top-down) | →#4 | tsc 0 |
| 12 | `inspector/app.ts` (L58, 84-86, 126-128) | bind `triggers: [{id, onActivate}]` 배열 | zone.trigger()로 변환 | →#4 | tsc 0 |
| 13 | `builder/app.ts` (L194-199) | bind `triggers: [{id, onActivate}]` | zone.trigger() + overlay | →#4 | tsc 0 |

### Phase 2: 소비자 마이그레이션 — Showcase/APG

| # | 대상 | Before | After | 의존 | 검증 |
|---|------|--------|-------|------|------|
| 14 | `docs-viewer/app.ts` (L288-296) | `DocsApp.createTrigger(factory, {id})` × 3 | zone.trigger() × 3 | →#4 | tsc 0 |
| 15 | `CarouselPattern.tsx` (L119, 122) | `createTrigger(cmd, {id})` × 2 | zone.trigger() × 2 | →#4 | tsc 0 |
| 16 | `MenuButtonPattern.tsx` (L47) | `createTrigger({role:"menu"})` | zone.overlay() | →#5 | tsc 0 |
| 17 | `OverlayPattern.tsx` (L61) | `createTrigger({role:"dialog"})` | zone.overlay() | →#5 | tsc 0 |
| 18 | `MenuPattern.tsx` (L52) | `createTrigger({role:"menu"})` | zone.overlay() | →#5 | tsc 0 |
| 19 | `PopoverPattern.tsx` (L48) | `createTrigger({role:"popover"})` | zone.overlay() | →#5 | tsc 0 |
| 20 | `TooltipPattern.tsx` (L21) | `createTrigger({role:"tooltip"})` | zone.overlay() | →#5 | tsc 0 |
| 21 | `ListboxDropdownPattern.tsx` (L52) | `createTrigger({role:"listbox"})` | zone.overlay() | →#5 | tsc 0 |

### Phase 3: 구 API 삭제

| # | 대상 | Before | After | 의존 | 검증 |
|---|------|--------|-------|------|------|
| 22 | `trigger.ts:createSimpleTrigger` | export function | 삭제 | →#6-21 | tsc 0 |
| 23 | `trigger.ts:createDynamicTrigger` | export function | 삭제 | →#6-21 | tsc 0 |
| 24 | `trigger.ts:createCompoundTrigger` | export function | zone.overlay() 내부로 이동 | →#6-21 | tsc 0 |
| 25 | `types.ts:AppHandle.createTrigger` | 3개 오버로드 | 삭제 | →#6-21 | tsc 0 |
| 26 | `index.ts:createTrigger` (L348-398) | polymorphic dispatch | 삭제 | →#6-21 | tsc 0 |

### Phase 4: 테스트

| # | 대상 | Before | After | 의존 | 검증 |
|---|------|--------|-------|------|------|
| 27 | `todo-trigger-click.test.ts` | failing | green | →#7 | +6 tests |
| 28 | 전체 suite | ~1465 tests | regression 0 | →#22-26 | vitest 전체 |

## 라우팅

승인 후 → /project (trigger-unify) — os-core 도메인, Light 규모
