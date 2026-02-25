# User Story 표준 포맷 — Visual CMS 샘플

| 항목 | 내용 |
|------|------|
| 원문 | 그래서 샘플로 Visual CMS의 유저 스토리를 하나 작성해줘 포맷이 궁금해 가장 표준적인걸로 |
| 내(AI)가 추정한 의도 | **경위**: `/stories` 워크플로우 설계 중 산출물 포맷 기준이 없었다<br>**표면**: Visual CMS 맥락의 유저 스토리 샘플과 포맷을 원한다<br>**의도**: 워크플로우가 자동 생성할 표준 포맷을 확정하고 싶다 |
| 날짜 | 2026-02-25 |

## 1. 개요 (Overview)

`/stories` 워크플로우가 생성할 유저 스토리의 표준 포맷을 정의한다. 업계에서 가장 널리 쓰이는 **Connextra 포맷** + **Acceptance Criteria (Given/When/Then)** + **INVEST 원칙**을 기반으로 한다.

## 2. 표준 포맷

### 2.1 유저 스토리 구조

```markdown
### US-001: [한 줄 제목]

**Story**
[역할]로서, [기능/행동]을 원한다. [가치/이유] 때문이다.

**Acceptance Criteria**
- [ ] AC1: Given [전제] / When [행동] / Then [결과]
- [ ] AC2: Given [전제] / When [행동] / Then [결과]

**Notes**
- [보충 설명, 제약 사항, 관련 스토리 참조 등]
```

### 2.2 구성 요소별 역할

| 요소 | 역할 | 규칙 |
|------|------|------|
| **ID** (`US-001`) | 고유 식별자 | 순번. Epic 무관하게 전역 증가 |
| **제목** | 스캔 가능한 한 줄 요약 | 동사로 시작. "배너 이미지 교체", "블록 순서 변경" |
| **Story** | 사용자 관점의 의도 | Who(역할) + What(행동) + Why(가치). 3요소 모두 필수 |
| **AC** | 완료 판정 기준 | Given/When/Then. 테스트로 직접 번역 가능해야 함 |
| **Notes** | 보충 | 선택. 기술 메모, 관련 US 참조, 엣지 케이스 힌트 |

### 2.3 INVEST 체크리스트

| 기준 | 질문 |
|------|------|
| **I**ndependent | 다른 스토리 없이 독립 구현 가능한가? |
| **N**egotiable | 구현 방법이 하나로 고정되지 않았는가? |
| **V**aluable | 사용자에게 직접적 가치가 있는가? |
| **E**stimable | 크기를 추정할 수 있는가? |
| **S**mall | 1~2주 안에 완료 가능한가? |
| **T**estable | AC가 자동 테스트로 변환 가능한가? |

---

## 3. Visual CMS 샘플

> 아래는 VISION.md의 Target Group, Needs, 핵심 기능을 기반으로 작성한 실제 샘플.

---

### US-001: 이벤트 배너 이미지 교체

**Story**
콘텐츠 운영자로서, 이벤트 페이지의 배너 이미지를 직접 교체하고 싶다. 시즌마다 디자인팀에 요청하지 않고 즉시 반영할 수 있어야 하기 때문이다.

**Acceptance Criteria**
- [ ] AC1: Given 이벤트 페이지가 캔버스에 로드되어 있다 / When 배너 이미지 블록을 클릭한다 / Then Properties Panel에 이미지 교체 UI가 표시된다
- [ ] AC2: Given Properties Panel에서 새 이미지를 선택했다 / When 확인 버튼을 누른다 / Then 캔버스의 배너 이미지가 즉시 교체된다
- [ ] AC3: Given 이미지를 교체한 직후 / When Ctrl+Z를 누른다 / Then 이전 이미지로 되돌아간다

**Notes**
- 이미지 포맷 제한: 현재 단계에서는 URL 직접 입력. 파일 업로드는 Later 스코프.
- 관련: VISION.md > Needs #1 (보이는 대로 편집), Needs #4 (실수 복구)

---

### US-002: 반복 카드 항목 추가

**Story**
콘텐츠 운영자로서, 상품 소개 페이지의 카드 리스트에 새 카드를 추가하고 싶다. 신규 상품이 출시될 때마다 기존 카드와 동일한 디자인으로 빠르게 추가해야 하기 때문이다.

