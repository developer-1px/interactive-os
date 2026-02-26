# Product Pipeline ASIS → TOBE

| 항목 | 내용 |
|------|------|
| 원문 | 어떻게 변경하고 싶은지 MECE하게 ASIS TOBE를 /inbox로 작성해봐 |
| 내(AI)가 추정한 의도 | Discussion에서 나온 모든 변경을 빠짐없이 정리하여, /project로 전환하기 위한 실행 가능한 변경 목록을 만들고 싶다 |
| 날짜 | 2026-02-25 |

## 1. 개요 (Overview)

Discussion에서 도출된 Product Pipeline 재설계를 6개 변경 항목으로 MECE 분류한다.
각 항목은 독립적으로 실행 가능하며, 의존 관계가 있는 경우 명시한다.

---

## 2. 파이프라인 전체 비교

### ASIS (현재)

```
/discussion → /project → /go → 루프 { /red → /green → /refactor } → /retrospect → /archive
                  │
                  ├─ Discussion 매핑
                  ├─ 규모 판정
                  ├─ Scaffold
                  ├─ BOARD.md 작성
                  └─ Red 테스트 작성 (!!)
```

**문제**: `/project`가 scoping + scaffold + spec + test를 모두 담당 (SRP 위반). Product 레이어 부재.

### TOBE (목표)

```
━━━ Product Layer (지속) ━━━━━━━━━
  VISION.md    — 왜 존재하는가
  stories.md   — 사용자가 뭘 하고 싶은가 (누적, Living)

━━━ Project Layer (일회성) ━━━━━━━
  /discussion  — 합의 도달
  /project     — 스토리 선택 + scaffold + BOARD.md (행정만)
  /go          — 라우터 (변경 없음)
    /spec      — BDD Scenarios + Decision Table
    /red       — 테스트 코드 (Decision Table은 /spec에서 이관)
    /green     — 구현 코드
    /refactor  — 리팩토링
  /retrospect → /archive
```

---

## 3. 변경 항목 (MECE 분류)

### 변경 범위 총괄

| # | 변경 항목 | 유형 | 의존성 | 위험도 |
|---|----------|------|--------|--------|
| C1 | `/stories` 워크플로우 신설 | 신규 생성 | 없음 | 🟢 Low |
| C2 | `/prd` → `/spec` 리네이밍 | 리네이밍 | 없음 | 🟡 Mid |
| C3 | `/spec`에 Decision Table 통합 | 기능 이동 | C2 | 🟡 Mid |
| C4 | `/project` 책임 축소 | 리팩토링 | C2, C3 | 🟡 Mid |
| C5 | `/red` 에서 Decision Table 분리 | 기능 이동 | C3 | 🟢 Low |
| C6 | Product 문서 구조 표준화 | 표준 정의 | C1 | 🟢 Low |

---

### C1: `/stories` 워크플로우 신설

| | ASIS | TOBE |
|---|------|------|
| **상태** | User Story 워크플로우 없음 | `/stories` 워크플로우 존재 |
| **산출물** | 없음 | `docs/6-products/[product]/stories.md` |
| **기능** | — | Discover 모드 (스토리 추출) + Review 모드 (정리·갭 발견) |
| **포맷** | — | Connextra (역할+행동+가치) + AC (Given/When/Then) |

**변경 대상**:
- 🆕 `.agent/workflows/stories.md` — 워크플로우 파일 생성
- 🆕 `docs/6-products/builder/stories.md` — 첫 번째 산출물 (샘플에서 시작)

**참조 문서**: `docs/0-inbox/2026-0225-1714-[research]-user-story-format-sample.md`

---

### C2: `/prd` → `/spec` 리네이밍

