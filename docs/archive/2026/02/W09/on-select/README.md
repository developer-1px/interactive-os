# onSelect — Selection 변경 콜백

- **Start date**: 2026-02-21
- **Status**: Active

## Summary

OS Zone API에 `onSelect` 콜백을 추가한다. selection이 변경될 때 앱에게 알려주는 선언적 메커니즘.

## Motivation

현재 OS는 `onAction`(Enter/click), `onCheck`(Space), `onDelete`, `onCopy` 등의 콜백을 제공하지만,
**selection 변경 시 앱을 호출하는 콜백이 없다.**

이 때문에 앱은 selection 변경에 반응하려면:
1. `useSelection` OS hook을 직접 import하고
2. `useEffect`로 변경을 감지하고
3. `os.dispatch`로 앱 커맨드를 호출해야 한다

이는 Hollywood Principle을 위반한다 (앱이 OS를 직접 조정).

### 발견 경위

Todo Sidebar의 `/doubt` 감사에서 발견:
- `useSelection("sidebar")` + `useEffect` + `os.dispatch(selectCategory)` = **3개의 OS 직접 접근**
- 이걸 제거하면 키보드 navigation이 안 됨 (followFocus → selection 변경 → 앱 반응의 브릿지 부재)
- 되돌리면 Hollywood Principle 위반이 다시 살아남

### 근본 원인

`selectedCategoryId`(앱 상태)는 `os.focus.zones.sidebar.selection[0]`(OS 상태)의 복제본.
복제본을 동기화하는 브릿지가 `useEffect`인데, 이건 OS가 제공해야 할 메커니즘이지 앱이 구현할 것이 아니다.

## Guide-level explanation

```ts
// Before — Hollywood Principle 위반
const selectionIds = useSelection("sidebar");
useEffect(() => {
  os.dispatch(selectCategory({ id: selectionIds[0] }));
}, [selectionIds]);

// After — 선언적 바인딩
export const TodoSidebarUI = sidebarZone.bind({
  role: "listbox",
  onSelect: (cursor) => selectCategory({ id: cursor.focusId }),
  options: { select: { followFocus: true } },
});
```

## Reference-level explanation

### 변경 범위

1. `ZoneBindings` 타입에 `onSelect?: ZoneCallback` 추가
2. `createBoundComponents`에서 `onSelect`를 Zone props로 전달
3. Zone primitive에서 `onSelect`를 받아 selection 변경 시 dispatch
4. `OS_SELECT`(또는 followFocus 경로)에서 `onSelect` 콜백 호출 시점 결정

### 호출 시점

`onSelect`는 다음 경우에 호출된다:
- `OS_SELECT` 커맨드 실행 시 (click, Space로 선택)
- `OS_NAVIGATE` + `followFocus: true`에서 selection이 변경될 때
- **호출하지 않음**: 프로그래매틱 selection 변경 (undo 등)

## Drawbacks

- API surface 증가 (1개 콜백)
- `onAction`과의 차이를 명확히 문서화해야 함

## Unresolved questions

- `onSelect`의 cursor에 이전 selection 정보도 포함해야 하는가?
- multi-select 시 `onSelect`가 매 아이템마다 호출되는가, 한 번만 호출되는가?
