# /plan — Zone Initial Config (Config ≠ Command)

> Discussion Clear: Zone 초기 상태는 Config(`bind({ initial })`), 런타임은 Command.
> `OS_INIT_SELECTION` 제거, `OS_ZONE_INIT`이 config에서 초기값을 읽는다.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `types.ts:ZoneBindings` | `initial` 필드 없음 | `initial?: { selection?: string[]; expanded?: string[] }` 추가 | 🟢 Clear | — | tsc 0 | 소비자 없음 (새 필드) |
| 2 | `Zone.tsx:useLayoutEffect` | `disallowEmpty` → `OS_INIT_SELECTION` dispatch | `disallowEmpty` → config.initial에 `selection: [items[0]]` 주입, `OS_INIT_SELECTION` 제거 | 🟢 Clear | →#1 | tsc 0, 기존 APG 테스트 유지 | 타이밍 변경 — 기존 disallowEmpty 동작 검증 필수 |
| 3 | `zoneInit.ts:OS_ZONE_INIT` | `{ ...initialZoneState }` 고정값 | `ZoneRegistry.get(zoneId)`에서 config.initial 읽어 `selection`/`expanded` 적용 | 🟢 Clear | →#1 | +Red test | ZoneRegistry가 이 시점에 등록되어 있어야 함 (useMemo에서 등록, useLayoutEffect에서 INIT → ✅ 순서 보장됨) |
| 4 | `page.ts:headless` | `initialSelection` 직접 state 패치 | 같은 config.initial 경로 사용 (OS_ZONE_INIT이 처리) | 🟢 Clear | →#3 | 기존 headless 테스트 유지 | page.ts의 goto()가 ZoneRegistry를 직접 세팅 — 같은 경로인지 확인 |
| 5 | `initSelection.ts` | `OS_INIT_SELECTION` 커맨드 존재 | 제거 (dead code) | 🟢 Clear | →#2 | grep 0 참조 | — |

## MECE 자기 점검

1. **CE**: 5행 실행 → bind에 initial 선언 → OS_ZONE_INIT이 적용 → OS_INIT_SELECTION 제거 → headless 정렬 → ✅ 목표 달성
2. **ME**: 중복 없음
3. **No-op**: 없음

## 라우팅

승인 후 → `/go` (기존 프로젝트 없음, OS 코어 수정 — `/issue` 성격의 개선)
