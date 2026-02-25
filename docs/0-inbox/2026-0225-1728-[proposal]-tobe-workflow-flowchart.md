# Product Pipeline — TOBE 워크플로우 흐름도

| 항목 | 내용 |
|------|------|
| 원문 | 전체 workflow의 순서와 분기는 어떻게 되는 거야? |
| 내(AI)가 추정한 의도 | ASIS/TOBE 변경 후 전체 워크플로우가 어떤 순서와 분기로 연결되는지, 빠짐없이 시각화하고 싶다 |
| 날짜 | 2026-02-25 |

## 1. 개요 (Overview)

TOBE 파이프라인의 전체 워크플로우 순서·분기·Gate를 하나의 문서로 정리한다.
ASIS 대비 변경된 부분을 명확히 표시한다.

---

## 2. 전체 흐름도

```
사용자 입력
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  /discussion — 합의 도달                                  │
│  (Toulmin 논증 → Claim + Cynefin 판정)                    │
└─────────┬───────────────────────────────────────────────┘
          │ 종료 시그널
          ▼
    ┌─────────────── 6갈래 라우팅 ───────────────┐    🆕 /stories 추가
    │                                            │
    ▼          ▼        ▼       ▼       ▼        ▼
 /project   /go    /stories  /issue  /resource  /backlog
 (새 PJ)  (기존PJ) (Product)  (긴급)  (참고)    (보관)
    │        │        │
    │        │        ▼
    │        │   ┌──────────────────────────────────────┐
    │        │   │  /stories — User Story 발견·정리       │  🆕 신규
    │        │   │  산출물: 6-products/[name]/stories.md  │
    │        │   │  모드: Discover | Review              │
    │        │   └──────────────────────────────────────┘
    │        │
    ▼        │
┌────────────────────────────────────────────────┐
│  /project — 스코프 결정 + Scaffold              │
│                                                │
│  1. Discussion 판정                             │
│  2. 규모 판정 (Heavy / Light / Meta)             │
│  3. 문서 수집                                    │
│  4. Scaffold (1-project/[name]/)                │
│  5. BOARD.md 작성                               │
│     ├─ Context (Toulmin 매핑)                    │
│     └─ Stories: US-001, US-003 (스토리 선택) 🆕   │
│  6. STATUS.md 등록                              │
│                                                │
│  ❌ 삭제: Red 테스트 작성 (→ /go가 라우팅)         │
└──────────┬─────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────┐
│  /go — 상태 기반 라우터                          │
│                                                │
│  부팅: rules.md → BOARD.md → Now 태스크 확인     │
│                                                │
│  ┌─── 상태 판별 ───────────────────────────┐    │
│  │                                         │    │
│  │  #1  BOARD.md 없음     → /project       │    │
│  │  #1.5 Meta + Now      → 직접 실행       │    │
│  │  #2  spec.md 없음 🆕  → /spec           │    │  🆕 분기 추가
│  │  #3  Red 테스트 없음   → /red            │    │
│  │  #4  Red FAIL 있음     → /green          │    │
│  │  #5  모든 PASS         → /refactor       │    │
│  │  #6  다음 Now 있음     → #2로 루프       │    │
│  │  #7  모든 Now Done     → 회고            │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
└──────────┬─────────────────────────────────────┘
           │
     ┌─────┼──────────┬──────────┬──────────┐
     ▼     ▼          ▼          ▼          ▼
```

---

## 3. 각 워크플로우 상세 (순서대로)

### 3.1 /spec (🆕 /prd에서 리네이밍 + 확장)

```
/go #2 "spec.md 없음" → /spec 진입
    │
    ▼
┌────────────────────────────────────────────────────┐
│  /spec — Functional Specification                   │
│                                                    │
│  입력: BOARD.md (선택된 스토리 ID)                    │
│       stories.md (해당 스토리의 AC 참조)              │
│                                                    │
│  Step 1: 기능 추출                                  │
│     BOARD.md Now + stories.md AC에서 기능 목록       │
│                                                    │
│  Step 2: BDD Scenarios 작성                         │
│     Story → Use Case → Given/When/Then              │
│     (기존 /prd의 핵심 기능 유지)                      │
│                                                    │
│  Step 3: Decision Table 작성   🆕 /red에서 이관      │
│     Step 3-A: Zone × When 열거                      │
│     Step 3-B: Intent 열거 (1차 분기)                 │
│     Step 3-C: Condition 열거 (2차 분기) + MECE       │
│     Step 3-D: 8열 풀 테이블                          │
│     Step 3-E: 경계 케이스                            │
│     (인터랙션이 아닌 태스크는 Step 3 스킵)             │
│                                                    │
│  Step 4: 자가 검증                                  │
│     발산 (누락 시나리오?) → 수렴 (체크리스트)          │
│                                                    │
│  산출물: spec.md (BDD + Decision Table)              │
│  저장: docs/1-project/[name]/spec.md                │
│                                                    │
│  ⛔ Gate: spec.md 완성 없이 /red 진입 금지            │
└──────────┬─────────────────────────────────────────┘
           │
           ▼ /go 복귀 → #3 판별
```

