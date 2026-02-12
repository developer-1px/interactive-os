# Phase 0: Spike — Kernel 기반 os-new 프로토타입

> 날짜: 2026-02-10  
> 태그: spike, prototype, os-new, kernel  
> 상태: Ready to Execute  
> 선행 문서: 2026-02-09_OS-New_Kernel_Migration_Plan.md

---

## 1. 개요 (Overview)

**목표:** Zone 1개 + NAVIGATE 커맨드로 **전체 6-Domino 파이프라인 동작 검증**

**범위:**
- 최소한의 코드 (각 domino당 1개 파일)
- 하드코딩 허용 (빠른 검증이 목적)
- End-to-end 동작 확인 (keyboard → dispatch → command → effect → DOM)

**성공 기준:**
- [ ] ArrowDown 키를 누르면 다음 아이템으로 포커스 이동
- [ ] `useComputed`로 컴포넌트가 자동 re-render
- [ ] Kernel transaction log에 기록됨
- [ ] TypeScript 컴파일 0 에러

**예상 소요 시간:** 2-4시간

---

## 2. 구현 계획 (Implementation Plan)

### 파일 구조

```
src/os-new/spike/
├── state.ts           OSState 정의
├── effect.ts          focus effect 등록
├── context.ts         dom-items context 등록
├── command.ts         NAVIGATE command 등록
├── hook.ts            useFocused hook
├── Zone.tsx           Zone component
├── listener.tsx       KeyboardListener
└── SpikeDemo.tsx      테스트 페이지
```

---

### Step 1: State 정의 (5분)

**파일:** `src/os-new/spike/state.ts`

```typescript
export interface OSState {
  focus: {
    activeZoneId: string | null;
    zones: Record<string, ZoneState>;
  };
}

export interface ZoneState {
  focusedItemId: string | null;
}

export const initialOSState: OSState = {
  focus: {
    activeZoneId: null,
    zones: {},
  },
};
```

**검증:**
- [ ] TypeScript 컴파일 성공

---

### Step 2: Effect 등록 (5분)

**파일:** `src/os-new/spike/effect.ts`

```typescript
import { kernel } from "@kernel";

export function registerEffects() {
  kernel.defineEffect("focus", (id: string) => {
    console.log("[effect] focus:", id);
    const el = document.getElementById(id);
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
}
```

**검증:**
- [ ] `registerEffects()` 호출 가능
- [ ] console.log 출력 확인

---

### Step 3: Context 등록 (10분)

**파일:** `src/os-new/spike/context.ts`

```typescript
import { kernel } from "@kernel";

export function registerContexts() {
  kernel.defineContext("dom-items", () => {
    const zoneId = kernel.getState().os?.focus.activeZoneId;
    if (!zoneId) return [];
    
    const zoneEl = document.getElementById(zoneId);
    if (!zoneEl) return [];
    
    const items = Array.from(
      zoneEl.querySelectorAll("[data-focus-item]")
    ) as HTMLElement[];
    
    return items.map(el => el.id);
  });
}
```

**검증:**
- [ ] context provider 등록 성공
- [ ] DOM에 `data-focus-item` 있을 때 items 반환

---

### Step 4: Command 등록 (20분)

**파일:** `src/os-new/spike/command.ts`

```typescript
import { kernel, inject } from "@kernel/internal";
import type { OSState } from "./state.ts";

interface NavigatePayload {
  direction: "UP" | "DOWN";
}

export function registerCommands() {
  kernel.defineCommand<NavigatePayload>(
    "OS_NAVIGATE",
    [inject("dom-items")],
    (ctx, payload) => {
      const items = ctx["dom-items"] as string[];
      const zoneId = (ctx.state as any).os?.focus.activeZoneId;
      const currentId = (ctx.state as any).os?.focus.zones?.[zoneId]?.focusedItemId;
      
      if (!items.length) return null;
      
      const currentIndex = currentId ? items.indexOf(currentId) : -1;
      let nextIndex: number;
      
      if (payload.direction === "DOWN") {
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      }
      
      const targetId = items[nextIndex];
      
      console.log("[command] NAVIGATE:", { currentId, targetId, direction: payload.direction });
      
      return {
        state: {
          ...(ctx.state as any),
          os: {
            focus: {
              activeZoneId: zoneId,
              zones: {
                [zoneId]: { focusedItemId: targetId },
              },
            },
          },
        },
        focus: targetId,
      };
    }
  );
}
```

