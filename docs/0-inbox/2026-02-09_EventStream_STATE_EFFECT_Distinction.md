# OS Focus State Schema — 통합 상태 모델 제안

## 1. 개요

OS Focus 시스템의 **전체 상태를 하나의 통합 스키마**로 정의한다.
이 스키마는 로깅과 무관하게 OS의 일급 데이터 모델이다.

로그는 지금처럼 INPUT / COMMAND / STATE / EFFECT를 그대로 찍는다.
**분석기(Analyzer)**가 로그를 읽고 이 스키마의 스냅샷을 재구성한다.

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  OS Core │────▶│ Event Log│────▶│   Analyzer   │
│ (runOS)  │     │ (기록)    │     │ (스냅샷 재구성)│
└──────────┘     └──────────┘     └──────────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ OSFocusState  │
                                  │  (스냅샷)      │
                                  └──────────────┘
```

---

## 2. 현재 문제

### 상태가 흩어져 있다

| 데이터 | 위치 | 접근 방식 |
|--------|------|----------|
| focusedItemId, selection | `FocusGroupStore` (zone별 Zustand) | `store.getState()` |
| activeZoneId | `focusData.ts` 모듈 변수 | `FocusData.getActiveZoneId()` |
| focusStack | `focusData.ts` 모듈 배열 | `FocusData.peekFocusStack()` |
| DOM effects | `OSResult.domEffects` (임시 배열) | 실행 후 사라짐 |
| inputSource | `osCommand.ts` 모듈 변수 | `getLastInputSource()` |

→ **스냅샷을 찍으려면 5곳을 조합**해야 한다. 통합 타입이 없다.

### Effect가 데이터로 존재하지 않는다

현재 effect는 `OSResult.domEffects`에 잠깐 존재했다가 `executeDOMEffect()`에서
소비되면 사라진다. 기록이 남지 않는다 (방금 추가한 EFFECT 로그 제외).

→ Effect도 **state의 일부**로 선언되어야 한다.

---

## 3. 제안: OSFocusState Schema

### 3.1 타입 정의

```ts
/**
 * OS Focus System — 통합 상태 스키마
 *
 * 시스템의 전체 상태를 하나의 스냅샷으로 표현한다.
 * state(데이터)와 effects(부작용)는 같은 구조체의 다른 필드다.
 */
interface OSFocusState {
  // ── State: 순수 데이터 ──

  /** 현재 활성 Zone ID */
  activeZoneId: string | null;

  /** Zone별 상태 (현재 활성 Zone의 상태만 포함하거나, 전체 포함) */
  zone: {
    id: string;
    focusedItemId: string | null;
    selection: string[];
    selectionAnchor: string | null;
    expandedItems: string[];
    stickyX: number | null;
    stickyY: number | null;
    recoveryTargetId: string | null;
  };

  /** Focus Stack 깊이 */
  focusStackDepth: number;

  /** 마지막 입력 소스 */
  inputSource: "mouse" | "keyboard" | "programmatic";

  // ── Effects: 부작용도 데이터 ──

  /** 이 커맨드가 생성한 DOM effects */
  effects: EffectRecord[];
}

interface EffectRecord {
  /** DOM 조작 종류 */
  action: "focus" | "scrollIntoView" | "blur" | "click";

  /** 대상 element ID */
  targetId: string | null;

  /** 실행 여부 (마우스 클릭 시 scroll 스킵 등) */
  executed: boolean;

  /** 스킵된 이유 */
  reason?: string;
}
```

### 3.2 State와 Effect의 구분 기준

같은 구조체 안이지만 **필드 위치로 구분**된다:

```
OSFocusState
├── activeZoneId      ← State (데이터, 읽기 가능)
├── zone
│   ├── focusedItemId ← State
│   ├── selection     ← State
│   └── ...           ← State
├── inputSource       ← State (컨텍스트)
│
└── effects[]         ← Effect (부작용 기록)
    ├── {action: "focus",          targetId: "item-3", executed: true}
    └── {action: "scrollIntoView", targetId: "item-3", executed: false, reason: "mouse_input"}
