# 아키텍처 결정 보고서: OS 네이티브 포커스 전략 (Red/Blue Team 분석)

**작성일:** 2026-02-03
**상태:** 승인됨 (APPROVED)
**문맥:** Interactive-OS의 키보드 네비게이션 아키텍처 정의

## 1. 개요 (Executive Summary)

본 문서는 Interactive-OS가 지향하는 "앱 수준의 사용자 경험(App-Like UX)"을 달성하기 위해, 웹 브라우저의 기본 포커스 시스템(`tabIndex`, `activeElement`)을 어디까지 수용하고 어디서부터 차단할지에 대한 기술적 의사결정을 기록한다.

**핵심 안건:** 웹 접근성(A11y) 표준을 희생하더라도, 운영체제(OS)와 동일한 "결정론적 네비게이션 물리학(Deterministic Navigation Physics)"을 구현할 것인가?

---

## 2. Blue Team 입장 (제안: Virtual Focus 도입)

> **"브라우저는 캔버스일 뿐, 물리학은 엔진이 담당한다."**

Blue Team은 웹의 기본 동작이 고성능 OS 경험을 방해하는 "노이즈(Interference)"라고 판단한다. 따라서 브라우저의 네비게이션을 전면 차단하고, 순수 로직 기반의 **가상 포커스(Virtual Focus)** 시스템을 제안한다.

### 주요 제안 사항
1.  **Black Hole Strategy (네이티브 포커스 제거)**:
    *   모든 Item에 `tabIndex="-1"`을 강제하여 브라우저의 탭 순서(Tab Order)에서 제거한다.
    *   사용자가 Tab을 눌러도 브라우저가 임의로 포커스를 이동시키지 못하게 한다.
    *   포커스 링(Focus Ring)과 스크롤 동작을 브라우저에 의존하지 않고 100% 직접 렌더링한다.

2.  **Zone Strategy Pattern (전략 패턴)**:
    *   DOM 구조(형제 노드, 부모 노드)에 의존하지 않는다.
    *   `ArrowDown` 입력 시, DOM을 탐색하는 것이 아니라 `NavigationEngine`이 수학적(Index or Grid 좌표)으로 다음 ID를 계산한다.
    *   이를 통해 화면에 보이지 않는 요소(Virtual List)나 비선형적 배치의 네비게이션을 완벽하게 제어한다.

3.  **Input Sink (입력 싱크)**:
    *   실제 텍스트 입력이 필요한 순간(Edit Mode)을 제외하고는, 포커스를 `document.body` 혹은 숨겨진 `Zone` 컨테이너에 묶어둔다.

---

## 3. Red Team 검토 (비판: 구현 리스크 및 부채)

> **"웹의 본성을 거스르는 것은 막대한 유지보수 비용을 초래한다."**

Red Team은 접근성 포기에 동의하더라도, 브라우저 표준을 우회함으로써 발생하는 기술적 부작용(Side Effects)을 경고한다.

### 식별된 리스크
1.  **클립보드 및 컨텍스트 메뉴 파손 (Clipboard/Context Broken)**:
    *   브라우저의 `Copy/Paste` 이벤트는 `document.activeElement`를 기준으로 발생한다.
    *   모든 Item이 `tabIndex="-1"`이라면, 사용자가 Item을 선택하고 `Cmd+C`를 눌렀을 때 브라우저는 "선택된 텍스트가 없다"고 판단할 수 있다.
    *   **방어책 요구:** 별도의 Global Clipboard Handler 구현이 필수적임.

2.  **스크롤 동기화의 복잡성 (Reinventing Scroll)**:
    *   브라우저의 네이티브 포커스는 `scrollIntoView`를 자동으로 처리해준다.
    *   이를 포기하면, 포커스가 이동할 때마다 스크롤 컨테이너의 위치를 계산하고 부드럽게 이동시키는 로직을 **직접** 구현해야 한다. (버그 발생 가능성 높음)

3.  **치명적 오류 시 복구 불가 (Single Point of Failure)**:
    *   JS 엔진(React Render Cycle)이 멈추면 네비게이션도 즉시 먹통이 된다. 네이티브 포커스는 JS가 멈춰도 탭 이동이 가능한 경우가 많지만, Virtual Focus는 JS 의존성이 100%다.

---

## 4. 최종 합의 및 결정 (The Verdict)

**결정: Blue Team의 "완전 가상 포커스(Pure Virtual Focus)" 전략을 채택한다.**
단, Red Team이 지적한 리스크를 완화하기 위해 다음의 기술적 제약을 둔다.

### 구현 가이드라인 (Implementation Directive)

1.  **Global Event Delegation**:
    *   개별 Item에 이벤트 리스너를 달지 않는다. `Zone` 레벨 혹은 `Window` 레벨에서 키보드 이벤트를 통합 수신하여 라우팅한다.

2.  **Pointer Event Suppression (마우스 간섭 차단)**:
    *   Item 클릭 시 브라우저 포커스가 튀는 것을 막기 위해 `onMouseDown={(e) => e.preventDefault()}` 패턴을 필수적으로 적용한다.

3.  **Focus Mirroring (선택적 동기화)**:
    *   클립보드 등의 이슈 해결을 위해, 실제로 보이지 않는 `Hidden Input`을 만들어 "현재 선택된 아이템의 데이터"를 담고 있게 하거나, Global Event에서 `Copy`를 가로채는 로직을 우선 구현한다.

4.  **전용 네비게이션 엔진 (Navigation Engine)**:
    *   `src/os/core/navigation.ts`에 DOM 의존성이 전혀 없는 순수 로직(Pure Logic) 계산 함수를 집중시킨다.

### 결론
Interactive-OS는 웹 페이지가 아닌 **애플리케이션**이다. 따라서 브라우저의 기본 동작은 "기능"이 아니라 "제약 사항"으로 간주하며, 이를 로직으로 완전히 덮어쓰는(Oversee) 구조를 정당화한다.
