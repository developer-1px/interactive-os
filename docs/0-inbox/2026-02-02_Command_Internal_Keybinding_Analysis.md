# 아키텍처 토론: 왜 키바인딩을 커맨드 내부에 정의하지 않는가?

## 1. User 님의 제안 (Embedded Keybinding)
> *"키바인딩 설정을 커맨드로 내리는 건 왜 안 되는 거야? when과 키가 함께 보여지는 곳인데?"*

즉, 아래와 같은 형태를 제안하셨습니다.

```typescript
// todo_commands.ts 내부
export const AddTodo = defineCommand({
    id: 'ADD_TODO',
    run: (state) => { ... },
    // 제안: 여기서 키까지 정의하면 편하지 않나?
    keybinding: { key: 'Enter', when: 'List' } 
});
```
확실히 이렇게 하면 **파일 하나만 보면 모든 정보가 다 있는 장점(Colocation)**이 극대화됩니다.

## 2. 그렇게 하지 않은 이유: "역방향 조회(Reverse Lookup)의 고통"

하지만 시스템이 커지면 치명적인 단점이 드러납니다. 바로 **"누가 `Enter` 키를 쓰고 있지?"** 를 파악하기 힘들다는 점입니다.

### 상황: `Enter` 키가 작동을 이상하게 함
`Enter`를 쳤는데 기대했던 `AddTodo`가 아니라 엉뚱한 게 실행되거나 아무 일도 안 일어납니다.

-   **내장형(Embedded) 방식**:
    -   개발자는 `todo_commands.ts`, `sidebar_commands.ts`, `settings_commands.ts` 등 **모든 커맨드 파일**을 다 열어서 `key: 'Enter'`를 검색해야 합니다.
    -   "아, 저기 구석에 있는 `HiddenCommand`가 `Enter`를 가로채고 있었네!"

-   **중앙집중형(Centralized) 방식 (`todo_keys.ts`)**:
    -   `todo_keys.ts` 파일 하나만 엽니다.
    -   `Enter`로 검색합니다.
    -   아래 목록이 한눈에 보입니다.
        ```typescript
        { key: 'Enter', command: 'ADD_TODO', when: 'List' },
        { key: 'Enter', command: 'SELECT', when: 'Sidebar' },
        { key: 'Enter', command: 'CONFIRM', when: 'Modal' } // 범인 검거!
        ```

## 3. 키보드는 "공유기(Router)"다
키보드 단축키는 앱 전체가 공유하는 **한정된 전역 자원(Global Shared Resource)**입니다.

-   `Command`는 개별 부품(Component)입니다.
-   `Keyboard`는 이 부품들을 연결하는 배선(Configuration)입니다.

집을 지을 때, "안방 전등"과 "거실 전등"은 서로 다른 방에 있지만, **"두꺼비집(Circuit Breaker)"**은 현관에 하나로 모여 있습니다.
만약 안방 전등 스위치 배선도가 안방 천장에, 거실 배선도가 거실 천장에 숨어있다면, **"전기 누전(키 충돌)"**이 발생했을 때 벽을 다 뜯어야 합니다.
그래서 배선 정보(`todo_keys.ts`)는 두꺼비집처럼 한곳에 모아두는 것이 유지보수에 유리합니다.

## 4. 결론: 규모에 따른 선택

-   **소규모 앱 / 프로토타입**: User 님 말씀대로 커맨드 안에 `key: 'Enter'` 넣는 게 훨씬 빠르고 편합니다. (Context Switching 없음)
-   **복잡한 도구 (IDE, Photoshop, Antigravity)**: 단축키가 수백 개가 넘어가면, **"키 충돌 관리"**가 개발의 주된 고통이 됩니다. 그래서 저희는 처음부터 **"두꺼비집(Central Registry)"** 모델을 채택했습니다.

하지만 User 님의 통찰대로, **"파일을 왔다 갔다 하는 귀찮음"**은 분명 존재합니다. 그래서 최신 IDE들은 함수 위에 `// Keybinding: Enter (Global)` 같은 주석(Lens)을 달아주는 기능으로 이를 보완하기도 합니다.
