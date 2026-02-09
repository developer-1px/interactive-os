# OS Core 점진적 마이그레이션 전략

## 1. 개요 (Overview)

대대적 리팩토링을 **작동하는 상태를 유지하면서** 점진적으로 수행하는 전략.
Strangler Fig Pattern 사용 — 새 구조를 병렬로 만들고, 하나씩 옮기고, 기존 경로는 re-export로 호환성 유지.

### 핵심 원칙

1. **각 단계는 독립적으로 커밋 가능** — 빌드 성공 + 테스트 통과
2. **기존 import 경로는 즉시 깨지지 않음** — re-export로 임시 유지
3. **Command 단위로 마이그레이션** — TAB → NAVIGATE → SELECT → ... 순차적
4. **새 구조 완성 후 정리 단계** — re-export 제거, 경로 일괄 변경

---

## 2. 전체 로드맵

```
Phase 0: 준비           (1일)  — 새 폴더 구조 + 빈 파일 생성
  ↓
Phase 1: 첫 커맨드 이동  (1일)  — TAB (가장 단순)
  ↓
Phase 2: 복잡한 커맨드   (2일)  — NAVIGATE (resolve 파일 많음)
  ↓
Phase 3: 나머지 커맨드   (1일)  — SELECT, ACTIVATE, FOCUS, ESCAPE, ...
  ↓
Phase 4: 스토어 통합     (2일)  — focusData + FocusGroupStore → FocusStore
  ↓
Phase 5: 센서/코어 정리  (1일)  — sensor, core, primitives 이동
  ↓
Phase 6: 정리           (1일)  — re-export 제거, 레거시 폴더 삭제
```

**총 9일 — 매일 빌드 + 테스트 통과 보장**

---

## 3. Phase 0: 준비 (Foundation)

### 목표
새 폴더 구조를 만들고, path alias를 설정하여 이후 import 경로를 단순화.

### 작업

#### 1. 새 폴더 생성

```bash
mkdir -p src/os/1-sensor/{keyboard,focus,clipboard}
mkdir -p src/os/2-command/{navigate,tab,select,activate,focus,escape,expand,toggle,delete,clipboard,history}
mkdir -p src/os/3-store
mkdir -p src/os/4-effect
mkdir -p src/os/core
mkdir -p src/os/primitives
mkdir -p src/os/registry
mkdir -p src/os/schema
```

#### 2. tsconfig.json path alias 추가

```json
{
  "compilerOptions": {
    "paths": {
      "@os/sensor/*": ["./src/os/1-sensor/*"],
      "@os/command/*": ["./src/os/2-command/*"],
      "@os/store/*": ["./src/os/3-store/*"],
      "@os/effect/*": ["./src/os/4-effect/*"],
      "@os/core/*": ["./src/os/core/*"],
      "@os/primitives/*": ["./src/os/primitives/*"],
      "@os/registry/*": ["./src/os/registry/*"],
      // 기존 유지
      "@os/features/*": ["./src/os/features/*"],
      "@os/schema": ["./src/os/schema"]
    }
  }
}
```

#### 3. 빈 barrel export 파일 생성

```typescript
// src/os/2-command/tab/index.ts
// 마이그레이션 전까지 비어있음
export {};
```

모든 커맨드 폴더에 `index.ts` 생성 (빌드에러 방지).

### 검증
- `npm run build` 성공
- 기존 앱 정상 작동

---

## 4. Phase 1: 첫 커맨드 이동 — TAB

### 왜 TAB부터?
- 가장 단순 (dependencies 3개: DOM, FocusData, osCommand types)
- resolve 파일 없음 (모든 로직이 TAB.ts 안에)
- 성공하면 나머지 패턴 확립

### 작업 단계

#### Step 1.1: 새 구조로 코드 복사 + 분리

```typescript
// src/os/2-command/tab/command.ts
import { trap } from "./trap";
import { escape } from "./escape";
import { flow } from "./flow";
import type { OSCommand } from "@os/schema";

export const TAB: OSCommand<{ direction?: "forward" | "backward" }> = {
  run: (ctx, payload) => {
    const direction = payload?.direction ?? "forward";
    const behavior = ctx.config.tab.behavior;

    switch (behavior) {
      case "trap": return trap(ctx, direction);
      case "escape": return escape(ctx, direction);
      case "flow": return flow(ctx, direction);
      default: return escape(ctx, direction);
    }
  },
};
```

