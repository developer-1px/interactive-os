# bdd-tdd-gate

- Feature Name: `bdd-tdd-gate`
- Start Date: 2026-02-23

## Summary

코드 수정 전 BDD 시나리오(`.feature`)를 물리적 게이트로 강제하는 워크플로우 개선.

## Motivation

Discussion→Project 전환 시 문서화는 잘 된다 — 산출물(`.md`)이 곧 게이트이기 때문.
그러나 코드 수정 시 `/tdd`는 Step 번호로만 존재하고 물리적 강제가 없다.
LLM은 goal fixation으로 중간 단계를 건너뛴다 (`rules.md#13`).

**해결**: Discussion의 성공 패턴(산출물 = 게이트)을 TDD에 적용.
Gherkin `.feature` 파일 → Red `.test.ts` → Green 구현의 3단계 체인, 각 게이트를 물리적으로 강제.

## Guide-level explanation

### 적용 기준

> "이 Goal에 Scenario를 쓸 수 있는가?"

- Yes → 3단계 체인 적용
- No → 바로 수정 (오타, import 등)

### 3단계 체인

```
1. .feature 파일 (Gherkin)  — 사고    ⛔ 없으면 테스트 코드 금지
2. Red .test.ts              — 인코딩  ⛔ 없으면 구현 코드 금지
3. Green 구현                — 증명    ⛔ 없으면 완료 금지
```

### 진입점

| 진입 | 시나리오 출처 | `.feature` 내용 |
|------|-------------|----------------|
| 새 기능 | PRD | 기대 동작 시나리오 |
| 버그 수정 | 재현 | 재현 시나리오 (필수) |

### 파일 위치

```
{slice}/tests/
  ├── features/     ← BDD 시나리오 (NEW)
  │     └── tree-clipboard.feature
  ├── unit/
  ├── integration/
  └── e2e/
```

### 검증

- Scenario 수 = `it()` 수 (1:1 매핑)
- `.feature` 존재 여부 = 물리적 게이트

## Reference-level explanation

### 영향받는 워크플로우

1. **`/tdd`** — BDD 시나리오 작성 + Red 게이트 추가
2. **`/go`** — Step 9의 산출물 검증 강화
3. **`/issue`** — D5 Red 단계에 `.feature` 선행 조건 추가
4. **`/test`** — `features/` 디렉토리 추가

## Unresolved questions

- `.feature` 파일이 테스트와 drift하는 것을 어떻게 방지할 것인가?
- 기존 934개 테스트에 대한 소급 `.feature` 작성 범위는?
