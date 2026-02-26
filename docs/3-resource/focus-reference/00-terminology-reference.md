# FocusGroup 관련 용어 총정리

## 🎯 ARIA 역할 & 속성

### 역할 (Roles)
```
컨테이너 역할:
- group: 일반 그룹
- toolbar: 도구 모음
- tablist: 탭 목록
- menu: 메뉴
- menubar: 메뉴바
- listbox: 선택 가능한 리스트
- radiogroup: 라디오 버튼 그룹
- tree: 트리 구조
- grid: 그리드/테이블
- treegrid: 편집 가능한 트리 그리드
- combobox: 콤보박스 (입력+리스트)
- feed: 스크롤 피드 (무한 스크롤)

아이템 역할:
- tab: 탭
- menuitem: 메뉴 아이템
- menuitemcheckbox: 체크 가능한 메뉴
- menuitemradio: 라디오 메뉴
- option: 옵션 (listbox 아이템)
- radio: 라디오 버튼
- treeitem: 트리 아이템
- gridcell: 그리드 셀
- row: 행
- columnheader: 컬럼 헤더
- rowheader: 행 헤더
```

### 상태 속성 (States)
```
aria-selected: 선택 상태 (true/false/undefined)
aria-checked: 체크 상태 (true/false/mixed/undefined)
aria-pressed: 토글 버튼 눌림 상태
aria-expanded: 확장/축소 상태
aria-disabled: 비활성 상태
aria-hidden: 숨김 상태 (접근성 트리에서 제거)
aria-current: 현재 항목 (page/step/location/date/time/true/false)
aria-busy: 로딩 중 상태
aria-invalid: 유효하지 않은 입력
aria-required: 필수 입력
```

### 관계 속성 (Relationships)
```
aria-activedescendant: 현재 활성 자식 ID (가상 포커스)
aria-labelledby: 레이블 요소 ID 참조
aria-describedby: 설명 요소 ID 참조
aria-owns: 소유 관계 (DOM 구조와 무관)
aria-controls: 제어 관계
aria-flowto: 읽기 순서 흐름
aria-posinset: 세트 내 위치 (n of total)
aria-setsize: 세트 전체 크기
```

### 위젯 속성 (Widget Attributes)
```
aria-orientation: 방향 (horizontal/vertical/undefined)
aria-multiselectable: 다중 선택 가능 여부
aria-readonly: 읽기 전용
aria-autocomplete: 자동완성 타입 (inline/list/both/none)
aria-haspopup: 팝업 타입 (menu/listbox/tree/grid/dialog/true/false)
aria-level: 계층 레벨 (트리)
aria-valuemin/max/now/text: 값 범위 (슬라이더 등)
```

### 라이브 리전 (Live Regions)
```
aria-live: 업데이트 알림 정책 (off/polite/assertive)
aria-atomic: 전체 읽기 여부 (true/false)
aria-relevant: 알릴 변경 타입 (additions/removals/text/all)
role="alert": 중요 알림
role="status": 상태 업데이트
role="log": 로그 메시지
role="marquee": 주기적 업데이트
role="timer": 타이머
```

---

## ⌨️ 키보드 네비게이션

### 이동 키 (Navigation Keys)
```
Tab: 다음 포커스 가능 요소
Shift+Tab: 이전 포커스 가능 요소
Arrow Keys: 방향 이동
  - ArrowUp/Down: 세로 이동
  - ArrowLeft/Right: 가로 이동
Home: 첫 번째 항목
End: 마지막 항목
PageUp/PageDown: 페이지 단위 이동
```

### 활성화 키 (Activation Keys)
```
Enter: 활성화/제출
Space: 선택/토글/활성화
```

### 선택 키 (Selection Keys)
```
Space: 단일 선택/토글
Ctrl+Space: 다중 선택 토글
Shift+Arrow: 범위 선택
Ctrl+A: 전체 선택
Ctrl+Shift+Home/End: 처음/끝까지 범위 선택
```

### 확장/축소 키 (Expansion Keys)
```
Enter/Space: 확장/축소 토글
ArrowRight: 확장 (트리)
ArrowLeft: 축소 (트리)
* (asterisk): 모든 형제 확장 (트리)
```

### 검색 키 (Search Keys)
```
Typeahead: 문자 입력으로 검색
Ctrl+F: 찾기 (브라우저 기본)
/ (slash): 검색 모드 진입 (일부 앱)
```

