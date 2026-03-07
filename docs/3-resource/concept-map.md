# Interactive OS — 숨겨진 개념의 전체 지도

> OS에 이미 존재하는 모든 패턴과 개념을, **개념의 크기가 대등하도록** 트리로 구조화한 것.
> ZIFT 4-프리미티브 이전에, "FE에서 정해진 패턴으로 다 만들 수 있다"는 명제의 구성요소를 전수로 나열한다.

---

## 트리 구조

```
Interactive OS
├── 1. Topology (공간 구조)
│   ├── Zone — 관할 영역 (listbox, grid, tablist, tree, menu, toolbar)
│   ├── Item — 탐색 단위 (focusable identity, spatial position)
│   ├── Hierarchy — 부모-자식 (tree, nested zones, subZones)
│   ├── Orientation — 배치 방향 (horizontal, vertical, grid=2D)
│   └── Boundary — 경계 행동 (wrap, stop, escape-to-parent)
│
├── 2. Navigation (공간 이동)
│   ├── Arrow Navigation — 방향키 이동 (↑↓←→, grid 2D)
│   ├── Tab Navigation — Tab/Shift+Tab 이동 (roving tabindex vs active descendant)
│   ├── Typeahead — 문자 입력으로 점프
│   ├── Home/End — 처음/끝 점프
│   ├── Page Up/Down — 페이지 단위 이동
│   └── Cross-Zone — Zone 간 이동 (Tab out, focus delegation)
│
├── 3. Focus (초점 시스템)
│   ├── Focus Tracking — 현재 focused item 추적
│   ├── Active Zone — 현재 활성 zone 추적
│   ├── Focus Stack — overlay 진입/탈출 (push/pop)
│   ├── Focus Recovery — item 삭제 시 이웃 복구
│   ├── Focus Sync — 가상 상태 → DOM 동기화
│   └── AutoFocus — zone 마운트 시 초기 포커스
│
├── 4. Selection (선택)
│   ├── Single Select — 포커스 = 선택 (follow focus)
│   ├── Multi Select — Space toggle, 독립 선택
│   ├── Range Select — Shift+Arrow, Shift+Click
│   ├── Select All — Ctrl+A
│   └── Selection Clear — Escape, 외부 클릭
│
├── 5. Activation (활성화)
│   ├── Enter Activate — 항목 실행 (link, button, open)
│   ├── Space Toggle — 체크박스, 스위치 토글
│   ├── Double-Click — 인라인 편집 진입
│   └── Context Menu — 우클릭/Shift+F10
│
├── 6. Field (속성 편집)
│   ├── Edit Lifecycle — start → edit → commit/cancel
│   ├── String Types — inline, tokens, block, editor (contentEditable)
│   ├── Boolean Type — switch, checkbox (OS_CHECK)
│   ├── Number Type — slider, spinbutton (OS_VALUE_CHANGE)
│   ├── Enum Type — combobox, select, radiogroup (???)
│   ├── IME Safety — 한글/일본어 조합 중 키 이벤트 차단
│   ├── Key Ownership — Field가 키를 소유할 때 vs Item이 소유할 때
│   ├── Deferred vs Immediate — select-then-edit vs edit-on-focus
│   └── Boundary Escape — 편집 중 커서가 끝에 도달하면 spatial nav으로 탈출
│
├── 7. Overlay (레이어)
│   ├── Dialog — modal focus trap, Escape 닫기
│   ├── AlertDialog — 확인 필요 modal
│   ├── Popover — 비모달 오버레이
│   ├── Menu — popup 메뉴, 중첩 가능
│   ├── Tooltip — hover/focus 정보 표시  
│   ├── Toast — 자동 해제 알림, aria-live
│   └── Dismiss — Escape, outside click 통합 해제
│
├── 8. Expansion (펼침/접힘)
│   ├── Tree Expand — 트리 노드 펼침/접힘
│   ├── Accordion — 단일/다중 패널 토글
│   ├── Disclosure — 단일 섹션 토글
│   └── Tabs — 탭 패널 전환
│
├── 9. Drag & Drop (물리적 이동)
│   ├── Reorder — 같은 리스트 내 순서 변경
│   ├── Move — Zone 간 이동 (Kanban 열 이동)
│   ├── Keyboard DnD — Alt+Arrow로 이동
│   └── Drop Position — before/after/inside 판단
│
├── 10. Clipboard (클립보드)
│   ├── Copy — Ctrl+C, 선택된 항목 복사
│   ├── Cut — Ctrl+X, 복사 + 삭제 마킹
│   ├── Paste — Ctrl+V, 붙여넣기 + 위치 결정
│   └── Paste Bubbling — 하위 zone에서 상위로 버블
│
├── 11. History (시간 여행)
│   ├── Undo — Ctrl+Z, 이전 상태 복원
│   ├── Redo — Ctrl+Shift+Z, 복원 취소
│   ├── Noise Filtering — 탐색 등 비의미 행위 필터
│   └── Housekeeping Silence — 시스템 정리 동작 기록 제외
│
├── 12. Data (데이터 구조)
│   ├── Entity — id를 가진 데이터 단위
│   ├── Collection — Entity의 정규화된 집합 (byId + allIds)
│   ├── Tree — 부모-자식 관계 (parentId, childIds)
│   ├── Flat List — 순서가 있는 1차원 목록
│   ├── Grid — 2차원 배열 (rows × columns)
│   ├── View Transform — filter, sort, group, search, pagination
│   └── Master-Detail — 선택 → 상세 연동
│
├── 13. CRUD (데이터 조작)
│   ├── Create — 항목 추가 (add, insert, duplicate)
│   ├── Read — 항목 조회 (select → detail, search, filter)
│   ├── Update — 항목 수정 (Field edit, toggle, value change)
│   ├── Delete — 항목 삭제 (remove, bulk delete, soft delete + undo)
│   └── Reorder — 순서 변경 (drag, move up/down)
│
├── 14. Command (명령 시스템)
│   ├── Command Type — 이름이 있는 의도 단위 (OS_NAVIGATE, OS_DELETE 등)
│   ├── Command Scoping — 앱 단위 격리, Zone 단위 관할
│   ├── Command Dispatch — kernel.dispatch(command) 단일 경로
│   ├── Command Handler — state → nextState 순수 함수
│   ├── Condition Guard — 커맨드 실행 조건 (when)
│   └── App Command vs OS Command — 앱 고유 vs OS 보편
│
├── 15. Pipeline (처리 흐름)
│   ├── P1 Sense — 물리 이벤트 캡처 (keyboard, mouse, pointer, clipboard)
│   ├── P2 Intent — 키/이벤트 → 의미적 커맨드 매핑 (keymap resolution)
│   ├── P3 Resolve — 컨텍스트 기반 순수 계산 (next state)
│   ├── P4 Commit — 상태 원자적 적용 (kernel dispatch)
│   ├── P5 Sync — 가상 → 물리 동기화 (FocusSync)
│   └── P6 Audit — 포커스 무결성 사후 검증
│
├── 16. ARIA (접근성 투영)
│   ├── Role — 의미적 역할 선언 (listbox, treeitem, textbox, button...)
│   ├── State — 동적 상태 투영 (aria-selected, aria-expanded, aria-checked...)
│   ├── Property — 정적 관계 선언 (aria-labelledby, aria-describedby...)
│   ├── Live Region — 동적 알림 (aria-live, alert, status)
│   └── Landmark — 페이지 구조 (navigation, main, complementary)
│
├── 17. App Framework (앱 프레임워크)
│   ├── defineApp — 앱 정의의 유일한 진입점
│   ├── State — 앱 고유 상태 (initialState)
│   ├── Selector — 상태 파생 (state → T)
│   ├── Condition — 상태 조건 (state → boolean)
│   ├── Zone Handle — zone 생성 + bind
│   ├── Bind — zone ↔ 커맨드/키바인딩 연결
│   ├── Modules — 플러그인 시스템 (history, persistence, deleteToast)
│   └── TestInstance — headless 테스트 인스턴스
│
└── 18. Verification (검증)
    ├── HeadlessPage — Playwright 동형 headless API
    ├── Headless Compute — DOM 없는 속성 계산 (computeItem, computeAttrs)
    ├── Headless Simulate — DOM 없는 상호작용 시뮬레이션
    ├── Spatial Test — 공간 탐색 자동 검증
    └── Inspector — 런타임 시각적 검증 (인간용)
```


> 이 트리는 순수 개념 목록이다. ZIFT 모델과의 매핑은 `usage-spec-builder.md`에서 다룬다.
