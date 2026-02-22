# APG Testing Rebalance — Testing Trophy 전략

> **WHY**: 유닛 테스트 중심의 테스트 피라미드는 이 OS의 핵심 복잡성인 **커맨드 간 오케스트레이션**을 검증하지 못한다. `Delete → Focus Draft` 버그가 증거. Testing Trophy 전략으로 전환하여 Integration 레이어를 가장 두껍게 만든다.

## Goals

1. **2-Tier Integration 구축**: APG Contract (Tier 1: pressKey→attrs) + Orchestration (Tier 2: dispatch→state)
2. **Unit 테스트 정리**: 순수 함수/알고리즘에만 집중 (54개 → ~35개)
3. **APG 준수 증명 품질 향상**: 사용자 행동 시뮬레이션 + ARIA 속성 검증

## Scope

- **In Scope**:
    - 기존 APG 테스트 6개 → pressKey/click + attrs 패턴 전환
    - OS Command Unit 19개 → Integration 마이그레이션
    - 사소한 Unit 4개 제거 (흡수 완료 후)
- **Out of Scope**:
    - 앱 레벨 유닛 테스트 (builder 7개, todo 1개 등) — 별도 판단
    - E2E 테스트 변경
    - 프로덕션 코드 변경 (테스트 리밸런싱만)

## Testing Trophy Strategy (The 2-Tier Model)

```
┌───────────────────────────────────────────────┐
│  E2E (Playwright) — 가드레일. 22개 유지       │
├───────────────────────────────────────────────┤
│  Tier 1: APG Contract                        │  pressKey/click → attrs
│  "사용자 행동 → APG 명세 준수"                │  Phase 1→5 전체
├───────────────────────────────────────────────┤
│  Tier 2: Orchestration Integration            │  dispatch → state
│  "커맨드 간 상호작용 정확성"                   │  Phase 3→4
├───────────────────────────────────────────────┤
│  Unit — 순수 알고리즘/함수만                  │  ~35개
└───────────────────────────────────────────────┘
```

### Target Metrics

| Layer | Before | After |
|-------|:------:|:-----:|
| Unit | 54 (59%) | ~35 (38%) |
| APG Contract (Tier 1) | 8 (9%) | 8 (9%) — 품질↑ |
| Integration (Tier 2) | 8 (9%) | ~22 (24%) |
| E2E | 22 (24%) | 22 (24%) |
