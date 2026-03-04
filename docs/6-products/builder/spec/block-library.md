# Spec — Block Library (재사용 블록 라이브러리)

> Feature 5 of builder-v3. 프리셋을 넘어서.
> 잘 만든 블록 조합을 저장하고, 어떤 페이지에서든 꺼내 쓴다.

## 1. 개요

현재 프리셋(presets/blocks.ts)은 **개발자가 코드로 정의**한 고정 템플릿이다.
Block Library는 **운영자가 편집 중에 직접 저장**하는 재사용 블록 컬렉션이다.

```
편집 중 블록 선택 → "라이브러리에 저장" → 이름/카테고리 지정 → 저장
다른 페이지 편집 중 → 라이브러리 패널 열기 → 블록 선택 → 현재 페이지에 삽입
```

## 2. 핵심 개념

| 개념 | 설명 |
|------|------|
| **Library Item** | 저장된 블록 (또는 블록 그룹). Block Tree의 서브트리 |
| **Built-in** | 개발자 정의 프리셋. 삭제/수정 불가 |
| **Custom** | 운영자가 저장한 블록. 수정/삭제 가능 |
| **Category** | 분류 태그. "헤더", "카드", "CTA", "푸터" 등 |

## 3. 데이터 모델

```ts
interface LibraryItem {
  id: string;
  name: string;              // "3열 가격표 카드"
  description?: string;
  category: string;          // "카드", "헤더", "CTA" 등
  blocks: Block[];           // 저장된 Block Tree (1개 이상)
  thumbnail?: string;        // 자동 생성 또는 커스텀
  source: "builtin" | "custom";
  createdAt: string;
  updatedAt: string;
}
```

## 4. UI 구조

### 4.1 라이브러리 패널 (사이드바 탭)

```
┌─ 라이브러리 ──────────────────┐
│ [검색...]                     │
│                               │
│ 카테고리: [전체] [헤더] [카드]  │
│                               │
│ ── Built-in ──                │
│ ┌──────────┐ ┌──────────┐    │
│ │ Hero     │ │ 3열 카드  │    │
│ │ Section  │ │          │    │
│ └──────────┘ └──────────┘    │
│                               │
│ ── Custom ──                  │
│ ┌──────────┐ ┌──────────┐    │
│ │ GPU 소개 │ │ 이벤트   │    │
│ │ 카드     │ │ 배너     │    │
│ └──────────┘ └──────────┘    │
│                               │
└───────────────────────────────┘
```

### 4.2 저장 Dialog

```
┌─ 라이브러리에 저장 ──────────────┐
│                                 │
│ 블록: "서비스 특징" + 하위 3개     │
│                                 │
│ 이름: [서비스 카드 3열____________] │
│ 카테고리: [카드 ▾]               │
│ 설명: [3개의 서비스 카드 레이아웃__] │
│                                 │
│          [취소]  [저장하기]       │
└─────────────────────────────────┘
```

## 5. Decision Table

### Zone: library-panel

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| B1 | sidebar | Click [라이브러리 탭] | openLibrary | — | OPEN_LIBRARY_PANEL | 라이브러리 패널 표시 | 카테고리별 블록 목록 |
| B2 | library | 검색 입력 | search | query.length > 0 | FILTER_LIBRARY(query) | 표시 목록 필터링 | 이름/설명 매칭 결과 |
| B3 | library | Category 필터 클릭 | filterCategory | — | SET_LIBRARY_CATEGORY | 카테고리 필터링 | 해당 카테고리만 표시 |
| B4 | library | Click 블록 카드 | insertBlock | — | INSERT_LIBRARY_BLOCK(itemId, afterId) | Block Tree에 삽입 | 현재 포커스 위치 뒤에 블록 삽입 |
| B5 | library | Drag 블록 카드 → 캔버스 | dragInsert | 드롭 위치 유효 | INSERT_LIBRARY_BLOCK(itemId, targetId) | Block Tree에 삽입 | 드롭 위치에 블록 삽입 |
| B6 | library | Right-click custom 카드 | contextMenu | source=custom | OPEN_CONTEXT_MENU | 메뉴 열림 | [수정] [삭제] 메뉴 |
| B7 | library | Click [삭제] (컨텍스트 메뉴) | deleteItem | source=custom | DELETE_LIBRARY_ITEM(itemId) | 라이브러리에서 제거 | 목록 갱신 |
| B8 | library | ArrowUp/Down | navigate | 카드 포커스 중 | OS_FOCUS_PREV/NEXT | 카드 포커스 이동 | — |
| B9 | library | Enter | insert | 카드 포커스 중 | INSERT_LIBRARY_BLOCK | 블록 삽입 | 캔버스에 반영 |

