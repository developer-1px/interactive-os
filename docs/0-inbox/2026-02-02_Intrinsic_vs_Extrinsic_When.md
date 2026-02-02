# Architecture Debate: `Command.when` vs `Keybinding.when`

## 1. User's Insight
User 님의 질문:
> *"그렇다면 Command에 `when`이 있으면 안 되는 거잖아? 키 바인딩에 있어야 하는 거 아냐?"*

이 질문은 **UI Metadata의 소유권**을 어디에 둘 것인가에 대한 정곡을 찌르는 질문입니다.
결론부터 말씀드리면, **User 님의 말씀대로 `when`은 순수한 UI Metadata가 맞습니다.**
하지만 이를 **Command 정의에 남겨둔 이유**는 **재사용성(Reusability)** 때문입니다.

## 2. `when`이 두 곳에 존재하는 이유

### A. Command.when (Intrinsic Availability)
커맨드는 키보드뿐만 아니라 **마우스, 메뉴, 커맨드 팔레트**에서도 쓰입니다.
만약 `Command.when`을 없애고 `Keybinding`에만 조건을 걸면 다음과 같은 문제가 발생합니다.

1.  **버튼 비활성화 불가**: 화면 상단의 "위로 이동(⬆️)" 버튼을 그릴 때, 이 버튼을 언제 `Disabled` 처리해야 할지 알 수 없습니다.
2.  **커맨드 팔레트 오염**: `Cmd+K`를 눌러 커맨드 검색창을 띄웠을 때, 현재 상황(Sidebar)과 관련 없는(TodoEdit) 커맨드까지 모두 검색됩니다.

따라서 커맨드는 **"나는 언제 UI에 노출되어야 하는가?"**에 대한 **기본값(Default Rule)**을 스스로 가지고 있어야 합니다. 이것이 `Command.when`입니다.

> **예시**: `MoveCategoryUp`
> - **Command.when**: `activeZone == 'sidebar'` (사이드바가 활성화되었을 때만 버튼 활성화/메뉴 노출)

### B. Keybinding.when (Extrinsic Resolution)
키바인딩은 이 기본값 위에 **입력 장치 특유의 제약**을 더하거나, **키 충돌을 해결**하는 역할을 합니다.

1.  **키 충돌 해결**: `Enter` 키는 리스트에선 `AddTodo`, 사이드바에선 `SelectCategory`입니다. 이 분기 처리는 키맵에서 해야 합니다.
2.  **입력 보호**: `A` 키가 단축키라 하더라도, 글자를 타이핑 중일 땐(Input Focus) 동작하면 안 됩니다. 이는 커맨드의 로직이 아니라 **키보드의 사정**입니다.

> **예시**: `SelectCategory` (Enter)
> - **Inherits**: `activeZone == 'sidebar'` (커맨드 조건 상속)
> - **Overrides**: `!isEditing` (키맵에서 추가 제약 - 사실 Enter는 에디팅에선 줄바꿈/완료니까)

## 3. 이상적인 아키텍처: Separation of Concerns
User 님의 지적대로, 가장 이상적인 형태는 커맨드 정의를 **Pure Logic**으로 만들고, Metadata를 별도 레이어로 떼어내는 것입니다.

```typescript
// 1. Pure Logic
const MoveUpLogic = (state) => { ... }

// 2. UI Registry (Menu/Button/Palette)
MenuRegistry.register({
    id: 'MoveUp',
    logic: MoveUpLogic,
    when: 'activeZone == sidebar' // UI 노출 조건
})

// 3. Key Registry (Keyboard)
KeyRegistry.register({
    key: 'ArrowUp',
    command: 'MoveUp',
    when: 'activeZone == sidebar && !isEditing' // 키 입력 조건
})
```

하지만 현재 저희 구조는 편의상 **1번(Logic)과 2번(UI Metadata)을 `CommandDefinition`이라는 하나의 객체에 묶어둔 형태**입니다. 이것을 "Pragmatic Coupling(실용적 결합)"이라고 부르며, VS Code 등 많은 에디터가 채택하는 방식입니다.

## 4. 결론
`Command.when`은 **"키보드 없이도 이 버튼이 활성화되어야 하는가?"**를 판단하기 위한 **UI 기본 메타데이터**입니다.
키바인딩의 `when`은 그것을 **Override**하거나 **구체적인 입력 상황**에 맞추는 역할입니다.

User 님의 통찰 덕분에 **"Command는 Logic과 Meta의 결합체"**라는 현재 구조의 특성을 명확히 알 수 있었습니다.