### 3.2 /red (Decision Table 분리 후)

```
/go #3 "Red 테스트 없음" → /red 진입
    │
    ▼
┌────────────────────────────────────────────────────┐
│  /red — 실패하는 테스트 작성                         │
│                                                    │
│  입력: spec.md (BDD Scenarios + Decision Table)     │
│                                                    │
│  Step 0: 맥락 파악                                  │
│     BOARD.md + spec.md 읽기                         │
│                                                    │
│  Step 1: spec.md 확인  🆕 (기존 DT 작성 → 확인만)    │
│     ├─ spec.md 존재 + DT 있음 → 진행                │
│     └─ spec.md 없음 → ⛔ /spec 실행 지시            │
│                                                    │
│  Step 2: 테스트 코드 작성                            │
│     Decision Table 행 1개 = it() 1개                │
│     createOsPage + Full Path 패턴                   │
│     (기존 /red Step 2와 동일)                        │
│                                                    │
│  Step 3: 🔴 FAIL 확인                               │
│     vitest run → FAIL 사유 = 미구현                  │
│                                                    │
│  산출물: .test.ts (🔴 FAIL)                          │
│  금지: 프로덕션 코드 수정                             │
└──────────┬─────────────────────────────────────────┘
           │
           ▼ /go 복귀 → #4 판별
```

### 3.3 /green (변경 없음)

```
/go #4 "Red FAIL 있음" → /green 진입
    │
    ▼
┌────────────────────────────────────────────────────┐
│  /green — 테스트를 통과시킨다                        │
│                                                    │
│  Step 0: Red 테스트 확인 (🔴 FAIL 확인)              │
│  Step 1: OS 패턴 숙지 (RUNBOOK, Todo 벤치마크)       │
│  Step 2: 최소 구현 (테스트가 요구하는 것만)            │
│  Step 3: 🟢 PASS 확인 + regression 확인              │
│                                                    │
│  산출물: 구현 코드 (🟢 PASS)                         │
└──────────┬─────────────────────────────────────────┘
           │
           ▼ /go 복귀 → #5 판별
```

### 3.4 /refactor (변경 없음)

```
/go #5 "모든 PASS" → /refactor 진입
    │
    ▼
┌────────────────────────────────────────────────────┐
│  /refactor — 정리 + 검증 + 커밋                      │
│                                                    │
│  Step 1: 코드 정리                                  │
│  Step 2: /reflect (방향 점검)                        │
│  Step 3: /audit (OS 계약 감사)                       │
│  Step 4: /doubt (불필요한 것 제거)                    │
│  Step 5: 검증 (tsc + lint + vitest + build)          │
│  Step 6: 커밋                                       │
│  Step 7: BOARD.md 갱신                              │
│     └─ "다음: /go를 실행하세요"                       │
│                                                    │
│  산출물: git commit + BOARD.md Done                  │
└──────────┬─────────────────────────────────────────┘
           │
           ▼ /go 복귀 → #6 판별 (다음 Now?) → #2 루프 or 회고
```

### 3.5 회고 + 매장 (변경 없음)

```
/go #7 "모든 Now Done" → 회고
    │
    ▼
┌────────────────────────┐     ┌────────────────────────┐
│  /retrospect           │ ──▶ │  /archive              │
│  KPT 회고 (3관점)      │     │  official 환류 + 매장   │
└────────────────────────┘     └────────────────────────┘
```

---

## 4. 분기 판정 테이블 (TOBE)

### 4.1 /discussion 종료 라우팅

| # | 판정 | 행선지 | 조건 |
|---|------|--------|------|
| D1 | 기존 프로젝트의 Task | `/go` | 프로젝트 존재 + 태스크 추가 |
| D2 | 기존 프로젝트의 Discussion | `discussions/` | 논의만, 태스크 없음 |
| D3 | 새 프로젝트 | `/project` | 새 PJ 필요 |
| D4 | Product Story 추가 🆕 | `/stories` | 유저 스토리 발견/정리 |
| D5 | 리소스 | `3-resource/` | 참고 자료 |
| D6 | 백로그 | `5-backlog/` | 아이디어 보관 |

### 4.2 /go 상태 판별

| # | 판별 조건 | 라우팅 | ASIS 대비 변경 |
|---|----------|--------|---------------|
| G1 | BOARD.md 없음 | → `/project` | 동일 |
| G1.5 | Meta + Now 태스크 있음 | → 직접 실행 | 동일 |
| G2 | spec.md 없음 (Heavy/Light) | → `/spec` | 🆕 **신규 분기** |
| G3 | Red 테스트 없음 | → `/red` | 동일 |
| G4 | Red FAIL 있음 | → `/green` | 동일 |
| G5 | 모든 PASS | → `/refactor` | 동일 |
| G6 | 다음 Now 있음 | → G2 루프 | 동일 |
| G7 | 모든 Now Done | → `/retrospect` → `/archive` | 동일 |

