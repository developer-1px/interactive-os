# Interface OS 테스트용 Mock UI 컴포넌트 리스트

이 문서는 Interface OS의 UI 테스트(Storybook, Unit Test 등) 환경 구축 시 반복적으로 사용될 수 있는 기본 Mock 컴포넌트들을 정의합니다. 실제 구현보다는 테스트 가독성과 동작 시뮬레이션에 초점을 맞춘 스펙입니다.

## 1. 기본 요소 (Primitives)

### `MockIcon` (아이콘)
테스트 환경에서 불필요한 SVG 로딩 없이 아이콘의 존재 여부와 스타일(색상, 크기)을 검증하기 위한 컴포넌트입니다.
- **Props**: `name` (icon-name), `size`, `color`, `variant` (solid/outline)
- **용도**: 특정 상태(예: 활성화/비활성화)에 따른 아이콘 변경 확인.

### `MockText` (텍스트)
타이포그래피 스타일(크기, 두께, 색상)을 시각적으로 구분하여 렌더링하는 기본 텍스트 래퍼입니다.
- **Props**: `variant` (h1, h2, body, caption), `color`, `weight`
- **용도**: 헤딩 계층 구조 및 텍스트 스타일 회귀 테스트.

### `MockBadge` (배지)
상태 표시기나 카운트 등을 나타내는 배지 컴포넌트입니다.
- **Props**: `label`, `color` (success, warning, error), `size`
- **용도**: 알림 상태나 태그 표시 테스트.

### `MockShortcut` (단축키)
키보드 단축키 조합을 시각적으로 표시하는 컴포넌트입니다. OS 특유의 키 심볼(⌘, ⌥, ⇧) 렌더링을 대체합니다.
- **Props**: `keys` (string[]), `style` (mac/windows)
- **용도**: 메뉴나 툴팁 내 단축키 표시 레이아웃 검증.

## 2. 입력 및 상호작용 (Input & Interaction)

### `MockInput` (입력 필드)
복잡한 IME 동작이나 상태 관리 없이, 순수한 입력 값의 흐름과 포커스 상태를 테스트하기 위한 입력 필드입니다.
- **Props**: `value`, `placeholder`, `autoFocus`, `readOnly`
- **Events**: `onChange`, `onFocus`, `onBlur`, `onKeyDown`
- **용도**: 폼 입력 시뮬레이션 및 키보드 이벤트 캡처 테스트.

### `MockButton` (버튼)
클릭 이벤트를 로깅하고, 로딩 상태나 비활성화 상태를 시각적으로 테스트할 수 있는 버튼입니다.
- **Props**: `label`, `icon`, `intent` (primary, secondary, danger), `loading`, `disabled`
- **용도**: 액션 트리거 및 UI 피드백(로딩 스피너 등) 테스트.

### `MockToggle` (토글 스위치)
설정 옵션 등의 켜짐/꺼짐 상태를 나타냅니다.
- **Props**: `checked`, `label`
- **용도**: 환경 설정 UI 테스트.

## 3. 구조 및 레이아웃 (Layout & OS Structure)

### `MockWindow` (윈도우/패널 프레임)
OS 스타일의 창을 시뮬레이션합니다. 타이틀바와 컨텐츠 영역을 포함합니다.
- **Props**: `title`, `width`, `height`, `isActive`, `controls` (close, minimize, maximize)
- **용도**: 다중 창 환경이나 팝업, 모달의 레이아웃 및 포커스 관리 테스트.

### `MockScrollArea` (스크롤 영역)
스크롤 가능한 컨텐츠 영역을 정의하고, 스크롤바의 위치나 동작을 모킹합니다.
- **Props**: `orientation` (vertical/horizontal), `scrollPos`
- **용도**: 오버플로우 컨텐츠 처리 및 스크롤 이벤트 트리거 테스트.

### `MockDivider` (구분선)
리스트나 패널 간의 시각적 분리를 위한 구분선입니다.
- **Props**: `orientation` (vertical/horizontal), `thickness`
- **용도**: 레이아웃의 섹션 분리 가시성 테스트.

## 4. 피드백 및 상태 (Feedback & Overlay)

### `MockSpinner` (로딩 인디케이터)
비동기 작업 중임을 나타내는 로딩 인디케이터입니다.
- **Props**: `size`
- **용도**: 데이터 로딩 중 UI 상태 검증.

### `MockToast` (토스트 알림)
일시적인 시스템 메시지를 표시하는 플로팅 알림입니다.
- **Props**: `message`, `type` (info, success, error), `duration`
- **용도**: 시스템 알림의 등장 및 퇴장 애니메이션/위치 테스트.

### `MockCursor` (가상 커서)
협업 도구 등에서 다른 사용자의 커서 위치를 시뮬레이션합니다.
- **Props**: `x`, `y`, `color`, `label`
- **용도**: 캔버스나 에디터 내의 멀티유저 커서 렌더링 테스트.
