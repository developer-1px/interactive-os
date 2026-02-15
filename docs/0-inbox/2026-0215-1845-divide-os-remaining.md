# /divide 보고서 — OS-PRD 잔여 항목 분해

> 2026-02-15 18:45 ~ 18:52

## 대상

/go 루프에서 나온 3개 Open + 10개 ⚠️ 항목을 분석.

## 분류 결과

### Known (순수 함수 테스트 가능 — 정답 있음)

| # | 항목 | 순수 함수 | 상태 |
|---|------|-----------|------|
| A1 | TAB (trap) | `resolveTabWithinZone(loop=true)` | ✅ 실행 완료 — 22개 test |
| A2 | TAB (flow) | `resolveTabWithinZone` + `resolveTabEscapeZone` | ✅ 실행 완료 |
| A3 | TAB (escape) | `resolveTabEscapeZone` | ✅ 실행 완료 |
| A4 | ESCAPE (deselect) | `resolveEscape` | ✅ 실행 완료 — 5개 test |
| A5 | ESCAPE (close) | `resolveEscape` | ✅ 실행 완료 |
| A6 | EXPAND (toggle) | `resolveExpansion` | ✅ 실행 완료 — 7개 test |

### Open (의사결정 또는 구현 필요)

| # | 항목 | 이유 |
|---|------|------|
| B1 | ACTIVATE | `document.getElementById` DOM 직접 접근 — mock document 또는 E2E로만 검증 가능 |
| B2 | Focus Stack | STACK_PUSH/POP 구현 자체 없음 — Overlay(B3)와 함께 설계 필요 |
| B3 | G3: Overlay | 구현 없음 — dialog/modal 시스템 설계 필요 |
| B4 | G4: recoveryTargetId | RECOVER 실행 경로 불명확 — E2E 레벨 검증 |
| B5 | G5: seamless | builderBlock/application role 전용 — 현재 사용처 없어 우선순위 낮음 |

## 실행 결과

### 리팩토링

- `tab.ts` → `resolveTab.ts` + `tab.ts` (resolver/command 분리)
- `resolveEscape.ts` 신규 (escape 순수 로직 추출)

### 커밋 기록

| Commit | 내용 | 테스트 |
|--------|------|--------|
| `ece17ba` | expand/tab/escape resolver 테스트 + tab.ts 리팩토링 | 275 pass |

### SPEC Coverage 변화

- ⚠️ → ✅: Tab (trap/flow/escape), Dismiss (escape), Expand (tree) — 5개 격상
- 남은 ⚠️: Activate (DOM 의존), Focus Stack (미구현), Select (followFocus)
- 남은 ❌: Overlay (미구현)

## 판단 근거

- TAB의 core는 배열 인덱스 계산 → 순수함수 추출 → 테스트
- ESCAPE의 core는 config 분기 → 순수 switch → 테스트
- EXPAND는 이미 `resolveExpansion` 분리 상태
- ACTIVATE의 `document.getElementById`는 DOM 없이 불가 → E2E 의존
- Focus Stack/Overlay는 구현 자체가 없어 테스트 작성 불가

## Open 항목 의사결정 필요

1. **B3 Overlay**: dialog/modal 패턴을 어떤 구조로 만들 것인가? (focus stack push/pop + z-index 관리)
2. **B1 ACTIVATE**: DOM mock을 도입할 것인가, E2E로 충분한가?
3. **B2/B4/B5**: 우선순위가 낮아 당장 처리 불요. Backlog로 이동 권장.