**검증:**
- [ ] `dispatch({ type: "OS_NAVIGATE", payload: { direction: "DOWN" } })` 실행
- [ ] state 업데이트 확인
- [ ] focus effect 트리거 확인

---

### Step 5: Hook (10분)

**파일:** `src/os-new/spike/hook.ts`

```typescript
import { useComputed } from "@kernel";

export function useFocused(zoneId: string, itemId: string): boolean {
  return useComputed<boolean>((state: any) => {
    return state.os?.focus?.zones?.[zoneId]?.focusedItemId === itemId;
  });
}

export function useFocusedItem(zoneId: string): string | null {
  return useComputed<string | null>((state: any) => {
    return state.os?.focus?.zones?.[zoneId]?.focusedItemId ?? null;
  });
}
```

**검증:**
- [ ] Component에서 `useFocused("spike-zone", "item-1")` 사용
- [ ] 포커스 변경 시 자동 re-render

---

### Step 6: Component (15분)

**파일:** `src/os-new/spike/Zone.tsx`

```typescript
import { useEffect } from "react";
import { kernel } from "@kernel/internal";
import { useFocused } from "./hook.ts";

interface ZoneProps {
  id: string;
  children: React.ReactNode;
}

export function Zone({ id, children }: ZoneProps) {
  useEffect(() => {
    // Mount: activeZoneId 설정
    kernel.setState((prev: any) => ({
      ...prev,
      os: {
        ...prev.os,
        focus: {
          ...prev.os?.focus,
          activeZoneId: id,
          zones: {
            ...prev.os?.focus?.zones,
            [id]: { focusedItemId: null },
          },
        },
      },
    }));
    
    return () => {
      // Unmount: cleanup (optional for spike)
    };
  }, [id]);
  
  return (
    <div id={id} style={{ border: "2px solid blue", padding: "1rem" }}>
      <h3>Zone: {id}</h3>
      {children}
    </div>
  );
}

interface ItemProps {
  id: string;
  zoneId: string;
  children: React.ReactNode;
}

export function Item({ id, zoneId, children }: ItemProps) {
  const isFocused = useFocused(zoneId, id);
  
  return (
    <div
      id={id}
      data-focus-item
      tabIndex={0}
      style={{
        padding: "0.5rem",
        margin: "0.25rem 0",
        background: isFocused ? "yellow" : "white",
        border: "1px solid gray",
        cursor: "pointer",
      }}
    >
      {children} {isFocused && "← FOCUSED"}
    </div>
  );
}
```

**검증:**
- [ ] Zone mount 시 activeZoneId 설정됨
- [ ] Item이 포커스 상태에 따라 스타일 변경

---

### Step 7: Listener (15분)

**파일:** `src/os-new/spike/listener.tsx`

```typescript
import { useEffect } from "react";
import { dispatch } from "@kernel";

export function KeyboardListener() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        console.log("[listener] ArrowDown");
        dispatch({ type: "OS_NAVIGATE", payload: { direction: "DOWN" } });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        console.log("[listener] ArrowUp");
        dispatch({ type: "OS_NAVIGATE", payload: { direction: "UP" } });
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  return null;
}
```

**검증:**
- [ ] ArrowDown/Up 키 누르면 dispatch 실행
- [ ] preventDefault 동작 확인

---

### Step 8: Demo Page (10분)

**파일:** `src/os-new/spike/SpikeDemo.tsx`

