# Agent Activity Feed — 멀티 Claude 세션 산출물 추적

> 작성일: 2026-03-10
> 태그: idea
> 우선순위: P2

## 문제 / 동기

여러 Claude Code 세션을 동시에 돌리면, 각 세션이 만든 파일(특히 docs/)을 사람이 실시간으로 파악하기 어렵다.

- 폴더링으로 정리하면 흩어져서 어디 갔는지 모름
- 최신순으로 보면 어떤 세션/맥락에서 만들어졌는지 매핑 안 됨
- 기성 도구 없음: Git Activity 도구(GitDailies, Gitmore)는 원격 레포 기반, Agent Observability 도구(AgentOps, Langfuse)는 LLM 트레이스 기반. 둘의 교차점(로컬 멀티세션 → 파일 산출물 추적)은 빈 영역

## 현재 상태

- git log에 커밋별 변경 파일 + 메시지(맥락) 정보 존재
- Co-Authored-By: Claude 태그로 AI 생성 커밋 식별 가능
- CLAUDE_SESSION_ID 환경변수로 세션 구분 가능 (hooks 인프라 이미 존재)
- docsViewer 앱 존재 (docs/ 브라우징 + 검색)

## 기대 상태

docsViewer (또는 별도 뷰)에서 "최근 생성/수정된 docs 파일"을 시간순으로 보여주되, **어떤 세션(커밋)에서 어떤 맥락으로 만들어졌는지** 한 줄 요약이 함께 표시된다.

완료 조건:
- 최근 N개 파일 변경을 시간순 피드로 표시
- 각 항목에 커밋 메시지(맥락) 표시
- 세션별 그루핑 가능 (선택)

검증: docsViewer에서 "방금 다른 터미널의 Claude가 뭘 만들었지?"를 3초 내에 확인 가능

## 접근 방향

1. **가벼운 해법**: `git log --diff-filter=A --name-only -- docs/` 파싱 → docsViewer "Recent" 존에 피드
2. **중간 해법**: 커밋에 세션 ID 태깅 (hook으로 자동) → 세션별 그루핑 뷰
3. **무거운 해법**: fs.watch 실시간 + Agent Observability 연동 (과잉 가능성)

## 관련 항목

- `docs/1-project/docs/archive-cleanup/` — scaffold v2 설계 중 발견
- docsViewer 앱: `src/docs-viewer/`
- docsViewer os-migration: `docs/1-project/agent-activity/docs-viewer/os-migration/BOARD.md` — Hold (T8 ArrowDown gap)

---

## /wip 분석 이력 (2026-03-12)

### 분석 과정

#### 턴 1: /divide
- **입력**: 백로그 항목의 Goal (git log → docsViewer 피드) + docsViewer 현재 코드 탐색
- **결과**:
  - **기존 JSONL 인프라 발견**: `vite-plugin-agent-activity.ts`가 이미 `.claude/session-logs/*.jsonl`을 읽고 HMR push. 2119 entries 실데이터 수집 중
  - docsViewer os-migration이 Hold (T8 ArrowDown gap 미해소)
  - UI 작업 필요 → Light 이상 → Red/Green 필수
- **Cynefin**: Complex — 기존 인프라와 백로그 제안의 방향 충돌 + 기반 불안정 + product 결정 필요

#### 턴 2: /solve (트레이드오프 정리)
- **입력**: JSONL 인프라 vs git-log 접근 비교
- **결과**:
  - **JSONL 장점**: 실시간 (HMR push), 세션 ID 내장, tool 종류 추적 가능, 이미 동작 중
  - **JSONL 한계**: docs/ 변경만 추적하지 않음 (모든 tool call), 커밋 메시지(맥락) 없음
  - **git-log 장점**: 커밋 메시지 = 맥락 요약, docs/ 필터링 용이, 완료된 단위만 표시
  - **git-log 한계**: 실시간 아님 (커밋 후에만), 세션 ID 매핑 별도 필요
  - **보완적 가능성**: JSONL(실시간) + git-log(완료 단위) 이중 소스
- **Cynefin**: Complex 유지 — 방향 결정은 인간 필요

### Open Gaps (인간 입력 필요)

- [ ] Q1: JSONL 인프라를 발전시킬 것인가, git-log 접근으로 교체할 것인가, 둘을 병합할 것인가? — 해소 시 구현 방향이 확정된다
- [ ] Q2: docsViewer os-migration (T8 ArrowDown gap)을 먼저 해소해야 하는가, 아니면 독립 뷰로 분리 가능한가? — 해소 시 기반 안정성 문제가 풀린다
- [ ] Q3: activity feed의 product scope — "무엇을 보여줄 것인가"? (파일 변경? tool call? 커밋? 전부?) — 해소 시 UI 설계가 시작 가능

### 다음 /wip 시 시작점

Q1 해소 후 → `/blueprint`로 구체적 구현 설계. Q2가 "독립 뷰"로 결정되면 os-migration 블로커 우회 가능.
