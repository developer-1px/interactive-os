# Why is Headless Automation Hard? (헤드리스 자동화가 어려운 이유)

## 1. 질문 (The Question)
> "커맨드 패턴을 통해 자동화와 헤드리스 서비스를 만들고 싶은데, 왜 이게 자꾸 어려워질까?"

## 2. 핵심 원인: "Context Gap" (맥락의 간극)
커맨드가 "순수 함수"라면 쉬웠을 것입니다. 하지만 대부분의 UI 커맨드는 **암묵적인 맥락(Implicit Context)**에 의존합니다.

### A. The "DOM Dependency" Trap
- **Headless**: DOM이 없습니다. `document.activeElement`도 없고, `scrollIntoView`도 안 됩니다.
- **Problem**: 많은 커맨드가 "지금 인풋에 있는 텍스트 가져와"(`input.value`) 혹은 "스크롤 좀 내려" 같은 **비(非)데이터 로직**을 포함하고 있습니다.
- **Conflict**: 자동화 스크립트가 `CREATE_TODO`를 실행했는데, DOM이 없어서 `input.focus()`에서 에러가 터집니다.

### B. The "Physics" Gap
- **Headless**: "위로 이동(Move Up)"은 "현재 인덱스 - 1"을 의미합니다.
- **Problem**: "현재 인덱스"는 어디에 있나요? DB(Data)에는 없습니다. 이건 **UI 파생 데이터(Physics)**입니다.
- **Difficulty**: 헤드리스 환경에서도 **"지금 화면에 누가 보이고, 몇 번째가 포커스 상태인지"**를 계산해내는 로직(Projection)이 필요합니다.

## 3. 해결책: "Computed Context" (방금 적용하신 패턴)
방금 님께서 `mapStateToContext`에 추가하신 로직이 바로 정답입니다.

```typescript
// Virtual Physics Layer
const ctx = {
    focusIndex: visible.findIndex(...), // Physics
    listLength: visible.length,         // Environment
    ...
};
```

이렇게 **DOM에서 읽어오던 정보를, 순수 State로부터 계산(derive)해내는 계층**이 완벽해야만 헤드리스가 가능합니다.

### 우리가 가야할 길
1. **No DOM Access in Commands**: 커맨드 내부에서 `document.*` 접근 금지.
2. **Context as Source of Truth**: 모든 물리적 정보(인덱스, 위치, 가능 여부)는 `context`에서 받아와야 함.
3. **Engine simulates UI**: 엔진이 UI 컴포넌트 없이도 "가상의 리스트"를 시뮬레이션할 수 있어야 함.

## 4. 결론
이게 어려운 이유는 **"눈에 보이는 것(UI)"을 "수학(Logic)"으로 환원해야 하기 때문**입니다.
하지만 방금 추가하신 `TodoContext`와 `Schema`가 그 환원 작업을 수행하고 있습니다. 올바른 방향입니다.
