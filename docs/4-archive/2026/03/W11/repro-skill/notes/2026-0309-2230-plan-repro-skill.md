# Task Map — repro-skill

> 작성일: 2026-03-09

| # | Task | Before | After | 크기 | 의존 | 검증 |
|---|------|--------|-------|------|------|------|
| T1 | `headless-test-guide.md` SSOT runbook 작성 | 없음 | `.agent/knowledge/headless-test-guide.md` — page API, items 계산, zone setup, cross-zone, bootstrap 패턴 (≤200줄) | M | — | 파일 존재 + 실용 패턴 집중 |
| T2 | `/repro` 스킬 작성 (dual-file) | 없음 | `.claude/commands/repro.md` + `.agent/workflows/repro.md` — 증상→Red test 전환. T1 runbook 로드 | S | →T1 | 파일 존재 + /red와 역할 구분 |
| T3 | `rules.md` 참조 표에 포인터 추가 | headless test 작성법 링크 없음 | 1행 추가 | S | →T1 | diff 확인 |
| T4 | `CLAUDE.md`에 headless test 참조 추가 | headless 언급 없음 | 포인터 1줄 추가 | S | →T1 | diff 확인 |