### Zone: save-to-library

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| S1 | canvas | Right-click 블록 | contextMenu | 블록 선택됨 | OPEN_CONTEXT_MENU | 메뉴 열림 | [라이브러리에 저장] 메뉴 항목 |
| S2 | context-menu | Click [라이브러리에 저장] | saveToLibrary | — | OPEN_SAVE_LIBRARY_DIALOG | dialog 열림 | 이름/카테고리 입력 폼 |
| S3 | save-dialog | Click [저장하기] | save | name 입력됨 | SAVE_TO_LIBRARY(blocks, name, category) | 라이브러리에 추가 | dialog 닫힘, 라이브러리 갱신 |
| S4 | save-dialog | Click [저장하기] | save | name 미입력 | no-op (validation) | 에러 표시 | "이름을 입력하세요" |
| S5 | save-dialog | Press Escape | cancel | — | CLOSE_DIALOG | dialog 닫힘 | 상태 불변 |

## 6. BDD Scenarios

```gherkin
Feature: Block Library

Scenario: 블록을 라이브러리에 저장
  Given 캔버스에서 "서비스 특징" 섹션이 선택되어 있다
  When 우클릭 → [라이브러리에 저장]을 클릭한다
  Then 저장 Dialog가 열린다
    And 선택된 블록과 하위 children이 미리보기로 표시된다
  When 이름 "서비스 카드 3열", 카테고리 "카드"를 입력한다
  When [저장하기]를 클릭한다
  Then 라이브러리 Custom 섹션에 "서비스 카드 3열"이 추가된다

Scenario: 라이브러리에서 블록 삽입
  Given 라이브러리 패널이 열려있다
    And "서비스 카드 3열" 블록이 있다
  When 해당 카드를 클릭한다
  Then 현재 포커스된 블록 뒤에 "서비스 카드 3열" 블록이 삽입된다
    And 모든 블록 ID가 새로 생성된다
    And Undo로 삽입을 되돌릴 수 있다

Scenario: 라이브러리 검색
  Given 라이브러리에 10개 블록이 있다
  When 검색창에 "카드"를 입력한다
  Then 이름 또는 설명에 "카드"가 포함된 블록만 표시된다

Scenario: Built-in 블록은 삭제 불가
  Given Built-in 블록에 포커스가 있다
  When 우클릭한다
  Then 컨텍스트 메뉴에 [삭제] 항목이 없다

Scenario: Custom 블록 삭제
  Given Custom 블록 "이벤트 배너"에 포커스가 있다
  When 우클릭 → [삭제]를 클릭한다
  Then 확인: "이벤트 배너를 라이브러리에서 삭제하시겠습니까?"
  When [삭제하기]를 클릭한다
  Then 라이브러리에서 제거된다
    And 이미 삽입된 페이지의 블록은 영향 없다

Scenario: 드래그로 블록 삽입
  Given 라이브러리 패널이 열려있다
  When "Hero Section" 카드를 캔버스의 "푸터" 앞으로 드래그한다
  Then "푸터" 앞에 "Hero Section" 블록이 삽입된다
```

## 7. OS 검증 포인트

| OS Primitive | 검증 내용 |
|-------------|----------|
| **Grid** | 라이브러리 카드 갤러리 — 2D 키보드 네비게이션 |
| **Search (Combobox)** | 라이브러리 검색 — 필터링 + 키보드 |
| **Context Menu** | 우클릭 메뉴 — 블록 저장, 삭제 |
| **Drag & Drop** | 라이브러리 → 캔버스 크로스 존 드래그 |
| **Dialog + Form** | 저장 Dialog — validation 포함 |
| **Tab** | 사이드바 탭 (구조 트리 / 라이브러리) 전환 |

---

_Status: 기획 완료. 개발 보류._
