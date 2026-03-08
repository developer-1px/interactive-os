# ban-dispatch-tsx

## Context

Claim: React(.tsx)에서 os.dispatch 호출은 구조적으로 항상 오류. Trigger + Zone이 전건 커버.

Before → After: 25건 os.dispatch in .tsx → 11건 즉시 수정 + lint rule + 14건 backlog

Risks: trigger 교체 시 기존 동작 깨질 수 있음. builder Zone 구조 복잡.

## Now

(없음)

## Done
- [x] T1: lint rule `no-dispatch-in-tsx` — eslint-plugin-pipeline + eslint.config.js ✅
- [x] T9: backlog 등록 — 19건 → `docs/5-backlog/dispatch-tsx-violations.md` ✅

## Unresolved
- builder 5건: pre-existing tsc errors (os not in scope) → builder-v2 소속
- command-palette 6건: 전체 앱 Zone 마이그레이션 필요 → 별도 프로젝트
- docs-viewer 7건: 전체 앱 Zone 마이그레이션 필요 → 별도 프로젝트
- MeterPattern 1건: setInterval simulation → apg-showcase 수정

## Ideas
- command-palette → combobox Zone 전환 (별도 프로젝트)
- docs-viewer → defineApp + Zone 전환 (별도 프로젝트)
