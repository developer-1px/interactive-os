# headless-page-docs

## Context

Claim: createHeadlessPage의 공식 문서를 작성하여, 흩어진 지식을 하나의 원천으로 통합한다.

Why: 현재 HeadlessPage 지식이 5곳에 산재 — knowledge 2개, inbox 보고서 1개, FEATURES 1개, MEMORY 다수. 공식 문서(2-area/official/)가 없어서 새 세션마다 파편을 재조합해야 한다.

Before → After:
- Before: HeadlessPage 공식 문서 없음. `.agent/knowledge/`와 `0-inbox/` 보고서에 산재.
- After: `docs/2-area/official/os/headless-page.md` 하나가 canonical reference.

Risks: 기존 knowledge 파일과 중복될 수 있음 → knowledge는 에이전트용(how to write tests), official은 컨셉 설명(what is HeadlessPage) — 역할이 다르므로 중복 아님.

## Now

### T1: 공식 문서 작성
- [ ] `docs/2-area/official/os/headless-page.md` 작성
  - What: HeadlessPage가 무엇인가 (Playwright subset, DOM-free)
  - Why: 왜 필요한가 (Zero Drift, 100% Observable)
  - Architecture: 3-engine (headless, browser, Playwright)
  - API: createHeadlessPage(), page.locator(), keyboard, assertions
  - Links: knowledge 파일, FEATURES §18

### T2: inbox 보고서 정리
- [ ] `docs/0-inbox/2-[report]-os-testing-architecture-status.md` → 이 프로젝트의 notes/로 이동 (참고 자료로 보존)

### T3: knowledge 파일 정합성
- [ ] `testing-tools.md` Tier 1 설명이 공식 문서와 일치하는지 확인 + link 추가
- [ ] `verification-standards.md`에 공식 문서 link 추가

## Done

## Unresolved

## Ideas
- createTestBench 공식 문서도 별도 필요할 수 있음
- runScenarios / TestScript ONE Format 공식 문서
