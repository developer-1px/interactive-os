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
