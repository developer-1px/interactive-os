---
description: Discussion 결론을 프로젝트로 전환한다. 관련 문서를 모아 프로젝트 폴더를 만들고, 표준 문서를 작성한 뒤, /divide로 실행한다.
---

## Why — 이 workflow가 존재하는 이유

> "생각하는 단계"와 "실행하는 단계" 사이에 구조화된 전환점이 없으면,
> 왜 하는지, 뭘 하는지, 어떻게 하는지 없이 진행하게 된다.
> 프로젝트도 커맨드처럼 `(입력, 액션) → 측정 가능한 결과` 구조여야 한다.
> 이 workflow는 Discussion(발산)을 프로젝트(수렴)로 전환하는 구조화된 전환점이다.

## 파이프라인 전체 지도

```
Phase 1: DISCOVERY
  /onboarding → /discussion(선택)

Phase 2: DEFINITION
  문서 수집 → 폴더 생성 → PRD → KPI

Phase 3: DESIGN
  /resources(선택) → 제안서(4-proposal.md) → /redteam → 사용자 승인
  ──[Gate: 사용자 승인]──

Phase 4: EXECUTION
  ┌─ /tdd → /divide → /review → /fix → /cleanup → /changelog ─┐
  └──────────────── 반복 (작업 단위마다) ────────────────────────┘
  ──[Gate: smoke ✅ / type ✅ / build ✅]──

Phase 5: CLOSING
  /status → /til(선택) → 커밋 → /para(아카이브)
```

## 프로젝트 폴더 표준 구조

```
docs/1-project/[프로젝트명]/
  0-discussion.md                ← 대화 흐름 + 논증 구조 (통합)
  1-prd.md                       ← 요구사항, 범위, 시나리오
  2-kpi.md                       ← 성공 기준 (정량적 지표)
  3-proposal.md                  ← 기술 설계, 구현 전략
  4-status.md                    ← 진행 추적
  notes/                         ← 관련 참고 문서
```

- 번호 = 읽기 순서 = 프로젝트 탄생 순서 (WHY → WHAT → HOW → IF)
- 이름 = 역할 설명. 태그 불필요.
- 아카이브 시 `5-retro.md` 추가.

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

- `docs/0-inbox`, `docs/11-discussions` 등에서 프로젝트 주제와 관련된 문서를 검색한다.
- 관련 Discussion이 있으면 이를 **이동(move)**하여 `0-discussion.md`로 배치.
  - 복사가 아닌 **이동** — 원본은 `11-discussions/`에서 제거됨
  - `11-discussions/`는 자가 정리(self-pruning)됨
- 기타 관련 문서는 `notes/`로 이동한다.

### Step 4: 프로젝트 폴더 생성

- `docs/1-project/[프로젝트명]/` 폴더를 만든다.
- Step 3에서 수집한 문서를 배치한다.

### Step 5: PRD 작성 (2-prd.md)

- Discussion 결론에서 요구사항을 추출한다.
- 배경, 목표, 범위(In/Out), 사용자 시나리오, 기술 제약을 포함한다.

### Step 6: KPI 작성 (3-kpi.md)

- 프로젝트의 성공 기준을 정량적으로 정의한다.
- 형식: 목표 지표, 현재 값, 목표 값, 측정 방법.

---

## Phase 3: DESIGN (설계)

### Step 7 (선택): 리소스 수집 — `/resources`

- 기술 설계에 필요한 참조 자료를 수집한다.
- `/resources`를 실행하여 관련 best practice, 레퍼런스를 `docs/3-resource/`에 생성한다.

### Step 8: 제안서 작성 (4-proposal.md)

- PRD를 바탕으로 기술 설계 제안서를 작성한다.
- 구현 방향, 변경 범위, 리스크, 대안을 포함한다.

### Step 9: 설계 검증 — `/redteam`

- 제안서를 대상으로 `/redteam`을 실행한다.
- 약점, 엣지케이스, 숨은 가정을 공격적으로 검증한다.
- 발견된 문제를 제안서에 반영한다.

### Step 10: 사용자 승인

#### Gate Check
- 제안서를 사용자에게 리뷰 요청한다.
  - ✅ 승인 → Phase 4 진행
  - ❌ 반려 → Step 8로 돌아가 수정

---

## Phase 4: EXECUTION (실행)

### Step 11: 테스트 먼저 — `/tdd` (기존 테스트가 없는 경우)

- **기존 테스트가 이미 스펙 역할을 하고 있으면 스킵한다.**
- 기존 테스트가 없으면 `/tdd`를 실행하여 테스트를 먼저 작성한다.
- 테스트가 스펙이고, 통과가 증명이다.

### Step 12: 분해 & 구현 — `/divide`

- 실패하는 테스트를 통과시키기 위해 `/divide` 방식으로 구현한다.
  - 🟢 **Known** (정답 있음) → AI가 바로 실행
  - 🟡 **Constrained** (선택지 있음) → AI가 트레이드오프를 제시, 사용자가 선택
  - 🔴 **Open** (의사결정 필요) → 사용자에게 질문

### Step 13: 코드 리뷰 — `/review`

- 수정된 코드가 프로젝트 철학, 네이밍, 구조 규칙을 위반하지 않는지 확인한다.
- 🔴 위반 사항이 있으면 수정 후 재검증한다.

### Step 14: 검증 — `/fix`

- Smoke test → Type check → Build 순서로 시스템 안정성을 확인한다.
- 실패 시 `/divide`로 돌아가 수정 후 재검증한다.

### Step 15: 정리 — `/cleanup`

- Lazy comment 제거, 타입/린트 정리, 미사용 코드 제거.
- 빌드 최종 확인.

### Step 16: 중간 커밋 — `/changelog`

- 작업 단위가 완료될 때마다 `/changelog`를 호출한다.
- 코드 커밋 + 프로젝트 changelog 갱신 + status 갱신을 한 번에 수행한다.
- 모든 작업이 끝나지 않았으면 Step 11로 돌아가 다음 작업 단위를 시작한다.

#### Gate Check
- smoke ✅ / type ✅ / build ✅ 모두 통과하는가?
  - ✅ + 남은 작업 없음 → Phase 5 진행
  - ✅ + 남은 작업 있음 → Step 11로 돌아가 반복
  - ❌ → Step 11로 돌아가 수정

> **최소 루프**: `/divide` + `/verify`는 필수. `/review`, `/cleanup`, `/changelog`는 작업 규모에 따라 선택.

---

## Phase 5: CLOSING (종료)

### Step 16: STATUS 갱신 — `/status`

- `5-status.md`에 진행 상태를 기록한다.
- 커밋 시 **커밋 해시 + changelog**를 진행 기록에 포함한다.
  - 형식: `| 날짜 | 이벤트 | 커밋 | changelog |`

### Step 17 (선택): 학습 기록 — `/til`

- 프로젝트를 수행하면서 얻은 기술적 인사이트를 TIL로 기록한다.

### Step 18: 커밋 & 아카이브

1. 변경 파일을 **커밋**한다.
2. **`/retrospect`를 실행**하여 워크플로우 자가 개선 회고를 한다.
3. `5-retro.md`를 작성하고, **changelog를 문서에 포함**한다:
   ```markdown
   ## Changelog
   | 커밋 | 내용 |
   |------|------|
   | `해시` | 커밋 메시지 — 변경 파일 요약 |
   ```
4. `/para`를 실행하여 프로젝트 폴더를 `docs/4-archive/YYYY/[프로젝트명]/`으로 이동한다.
5. 사용자에게 최종 리포트를 보고한다.
