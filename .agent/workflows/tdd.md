---
description: PRD에서 시나리오를 뽑아 Red-Green-Refactor를 돌리는 전략. /test가 How라면 /tdd는 What.
---

## /tdd — 테스트가 먼저다

### 원칙

> 코드를 쓰기 전에 테스트를 쓴다.
> 테스트를 쓰기 전에 시나리오를 쓴다.
> 시나리오를 쓰기 전에 생각한다.
>
> 각 단계의 산출물이 다음 단계의 입력이다.
> 산출물 없이 다음 단계로 진입하는 것은 금지.

### 적용 기준

> **"이 Goal에 Scenario를 쓸 수 있는가?"**

- **Yes** → 3단계 체인 적용 (아래 절차)
- **No** → 바로 수정 (오타, import 정리 등 — Given-When-Then이 동어반복이 되는 변경)

버그 수정은 **항상 Yes**다. 재현 시나리오가 곧 Given-When-Then이다.

### 절차: .feature → Red → Green

```
1. Scenarios  — .feature 파일 (사고)    ⛔ 없으면 테스트 코드 작성 금지
2. Red        — .test.ts 실패 (인코딩)  ⛔ 없으면 구현 코드 작성 금지
3. Green      — 최소 구현 (증명)        ⛔ 없으면 완료 선언 금지
```

---

#### 1. Scenarios — Gherkin `.feature` 파일 작성

**진입점에 따라 시나리오 출처가 다르다:**

| 진입 | 시나리오 출처 | `.feature` 내용 |
|------|-------------|----------------|
| 새 기능 | PRD | 기대 동작 시나리오 |
| 버그 수정 | 재현 | 재현 시나리오 (필수) |

**위치**: `{slice}/tests/features/{feature-name}.feature`

**형식**: Gherkin (업계 표준 — Feature / Scenario / Given-When-Then)

```gherkin
Feature: Tree Clipboard Paste
  PRD: §3.2 "Paste respects tree hierarchy"

  Scenario: Paste on container
    Given folder-A has children [child-1, child-2]
    And item-X is copied to clipboard
    When paste on folder-A
    Then item-X-copy is the last child of folder-A
    And folder-A has 3 children

  Scenario: Paste on nested leaf
    Given folder-A has children [child-1, child-2]
    And item-X is copied to clipboard
    When paste on child-1
    Then item-X-copy is inserted after child-1

  Scenario: Paste with empty clipboard
    Given nothing is copied
    When paste on folder-A
    Then state is unchanged
```

**버그 재현 `.feature` 예시:**

```gherkin
Feature: Bug - Focus lost after paste

  Scenario: Reproduce - focus jumps to wrong item
    Given item-3 is focused in list
    And item-X is copied to clipboard
    When paste on item-3
    Then focus should remain on item-3
    # BUG: focus jumps to item-0
```

**전수 열거 체크** (rules.md #14): 시나리오 작성 시 모든 케이스를 나열한다.

⛔ **Gate**: `.feature` 파일이 존재하지 않으면 테스트 코드를 작성하지 않는다.

---

#### 2. Red — 실패하는 테스트 작성

- `.feature`의 각 Scenario를 1:1로 `it()` 블록으로 변환한다.
- Given → setup, When → action, Then → assertion.
- `/test` 워크플로우에 따라 적절한 레벨(Unit/Integration/E2E)을 선택한다.
- **vitest 실행 → 🔴 FAIL 확인.**
- FAIL 사유가 "미구현"이지 "테스트 오류"가 아닌지 확인한다.

**검증**: `.feature`의 Scenario 수 = `.test.ts`의 `it()` 수. 불일치 = 누락.

⛔ **Gate**: 최소 1개 테스트가 🔴 FAIL하지 않으면 구현 코드를 작성하지 않는다.

---

#### 3. Green — 최소 구현

- 테스트를 통과시키는 **최소한의 코드**만 작성한다.
- 과하게 구현하지 않는다. 테스트가 요구하는 것만 구현한다.
- **vitest 실행 → 🟢 PASS 확인.**

---

#### 4. Refactor (선택)

- 테스트가 통과하는 상태에서 코드를 정리한다.
- 테스트가 깨지면 리팩터가 잘못된 것이다.

---

#### 5. 반복

- 다음 Scenario로 돌아가 2단계(Red)부터 반복한다.

### Red → Green → Refactor

```
📝 Scenarios — Gherkin .feature 파일 (사고의 산출물)
🔴 Red       — 실패하는 테스트 작성 (스펙 인코딩)
🟢 Green     — 최소 구현으로 테스트 통과 (증명)
🔵 Refactor  — 테스트 유지하며 코드 정리 (개선)
```
