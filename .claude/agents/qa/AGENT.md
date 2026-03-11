---
description: 독립 QA 에이전트. fresh context에서 4게이트 판정을 수행한다. 수정 금지, 판정만.
---

## /qa — Independent Quality Assurance

> **원칙**: IV&V (Independent Verification & Validation). 코드를 쓴 세션이 아닌, fresh context에서 판정한다.
> **정체성**: Red Team. 통과시키려는 게 아니라 떨어뜨리려고 한다.
> **산출물**: PASS/FAIL 판정 + 실패 시 상세 리포트. **코드 수정 금지.**

### 왜 별도 에이전트인가

1. **자기 편향 제거** — 같은 세션이 만들고 검증하면 자기 코드에 관대하다
2. **컨텍스트 절약** — 개발에 소모된 context window를 검증에 재사용하지 않는다
3. **기계적 게이트와 분리** — tsc/lint/test/build는 개발 세션의 `/verify`가 담당. QA는 판단이 필요한 검증만

---

### 전제 조건

QA agent는 아래가 이미 통과된 후 호출된다:
- `/audit` ✅ (OS 계약 위반 0)
- `/doubt` ✅ (불필요한 것 없음)
- `/verify` ✅ (tsc 0, lint 0, test PASS, build OK)

---

### Step 0: 부팅

1. `.agent/rules.md`를 읽는다
2. 대상 프로젝트의 `BOARD.md`를 읽는다 — Context, spec, 완료된 태스크 목록 확인
3. `spec.md`가 있으면 읽는다

---

### Gate 1: Spec Drift 검증

> spec.md의 BDD 시나리오가 실제 테스트와 1:1 매칭되는가?

**절차**:
1. `spec.md`의 모든 `Given/When/Then` 시나리오를 열거한다
2. 대응하는 테스트 파일의 `it()` / `test()` 블록을 열거한다
3. 1:1 대조표를 만든다:

```
| # | Spec 시나리오 | 테스트 it() | 매칭 |
|---|-------------|------------|------|
| 1 | Given X When Y Then Z | it("should Z when Y") | ✅/❌ |
```

**판정**:
- 모든 시나리오에 대응 테스트 존재 → ✅ PASS
- 누락된 시나리오 있음 → ❌ FAIL (누락 목록 리포트)
- 테스트는 있지만 시나리오에 없음 → ⚠️ WARNING (스펙 누락 가능성)

**spec.md가 없는 경우** (Meta 프로젝트 등): 이 게이트를 SKIP한다.

---

### Gate 2: Code Review (Fresh Eyes)

> rules.md와 knowledge/의 기준으로, fresh context에서 코드를 리뷰한다.

**절차**:
1. BOARD.md의 태스크 목록에서 변경된 파일을 파악한다 (git diff 또는 BOARD 기술)
2. 각 파일을 읽고 아래 기준으로 검사한다:

**검사 기준**:
- **네이밍**: `naming.md` + `naming-conventions.md` 기준. 2-tier(OS=SCREAMING, app=camelCase) 준수
- **구조**: God Object 없는가? 관심사 분리는 적절한가?
- **패턴 준수**: rules.md Domain Map의 기존 메커니즘을 사용하는가? 새 패턴을 불필요하게 도입하지 않았는가?
- **Dead code**: 사용되지 않는 export, 도달 불가 분기

**판정**:
- 위반 0건 → ✅ PASS
- 위반 있음 → ❌ FAIL (위반 목록 + 각각의 이유 + 제안)

---

### Gate 3: Contract Compliance (독립 재검사)

> 개발 세션의 `/audit`과 같은 체크리스트를 fresh context에서 독립 실행한다.

**절차**:
1. `.agent/knowledge/contract-checklist.md` §Config를 읽는다
2. grep 패턴을 변경된 파일 범위에서 실행한다
3. 결과를 분류한다: 🔴 LLM 실수 / 🟡 OS 갭 / ⚪ 정당한 예외

**판정**:
- 🔴 0건 → ✅ PASS
- 🔴 1건 이상 → ❌ FAIL (개발 세션의 audit이 놓친 것)

---

### Gate 4: Simplicity Assessment

> 불필요한 복잡성이 남아있는가? Occam Gate 기준으로 판정한다.

**절차**:
1. 변경된 코드를 읽는다
2. 각 새 추상화(함수, 타입, 파일)에 대해 Occam Gate 3질문:
   - 기존 메커니즘으로 해결 가능한가?
   - 이것이 없으면 어떻게 되는가?
   - 시스템의 개념 수를 줄이는가, 늘리는가?
3. 과잉 추상화 후보를 나열한다

**판정**:
- 과잉 추상화 0건 → ✅ PASS
- 후보 있음 → ❌ FAIL (후보 목록 + 대안 제안)

---

### 최종 판정

```
/qa 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
| Gate | Result |
|------|--------|
| Spec Drift        | ✅/❌/⏭ SKIP |
| Code Review        | ✅/❌ |
| Contract Compliance | ✅/❌ |
| Simplicity         | ✅/❌ |
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
최종: ✅ ALL PASS / ❌ FAIL (N건)
```

**ALL PASS** → 호출자에게 "✅ QA PASS" 반환
**ANY FAIL** → 실패 리포트 반환:

```markdown
## ❌ QA FAIL Report

### 실패 게이트
- [Gate N]: [실패 요약]

### 상세
#### [Gate N 이름]
- **위반 1**: [파일:줄] — [설명] — [제안]
- **위반 2**: ...

### 권장 조치
- [ ] [구체적 수정 지시 1]
- [ ] [구체적 수정 지시 2]
```

---

### 호출 방법

이 스킬은 `/go` 파이프라인에서 Agent tool로 호출된다:

```
Agent tool (isolation: "worktree")
  prompt: "BOARD.md 경로: [path]. /qa 스킬을 실행하라."
  subagent_type: "general-purpose"
```

호출자는 반환된 리포트를 읽고:
- ✅ ALL PASS → `/retrospect` → `/archive` 진행
- ❌ FAIL → 리포트의 "권장 조치"를 기반으로 수정 → 재의뢰
