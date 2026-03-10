# agent-recent — docsViewer Recent을 에이전트 활동 로그 기반으로 강화

> 작성일: 2026-03-11

## Context

docsViewer의 Recent 섹션이 파일 시스템 mtime 기반이라 "에이전트가 실제로 작업한 파일"을 보여주지 못한다.
PostToolUse 훅으로 파일 접근 로그를 자동 수집하고, 이를 docsViewer에서 보여준다.

- 기존 mtime 기반 → 훅 로그 기반으로 데이터 소스 교체
- .md 외 .ts/.tsx 파일도 raw 텍스트로 볼 수 있게
- 토큰 소비 0 (훅은 Claude 컨텍스트 밖에서 실행)

## Now

(없음)

## Unresolved

(없음)

## Done

- [x] T1: PostToolUse 훅 스크립트 생성 — `.claude/hooks/audit-log.sh` ✅
- [x] T2: settings.local.json에 PostToolUse 훅 등록 ✅
- [x] T3: Vite plugin `vite-plugin-agent-activity.ts` 생성 — tsc 0 ✅
- [x] T4: `docsUtils.ts`에 `getAgentRecentFiles()` 추가 — tsc 0 ✅
- [x] T5: `RecentSection` UI 데이터 소스 교체 — tsc 0 ✅
- [x] T6: 비-md 파일 raw 텍스트 뷰어 — tsc 0 ✅
