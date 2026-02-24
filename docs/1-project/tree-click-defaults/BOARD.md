# tree-click-defaults

## Context

Claim: tree role preset에 `activate: { onClick: true }` + `select: { followFocus: true }` 기본 포함. 앱은 `role: "tree"` 선언만으로 클릭+키보드 expand가 동작해야 한다.

Before → After:
- Before: 앱마다 `activate: { onClick: true }` 수동 설정. 빠뜨리면 silent failure. LLM 반복 실패.
- After: tree preset이 APG 기본 동작을 완결. 앱은 수동 설정 불필요.

Risks: 기존 tree 사용자(DocsViewer)에서 이중 설정 → 제거 필요.

## 🔴 Now


## ⏳ Done

- [x] T1: tree role preset에 `onClick: true` + `followFocus: true` 추가 — tsc 0 | 983 tests (+3) | build OK ✅
  - `roleRegistry.ts`: tree preset `activate: { onClick: true }`, `select: { followFocus: true }`
  - `headless.ts`: `simulateClick`에 `resolveClick` Phase 2 추가 (mousedown→click 전체 파이프라인)
  - `tree.apg.test.ts`: 3 Red tests → Green (click expand toggle, non-focused expand, leaf no-expand)
  - `rolePresets.test.ts`: SPEC §7 table 갱신
- [x] T2: DocsViewer `options` 블록 삭제 (tree preset이 제공) — 983 tests | 0 regressions ✅
- [x] T3: Builder sidebar/panel — `followFocus` 수동 설정 제거 (tree preset이 제공) — 983 tests | 0 regressions ✅
  - `getExpandableItems`는 Zone prop에 유지 (동적 reactive 데이터는 bind-time에 접근 불가)
  - Discussion: [tree-click-pit-of-success](discussions/2026-0224-1107-tree-click-pit-of-success.md)

## Unresolved

- NormalizedCollection 기반 `collection` prop으로 `getExpandableItems` 자동 도출 (별도 프로젝트)
- `getExpandableItems`를 bind()로 이동하려면 AppHandle에 `getState()` 접근 필요

## 💡 Ideas

- Tree = 정규화 함수 1개 + `role: "tree"`. OS가 나머지 전부 제공.
- Application mode: `onClick: false` override + ExpandTrigger 재도입 (수요 발생 시)
