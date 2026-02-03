# 투두 앱 내 OS 책임 중복 및 수동 구현 로직 분석 보고서

## 1. 개요 (Overview)
`src/apps/todo` 코드를 정밀 분석한 결과, OS 레벨에서 처리해 주어야 할 기능들을 앱 내부에서 수동으로 구현하거나 중복 정의하고 있는 사례들이 추가로 발견되었습니다. 이는 앱의 코드를 비대하게 만들고, OS와의 일관성을 해치는 요인이 됩니다.

## 2. 분석 상세 (Analysis Details)

### A. 영속성 관리의 재발명 (Manual Persistence)
- **위치**: `src/apps/todo/features/todo_details/persistence.ts`
- **현상**: `localStorage.getItem` / `setItem`을 직접 호출하며, 키 관리(`STORAGE_KEY`)와 JSON 파싱, 에러 처리를 앱이 직접 수행합니다.
- **문제점**: OS는 각 앱의 상태를 저장하고 복구하는 표준 메커니즘(예: `usePersistentState` 또는 FileSystem API)을 제공해야 합니다. 앱이 스토리지 구현 세부 사항(LocalStorage 등)을 직접 아는 것은 추상화 위반입니다.
- **개선안**: `@os/core/persistence` 와 같은 모듈을 통해 `createPersistentStore` 기능을 제공해야 합니다.

### B. 시간 여행(Undo/Redo) 로직의 수동 구현
- **위치**: `src/apps/todo/features/todo_details/navigationMiddleware.ts`
- **현상**: 미들웨어 내부에서 `past`, `future` 배열을 직접 조작(shift, push)하며 Undo/Redo를 구현하고 있습니다 (`Universal Undo Logic`).
- **문제점**: 상태의 이력 관리(Time Travel)는 어플리케이션의 일반적인 요구사항입니다. 현재 `createCommandStore`가 이를 지원하지 않아 앱이 이를 직접 구현해야 하는 상황입니다. 이는 모든 앱에서 동일한 Undo 로직을 복사/붙여넣기 하게 만듭니다.
- **개선안**: `createCommandStore`를 확장하여 `enableUndo: true` 옵션만으로 동작하는 `createTemporalStore` 패턴을 OS에 도입해야 합니다.

### C. OS 전역 단축키의 중복 정의 (Global Key Leakage)
- **위치**: `src/apps/todo/features/todoKeys.ts`
- **현상**:
    ```typescript
    { key: "Meta+z", command: OS_COMMANDS.UNDO, ... },
    { key: "Meta+i", command: OS_COMMANDS.TOGGLE_INSPECTOR, ... }
    ```
- **문제점**: `UNDO`, `REDO`, `TOGGLE_INSPECTOR`는 OS 차원의 전역 명령입니다. 개별 앱이 키맵에 이를 포함시키는 것은 책임 범위 위반이며, 만약 OS가 단축키를 변경하면 앱과 불일치가 발생합니다.
- **개선안**: 앱별 키맵에서는 앱 전용 명령만 정의하고, 전역 명령은 OS의 Root KeyHandler가 우선 처리하도록 해야 합니다.

### D. 표준 내비게이션 키의 불필요한 바인딩
- **위치**: `src/apps/todo/features/todoKeys.ts`
- **현상**:
    ```typescript
    { key: "ArrowUp", command: OS_COMMANDS.NAVIGATE, ... }
    ```
- **문제점**: 화살표 키를 사용한 기본 공간 내비게이션은 포커스 엔진의 자연스러운 동작이어야 합니다. 앱이 이를 명시적으로 바인딩해야 동작한다면, 모든 앱이 동일한 보일러플레이트(Boilerplate) 코드를 가져야 합니다.
- **개선안**: 포커스 시스템이 기본적으로 화살표 키 입력을 `NAVIGATE` 명령으로 해석하고, 앱은 특수한 동작이 필요할 때만 이를 오버라이드(Override) 하도록 변경해야 합니다.

## 3. 결론 및 제안
현재 투두 앱은 'OS가 아직 제공하지 않는 기능(Persistence, Undo)'을 메우기 위해 불필요하게 무거워져 있으며, 'OS가 이미 제공하는 기능(Global Keys)'을 중복 정의하고 있습니다.

**조치 제안:**
1.  **단기**: `todoKeys.ts`에서 전역 키(`Meta+z` 등) 및 표준 내비게이션 키 정리를 수행합니다.
2.  **중기**: OS 코어 팀(엔지니어링)에 `Persistence` 및 `Temporal Store(Undo/Redo)` 모듈 구현 요청을 전달하고, 구현 후 투두 앱에서 해당 수동 로직을 제거합니다.
