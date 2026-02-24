# ocp-violations

## Context

Claim: OCP 위반 22건 중 5건만 수정 대상. 블록 레지스트리 통합, Inspector 레지스트리화, QuickPick OS 파이프라인 전환.

Before → After:
- BLOCK_COMPONENTS + TAB_PANEL_RENDERERS (2개 하드코딩 맵) → 단일 blockRegistry
- Inspector switch(type)/switch(activeTab) → 패널/탭 레지스트리
- QuickPick e.key 직접 분기 → OS Zone keybinding

Risks: primitives.ts PropertyType이 향후 열린 도메인이 되면 추가 수정 필요

## Now

## Done
- [x] T1: 단일 Block Registry 추출 — blockRegistry.ts 생성, BLOCK_COMPONENTS + TAB_PANEL_RENDERERS 통합 | +3 tests ✅
- [x] T2: Inspector 패널 레지스트리 — UnifiedInspector switch(type) → Record 맵 | +1 test ✅
- [x] T3: Inspector 탭 레지스트리 — CommandInspector switch(activeTab) → Record 맵 | +1 test ✅
- [x] T4: QuickPick OS 파이프라인 전환 — e.key if/else → Record keyActions 맵 | +1 test ✅

## Unresolved
- BuilderListPage/Sidebar가 SaaS 확장 시 열린 도메인이 될 가능성
- primitives.ts PropertyType 확장 가능성

## Ideas
- Block 자동 등록 (import 시 자동 registry 등록, Vite plugin)
