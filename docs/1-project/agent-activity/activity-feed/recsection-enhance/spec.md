# Spec — recsection-enhance

> RecentSection에 커밋 맥락 + 세션 그루핑 + 뷰어 라우팅을 추가한다.

## 1. 기능 요구사항

### 1.1 커밋 메시지 수집 (T1)

**Story**: 개발자로서, Agent Activity 항목에 커밋 맥락을 보고 싶다. 그래야 "이 파일이 왜 만들어졌는지" 3초 내에 파악할 수 있기 때문이다.

**Scenarios:**

```
Scenario: 커밋 메시지가 있는 파일
  Given vite plugin이 JSONL 로그를 수집했고
  And 해당 파일 경로가 git log에 존재할 때
  When collectAgentActivity()가 호출되면
  Then AgentActivityEntry.commitMessage에 커밋 메시지 첫 줄이 포함된다

Scenario: git log에 없는 파일 (새 파일, 미커밋)
  Given 파일이 아직 커밋되지 않았을 때
  When collectAgentActivity()가 호출되면
  Then commitMessage는 undefined이다

Scenario: git 저장소가 아닌 환경
  Given .git 디렉토리가 없을 때
  When collectAgentActivity()가 호출되면
  Then commitMessage는 전부 undefined이고 기존 동작에 영향 없다
```

### 1.2 커밋 메시지 표시 (T2)

**Story**: 개발자로서, 각 파일 항목 아래에 커밋 메시지를 보고 싶다.

**Scenarios:**

```
Scenario: commitMessage가 있는 항목
  Given RecentSection에 commitMessage가 있는 파일이 표시될 때
  When 화면을 보면
  Then 파일명 아래에 커밋 메시지 1줄이 표시된다

Scenario: commitMessage가 없는 항목
  Given commitMessage가 undefined인 파일이 표시될 때
  When 화면을 보면
  Then 기존과 동일하게 파일명 + ToolBadge만 표시된다
```

### 1.3 세션별 그루핑 토글 (T3)

**Story**: 개발자로서, 여러 Claude 세션의 산출물을 세션별로 묶어 보고 싶다. 그래야 "어떤 세션이 뭘 했는지" 한눈에 파악할 수 있기 때문이다.

**Use Case — 주 흐름:**
1. 사용자가 Agent Activity 헤더 옆 그루핑 토글을 클릭한다
2. 항목들이 session UUID 기준으로 그룹화되어 표시된다
3. 각 그룹은 세션 ID(축약) + 항목 수를 헤더로 가진다
4. 다시 토글을 클릭하면 flat list로 돌아간다

**Scenarios:**

```
Scenario: flat → grouped 전환
  Given RecentSection이 flat list로 표시될 때
  When 그루핑 토글을 클릭하면
  Then 항목들이 session별로 그룹화되어 표시된다
  And 각 그룹 헤더에 세션 ID 축약 + 항목 수가 표시된다

Scenario: grouped → flat 전환
  Given RecentSection이 grouped로 표시될 때
  When 그루핑 토글을 클릭하면
  Then 항목들이 시간순 flat list로 돌아간다

Scenario: 단일 세션만 있을 때
  Given 모든 항목이 같은 세션인 경우
  When grouped 모드로 전환하면
  Then 그룹 1개만 표시된다

Scenario: 세션 ID 축약
  Given 세션 UUID가 "3e3063f4-15ed-420c-bb77-2bf93061d2ca"일 때
  When 그룹 헤더에 표시되면
  Then "3e3063" (앞 6자) 또는 유사 축약으로 표시된다
```

**Decision Table:**

| # | 현재 모드 | 입력 | 세션 수 | 결과 |
|---|----------|------|---------|------|
| DT1 | flat | 토글 클릭 | ≥2 | grouped: 세션별 그룹 헤더 + 항목 |
| DT2 | flat | 토글 클릭 | 1 | grouped: 그룹 1개 |
| DT3 | grouped | 토글 클릭 | any | flat: 시간순 list |
| DT4 | flat | 항목 클릭 | any | selectDoc 실행 (기존 동작 보존) |
| DT5 | grouped | 항목 클릭 | any | selectDoc 실행 (기존 동작 보존) |

### 1.4 프로젝트 파일 뷰어 라우팅 (T4)

**Story**: 개발자로서, .md 파일을 클릭했을 때 렌더링된 마크다운을 보고 싶다.

**Scenarios:**

```
Scenario: .md 프로젝트 파일 클릭
  Given RecentSection에서 .md 확장자 파일을 클릭할 때
  When 메인 영역에 파일이 표시되면
  Then MarkdownRenderer로 렌더링된다 (<pre> 아님)

Scenario: .ts/.tsx 프로젝트 파일 클릭
  Given RecentSection에서 코드 파일을 클릭할 때
  When 메인 영역에 파일이 표시되면
  Then <pre> 태그로 코드가 표시된다 (기존 동작 유지)

Scenario: docs/ 경로 .md 파일 (비프로젝트)
  Given 사이드바 트리에서 docs/ 하위 .md를 클릭할 때
  When 메인 영역에 파일이 표시되면
  Then 기존 MarkdownRenderer 경로로 동작한다 (변경 없음)
```

## 2. 범위 밖 (Out of Scope)

- 실시간 fs.watch (기존 JSONL HMR로 충분)
- syntax highlight 라이브러리 추가 (rehype-highlight가 .md 내 코드 블록 처리)
- 그루핑 상태 persist (새로고침 시 flat으로 리셋)
- 15개 제한 초과 (현재 스코프 밖)
