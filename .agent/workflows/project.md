---
description: Discussion 결론을 프로젝트로 전환한다. 관련 문서를 모아 프로젝트 폴더를 만들고, BOARD.md로 태스크를 관리한다.
---

## Why — 이 workflow가 존재하는 이유

> "생각하는 단계"와 "실행하는 단계" 사이에 구조화된 전환점이 없으면,
> 왜 하는지, 뭘 하는지, 어떻게 하는지 없이 진행하게 된다.
> 프로젝트는 **전략적 컨테이너(Epic)**다. 하나의 프로젝트 안에 여러 Discussion과 Task가 포함된다.
> 이 workflow는 Discussion(발산)을 프로젝트(수렴)로 전환하는 구조화된 전환점이다.

## 파이프라인 전체 지도

```
Phase 1: DISCOVERY
  /onboarding → /discussion(선택)

Phase 2: DEFINITION
  문서 수집 → 폴더 생성 → README.md → BOARD.md

Phase 3: DESIGN (선택 — 규모가 큰 프로젝트만)
  /resources(선택) → 제안서 → /redteam(premortem) → /review(인라인) → 사용자 승인
  ──[Gate: 사용자 승인]──

Phase 4: EXECUTION
  ┌─ /tdd → /divide → /review → /fix → /cleanup → /changelog ─┐
  └──────────────── 반복 (작업 단위마다) ────────────────────────┘
  ──[Gate: smoke ✅ / type ✅ / build ✅]──

Phase 5: CLOSING
  /doubt(코드/파일) → /status → 커밋 → /para(아카이브)
```

## 프로젝트 폴더 표준 구조

```
docs/1-project/[프로젝트명]/
  README.md                        ← WHY, 목표, 범위 (필수)
  BOARD.md                         ← Now / Done / Ideas (필수)
  discussions/                     ← 사고 기록 누적 (여러 개)
  notes/                           ← 관련 참고 문서
```

### BOARD.md 표준 포맷

```markdown
# BOARD — [프로젝트명]

## 🔴 Now
- [ ] 태스크명 — 한 줄 설명
  - ref: discussions/MMDD-slug.md
  - [x] /tdd
  - [x] /divide
  - [ ] /review
  - [ ] /verify

## ⏳ Done
- [x] 태스크명 — 한 줄 설명 (완료일)

## 💡 Ideas
- 아이디어 메모 (프로젝트 로컬 백로그)
```

> **파이프라인 체크리스트**: Now 태스크에 실행한 워크플로우 단계를 기록한다.
> 세션이 끊겨도 다음 세션에서 잔여 단계를 발견할 수 있다.
> 모든 단계를 쓸 필요는 없다 — 실행한 것만 체크하고, 다음에 할 것을 남긴다.
> Done 이동 시 서브아이템은 삭제해도 된다.

### 규모별 트랙

| 규모 | 판단 기준 | 필수 문서 | 선택 문서 |
|------|----------|----------|----------|
| **Heavy** | 아키텍처 변경, 새 시스템 도입 | README + BOARD | PRD, Proposal, KPI |
| **Light** | 작은 기능, 리팩토링, 수정 | README + BOARD | — |

- 판단 기준은 AI가 제안하고, 사용자가 승인한다.
- 의심스러우면 **Light로 시작**하고, 필요 시 문서를 추가한다.

---

## Phase 1: DISCOVERY (발견)

### Step 1: 온보딩 — `/onboarding`

- `/onboarding` 워크플로를 실행하여 프로젝트 지도를 먼저 파악한다.
- 규칙, 디렉토리 구조, 워크플로 목록을 숙지한 뒤 다음 단계로 진행한다.

### Step 2 (선택): 발견 대화 — `/discussion`

- Discussion 결론 문서가 **이미 있으면** 스킵한다.
- **없으면** `/discussion`을 실행하여 숨겨진 Why/Intent를 추출한다.
- 사용자가 "됐어", "만들자" 등 진행 시그널을 보내면 Phase 2로 넘어간다.

---

## Phase 2: DEFINITION (정의)

### Step 3: 관련 문서 수집

- `docs/5-backlog/`, `docs/0-inbox/`, 기존 프로젝트의 `discussions/` 등에서 관련 문서를 검색한다.
- 관련 Discussion이 있으면 `discussions/` 폴더로 **이동(move)**.
- 기타 관련 문서는 `notes/`로 이동 또는 복사한다.

### Step 4: 프로젝트 폴더 생성

- `docs/1-project/[프로젝트명]/` 폴더를 만든다.
- `discussions/`, `notes/` 하위 폴더를 생성한다.
- Step 3에서 수집한 문서를 배치한다.
- **대시보드 갱신**: `docs/STATUS.md`의 All Active Projects에 이 프로젝트를 추가한다.
  - Phase: Definition, Last Activity: 오늘, Status: 🔥 Focus

### Step 5: README.md 작성

- Discussion 결론에서 핵심을 추출한다.
- WHY (왜 하는가), Goals (목표), Scope (In/Out)를 포함한다.

### Step 6: PRD 작성 — `/prd`

- `/prd` 워크플로우를 실행한다.
- README의 Goals/Scope에서 기능을 추출하여 **Acceptance Criteria**, **상태 인벤토리**, **엣지 케이스**를 정의한다.
- PRD는 프로젝트의 **진실의 원천(Single Source of Truth for WHAT)**이다.
- `/redteam` → `/review`(인라인) 검증을 거친 후 사용자 승인을 받는다.
- Light 트랙이라도 AC + 엣지 케이스는 필수.

