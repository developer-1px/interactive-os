# /divide 보고서 — OS-PRD 잔여 항목 분해

> 2026-02-15 18:45

## 대상

/go 루프에서 나온 3개 Open + 10개 ⚠️ 항목을 분석.

## 분류 결과

### Known (순수 함수 테스트 가능 — 정답 있음)

| # | 항목 | 순수 함수 | 테스트 전략 |
|---|------|-----------|------------|
| A1 | TAB (trap) | `moveFocusWithinZone(loop=true)` | items + 포커스 → 다음 포커스 |
| A2 | TAB (flow) | `moveFocusWithinZone` + `escapeToNextZone` | 경계에서 escape |
| A3 | TAB (escape) | `escapeToNextZone` | 즉시 zone 이동 |
| A4 | ESCAPE (deselect) | Immer 상태 전환 | selection 비움 |
| A5 | ESCAPE (close) | Immer + onDismiss dispatch | activeZone=null |
| A6 | EXPAND (toggle) | `resolveExpansion` | 순수 toggle/expand/collapse |

### Open (의사결정 또는 구현 필요)

| # | 항목 | 이유 |
|---|------|------|
| B1 | ACTIVATE | `document.getElementById` DOM 직접 접근 — mock 설계 필요 |
| B2 | Focus Stack | STACK_PUSH/POP 구현 자체 없음 |
| B3 | G3: Overlay | 구현 없음, 설계 필요 |
| B4 | G4: recoveryTargetId | RECOVER 실행 경로 불명확 |
| B5 | G5: seamless | 미구현 확인 필요 |

## 실행 순서

A6 (expand) → A4-A5 (escape) → A1-A3 (tab) → 커밋 → Open은 보고

## 판단 근거

- TAB의 `moveFocusWithinZone`과 `escapeToNextZone`은 ctx.inject로 데이터를 받지만, 실제 로직은 배열 인덱스 계산 → 순수 함수로 테스트 가능
- ESCAPE는 config.dismiss.escape 분기 + Immer produce → 상태 전환 테스트
- EXPAND는 이미 `resolveExpansion` 순수 함수가 분리되어 있음
- ACTIVATE의 `document.getElementById`는 DOM mock 없이 테스트 불가 → Open