### 취소/이탈 키 (Dismiss Keys)
```
Escape: 닫기/취소/초기화
```

### 편집 키 (Editing Keys)
```
F2: 편집 모드 진입 (그리드)
Ctrl+X/C/V: 잘라내기/복사/붙여넣기
Ctrl+Z/Y: 실행 취소/다시 실행
Delete/Backspace: 삭제
```

---

## 🎯 포커스 관리

### 포커스 개념
```
Focus: 현재 키보드 입력을 받는 요소
Active Element: document.activeElement
Focusable: 포커스 받을 수 있는 요소
  - 기본: <a>, <button>, <input>, <select>, <textarea>
  - tabindex="0": 포커스 가능하게 만듦
  - tabindex="-1": Tab 순서에서 제외 (프로그래밍 포커스 가능)
Tabbable: Tab 키로 접근 가능한 요소
Focus Order: Tab 순서 (DOM 순서 또는 tabindex)
Focus Visible: 키보드 포커스 시각적 표시 (:focus-visible)
```

### 포커스 전략
```
Roving Tabindex: 
  - 그룹 내 하나만 tabindex="0", 나머지 "-1"
  - 화살표로 이동하며 tabindex 변경
  - Tab으로는 그룹 전체를 하나로 취급

Managed Tabindex:
  - 조건에 따라 동적으로 tabindex 변경
  - 예: 선택된 항목만 "0"

Natural Tabindex:
  - 모든 항목이 tabindex="0"
  - DOM 순서대로 Tab 이동

Active Descendant:
  - 컨테이너가 포커스 유지
  - aria-activedescendant로 현재 항목 표시
  - 가상 포커스 (실제 포커스는 컨테이너)
```

### 포커스 동작
```
Focus Trap (포커스 트랩):
  - 포커스가 특정 영역을 벗어나지 못함
  - 모달, 드로어 등에서 사용
  - Tab/Shift+Tab이 순환

Focus Restoration (포커스 복원):
  - 모달 닫을 때 이전 위치로 복원
  - 히스토리 관리

Focus Lock (포커스 잠금):
  - 배경 콘텐츠 포커스 불가
  - inert 속성 사용

Auto Focus (자동 포커스):
  - 마운트 시 자동으로 포커스
  - autofocus 속성 또는 focus() 호출

Focus Within (:focus-within):
  - 자식이 포커스 받았을 때 부모 스타일
```

---

## 🖱️ 포인터/마우스 이벤트

### 이벤트 종류
```
마우스 이벤트:
- mousedown: 버튼 누름
- mouseup: 버튼 뗌
- click: 클릭 (down + up)
- dblclick: 더블클릭
- contextmenu: 우클릭 메뉴
- mouseenter/mouseleave: 호버 시작/종료 (버블링 없음)
- mouseover/mouseout: 호버 (버블링 있음)
- mousemove: 마우스 이동
- wheel: 마우스 휠

포인터 이벤트 (통합):
- pointerdown/pointerup
- pointerenter/pointerleave
- pointermove
- pointercancel
- gotpointercapture/lostpointercapture

터치 이벤트:
- touchstart/touchend/touchmove/touchcancel
```

### 포인터 개념
```
Pointer Capture: setPointerCapture()로 이벤트 독점
Pointer Type: mouse/pen/touch
Primary Pointer: 첫 번째 접촉점
Multi-touch: 여러 접촉점 동시 처리
Touch Target: 터치 영역 (최소 44x44px)
Tap: 짧은 터치
Long Press: 긴 터치 (보통 500ms~)
Swipe: 스와이프 제스처
Pinch: 핀치 줌
Pan: 드래그 스크롤
```

### 드래그 앤 드롭
```
Drag Events:
- dragstart: 드래그 시작
- drag: 드래그 중
- dragend: 드래그 종료
- dragenter: 드롭존 진입
- dragover: 드롭존 위
- dragleave: 드롭존 이탈
- drop: 드롭

Draggable: draggable="true" 속성
Drop Zone: 드롭 가능 영역
Drag Handle: 드래그 핸들
Ghost Image: 드래그 중 표시 이미지
```

---

## 📋 선택 관리

### 선택 모드
```
None: 선택 없음
Single Selection: 단일 선택
  - Radio Button Pattern
  - Exclusive Selection
Multiple Selection: 다중 선택
  - Checkbox Pattern
  - Non-exclusive Selection
Range Selection: 범위 선택
  - Shift+Click
  - Contiguous Selection
Discontinuous Selection: 불연속 선택
  - Ctrl+Click
  - Non-contiguous Selection
```

