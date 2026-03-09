---
description: User Story를 발견·정리하는 Product Layer 워크플로우. stories.md를 living document로 관리한다.
---

## /stories — User Story 발견·정리

> **계층**: Product Layer (지속). 프로젝트와 독립적으로 운영된다.
> **산출물**: `6-products/[product]/stories.md`
> **진입점**: `/discussion` 🚀 Next → `/stories`, 또는 독립 호출.

## Why

> User Story는 "사용자가 뭘 원하는가"를 기록한다.
> PRD/spec은 "시스템이 어떻게 동작하는가"를 기록한다.
> 이 둘은 추상도가 다르다. Story의 AC는 **사용자 언어**, spec의 Scenario는 **시스템 언어**.
> Story 없이 spec을 쓰면 사용자 관점을 잃는다.

## Step 0: STORIESBOOK 숫지

`.agent/knowledge/stories.md`를 읽는다.
- §1 좋은 Story 패턴 숫지
- §2 함정 확인 (반복하지 말 것)
- §3 판정 선례 (재논쟁 방지)

## 모드

| 모드 | 언제 | 행동 |
|------|------|------|
| **Discover** | 새 스토리 발견 시 | Discussion에서 발견된 사용자 의도를 US 포맷으로 기록 |
| **Review** | 기존 스토리 검토 시 | stories.md를 열어 INVEST 검증 + AC 보강 |

## 포맷 (Connextra + AC + UX Flow)

```markdown
### US-001: [한 줄 제목]

**Story**
[역할]로서, [기능/행동]을 원한다. [가치/이유] 때문이다.

**UX Flow**
1. [화면 어디에] [무엇이] 보인다
2. [사용자 입력] → [화면 변화]
3. [최종 상태]

**Acceptance Criteria**
- [ ] AC1: Given [전제] / When [구체적 UI 행동] / Then [화면 결과]
- [ ] AC2: Given [전제] / When [구체적 UI 행동] / Then [화면 결과]

**Decision Table** (Zone × When → Command)

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| 1 | [zone-id] | [입력] | [의도] | [조건] | [커맨드] | [부수효과] | [결과] |

**Notes**
- [보충 설명, 제약 사항, 관련 스토리 참조 등]
```

> **DT는 Product 자산이다.** `6-products/`에 저장. `/spec`은 이 DT를 참조하여 BDD Scenario로 번역만 한다.

> **AC 작성 규칙**: When은 "액션을 실행한다" 같은 추상 표현 금지.
> "[🌐 KO ▾] 버튼을 클릭한다" 처럼 **화면 요소 + 물리적 입력**으로 구체화한다.

## INVEST 체크리스트

| 기준 | 질문 |
|------|------|
| **I**ndependent | 다른 스토리 없이 독립 구현 가능한가? |
| **N**egotiable | 구현 방법이 하나로 고정되지 않았는가? |
| **V**aluable | 사용자에게 직접적 가치가 있는가? |
| **E**stimable | 크기를 추정할 수 있는가? |
| **S**mall — 파이프라인 1사이클 | 입력→커맨드→상태→화면 한 바퀴를 포함하는가? (시간이 아니라 사이클 기준) |
| **T**estable | AC가 자동 테스트로 변환 가능한가? |

## ⛔ DT Gate

> **이 Story로 Decision Table(Zone × When × Intent → Command)을 쓸 수 있는가?**
> - ✅ Yes → 통과
> - ❌ No → **거부**. 사용자 입력이 정의되지 않은 Story = FE 기획이 아니다.
>
> DT 불가 = 입력이 없다 = 화면이 없다 = 파이프라인이 안 돈다.

## 절차

### Discover 모드

1. **맥락 확인** — 어떤 Product의 스토리인지 확인한다 (`6-products/[product]/`).
2. **기존 stories.md 읽기** — 있으면 읽고, 없으면 새로 생성.
3. **US 작성** — Discussion에서 발견된 사용자 의도를 포맷에 맞춰 작성.
   - ID는 전역 증가 (기존 마지막 번호 + 1).
   - 제목은 동사로 시작.
   - Story의 3요소(Who+What+Why) 모두 필수.
   - **UX Flow 필수** — 화면 요소, 위치, 사용자 입력, 시각적 피드백을 기술한다.
   - AC는 Given/When/Then으로 작성. When은 **구체적 UI 행동**(화면 요소 + 물리적 입력).
4. **DT Gate** — 이 Story로 DT(Zone × When → Command)를 쓸 수 있는지 확인. 불가면 Story 재작성.
5. **INVEST 검증** — 체크리스트 통과 확인.
5. **저장** — `6-products/[product]/stories.md`에 append.

### Review 모드

1. **stories.md 읽기** — 전체 스토리 목록 확인.
2. **INVEST 검증** — 각 스토리가 여전히 유효한지 확인.
3. **AC 보강** — 누락된 AC, 엣지 케이스 추가.
4. **저장** — 수정된 stories.md 저장.

## 저장 위치

```
6-products/[product]/
  VISION.md      ← 제품 비전 (불변)
  stories.md     ← 유저 스토리 (living document)
```

## /spec과의 관계

```
User Story (US-001)           ← /stories 가 생성
    │
    ▼ Story의 AC를 번역
Spec Scenario (Given/When/Then) ← /spec 가 생성
    │
    ▼ Scenario를 테스트로 인코딩
Red Test (.test.ts)            ← /red 가 생성
```

- US의 AC: **사용자 언어** ("배너 이미지를 클릭한다")
- spec의 Scenario: **시스템 언어** ("imageBlock에 FOCUS 커맨드가 dispatch된다")

---

### 마지막 Step: STORIESBOOK 갱신

새로 발견된 지식이 있으면 `.agent/knowledge/stories.md`를 갱신한다.
- 잘 작동한 Story 패턴 → §1
- 반복된 함정 → §2
- 거부/승인 선례 → §3

> 새 지식 없으면 스킵.
