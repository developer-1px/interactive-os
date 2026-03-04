# Spec — Content Search & Replace (콘텐츠 검색/치환)

> Feature 6 of builder-v3. 대량 콘텐츠 운영의 필수 도구.
> 100개 필드에서 "네이버클라우드"를 "NAVER Cloud"로 바꿔야 할 때.

## 1. 개요

페이지 내 또는 전체 페이지에 걸쳐 텍스트를 **검색**하고 **일괄 치환**한다.
브랜드명 변경, 오타 수정, URL 교체 등 대량 콘텐츠 작업의 핵심 도구.

```
Cmd+F → 검색 바 열림 → "네이버클라우드" 입력 → 12건 매칭
→ 하나씩 확인하며 [바꾸기] 또는 [모두 바꾸기]
```

## 2. 검색 범위

| 범위 | 설명 | 트리거 |
|------|------|--------|
| **현재 페이지** | 열려있는 페이지의 모든 블록 필드 | Cmd+F |
| **전체 페이지** | 모든 페이지의 모든 블록 필드 | Cmd+Shift+F |

## 3. UI 구조

### 3.1 Search Bar (현재 페이지)

```
┌─────────────────────────────────────────────────────┐
│ 🔍 [네이버클라우드____________]  3/12  [↑] [↓]      │
│ → [NAVER Cloud_______________]  [바꾸기] [모두 바꾸기] │
│                                          [✕ 닫기]   │
└─────────────────────────────────────────────────────┘
```

### 3.2 Global Search Panel (전체 페이지)

```
┌─ 전체 검색 ─────────────────────────────────┐
│ 🔍 [네이버클라우드________]  총 47건          │
│ → [NAVER Cloud___________]                  │
│                                             │
│ ── NCP 상품 소개 (12건) ──                   │
│   Hero Section > title      "...네이버클라우드..." │
│   Hero Section > subtitle   "...네이버클라우드..." │
│   서비스 특징 > desc        "...네이버클라우드..." │
│                                             │
│ ── GPU 서버 소개 (8건) ──                    │
│   Hero Section > title      "...네이버클라우드..." │
│   ...                                       │
│                                             │
│       [선택 항목 바꾸기] [모두 바꾸기 (47건)]  │
└─────────────────────────────────────────────┘
```

## 4. 매칭 규칙

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| 대소문자 구분 | OFF | "cloud" = "Cloud" = "CLOUD" |
| 정규식 | OFF | 고급 사용자용 |
| 전체 단어 | OFF | "cloud"가 "cloudflare"도 매칭 |

## 5. Decision Table

### Zone: search-bar (현재 페이지)

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| R1 | editor | Cmd+F | openSearch | — | OPEN_SEARCH_BAR | 검색 바 열림, 입력 포커스 | 검색 바 표시 |
| R2 | search-bar | 텍스트 입력 | search | query.length > 0 | SEARCH_PAGE(query, options) | 매칭 결과 계산 | "3/12" 카운터, 첫 매칭 하이라이트 |
| R3 | search-bar | 텍스트 입력 | search | query.length === 0 | CLEAR_SEARCH | 매칭 초기화 | 하이라이트 제거 |
| R4 | search-bar | Click [↓] 또는 Enter | nextMatch | 매칭 있음 | GOTO_NEXT_MATCH | 다음 매칭으로 스크롤 | "4/12" 카운터 갱신, 해당 블록 하이라이트 |
| R5 | search-bar | Click [↑] 또는 Shift+Enter | prevMatch | 매칭 있음 | GOTO_PREV_MATCH | 이전 매칭으로 스크롤 | "2/12" 카운터 갱신 |
| R6 | search-bar | Click [바꾸기] | replaceCurrent | 현재 매칭 있음 | REPLACE_CURRENT(replacement) | 현재 매칭 치환 | 다음 매칭으로 이동, 카운터 갱신 |
| R7 | search-bar | Click [모두 바꾸기] | replaceAll | 매칭 1개 이상 | OPEN_REPLACE_ALL_DIALOG | 확인 dialog | "12건을 모두 바꾸시겠습니까?" |
| R8 | replace-dialog | Click [바꾸기] | confirmReplaceAll | — | REPLACE_ALL(query, replacement) | 전체 치환 | "12건 치환 완료" 토스트 |
| R9 | search-bar | Press Escape | closeSearch | — | CLOSE_SEARCH_BAR | 검색 바 닫힘 | 하이라이트 제거, 편집 모드 복귀 |

