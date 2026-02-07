# CommandEngineStore 개선 제안서

## 1. 현재 상태 진단

### 파일 구조 (255줄)
```
L1-14    imports
L16-58   Interface (CommandEngineState) — 상태 + 액션 + getter 혼재
L60-154  Store Instance — 상태관리 + 로깅 + 레지스트리 조회 혼재
L156-187 Convenience Hooks — React Hook 4개 (Store 파일에 위치)
L189-254 Static Accessors — 정적 API (CommandEngineStore 객체)
```

### 핵심 문제

이 파일은 **4가지 역할**을 한 파일에서 수행하고 있다:

1. **앱 레지스트리 관리** — registerApp, unregisterApp, appRegistries
2. **커맨드 실행 관문** — dispatch, dispatchOS (로깅 포함)
3. **키바인딩 조회** — getAllKeybindings, getActiveContextMap, getActiveState
4. **React Hook 제공** — useDispatch, useAppState, useRegistry, useContextMap

한 파일에 역할이 4개이면 변경 이유도 4가지가 된다. 실제로 오늘 '스크롤 로직 변경'을 위해 이 파일을 건드리면서 6개 파일에 연쇄 수정이 발생했다.

---

## 2. 개선 방향: 역할 분리

### Before (현재)
```
CommandEngineStore.ts (255줄, 역할 4개)
├── 앱 레지스트리 관리
├── 커맨드 실행 (dispatch)
├── 키바인딩 조회
└── React Hooks
```

### After (제안)
```
CommandEngineStore.ts (~80줄)     — 순수 상태 저장소
CommandGateway.ts    (~60줄)     — 커맨드 실행 관문 (dispatch + 로깅)
CommandContext.tsx   (기존 활용)  — React Hooks
```

---

## 3. 구체적 변경 사항

### Phase 1: Dead Code 제거 (즉시)

| 제거 대상 | 근거 |
|-----------|------|
| `getActiveRegistry()` | 외부 호출 0건 |
| `getOSRegistry()` | 과거 `routeCommand`에서 사용했으나 현재 미사용 |
| `setActiveApp()` | `registerApp`이 activeAppId를 자동 설정하므로 불필요 |
| `useContextMap` Hook | 앱 코드에서 미사용 (`routeCommand`는 `store.getActiveContextMap()` 사용) |
| `CommandEngineStore.get()` | `useCommandEngineStore.getState()`와 동일. 사용처 0 |
| stale 주석 3개 | L198-200, L211-213: 이전 아키텍처 설명 |

**효과:** ~35줄 삭제, 인터페이스 5개 항목 축소

### Phase 2: React Hooks 이동

`CommandEngineStore.ts`에서 L156-187의 `useDispatch`, `useAppState`, `useRegistry`를 삭제하고, `CommandContext.tsx`에서 직접 구현한다.

**Before:** `CommandContext.tsx`가 `CommandEngineStore.ts`에서 Hook을 import 후 re-export
**After:** `CommandContext.tsx`가 Hook을 직접 정의 (단일 책임)

```typescript
// CommandContext.tsx (After)
export function useDispatch() {
  const activeAppId = useCommandEngineStore((s) => s.activeAppId);
  const appRegistries = useCommandEngineStore((s) => s.appRegistries);
  const dispatch = activeAppId ? appRegistries.get(activeAppId)?.dispatch : null;
  return dispatch ?? (() => {});
}
// ... useAppState, useRegistry 도 동일하게 이동
```

**효과:** Store 파일이 순수 상태 로직으로 한정됨

### Phase 3: CommandGateway 분리

`CommandEngineStore` 정적 객체(L193-254)를 별도 파일로 분리한다.

