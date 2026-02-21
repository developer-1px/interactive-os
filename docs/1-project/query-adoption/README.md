# RFC — query-adoption

> defineQuery/useQuery를 실전 적용하여 앱 레이어의 직접 DOM API 호출을 제거한다.

## Motivation

DOM API 전수 조사(2026-02-21)에서 발견:
- OS 레이어의 DOM API 사용은 전부 정당 (센서/컨텍스트/이펙트/컴포넌트)
- 앱 레이어 유일의 문제: **BuilderCursor.tsx** — DOM API 7종류, 280줄
- OS 이펙트 레이어: `4-effects/index.ts`의 focus/scroll 로직도 개선 가능

방금 커널에 추가한 `defineQuery`/`useQuery`가 정확히 이 문제를 해결하기 위해 만들어졌다.

## Guide-level explanation

### Before (직접 DOM)
```tsx
// BuilderCursor.tsx — 직접 DOM API 7종류 사용
const el = document.getElementById(itemId);
const rect = el.getBoundingClientRect();
const level = el.getAttribute("data-level");
// + ResizeObserver, MutationObserver, parentElement, scrollTop...
```

### After (useQuery)
```tsx
// OS가 제공하는 Query
const FOCUSED_RECT = os.defineQuery("focused-rect", (state) => {
  const itemId = state.os.focus.focusedItem;
  if (!itemId) return null;
  const el = document.getElementById(itemId);
  return el?.getBoundingClientRect() ?? null;
}, { invalidateOn: ["OS_FOCUS", "OS_NAVIGATE"] });

// BuilderCursor — DOM API 0개
const rect = os.useQuery(FOCUSED_RECT);
```

## Scope

| 대상 | 현재 | 목표 |
|------|------|------|
| `BuilderCursor.tsx` | DOM API 7종류 직접 호출 | `useQuery` 1개로 대체 |
| `4-effects/index.ts` | `getElementById` + `.focus()` + `scrollIntoView` | defineQuery provider로 요소 조회 통합 |

## Out of Scope

- OS 1-listeners의 DOM API (센서 = 정당)
- OS 2-contexts의 DOM API (cofx provider = 정당)
- docs-viewer (독립 모듈, 격리됨)
