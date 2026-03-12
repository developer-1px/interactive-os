# recsection-enhance

| Key | Value |
|-----|-------|
| Claim | 기존 RecentSection에 커밋 맥락 + 세션 그루핑 + 뷰어 라우팅을 추가하면 멀티 세션 산출물 추적이 3초 내 가능해진다 |
| Before | RecentSection: 파일명 + ToolBadge만 표시. 프로젝트 파일은 `<pre>` plain text. 세션 구분 없음 |
| After | 각 항목에 커밋 메시지 1줄 표시 + 세션별 접이식 그루핑 + .md는 MarkdownRenderer, 코드는 syntax highlight로 표시 |
| Size | Light |
| Risk | git-log 파싱 성능 (N개 제한으로 완화). vite plugin에서 child_process 사용 시 HMR 지연 가능 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
<!-- /plan이 채운다 -->

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| 1 | git-log를 vite plugin 내에서 동기/비동기 어떻게 호출할지 | HMR 성능에 영향 |
