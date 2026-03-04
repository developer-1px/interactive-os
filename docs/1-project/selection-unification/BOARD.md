# selection-unification

## Context

compute-refactor 프로젝트의 Unresolved에서 분리됨.

문제: `ZoneState`에 `selection: string[]` 배열과 `items[id]["aria-selected"]: boolean` 맵이 공존.
- `z.selection = items.slice(...)` (navigate/tab/escape에서 사용)
- `items[id]["aria-selected"]` (compute/seedAriaState에서 사용)
- `OS_INIT_SELECTION`이 `zone.selection` 필드를 사용하지만, 이 필드는 ZoneState 타입에 없음

목표: 선택 상태를 하나의 source of truth (`items[id]["aria-selected"]`)로 통합.

### 초기 조사 (2026-03-05)

파급 범위 — 12+ 소스 파일:
- **선택 커맨드**: select.ts, selectAll.ts, clear.ts, initSelection.ts
- **네비게이션**: navigate/index.ts (Shift+Arrow 범위), navigate/entry.ts (선택 기반 entry)
- **해제**: escape.ts (Escape 시 selection 클리어)
- **포커스**: focus.ts (포커스 복원 시 selection 전달)
- **동작**: clipboard/cut.ts, crud/delete.ts (선택 기반)
- **파생**: buildZoneCursor.ts (cursor.selection 파생), resolve.ts (ZoneCursor 타입)

Cynefin: **Complicated** — /discussion 필요.

## Now

(계획 수립 필요 — /discussion → /plan 대상)

## Done

## Unresolved

## Ideas

