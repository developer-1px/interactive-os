---
description: 자율 실행 에이전트 루프. 보편 사이클을 정의하고, 상태를 복원하여 올바른 단계에서 재개한다.
---
// turbo-all

## /go — 자율 주행

> `/go`는 세 가지 뜻이다:
> 1. **"시작해"** — 새 세션. STATUS.md 읽고 뭘 할지 파악.
> 2. **"이어해"** — 하다 만 작업. 마지막 단계에서 재개.
> 3. **"진행해"** — AI가 질문했을 때 "ㅇㅇ 해".
>
> 세 경우 모두: **지금 상태를 파악하고, 다음 할 일을 하라.**

### 핵심 원칙

> **모든 프로젝트의 목적은 앱의 완성이 아니라 OS의 완성이다.**
> 앱은 OS가 제대로 동작하는지 증명하는 수단이다.
> 순수 React(`useState`, `onClick`, `useEffect`)로 완성되면 OS를 안 썼다는 뜻이므로 **실패**다.

---

## Phase 0: 부팅

1. **Rules 숙지** — `.agent/rules.md`를 읽는다.
2. **대화 맥락 판별**:
   - 대화 맥락이 명확하면 → 해당 프로젝트 `BOARD.md` 읽고 재개.
   - 대화 맥락이 없으면 (새 세션) → `docs/STATUS.md`의 Active Focus를 따른다.
3. 해당 프로젝트의 `BOARD.md`를 읽는다. (Now 태스크, 마지막 체크포인트)
4. **`/reflect`** — 이전 세션 결과가 의도와 맞는지 점검. 문제 발견 시 보고하고 멈춘다.
5. **"지금 몇 번째 Phase에 있는가?"** 판단 → 해당 Phase로 점프.

### Phase 0 산출물: 없음 (상태 복원만)

---

## Phase 1: 숙지

> **매 태스크 시작 전에 OS를 학습한다.** LLM은 매 세션 새로 태어난다.

### 읽어야 할 문서 (고정)

| 순서 | 문서 | 목적 |
|------|------|------|
| 1 | `docs/official/os/RUNBOOK.md` | OS로 앱 만드는 법 (5단계 + Anti-pattern + Headless 검증) |
| 2 | `src/apps/todo/app.ts` (상단 구조 주석) | 벤치마크 앱 패턴 확인 |
| 3 | 태스크 관련 SPEC 섹션 | 필요한 Role/Command/Config 확인 (`docs/official/os/SPEC.md`) |

### 이 태스크를 OS로 어떻게 표현하는가?

태스크마다 아래 질문에 답하고, **OS 관점 설계 메모**를 출력한다:

```markdown
### OS 관점 설계 메모 — [태스크명]

1. **이 기능에 필요한 Zone은?** (role, orientation, 기존 vs 신규)
2. **필요한 커맨드는?** (기존 OS 커맨드 재사용 vs 앱 커맨드 신규)
3. **OS에 없는 패턴이 필요한가?** (필요하면 OS 확장 먼저)
4. **벤치마크 앱에 유사 패턴이 있는가?** (있으면 따르기)
5. **headless로 검증 가능한가?** (createOsPage로 어떤 시나리오?)
```

### ⛔ Gate

**OS 관점 설계 메모**가 출력되지 않으면 Phase 2 진입 금지.

### Phase 1 산출물: OS 관점 설계 메모

---

## Phase 2: 설계

> **코드를 쓰기 전에 설계를 끝낸다.**

| 순서 | 단계 | 산출물 | 비고 |
|------|------|--------|------|
| 1 | `/divide` | 분해 보고서 | 태스크를 하위 작업으로 분해 |
| 2 | `/blueprint` | 실행 설계도 | 순서, 의존 관계, 위험 요소 |
| 3 | `/naming` | 이름 표 | Zone, Item, Command, Effect 이름 |
| 4 | `/tdd` | `.feature` 파일 | BDD 시나리오 (Gherkin) |
| 5 | `/reflect` | 커버리지 점검 | 시나리오가 요구사항을 충분히 커버하는지 |

### ⛔ Gate

- `.feature` 파일 없으면 테스트 코드 금지
- headless 테스트 설계 없으면 구현 코드 금지

### Phase 2 산출물: `.feature` + 실행 설계도 + 이름 표

---

## Phase 3: 실행 + 검증

> **Red → Green → Refactor → 검증**

### 만들기

