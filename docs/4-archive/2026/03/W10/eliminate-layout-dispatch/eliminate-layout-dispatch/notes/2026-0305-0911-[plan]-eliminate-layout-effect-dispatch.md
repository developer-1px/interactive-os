# [plan] Eliminate useLayoutEffect dispatch — Top-Down Only

> 생성일: 2026-03-05 09:11
> 근거: design-principles.md #32 — useLayoutEffect는 DOM API 호출 전용

## 배경

OS_ZONE_INIT 제거(2026-03-05)에서 발견: useLayoutEffect에서 os.dispatch()를 호출하는 것은
React bottom-up mount 순서에 의존하는 타이밍 함정. config 선언형으로 대체해야 한다.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `Zone.tsx:autoFocus` (L173-182) | useLayoutEffect에서 `OS_FOCUS` dispatch. overlay entry hint 읽어서 focusLast 판단 | `config.initial.focusedItemId`로 선언. overlay entry hint → initial.entry 전달 | Complicated | — | accordion/tabs/dialog 기존 테스트 유지 | dialog/menu overlay autoFocus+entry hint 조합 복잡 |
| 2 | `Zone.tsx:disallowEmpty` (L187-198) | useLayoutEffect에서 `OS_INIT_SELECTION` dispatch | `select.disallowEmpty` → ensureZone에서 자동 첫 아이템 선택 | Clear | — | tabs/radiogroup 기존 테스트 유지 | 이미 initial.selection 패턴 존재 |
| 3 | `Zone.tsx:STACK_PUSH/POP` (L206-212) | useLayoutEffect에서 stack push/pop | `OS_OVERLAY_OPEN` command에서 push, `OS_OVERLAY_CLOSE`에서 pop | Complicated | →#1 | dialog 기존 테스트 유지 | overlay lifecycle과 강결합 |
| 4 | `Field.tsx:auto-commit` (L313-319) | useLayoutEffect에서 editing 종료 감지 → `OS_FIELD_COMMIT` dispatch | focus 이동 command/`OS_FIELD_STOP_EDIT`에서 auto-commit | Complicated | — | todo/kanban field 기존 테스트 유지 | EDIT→SELECT path 판단 복잡 |

## 라우팅

승인 후 → `/project` — OS 인프라 프로젝트 (scope 크고, overlay/field 영향 범위 넓음)
