# Why Tab

> **Status**: Working Draft
> **Date**: 2026-02-18
> **Pipeline Stage**: ③ Behavior (실행)
> **Parent**: [VISION.md](../VISION.md)

---

## Abstract

Tab은 **Tab/Shift+Tab 키로 영역(Zone) 간을 이동**하는 행동을 제공하는 모듈이다.
포커스 트랩(trap), 순차 흐름(flow), 즉시 탈출(escape) — 세 가지 행동 모드로 영역 경계에서의 포커스 이동을 관리한다.

---

## 1. Problem — Tab은 웹에서 가장 깨지기 쉬운 상호작용이다

### 1.1 브라우저 Tab의 한계

브라우저의 기본 Tab 동작은 DOM 순서대로 `tabIndex >= 0`인 요소를 순회한다. 이것은 **앱의 논리적 구조를 전혀 모른다:**

- 사이드바 → 메인 → 툴바 순서가 DOM 순서와 다르면 Tab이 엉뚱한 곳으로 간다
- 모달이 열렸는데 Tab으로 모달 바깥으로 나갈 수 있다
- 메뉴 안에서 Tab을 누르면 메뉴를 벗어나 페이지 전체를 순회한다

### 1.2 Focus Trap은 반쪽짜리 해법

많은 라이브러리가 "focus trap" 기능을 제공한다. 하지만:

- Trap만 있고 Flow가 없다 → 리스트에서 Tab으로 다음 영역으로 자연스럽게 넘어가는 패턴을 구현할 수 없다
- Trap과 Escape의 구분이 없다 → 메뉴(Tab이 메뉴 안에서 순환)와 도구모음(Tab이 즉시 빠져나감)의 차이를 표현할 수 없다
- Trap 해제 시 "어디로 돌아가는가"가 불명확하다

### 1.3 세 가지 모드가 필요하다

현실의 UI 패턴을 분석하면 Tab 행동은 정확히 세 가지로 분류된다:

| 모드 | UI 패턴 | 행동 |
|------|---------|------|
| **trap** | Dialog, Menu | Tab이 영역 안에서 순환. 밖으로 나가지 못함 |
| **flow** | 일반 리스트, 폼 | Tab이 영역 안 아이템을 순회하다 끝에서 다음 영역으로 이동 |
| **escape** | Toolbar, Tablist | Tab이 영역을 즉시 벗어남. 영역 안 이동은 방향키로 |

이 세 모드를 하나의 시스템이 관리하지 않으면, 앱마다 Tab 동작이 달라지고 사용자가 예측할 수 없게 된다.

---

## 2. Cost — Tab 미관리의 비용

| 이해관계자 | 비용 |
|-----------|------|
| **키보드 사용자** | Tab이 어디로 갈지 예측 불가. 모달에서 탈출, 영역 건너뛰기 등이 불일관 |
| **스크린 리더 사용자** | Focus trap이 없으면 모달 뒤의 페이지 콘텐츠를 읽어버림 (WCAG 위반) |
| **개발자** | `tabIndex` 관리, focus trap 라이브러리 도입, 영역 순서 하드코딩 |
| **유지보수** | 영역이 추가/삭제될 때마다 Tab 순서를 수동으로 조정해야 함 |

---

## 3. Principle — Tab은 영역 간 계약이다

### 3.1 Tab은 Navigation이 아니다

방향키(Arrow)는 **영역 안**에서 아이템 간 이동이다.
Tab은 **영역 간** 이동이다.
이 두 축이 분리되어야 "리스트 안에서 탐색"과 "리스트를 벗어남"을 구분할 수 있다.

### 3.2 Zone이 Tab 행동을 선언한다

각 Zone이 자신의 Tab 행동을 선언한다:

- Dialog → `tab: { behavior: 'trap', restoreFocus: true }`
- Sidebar → `tab: { behavior: 'flow' }`
- Toolbar → `tab: { behavior: 'escape' }`

이 선언은 role에서 자동 도출된다. `role="dialog"`이면 trap, `role="toolbar"`이면 escape.

### 3.3 Cross-Zone Escape

`flow`와 `escape` 모드에서는 현재 Zone을 벗어나 **다음/이전 Zone으로 이동**해야 한다. 이것은 DOM 순서를 기반으로 시스템이 자동 계산한다. 개발자가 "다음 영역이 어디인지" 명시할 필요가 없다.

---

## 4. Reference

- [W3C APG: Keyboard Navigation Between Components](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#keyboardnavigationbetweencomponents)
- [W3C APG: Dialog Pattern — Focus Trap](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [W3C APG: Toolbar Pattern — Tab Escape](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)
- [WCAG 2.4.3: Focus Order](https://www.w3.org/TR/WCAG22/#focus-order)
- [WCAG 2.1.2: No Keyboard Trap](https://www.w3.org/TR/WCAG22/#no-keyboard-trap)

---

## Status of This Document

Working Draft.
