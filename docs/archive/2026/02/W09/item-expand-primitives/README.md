# item-expand-primitives

> ZIFT Item을 ExpandTrigger + ExpandContent compound component로 확장

## Summary

현재 Tree(docs-viewer)는 render prop `{({ isFocused, isExpanded }) => ...}`으로 상태를 직접 읽어 조건 분기한다. 이는 명령형이며, OS substrate의 "100% 선언적" 목표에 맞지 않는다.

Item을 compound component로 확장하여:
- `Item.ExpandTrigger`: 클릭 시 parent Item의 expand 상태를 토글
- `Item.ExpandContent`: parent Item이 expanded일 때만 children 렌더

## Motivation

다른 에이전트가 만든 docs tree가 render prop 기반 명령형 코드였다.
"우아하지 못하다"는 판단 — 브라우저/Radix 수준의 선언성을 바닥 레이어에서 제공해야 한다.

Discussion에서 3가지 접근을 검토하고 기각:
1. ❌ `Item.Trigger` / `Item.Content` — Radix 티어 복사. 이름도 피상적.
2. ❌ `data-os-expand` 속성 — Convention 기반. 구조가 강제하지 않음.
3. ✅ `Item.ExpandTrigger` / `Item.ExpandContent` — 이름이 의도를 담고, Context가 scope를 강제. `Trigger.Dismiss` 선례와 일치.

## Guide-level explanation

### Before (명령형)
```tsx
<DocsSidebarUI.Item id="folder:api">
  {({ isFocused, isExpanded }) => (
    <div>
      <div className={isFocused ? "bg-indigo-50" : ""}>
        <ChevronRight className={isExpanded ? "rotate-90" : ""} />
        API
      </div>
      {isExpanded && <div>{children}</div>}
    </div>
  )}
</DocsSidebarUI.Item>
```

### After (선언적)
```tsx
<DocsSidebarUI.Item id="folder:api">
  <Item.ExpandTrigger asChild>
    <div className="tree-label">
      <ChevronRight /> API
    </div>
  </Item.ExpandTrigger>
  <Item.ExpandContent>
    <DocsSidebarUI.Item id="api/auth">Auth</DocsSidebarUI.Item>
  </Item.ExpandContent>
</DocsSidebarUI.Item>
```

스타일링은 CSS data-attr:
```css
[data-expanded] > [data-expand-trigger] > .chevron { transform: rotate(90deg); }
[data-focused] > [data-expand-trigger] { background: var(--focus-bg); }
```

## Detailed Design

→ `prd.md` 참조

## Unresolved questions

- ExpandTrigger 클릭 시 expand만? expand + focus?
- resolveMouse가 `[data-expand-trigger]`를 인식하는 방식 — onAction 억제 vs 별도 커맨드
- render prop 패턴은 backward compatible로 유지할 것인가?
