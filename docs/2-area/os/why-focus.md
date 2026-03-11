# Why Focus

> **Status**: Working Draft
> **Date**: 2026-02-18
> **Pipeline Stage**: ① Spatial Model (인지)
> **Parent**: [VISION.md](../VISION.md)

---

## Abstract

Focus는 "사용자가 지금 어디에 있는가"를 시스템이 추적하는 모듈이다.
웹 브라우저의 네이티브 포커스(`document.activeElement`)는 단일 요소만 추적하며, 영역(Zone) 개념이 없다. Interactive OS의 Focus는 **영역 단위의 포커스 모델**을 제공하여, 앱 전체에서 사용자의 위치를 일관되게 관리한다.

---

## 1. Problem — 브라우저 포커스의 한계

### 1.1 단일 포커스, 단일 차원

브라우저는 `document.activeElement` 하나만 안다. 하지만 실제 앱은 **여러 영역(zone)**으로 나뉜다:

- 사이드바 목록
- 메인 콘텐츠 영역
- 툴바
- 모달 다이얼로그

사용자가 사이드바에서 메인으로 이동하면, 사이드바의 "마지막 위치"는 사라진다. 돌아왔을 때 처음부터 다시 시작해야 한다. 이것은 데스크탑 앱에서는 발생하지 않는 문제다.

### 1.2 포커스 = 보이지 않는 상태

대부분의 웹 앱은 포커스를 **시각적으로 표현하지 않는다.** 키보드로 페이지를 탐색하면, 지금 어디에 있는지 보이지 않는 경우가 많다. 이것은 키보드 사용자에게 "눈을 감고 걷는 것"과 같다.

### 1.3 앱마다 다른 포커스 모델

포커스를 관리하는 앱들도, 각자 다른 방식으로 구현한다:

- A 앱: `useState(selectedIndex)` + `useEffect(() => ref.focus())`
- B 앱: CSS `:focus-visible` 만 사용
- C 앱: `tabIndex` 동적 변경으로 roving tabindex 구현

동일한 "리스트에서 아이템 선택" 문제를 세 가지 다른 방식으로 풀고, 세 가지 다른 방식으로 버그가 발생한다.

---

## 2. Cost — 포커스 부재가 만드는 비용

| 이해관계자 | 비용 |
|-----------|------|
| **키보드 사용자** | 앱 내 현재 위치를 알 수 없음. 탐색이 불가능하거나 비효율적 |
| **스크린 리더 사용자** | 포커스가 올바르게 관리되지 않으면 앱 자체를 사용할 수 없음 |
| **개발자** | 매 컴포넌트에서 `useState` + `useRef` + `useEffect` 포커스 보일러플레이트 반복 |
| **유지보수** | 포커스 로직이 UI 컴포넌트에 산재. 하나의 변경이 다른 영역의 포커스를 깨뜨림 |

---

## 3. Principle — 포커스는 시스템 서비스다

### 3.1 영역(Zone) 단위 추적

단일 요소가 아닌 **영역(Zone)** 단위로 포커스를 추적한다. 각 Zone은 독립된 포커스 상태를 갖는다:

- `activeZoneId`: 현재 활성 영역
- `focusedItemId`: 영역 내 포커스된 아이템
- `lastFocusedId`: 마지막 포커스 (복원용)

### 3.2 앱은 선언, OS가 실행

앱은 "이 `<div>`가 하나의 Zone이다"라고 선언하기만 한다. 포커스 진입, 이탈, 복원, 시각적 표시는 OS가 처리한다.

### 3.3 포커스 복원 (Focus Stack)

모달이 열리면 이전 포커스를 스택에 저장하고, 모달이 닫히면 복원한다. 중첩 모달도 지원한다. 이것은 데스크탑 OS에서는 당연한 동작이지만, 웹에서는 대부분 구현되지 않는다.

### 3.4 포커스 삭제 복구 (Recovery)

포커스된 아이템이 삭제되면, 시스템이 자동으로 적절한 다음 대상을 찾는다. 개발자가 "삭제 후 어디로 포커스를 보낼지" 매번 계산할 필요가 없다.

---

## 4. Reference

- [W3C WAI-ARIA: Managing Focus](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#managingfocuswithincomponents)
- [WCAG 2.4.7: Focus Visible](https://www.w3.org/TR/WCAG22/#focus-visible)
- [WCAG 2.4.3: Focus Order](https://www.w3.org/TR/WCAG22/#focus-order)
- macOS AppKit: `NSWindow.makeFirstResponder()` — 윈도우 단위 포커스 관리의 선례

---

## Status of This Document

Working Draft. Focus 모듈은 구현 완료 + 테스트 완료 상태이나, Problem Space 문서는 초안이다.