### Step 7: BOARD.md 작성

- PRD의 기능 요구사항에서 태스크를 도출하여 Now 섹션에 작성한다.
- Discussion에서 도출된 아이디어가 있으면 Ideas 섹션에 배치한다.

---

## Phase 3: DESIGN (설계) — Heavy 트랙만

> Light 트랙은 Phase 3를 전부 스킵하고 Phase 4로 넘어간다.

### Step 8 (선택): 리소스 수집 — `/resources`

- 기술 설계에 필요한 참조 자료를 수집한다.

### Step 9: 제안서 작성 — ADR 포맷 (proposal.md)

- README + PRD를 바탕으로 기술 설계 제안서를 **ADR(Architecture Decision Record) 포맷**으로 작성한다.
- PRD의 기능 요구사항을 **어떻게(HOW)** 구현할지를 정의한다.
- 포맷:
  ```markdown
  # Proposal — [프로젝트명]

  ## Status
  Proposed / Accepted / Superseded

  ## Context
  이 기술 결정이 필요한 배경. PRD의 어떤 요구사항을 해결하려 하는가?

  ## Decision
  무엇을 결정했는가? 구현 방향, 변경 범위를 구체적으로.

  ## Alternatives Considered
  | 대안 | 장점 | 단점 | 기각 사유 |
  |------|------|------|----------|
  | [대안 A] | ... | ... | [왜 선택하지 않았는가] |
  | [대안 B] | ... | ... | [왜 선택하지 않았는가] |

  ## Consequences
  이 결정의 결과. 좋은 것과 나쁜 것 모두.
  - ✅ [긍정적 결과]
  - ⚠️ [부정적 결과 / 트레이드오프]

  ## Risk
  식별된 리스크와 대응 방안.
  ```

### Step 10: 사고 확장 — `/redteam` (premortem 모드)

- "이 설계가 이미 실패했다. 왜?" — 실패 시나리오를 나열한다.
- **수정 의무 없음** — 시야 확장이 목적.

### Step 11: 자가 점검 — `/review` (인라인 모드)

- 새 발견 0건이 될 때까지 반복한다.

### Step 12: 사용자 승인

- ✅ 승인 → Phase 4 진행
- ❌ 반려 → Step 9로 돌아가 수정

---

## Phase 4: EXECUTION (실행)

> **대시보드 갱신**: Phase 4 진입 시 `docs/STATUS.md`에서 이 프로젝트의 Phase를 "Execution"으로 갱신한다.

### Step 13: 테스트 먼저 — `/tdd`

- **PRD의 Acceptance Criteria를 테스트 케이스로 번역**한다.
- PRD가 진실의 원천이고, 테스트는 그 기계적 번역이다.
- 기존 테스트가 이미 PRD 시나리오를 커버하고 있으면 스킵한다.

### Step 14: 분해 & 구현 — `/divide`

- BOARD.md의 Now 태스크를 하나씩 처리한다.
  - 🟢 **Known** → AI가 바로 실행
  - 🟡 **Constrained** → 트레이드오프를 제시, 사용자가 선택
  - 🔴 **Open** → 사용자에게 질문
- 태스크 완료 시 BOARD.md에서 Done으로 이동한다.

### Step 15: 코드 리뷰 — `/review`

- 수정된 코드가 프로젝트 철학, 네이밍, 구조 규칙을 위반하지 않는지 확인한다.
- **PRD 대비 코드 동작이 일치하는지** 확인한다.

### Step 16: 검증 — `/fix`

- Smoke test → Type check → Build 순서로 시스템 안정성을 확인한다.

### Step 17: 정리 — `/cleanup`

- Lazy comment 제거, 타입/린트 정리, 미사용 코드 제거.

### Step 18: 중간 커밋 — `/changelog`

- 작업 단위가 완료될 때마다 `/changelog`를 호출한다.
- BOARD.md의 Done 갱신 + STATUS.md Last Activity 갱신.
- 모든 작업이 끝나지 않았으면 Step 13으로 돌아가 다음 태스크를 시작한다.

#### Gate Check
- smoke ✅ / type ✅ / build ✅ 모두 통과하는가?
  - ✅ + Now가 비었음 → Phase 5 진행
  - ✅ + Now에 남은 작업 → Step 13으로 돌아가 반복
  - ❌ → Step 13으로 돌아가 수정

> **최소 루프**: `/divide` + `/verify`는 필수. `/review`, `/cleanup`, `/changelog`는 작업 규모에 따라 선택.

---

## Phase 5: CLOSING (종료)

### Step 19: 의심 — `/doubt`

- 프로젝트 scope 내 코드와 파일에 `/doubt`를 실행한다.
- 프로젝트 진행 중 생긴 dead code, 미사용 export, 레거시 파일을 정리한다.
- 이미 `/cleanup`에서 knip을 돌렸더라도, `/doubt`은 **의미적 불필요성**(과잉 추상화, 중복 모듈)까지 질문한다.

### Step 20: STATUS 갱신 — `/status`

- BOARD.md의 최종 상태를 확인한다.

### Step 21: 커밋 & 아카이브

1. 변경 파일을 **커밋**한다.
2. **`/retrospect`를 실행**하여 워크플로우 자가 개선 회고를 한다.
3. **대시보드 갱신**: `docs/STATUS.md`에서:
   - All Active Projects에서 제거
   - Completed 섹션으로 이동
4. `/para`를 실행하여 프로젝트 폴더를 `docs/4-archive/YYYY-MM-[프로젝트명]/`으로 이동한다.
5. 사용자에게 최종 리포트를 보고한다.
