# 아키텍처 분석: FocusData와 Zustand Store의 이중 구조

## 1. 개요
사용자는 현재 프로젝트에서 Focus 상태 관리를 위해 `Zustand Store`와 `FocusData`(WeakMap)를 함께 사용하는 구조에 대해 의문을 제기했습니다. "Zustand로 Store를 관리하기로 했는데, 왜 `FocusData`라는 별도의 저장소가 필요한가?"에 대한 기술적 배경과 이유를 분석합니다.

## 2. 분석: 왜 두 가지가 필요한가?

이 구조는 데이터의 **중복 관리(Duplication)**가 아니라, **접근 경로(Access Path)**의 차이 때문에 발생합니다.

### A. Zustand Store (Local State)
- **위치**: 각 `FocusGroup` 컴포넌트 내부.
- **역할**: 해당 그룹의 상태(선택된 아이템, 키보드 네비게이션 설정 등)를 관리.
- **특징**: React 컴포넌트 트리 내부에서만 접근 가능 (`useStore` 훅 사용).
- **한계**: **React 외부(DOM Event Listener)**에서는 이 Store에 직접 접근할 방법이 없습니다.

### B. FocusData (Global Bridge)
- **위치**: `src/os/features/focus/lib/focusData.ts` (전역 싱글톤).
- **역할**: DOM 요소를 Key로 사용하여, 해당 요소가 속한 **Zustand Store 인스턴스를 찾아줍니다.**
- **구조**: `WeakMap<HTMLElement, ZoneData>`
- **필요성**:
  1. `FocusSensor`는 `document.addEventListener`로 등록된 **전역 이벤트 리스너**입니다.
  2. 사용자가 어떤 엘리먼트를 클릭했을 때(`e.target`), 센서는 그 엘리먼트(`DOM Node`)만 알고 있습니다.
  3. 센서가 "이 엘리먼트의 상태를 변경해줘!"라고 명령하려면, 그 엘리먼트를 관리하는 **Store**를 찾아야 합니다.
  4. React는 DOM 노드에서 컴포넌트 인스턴스(Store)로 가는 역참조를 제공하지 않기에, **FocusData가 그 다리 역할**을 합니다.

## 3. 결론: 이중 관리가 아닌 "참조 공유"

`FocusData`는 상태 값을 따로 복사해서 저장하는 것이 아닙니다. **Store 그 자체의 참조(Reference)**를 저장하고 있습니다.

- **Store**: 데이터 원본 (Single Source of Truth).
- **FocusData**: "이 DOM 요소의 주인(Store)은 얘야"라고 알려주는 주소록.

따라서 데이터는 하나이며, **Store는 React 내부용**, **FocusData는 DOM 이벤트 핸들러용** 접근 포인트입니다. 이 패턴은 Headless UI 라이브러리나 복잡한 인터랙션 시스템에서 **DOM-to-React 브릿징**을 위해 흔히 사용되는 패턴입니다.
