# Issue: 빌더 Canvas에서 ArrowDown 키보드 네비게이션 미작동

> **Status**: [Open]
> **Priority**: P1 (기능불가 — 키보드 포커스 이동 안 됨)
> **Created**: 2026-02-23

## 증상

Canvas zone에서 아이템 클릭 후 ArrowDown → Diff: None (포커스 이동 안 됨).

## Inspector 로그 (핵심)

```
mousedown ncp-hero-title → OS_FOCUS → activeZoneId: "canvas", focusedItemId: "ncp-hero-title" ✅
mousedown ncp-hero-title → OS_SELECT → selection: ["ncp-hero-title"] ✅
ArrowDown               → OS_NAVIGATE {direction: "down"} → Diff: None ❌
```

## 진단 (D3)

getItems() → accessor(state) = s.data.blocks → **root blocks only** (sections).
itemFilter → createCanvasItemFilter → filters by focused item's `data-level`.

Focused item = `ncp-hero-title` → `data-level = "item"`.
itemFilter looks for `data-level === "item"` among root blocks → root blocks are all `data-level = "section"` → **0 matches → items = [] → early return**.

이전(DOM_ITEMS 시대): DOM querySelectorAll(`[data-item-id]`)로 모든 레벨 아이템 수집 → itemFilter 후 현재 레벨만 남음 → navigate 가능.

accessor-first 전환 후: getItems()가 root blocks만 반환 → nested items(group, item) 누락 → itemFilter 후 빈 배열.

## D4. Plan

- **근본 원인**: getItems()가 tree의 root만 반환. Builder canvas는 hierarchical — 모든 레벨의 아이템이 필요.
- **해결 방향**: 기존 메커니즘 재사용. builder의 `accessor`가 tree를 flat화한 전체 아이템 목록을 반환하거나, `getItems()`가 tree를 재귀적으로 순회.
- **수정 파일**: `src/os/collection/createCollectionZone.ts` 또는 `src/apps/builder/app.ts`
- **엔트로피 체크**: tree flattening은 기존 패턴 (DOM querySelectorAll이 하던 것). 새 패턴 아님.
- **설계 냄새**: `opsFromAccessor`가 flat array 가정 — tree 구조 지원 필요