```typescript
// src/os/2-command/tab/trap.ts
import type { OSContext, OSResult } from "@os/schema";

export function trap(
  ctx: OSContext,
  direction: "forward" | "backward",
): OSResult | null {
  const items = ctx.dom.items;
  if (items.length === 0) return null;

  const currentIndex = ctx.focusedItemId
    ? items.indexOf(ctx.focusedItemId)
    : -1;
  const delta = direction === "forward" ? 1 : -1;
  let nextIndex = currentIndex + delta;

  if (nextIndex < 0) nextIndex = items.length - 1;
  else if (nextIndex >= items.length) nextIndex = 0;

  const targetId = items[nextIndex];
  return {
    state: { focusedItemId: targetId },
    domEffects: [{ type: "FOCUS", targetId }],
  };
}
```

`escape.ts`, `flow.ts`도 동일하게 분리.

```typescript
// src/os/2-command/tab/index.ts (barrel)
export { TAB } from "./command";
export { trap } from "./trap";
export { escape } from "./escape";
export { flow } from "./flow";
```

#### Step 1.2: 기존 경로에 re-export 추가 (호환성 유지)

```typescript
// src/os/features/focus/pipeline/2-intent/commands/TAB.ts
// DEPRECATED: 새 경로는 @os/command/tab
export { TAB } from "@os/command/tab";
```

#### Step 1.3: FocusIntent에서 새 경로로 import 변경

```typescript
// src/os/features/focus/pipeline/2-intent/FocusIntent.tsx
- import { TAB } from "./commands/TAB";
+ import { TAB } from "@os/command/tab";
```

#### Step 1.4: 검증

```bash
npm run build           # 빌드 성공
npm run test            # 테스트 통과
```

브라우저에서 Tab 키 동작 확인:
- dialog에서 trap 동작
- 일반 zone에서 escape 동작

### 커밋

```
git add src/os/2-command/tab/
git commit -m "refactor(os): migrate TAB command to new structure

- Split TAB.ts into command.ts + trap/escape/flow.ts
- Add re-export for backward compatibility
- Update FocusIntent import path
"
```

---

## 5. Phase 2: 복잡한 커맨드 이동 — NAVIGATE

### 왜 NAVIGATE?
- 가장 복잡 (resolve 파일 5개: focusFinder, resolveNavigate, resolveZoneSpatial, cornerNav, resolveEntry)
- 이걸 성공하면 나머지는 쉬움

### 작업 단계

#### Step 2.1: resolve 파일 매핑 결정

| 기존 파일 | 새 경로 | 역할 |
|---|---|---|
| `resolveNavigate.ts` + `resolveEntry.ts` | `linear.ts` | 1D 리스트 탐색 (통합) |
| `focusFinder.ts` | `spatial.ts` | 2D 그리드 탐색 (Android FocusFinder 알고리즘) |
| `resolveZoneSpatial.ts` | `seamless.ts` | Zone 경계 넘는 탐색 |
| `cornerNav.ts` | `corner.ts` | 모서리 처리 (가상 그리드) |

#### Step 2.2: 파일 복사 + 리팩토링

```typescript
// src/os/2-command/navigate/command.ts
import { navigateLinear } from "./linear";
import { navigateSpatial } from "./spatial";
import { navigateSeamless } from "./seamless";
import { handleTreeExpansion } from "./tree";
import type { OSCommand, OSContext, OSResult } from "@os/schema";

export const NAVIGATE: OSCommand<{ direction: Direction, ... }> = {
  run: (ctx, payload) => {
    // 기존 NAVIGATE.ts의 로직을 그대로 가져오되,
    // resolve 함수 호출만 새 함수명으로 변경
    
    // 1. Tree expansion check
    const treeResult = handleTreeExpansion(ctx, payload.direction);
    if (treeResult) return treeResult;

    // 2. Seamless navigation (zone boundary)
    const seamlessResult = navigateSeamless(ctx, payload.direction);
    if (seamlessResult) return seamlessResult;

    // 3. Spatial or linear
    if (ctx.config.navigate.strategy === "spatial") {
      return navigateSpatial(ctx, payload);
    }
    return navigateLinear(ctx, payload);
  },
};
```

```typescript
// src/os/2-command/navigate/linear.ts
// resolveNavigate.ts + resolveEntry.ts 내용 통합
import type { OSContext, OSResult } from "@os/schema";

export function navigateLinear(
  ctx: OSContext,
  payload: { direction: Direction, ... }
): OSResult | null {
  // 기존 resolveNavigate + resolveEntry 로직
  // ...
}
```

```typescript
// src/os/2-command/navigate/spatial.ts
// focusFinder.ts 내용을 그대로 옮김
export { findBestCandidate, getWeightedDistance } from "./focusFinder";
// 또는 그냥 파일명을 spatial.ts로 변경
```

