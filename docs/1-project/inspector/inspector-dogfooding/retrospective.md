# Retrospective: inspector-dogfooding T6-T9

> data-inspector 가드 제거 + OS citizen 전환
> 2026-03-08

## 세션 요약

- **목표**: `[data-inspector]` 이벤트 차단 가드 전면 제거, Inspector를 정상 OS citizen으로 전환
- **결과**: 5곳 가드 제거, transaction scope prefix 필터로 대체. 628 tests pass, 0 new fail
- **워크플로우**: /discussion -> /blueprint -> /auto (T6-T9 direct -> /audit -> /doubt -> /retrospect)

## Knowledge Harvest

| # | 지식 | 반영 |
|---|------|------|
| K1 | Transaction.handlerScope으로 앱별 로그 분리 가능 | inspector/app.ts 구현 |
| K2 | Inspector sub-scope는 prefix match 필요 (exact match 불가) | audit.md 선례 |
| K3 | OG-024: expand.initial은 정적 아이템만 지원 | os-gaps.md |
| K4 | Focus 경쟁 = DevTools 패턴 (정당한 예외) | audit.md 선례 |

## KPT

### Keep
- Transaction scope 필터링: 이벤트 차단(5곳 산재) -> 앱 로직 1곳 통합. 더 정확하고 유지보수 용이
- /doubt 자기교정: disabledGroups 대안 시도 -> prefix match 불가 확인 -> 빠르게 되돌림

### Problem
- (없음 — Clear 도메인 제거 작업)

### Try
- (없음)

## 액션

총 액션: 1건. 반영 완료: 1건 (K4 audit.md 선례 추가). 미반영: 0건.