```typescript
import { useEffect } from "react";
import { initKernel, state } from "@kernel";
import { initialOSState } from "./state.ts";
import { registerEffects } from "./effect.ts";
import { registerContexts } from "./context.ts";
import { registerCommands } from "./command.ts";
import { Zone, Item } from "./Zone.tsx";
import { KeyboardListener } from "./listener.tsx";

export function SpikeDemo() {
  useEffect(() => {
    // Kernel 초기화
    initKernel(state({ os: initialOSState }));
    registerEffects();
    registerContexts();
    registerCommands();
    
    console.log("[SpikeDemo] Kernel initialized");
  }, []);
  
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Spike: Kernel + os-new Prototype</h1>
      <p>Use ArrowUp/ArrowDown to navigate</p>
      
      <KeyboardListener />
      
      <Zone id="spike-zone">
        <Item id="item-1" zoneId="spike-zone">Item 1</Item>
        <Item id="item-2" zoneId="spike-zone">Item 2</Item>
        <Item id="item-3" zoneId="spike-zone">Item 3</Item>
        <Item id="item-4" zoneId="spike-zone">Item 4</Item>
      </Zone>
    </div>
  );
}
```

**라우터 등록:**
```tsx
// src/App.tsx
import { SpikeDemo } from "./os-new/spike/SpikeDemo.tsx";

<Route path="/spike-demo" element={<SpikeDemo />} />
```

**검증:**
- [ ] `/spike-demo` 페이지 접속
- [ ] ArrowDown 누르면 item-1 → item-2 → item-3 → item-4 → item-1 순환
- [ ] 포커스된 아이템이 노란색으로 표시
- [ ] DOM focus도 실제 이동 (tab 키로 확인)

---

## 3. 검증 체크리스트

### 기능 검증
- [ ] **Navigation**: ArrowDown/Up으로 포커스 이동
- [ ] **Looping**: 마지막 아이템에서 ArrowDown → 첫 아이템
- [ ] **Visual feedback**: 포커스된 아이템 노란색
- [ ] **DOM focus**: 실제로 `document.activeElement` 변경됨
- [ ] **Console logs**: listener → command → effect 순서 확인

### Kernel 검증
- [ ] **State**: `getState().os.focus.zones["spike-zone"].focusedItemId` 확인
- [ ] **Transaction**: `getTransactions()` 로그 기록됨
- [ ] **useComputed**: 상태 변경 시 자동 re-render
- [ ] **Effect**: focus effect 실행됨

### 코드 품질
- [ ] **TypeScript**: 0 에러
- [ ] **Hot reload**: 코드 수정 시 자동 새로고침
- [ ] **No warnings**: Console에 warning 없음

---

## 4. 알려진 제약사항 (Spike Limitations)

**하드코딩된 부분 (추후 일반화 필요):**
- Zone ID가 `"spike-zone"`으로 고정
- State 업데이트가 완전 교체 (immutable update helper 없음)
- Context injection에서 타입 안전성 부족 (`ctx["dom-items"] as string[]`)
- Scope/bubblePath 사용 안 함 (scoped handler 미구현)
- Middleware 없음 (transaction은 kernel 내장으로 기록됨)

**이런 제약은 괜찮습니다 — Spike의 목적은 "동작 검증"이지 "완벽한 구현"이 아닙니다.**

---

## 5. 다음 단계 (After Spike)

Spike 성공 후:

1. **Retrospective** (30분)
   - 무엇이 잘 동작했는가?
   - 어떤 설계 이슈가 발견되었는가?
   - Kernel API에서 부족한 점은?

2. **Phase 1: State Layer** 착수
   - OSState 인터페이스 완성
   - Immer 기반 immutable update
   - Zone registry 구현

3. **Phase 2-7 순차 진행**
   - Spike에서 검증된 패턴을 기반으로 확장

---

## 6. 참고사항

**Spike는 "배울 목적으로 버려도 되는 코드"입니다.**
- 빠르게 만들고, 동작 확인하고, 배운 것을 정리하고, 다시 제대로 만드는 게 목표
- 완벽함보다 **빠른 피드백**이 우선

**예상 이슈:**
- Kernel의 `setState` API가 없을 수 있음 → `internal.ts`에서 `resetState` 활용
- `useComputed`가 selector를 받지 않을 수 있음 → 확인 필요
- Hot reload 시 중복 등록 이슈 → `registerXXX` 중복 호출 방지

**준비되면 시작합시다! 🚀**
