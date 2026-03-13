# Spec — Activity Usability (Write-first Agent Activity UI)

> 한 줄 요약: Agent Activity 섹션을 Write-first 구조로 재구성하여 Read 노이즈를 줄이고 수정된 파일을 세션별로 그룹화한다.

## 1. 기능 요구사항 (Functional Requirements)

### 1.1 Read 인디케이터

**Story**: 사용자로서, 에이전트가 지금 어떤 파일을 읽고 있는지 한눈에 보고 싶다. 그래야 에이전트의 현재 작업 맥락을 파악할 수 있기 때문이다.

**Use Case — 주 흐름:**
1. Vite plugin이 `.claude/session-logs/*.jsonl`에서 활동 로그를 수집한다
2. `getLatestRead()`가 Read 엔트리 중 최신 1개를 반환한다
3. UI가 Eye 아이콘 + "Reading" + 파일명 + 디렉토리를 표시한다

**Scenarios:**

Scenario: Read 엔트리가 있으면 최신 1개만 표시
  Given 에이전트가 파일 A, B, C를 순서대로 Read함
  When AgentActivitySection이 렌더링됨
  Then "Reading" 인디케이터에 파일 C(최신)만 표시된다
  And 파일명과 디렉토리가 2단으로 표시된다

Scenario: Read 엔트리가 없으면 인디케이터 숨김
  Given 활동 로그에 Read 엔트리가 없음
  When AgentActivitySection이 렌더링됨
  Then "Reading" 인디케이터가 표시되지 않는다

### 1.2 Write 세션 그룹

**Story**: 사용자로서, 에이전트가 수정한 파일을 세션별로 묶어 보고 싶다. 그래야 어떤 작업 단위에서 무엇이 바뀌었는지 파악할 수 있기 때문이다.

**Use Case — 주 흐름:**
1. `getWrittenFilesBySession()`이 Edit/Write 엔트리를 세션 UUID별로 그룹화한다
2. 최신 세션이 상단에 위치한다 (역순 정렬)
3. 각 세션 그룹은 헤더(UUID 6자 + 상대 시간 + 파일 수) + 파일 목록으로 구성된다

**Scenarios:**

Scenario: 수정 파일이 세션별로 그룹화된다
  Given 세션 A에서 file1, file2를 Edit하고, 세션 B에서 file3을 Write함
  When Modified 섹션이 렌더링됨
  Then 세션 B 그룹(최신)이 세션 A 그룹 위에 표시된다
  And 세션 B에 file3이, 세션 A에 file1과 file2가 포함된다

Scenario: 수정 파일이 없으면 Modified 섹션 숨김
  Given 활동 로그에 Edit/Write 엔트리가 없음
  When AgentActivitySection이 렌더링됨
  Then "Modified" 섹션이 표시되지 않는다

Scenario: Read 엔트리는 Modified 목록에서 제외
  Given 에이전트가 file1을 Read하고 file2를 Edit함
  When Modified 섹션이 렌더링됨
  Then file2만 표시되고 file1은 표시되지 않는다

### 1.3 활동 감지 (Active Session)

**Story**: 사용자로서, 현재 작업 중인 에이전트 세션을 자동으로 펼쳐 보고 싶다. 그래야 수동 조작 없이 진행 중인 변경 사항을 추적할 수 있기 때문이다.

**Scenarios:**

Scenario: 활성 세션은 자동 펼침
  Given 세션 A의 마지막 활동이 1분 전 (< 2분 threshold)
  When Modified 섹션이 렌더링됨
  Then 세션 A는 펼쳐진 상태이고 green dot이 표시된다

Scenario: 비활성 세션은 접힌 상태
  Given 세션 A의 마지막 활동이 5분 전 (> 2분 threshold)
  When Modified 섹션이 렌더링됨
  Then 세션 A는 접힌 상태이고 gray dot이 표시된다
  And "(N files)" 요약 텍스트가 표시된다

### 1.4 세션 펼침/접힘 토글

**Scenarios:**

Scenario: 활성 세션을 수동으로 접을 수 있다
  Given 세션 A가 활성 상태이고 펼쳐져 있음
  When 사용자가 세션 A 헤더를 클릭함
  Then 세션 A가 접히고 "(N files)" 요약이 표시된다

Scenario: 접힌 세션을 펼칠 수 있다
  Given 세션 A가 접힌 상태임
  When 사용자가 세션 A 헤더를 클릭함
  Then 세션 A의 파일 목록이 펼쳐진다

### 1.5 파일 선택 (docs-recent Zone)

**Story**: 사용자로서, Modified 목록에서 파일을 클릭하면 해당 문서를 바로 볼 수 있어야 한다. 그래야 수정된 파일의 내용을 즉시 확인할 수 있기 때문이다.

