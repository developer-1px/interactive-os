# 🐛 Focus Showcase: Tree Toggle + Modal Focus Failures
> 등록일: 2026-02-13
> 상태: open
> 심각도: P2

## 원문
사용자가 말한 그대로:

### Test Scenario: Focus Showcase › Expand: Tree Toggle
Status: FAIL
Steps: 2
1. ✅ [CLICK] #tree-parent-1
2. ❌ [EXPECT.ATTR] #tree-parent-1 [aria-expanded="false"]
   Error: Expected aria-expanded="false", got "true"

### Test Scenario: Focus Showcase › Focus Stack: Restore
Status: FAIL
Steps: 2
1. ✅ [CLICK] #fs-open-modal
2. ❌ [EXPECT.ATTR] #fs-modal1-1 [aria-current="true"]
   Error: Expected aria-current="true", got "undefined"

## 해석

### Bug A — Tree Toggle
- **기대**: 클릭 시 포커스만 이동, `aria-expanded`는 `false` 유지
- **실제**: `FocusListener.senseMouseDown`이 `aria-expanded` 속성을 가진 아이템을 클릭하면 무조건 `EXPAND({ action: "toggle" })` 디스패치
- **W3C APG Tree Pattern**: 클릭은 포커스만 이동, 확장/축소는 ArrowRight/Left 또는 Enter/Space로만 수행

### Bug B — Modal Focus
- **기대**: Dialog 열리면 `autoFocus`에 의해 첫 아이템 `#fs-modal1-1`에 `aria-current="true"` 설정
- **실제**: `aria-current`가 `undefined` — 활성 Zone이 Dialog Zone으로 전환되지 않는 것으로 추정
- `FocusItem`이 `aria-current`를 `visualFocused` (`isFocused && isGroupActive`)로만 설정하므로, `activeZoneId`가 Dialog Zone과 일치하지 않으면 `aria-current`는 항상 `undefined`

## 첫 감
- Bug A: `FocusListener.senseMouseDown`에서 tree role 아이템의 클릭 시 EXPAND 디스패치를 제거해야 함
- Bug B: `FocusGroup` autoFocus가 `FOCUS({ zoneId, itemId })`를 디스패치하는데, 이미 `activeZoneId`도 설정하므로 정상적으로 동작해야 함. 타이밍 문제(rAF)일 가능성 있음

## 관련 이슈
- `docs/1-project/0-issue/closed/2026-02-13-focus-infinite-loop.md` (포커스 관련)
