# OS vs App Command State: 분리 vs 통합

## 1. 개요

OS 커맨드와 App 커맨드가 **동일한 State 구조**를 공유해야 하는지, 
아니면 **분리된 State**를 가져야 하는지에 대한 논쟁.

---

## 2. 🔴 Red Team: 분리해야 한다

### 주장
OS State와 App State는 본질적으로 다른 관심사를 다루므로 분리되어야 한다.

### 근거

**1. 수명주기가 다름**
- **OS State**: 페이지 전체 수명 (navigation과 함께 사라짐)
- **App State**: 앱별 persistence, undo/redo, hydration 등 고유 라이프사이클

**2. 구조가 다름**
```typescript
// OS State - 단순하고 휘발성
interface OSState {
    activeZoneId: string | null;
    // Zone별 상태는 WeakMap에 분산
}

// App State - 복잡하고 정규화됨
interface AppState {
    data: NormalizedData;
    ui: UIState;
    history: UndoStack;
    effects: Effect[];
}
```

**3. 관심사 분리**
- OS: 포커스, 네비게이션, 키보드 (플랫폼)
- App: 비즈니스 로직, 데이터 변환 (도메인)
- 섞으면 결합도 증가

**4. 테스트 복잡도**
- 분리하면 OS와 App을 독립적으로 테스트 가능
- 통합하면 모든 테스트에 양쪽 컨텍스트 필요

**5. 다중 앱 지원**
- OS는 하나, App은 여러 개 가능
- 통합 시 앱 전환 로직 복잡해짐

---

## 3. 🔵 Blue Team: 통합해야 한다

### 주장
OS와 App을 동일한 커맨드 패턴으로 통합하면 아키텍처가 단순해진다.

### 근거

**1. 동일한 패턴 = 학습 비용 감소**
```typescript
// 둘 다 동일한 구조
interface Command<S> {
    run: (state: S, payload: any) => S;
}

// OS도 App도 같은 방식
dispatch({ type: 'OS_NAVIGATE', payload });
dispatch({ type: 'ADD_TODO', payload });
```

**2. 단일 이벤트 루프**
- 모든 상태 변경이 하나의 파이프라인을 통과
- 디버깅, 로깅, 미들웨어 재사용

**3. 크로스 레이어 커맨드**
- "할 일 추가 후 해당 아이템으로 포커스"
- 통합 State면 한 커맨드로 처리 가능
```typescript
ADD_TODO.run = (state, payload) => ({
    ...state,
    data: { ...addTodo(state.data, payload) },
    focus: { activeItemId: newTodoId }  // 동시에 포커스
});
```

**4. Undo/Redo 일관성**
- OS 동작도 Undo 가능 (포커스 되돌리기)
- 통합 State면 자연스럽게 히스토리에 포함

**5. SSR/Hydration 단순화**
- 전체 State를 직렬화하면 OS 상태도 복원 가능

---

## 4. 🟡 절충안: Layered State

```typescript
interface UnifiedState {
    // OS Layer (휘발성)
    os: {
        focus: FocusState;
        keyboard: KeyboardState;
    };
    
    // App Layer (영속성)
    app: {
        data: NormalizedData;
        ui: UIState;
    };
    
    // Shared (cross-cutting)
    effects: Effect[];
    history: UndoStack;
}
```

**장점:**
- 물리적으로는 하나의 Store
- 논리적으로는 분리된 계층
- 필요 시 OS만 또는 App만 구독 가능

---

## 5. 결론 / 제안

| 기준 | 분리 (Red) | 통합 (Blue) | 절충 (Yellow) |
|------|-----------|-------------|---------------|
| 복잡도 | 높음 (2개 시스템) | 높음 (거대 State) | 중간 |
| 결합도 | 낮음 | 높음 | 중간 |
| 재사용성 | OS 재사용 가능 | 패턴 재사용 | 둘 다 |
| 테스트 | 독립 | 통합 | 선택적 |
| 현실성 | 현재 구현 | 대규모 리팩토링 | 점진적 가능 |

### 권장

**현재 단계에서는 분리 유지 + 패턴만 통일:**
- State는 분리 (OS: FocusData, App: Zustand)
- Command 패턴은 동일 (`run(state, payload) => change`)
- Effect 처리도 동일 (`runPipeline`, `runEffects`)

```typescript
// 동일한 인터페이스, 다른 State
type OSCommand = (ctx: OSContext, payload) => StateChange;
type AppCommand = (state: AppState, payload) => AppState;

// 동일한 Effect 처리
runPipeline(osChange);        // OS effects
applyEffects(appState);       // App effects
```

---

## 6. 다음 단계

1. **FocusIntent 리팩토링**: 커맨드를 순수함수로 전환
2. **OSContext 표준화**: buildContext()로 Read 분리
3. **통합 고려는 나중에**: 현재는 패턴 정렬에 집중