### 4.3 /spec 내부 분기

| # | 판별 | 행동 |
|---|------|------|
| S1 | stories.md에 관련 스토리 있음 | AC를 참조하여 BDD 작성 |
| S2 | stories.md 없음 또는 관련 스토리 없음 | BOARD.md Context에서 직접 기능 추출 (기존 /prd 방식) |
| S3 | 인터랙션 태스크 | Step 3 (Decision Table) 실행 |
| S4 | 아키텍처/리팩토링 태스크 | Step 3 스킵 → Given/When/Then 직행 |

---

## 5. 워크플로우 역할 요약

### Product Layer (지속)

| 워크플로우 | 역할 | 산출물 | 저장 위치 |
|-----------|------|--------|----------|
| `/stories` 🆕 | User Story 발견·정리 | `stories.md` | `6-products/[product]/` |

### Project Layer (일회성)

| 워크플로우 | 역할 | 산출물 | 저장 위치 |
|-----------|------|--------|----------|
| `/discussion` | 합의 도달 | discussion `.md` | `1-project/[name]/discussions/` |
| `/project` | 스코프 + scaffold | `BOARD.md` | `1-project/[name]/` |
| `/spec` 🆕 | 기능 명세 | `spec.md` | `1-project/[name]/` |
| `/red` | 실패 테스트 | `.test.ts` (🔴) | `src/` |
| `/green` | 최소 구현 | 구현 코드 (🟢) | `src/` |
| `/refactor` | 정리 + 커밋 | git commit | — |
| `/retrospect` | KPT 회고 | `retrospective.md` | `1-project/[name]/` |
| `/archive` | 매장 | — | `archive/YYYY/MM/WNN/` |

### SRP 매핑 (1 워크플로우 = 1 책임)

| 워크플로우 | 단일 책임 | ASIS 문제 |
|-----------|---------|-----------|
| `/stories` | 사용자가 뭘 원하는가 | 없었음 |
| `/project` | 스코프 결정 + 행정 | Red 테스트까지 담당 (SRP↓) |
| `/spec` | 기능이 어떻게 동작하는가 | "PRD"라는 잘못된 이름 |
| `/red` | 테스트 코드 작성 | DT 작성까지 담당 (SRP↓) |
| `/green` | 구현 코드 작성 | ✅ 문제 없음 |
| `/refactor` | 정리 + 검증 + 커밋 | ✅ 문제 없음 |

---

## 6. 변경 요약 (ASIS → TOBE 차이만)

| 위치 | ASIS | TOBE |
|------|------|------|
| `/discussion` 라우팅 | 5갈래 | **6갈래** (+`/stories`) |
| `/project` Step 6 | Red 테스트 작성 | **스토리 선택** |
| `/go` 분기 | G1→G1.5→G3→G4→G5→G6→G7 | G1→G1.5→**G2**→G3→G4→G5→G6→G7 |
| `/prd` | 이름: `/prd`, DT 없음 | 이름: **`/spec`**, **DT 통합** |
| `/red` Step 1 | DT를 직접 작성 | spec.md **확인만** (Gate) |
| `6-products/` | stories.md 없음 | **stories.md 표준화** |

---

## 7. Cynefin 도메인 판정

🟢 **Clear** — 모든 변경 항목이 식별 완료되었고, 각 워크플로우의 순서·분기·Gate가 확정적. 실행만 남음.

## 8. 인식 한계 (Epistemic Status)

- `/go`의 G2 분기("spec.md 없음")의 **판별 방법**을 아직 구체화하지 않았다. 파일 존재 여부로 판단할지, BOARD.md에 마커를 둘지 결정 필요.
- Meta 프로젝트의 `/spec` 스킵 조건이 명시되지 않았다. 현재 `/go`의 G1.5 (Meta → 직접 실행)에서 자연스럽게 스킵되지만, 명시적 문서화가 필요할 수 있다.
- `/stories`가 `/discussion` 종료 라우팅뿐 아니라 **독립 호출**도 가능해야 한다 (기존 스토리에 추가). 이 진입점은 라우팅 테이블에 반영되어 있지 않다.

## 9. 열린 질문 (Complex Questions)

없음. 흐름도 자체에 대한 질문은 없으며, 세부 구현은 각 변경 항목(C1~C6) 실행 시 결정한다.

---

**한줄요약**: TOBE 파이프라인은 `/discussion` 6갈래 라우팅 → `/project` (scaffold) → `/go` { `/spec` → `/red` → `/green` → `/refactor` 루프 } → `/retrospect` → `/archive`이며, `/stories`는 Product Layer에서 독립 운영된다.
