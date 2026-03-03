# /plan — OS_SELECT Mode Auto-Resolution

> **Goal**: `OS_SELECT`의 mode가 키바인딩에서 강제되는 구조를 제거.
> mode 생략 시 zone config에서 자동 결정 (single→replace, multi→toggle).

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `select.ts:50` | `mode = payload.mode ?? "single"` | `mode = payload.mode ?? deriveMode(zoneConfig)` — single→replace, multi→toggle | 🟢 Clear | — | tsc 0 + 기존 selection tests 유지 | OS_SELECT 전 케이스에 영향 |
| 2 | `osDefaults.ts:100` | `Space → OS_SELECT({ mode: "toggle" })` | `Space → OS_SELECT({})` (mode 생략) | 🟢 Clear | →#1 | 기존 keyboard tests 유지 | Space가 single zone에서 replace로 바뀜 |
| 3 | `activate.ts:62` | `OS_SELECT({ mode: "replace", ... })` | `OS_SELECT({ targetId, ... })` (mode 생략) | 🟢 Clear | →#1 | tabs Enter test 유지 | — |
| 4 | `select.ts:63-82` toggle 분기 | toggle에서 `zoneConfig.select.mode === "single"` 체크 + `disallowEmpty` 가드 | **제거 가능** — single zone은 mode가 replace로 자동 결정되므로 toggle 분기에 single이 올 일 없음 | 🟢 Clear | →#1 | 기존 toggle tests 유지 | toggle은 multi 전용이 됨 |
| 5 | `resolveMouse.ts:126` | `OS_SELECT({ targetId, mode: selectMode })` | **변경 없음** — 마우스는 modifier 키로 mode 결정 (replace/toggle/range). 이건 올바른 명시적 mode | 🟢 Clear | — | — | — |
| 6 | 테스트 파일들 | `OS_SELECT({ targetId: "a", mode: "replace" })` 명시 | **변경 없음** — 테스트는 명시적 mode로 특정 동작 검증. 올바름 | 🟢 Clear | — | — | — |

## MECE 점검

1. **CE**: #1~4 실행하면 "mode 생략 시 zone config 자동 결정" 달성 ✅
2. **ME**: 중복 행 없음 ✅
3. **No-op**: #5, #6은 변경 없음 = 제거 → **실행 대상: #1, #2, #3, #4**

## 라우팅

승인 후 → `/go` (기존 프로젝트 `apg-tabs-pattern`) — OS_SELECT mode auto-resolution 구현
