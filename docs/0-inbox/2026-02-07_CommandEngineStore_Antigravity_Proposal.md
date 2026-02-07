# CommandEngineStore.ts 구조 고도화 제안 (Antigravity 제안)

**대상:** `src/os/features/command/store/CommandEngineStore.ts`
**핵심 목표:** 역할의 명확한 분리(Orchestration vs Storage), 타입 안정성 확보, 로깅 시스템의 플러그인화.

---

## 1. 현재 구조의 한계점 (Red-Flag)

1.  **결합성 (Tight Coupling):** Store가 `InspectorLog`라는 특정 UI 컴포넌트(debug tool)에 직접 의존하고 있습니다. 이는 순수한 비즈니스 로직이어야 할 커맨드 엔진이 디버깅 툴에 종속되어 있음을 의미합니다.
2.  **모호한 인터페이스:** `CommandEngineStore` (정적 객체)와 `useCommandEngineStore` (Zustand)가 하는 일이 겹칩니다. 사용자가 언제 무엇을 써야 할지 혼란을 줍니다.
3.  **타입 정보의 유실:** 제네릭 `<S = any>`의 남용으로 인해, 커맨드 실행 시 실제 데이터의 흐름을 추적하기가 매우 어렵습니다.
4.  **우회 경로 (Backdoor):** `getActiveDispatch()`를 노출함으로써, 로깅이나 전처리 로직을 무시하고 직접 액션을 쏠 수 있는 구멍이 열려 있습니다.

---

## 2. 개선된 아키텍처 제안

### ① CommandEngine (Gateway) 클래스 분리
Zustand Store는 데이터만 담고, 모든 동작(Dispatch, Registry lookup)은 **Stateless한 Gateway**가 처리하도록 합니다.

```typescript
// Proposed: CommandGateway.ts
export class CommandGateway {
  // 1. 모든 커맨드는 여기를 거친다 (Single Entry Point)
  static dispatch(cmd: BaseCommand) {
    const { activeAppId, appRegistries } = useCommandEngineStore.getState();
    const entry = activeAppId ? appRegistries.get(activeAppId) : null;

    if (!entry) {
      console.warn(`[CommandGateway] No active app to handle: ${cmd.type}`);
      return;
    }

    // 2. 로깅은 인터셉터 형태로 실행
    this.internalLog("app", cmd);
    entry.dispatch(cmd);
  }

  // 3. 로깅 로직을 한 곳으로 모음
  private static internalLog(source: 'app' | 'os', cmd: BaseCommand) {
     InspectorLog.log({
        type: "COMMAND",
        title: cmd.type,
        details: cmd,
        icon: source === 'os' ? "cpu" : "terminal",
        source
      });
  }
}
```

### ② Store 인터페이스 간소화 (Storage Only)
Store는 더 이상 "어떻게 실행할지" 고민하지 않습니다. 오직 "무엇이 등록되어 있는지"만 관리합니다.

```typescript
export interface CommandRegistryState {
  osRegistry: CommandRegistry<any, any> | null;
  appRegistries: Map<string, AppEntry<any>>;
  activeAppId: string | null;
}
```

### ③ Dead Code 및 Stale 주석 전면 제거
- `getActiveRegistry`, `getOSRegistry`, `setActiveApp` 등의 함수는 제거하고, 필요 시 `useCommandEngineStore.getState().xxx`로 직접 접근하도록 유도하여 코드량을 줄입니다.
- L198, L211 등의 오래된 주석은 현재 아키텍처를 반영하도록 갱신하거나 삭제합니다.

### ④ Hooks의 UI 계층 이관
`CommandEngineStore.ts` 하단의 Hook들을 `CommandContext.tsx`로 옮겨서, **파일 크기를 255줄에서 100줄 이내로** 줄입니다.

---

## 3. 기대 효과

1.  **신뢰성 (Reliability):** 모든 커맨드가 `CommandGateway`를 통하므로, 로그가 누락되거나 이벤트를 놓칠 리스크가 사라집니다. (오늘 발생한 스크롤 유실 문제의 원천 봉쇄)
2.  **가독성:** 파일 하나가 하나의 역할(상태 저장)만 수행하게 되어 코드가 명확해집니다.
3.  **테스트 용이성:** `CommandGateway`만 모킹(Mocking)하면 모든 앱의 커맨드 흐름을 테스트할 수 있습니다.

## 4. 실행 단계 제안

1.  **Step 1:** 사용하지 않는 5개 함수 및 주석 제거.
2.  **Step 2:** `dispatch` 및 `dispatchOS` 로직을 별도 Gateway 클래스/객체로 분리.
3.  **Step 3:** 나머지 Hook들을 `CommandContext.tsx`로 이동 및 통합.
4.  **Step 4:** `getActiveDispatch()` 사용처들을 `Gateway.dispatch()`로 전환.

---
**Antigravity의 한 줄 평:** "구조를 깨끗하게 비워야 기능이 더 탄탄하게 채워집니다."
