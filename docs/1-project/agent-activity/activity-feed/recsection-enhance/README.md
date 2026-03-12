# RecentSection Enhancement — 커밋 맥락 + 세션 그루핑 + 뷰어 라우팅

기존 DocsSidebar "Agent Activity" RecentSection에 3가지 기능을 추가하여,
멀티 Claude 세션 산출물을 실시간으로 추적할 수 있게 한다.

## Why

여러 Claude Code 세션을 동시에 돌리면, 각 세션이 만든 파일을 사람이 실시간으로 파악하기 어렵다.
현재 RecentSection은 파일명 + ToolBadge만 표시하여 "어떤 맥락에서 만들어졌는지" 알 수 없다.
또한 프로젝트 파일(.ts, .md 등)을 클릭하면 plain text `<pre>`로만 표시된다.

## Summary

1. git-log에서 커밋 메시지 추출 → 각 항목에 1줄 맥락 표시
2. 세션 ID 기준 그루핑 토글
3. 파일 확장자별 적절한 뷰어 라우팅 (md → MarkdownRenderer, 코드 → syntax highlight)

## Prior Art

- `docs/4-archive/2026/03/W11/agent-recent/` — JSONL 수집 인프라 + RecentSection 초기 구현
- `docs/5-backlog/agent-activity-feed.md` — 4라운드 /wip 분석 이력