**Acceptance Criteria**
- [ ] AC1: Given 카드 리스트 블록이 선택되어 있다 / When "항목 추가" 버튼을 누른다 / Then 리스트 끝에 빈 카드가 추가된다
- [ ] AC2: Given 새 카드가 추가되었다 / When 카드의 텍스트 필드를 클릭한다 / Then 인라인 편집 모드로 진입하여 제목을 입력할 수 있다
- [ ] AC3: Given 카드가 3개 이상이다 / When 카드를 드래그하여 순서를 변경한다 / Then 변경된 순서가 캔버스에 즉시 반영된다
- [ ] AC4: Given 실수로 카드를 추가했다 / When 해당 카드에서 삭제를 실행한다 / Then 카드가 제거되고, Undo로 복구할 수 있다

**Notes**
- 새 카드의 초기 상태: 기존 카드의 구조(필드 스키마)를 복제하되, 내용은 비어있음
- 관련: VISION.md > 핵심 기능 "Collection CRUD", Needs #3 (반복 블록 관리)

---

### US-003: 키보드로 블록 순회 편집

**Story**
콘텐츠 운영자로서, 키보드만으로 페이지의 모든 편집 가능한 블록을 순서대로 탐색하며 수정하고 싶다. 50개 이상의 텍스트를 교체할 때 마우스 왕복 없이 빠르게 작업해야 하기 때문이다.

**Acceptance Criteria**
- [ ] AC1: Given 페이지에 편집 가능한 블록이 여러 개 있다 / When Tab 키를 누른다 / Then 다음 편집 가능 블록으로 포커스가 이동한다
- [ ] AC2: Given 블록에 포커스가 있다 / When Enter를 누른다 / Then 인라인 편집 모드로 진입한다
- [ ] AC3: Given 인라인 편집 중이다 / When Escape를 누른다 / Then 편집 모드를 빠져나오고 블록 선택 상태로 돌아간다
- [ ] AC4: Given 중첩된 섹션(Section > Group > Item) 구조다 / When 방향키로 탐색한다 / Then 계층 구조를 따라 drill-down/up이 가능하다

**Notes**
- "50개 이상의 텍스트 교체" = 실제 운영 시나리오 (상품 가격 일괄 변경 등)
- 관련: VISION.md > Needs #5 (키보드 효율), 핵심 기능 "Hierarchical Navigation"

---

## 4. 포맷과 기존 워크플로우의 관계

```
User Story (US-001)           ← /stories 가 생성
    │
    ▼ Story의 AC를 번역
PRD Scenario (Given/When/Then) ← /prd 가 생성
    │
    ▼ Scenario를 테스트로 인코딩
Red Test (.test.ts)            ← /red 가 생성
    │
    ▼ 테스트를 통과하는 코드
Green Code                     ← /green 가 생성
```

**핵심 차이**: User Story의 AC와 PRD의 BDD Scenario는 **같은 Given/When/Then이지만 추상도가 다르다**.
- US의 AC: **사용자 언어** ("배너 이미지를 클릭한다")
- PRD의 Scenario: **시스템 언어** ("imageBlock에 FOCUS 커맨드가 dispatch된다")

## 5. Cynefin 도메인 판정

🟢 **Clear** — User Story 포맷은 업계 표준(Connextra + AC)이 확립되어 있다. Visual CMS 맥락에 적용하는 것은 Sense-Categorize-Respond.

## 6. 인식 한계 (Epistemic Status)

- 이 샘플은 VISION.md의 텍스트에 기반한 추론이다. 실제 콘텐츠 운영자의 인터뷰나 사용 데이터는 반영되지 않았다.
- AC의 구체적 인터랙션(Tab 키, Enter 등)은 현재 OS 구현 기준이며, 실제 사용자가 기대하는 인터랙션과 다를 수 있다.
- Epic 분류(페이지 빌딩, 콘텐츠 관리 등)는 아직 정의되지 않았다.

## 7. 열린 질문 (Complex Questions)

1. **AC의 깊이**: User Story의 AC를 이 정도로 상세하게 쓸 것인가, 아니면 더 추상적으로 쓰고 `/prd`에서 상세화할 것인가?
2. **Epic 체계**: 유저 스토리를 묶는 Epic을 어떤 기준으로 분류할 것인가? (기능별? 사용자 여정별? VISION.md의 Needs별?)
3. **기존 코드와의 매핑**: 이미 구현된 기능에 대해서도 소급하여 유저 스토리를 작성할 것인가?

---

> **3줄 요약**
> - User Story는 **Connextra 포맷**(역할+행동+가치) + **Given/When/Then AC**로 구성한다.
> - `/prd`의 BDD Scenario보다 한 단계 추상적인 **사용자 언어**로 작성한다.
> - AC는 테스트로 직접 번역 가능해야 하며, INVEST 원칙으로 품질을 검증한다.
