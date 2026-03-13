---
description: 자율 실행 에이전트 루프. PDCA 4 phase로 자율 진행하고, QC gate로 출하를 판정한다.
---

## /go — PDCA Pipeline Router

> `/go`는 세 가지 뜻이다:
> 1. **"시작해"** — 새 세션. 상태를 파악하고 올바른 phase로 라우팅.
> 2. **"이어해"** — 하다 만 작업. 마지막 phase에서 재개.
> 3. **"진행해"** — AI가 질문했을 때 "ㅇㅇ 해".
>
> `/go`는 **라우터**다. 직접 코드를 수정하지 않는다.
> 상태를 읽고, 스킬을 호출하고, **각 phase의 산출물로 완료를 판정**한다.

---

## 핵심 원칙

> **PDCA = discipline, not sequence.**
> 각 phase 안에서 어떤 스킬을 쓰든, 스킬 없이 직접 하든 자유다.
> **산출물이 phase의 계약이다.** 산출물이 있으면 다음 phase로 넘어간다.

> **매 단계 완료 후 commit한다.**

> **QC gate는 skip 불가.** QC 없는 자율 = 무법.

---

## 부팅

1. `.agent/rules.md`를 읽는다.
2. **대화 맥락이 기본값이다.** 현재 대화에서 진행 중인 주제의 `BOARD.md`를 읽는다.
   대화 맥락이 없으면 → `docs/STATUS.md`의 Active Focus를 따른다.
3. BOARD.md의 **Size 필드**를 확인한다: `Meta` / `Light` / `Heavy`
4. BOARD.md의 **Tasks 상태**를 확인하고, 현재 어느 phase에 있는지 판별한다.
5. **`--os` 플래그 확인**: 인자에 `--os`가 있으면 OS 설계 모드.
   - Plan phase에서 `usage → stub` 경로가 추가된다.

---

## PDCA 4 Phase

### Phase 1: Plan (설계)

> **질문**: "무엇을 만들 것인가?"
> **산출물**: BOARD.md에 Now 태스크 1개 이상 + 실행 가능한 정의

#### 사용 가능한 스킬 (자율 선택)

| 스킬 | 산출물 | 언제 |
|------|--------|------|
| `/plan` | Task Map (BOARD.md Now) | 태스크 분해가 필요할 때 |
| `/spec` | BDD + Decision Table | 기능 명세가 필요할 때 |
| `/stories` | User Stories | 사용자 관점 정리가 필요할 때 |
| `/usage` | 이상적 API 사용 코드 | OS 설계 시 (`--os`) |
| `/stub` | interface + stub | OS 설계 시 (`--os`) |
| `/blueprint` | 실행 설계도 | 경쟁 접근법이 있을 때 |
| `/divide` | 전제조건 트리 | 분해 경로가 불명확할 때 |
| `/naming` | 식별자 설계 | 새 API 표면을 만들 때 |
| `/conflict` | 충돌 해소 | 설계 원칙이 충돌할 때 |

**스킬 없이도 가능**: BOARD.md에 직접 태스크를 적어도 된다.

#### Exit 조건

- [ ] BOARD.md에 Now 태스크 1개 이상
- [ ] 각 태스크에 AC(수락 기준) 존재

---

### Phase 2: Do (실행)

> **질문**: "동작하는 코드가 있는가?"
> **산출물**: 태스크의 AC를 충족하는 코드 + 테스트

#### 사용 가능한 스킬 (자율 선택)

| 스킬 | 산출물 | 언제 |
|------|--------|------|
| `/red` | 실패하는 테스트 | TDD로 시작할 때 |
| `/green` | 테스트 통과하는 구현 | Red 테스트를 통과시킬 때 |
| `/bind` | UI 연결 | headless → React 연결할 때 |
| `/fix` | 형식 오류 수정 | 컴파일 안 될 때 |
| `/refactor` | 행동 불변 코드 정리 | 구조 개선할 때 |
| `/stub` | stub 구현체 | 계약 먼저 확정할 때 |
| `/repro` | 재현 테스트 | 버그 재현할 때 |
| `/apg` | APG 패턴 구현 | W3C 패턴 구현할 때 |
| `/self-check` | spec ↔ import chain 대조 | 스펙 실현 자가점검 |
| `/verify` | tsc, lint, test, build | 빌드 자가점검 |
| `/audit` | OS 계약 위반 전수검사 | 계약 자가점검 |
| `/reflect` | 방향 점검 | 중간 체크포인트 |
| `/coverage` | 테스트 커버리지 분석 | 커버리지 갭 채울 때 |
| `/perf` | 성능 측정 | 성능 이슈 의심 시 |
| `/doubt` | 과잉 점검 | 불필요한 것 제거할 때 |

**스킬 없이도 가능**: 직접 코드를 작성하고 테스트를 돌려도 된다.