**Scenarios:**

Scenario: 파일 클릭 시 해당 문서가 선택된다
  Given Modified 목록에 file1이 있음
  When 사용자가 file1을 클릭함
  Then file1에 포커스가 이동하고 aria-selected="true"가 된다
  And activePath가 file1의 경로로 갱신된다

Scenario: 키보드로 파일 간 이동 시 선택이 따라간다 (followFocus)
  Given file1이 포커스되어 있음
  When 사용자가 ArrowDown을 누름
  Then file2에 포커스가 이동하고 aria-selected="true"가 된다
  And file1의 aria-selected="false"가 된다

### 1.6 파일명 + 디렉토리 2단 표시

**Scenarios:**

Scenario: 파일명이 1차 정보로 표시된다
  Given 에이전트가 "src/docs-viewer/DocsSidebar.tsx"를 Edit함
  When 해당 파일이 Modified 목록에 표시됨
  Then "DocsSidebar.tsx"가 bold로 표시된다
  And "src/docs-viewer/"가 작은 글씨로 아래에 표시된다

### 1.7 HMR 실시간 갱신

**Scenarios:**

Scenario: 에이전트 활동이 실시간으로 반영된다
  Given docs-viewer가 열려 있음
  When 에이전트가 새 파일을 Edit함
  Then Vite HMR custom event("agent-activity-update")가 발생한다
  And AgentActivitySection이 새 데이터로 리렌더된다

### 1.8 빈 상태 처리

**Scenarios:**

Scenario: Read와 Write 모두 없으면 섹션 전체 숨김
  Given 활동 로그가 비어 있음
  When AgentActivitySection이 렌더링됨
  Then 섹션이 완전히 숨겨진다 (null 반환)

## 2. 상태 인벤토리 (State Inventory)

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| `entries: AgentActivityEntry[]` | HMR로 갱신되는 활동 로그 | 초기 로드 (virtual:agent-activity) | HMR update |
| `latestRead: AgentRecentFile \| null` | 최신 Read 파일 1개 | entries에 Read 있음 | entries 변경 |
| `sessionGroups: SessionGroup[]` | 세션별 Edit/Write 그룹 | entries에 Edit/Write 있음 | entries 변경 |
| `collapsed: Set<string>` | 수동 접힘 세션 ID | 사용자가 헤더 클릭 | 사용자가 다시 클릭 |
| `isActive` (per group) | 2분 내 활동 여부 | `now - latestTs < 2min` | 시간 경과 |

## 3. Decision Table — docs-recent Zone (Listbox)

> Zone: `docs-recent` | Role: `listbox` | followFocus: true

### DT-1: 파일 클릭

| # | 상태 | 입력 | 기대 결과 |
|---|------|------|----------|
| 1 | 아무것도 선택 안 됨 | file1 클릭 | file1 focused + selected + selectDoc 발생 |
| 2 | file1 선택됨 | file2 클릭 | file2 focused + selected, file1 deselected |
| 3 | file1 선택됨 | 같은 file1 클릭 | 포커스 유지 (재선택) |

### DT-2: 키보드 탐색

| # | 상태 | 입력 | 기대 결과 |
|---|------|------|----------|
| 1 | file1 포커스 | ArrowDown | file2 focused + selected (followFocus) |
| 2 | file2 포커스 | ArrowUp | file1 focused + selected |
| 3 | 첫 항목 포커스 | ArrowUp | 포커스 유지 (경계 클램프) |
| 4 | 마지막 항목 포커스 | ArrowDown | 포커스 유지 (경계 클램프) |

### DT-3: 세션 헤더 토글

| # | 상태 | 입력 | 기대 결과 |
|---|------|------|----------|
| 1 | 활성 세션, 펼침 상태 | 헤더 클릭 | 접힘 → "(N files)" 표시 |
| 2 | 활성 세션, 접힘 상태 | 헤더 클릭 | 펼침 → 파일 목록 표시 |
| 3 | 비활성 세션, 접힘 상태 | 헤더 클릭 | 펼침 → 파일 목록 표시 |
| 4 | 비활성 세션, 펼침 상태 | 헤더 클릭 | 접힘 → "(N files)" 표시 |

## 4. 범위 밖 (Out of Scope)

- 세션 내 subagent 분리 (U1: 로그 포맷 변경 필요)
- 2분 heuristic 동적 조정 (실사용 피드백 후 재검토)
- 파일 클릭 시 diff 뷰 연동
- 세션별 통계 (파일 수, 커밋 수, 소요 시간) — dashboard epic
- 시계열 활동 스트림 (Read/Write/Bash 전체) — activity-feed epic
