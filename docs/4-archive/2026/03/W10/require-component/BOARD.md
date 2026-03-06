# require-component

## Context

Claim: `createPage(app, Component?)` -> `createPage(app, Component)` — React Component를 필수로 만들어 테스트 자기완결성을 타입 레벨에서 강제한다.

Before -> After:
- Before: Component는 optional. `query()`/`html()` 호출 시 런타임 에러로 보호
- After: Component는 required. 타입 레벨에서 강제. 모든 테스트가 자기 컴포넌트를 명시적으로 선언

Backing:
- 업계 표준 (RTL, Storybook, Playwright Component, Cypress) 모두 컴포넌트 필수
- 우리는 jsdom 대신 `renderToString` 사용 (이미 page.ts에 존재)
- rules.md: "DOM 없이 검증 가능"이 OS 핵심 가치 -> jsdom 도입 불필요

Risks:
- ~60 호출 / ~35 파일 마이그레이션 필요
- DocsViewer는 `virtual:docs-meta` Vite 가상 모듈 의존으로 테스트 환경에서 import 불가

## Now

## Done
- [x] T1: 타입 시그니처 변경 — tsc 0 | 178 files passed | build OK
- [x] T2: APG 테스트 마이그레이션 — 21 파일 `() => null` 적용 (인라인 defineApp)
- [x] T3: App 테스트 마이그레이션 — builder 4파일 BuilderPage, inspector 1파일 UnifiedInspector, docs 3파일 `() => null` (Vite 가상 모듈 제약)
- [x] T4: OS 인프라 테스트 마이그레이션 — 6파일 `() => null` 적용
- [x] T5: createOsPage 내부 호출 — `() => null` 적용

## Unresolved
- docs-tab.test.ts 7 fails — 기존 미해결 (새 파일, 우리 변경과 무관)
- DocsViewer를 테스트에서 사용하려면 `virtual:docs-meta` mock 필요 (별도 이슈)

## Ideas
- TestScript 인터페이스에도 component 필수 필드 추가 (browser TestBot 자기완결)
- Vite 가상 모듈 mock 인프라 구축 시 DocsViewer를 실제 Component로 전환
