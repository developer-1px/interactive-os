# Spec — docs-browser

> docs-viewer를 업계 표준 문서 브라우저로 격상한다. 히스토리, 브레드크럼, 내부 검색, 키보드 단축키, STATUS.md 대시보드.

## 1. 기능 요구사항

### 1.1 히스토리 네비게이션 (T1, T2, T3)

**Story**: 사용자로서, 문서를 탐색하면서 이전 문서로 돌아갈 수 있길 원한다. 그래야 맥락을 잃지 않고 탐색할 수 있기 때문이다.

**Use Case -- 주 흐름:**
1. 사용자가 문서 A를 열고, 문서 B로 이동한다
2. 뒤로가기를 누르면 문서 A로 돌아간다
3. 앞으로가기를 누르면 문서 B로 돌아간다

**Scenarios:**

Scenario: 히스토리 push
  Given activePath가 "docs/a"이고 history가 ["docs/a"]
  When selectDoc({ id: "docs/b" })를 dispatch
  Then history는 ["docs/a", "docs/b"]이고 historyIndex는 1

Scenario: 히스토리 truncate on branch
  Given history가 ["a", "b", "c"]이고 historyIndex가 1 (현재 "b")
  When selectDoc({ id: "d" })를 dispatch
  Then history는 ["a", "b", "d"]이고 historyIndex는 2

Scenario: GO_BACK
  Given history가 ["a", "b"]이고 historyIndex가 1
  When GO_BACK을 dispatch
  Then historyIndex는 0이고 activePath는 "a"

Scenario: GO_BACK at boundary
  Given historyIndex가 0
  When GO_BACK을 dispatch
  Then 상태 변화 없음

Scenario: GO_FORWARD
  Given history가 ["a", "b"]이고 historyIndex가 0
  When GO_FORWARD를 dispatch
  Then historyIndex는 1이고 activePath는 "b"

Scenario: GO_FORWARD at boundary
  Given historyIndex가 history.length - 1
  When GO_FORWARD를 dispatch
  Then 상태 변화 없음

Scenario: replaceState -> pushState
  Given 사용자가 문서를 선택
  When URL이 갱신될 때
  Then history.pushState가 호출되어 브라우저 뒤로가기 작동

### 1.2 네비게이션 바 + 브레드크럼 (T4)

**Story**: 사용자로서, 현재 문서의 경로를 보고 상위 폴더로 이동할 수 있길 원한다. 그래야 위치를 알고 구조를 탐색할 수 있기 때문이다.

**Use Case -- 주 흐름:**
1. 문서 상단에 뒤로/앞으로 버튼과 브레드크럼 경로가 표시된다
2. 브레드크럼의 각 세그먼트를 클릭하면 해당 폴더 뷰로 이동한다
3. 뒤로 버튼을 클릭하면 이전 문서로 돌아간다

**Scenarios:**

Scenario: 브레드크럼 세그먼트 클릭
  Given activePath가 "1-project/builder/docs-browser/BOARD"
  When "builder" 세그먼트를 클릭
  Then selectDoc({ id: "folder:1-project/builder" })가 dispatch

Scenario: 뒤로 버튼 비활성
  Given historyIndex가 0
  When 네비바 렌더링
  Then 뒤로 버튼이 disabled

Scenario: 앞으로 버튼 비활성
  Given historyIndex가 history.length - 1
  When 네비바 렌더링
  Then 앞으로 버튼이 disabled

### 1.3 키보드 단축키 (T2 일부)

**Story**: 사용자로서, 키보드로 히스토리를 탐색하고 싶다. 그래야 마우스 없이 빠르게 이동할 수 있기 때문이다.

**Scenarios:**

Scenario: Alt+ArrowLeft로 뒤로가기
  Given 히스토리에 2개 이상 항목
  When Alt+ArrowLeft를 누름
  Then GO_BACK이 dispatch

Scenario: Alt+ArrowRight로 앞으로가기
  Given historyIndex < history.length - 1
  When Alt+ArrowRight를 누름
  Then GO_FORWARD가 dispatch

### 1.4 내부 검색 (T5)

**Story**: 사용자로서, docs-viewer 안에서 문서를 빠르게 찾고 싶다. Cmd+K는 라우트와 섞여서 노이즈가 많기 때문이다.

**Use Case -- 주 흐름:**
1. `/` 키를 누르면 검색 오버레이가 열린다
2. 검색어를 입력하면 docs 파일 목록이 퍼지 매칭으로 필터링된다
3. 결과를 선택하면 해당 문서로 이동하고 오버레이가 닫힌다