```

**구분 원칙**:
- `effects[]` 바깥 = **State** — "지금 시스템이 어떤 상태인가"
- `effects[]` 안 = **Effect** — "이 커맨드가 DOM에 무엇을 했는가"

둘 다 데이터다. 차이는 **지속성**:
- State는 다음 커맨드까지 유지된다.
- Effect는 커맨드 단위로 생성/소비된다 (매번 새로 생긴다).

---

## 4. Analyzer 역할

### 로그 → 스냅샷 재구성

로그는 지금처럼 이벤트 단위로 찍는다:
```
[INPUT]   keydown ArrowDown
[COMMAND] NAVIGATE {direction: "down"}
[STATE]   Focus → item-3
[STATE]   Selection (1)
[EFFECT]  FOCUS item-3
[EFFECT]  SCROLL_INTO_VIEW item-3
```

Analyzer는 이 로그를 순차적으로 읽으며 `OSFocusState` 스냅샷을 구성한다:

```ts
function buildSnapshot(logs: LogEntry[]): OSFocusState {
  let state: OSFocusState = INITIAL_STATE;

  for (const log of logs) {
    switch (log.type) {
      case "STATE":
        // details에서 field/value 추출하여 state에 적용
        state = applyStateChange(state, log);
        break;
      case "EFFECT":
        // effects 배열에 추가
        state = {
          ...state,
          effects: [...state.effects, parseEffectRecord(log)],
        };
        break;
      case "COMMAND":
        // 새 커맨드 시작 → effects 초기화
        state = { ...state, effects: [] };
        break;
    }
  }
  return state;
}
```

### 활용 시나리오

1. **Inspector UI**: 로그 항목을 선택하면 그 시점의 OSFocusState 스냅샷 표시
2. **Time Travel 디버깅**: 슬라이더로 시점을 이동하며 state/effect 확인
3. **TestBot 검증**: 테스트 단계별로 스냅샷 비교 (`expect(snapshot.zone.focusedItemId).toBe("item-3")`)
4. **AI 분석**: LLM에게 스냅샷 시퀀스를 주면 포커스 흐름 분석 가능

---

## 5. 현재 코드와의 관계

이 스키마는 기존 코드를 **대체하지 않는다**. 기존 데이터를 **읽어서 조합**하는 뷰다.

| OSFocusState 필드 | 현재 데이터 소스 | 변경 필요 |
|---|---|---|
| `activeZoneId` | `FocusData.getActiveZoneId()` | 없음 |
| `zone.*` | `FocusGroupStore.getState()` | 없음 |
| `focusStackDepth` | `FocusData.getFocusStackDepth()` | 없음 |
| `inputSource` | `getLastInputSource()` | 없음 |
| `effects[]` | 현재 로그에서만 존재 | **EFFECT 로그에 executed/reason 추가 필요** |

### 필요 작업

1. **EffectRecord 보강**: `executeDOMEffect`에서 `executed` 및 `reason` 정보를 EFFECT 로그에 추가
2. **Analyzer 구현**: 로그를 읽고 `OSFocusState` 스냅샷을 구성하는 순수 함수
3. **실시간 스냅샷 API** (선택): `buildCurrentSnapshot()` — 로그 없이 현재 상태를 직접 읽어 스냅샷 구성

---

## 6. 요약

| 개념 | 역할 |
|------|------|
| **OSFocusState** | OS 포커스 시스템의 통합 스키마. 일급 데이터 모델. |
| **Event Log** | INPUT/COMMAND/STATE/EFFECT 이벤트를 시간순으로 기록. 변경 없음. |
| **Analyzer** | 로그를 읽고 OSFocusState 스냅샷을 재구성하는 계층. |

**핵심**: Effect는 state와 분리된 "다른 종류"가 아니라, **같은 스냅샷 안의 다른 필드**다.
둘 다 데이터다. 차이는 지속성(persistent vs transient)뿐이다.
