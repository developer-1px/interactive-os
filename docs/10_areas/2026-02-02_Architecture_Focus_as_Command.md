# Debate: Should `SET_FOCUS` be a Command?

## 1. 질문 (The Question)
> "보통 `SET_FOCUS` 같은 건 커맨드이면 안 되는 거 아닐까?"

## 2. Red Team: "Focus is not Data" (반대)
- **논리**: 포커스는 데이터가 아니라 비휘발성 UI 상태(Ephemeral UI State)에 불과하다.
- **히스토리 오염**: 포커스 이동 하나하나가 Undo/Redo 스택에 쌓이면, 사용자가 정말 원하는 "데이터 되돌리기"를 하기 위해 `Ctrl+Z`를 100번 눌러야 한다.
- **결론**: 포커스는 React State나 `useRef`로 관리해야 하며, Command System(Domain Logic)에 들어오면 안 된다.

## 3. Blue Team: "Navigation is Intent" (찬성)
- **논리**: 프로 툴(VS Code, Vim)에서 "커서 이동"은 단순한 UI 상태 변화가 아니라 명확한 **사용자의 의도(Intent)**다.
- **매크로/스크립팅**: 사용자가 "이 파일 열고, 10번째 줄로 가서, 이걸 지워"라는 매크로를 짜려면 "이동"도 커맨드여야 한다.
- **접근성(a11y)**: 마우스 없이 키보드로 모든 것을 제어하려면 내비게이션도 First-Class Citizen이어야 한다.

## 4. 합성(Synthesis): "The Separation of Concerns"

우리는 두 입장의 균형을 맞춰야 합니다.

### 구분 기준: "Why did focus move?"

1.  **User Navigation (사용자 의도)** -> **Command** O
    -   화살표 키, 탭 클릭, 점프 투 데피니션.
    -   이건 기록될 가치가 있거나, 최소한 키바인딩 시스템을 타야 함.
    -   단, Undo 스택에는 "선택적"으로 들어가야 함. (별도의 Navigation Stack)

2.  **System Correction (시스템 보정)** -> **Command** X
    -   아이템 삭제 후 다음 아이템 선택.
    -   뷰 렌더링 후 초기 포커스.
    -   이건 **Internal Action** 혹은 **Side Effect**여야 함.
    -   우리가 방금 적용한 **Reactive Focus**가 이것임.

## 5. 결론 (Conclusion)
`SET_FOCUS`라는 **Raw Primitive**가 커맨드로 노출되어 아무나 호출할 수 있는 것은 위험합니다.
하지만 `MOVE_FOCUS_UP` 같은 **Navigation Action**은 커맨드여야 합니다.

**현재 시스템의 정답**:
- `SET_FOCUS`는 가능한 'Internal'로 숨기고, 사용자는 `SELECT_ITEM`이나 `Navigate` 같은 의미 있는 커맨드를 써야 한다.
- Undo History에는 기본적으로 남기지 않는다. (log: false 혹은 history: false 옵션 사용)
