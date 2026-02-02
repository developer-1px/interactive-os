# 디자인 제안: Hierarchical (Nested) Keybinding System

## 1. User 님의 제안
> *"키를 중앙 관리하지만 Zone 단위로 Nested하게 관리하면 되잖아?"*

**정답입니다.** 그것이 가장 우아한 해결책입니다.
현재의 `KeybindingItem[]` (Flat Array) 방식은 "String Condition(`when`)"에 의존하기 때문에 구조가 잘 안 보입니다.
User 님이 제안하신 **"구조화된 중앙 관리 (Structured Centralization)"** 방식이 훨씬 직관적이고 안전합니다.

## 2. 제안된 구조: The Keymap Tree

```typescript
// todo_keys.ts (Refactored)

export const TODO_KEYMAP = {
    // 1. Global (최우선 or 최하위, 정책에 따라 결정)
    global: [
        { key: 'Meta+z', command: 'UNDO' },
        { key: 'Meta+Shift+Z', command: 'REDO' }
    ],

    // 2. Zone Scopes (서로 배타적)
    zones: {
        sidebar: [
            { key: 'Enter', command: 'SELECT_CATEGORY' }, // when 절 불필요! (Scope가 곧 조건)
            { key: 'ArrowRight', command: 'JUMP_TO_LIST' }
        ],
        todoList: [
            { key: 'ArrowUp', command: 'MOVE_FOCUS_UP' },
            { key: 'Enter', command: 'ADD_TODO', when: 'isDraftFocused' } // Zone 내부의 미세 조건
        ]
    }
}
```

## 3. 이 구조의 장점

### A. `when` 조건의 단순화 (Implicit Context)
기존에는 모든 줄마다 `when: 'activeZone == "sidebar"'`를 반복해서 적어야 했습니다. (Boilerplate)
Nested 구조에서는 **`zones.sidebar` 배열에 들어있는 것만으로도** `activeZone == "sidebar"` 조건이 자동으로 함의(Imply)됩니다.

### B. 시각적 격리 (Visual Isolation) & 충돌 방지
개발자가 코드를 볼 때, `sidebar` 블록과 `todoList` 블록이 명확히 나뉘어 있으므로 헷갈릴 일이 없습니다.
Global 키가 Zone 키와 충돌하는지도, `global` 블록과 비교만 하면 되므로 훨씬 찾기 쉽습니다.

### C. 타입 추론 (Type Safety)
`zones` 객체의 키(`sidebar`, `todoList`)를 실제 `ZoneId` 타입과 일치시키면, 누락된 Zone이나 오타를 컴파일 타임에 잡을 수 있습니다.

## 4. 구현 로드맵 (Phase 4)

User 님의 통찰 덕분에, **"Flat List"의 원시성**을 버리고 **"Structured Tree"**로 나아갈 방향이 잡혔습니다.

1.  **Define Schema**: `KeymapTree` 타입 정의.
2.  **Migrate**: 기존 Flat List를 `global` / `zones` 구조로 재배치.
3.  **Update Engine**: `CommandRegistry.getKeybindings()`가 트리를 순회하며 `when` 조건을 자동으로 합성(Compose)하도록 수정.
    - `sidebar` 블록의 아이템 -> `cmd.when = (existing_when) && (activeZone == 'sidebar')`

## 5. 결론
User 님의 제안은 **"중앙 집중의 장점(한눈에 보기)"**과 **"Zone 분리의 장점(코드 격리)"**을 모두 취하는 **Best Practice**입니다.
이 구조로 리팩토링을 진행하는 것을 강력히 추천합니다.