#### Step 2.3: Re-export 추가

```typescript
// src/os/features/focus/pipeline/2-intent/commands/NAVIGATE.ts
export { NAVIGATE } from "@os/command/navigate";
```

```typescript
// src/os/features/focus/pipeline/3-resolve/focusFinder.ts
export * from "@os/command/navigate/spatial";
```

#### Step 2.4: import 경로 업데이트

`FocusIntent.tsx`에서:
```typescript
- import { NAVIGATE } from "./commands/NAVIGATE";
+ import { NAVIGATE } from "@os/command/navigate";
```

#### Step 2.5: 검증

```bash
npm run build
npm test
```

브라우저에서 방향키 네비게이션 전부 테스트:
- 리스트 (linear)
- 그리드 (spatial)
- Zone 경계 (seamless)
- 트리 확장/축소

### 커밋

```
git commit -m "refactor(os): migrate NAVIGATE command to new structure

- Split NAVIGATE.ts into command/linear/spatial/seamless/tree.ts
- Consolidate resolveNavigate + resolveEntry → linear.ts
- Rename focusFinder → spatial.ts
- Add re-exports for backward compat
"
```

---

## 6. Phase 3: 나머지 커맨드 (일괄)

### 대상
SELECT, ACTIVATE, FOCUS, SYNC_FOCUS, RECOVER, ESCAPE, EXPAND, TOGGLE, DELETE, clipboard, history

### 전략
Phase 1, 2의 패턴 반복:
1. 새 경로로 복사
2. behavior 분리 (있으면)
3. Re-export 추가
4. import 경로 업데이트
5. 검증 + 커밋

### 각 커맨드당 소요 시간
- 단순 (ACTIVATE, FOCUS, ESCAPE, DELETE, TOGGLE): 10분
- 중간 (SELECT, EXPAND): 20분 (behavior 분리)
- 복잡 (clipboard, history): 30분 (Intent 컴포넌트도 함께)

**총 2-3시간 작업.**

### 커밋 전략
- 커맨드 2-3개씩 묶어서 커밋
- 예: `SELECT + ACTIVATE`, `FOCUS + ESCAPE`, ...

---

## 7. Phase 4: 스토어 통합 (가장 큰 변경)

### 목표
`focusData.ts` + `FocusGroupStore` → 단일 `FocusStore`

### 작업

#### Step 4.1: 새 FocusStore 구조 생성

```typescript
// src/os/3-store/focusStore.ts
import { create } from "zustand";

interface ZoneState {
  focusedItemId: string | null;
  selection: string[];
  selectionAnchor: string | null;
  expandedItems: string[];
  stickyX: number | null;
  stickyY: number | null;
  recoveryTargetId: string | null;
}

interface FocusStoreState {
  activeZoneId: string | null;
  focusStack: FocusStackEntry[];
  zones: Map<string, ZoneState>;

  // Actions
  setActiveZone: (id: string | null) => void;
  updateZone: (id: string, partial: Partial<ZoneState>) => void;
  pushFocusStack: (entry: FocusStackEntry) => void;
  popFocusStack: () => FocusStackEntry | null;
  // ...
}

export const useFocusStore = create<FocusStoreState>((set, get) => ({
  activeZoneId: null,
  focusStack: [],
  zones: new Map(),

  setActiveZone: (id) => set({ activeZoneId: id }),
  updateZone: (id, partial) => {
    const zones = new Map(get().zones);
    const current = zones.get(id) ?? defaultZoneState();
    zones.set(id, { ...current, ...partial });
    set({ zones });
  },
  // ...
}));
```

#### Step 4.2: FocusData facade로 기존 API 유지

```typescript
// src/os/features/focus/lib/focusData.ts
// DEPRECATED: Use useFocusStore instead
import { useFocusStore } from "@os/store/focusStore";

// 기존 API를 새 store로 위임
export const FocusData = {
  getActiveZoneId: () => useFocusStore.getState().activeZoneId,
  setActiveZone: (id: string | null) => useFocusStore.getState().setActiveZone(id),
  
  getById: (zoneId: string) => {
    // zones Map에서 조회 + WeakMap에서 config 조회하여 결합
    // ...
  },
  
  // ... 나머지 API도 동일하게 위임
};
```

#### Step 4.3: 점진적 마이그레이션
1. 일부 파일부터 `useFocusStore` 직접 사용으로 변경
2. 나머지는 FocusData facade 경유
3. 모두 이동 후 facade 제거

#### Step 4.4: FocusItem 리렌더링 최적화

