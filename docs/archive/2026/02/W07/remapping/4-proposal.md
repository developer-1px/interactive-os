# 리매핑 설계 — 기술 제안서

## 구현 방향

Discussion 결론의 최종 설계를 그대로 구현한다:

```
DOM Event → 리스너(똑똑) → resolve → hit → dispatch
                                   → miss → kernel.resolveFallback(event)
                                              → 미들웨어 체인 순회
                                              → hit → dispatch
                                              → miss → 조용히 끝
```

## 변경 범위

### 1. Middleware 타입 확장 (`packages/kernel/src/core/tokens.ts`)

```diff
 export type Middleware = {
   id: string;
   scope?: ScopeToken;
   before?: (ctx: MiddlewareContext) => MiddlewareContext;
   after?: (ctx: MiddlewareContext) => MiddlewareContext;
+  fallback?: (event: Event) => BaseCommand | null;
 };
```

- `fallback`은 optional — 기존 미들웨어 호환 유지
- 네이티브 Event를 받고, Command를 반환하거나 null로 패스

### 2. `resolveFallback` API 추가 (`packages/kernel/src/createKernel.ts`)

```ts
function resolveFallback(event: Event): void {
  // GLOBAL 미들웨어만 순회 (scope 무관)
  const globalMws = scopedMiddleware.get(GLOBAL as string) ?? [];
  for (const mw of globalMws) {
    if (!mw.fallback) continue;
    const command = mw.fallback(event);
    if (command) {
      dispatch(command);
      return;
    }
  }
  // 모든 scope의 미들웨어도 순회
  for (const [, mws] of scopedMiddleware) {
    for (const mw of mws) {
      if (!mw.fallback) continue;
      const command = mw.fallback(event);
      if (command) {
        dispatch(command);
        return;
      }
    }
  }
}
```

핵심: `resolveFallback`은 자체적으로 트랜잭션을 남기지 않음. hit 시 `dispatch`를 호출하면 `dispatch`가 트랜잭션을 남김.

### 3. Kernel Return에 `resolveFallback` 노출

```diff
 return {
   ...root,
   getState, setState, subscribe,
   useComputed,
   getTransactions, getLastTransaction, clearTransactions, travelTo,
   getScopePath, getScopeParent,
+  resolveFallback,
 };
```

### 4. Mac Fallback 미들웨어 (`src/os-new/keymaps/macFallbackMiddleware.ts`)

```ts
import type { Middleware } from "@kernel";
import { getCanonicalKey, getMacFallbackKey } from "./getCanonicalKey";
import { Keybindings, type KeyResolveContext } from "./keybindings";

const isMac = typeof navigator !== "undefined" 
  && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export const macFallbackMiddleware: Middleware = {
  id: "mac-normalize",
  fallback: (event: Event) => {
    if (!isMac) return null;
    if (!(event instanceof KeyboardEvent)) return null;

    const canonicalKey = getCanonicalKey(event);
    const fallbackKey = getMacFallbackKey(canonicalKey);
    if (!fallbackKey) return null;

    const target = event.target as HTMLElement;
    const isEditing = target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target.isContentEditable;

    const context: KeyResolveContext = { isEditing };
    const binding = Keybindings.resolve(fallbackKey, context);
    if (!binding) return null;

    const args = binding.args ?? [];
    return binding.command(...args);
  },
};
```

### 5. KeyboardListener 단순화

```diff
- // 2nd pass (fallback): Mac normalization
- if (!binding) {
-   const fallbackKey = getMacFallbackKey(canonicalKey);
-   if (fallbackKey) {
-     binding = Keybindings.resolve(fallbackKey, context);
-   }
- }
+ // Fallback: delegate to kernel middleware chain
+ if (!binding) {
+   kernel.resolveFallback(e);
+   return;
+ }
```

### 6. getCanonicalKey 정리

- `getMacFallbackKey` 함수 유지 (미들웨어에서 사용)
- `getCanonicalKey` 변경 없음 (이미 Mac normalization 제거 완료)

## 리스크

| 리스크 | 완화 |
|--------|------|
| `@frozen` 커널 수정 | 최소 변경 (함수 1개, 타입 필드 1개 추가), 기존 동작 무변경 |
| 미들웨어 순회 순서 | GLOBAL 먼저, 이후 scope별 순회 — specificity 자연 보장 |
| `resolveFallback` 시 preventDefault 누락 | `KeyboardListener`에서 fallback dispatch 후 `e.preventDefault()` 처리 |

## 기각된 대안

Discussion 결론에서 이미 기각됨:

- 리스너를 바보로 (이벤트만 전달) → Focus/Click은 DOM 참조 필요
- UNRESOLVED 커맨드 dispatch → 트랜잭션 노이즈
- 미들웨어 인터페이스에 resolve 훅 추가 → `fallback` 이 더 단순
- getCanonicalKey에서 리매핑 제거 → Home/End 기존 동작 깨짐