**Scenarios:**

Scenario: 검색 오버레이 열기
  Given docs-viewer가 활성
  When `/` 키를 누름
  Then 검색 오버레이가 표시됨

Scenario: 검색어 입력
  Given 검색 오버레이가 열려있고 docs에 "STATUS", "BOARD", "spec" 파일 존재
  When "stat"를 입력
  Then "STATUS" 포함 결과가 상위에 표시

Scenario: 결과 선택
  Given 검색 결과가 표시되고 "STATUS" 항목이 포커스
  When Enter를 누름
  Then selectDoc({ id: "STATUS" })가 dispatch되고 오버레이가 닫힘

Scenario: ESC로 닫기
  Given 검색 오버레이가 열려있음
  When ESC를 누름
  Then 오버레이가 닫히고 이전 상태 유지

Scenario: 빈 결과
  Given 검색 오버레이가 열려있음
  When "xyzxyz"를 입력
  Then "No results" 메시지 표시

### 1.5 STATUS.md 파서 (T6)

**Story**: 시스템으로서, STATUS.md를 구조화 데이터로 파싱해야 한다. 그래야 대시보드 UI가 렌더링할 수 있기 때문이다.

**Scenarios:**

Scenario: Active Focus 파싱
  Given STATUS.md에 "## Active Focus" 섹션이 있고 3개의 포커스 항목 존재
  When parseStatusMd(content)를 호출
  Then activeFocus 배열에 3개 항목, 각각 { domain, project, description, weight }

Scenario: Domains 테이블 파싱
  Given STATUS.md에 "### os-core" 섹션 아래 | Project | Phase | Last Activity | 테이블 존재
  When parseStatusMd(content)를 호출
  Then domains[0].name === "os-core"이고 projects 배열에 테이블 행 매핑

Scenario: Migrations 파싱
  Given STATUS.md에 "## Active Migrations" 섹션이 있고 2개 행 존재
  When parseStatusMd(content)를 호출
  Then migrations 배열에 2개 항목, 각각 { oldPattern, newPattern, remaining }

Scenario: Summary 파싱
  Given STATUS.md에 "## Summary" 섹션이 있고 메트릭 테이블 존재
  When parseStatusMd(content)를 호출
  Then summary 맵에 { domains: 5, activeProjects: 12, ... }

### 1.6 STATUS.md 대시보드 (T7, T8)

**Story**: 사용자로서, STATUS.md를 열면 프로젝트 현황을 시각적 대시보드로 보고 싶다. 텍스트 테이블보다 한눈에 파악할 수 있기 때문이다.

**Use Case -- 주 흐름:**
1. 사이드바에서 STATUS.md를 선택한다
2. MarkdownRenderer 대신 StatusDashboard 컴포넌트가 렌더링된다
3. Active Focus 카드, 도메인별 프로젝트 테이블, 마이그레이션 트래커가 표시된다

**Scenarios:**

Scenario: STATUS.md 선택 시 대시보드 렌더링
  Given activePath가 "STATUS"
  When DocsViewer가 렌더링
  Then StatusDashboard 컴포넌트가 표시 (MarkdownRenderer 대신)

Scenario: 프로젝트 클릭 시 BOARD.md로 이동
  Given StatusDashboard에서 "docs-browser" 프로젝트가 표시
  When 해당 프로젝트 카드를 클릭
  Then selectDoc({ id: "1-project/builder/docs-browser/BOARD" })가 dispatch

Scenario: Stale 프로젝트 경고 표시
  Given 프로젝트의 Last Activity가 7일 이상 전
  When 대시보드 렌더링
  Then 해당 프로젝트에 경고 표시

## 2. 상태 인벤토리

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| `DocsState.history` | 방문한 문서 경로 배열 | selectDoc dispatch | resetDoc 시 초기화 |
| `DocsState.historyIndex` | 현재 히스토리 위치 | selectDoc / GO_BACK / GO_FORWARD | resetDoc 시 0 |
| 검색 오버레이 open | 검색 UI 표시 여부 | `/` 키 | ESC 또는 결과 선택 |
| 검색어 | 사용자 입력 | 오버레이 open | 오버레이 close 시 초기화 |

## 3. 범위 밖 (Out of Scope)

- 문서 편집 기능 (읽기 전용)
- 전문 검색 (full-text search) -- 파일명/경로 기반 fuzzy만
- 대시보드에서 프로젝트 상태 변경 (조작은 LLM이)
- Wikilink 백링크
- 페이지네이션 모드
