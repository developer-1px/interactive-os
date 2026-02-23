# Design Decisions — BuilderCursor

> Source: query-adoption project (2026-02-21)
> Verified: tsc 0 errors, 826 tests pass, build OK

## 1. Block metadata는 State에서 읽는다 (DOM 역참조 금지)

**결정**: `data-level`, `data-builder-type` 등 block 속성은 DOM이 아닌 app state(`BuilderApp.useComputed`)에서 읽는다.

**근거**: DOM은 state의 투영(렌더링 결과)이지 진실의 원천이 아니다. State → DOM (render)이 정방향. DOM → State (read back)은 역참조.

**구현**: `findBlockInfo(blocks, itemId)` → `{ type, depth }`

## 2. ~~커서 색상은 block.type 기준~~ → 커서 색상은 **content type** 기준 (OCP)

**결정 (v2, 2026-02-23)**: 커서 하이라이트 색상과 태그는 **컨텐츠 타입**(text, icon, button, image, badge, link, divider, tabs)으로 결정한다. 블록 타입(hero, news, services)이 아님.

**근거**: 사용자에게 유용한 정보는 "어느 블록에 있는가"가 아니라 "무엇을 다루고 있는가"이다. OCP — 각 프리미티브가 자신의 메타데이터를 선언하고, BuilderCursor는 읽기만 한다. 새 프리미티브 추가 시 BuilderCursor 수정 = 0줄.

**구현**: `cursorRegistry.get(itemId)` → `{ tag, color }`. 프리미티브가 `useCursorMeta(id, CURSOR_META)` 훅으로 등록.

**Supersedes**: 이전 결정 (block.type 기준, `TYPE_COLORS` 맵)

## 3. 기하학(위치/크기)만 DOM에서 읽는다

**결정**: `getBoundingClientRect`, `scrollTop` 등 기하학 정보는 DOM에서 읽는 것이 정당. 이것은 렌더링 결과 중 state에 존재할 수 없는 뷰 전용 데이터.

**구현**: `useElementRect(element, container)` — 순수 React 훅으로 캡슐화.

## 4. findBlockInfo는 모델 유틸이다

**결정**: block 트리 순회 로직은 `model/appState.ts`에 위치. 뷰 컴포넌트(BuilderCursor)에 두지 않는다.

**근거**: Block 데이터 조회는 뷰 책임이 아닌 모델 책임. 다른 컴포넌트도 재사용 가능.

## 5. Top-level block (depth 0)은 커서를 표시하지 않는다

**결정**: 트리 최상위 블록(Hero, News 등 Section 레벨)에서는 BuilderCursor가 숨겨진다.

**근거**: Section은 전체 화면을 차지하므로 하이라이트가 무의미.