### 선택 상태
```
Selected: 선택됨
Unselected: 선택 안됨
Indeterminate: 불확정 (부분 선택)
  - aria-checked="mixed"
  - 트리에서 일부 자식만 선택
```

### 선택 동작
```
Toggle: 토글 (선택 ↔ 해제)
Deselect: 선택 해제
Select All: 전체 선택
Clear Selection: 선택 초기화
Invert Selection: 선택 반전
Follow Focus: 포커스 따라 자동 선택
Manual Selection: 수동 선택 (Space/Enter)
Automatic Selection: 자동 선택 (포커스 시)
```

---

## 🔄 활성화 & 확장

### 활성화 (Activation)
```
Activate: 실행/활성화
  - 버튼 클릭
  - 링크 이동
  - 메뉴 아이템 실행
Pressed: 눌린 상태 (aria-pressed)
Active: :active 상태 (마우스 다운 중)
Current: 현재 항목 (aria-current)
```

### 확장 (Expansion)
```
Expand: 펼치기
Collapse: 접기
Toggle: 확장/축소 토글
Expanded: 확장됨 (aria-expanded="true")
Collapsed: 축소됨 (aria-expanded="false")
Accordion: 아코디언 패턴
Disclosure: 공개/숨김 위젯
Tree View: 트리 뷰
```

---

## 🎨 시각적 상태

### CSS 가상 클래스
```
:focus - 포커스 받음
:focus-visible - 키보드 포커스 (시각적 표시)
:focus-within - 자식이 포커스
:hover - 마우스 호버
:active - 마우스 다운 중
:disabled - 비활성
:enabled - 활성
:checked - 체크됨
:indeterminate - 불확정
:valid/:invalid - 유효성
:required/:optional - 필수/선택
:read-only/:read-write - 읽기 전용/편집 가능
```

### 시각적 피드백
```
Focus Ring: 포커스 링 (outline)
Focus Indicator: 포커스 표시
Selection Highlight: 선택 강조
Hover Effect: 호버 효과
Active State: 활성 상태 표시
Ripple Effect: 리플 효과 (Material)
Loading Indicator: 로딩 표시
  - Spinner
  - Progress Bar
  - Skeleton
Cursor: 커서 모양
  - pointer: 클릭 가능
  - grab/grabbing: 드래그 가능
  - text: 텍스트 입력
  - not-allowed: 비활성
  - move: 이동 가능
```

---

## 🧩 디자인 패턴

### WAI-ARIA 패턴
```
Button: 버튼
Link: 링크
Checkbox: 체크박스
Radio Group: 라디오 그룹
Switch: 스위치 (토글)
Tabs: 탭
Menu/Menubar: 메뉴/메뉴바
Listbox: 리스트박스
Combobox: 콤보박스
Tree View: 트리 뷰
Grid: 그리드
Toolbar: 툴바
Accordion: 아코디언
Disclosure: 공개/숨김
Dialog/Modal: 대화상자/모달
Alert/Alert Dialog: 알림
Breadcrumb: 브레드크럼
Carousel: 캐러셀
Feed: 피드
Slider: 슬라이더
Spinbutton: 스핀버튼
```

### 복합 패턴
```
Editable Grid: 편집 가능한 그리드
Tree Grid: 트리 그리드
Hierarchical Menu: 계층형 메뉴
Multi-level Navigation: 다단계 네비게이션
```

---

## 🔧 브라우저 API

### 포커스 API
```
element.focus(options)
  - preventScroll: 스크롤 방지
  - focusVisible: 포커스 표시 강제
element.blur()
document.activeElement
element.tabIndex
```

### Selection API
```
window.getSelection()
element.selectionStart/selectionEnd (input)
element.setSelectionRange()
Selection.getRangeAt()
Range API
```

### Mutation Observer
```
MutationObserver: DOM 변경 감지
  - childList: 자식 추가/제거
  - attributes: 속성 변경
  - characterData: 텍스트 변경
```

### Intersection Observer
```
IntersectionObserver: 요소 가시성 감지
  - 무한 스크롤
  - Lazy Loading
  - 스크롤 애니메이션
```

### Resize Observer
```
ResizeObserver: 크기 변경 감지
```

---

## 📐 레이아웃 & 스크롤