### Zone: global-search (전체 페이지)

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| G1 | editor | Cmd+Shift+F | openGlobalSearch | — | OPEN_GLOBAL_SEARCH | 전체 검색 패널 열림 | — |
| G2 | global-search | 텍스트 입력 | search | query.length > 0 | SEARCH_ALL_PAGES(query) | 전체 페이지 매칭 | 페이지별 그룹핑 표시 |
| G3 | global-search | Click 매칭 결과 | navigate | — | OPEN_PAGE_AND_SCROLL(pageId, blockId) | 해당 페이지 열림 + 스크롤 | 매칭 블록 하이라이트 |
| G4 | global-search | Click [모두 바꾸기] | replaceAllGlobal | 매칭 있음 | OPEN_REPLACE_ALL_DIALOG | 확인 dialog | "47건을 모두 바꾸시겠습니까?" |
| G5 | global-search | 체크박스 토글 | selectMatch | — | TOGGLE_MATCH_SELECTION | 선택 상태 변경 | 선택된 건수 표시 |
| G6 | global-search | Click [선택 항목 바꾸기] | replaceSelected | 선택 1개 이상 | REPLACE_SELECTED(ids, replacement) | 선택된 매칭만 치환 | 결과 갱신 |

## 6. BDD Scenarios

```gherkin
Feature: Content Search & Replace

Scenario: 현재 페이지에서 텍스트 검색
  Given "NCP 상품 소개" 페이지를 편집 중이다
    And "네이버클라우드"가 12개 필드에 포함되어 있다
  When Cmd+F를 누른다
  Then 검색 바가 열리고 입력 필드에 포커스가 있다
  When "네이버클라우드"를 입력한다
  Then "1/12"로 카운터가 표시된다
    And 첫 번째 매칭 블록이 하이라이트된다

Scenario: 다음/이전 매칭 이동
  Given "네이버클라우드" 검색 결과 12건, 현재 3/12
  When Enter를 누른다
  Then 4/12로 이동하고 해당 블록이 하이라이트
  When Shift+Enter를 누른다
  Then 3/12로 돌아간다

Scenario: 단일 치환
  Given "네이버클라우드" 검색 결과 현재 매칭이 Hero title이다
    And 치환 입력에 "NAVER Cloud"를 입력했다
  When [바꾸기]를 클릭한다
  Then Hero title의 "네이버클라우드"가 "NAVER Cloud"로 변경된다
    And 다음 매칭으로 자동 이동
    And 카운터가 11로 줄어든다

Scenario: 전체 치환
  Given "네이버클라우드" 12건 매칭
  When [모두 바꾸기]를 클릭한다
  Then 확인: "12건을 모두 바꾸시겠습니까?"
  When [바꾸기]를 클릭한다
  Then 12건 전체가 "NAVER Cloud"로 치환된다
    And "12건 치환 완료" 토스트 표시
    And Cmd+Z로 전체 치환을 한번에 되돌릴 수 있다

Scenario: 전체 페이지 검색
  Given 5개 페이지가 있고 "네이버클라우드"가 총 47건이다
  When Cmd+Shift+F를 누른다
  Then 전체 검색 패널이 열린다
  When "네이버클라우드"를 입력한다
  Then 페이지별로 그룹핑된 47건의 결과가 표시된다
  When "NCP 상품 소개"의 첫 번째 결과를 클릭한다
  Then 해당 페이지가 열리고 매칭 블록으로 스크롤된다

Scenario: 선택적 치환 (전체 검색)
  Given 전체 검색에서 47건 매칭 중 "NCP 상품 소개"의 12건만 선택했다
  When [선택 항목 바꾸기]를 클릭한다
  Then 12건만 치환되고 나머지 35건은 유지된다

Scenario: 검색 결과 없음
  Given "존재하지않는텍스트"를 검색했다
  When 결과를 확인한다
  Then "검색 결과 없음" 표시
    And [바꾸기], [모두 바꾸기] 버튼 비활성화

Scenario: 전체 치환 Undo
  Given "네이버클라우드" 12건을 "NAVER Cloud"로 전체 치환했다
  When Cmd+Z를 누른다
  Then 12건 전체가 "네이버클라우드"로 복원된다
```

## 7. OS 검증 포인트

| OS Primitive | 검증 내용 |
|-------------|----------|
| **Search (Combobox)** | 인크리멘탈 검색 — 타이핑하면서 실시간 매칭 |
| **Toast** | "N건 치환 완료" 알림 |
| **AlertDialog** | "모두 바꾸기" 확인 — 대량 변경 경고 |
| **Keyboard Shortcut** | Cmd+F, Cmd+Shift+F, Enter/Shift+Enter 네비게이션 |
| **Cross-page Navigation** | 전체 검색 → 다른 페이지 열기 + 스크롤 |
| **Batch Undo** | 전체 치환을 하나의 undo 단위로 묶기 |
| **Selection (Checkbox)** | 전체 검색에서 선택적 치환 |

---

_Status: 기획 완료. 개발 보류._