**Meta 프로젝트**: 코드 대신 문서 산출물을 직접 작성한다. Red/Green 스킵.

#### Exit 조건

- [ ] BOARD.md의 모든 Now 태스크 AC 충족
- [ ] 각 태스크에 Evidence 기록

---

### Phase 3: Check (QC Gate)

> **질문**: "출하할 수 있는가?"
> **실행자**: fresh agent (worktree). 개발 세션이 아닌 독립 에이전트가 판정.
> **⚠️ 이 phase는 skip 불가. 기계적으로 강제된다.**

```
Agent tool:
  subagent_type: "general-purpose"
  isolation: "worktree"
  prompt: |
    프로젝트 BOARD.md: [BOARD 경로]
    .claude/agents/qa/AGENT.md를 읽고 실행하라.
    결과를 체크리스트 + 리포트로 반환하라.
```

#### QC가 하는 일

1. **빌드 게이트** — tsc, test, build 순차 실행. 하나라도 FAIL → 즉시 반려
2. **spec 기반 독자 테스트** — spec만 읽고 자체 테스트 작성+실행 (코드 안 봄)
3. **체크리스트** — 위치(file:loc) → 근거 → P/F. 3칸 모두 채워야 판정

#### FAIL 시

1. 체크리스트의 FAIL 항목을 확인한다
2. QC 테스트 코드를 받아서 **중복 제거 후 내부 반영** (자산)
3. FAIL 원인을 수정한다 (Phase 2로 루프백)
4. 수정 완료 → QC 재의뢰

#### PASS 시

Phase 4로 진행.

#### Exit 조건

- [ ] QC 체크리스트 ALL PASS

---

### Phase 4: Act (환류)

> **질문**: "배운 것을 시스템에 반영했는가?"
> **산출물**: 프로젝트 완료 처리 + 지식 환류

#### 사용 가능한 스킬 (자율 선택)

| 스킬 | 산출물 | 언제 |
|------|--------|------|
| `/retrospect` | KPT 회고 | 세션 회고 |
| `/knowledge` | 영구 지식 | 새 지식 발견 시 |
| `/explain` | 해설 문서 | 맥락 기록이 필요할 때 |

**스킬 없이도 가능**: BOARD.md에 Done 표기만 해도 된다.

#### Exit 조건

- [ ] BOARD.md 태스크 Done 마킹
- [ ] (선택) 회고 또는 지식 반영

**`/archive`는 사용자가 수동 호출한다.** /go의 종착점 = Done 마킹.

---

## 재시도 규칙

```
QC FAIL → Phase 2 루프백 → 수정 → QC 재의뢰
retry ≤ 3 → 재실행
retry > 3 → ⛔ 보고하고 정지. 사용자에게 상황 설명.
```

---

## 모호함 프로토콜

**모호함 = 시그널.** 실행 중 "이게 맞나?" 망설임이 발생하면:

```
1. Skill tool로 /conflict → /blueprint → /divide 순차 호출 (자율적으로)
2. 해소됨 → 원래 phase 복귀
3. 여전히 모호 → 사용자에게 보고
```

**⛔ 비가역 게이트**: 설계 변경, API 수정 등 되돌리기 어려운 결정이 필요하다고 판단되면 **즉시 정지하고 사용자 확인**을 받는다.

---

## 라우팅 후 행동

**반드시 Skill tool을 사용하여 해당 스킬을 호출한다.**

```
예시: /red로 라우팅 → Skill tool: skill="red"
예시: /verify → Skill tool: skill="verify"
```

### 금지 사항
- `/go`가 직접 코드를 수정하는 것은 금지. 반드시 스킬을 통해 실행한다.
- 워크플로우 이름만 보고 "아는 대로" 행동하는 것은 금지. Skill tool이 프롬프트를 로딩한다.
- SKILL.md를 `view_file`로 읽고 인라인 실행하는 것은 금지. **Skill tool 호출만 허용.**

### 예외
- **QC agent**: Agent tool (`isolation: "worktree"`)로 호출. `.claude/agents/qa/AGENT.md`가 프로토콜 소유.
- **Meta 직접 실행**: Meta 프로젝트의 Do phase는 `/go`가 직접 한다.
- **현황판 갱신**: BOARD.md 업데이트는 `/go`가 직접 한다.

---

## 완료의 정의 (DoD)

| 증명 상태 | BOARD.md 표기 |
|-----------|--------------|
| Phase 2 완료 (AC 충족) | `[x] T명 — [Evidence] ✅` |
| QC 대기 중 | `🔍 QC 대기` |
| QC 실패 | `❌ QC FAIL: [실패 조건] — [요약]` |
| QC 통과 + Act 완료 | `✅ QC PASS` → `🟢 Done` |

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
