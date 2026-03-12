---
description: 자율 실행 에이전트 루프. 상태를 복원하고, 멀티턴 게이트로 품질을 보장한다.
---

## /go — 파이프라인 라우터 + 멀티턴 게이트

> `/go`는 세 가지 뜻이다:
> 1. **"시작해"** — 새 세션. 상태를 파악하고 올바른 워크플로우로 라우팅.
> 2. **"이어해"** — 하다 만 작업. 마지막 단계에서 재개.
> 3. **"진행해"** — AI가 질문했을 때 "ㅇㅇ 해".
>
> `/go`는 **라우터 + 검증자**다. 직접 코드를 수정하지 않는다.
> 상태를 읽고, 워크플로우를 실행하고, **정량 검증으로 완료를 확인**한다.

### 핵심 원칙

> **매 단계 완료 후 commit한다.**
> **매 단계 완료 후 정량 검증한다.** 미달이면 같은 단계를 재실행한다.

---

## 부팅

1. `.agent/rules.md`를 읽는다.
2. **대화 맥락이 기본값이다.** 현재 대화에서 진행 중인 주제의 `BOARD.md`를 읽는다.
   대화 맥락이 없으면 → `docs/STATUS.md`의 Active Focus를 따른다.
3. 아래 **파이프라인**을 위에서부터 순서대로 판별한다. **첫 번째 매칭에서 실행.**

---

## 파이프라인

> `/go`는 한 단계를 실행한 후, **검증 → 재진입**을 반복한다.

