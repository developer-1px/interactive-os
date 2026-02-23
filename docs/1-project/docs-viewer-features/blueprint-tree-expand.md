# Blueprint: Mouse Event Pipeline 정합성 확보

> 작성일: 2026-02-24 02:20
> 배경: FIRED 보고서(fired-2026-02-24-0137.md) + 이번 세션 작업 종합

## 1. Goal

**Mouse Event Pipeline의 설계 의도를 코드와 문서에 명확히 반영하여,
다음 에이전트가 동일한 실수를 반복하지 않도록 한다.**

UDEs (이번 세션 해결):
- `Item.ExpandTrigger` 클릭 시 double-toggle (expand→collapse = 무변화)
- 재귀 컴포넌트 + `Item.ExpandContent`로 트리를 DOM에 인코딩 → OS가 expandable 여부를 모름
- `getExpandableItems`를 컴포넌트 `useCallback`으로 만들어 JSX prop 전달 → OS→DOM 원칙 위반
- `[data-focused_&]` CSS variant가 Tailwind v4에서 컴파일 안 됨

Done Criteria: 다음 에이전트가 아래 항목을 어기지 않는다.
- `isClickExpandable`에서 `treeitem`을 제거하지 않는다
- `data-expand-trigger` 가드를 MouseListener에서 제거하지 않는다
- `getExpandableItems`를 컴포넌트 코드에 넣지 않는다

## 2. Why

### Mouse Event 두 경로 — 의도적 설계

| 이벤트 | 처리 함수 | 목적 |
|--------|-----------|------|
| `mousedown` | `resolveMouse` | 즉각적 focus+select (visual feedback) |
| `click` | `resolveClick → OS_ACTIVATE` | action (expand/navigate) |

**`isClickExpandable`의 역할**:
treeitem/menuitem은 mousedown expand 차단 → click(OS_ACTIVATE→OS_EXPAND)만 처리.
이유: mousedown + click 둘 다 expand하면 double toggle → 원상복귀.

**`[data-expand-trigger]` 가드의 역할**:
`Item.ExpandTrigger`는 자체적으로 `os.dispatch(OS_EXPAND)` 호출.
`MouseListener.onClick`의 `OS_ACTIVATE` 경로도 `OS_EXPAND`를 dispatch → 또 double toggle.
`data-expand-trigger` 클릭이면 MouseListener가 `OS_ACTIVATE`를 skip.

### OS→DOM 원칙
- 올바른 방향: app state/bind config에서 expandable 선언 → OS가 DOM에 `aria-expanded` 투영
- 잘못된 방향: 컴포넌트가 `useCallback`으로 만들어 JSX prop으로 OS에 역방향 전达

## 3. Challenge

| 전제 | 유효한가? | 결론 |
|-|-|-|
| `e.stopPropagation()`이 native document listener를 막는다 | ❌ | React synthetic event와 무관. 명시적 가드 필요 |
| DOM 중첩으로 트리 표현이 자연스럽다 | ❌ | flat tree + transform이 더 단순하고 headless-friendly |
| expandable 여부는 View가 알려줘야 한다 | ❌ | bind() config에서 static data로 OS→DOM 방향으로 선언 |

## 4. Ideal (이번 세션 완료 상태)

```
✅ flat tree rendering — 재귀 컴포넌트/Item.ExpandContent 제거
✅ getExpandableItems → bind() config, module scope static data
✅ useFlatTree hook — OS expanded state 구독 캡슐화
✅ isFocused/isExpanded render prop — [data-focused_&] CSS hack 제거
✅ [data-expand-trigger] 가드 — MouseListener double-toggle 방지
✅ APG showcase — VS Code 스타일 flat tree 예제
✅ flattenVisibleTree(sectionLevel 옵션) — 범용 transform
```

## 5. Inputs

- `MouseListener.tsx` — mousedown + click 이중 리스너, `[data-expand-trigger]` 가드
- `resolveMouse.ts` — `isClickExpandable`, `treeitem` 예외 이유
- `resolveClick.ts` — click → OS_ACTIVATE 경로
- `activate.ts` — OS_ACTIVATE → expandableItems → OS_EXPAND
- `docsUtils.ts` — `flattenVisibleTree`, `FlatTreeNode`
- `os/5-hooks/useFlatTree.ts` — OS hook
- `docs-viewer/app.ts` — `bind()` config, `getExpandableItems`
- FIRED 보고서: `fired-2026-02-24-0137.md`

## 6. Gap (남은 작업)

| # | Need | Have | Gap | Impact |
|-|-|-|-|-|
| G1 | docs-viewer standalone expand 검증 | `localhost:4444` 미확인 | `<Root>` wrapper 유무 확인 | High |
| G2 | `rules.md` 설계 의도 명문화 | FIRED 보고서에만 있음 | `isClickExpandable` / `data-expand-trigger` 설계 원칙 추가 | Med |
| G3 | expand integration test (headless) | 단위 테스트만 있음 | OS_ACTIVATE→OS_EXPAND end-to-end headless 검증 | Med |

## 7. Execution Plan

| # | Task | Domain | Description |
|-|-|-|-|
| 1 | standalone 검증 | Clear | `localhost:4444`에서 폴더 클릭/Enter expand 동작 확인 |
| 2 | rules.md 업데이트 | Clear | Mouse event 두 경로 설계 의도 + ExpandTrigger double-toggle 방지 명문화 |
| 3 | headless expand test | Clear | `headless.createPage`로 OS_ACTIVATE → expandedItems 검증 |
