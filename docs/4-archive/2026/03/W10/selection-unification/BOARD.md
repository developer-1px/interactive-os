# selection-unification — ✅ Complete

## Context

문제: `ZoneState`에 `selection: string[]` 배열과 `items[id]["aria-selected"]: boolean` 맵이 공존.
목표: 선택 상태를 하나의 source of truth (`items[id]["aria-selected"]`)로 통합.

## Done (verified 2026-03-05)

- [x] ZoneState.selection 필드 삭제 — 타입에서 이미 제거됨 (OSState.ts)
- [x] 모든 command handler가 items["aria-selected"] 기반 — zone.selection 직접 R/W 0건
- [x] buildZoneCursor가 items에서 selection 파생 — SPoT 확보
- [x] page.ts selection()이 items 기반 — L282-289
- [x] createOsPage.ts L255 dead code 제거 — `zoneState?.selection?.[0]` → items 기반 파생
- Evidence: 31 failed | 145 passed (176 total) — 0 regression, +1 pass

## Key Decision

`ZoneState.selection: string[]` 배열은 이전 리팩토링에서 이미 타입에서 삭제됨.
모든 코드가 `items[id]["aria-selected"]`를 SPoT로 사용해 사실상 통합 완료 상태.
잔존 dead code 1줄만 정리하여 마무리.
