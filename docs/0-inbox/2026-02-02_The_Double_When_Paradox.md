# 아키텍처 비평: 'Double When'의 모순과 해결책

## 1. User 님의 핵심 지적
> *"지금 구조가 모순점인데? 키는 모여있어야 하고, `when`은 키 입력의 것인데... `when`이 커맨드에 붙어 있어야 한다니 지금 `when`을 이중으로 쓸 이유가 없는데 그러고 있잖아?"*

정확한 지적입니다. 현재 저희 아키텍처에는 **"역할(Role)의 혼재"**가 존재합니다.

## 2. 모순의 원인: Command가 'Menu Item' 역할까지 하고 있다

이상적인 아키텍처에서는 다음 3가지가 분리되어야 합니다.

1.  **Pure Command (Logic)**: 무색무취. 언제 어디서나 호출 가능.
    -   `run(state, payload)`
    -   `when`: 없음 (단, 데이터 무결성 체크용 Guard `if`는 존재)
2.  **Keybinding (Trigger 1)**: 키보드 입력 매핑.
    -   `key: 'Enter'`, `command: 'ADD'`, `when: 'ListFocused'`
3.  **Menu/Button (Trigger 2)**: UI 버튼 매핑.
    -   `label: 'Add'`, `command: 'ADD'`, `when: 'ListFocused'`

**문제점**:
현재 시스템에는 **"3번(Menu Registry)"**이 없습니다.
그래서 `CommandDefinition`이라는 객체가 **Logic(1번)**이자 동시에 **Menu Spec(3번)** 역할을 겸하고 있습니다.
그 결과, **"UI 노출 조건(`Command.when`)"**과 **"키 충돌 해결 조건(`Keybinding.when`)"**이 중복되거나 혼동되는 현상(Double When)이 발생한 것입니다.

## 3. `when`의 두 얼굴

User 님이 말씀하신 "키 입력의 것"이라는 `when`은 **Context Check(상황 판단)**입니다.
-   *"지금 사이드바에 있으니까 Enter는 Select야!"*

그런데 커맨드에 붙어있는 `when`은 사실 **Availability(가용성)**입니다.
-   *"나는 사이드바 전용 기능이라서, 딴 데서는 아예 불능(Disabled)이야."*

지금은 이 둘을 `when`이라는 하나의 필드로 퉁치고 있기 때문에, **"키 충돌 해결(Input)"**을 위해 커맨드 정의(`Logic`)를 수정해야 하는 불합리함이 생길 수 있습니다. (e.g. `Command.when`을 고치면 키바인딩 우선순위가 바뀜)

## 4. 해결책: 'Pure Command'로 가는 길

User 님의 비평을 수용하여 아키텍처를 정화(Purify)한다면, 다음과 같이 가야 합니다.

### Step 1. Command에서 `when` 제거 (Pure Logic)
```typescript
// todo_commands.ts
export const MoveUp = defineCommand({
    id: 'MOVE_UP', 
    run: ... // 순수 로직만 남김. when 제거. ActiveZone 체크 안 함.
});
```

### Step 2. Keybinding에 `when` 명시 (Centralized Input Rule)
```typescript
// todo_keys.ts
{ key: 'ArrowUp', command: 'MOVE_UP', when: 'activeZone == sidebar' }
```

### Step 3. Menu Registry 신설 (UI Rules)
```typescript
// todo_menus.ts (New!)
export const SidebarMenu = [
    { label: 'Move Up', command: 'MOVE_UP', when: 'activeZone == sidebar' } // 버튼 활성화 조건
]
```

## 5. 결론: "과도기적 중복"
현재의 `Command.when + Keybinding` 구조는 **Visual Component(버튼)**를 위한 메타데이터 저장소가 따로 없어서 생긴 **과도기적 타협(Compromise)**입니다.
User 님의 지적대로, 이것은 논리적으로 **중복(Redundancy)**이자 **관심사의 누수(Leaky Abstraction)**가 맞습니다.

만약 이 프로젝트가 더 커진다면, **"Menu Registry"를 도입하고 Command를 순수 로직으로 만드는 리팩토링**이 반드시 선행되어야 합니다. 지금은 "개발 속도"를 위해 그 단계를 생략하고 Command 객체에 짐을 지운 상태입니다.