```typescript
// primitives/FocusItem.tsx
const { groupId } = useFocusGroupContext();

// Zone별 selector로 정확한 구독
const isFocused = useFocusStore(
  s => s.zones.get(groupId)?.focusedItemId === id,
  shallow
);
```

### 검증
- 모든 focus/select/navigate 동작 재확인
- Zone별 독립성 유지 확인
- 성능 회귀 없는지 확인 (React DevTools Profiler)

### 커밋

```
git commit -m "refactor(os): unify focus stores into single FocusStore

- Merge focusData + Zone stores → useFocusStore
- Maintain backward compat via FocusData facade
- Optimize FocusItem rendering with zone-scoped selectors
"
```

---

## 8. Phase 5: 센서/코어 정리

### 작업

#### 센서 이동
```
features/keyboard/pipeline/1-sense/ → 1-sensor/keyboard/
features/focus/pipeline/1-sense/    → 1-sensor/focus/
features/clipboard/ClipboardSensor  → 1-sensor/clipboard/
```

#### 코어 통합
```
features/command/model/createCommandStore.tsx → core/dispatch.ts
features/command/lib/routing                  → core/route.ts
middleware/                                   → core/middleware.ts
```

#### Primitives 이동
```
features/focus/primitives/ → primitives/
```

### Re-export 유지

```typescript
// features/focus/primitives/FocusGroup.tsx
export { FocusGroup } from "@os/primitives/FocusGroup";
```

---

## 9. Phase 6: 정리 (Cleanup)

### 목표
Re-export 제거, 레거시 폴더 삭제, import 경로 일괄 변경

### 작업

#### Step 6.1: Import 경로 일괄 변경

```bash
# 정규식 find-replace (VSCode)
# 예: FocusGroup import
features/focus/primitives/FocusGroup → @os/primitives/FocusGroup

# 수백 개 파일 일괄 변경
```

#### Step 6.2: Re-export 파일 삭제

```bash
rm -rf src/os/features/focus/pipeline/2-intent/commands/
rm -rf src/os/features/focus/pipeline/3-resolve/
# ...
```

#### Step 6.3: 빈 폴더 정리

```bash
find src/os/features -type d -empty -delete
```

#### Step 6.4: 최종 검증

```bash
npm run build
npm run test
npm run lint
```

모든 테스트 통과 + 빌드 성공 확인.

### 커밋

```
git commit -m "refactor(os): remove legacy structure

- Delete all re-export shims
- Update all import paths to new structure
- Remove features/focus/pipeline/
- Remove features/command/
"
```

---

## 10. 체크리스트

### 각 Phase 종료 시 확인

- [ ] `npm run build` 성공
- [ ] `npm run test` 모든 테스트 통과
- [ ] 브라우저에서 해당 기능 수동 테스트
- [ ] git commit (revert 가능하게)
- [ ] 변경 사항 문서화 (CHANGELOG or migration note)

### 리스크 관리

| 리스크 | 대응 |
|---|---|
| import 경로 깨짐 | re-export로 호환성 유지, Phase 6에서만 제거 |
| 스토어 통합 버그 | FocusData facade로 점진적 마이그레이션 |
| 성능 회귀 | React DevTools로 측정, selector 최적화 |
| 너무 많은 파일 변경 | Command 단위로 작게 나눈 커밋 |

---

## 11. 예상 일정

| Phase | 소요 | 누적 | 주요 작업 |
|---|---|---|---|
| 0. 준비 | 1일 | 1일 | 폴더 생성, path alias |
| 1. TAB | 1일 | 2일 | 첫 커맨드 이동, 패턴 확립 |
| 2. NAVIGATE | 2일 | 4일 | 복잡한 커맨드 이동 |
| 3. 나머지 커맨드 | 1일 | 5일 | SELECT, ACTIVATE, ... (10개) |
| 4. 스토어 통합 | 2일 | 7일 | focusData + stores → FocusStore |
| 5. 센서/코어 | 1일 | 8일 | sensor, core, primitives 이동 |
| 6. 정리 | 1일 | 9일 | re-export 제거, 경로 변경 |

**총 9일 (working days)** — 2주 스프린트에 여유 있게 완료 가능.

---

## 12. 결론

**핵심은 "작동하는 상태를 절대 깨지 않는다"입니다.**

- 새 구조를 옆에 만들고 (Phase 0)
- 커맨드 하나씩 옮기고 (Phase 1-3)
- Re-export로 기존 경로 유지하고
- 모두 이동한 뒤 정리 (Phase 6)

각 Phase는 독립적으로 커밋 가능하고, 언제든 되돌릴 수 있습니다.