### 스크롤 개념
```
scrollIntoView(options)
  - behavior: 'auto' | 'smooth'
  - block: 'start' | 'center' | 'end' | 'nearest'
  - inline: 'start' | 'center' | 'end' | 'nearest'
  
Virtual Scrolling: 가상 스크롤
  - 보이는 영역만 렌더링
  - 성능 최적화

Infinite Scroll: 무한 스크롤
Pagination: 페이지네이션
```

### 레이아웃
```
Skip Link: 본문 바로가기 링크
Landmark: 랜드마크 (main, nav, aside 등)
Heading Structure: 제목 계층 (h1~h6)
Reading Order: 읽기 순서
Visual Order vs DOM Order: 시각적 순서 vs DOM 순서
```

---

## 🚫 비활성 & 숨김

### 비활성화
```
disabled: HTML 속성
  - 포커스 불가
  - 이벤트 차단
  - 폼 제출에서 제외
  
aria-disabled="true": ARIA
  - 포커스 가능 (제어 가능)
  - 이벤트 수동 차단 필요
  - 폼 제출에 포함
  
readonly: 읽기 전용
  - 포커스 가능
  - 수정 불가
  - 폼 제출에 포함
```

### 숨김
```
hidden: HTML 속성
  - display: none
  - 포커스 불가
  - 스크린 리더 무시

aria-hidden="true": ARIA
  - 시각적으로 보임
  - 스크린 리더만 무시
  - 포커스 가능 (수동 방지 필요)

inert: 관성 상태
  - 포커스 불가
  - 이벤트 차단
  - 스크린 리더 무시
  - 모달 배경에 사용

visibility: hidden: CSS
  - 공간 차지
  - 포커스 불가

opacity: 0: CSS
  - 투명
  - 포커스 가능
  - 스크린 리더 읽음
```

---

## 🎤 스크린 리더

### 스크린 리더 개념
```
Virtual Cursor: 가상 커서 모드
  - 읽기 모드
  - 키보드 다르게 동작
  
Focus Mode (Forms Mode): 포커스 모드
  - 입력 모드
  - 일반 키보드 동작
  
Browse Mode: 탐색 모드
Announcement: 공지/알림
Verbosity: 읽기 상세도
```

### 주요 스크린 리더
```
JAWS: Windows
NVDA: Windows (무료)
VoiceOver: macOS, iOS
TalkBack: Android
Narrator: Windows
Orca: Linux
```

---

## ⚙️ 이벤트 제어

### 이벤트 플로우
```
Capture Phase: 캡처 단계 (상위 → 하위)
Target Phase: 타겟 단계
Bubble Phase: 버블 단계 (하위 → 상위)

Event Delegation: 이벤트 위임
  - 부모에서 자식 이벤트 처리
  
stopPropagation(): 전파 중단
stopImmediatePropagation(): 즉시 전파 중단
preventDefault(): 기본 동작 방지
```

### 이벤트 옵션
```
passive: true
  - preventDefault() 불가
  - 스크롤 성능 향상
  
once: true
  - 한 번만 실행
  
capture: true
  - 캡처 단계에서 실행
```

### 합성 이벤트 (IME)
```
compositionstart: 입력 시작 (한글, 일본어 등)
compositionupdate: 입력 중
compositionend: 입력 완료
isComposing: 입력 중 여부
```

---

## 🎲 기타 개념

### 키보드 이벤트
```
event.key: 키 이름 ('Enter', 'a', 'ArrowUp')
event.code: 물리적 키 ('KeyA', 'Digit1')
event.keyCode: deprecated
event.repeat: 키 반복 여부
event.ctrlKey/shiftKey/altKey/metaKey: 수식 키
```

### 타이밍
```
Debounce: 연속 호출 방지 (마지막만)
Throttle: 주기적 실행 제한
Delay: 지연 실행
Timeout: 제한 시간
```

### 접근성 테스트
```
Keyboard Only: 키보드만으로 테스트
Screen Reader: 스크린 리더 테스트
Color Contrast: 색상 대비
Focus Order: 포커스 순서 확인
ARIA Validation: ARIA 검증
axe, WAVE: 자동화 도구
```

### 성능
```
Repaint: 다시 그리기
Reflow: 레이아웃 재계산
Composite: 합성
requestAnimationFrame: 애니메이션 프레임
requestIdleCallback: 유휴 시간
```

이 모든 용어들이 FocusGroup을 구현할 때 고려해야 할 것들이다. 어떤 영역을 더 깊이 파고들까?