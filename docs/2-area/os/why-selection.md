# Why Selection

> **Status**: Working Draft
> **Date**: 2026-02-18
> **Pipeline Stage**: ③ Behavior (실행)
> **Parent**: [VISION.md](../VISION.md)

---

## Abstract

Selection은 **아이템을 선택하고, 선택 상태를 관리**하는 모듈이다.
단일 선택, 다중 선택, 범위 선택(Shift+Click), 토글 선택(Cmd+Click), 전체 선택(Cmd+A) — 이 조합들을 일관된 상태 모델로 제공한다.

---

## 1. Problem — 선택은 상태 머신의 폭발이다

### 1.1 간단한 것에서 복잡한 것으로

"아이템을 클릭하면 선택된다." 여기까지는 단순하다.

하지만 현실의 앱은:

1. **Cmd+Click** → 기존 선택을 유지하면서 토글
2. **Shift+Click** → 마지막 선택부터 현재까지 범위 선택
3. **Cmd+A** → 전체 선택
4. **방향키 이동 시** → 선택이 따라가는가(radio), 따라가지 않는가(listbox)?
5. **선택 해제 불가** → radio처럼 최소 1개는 항상 선택?
6. **선택 모드 전환** → 모바일의 "길게 눌러서 다중 선택 모드 진입"

이 6가지가 조합되면 **상태 전환 경우의 수가 폭발**한다.

### 1.2 대부분의 앱은 단일 선택만 구현한다

다중 선택, 범위 선택, 전체 선택을 올바르게 구현한 웹 앱은 드물다. macOS Finder의 선택 동작(Click/Cmd+Click/Shift+Click/Cmd+A)을 정확히 재현하는 웹 앱은 거의 없다.

결과: 사용자는 데스크탑에서 당연하던 조작이 웹에서 작동하지 않아 좌절한다.

---

## 2. Cost — 선택 미구현의 비용

| 이해관계자 | 비용 |
|-----------|------|
| **사용자** | 다중 선택이 안 되어 한 번에 하나씩 처리. 생산성 저하 |
| **고급 사용자** | Cmd+Click, Shift+Click이 작동하지 않아 데스크탑 앱 대비 열등한 경험 |
| **개발자** | 다중 선택 구현 시 anchor point 관리, range 계산, 키보드-마우스 통합 — 복잡도가 급등 |
| **접근성** | `aria-selected` vs `aria-checked` 결정, 선택 변경 시 live region 알림 — 누락 빈번 |

---

## 3. Principle — 모드가 행동을 결정한다

### 3.1 설정(Config)으로 동작 선언

Selection은 `SELECT({ targetId, meta })` 커맨드를 받고, 동작은 Config가 결정한다:

| Config | 역할 | 선택지 |
|--------|------|--------|
| `mode` | 선택 모드 | `none`, `single`, `multiple` |
| `followFocus` | 포커스 이동 시 자동 선택 | `true` (radio), `false` (listbox) |
| `disallowEmpty` | 빈 선택 허용 | `true` (최소 1개), `false` |
| `range` | Shift+Click 범위 선택 | `true`, `false` |
| `toggle` | Cmd+Click 토글 | `true`, `false` |

### 3.2 Role이 Config를 결정한다

- `radiogroup` → single, followFocus, disallowEmpty
- `listbox` → single, followFocus
- `grid` → multiple, range, toggle
- `menu` → none (선택이 아니라 활성화)

개발자는 role만 선언하면 된다. 선택 동작은 OS가 보장한다.

### 3.3 포커스와 선택의 분리

포커스(어디에 있는가)와 선택(무엇을 고른 것인가)은 독립된 상태다.
`followFocus: true`일 때만 연동되고, 그 외에는 포커스를 이동해도 선택이 변하지 않는다.
이 분리가 없으면 "리스트를 둘러보기만 하고 싶은데, 이동할 때마다 선택이 바뀌는" 문제가 발생한다.

---

## 4. Reference

- [W3C APG: Listbox Pattern — Multi-select](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)
- [W3C APG: Grid Pattern — Selection](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
- [macOS HIG: Selection and Focus](https://developer.apple.com/design/human-interface-guidelines/selecting-content)
- [WCAG 1.3.1: Info and Relationships](https://www.w3.org/TR/WCAG22/#info-and-relationships) — `aria-selected` vs `aria-checked`

---

## Status of This Document

Working Draft.