| 순서 | 단계 | 설명 | 산출물 |
|------|------|------|--------|
| 1 | Red 테스트 | `.feature` → headless 테스트 (`createOsPage`) | `*.test.ts` (🔴 실패) |
| 2 | Green 구현 | `app.ts` (선언) → `widgets/` (뷰 바인딩) 순서 | 소스 코드 (🟢 통과) |
| 3 | `/refactor` | 패턴 일반화, 중복 제거 | 개선된 소스 코드 |

**구현 순서 강제**:
1. `app.ts` — defineApp, State, Command, Zone bind (로직)
2. `widgets/` — Zone/Item/Field로 UI 투사 (뷰)
3. **로직이 먼저, 뷰는 바인딩이다** (rules.md #2)

### 다듬기

| 순서 | 단계 | 산출물 |
|------|------|--------|
| 4 | `/review` | 리뷰 체크리스트 |
| 5 | `/fix` | 형식 정정 |
| 6 | `/doubt` | 의심 보고 (불필요한 것 발견 시) |
| 7 | `/cleanup` | 정리된 코드 |

### 확인 + 기록

| 순서 | 단계 | 산출물 |
|------|------|--------|
| 8 | `/verify` | Red→Green 증명 (아래 DoD 참조) |
| 9 | `/changelog` | git 커밋 |
| 10 | `/ready` | 환경 정상 확인 |

### Phase 3 산출물: 커밋된 코드 + Red→Green 증명

---

## 완료의 정의 (DoD)

**"완료"는 Red→Green 증명이다.**

1. 수정 **전**: 버그/요구사항을 재현하는 **Red 테스트**를 먼저 쓴다.
   - `createOsPage()`로 headless 재현. "브라우저에서 확인해주세요"는 금지.
2. 수정 **후**: 같은 테스트가 **Green**이 된다.
3. 기존 테스트 스위트가 깨지지 않는다 (**regression 없음**).

| 증명 상태 | BOARD.md 표기 |
|-----------|--------------|
| Red→Green + regression 없음 | `[x] 태스크명 — tsc 0 | +N tests | build OK ✅` |
| 수정했지만 Red→Green 없음 | `[ ] 태스크명 — 증명 미완` |
| 기존 테스트 깨짐 | `[ ] 태스크명 — regression` |

증빙 없이 `✅`만 찍는 것은 금지.

---

## Phase 4: 회고 (프로젝트 완료 시 1회)

모든 Now 태스크가 Done이면 실행:

| 순서 | 단계 | 산출물 |
|------|------|--------|
| 1 | `/retrospect` | KPT 회고 |
| 2 | `/coverage` | 테스트 커버리지 분석 |
| 3 | `/para` | 문서 정리 |
| 4 | `/archive` | 프로젝트 매장 |

### /archive 자동 실행 조건

모든 Now 태스크가 Done이고, Ideas가 없거나 별도 프로젝트로 분리된 경우 → `/archive` 자동 호출.
Ideas가 남아있으면 사용자에게 확인.

---

## 상태 기록

매 Phase/단계 완료 시 BOARD.md에 체크포인트를 기록한다:

```markdown
## 🔴 Now
- [ ] 태스크명 — 한 줄 설명
  - [x] Phase 1: 숙지 — OS 관점 설계 메모 완료
  - [x] Phase 2: 설계 — .feature 3개, 이름 표 완료
  - [ ] Phase 3: 실행 — Red 테스트 작성 중     ← 다음 재개 지점
```

세션이 끊겨도 다음 `/go`에서 이 체크포인트를 읽고 이어서 진행한다.

---

## 반복

BOARD.md에 Now 태스크가 여러 개이면, 각 태스크마다 Phase 1~3을 반복한다.
모든 Now 태스크가 완료되면 Phase 4(회고)를 1회 실행한다.

---

## 요약: 4 Phase 한눈 보기

```
Phase 0: 부팅     — BOARD.md 복원, /reflect
Phase 1: 숙지     — RUNBOOK.md + 벤치마크 학습 + OS 관점 설계 메모
                    ⛔ Gate: 설계 메모 없으면 Phase 2 금지
Phase 2: 설계     — /divide → /blueprint → /naming → /tdd (.feature) → /reflect
                    ⛔ Gate: .feature 없으면 코드 금지
Phase 3: 실행+검증 — Red → Green (app.ts → widgets/) → /refactor → /review → /verify → /changelog
Phase 4: 회고     — /retrospect → /coverage → /para → /archive
```
