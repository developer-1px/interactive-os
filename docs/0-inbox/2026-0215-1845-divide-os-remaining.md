# /divide 보고서 — OS-PRD 잔여 항목 분해

> 2026-02-15 18:45 ~ 18:55

## 대상

/go 루프에서 나온 3개 Open + 10개 ⚠️ 항목을 분석.

## 분류 결과

### Known (순수 함수 테스트 가능 — 정답 있음)

| # | 항목 | 순수 함수 | 상태 |
|---|------|-----------|------|
| A1 | TAB (trap) | `resolveTabWithinZone(loop=true)` | ✅ 22개 test |
| A2 | TAB (flow) | `resolveTabWithinZone` + `resolveTabEscapeZone` | ✅ |
| A3 | TAB (escape) | `resolveTabEscapeZone` | ✅ |
| A4 | ESCAPE (deselect) | `resolveEscape` | ✅ 5개 test |
| A5 | ESCAPE (close) | `resolveEscape` | ✅ |
| A6 | EXPAND (toggle) | `resolveExpansion` | ✅ 7개 test |
| A7 | Focus Stack (PUSH/POP) | Immer state 전환 | ✅ 9개 test (B2에서 재분류) |

### 판정 완료 (E2E 충분)

| # | 항목 | 이유 |
|---|------|------|
| B1 | ACTIVATE | effect 코드가 자명한 수준. E2E 커버리지 충분 |

### Open (의사결정 필요)

| # | 항목 | 이유 |
|---|------|------|
| B3 | G3: Overlay | 구현 없음 — dialog/modal 시스템 설계 필요 |
| B4 | G4: recoveryTargetId | RECOVER 실행 경로 불명확 — 우선순위 낮음 |
| B5 | G5: seamless | 현재 사용처 없어 우선순위 낮음 |

## 리팩토링 부산물

- `tab.ts` → `resolveTab.ts` + `tab.ts` (resolver/command 분리)
- `resolveEscape.ts` 신규 (escape 순수 로직 추출)

## 커밋 기록

| Commit | 내용 | 테스트 |
|--------|------|--------|
| `ece17ba` | expand/tab/escape resolver + tab.ts 리팩토링 | 275 pass |
| `016d086` | Focus Stack unit tests (B2 재분류) | 284 pass |

## SPEC Coverage 최종

- ✅: 18개 (unit test 있음)
- ⚠️: 2개 (Activate E2E 충분, Select followFocus E2E 있음)
- ❌: 1개 (Overlay 미구현)
