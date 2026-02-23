# docs-sidebar-os

> Docs Sidebar를 OS Best Practice로 재구축

## Summary

docs-viewer 사이드바의 Recent, Favorites, Tree 섹션을 각각 OS Zone으로 변환한다.
현재 바닐라 React (useState, onClick)로 되어 있는 부분을 defineApp + Zone.bind() + 커맨드 파이프라인으로 교체.

## Motivation

다른 에이전트가 만든 코드가 OS best practice를 따르지 않았다:
- Recent/Favorites: OS Zone 바깥 → 키보드 네비게이션, Inspector 추적, 포커스 복구 불가
- activePath 이중 상태: DocsViewer의 useState + DocsApp의 state
- 뷰 컴포넌트(DocsSidebar)에 로직(getExpandableItems, onSelect prop) 침범

Todo 벤치마크 패턴:
- app.ts가 모든 로직의 Single Source (State, Commands, Selectors, Zone bind)
- Zone.bind()의 onAction/onSelect가 커맨드 브릿지
- Namespaced export로 패키지화

## Guide-level explanation

1. `app.ts`에 3개 Zone 정의: `docs-recent`, `docs-favorites`, `docs-sidebar`(기존)
2. 세 Zone 모두 `onAction → selectDoc` 커맨드로 `activePath` 변경
3. DocsViewer가 `DocsApp.useComputed()`로 activePath를 읽음 (useState 제거)
4. DocsSidebar에서 `onSelect` prop 제거 — 커맨드가 대체

## Unresolved questions

- 3개 Zone을 하나로 통합할 것인가? → 먼저 독립 구현 후 실증 기반 판단
- ID 네임스페이스 필요 여부 → 독립 Zone이면 불필요
