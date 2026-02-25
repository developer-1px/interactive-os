# Spec — builder-i18n T1

> 한 줄 요약: 툴바의 locale 버튼으로 언어를 전환하면 필드 콘텐츠가 해당 언어로 바뀐다.

## 1. 기능 요구사항

### 1.1 언어 전환 (US-001)

**Story**: 콘텐츠 운영자로서, 현재 편집 중인 페이지의 언어를 전환하여 다른 언어의 콘텐츠를 보고 싶다.

**Use Case — 주 흐름:**
1. 사용자가 툴바의 `[🌐 KO ▾]` 버튼을 클릭한다
2. 등록된 언어 목록 드롭다운이 열린다
3. 사용자가 `EN`을 클릭한다
4. 드롭다운이 닫히고, 버튼이 `[🌐 EN ▾]`로 변경되고, 모든 텍스트 필드가 EN 콘텐츠로 전환된다

**Scenarios:**

Scenario: locale 드롭다운 열기
  Given 페이지에 ko, en 콘텐츠가 있다
    And 현재 locale이 ko다
  When `[🌐 KO ▾]` 버튼을 클릭한다
  Then 드롭다운이 열리고, KO에 ✓ 표시, EN 옵션이 보인다

Scenario: 언어 전환
  Given 드롭다운이 열려있다
    And KO에 ✓ 표시
  When `EN` 옵션을 클릭한다
  Then 드롭다운이 닫히고, 버튼이 `[🌐 EN ▾]`로 변경되고, 필드에 en 콘텐츠 표시

Scenario: 콘텐츠 없는 언어로 전환
  Given en locale에 콘텐츠가 없다
  When EN으로 전환한다
  Then 필드에 "번역을 입력하세요" placeholder 표시

Scenario: 하위 호환 — 기존 string 데이터
  Given 필드 데이터가 기존 string "안녕"이다 (i18n 이전 데이터)
  When 어떤 locale로 전환하든
  Then "안녕"이 그대로 표시된다

## 2. Decision Table 참조

> DT는 Product Workspace에 있다 → `docs/6-products/builder/stories.md` US-001 참조.
> 이 spec은 그 DT의 행 #1, #2, #4를 BDD Scenario로 번역한 것이다.

## 3. 상태 인벤토리

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| `currentLocale` | 현재 표시 중인 언어 | 페이지 로드 시 defaultLocale | SET_LOCALE 커맨드 |
| `availableLocales` | 등록된 언어 목록 | 프로젝트 설정 | ADD_LOCALE / REMOVE_LOCALE |
| `dropdownOpen` | 드롭다운 열림 여부 | OPEN 커맨드 | CLOSE / SELECT 커맨드 |

## 4. 범위 밖 (Out of Scope)

- 언어 추가 (US-002)
- 독립 편집 + 저장 (US-003)
- 키보드로 드롭다운 열기 (Space/Enter — 향후 US)
- RTL 언어, 번역 API
