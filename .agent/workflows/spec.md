---
description: 기능 명세서. BDD Scenarios + Decision Table을 하나의 spec.md에 작성한다.
---

## /spec — Functional Specification

> **이전 이름**: `/prd`. SRP 리팩토링으로 리네이밍.
> **ASIS `/prd`**: BDD Scenarios만 작성.
> **ASIS `/red`**: Decision Table을 직접 작성.
> **TOBE `/spec`**: BDD Scenarios + Decision Table을 **하나의 문서**로 통합.

> **분류**: 리프. 다른 워크플로우를 호출하지 않는다.
> **진입**: `/go` G2 ("spec.md 없음") → `/spec` 진입.

## Step 0: SPECBOOK 숫지

`.agent/knowledge/spec.md`를 읽는다.
- §1 Zone 체크 + BDD 번역 패턴
- §2 역방향 함정
- §3 판정 선례

## Why

> 소스 코드는 "지금 무엇이 있는가(What IS)"를 말하지만, "무엇이어야 하는가(What SHOULD BE)"는 말하지 않는다.
> spec이 없으면 버그와 의도를 구분할 기준이 없다.
> **spec.md → Test → Code.** 테스트가 코드에서 파생되면 순환 논증이다.

## 원칙

- spec.md는 **프로젝트의 진실의 원천**이다. 코드가 spec과 다르면 코드가 틀린 것이다.
- 테스트는 spec의 시나리오를 번역한다.
- 버그는 "spec 대비 이탈(deviation from spec)"로 정의된다.
- **⛔ 수평 분해 금지** (모델→UI→동작). 태스크를 레이어별로 나누지 않는다.
- **✅ 수직 분해** (입력→상태→화면 = 1태스크). 태스크 하나가 파이프라인 한 사이클을 포함한다.

## 저장 위치

- `docs/1-project/[프로젝트명]/spec.md`
- 프로젝트당 **1파일**. Living document.

## 절차

### Step 1: 기능 추출

입력:
- BOARD.md (Now 태스크 + 선택된 스토리 ID)
- stories.md (해당 스토리의 AC 참조, 있는 경우)
- Discussion 결론 (있는 경우)

### Step 2: BDD Scenarios 작성

> **Zone 체크 (수직 분해 가드레일)**: 시작 전에 "이 태스크가 Zone(사용자가 인터랙션하는 화면 영역)을 가지는가?"를 확인한다.
> - Zone 있음 → 수직 분해로 BDD 작성 (입력→커맨드→상태→화면)
> - Zone 없음 → 아키텍처/데이터 모델 태스크. BDD만, DT 스킵.
> - ⚠️ Zone이 있는데 DT 없이 진행하면 수평 분해 의심.

Story → Use Case → Given/When/Then 순서로 추상에서 구체로 내려간다.

```markdown
# Spec — [프로젝트명]

> 한 줄 요약: [이 프로젝트가 만드는 것]

## 1. 기능 요구사항 (Functional Requirements)

### 1.1 [기능명]

**Story**: [역할]로서, [기능]을 원한다. 그래야 [가치]이기 때문이다.

**Use Case — 주 흐름:**
1. [사용자/시스템 행동]
2. [결과]

**Scenarios (Given/When/Then):**

Scenario: [시나리오명]
  Given [전제 조건]
  When [사용자 행동]
  Then [기대 결과]

## 2. 상태 인벤토리 (State Inventory)

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|

## 3. 범위 밖 (Out of Scope)

- [하지 않는 것]
```

### Step 3: Decision Table 참조 (인터랙션 태스크만)

> **⛔ DT를 여기서 새로 작성하지 않는다.**
> DT는 `/stories`에서 이미 작성되어 `6-products/[product]/stories.md`에 저장된 Product 자산이다.
> `/spec`은 그 DT를 **참조**하여 BDD Scenario로 번역하는 것만이 책임이다.

1. `6-products/[product]/stories.md`의 해당 US DT를 읽는다.
2. DT의 각 행 → Scenario 작성 (Given/When/Then).
3. **아키텍처/리팩토링 태스크는 Step 3 스킵.** BDD Scenarios만 작성.

| DT 행 | Scenario 번역 |
|-------|-------------|
| Zone × When → Command | Given [초기상태] / When [입력] / Then [커맨드 결과] |

- 경계값 (첫/마지막 아이템)
- Intent 전환 직후
- 부정 시나리오
- 대칭 입력 (ArrowDown ↔ ArrowUp)

### Step 4: 자가 검증

1. **발산**: "빠진 시나리오는? 예상 밖 사용은?"
2. **수렴** (새 발견 0건까지 반복):
   - [ ] 모든 기능에 Story + Scenarios가 있는가?
   - [ ] Given 전제 조건이 빠짐없이 명시되었는가?
   - [ ] 대안 흐름(에러, 빈 상태, 경계)이 커버되었는가?
   - [ ] 인터랙션 태스크: Decision Table이 MECE인가?
   - [ ] Out of Scope가 명시되었는가?

### Step 5: 사용자 승인

- ✅ 승인 → 저장. `/go` 복귀 → G3(Red) 판별.
- ❌ 수정 요청 → Step 2로.

## 산출물

- `docs/1-project/[name]/spec.md` (BDD Scenarios + Decision Table)

## ⛔ Gate

**spec.md 완성 없이 `/red` 진입 금지.**

## 규모별 스케일

| 규모 | 필수 섹션 | DT |
|------|----------|-----|
| **Heavy** | Story + Use Case + BDD + 상태 인벤토리 + Out of Scope | ✅ (인터랙션 시) |
| **Light** | Story + BDD | ✅ (인터랙션 시) |

## spec.md 갱신 규칙

spec은 living document다. 요구사항이 변경되면:

1. **spec.md를 먼저 갱신**한다.
2. 변경된 시나리오에 대응하는 **테스트를 갱신**한다.
3. 테스트가 실패하면 **코드를 수정**한다.
4. 변경 사유를 spec 하단의 변경 이력에 기록한다.

---

### 마지막 Step: SPECBOOK 갱신

새로 발견된 지식이 있으면 `.agent/knowledge/spec.md`를 갱신한다.
- 잘 작동한 ZoneCheck/BDD 번역 패턴 → §1
- 반복된 함정 → §2
- 선례 → §3

> 새 지식 없으면 스킵.
