---
description: 자율 실행 에이전트 루프. 상태를 복원하고, 멀티턴 게이트로 품질을 보장한다.
---

## /go — 파이프라인 라우터

> `/go`는 세 가지 뜻이다:
> 1. **"시작해"** — 새 세션. 상태를 파악하고 올바른 워크플로우로 라우팅.
> 2. **"이어해"** — 하다 만 작업. 마지막 단계에서 재개.
> 3. **"진행해"** — AI가 질문했을 때 "ㅇㅇ 해".
>
> `/go`는 **라우터**다. 직접 코드를 수정하지 않는다.
> 상태를 읽고, 스킬을 호출하고, **각 스킬의 Exit Criteria로 완료를 확인**한다.

### 핵심 원칙

> **매 단계 완료 후 commit한다.**
> **각 스킬은 자기 Exit Criteria를 소유한다.** `/go`는 "통과 여부"만 확인한다.

---

## 부팅

1. `.agent/rules.md`를 읽는다.
2. **대화 맥락이 기본값이다.** 현재 대화에서 진행 중인 주제의 `BOARD.md`를 읽는다.
   대화 맥락이 없으면 → `docs/STATUS.md`의 Active Focus를 따른다.
3. **`--os` 플래그 확인**: 인자에 `--os`가 있으면 OS 설계 모드. 태스크 사이클에서 OS1→OS2 경로가 활성화된다.
   - OS 설계 모드: `usage → stub(interface) → red → green` — interface가 계약, 에이전트 독자 행동을 tsc로 차단
   - 기능 구현 모드 (기본): `spec → red → green` — spec(BDD)이 계약
4. 아래 **파이프라인**을 위에서부터 순서대로 판별한다. **첫 번째 매칭에서 실행.**

---

## 파이프라인

> `/go`는 한 단계를 실행한 후, **검증 → 재진입**을 반복한다.

### 태스크 사이클 (Heavy/Light)

