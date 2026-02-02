# App vs OS Separation Analysis

## 1. 질문 (The Question)
> "지금 코드에서 App과 OS간의 책임 분리가 필요한 영역을 찾아봐. 커맨드에는 UI가 없어야 하는데 말이지."

## 2. 발견된 위반 사례 (Violations Found)

### A. Keybinding Coupling (키바인딩의 결합)
- **Code**: `todo_commands.ts`의 `kb: ['Meta+z']` 등.
- **Problem**: 키바인딩은 **OS(Input/Platform)의 영역**입니다.
    - App(Command)은 "무엇(Logic)을 할지"만 정의해야 합니다.
    - "무슨 키를 눌렀을 때 실행할지"는 설정(User Config)이나 플랫폼(Web vs Mobile)에 따라 달라질 수 있어야 합니다.
    - 지금은 커맨드 정의 안에 단축키가 하드코딩되어 있어, 키 설정을 변경하거나 플랫폼별로 다르게 가져가기 어렵습니다.

### B. View-Specific Guard Clauses (뷰 종속적 가드)
- **Code**: `JumpToSidebar`의 `when: '!isFieldFocused || cursorAtStart'` (Line 282).
- **Problem**: `cursorAtStart`는 지극히 **DOM/View 상태**입니다.
    - Headless 환경에서는 커서 개념이 없거나 다를 수 있습니다.
    - 이 조건은 커맨드 실행 조건(Logic)이라기보다는, **"이벤트 디스패치 조건(Event Dispatch Condition)"**에 가깝습니다.
    - 즉, OS 계층(이벤트 핸들러)에서 "커서가 앞일 때만 이 커맨드를 발동시켜"라고 판단해야지, 커맨드 자체가 "난 커서가 앞일 때만 실행돼"라고 아는 것은 부자연스럽습니다.

## 3. 제안 (Proposal)

### Step 1: Keybinding Externalization (키바인딩 분리)
`todo_commands.ts`에서 `kb` 필드를 제거하고, 별도의 `keymap.ts` (OS Layer)로 옮깁니다.

```typescript
// src/os/keymap.ts
export const DEFAULT_KEYMAP = {
    'Meta+z': 'UNDO',
    'ArrowUp': 'MOVE_FOCUS_UP',
    // ...
};
```

### Step 2: Context-Only Guards (컨텍스트 기반 가드)
`cursorAtStart` 같은 DOM 종속적 조건 대신, 컨텍스트에 필요한 정보를 명시합니다.
(혹은, UI 이벤트 핸들러 단계에서 필터링 후 커맨드 호출)

## 4. 요약
현재 가장 큰 문제는 **"입력 트리거(Key)"와 "실행 로직(Command)"이 한 객체에 정의되어 있다는 점**입니다. 이 둘을 찢어내는 것이 책임 분리의 첫걸음입니다.