| # | 판별 | 라우팅 | 행동 |
|---|------|--------|------|
| 0 | Task Map 없음 (BOARD.md에 Now 태스크 없음) | → `/plan` | Task Map 작성. 완료 후 → 재진입 |
| 1 | **Meta 프로젝트** + Now 태스크 있음 | → 직접 실행 | Red/Green 스킵. 태스크를 순서대로 수행. **완료 후 → Meta 검증 경로 (#M7)** |
| 2 | Now 태스크에 spec 없음 (Heavy/Light) | → `/spec` | 해당 태스크의 BDD + DT 작성 |
| 3 | Now 태스크에 Red 테스트 없음 | → `/red` | 실패하는 테스트 작성 |
| 4 | Red 테스트 FAIL 있음 | → `/green` | 테스트 통과하는 최소 구현 |
| 4.5 | Green PASS → `/simplify` 미실행 | → `/simplify` | 리팩토링 (행동 변경 없이 코드 정리) |
| 4.7 | `/simplify` 완료 → spec 자가 검증 | → `/reflect` | spec.md 시나리오 ↔ 구현 대조 (아래 §Spec Self-Check 참조) |
| 5 | Spec 자가 검증 PASS + App + UI 미연결 | → `/bind` | headless → UI 연결 |
| 6 | 태스크 완료 | → 현황판 갱신 | BOARD.md에서 해당 태스크 ✅ → 다음 태스크로 #2 루프 |

### Code 검증 경로 (Heavy/Light)

| # | 판별 | 라우팅 | 행동 |
|---|------|--------|------|
| 7 | 모든 Now Done → `/audit` 미실행 | → `/audit` | 필수 게이트 |
| 8 | `/audit` 결격 | → 근본 원인 단계 | 해당 단계로 루프백 |
| 9 | `/audit` 통과 → `/doubt` 미실행 | → `/doubt` | 과잉 점검 |
| 10 | `/doubt` 통과 → `/verify` 미실행 | → `/verify` | 기계적 검증 (tsc, lint, test, build) |
| 11 | `/verify` 통과 → `/explain` 미실행 | → `/explain` | 프로젝트 해설 문서 생성. QA 검증 대상에 포함 |
| 12 | `/explain` 완료 + Unresolved > 0 | → Now 승격 | Unresolved를 Now로 올리고 #0 루프 |
| 13 | `/explain` 완료 + Unresolved == 0 | → 🤖 `spec-verifier` agent | **Spec 검증** (아래 §Spec Verifier 참조) |
| 14 | `spec-verifier` FAIL | → 수정 → 재의뢰 | 실패 테스트 코드 기반 수정 후 #13 루프 |
| 15 | `spec-verifier` PASS | → 🤖 `/qa` agent | **코드 품질 QA** (아래 §QA Agent 참조) |
| 16 | `/qa` FAIL | → 수정 → 재의뢰 | QA 리포트 기반 수정 후 #15 루프 |
| 17 | `/qa` ALL PASS | → `/retrospect` → `/archive` | 종료 |

### Meta 검증 경로

> Meta 프로젝트는 코드가 없으므로 `/audit`(코드 계약 grep)을 스킵한다.
> `/doubt`이 audit의 "불필요 탐지" 역할을 흡수한다.

| # | 판별 | 라우팅 | 행동 |
|---|------|--------|------|
| M7 | 모든 Now Done → `/doubt` 미실행 | → `/doubt` | 과잉 점검 (/audit 역할 흡수) |
| M8 | `/doubt` 통과 → `/verify` 미실행 | → `/verify --meta` | regression만 확인 (tsc, test). 신규 코드 검증 없음 |
| M9 | `/verify` 통과 → `/explain` 미실행 | → `/explain` | 프로젝트 해설 문서 생성. QA 검증 대상에 포함 |
| M10 | `/explain` 완료 + Unresolved > 0 | → Now 승격 | Unresolved를 Now로 올리고 #0 루프 |
| M11 | `/explain` 완료 + Unresolved == 0 | → 🤖 `/qa --meta` agent | **Meta QA** (아래 §Meta QA 참조) |
| M12 | `/qa --meta` FAIL | → 수정 → 재의뢰 | 리포트 기반 수정 후 M11 루프 |
| M13 | `/qa --meta` ALL PASS | → `/retrospect` → `/archive` | 종료 |

---

## 멀티턴 게이트

**모든 단계 완료 후 정량 검증을 수행한다.** LLM의 "다 했어요" 선언을 신뢰하지 않는다.

### 검증 기준

| 단계 | 정량 기준 | 측정 방법 |
|------|----------|----------|
| `/plan` | Task Map 빈 셀 0, L 크기 0 | Task Map 파싱 |
| `/spec` | BDD 시나리오 ≥ 1, DT 행 ≥ 1 (Zone 태스크) | spec.md 파싱 |
| `/red` | `it()` 수 ≥ DT 행 수, 전부 FAIL | `vitest run` |
| `/green` | tsc 0 + lint 0 + 전부 PASS | `npm run typecheck && biome check && vitest run` |
| `/simplify` | tsc 0 + test PASS (행동 불변) | `npm run typecheck && vitest run` |
| spec 자가 검증 | spec.md 시나리오별 실현 증빙 | `/reflect` — 시나리오 대조표 |
| `/bind` | 화면에서 동작 확인 (headless test PASS) | `vitest run` |
| `/audit` | 전수 검사 증빙 로그 존재 (Code만) | 출력 확인 |
| `/verify` | tsc 0 + lint 0 + test PASS + build OK | `/verify` 게이트 순차 실행 |
| `/verify --meta` | tsc 0 + test PASS (regression만) | `/verify` 게이트 순차 실행 |
| `/explain` | Why/How/What/If 4섹션 + Mermaid ≥ 2개 + 프로젝트 폴더 저장 | 문서 존재 확인 |
| `spec-verifier` | 독립 테스트 전부 PASS (agent 반환값) | Agent tool worktree 실행 |
| `/qa` | Code 3게이트 ALL PASS (agent 반환값) | Agent tool worktree 실행 |
| `/qa --meta` | Meta 4게이트 ALL PASS (agent 반환값) | Agent tool worktree 실행 |

### 재시도 규칙 (정량 실패)

```
검증 실패 → 같은 단계 재실행 (retry += 1)
retry ≤ 3 → 재실행
retry > 3 → ⛔ 보고하고 정지. 사용자에게 상황 설명.
```

재시도 시 이전 턴의 미달 항목을 명시적으로 전달한다:
```
"이전 턴에서 [미달 항목]이 남아있습니다. 이것만 해결하세요."
```

### 모호함 프로토콜 (정성 실패)

**모호함 = 시그널.** 실행 중 "이게 맞나?", "이 방법으로 되나?" 망설임이 발생하면:

```
1. Skill tool로 /conflict → /blueprint → /divide 순차 호출 (자율적으로)
2. 해소됨 → Task Map 갱신 → 원래 단계 복귀
3. 여전히 모호 → 진행한 문서를 백로그에 넣고 사용자에게 보고
```

**⛔ 비가역 게이트**: 설계 변경, API 수정 등 되돌리기 어려운 결정이 필요하다고 판단되면 **즉시 정지하고 사용자 확인**을 받는다. conflict/blueprint 결과를 제시하되, 실행은 승인 후.

---

## 라우팅 후 행동

**반드시 Skill tool을 사용하여 해당 스킬을 호출한다.**

```
예시: 파이프라인이 `/red`로 라우팅 → Skill tool: skill="red"
예시: 파이프라인이 `/verify --meta`로 라우팅 → Skill tool: skill="verify", args="--meta"
```

### 금지 사항
- `/go`가 직접 코드를 수정하는 것은 금지. 반드시 스킬을 통해 실행한다.
- 워크플로우 이름만 보고 "아는 대로" 행동하는 것은 금지. Skill tool이 프롬프트를 로딩한다.
- SKILL.md를 `view_file`로 읽고 인라인 실행하는 것은 금지. **Skill tool 호출만 허용.**

### 예외
- **`/qa`**: Agent tool (`isolation: "worktree"`)로 호출한다 (아래 §QA Agent 참조).
- **#1 Meta 직접 실행**: Meta 프로젝트의 태스크 수행은 `/go`가 직접 한다 (코드 수정이 아닌 문서 작업).
- **#6 현황판 갱신**: BOARD.md 업데이트는 `/go`가 직접 한다.

---

## 완료의 정의 (DoD)

| 증명 상태 | BOARD.md 표기 |
|-----------|--------------|
| Red→Green + regression 없음 | `[x] T명 — tsc 0 | +N tests | build OK ✅` |
| Meta (코드 없음) | `[x] T명 — [증빙 요약] ✅` |
| 수정했지만 검증 미통과 | `[ ] T명 — 검증 미완` |
| Spec Verify 대기 중 | `🔍 Spec Verify 대기` (Now 섹션 하단) |
| Spec Verify 실패 | `❌ SPEC FAIL: [시나리오] — [요약]` |
| QA 대기 중 | `🔍 QA 대기` |
| QA 실패 | `❌ QA FAIL: [게이트명] — [요약]` |
| QA 통과 | `✅ QA PASS` → `/retrospect` → `/archive` 진행 |

증빙 없이 `✅`만 찍는 것은 금지.

---

## §Spec Self-Check — 태스크별 스펙 자가 검증 (#4.7)

> **원칙**: 테스트 PASS ≠ 스펙 실현. 코드가 존재해도 실행 경로에 연결되지 않으면 동작하지 않는다.
> **교훈**: url-routing에서 `register.ts`에 코드가 있었지만 `main.tsx`에서 import하지 않아 미동작.

### 절차

`/simplify` 완료 후, **spec.md의 각 시나리오를 하나씩 대조**한다:

1. spec.md를 읽는다
2. 각 시나리오의 **Then 절**마다:
   - 해당 동작을 실현하는 코드 경로를 **진입점(main.tsx 등)부터 추적**한다
   - "코드가 존재하는가?" (grep) — 필요조건
   - "코드가 실행되는가?" (import chain 추적) — 충분조건
3. 누락 발견 시 → 수정 후 `/green` 재실행 (#4 루프)

### 산출물

시나리오 대조표 (인라인, 파일 저장 불필요):

```
| # | Scenario | Then | 코드 존재 | 실행 경로 | 판정 |
|---|----------|------|----------|----------|------|
| S1 | ... | ... | ✅ file:L42 | main→register→subscribe | ✅ |
| S2 | ... | ... | ✅ file:L60 | ❌ import 누락 | ❌ FIX |
```

---

## §Spec Verifier — 기계적 스펙 검증 (#13)

> **원칙**: LLM이 "테스트가 스펙과 매칭되나?" 판단하면 같은 편향을 공유한다.
> spec에서 테스트를 직접 짜고, vitest가 판정한다. 오탐 허용, 누락 불허.

### 호출 방법

```
Agent tool:
  subagent_type: "general-purpose"
  isolation: "worktree"
  prompt: |
    프로젝트 BOARD.md: [BOARD 경로]

    .claude/agents/spec-verifier/AGENT.md를 읽고 실행하라.
    결과를 PASS/FAIL + 리포트로 반환하라.
```

### FAIL 시 루프

```
Spec Verifier FAIL → 실패 테스트 코드 + vitest 출력 읽기 → 수정 (개발 세션이 직접)
→ commit → /verify 재실행 → Spec Verifier 재의뢰 (#14 루프)
```

**오탐 판정**: 개발 세션이 "이건 오탐, 사유: ..." 판단 → QA로 진행 가능.

### 리포트 저장

- 파일명: `spec-verify-report-YYYY-MMDD-HHmm.md`
- 위치: 프로젝트 BOARD.md와 같은 폴더

---

## §QA Agent — 코드 품질 검증 (#15)

> **원칙**: 개발 세션이 만든 코드를 개발 세션이 검증하면 자기 편향이 발생한다.
> QA는 fresh context의 별도 에이전트가 판정한다.

### 호출 방법

```
Agent tool:
  subagent_type: "general-purpose"
  isolation: "worktree"
  prompt: |
    프로젝트 BOARD.md: [BOARD 경로]

    .claude/agents/qa/AGENT.md를 읽고 실행하라.
    결과를 PASS/FAIL + 리포트로 반환하라.
```

### FAIL 시 루프

```
QA FAIL → 리포트 읽기 → 수정 (개발 세션이 직접)
→ commit → /verify 재실행 → QA agent 재의뢰 (#12 루프)
```

**재시도 규칙**: QA 재의뢰도 멀티턴 게이트 규칙을 따른다 (retry ≤ 3, 초과 시 정지).

### BOARD 상태 표기

QA 진행 상태를 BOARD.md에 기록한다:
- `🔍 QA 대기` — QA agent 호출 전
- `❌ QA FAIL: [요약]` — 실패 시
- `✅ QA PASS` — 통과 시

### QA 리포트 저장 (PASS/FAIL 무관)

QA agent 결과를 프로젝트 폴더에 저장한다:
- 파일명: `qa-report-YYYY-MMDD-HHmm.md`
- 위치: 프로젝트 BOARD.md와 같은 폴더
- 내용: agent가 반환한 전체 리포트 (게이트별 판정 + 상세 검증 과정)
- BOARD.md QA 섹션에 파일 참조를 남긴다

---

## §Meta QA — 문서 계약 검증 (#M11)

> **원칙**: Meta 프로젝트도 검증 없이 아카이브하지 않는다.
> 코드 계약 대신 **문서 계약**(완전성·일관성·참조정합·컨벤션)을 검증한다.

### Meta QA 4 Gate

| Gate | 검증 질문 | 방법 |
|------|----------|------|
| **Completeness** | BOARD AC ↔ 산출물 1:1인가? Evidence가 실존하는가? | BOARD 파싱 + 파일 존재 확인 |
| **Consistency** | rules.md·knowledge/와 모순하지 않는가? | 산출물 읽기 + 교차 검증 |
| **Reference Integrity** | 문서 내 경로·워크플로우명이 실존하는가? | 참조 추출 + Glob/Grep |
| **Convention** | 파일명·폴더 구조·네이밍이 컨벤션을 따르는가? | PARA 규칙, agents/ 구조 등 대조 |

### 호출 방법

```
Agent tool:
  subagent_type: "general-purpose"
  isolation: "worktree"
  prompt: |
    프로젝트 BOARD.md: [BOARD 경로]
    프로젝트 Size: Meta

    .claude/agents/qa/AGENT.md를 읽고 Meta QA를 실행하라.
    결과를 PASS/FAIL + 리포트로 반환하라.
```

### FAIL 시 루프

QA FAIL → 리포트 기반 수정 → commit → `/verify --meta` 재실행 → Meta QA 재의뢰 (M10 루프)

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
