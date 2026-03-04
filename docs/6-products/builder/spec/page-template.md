# Spec — Page Template & 복제

> Feature 2 of builder-v3. 빈 캔버스에서 시작하지 않는다.
> 기존 페이지를 복제하거나, 템플릿에서 생성한다.

## 1. 개요

콘텐츠 운영자는 매번 페이지를 처음부터 만들지 않는다.
기존에 잘 만든 페이지를 복제하거나, 미리 정의된 템플릿에서 시작한다.

두 가지 생성 경로:

```
[+ 새 페이지] → 템플릿 선택 Dialog → 선택 → 새 Draft 페이지 생성
[페이지 행] → [복제] → 기존 Block Tree deep clone → 새 Draft 페이지 생성
```

## 2. 템플릿 모델

```ts
interface PageTemplate {
  id: string;
  name: string;              // "상품 소개", "이벤트 랜딩", "FAQ"
  description: string;       // 한 줄 설명
  thumbnail?: string;        // 미리보기 이미지 경로
  category: string;          // "마케팅", "상품", "지원"
  blocks: Block[];           // 초기 Block Tree
}
```

> 참고: `src/apps/builder/presets/pages.ts`에 이미 페이지 프리셋 존재. 이를 PageTemplate으로 확장.

## 3. 생성 흐름

### 3.1 템플릿에서 생성

```
┌─ 템플릿 선택 ─────────────────────────────────┐
│                                               │
│  카테고리: [전체] [마케팅] [상품] [지원]          │
│                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 📄       │ │ 📄       │ │ 📄       │      │
│  │          │ │          │ │          │      │
│  │ 상품 소개 │ │ 이벤트   │ │ FAQ      │      │
│  │ 섹션 4개  │ │ 섹션 3개  │ │ 섹션 2개  │      │
│  └──────────┘ └──────────┘ └──────────┘      │
│                                               │
│  페이지 이름: [____________________]           │
│  경로:       [/pages/________________]         │
│                                               │
│              [취소]  [생성하기]                  │
└───────────────────────────────────────────────┘
```

### 3.2 기존 페이지 복제

- 페이지 목록에서 컨텍스트 메뉴 또는 버튼으로 "복제"
- Block Tree 전체를 deep clone (새 ID 생성)
- 이름: "원본 이름 (복사본)", 경로: 자동 생성
- 상태: Draft

## 4. Decision Table

### Zone: template-dialog

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| D1 | page-list | Click [+ 새 페이지] | createPage | — | OPEN_TEMPLATE_DIALOG | dialog 열림 | 템플릿 선택 UI 표시 |
| D2 | template-dialog | Click 템플릿 카드 | selectTemplate | — | SELECT_TEMPLATE(id) | selectedTemplateId 설정 | 카드 하이라이트, 이름 입력 활성화 |
| D3 | template-dialog | Click [생성하기] | create | name 입력됨, template 선택됨 | CREATE_PAGE_FROM_TEMPLATE | 새 페이지 생성 (Draft) | dialog 닫힘, 새 페이지 에디터 열림 |
| D4 | template-dialog | Click [생성하기] | create | name 미입력 | no-op (validation) | 에러 표시 | "페이지 이름을 입력하세요" |
| D5 | template-dialog | Press Escape | cancel | — | CLOSE_DIALOG | dialog 닫힘 | 상태 불변 |
| D6 | template-dialog | Category 필터 클릭 | filterCategory | — | SET_TEMPLATE_CATEGORY | 표시 템플릿 필터링 | 해당 카테고리만 표시 |
| D7 | template-dialog | ArrowRight/Left | navigate | 카드 포커스 중 | OS_FOCUS_NEXT/PREV | 카드 포커스 이동 | 다음/이전 카드로 이동 |
| D8 | template-dialog | Enter | selectAndFocus | 카드 포커스 중 | SELECT_TEMPLATE + 이름 입력 포커스 | template 선택 + 이름 필드 포커스 | 이름 입력으로 전환 |

### Zone: page-list (복제)

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| C1 | page-list | Click [복제] | duplicate | 페이지 선택됨 | DUPLICATE_PAGE(pageId) | Block Tree deep clone, 새 페이지 생성 | 목록에 "원본 (복사본)" 추가 |
| C2 | page-list | Ctrl+D | duplicate | 페이지 포커스됨 | DUPLICATE_PAGE(focusedId) | Block Tree deep clone | 목록에 복사본 추가 |

## 5. BDD Scenarios

```gherkin
Feature: Page Template

Scenario: 템플릿에서 새 페이지 생성
  Given 페이지 목록이 표시되어 있다
  When [+ 새 페이지] 버튼을 클릭한다
  Then 템플릿 선택 Dialog가 열린다
    And 사용 가능한 템플릿 카드가 표시된다
  When "상품 소개" 템플릿을 클릭한다
  Then 해당 카드가 하이라이트된다
    And 이름 입력 필드가 활성화된다
  When 이름에 "GPU 서버 소개"를 입력한다
  When [생성하기]를 클릭한다
  Then Dialog가 닫힌다
    And "GPU 서버 소개" 페이지가 Draft 상태로 생성된다
    And 해당 페이지 에디터가 열린다
    And 블록 구조가 "상품 소개" 템플릿과 동일하다

Scenario: 템플릿 카테고리 필터링
  Given 템플릿 Dialog가 열려있다
    And 마케팅 2개, 상품 3개, 지원 1개 템플릿이 있다
  When [상품] 카테고리를 클릭한다
  Then 상품 카테고리의 3개 템플릿만 표시된다

Scenario: 이름 없이 생성 시도
  Given 템플릿을 선택했지만 이름을 입력하지 않았다
  When [생성하기]를 클릭한다
  Then "페이지 이름을 입력하세요" 에러가 표시된다
    And 페이지가 생성되지 않는다

Scenario: 키보드로 템플릿 선택
  Given 템플릿 Dialog가 열려있다
    And 첫 번째 카드에 포커스가 있다
  When ArrowRight를 누른다
  Then 다음 카드로 포커스가 이동한다
  When Enter를 누른다
  Then 해당 템플릿이 선택된다
    And 이름 입력 필드로 포커스가 이동한다

Scenario: 기존 페이지 복제
  Given 페이지 목록에 "NCP 상품 소개" 페이지가 있다
  When "NCP 상품 소개" 행의 [복제] 버튼을 클릭한다
  Then "NCP 상품 소개 (복사본)" 페이지가 Draft 상태로 생성된다
    And 모든 블록이 새로운 ID로 복제된다
    And 원본 페이지는 변경되지 않는다

Scenario: 복제된 페이지는 독립적이다
  Given "NCP 상품 소개 (복사본)"을 복제로 생성했다
  When 복사본의 Hero Title을 수정한다
  Then 원본의 Hero Title은 변경되지 않는다
```

## 6. OS 검증 포인트

| OS Primitive | 검증 내용 |
|-------------|----------|
| **Dialog** | 템플릿 선택 복합 Dialog — Grid + Form + Validation |
| **Grid** | 템플릿 카드 갤러리 — 2D 키보드 네비게이션 |
| **Toolbar** | 카테고리 필터 — toggle 그룹 |
| **Form Validation** | 이름 필수 입력 — 인라인 에러 메시지 |
| **Collection** | 페이지 복제 — deep clone + ID 재생성 (기존 로직 재활용) |

---

_Status: 기획 완료. 개발 보류._