```typescript
// CommandGateway.ts — 커맨드 실행의 단일 관문
import { useCommandEngineStore } from "./CommandEngineStore";
import { useCommandEventBus } from "../lib/useCommandEventBus";
import { InspectorLog } from "../../inspector/InspectorLogStore";

export const CommandGateway = {
  /** App 커맨드 실행 (COMMAND 로깅 포함) */
  dispatch(cmd: BaseCommand) {
    const dispatch = useCommandEngineStore.getState().getActiveDispatch();
    if (dispatch) {
      InspectorLog.log({ type: "COMMAND", title: cmd.type, details: cmd, icon: "terminal", source: "app" });
      dispatch(cmd);
    } else {
      console.warn(`[CommandGateway] No active dispatch for: ${cmd.type}`);
    }
  },

  /** OS 커맨드 실행 (EventBus 경유, COMMAND 로깅 포함) */
  dispatchOS(cmd: BaseCommand) {
    InspectorLog.log({ type: "COMMAND", title: cmd.type, details: cmd, icon: "terminal", source: "os" });
    useCommandEventBus.getState().emit(cmd);
  },

  /** 앱 상태 스냅샷 (TestBot용) */
  getAppState<S>(appId: string): S | null { ... },

  /** 앱 상태 복원 (TestBot용) */
  setAppState<S>(appId: string, state: S): void { ... },
};
```

**효과:**
- `CommandEngineStore.ts`에서 `InspectorLog` import 제거 (의존성 감소)
- 커맨드 실행 로직이 `CommandGateway`라는 명확한 이름을 갖게 됨
- 외부 파일에서 `CommandEngineStore.dispatch()` → `CommandGateway.dispatch()`로 의미가 명확해짐

### Phase 4: raw `getActiveDispatch()` 우회 경로 통합

현재 `CommandGateway.dispatch()`를 우회하여 raw `getActiveDispatch()`를 직접 호출하는 곳이 **8곳** 있다:

| 파일 | 변환 방안 |
|------|-----------|
| `pipeline.ts` L76 (appCommand) | `CommandGateway.dispatch(result.appCommand)` |
| `dispatchToZone.ts` L29 | `CommandGateway.dispatch(command)` |
| `useInputEvents.ts` L57, L75 | `CommandGateway.dispatch(...)` |
| `routeField.ts` L20 | `CommandGateway.dispatch(...)` |
| `useCommandListener.ts` L46 | 콜백 인자에 `CommandGateway.dispatch` 전달 |
| `keyboardCommand.ts` L115 | `CommandGateway.dispatch(result.dispatch)` (동적 import 제거도 가능) |
| `FocusSync.tsx` L135 | `CommandGateway.dispatch(RECOVER)` |

**효과:** 모든 커맨드가 단일 관문을 통과 → COMMAND 로그 100% 수집 → EventStream 스크롤 정확

---

## 4. 최종 파일 구조 (After)

```
CommandEngineStore.ts  (~80줄)
  ├── AppEntry interface
  ├── CommandEngineState interface (축소된)
  └── useCommandEngineStore (순수 상태: register/unregister/update/query)

CommandGateway.ts      (~60줄)
  ├── dispatch()        — App 커맨드 실행 + COMMAND 로깅
  ├── dispatchOS()      — OS 커맨드 실행 + COMMAND 로깅
  ├── getAppState()     — TestBot용 스냅샷
  └── setAppState()     — TestBot용 복원

CommandContext.tsx      (~50줄)
  ├── useEngine()       — 통합 Hook
  ├── useDispatch()     — dispatch Hook
  ├── useAppState()     — state Hook
  └── useRegistry()     — registry Hook
```

**총 ~190줄** (현재 255 + 57 = 312줄에서 **~40% 감소**)

---

## 5. 실행 우선순위

| 순서 | 작업 | 영향 범위 | 난이도 |
|------|------|-----------|--------|
| **1** | Dead Code 제거 | 이 파일만 | ⭐ |
| **2** | Hooks를 CommandContext로 이동 | 2개 파일 | ⭐⭐ |
| **3** | CommandGateway 분리 | 2개 파일 | ⭐⭐ |
| **4** | raw dispatch 우회 경로 통합 | 8개 파일 | ⭐⭐⭐ |

Phase 1~3은 **기능 변경 없이 구조만 변경**하므로 안전합니다.
Phase 4는 모든 dispatch 경로를 건드리므로 통합 테스트 후 진행해야 합니다.
