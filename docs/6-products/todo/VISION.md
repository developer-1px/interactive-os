# Product Vision — Todo

> Interactive OS의 벤치마크 앱. OS의 defineApp API를 처음 검증한 첫 번째 프로덕션 앱.

## Vision

**OS의 모든 기본 인터랙션 패턴을 증명하는 레퍼런스 구현.**
Entity CRUD, 키보드 네비게이션, 클립보드, Undo/Redo — "이 OS 위의 앱은 이렇게 만든다"의 정답지.

## Target Group

- **Primary**: Interactive OS로 앱을 만들려는 개발자
  - defineApp, createZone, bind 사용법의 실동작 레퍼런스가 필요한 사람
  - "이 OS에서 CRUD 앱은 어떻게 만드나?"에 대한 답

- **Secondary**: OS 개발자 자신
  - 새 OS 기능이 기존 앱을 깨뜨리지 않는지 확인하는 리트머스 테스트

## Needs

1. **Entity CRUD** — 할 일 생성, 수정, 삭제, 완료 토글
2. **키보드 우선** — 모든 동작이 키보드만으로 수행 가능
3. **클립보드** — 복사/잘라내기/붙여넣기 + OS 클립보드 연동
4. **실수 복구** — Undo/Redo
5. **분류** — 카테고리별 할 일 분류 + 필터링
6. **접근성** — WAI-ARIA listbox, toolbar, textbox 패턴 완전 준수

## Product

### 핵심 기능

| 기능 | 설명 |
|------|------|
| **5-Zone 아키텍처** | list(listbox), sidebar(listbox), draft(textbox), edit(textbox), toolbar |
| **Collection CRUD** | `createCollectionZone` + `fromEntities` 패턴으로 추가/삭제/복제/이동 |
| **Clipboard** | 구조적 복사(Todo 객체) + OS 클립보드 연동 |
| **Inline Editing** | Enter → startEdit → Field 자동 포커스, Enter(저장)/Escape(취소) |
| **Undo/Redo** | `{ history: true }` + `createUndoRedoCommands` 자동 설정 |
| **Category Sidebar** | 카테고리 선택 → 리스트 필터링, 카테고리 순서 이동 |
| **Condition Guards** | `canUndo`, `isEditing`, `hasClipboard` — 조건부 커맨드 실행 |
| **Trigger Components** | `createTrigger` — 선언적 UI 바인딩 (버튼, 체크박스) |

### OS 검증 포인트

| OS Primitive | Todo에서의 사용 |
|-------------|----------------|
| defineApp | 앱 정의, 상태 관리, 셀렉터 |
| createZone + bind | 5개 Zone × 5가지 role |
| Collection Zone | Entity CRUD + ordering |
| Clipboard | 구조적 복사/잘라내기/붙여넣기 |
| Undo/Redo | History middleware |
| Conditions | 커맨드 실행 가드 |
| Field | draft input, edit input |
| Keybindings | Zone 레벨 키보드 바인딩 |
| ARIA | listbox, toolbar, textbox 자동 적용 |

## Business Goals

1. **OS API의 첫 번째 증명** — defineApp이 실제 앱에서 자연스럽게 동작함을 증명
2. **레퍼런스 코드** — 다른 앱 개발 시 참조할 수 있는 정답지
3. **회귀 테스트** — OS 변경이 앱을 깨뜨리지 않는지 확인하는 가장 빠른 테스트 대상

## Non-Goals

- ❌ 실사용 Todo 앱 (일정 관리, 알림, 동기화 등)
- ❌ 복잡한 UI (drag & drop, 칸반 뷰 등)
- ❌ 백엔드 연동 / 영속성 (로컬 state만)

## Now / Next / Later

### 🔴 Now — 안정화

- Multi-select (Shift+Arrow) 패턴 안정화
- Collection Zone v2 facade 적용

### 🟡 Next — 패턴 확장

- Board 뷰 (칸반 레이아웃)
- Dialog 패턴 (삭제 확인)
- 검색/필터링

### 🔵 Later — 고급 기능

- 서브태스크 (nested entity)
- 마감일/우선순위
- 로컬 영속성 (localStorage/IndexedDB)

---

_Format: [Product Vision Board](https://www.romanpichler.com/tools/product-vision-board/) (Roman Pichler) + [Now/Next/Later Roadmap](https://www.prodpad.com/blog/invented-now-next-later-roadmap/) (Janna Bastow)_
