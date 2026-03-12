# recsection-enhance

| Key | Value |
|-----|-------|
| Claim | 기존 RecentSection에 커밋 맥락 + 세션 그루핑 + 뷰어 라우팅을 추가하면 멀티 세션 산출물 추적이 3초 내 가능해진다 |
| Before | RecentSection: 파일명 + ToolBadge만 표시. 프로젝트 파일은 `<pre>` plain text. 세션 구분 없음 |
| After | 각 항목에 커밋 메시지 1줄 표시 + 세션별 접이식 그루핑 + .md는 MarkdownRenderer, 코드는 syntax highlight로 표시 |
| Size | Light |
| Risk | git-log 파싱 성능 (N개 제한으로 완화). vite plugin에서 child_process 사용 시 HMR 지연 가능 |

## Now

- [x] T1: `AgentActivityEntry`에 `commitMessage?` 추가 + `collectAgentActivity()`에서 git-log 파싱 — S, 의존: —
- [x] T2: RecentSection 각 항목에 커밋 메시지 1줄 표시 — S, 의존: →T1
- [x] T3: RecentSection 세션별 그루핑 토글 — S, 의존: →T1
- [x] T4: `DocsViewer.tsx` .md 파일은 MarkdownRenderer로 렌더링 — S, 의존: —

## Tasks

| # | Task | Before | After | AC | Status | Evidence |
|---|------|--------|-------|----|--------|----------|
| T1 | `AgentActivityEntry.commitMessage?` + git-log 파싱 | `{ ts, session, tool, detail }` — commitMessage 없음 | `execSync('git log')` → 파일경로→커밋메시지 매핑 → entry에 주입 | tsc 0 | ✅ | tsc 0 \| +6 unit tests \| 781 total |
| T2 | RecentSection 커밋 메시지 표시 | FileIcon + name + ToolBadge | + 하단 commitMessage 1줄 (text-[10px] text-slate-400) | tsc 0, 화면 확인 | ✅ | §6a §6b PASS \| projection locator |
| T3 | 세션별 그루핑 토글 | flat list (세션 구분 없음) | session UUID 기준 접이식 그룹 헤더 + flat/grouped 토글 | tsc 0, 화면 확인 | ✅ | §5a-§5e PASS \| ToggleGrouping trigger |
| T4 | .md 프로젝트 파일 → MarkdownRenderer | `<pre>{content}</pre>` (plain text) | `.md` → `<MarkdownRenderer>`, 그 외 → `<pre>` 유지 | tsc 0, .md 렌더링 확인 | ✅ | +3 unit tests \| isProjectMarkdown |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| ~~1~~ | ~~git-log 동기/비동기~~ | ~~해소: execSync 동기 호출. N개 제한으로 성능 OK. 필요 시 sendUpdate에서만 비동기 분리~~ |

## QA

✅ QA PASS — 4/4 gates clear
- 참조: `qa-report-2026-0312-1930.md`