| # | 판별 | 라우팅 | 행동 |
|---|------|--------|------|
| 0 | Task Map 없음 (BOARD.md에 Now 태스크 없음) | → `/plan` | Task Map 작성. 완료 후 → 재진입 |
| 1 | **Meta 프로젝트** + Now 태스크 있음 | → 직접 실행 | Red/Green 스킵. 태스크를 순서대로 수행. **완료 후 → Meta 검증 경로** |
| OS1 | **`--os` 플래그** + Now 태스크에 usage-spec 없음 | → `/usage` | 이상적 API 코드 작성 + 컨셉맵 검증 |
| OS2 | **`--os` 플래그** + usage-spec 있고 interface+stub 없음 | → `/stub` | usage를 컴파일 가능한 interface + stub으로 변환 |
| 2 | Now 태스크에 spec 없음 | → `/spec` | 해당 태스크의 BDD + DT 작성 |
| 3 | Now 태스크에 Red 테스트 없음 | → `/red` | 실패하는 테스트 작성 |
| 4 | Red 테스트 FAIL 있음 | → `/green` | 테스트 통과하는 최소 구현 |
| 5 | Green PASS → self-check 미실행 | → `/self-check` | spec 시나리오 ↔ import chain 추적 |
| 5F | **self-check FAIL** | → `/red` (#3 루프백) | 누락 시나리오의 테스트 추가 → green → self-check |
| 6 | self-check PASS → refactor 미실행 | → `/refactor` | 행동 불변으로 코드 정리 |
| 7 | refactor PASS + App + UI 미연결 | → `/bind` | headless → UI 연결 |
| 8 | 태스크 완료 | → 현황판 갱신 | BOARD.md에서 해당 태스크 ✅ → 다음 태스크로 #2 루프 |

### Code 검증 경로 (Heavy/Light)

| # | 판별 | 라우팅 | 행동 |
|---|------|--------|------|
| 9 | 모든 Now Done → `/audit` 미실행 | → `/audit` | OS 계약 전수 검사 |
| 10 | `/audit` 결격 | → 근본 원인 단계 | 해당 단계로 루프백 |
| 11 | `/audit` 통과 → `/doubt` 미실행 | → `/doubt` | 과잉 점검 |
| 12 | `/doubt` 통과 → `/verify` 미실행 | → `/verify` | 기계적 검증 (tsc, lint, test, build) |
| 13 | `/verify` 통과 → `/explain` 미실행 | → `/explain` | 프로젝트 해설 문서 생성 |
| 14 | `/explain` 완료 + Unresolved > 0 | → Now 승격 | Unresolved를 Now로 올리고 #0 루프 |
| 15 | `/explain` 완료 + Unresolved == 0 | → 🤖 `spec-verifier` | `.claude/agents/spec-verifier/AGENT.md`를 따른다 |
| 16 | `spec-verifier` FAIL | → 수정 → 재의뢰 | #15 루프 |
| 17 | `spec-verifier` PASS | → 🤖 `/qa` | `.claude/agents/qa/AGENT.md`를 따른다 |
| 18 | `/qa` FAIL | → 수정 → 재의뢰 | #17 루프 |
| 19 | `/qa` ALL PASS | → `/retrospect` → `/archive` | 종료 |

### Meta 검증 경로

> Meta 프로젝트는 코드가 없으므로 `/audit`을 스킵한다.

| # | 판별 | 라우팅 | 행동 |
|---|------|--------|------|
| M9 | 모든 Now Done → `/doubt` 미실행 | → `/doubt` | 과잉 점검 (/audit 역할 흡수) |
| M10 | `/doubt` 통과 → `/verify` 미실행 | → `/verify --meta` | regression만 확인 (tsc, test) |
| M11 | `/verify` 통과 → `/explain` 미실행 | → `/explain` | 프로젝트 해설 문서 생성 |
| M12 | `/explain` 완료 + Unresolved > 0 | → Now 승격 | Unresolved를 Now로 올리고 #0 루프 |
| M13 | `/explain` 완료 + Unresolved == 0 | → 🤖 `/qa --meta` | `.claude/agents/qa/AGENT.md`를 따른다 |
| M14 | `/qa --meta` FAIL | → 수정 → 재의뢰 | M13 루프 |
| M15 | `/qa --meta` ALL PASS | → `/retrospect` → `/archive` | 종료 |

---

## 개발 순서 vs 출하 게이트

> **개발 순서는 AI 재량으로 유연하게 조정할 수 있다.**
> 코드 먼저 → 테스트 나중, spec 스킵 후 구현 먼저 — 모두 허용.
>
> **그러나 출하 게이트(spec-verifier, QA)는 비타협이다.**
> 게이트 전제조건 미충족(예: spec.md 없음)은 "건너뛰어도 된다"가 아니라
> **"전제조건을 만들어서 통과시켜라"는 신호다.**
> spec-verifier에 spec.md가 없으면 → spec.md를 작성한다.
> QA에 필요한 산출물이 없으면 → 산출물을 만든다.
> **게이트 FAIL = skip이 아니라 반려. 돌아가서 채워야 한다.**

---

## 재시도 규칙

```
스킬 Exit Criteria 미달 → 같은 스킬 재실행 (retry += 1)
retry ≤ 3 → 재실행
retry > 3 → ⛔ 보고하고 정지. 사용자에게 상황 설명.
```

재시도 시 이전 턴의 미달 항목을 명시적으로 전달한다:
```
"이전 턴에서 [미달 항목]이 남아있습니다. 이것만 해결하세요."
```

---

## 모호함 프로토콜

**모호함 = 시그널.** 실행 중 "이게 맞나?" 망설임이 발생하면:

```
1. Skill tool로 /conflict → /blueprint → /divide 순차 호출 (자율적으로)
2. 해소됨 → Task Map 갱신 → 원래 단계 복귀
3. 여전히 모호 → 진행한 문서를 백로그에 넣고 사용자에게 보고
```

**⛔ 비가역 게이트**: 설계 변경, API 수정 등 되돌리기 어려운 결정이 필요하다고 판단되면 **즉시 정지하고 사용자 확인**을 받는다.

---

## 라우팅 후 행동

**반드시 Skill tool을 사용하여 해당 스킬을 호출한다.**

```
예시: /red로 라우팅 → Skill tool: skill="red"
예시: /verify --meta → Skill tool: skill="verify", args="--meta"
```

### 금지 사항
- `/go`가 직접 코드를 수정하는 것은 금지. 반드시 스킬을 통해 실행한다.
- 워크플로우 이름만 보고 "아는 대로" 행동하는 것은 금지. Skill tool이 프롬프트를 로딩한다.
- SKILL.md를 `view_file`로 읽고 인라인 실행하는 것은 금지. **Skill tool 호출만 허용.**

### 예외
- **에이전트(`spec-verifier`, `qa`)**: Agent tool (`isolation: "worktree"`)로 호출. 프로토콜은 각 AGENT.md가 소유.
- **#1 Meta 직접 실행**: Meta 프로젝트의 태스크 수행은 `/go`가 직접 한다.
- **#8 현황판 갱신**: BOARD.md 업데이트는 `/go`가 직접 한다.

---

## 완료의 정의 (DoD)

| 증명 상태 | BOARD.md 표기 |
|-----------|--------------|
| Red→Green + regression 없음 | `[x] T명 — tsc 0 | +N tests | build OK ✅` |
| Meta (코드 없음) | `[x] T명 — [증빙 요약] ✅` |
| 수정했지만 검증 미통과 | `[ ] T명 — 검증 미완` |
| Spec Verify 대기 중 | `🔍 Spec Verify 대기` |
| Spec Verify 실패 | `❌ SPEC FAIL: [시나리오] — [요약]` |
| QA 대기 중 | `🔍 QA 대기` |
| QA 실패 | `❌ QA FAIL: [게이트명] — [요약]` |
| QA 통과 | `✅ QA PASS` → `/retrospect` → `/archive` 진행 |

증빙 없이 `✅`만 찍는 것은 금지.

---

## 상태 확인 방법

```bash
# 테스트 상태
source ~/.nvm/nvm.sh && nvm use && npx vitest run --reporter=verbose [테스트파일경로] 2>&1 | tail -30

# 타입체크
npm run typecheck

# 린트
npx biome check
```