| | ASIS | TOBE |
|---|------|------|
| **이름** | `/prd` (Product Requirements Document) | `/spec` (Functional Specification) |
| **이유** | 업계 표준 PRD와 다른 물건에 같은 이름 사용 (Rule #9 위반) | 실제 역할(BDD Scenarios)에 맞는 이름 |
| **산출물 파일명** | `prd.md` | `spec.md` |

**변경 대상**:

| 파일 | 변경 내용 | 비고 |
|------|----------|------|
| `.agent/workflows/documantaion/prd.md` | 파일명 → `spec.md`, 내부 텍스트 갱신 | 핵심 |
| `.agent/workflows/project.md` | `prd.md` 참조 → `spec.md` | 2곳 |
| `docs/2-area/80-cross-cutting/82-standards/03-project-folder-standard.md` | `2-prd.md` → `spec.md` | 1곳 |
| `docs/1-project/test-observability/BOARD.md` | `prd.md` 참조 → `spec.md` | 1곳 |
| `docs/1-project/replay/README.md` | `prd.md` 참조 → `spec.md` | 1곳 |
| `docs/0-inbox/2026-0225-1135-[proposal]-board-format-v2.md` | `prd.md` 참조 → `spec.md` | 2곳 |
| `docs/archive/*` | ❌ 변경하지 않음 | 죽은 문서 |

**위험**: 기존 프로젝트에 `prd.md` 파일이 물리적으로 존재하는 경우 rename 필요.

---

### C3: `/spec`에 Decision Table 통합

| | ASIS | TOBE |
|---|------|------|
| **Decision Table 위치** | `/red` Step 1에 내장 | `/spec`의 일부 (Step 3) |
| **`/spec` 구조** | Step 1: 기능 추출 → Step 2: BDD 작성 → Step 3: 자가 검증 | Step 1: 기능 추출 → Step 2: BDD 작성 → **Step 3: Decision Table** → Step 4: 자가 검증 |
| **`/spec` 산출물** | `spec.md` (BDD만) | `spec.md` (BDD + Decision Table) |

**변경 대상**:
- ✏️ `.agent/workflows/documantaion/spec.md` (C2에서 리네임된 파일) — Step 3에 Decision Table 추가
- ✏️ `.agent/workflows/red.md` — Step 1 (Decision Table) 제거 → C5에서 처리

**근거**: BDD Scenario와 Decision Table은 둘 다 "어떻게 동작해야 하는가"를 정의한다. 추상도만 다를 뿐 같은 관심사 = 같은 워크플로우.

---

### C4: `/project` 책임 축소

| | ASIS | TOBE |
|---|------|------|
| **담당** | Discussion 매핑 + 규모 판정 + Scaffold + BOARD.md + **Red 테스트 작성** | Discussion 매핑 + 규모 판정 + Scaffold + BOARD.md + **스토리 선택** |
| **Red 테스트** | `/project` Step 6에서 직접 실행 | ❌ 제거 — `/go`가 라우팅 |
| **스토리 연결** | 없음 | BOARD.md에 대상 User Story ID 기록 |
| **Gate** | "Red 테스트 없이 /go 진입 금지" | "spec.md 없이 /red 진입 금지" (Gate 이동) |

**변경 대상**:
- ✏️ `.agent/workflows/project.md` — Step 6 (Red 테스트 작성) 제거, 스토리 선택 Step 추가
- ✏️ BOARD.md 표준 포맷 — `Stories: US-001, US-003` 필드 추가

**Before (project.md Step 6)**:
```markdown
6. **⭐ Red 테스트 작성** — /red 실행
   ⛔ Gate: Red 테스트 (🔴 FAIL) 없이 /go 진입 금지.
```

**After**:
```markdown
6. **⭐ 스토리 선택** — stories.md에서 이번 프로젝트의 대상 스토리를 선택하여 BOARD.md에 기록.
   (stories.md가 없거나 관련 스토리가 없으면 스킵 — Meta 프로젝트, 인프라 프로젝트 등)
```

---

### C5: `/red`에서 Decision Table 분리

| | ASIS | TOBE |
|---|------|------|
| **`/red` 구조** | Step 0: 맥락 → **Step 1: Decision Table** → Step 2: 테스트 코드 → Step 3: FAIL 확인 | Step 0: 맥락 → **Step 1: spec.md 확인** → Step 2: 테스트 코드 → Step 3: FAIL 확인 |
| **입력** | BOARD.md → Decision Table을 직접 작성 | **spec.md (BDD + Decision Table)** → 테스트로 번역 |
| **산출물** | Decision Table `.md` + `.test.ts` | `.test.ts`만 |

**변경 대상**:
- ✏️ `.agent/workflows/red.md` — Step 1을 "spec.md 확인" + Gate로 교체

**Before (red.md)**:
```markdown
Step 1: 결정 테이블 작성 → 프로젝트 .md로 저장
  Step 1-A: Zone × When 열거
  Step 1-B: When별로 Intent 열거
  Step 1-C: Intent별로 Condition 열거 + MECE
  Step 1-D: 풀 테이블 작성
  Step 1-E: 경계 케이스
  Step 1-F: 저장
```

**After (red.md)**:
```markdown
Step 1: spec.md 확인
  - 프로젝트의 spec.md를 읽는다.
  - BDD Scenarios + Decision Table이 존재하는지 확인한다.
  - ⛔ Gate: spec.md 없이 테스트 작성 금지. → /spec 실행.
```

---

### C6: Product 문서 구조 표준화

| | ASIS | TOBE |
|---|------|------|
| **`6-products/` 구조** | 제품마다 제각각 | 표준 구조 정의 |

**ASIS (builder)**:
```
docs/6-products/builder/
  VISION.md
  design/
  discussions/
  spec/          ← 기능별 스펙 (4개 파일)
```

**TOBE (표준)**:
```
docs/6-products/[product]/
  VISION.md      ← Why + Who + What (필수)
  stories.md     ← User Stories (Living Document)
  design/        ← 디자인 프로토타입 (선택)
  discussions/   ← Product-level 논의 (선택)
  spec/          ← 기능별 상세 스펙 (선택. /spec 산출물은 project에)
```

**변경 대상**:
- 🆕 `docs/6-products/builder/stories.md` — C1의 산출물
- 기존 파일은 변경하지 않음

---

## 4. 실행 순서 제안

의존성을 고려한 순서:

```
Phase 1 (독립):  C1 /stories 신설   +   C2 /prd→/spec 리네이밍
Phase 2 (C2↓):  C3 /spec에 Decision Table 통합
Phase 3 (C3↓):  C4 /project 축소   +   C5 /red 분리
Phase 4 (C1↓):  C6 Product 문서 표준화
```

| Phase | 항목 | 예상 작업량 |
|-------|------|-----------|
| 1 | C1 + C2 | 워크플로우 2개 수정/생성 |
| 2 | C3 | 워크플로우 1개 수정 |
| 3 | C4 + C5 | 워크플로우 2개 수정 |
| 4 | C6 | 문서 1개 생성 |

**총 변경**: 워크플로우 5개 (신규 1 + 수정 4), 문서 ~8개 참조 갱신

---

## 5. Cynefin 도메인 판정

🟡 **Complicated** — 변경 항목이 6개로 분해되었고 각각은 Clear이지만, 상호 의존성과 기존 워크플로우와의 정합성 확인이 필요하다.

## 6. 인식 한계 (Epistemic Status)

- `/go`의 라우팅 테이블 변경 여부를 아직 확정하지 않았다. `/spec` → `/red` Gate 이동 시 `/go`도 수정이 필요할 수 있다.
- `/discussion` 종료 시 5갈래 라우팅에 `/stories`를 추가할지 여부는 미결정.
- 기존 프로젝트(`1-project/`)에 물리적으로 존재하는 `prd.md` 파일의 rename 범위를 전수 조사하지 않았다.

## 7. 열린 질문 (Complex Questions)

1. **`/go` 라우팅 변경**: `/go`의 상태 판별에 "spec.md 없음 → `/spec`" 분기를 추가할 것인가?
2. **`/spec`과 `/red`의 Decision Table 이관**: 현재 `/red`의 Decision Table Step(1-A~1-F)을 `/spec`으로 통째로 옮길 것인가, 아니면 `/spec`에는 간소화된 버전을 두고 `/red`에서 상세화할 것인가?
3. **기존 프로젝트 소급 적용**: 이미 `prd.md`로 존재하는 파일(살아있는 프로젝트)을 `spec.md`로 물리적 rename 할 것인가?

---

**한줄요약**: Product Pipeline을 6개 MECE 변경으로 분해 — `/stories` 신설, `/prd`→`/spec` 리네이밍, Decision Table `/spec` 이관, `/project` 축소, `/red` 분리, Product 문서 표준화.
