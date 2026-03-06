# Why Navigation

> **Status**: Working Draft
> **Date**: 2026-02-18
> **Pipeline Stage**: ③ Behavior (실행)
> **Parent**: [VISION.md](../VISION.md)

---

## Abstract

Navigation은 **방향키(Arrow, Home, End)로 아이템 사이를 이동**하는 행동을 제공하는 모듈이다.
1D(리스트), 2D(그리드), Spatial(자유 배치) 레이아웃을 공통의 커맨드 인터페이스로 처리하며, 경계 행동(loop/clamp), orientation 필터링, typeahead를 시스템 수준에서 보장한다.

---

## 1. Problem — 방향키는 자명하지 않다

### 1.1 겉보기엔 단순한 문제

"ArrowDown을 누르면 다음 아이템으로 간다." 이것은 단순해 보인다.
하지만 실제로는:

- 마지막 아이템에서 ArrowDown을 누르면? → 순환(loop)인가, 멈춤(clamp)인가?
- 수평 리스트에서 ArrowDown을 누르면? → 무시인가, 다음 줄로 이동인가?
- 그리드에서 ArrowRight를 누르면? → 같은 행의 다음인가, 가장 가까운 아이템인가?
- Home을 누르면? → 첫 아이템인가, 행의 첫 아이템인가?
- 비활성(disabled) 아이템은 건너뛰는가?
- Zone에 처음 진입했을 때 어떤 아이템에 포커스하는가? → first? last? 이전에 있던 곳(restore)?

하나의 "방향키 이동"에 최소 6가지 의사결정이 숨어 있다.

### 1.2 모든 앱이 재발명한다

```javascript
// 99%의 웹 앱이 작성하는 코드
const onKeyDown = (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    setIndex(Math.min(index + 1, items.length - 1))
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    setIndex(Math.max(index - 1, 0))
  }
}
```

이 코드는:
- loop를 지원하지 않는다
- horizontal 레이아웃을 고려하지 않는다
- disabled 아이템을 건너뛰지 않는다
- grid를 처리할 수 없다
- Home/End를 빠뜨린다
- typeahead가 없다

그리고 **모든 앱의 모든 리스트 컴포넌트에서 반복**된다.

---

## 2. Cost — 재발명의 비용

| 이해관계자 | 비용 |
|-----------|------|
| **사용자** | 앱마다 방향키 동작이 다름. Gmail에서 학습한 패턴이 Notion에서 작동하지 않음 |
| **키보드 사용자** | loop 미지원 시 마지막 아이템에서 갇힘. Home/End 미지원 시 긴 리스트 탐색 불가 |
| **개발자** | 리스트, 그리드, 트리, 탭 — 유형마다 네비게이션 로직을 처음부터 구현 |
| **접근성** | W3C APG가 정의한 네비게이션 패턴을 올바르게 구현하는 앱은 극소수 |

---

## 3. Principle — 설정(Config)이 구현을 대체한다

### 3.1 하나의 커맨드, 다양한 행동

Navigation은 `NAVIGATE({ direction })` 하나의 커맨드로 통일된다. 행동의 차이는 **설정(Config)**으로 결정된다:

| Config | 역할 | 선택지 |
|--------|------|--------|
| `orientation` | 방향 필터링 | `vertical`, `horizontal`, `both` |
| `loop` | 경계 행동 | `true` (순환), `false` (멈춤) |
| `entry` | Zone 진입 시 초기 위치 | `first`, `last`, `restore`, `selected` |

### 3.2 Role이 Config를 결정한다

개발자가 매번 `orientation: 'vertical', loop: true`를 설정하지 않아도 된다.
`role="menu"`를 선언하면, W3C APG에 따라 적절한 Config가 자동 적용된다:

- menu → vertical, loop, entry: first
- tablist → horizontal, loop, entry: selected
- grid → both, clamp

Role 선언이 곧 네비게이션 계약이다.

### 3.3 레이아웃 독립

1D(리스트)와 2D(그리드)를 동일한 커맨드가 처리한다. Spatial 네비게이션(가장 가까운 아이템 찾기)도 같은 `NAVIGATE` 커맨드로 동작한다. 앱이 레이아웃을 변경해도 네비게이션 코드는 변경되지 않는다.

---

## 4. Reference

- [W3C APG: Keyboard Navigation Inside Components](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#keyboardnavigationinsidecomponents)
- [W3C APG: Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
- [Fitts' Law](https://en.wikipedia.org/wiki/Fitts%27s_law) — 경계에서 loop vs clamp의 UX 근거
- macOS AppKit: `NSCollectionView` — 1D/2D 네비게이션의 선례

---

## Status of This Document

Working Draft. Navigation 모듈은 구현 완료 + 테스트 완료 상태이나, Problem Space 문서는 초안이다.
