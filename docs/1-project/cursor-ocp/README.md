# cursor-ocp — BuilderCursor OCP 리팩토링

> **Type**: Light (리팩토링)
> **Created**: 2026-02-23
> **Status**: Active
> **Related**: builder-v2, query-adoption (completed)

## Summary

BuilderCursor의 분류 축을 블록 타입(hero, news…)에서 **컨텐츠 타입(text, icon, image, button…)**으로 전환하고,
하드코딩된 `TYPE_COLORS` + `resolveItemBlockInfo`를 제거하여 **OCP(Open-Closed Principle)**를 달성한다.

## Motivation

### 현재 문제

1. **분류 축이 잘못되었다**: 커서가 "어느 블록에 있는가"(hero, news)를 보여주지만, 사용자에게 유용한 정보는 "무엇을 다루고 있는가"(text, icon, button).
2. **OCP 위반**: `TYPE_COLORS`에 새 타입 추가 시 `BuilderCursor.tsx`를 수정해야 한다. 새 프리미티브 추가 = 커서 파일 수정.
3. **역추론 로직**: `resolveItemBlockInfo`가 블록 트리를 순회하여 타입을 역산. 프리미티브가 자신의 정체를 알고 있는데, 커서가 이를 재발견하고 있다.

### Discussion에서 도출된 Warrant

- W1. 커서 = "지금 무엇을 다루고 있는가" 표시. 블록 타입이 아니라 컨텐츠 타입.
- W2. `PropertyType`이 이미 컨텐츠 분류 체계를 정의 (text, icon, image, button, badge, …).
- W3. `primitives/` 구조가 이 분류를 물리적으로 증명.
- W4. OCP = 선언하는 쪽이 메타 소유, 소비자는 읽기만.
- W5. Hollywood Principle — 프리미티브 → Cursor 방향.
- W6. 관할권: Builder 내부 문제, OS 확장 불필요.
- W7. 포커스 변경이 리렌더 트리거이므로 Map 충분.
- W8. 선언형 우선: 프리미티브는 상수로 정체를 선언, lifecycle은 훅이 캡슐화.

## Guide-level explanation

### Before (OCP 위반)

```
BuilderCursor.tsx
  ├── TYPE_COLORS: Record<string, string>  ← 하드코딩
  └── resolveItemBlockInfo()               ← 블록 트리 역추론
```

새 프리미티브 추가 → `TYPE_COLORS` 수정 + `resolveItemBlockInfo` 수정

### After (OCP 달성)

```
primitives/BuilderIcon.tsx  → CURSOR_META = { tag: "icon", color: "#f59e0b" }
primitives/BuilderButton.tsx → CURSOR_META = { tag: "button", color: "#3b82f6" }
...

model/cursorRegistry.ts     → Map<itemId, { tag, color }> + get/set/delete
hooks/useCursorMeta.ts      → useEffect wrapper (register/unregister)

BuilderCursor.tsx           → getCursorMeta(itemId) 한 줄 읽기
```

새 프리미티브 추가 → 해당 파일에 `CURSOR_META` 선언 + `useCursorMeta()` 호출.
**BuilderCursor.tsx 수정 = 0줄.**

## Reference-level explanation

### 1. CursorRegistry (Builder 내부)

```typescript
// model/cursorRegistry.ts
type CursorMeta = { tag: string; color: string };
const registry = new Map<string, CursorMeta>();
export const cursorRegistry = { get, set, delete };
```

단순 Map. 반응성 불필요 — 포커스 변경이 BuilderCursor 리렌더를 트리거하므로, 읽기 시점에 최신 값이 보장됨.

### 2. useCursorMeta 훅

```typescript
// hooks/useCursorMeta.ts
export function useCursorMeta(itemId: string, meta: CursorMeta) {
  useEffect(() => {
    cursorRegistry.set(itemId, meta);
    return () => { cursorRegistry.delete(itemId); };
  }, [itemId, meta]);
}
```

### 3. 프리미티브 선언 패턴

```typescript
// primitives/BuilderIcon.tsx
const CURSOR_META = { tag: "icon", color: "#f59e0b" } as const;
export function BuilderIcon({ id }) {
  useCursorMeta(id, CURSOR_META);
  // ...
}
```

### 4. BuilderCursor 소비

```typescript
// BuilderCursor.tsx — 변경 후
const meta = cursorRegistry.get(itemId);
const tag = meta?.tag ?? "unknown";
const color = meta?.color ?? DEFAULT_COLOR;
```

`TYPE_COLORS`, `resolveItemBlockInfo`, `findBlockInfo`, `resolveFieldAddress` import 모두 삭제.

## Drawbacks

- 프리미티브가 `useCursorMeta`를 호출하지 않으면 커서에 "unknown" 표시. 하지만 이는 누락을 **즉시 발견**하게 하므로 오히려 장점.

## Prior art

- `6-products/builder/design/builder-cursor.md` — 이전 설계 결정 (block type 기준). 이번 변경으로 #2 결정이 supersede됨.
- `1-project/0-issue/2026-02-21_builder-cursor-invisible.md` — `resolveItemBlockInfo` 도입 배경. 이번 변경으로 이 함수 자체가 불필요해짐.
