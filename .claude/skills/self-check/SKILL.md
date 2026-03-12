---
description: spec 시나리오가 실제로 실현되었는지 import chain까지 추적하여 검증한다. FAIL 시 /red로 루프백.
---

## /self-check — 스펙 실현 검증

> **산출물**: 시나리오 대조표 (인라인). PASS 또는 FAIL + 누락 시나리오 목록.
> **원칙**: 테스트 PASS ≠ 스펙 실현. 코드가 존재해도 실행 경로에 연결되지 않으면 동작하지 않는다.
> **교훈**: url-routing에서 `register.ts`에 코드가 있었지만 `main.tsx`에서 import하지 않아 미동작.

---

### Step 0: 입력 확인

1. 프로젝트 `spec.md`를 읽는다
2. 진입점 파일을 식별한다 (앱의 `main.tsx`, `__root.tsx` 등)

spec.md가 없으면 ⛔ SKIP (아키텍처/리팩토링 태스크).

---

### Step 1: 시나리오 추출

spec.md의 모든 `Given/When/Then` 시나리오에서 **Then 절**을 추출한다.

```
| # | Scenario | Then |
|---|----------|------|
| S1 | ... | ... |
```

---

### Step 2: 실현 추적 (코어)

각 Then 절에 대해 **두 가지 질문**에 답한다:

#### Q1: 코드가 존재하는가? (필요조건)

`grep`으로 해당 동작을 구현하는 코드를 찾는다.
- 함수명, 커맨드명, 이벤트 리스너 등

#### Q2: 코드가 실행되는가? (충분조건)

진입점(main.tsx 등)부터 **import chain을 추적**한다:

```
진입점 → import A → import B → ... → 대상 코드
```

- import chain이 연결되면 → ✅ 실행됨
- import chain이 끊기면 → ❌ 실행 안 됨 (dead code)

**추적 방법**:
1. 진입점 파일을 읽고 모든 import를 나열한다
2. 대상 코드가 속한 모듈이 import tree에 포함되는지 확인한다
3. side-effect import (`import "module"`)도 추적한다 — 이것이 url-routing에서 누락된 것

---

### Step 3: 대조표 작성

```
| # | Scenario | Then | 코드 존재 | 실행 경로 | 판정 |
|---|----------|------|----------|----------|------|
| S1 | ... | ... | ✅ file:L42 | main→register→subscribe | ✅ |
| S2 | ... | ... | ✅ file:L60 | ❌ import 누락 | ❌ FIX |
| S3 | ... | ... | ❌ 미구현 | — | ❌ FIX |
```

---

### Step 4: 판정

- 전 시나리오 ✅ → **PASS**. 다음 단계(`/refactor`)로 진행.
- 1건이라도 ❌ → **FAIL**. `/red`로 루프백하여 누락 시나리오의 테스트를 추가한다.

**FAIL 시 행동**: 대조표에서 ❌인 시나리오를 명시적으로 보고한다.
`/go`가 이 보고를 받아 `/red` → `/green` → `/self-check` 루프를 재실행한다.

---

## Exit Criteria

- [ ] spec.md의 전 시나리오에 대해 대조표 작성됨
- [ ] 각 Then 절의 코드 존재 + 실행 경로가 확인됨
- [ ] PASS: 전 시나리오 ✅ / FAIL: ❌ 시나리오 목록 명시
