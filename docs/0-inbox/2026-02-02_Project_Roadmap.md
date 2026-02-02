# 2026-02-02 프로젝트 아키텍처 개선 로드맵

현재 프로젝트 상태와 분석 문서를 기반으로 수립한 아키텍처 개선 및 기능 고도화 로드맵입니다.

## 🚀 Phase 1: 아키텍처 위생 관리 (App/OS 분리)
기술 부채를 해결하고, 시스템의 유연성을 확보하기 위한 구조적 개선입니다.

- [x] **키바인딩 분리 (Keybinding Separation)**
    - `todo_commands.ts` 등 커맨드 정의 파일에서 하드코딩된 `kb` 속성 제거
    - `src/lib/todo_keys.ts`를 `KeybindingItem[]` 기반의 Source of Truth로 리팩토링 완료
    - 커맨드는 '무엇을 할지'만 정의, OS가 '언제 실행할지' 결정하도록 분리

- [x] **View 종속 가드 제거 (Logic/View Decoupling)**
    - `cursorAtStart`와 같은 DOM 종속적 조건을 커맨드 정의(`when` 절)에서 제거
    - `src/lib/todo_keys.ts`의 Keybinding 조건(`when`)으로 이동하여 OS Layer에서 처리

## 🛠 Phase 2: 표준 시스템 고도화 (History & Clipboard)
사용자 경험(UX)과 직결되는 필수 표준 기능을 구현합니다.

- [ ] **History 트랜잭션 (Unified Undo/Redo)**
    - [x] **History Flooding 방지**: `log: false` 커맨드(예: `SYNC_DRAFT`)가 히스토리를 오염시키지 않도록 엔진 레벨에서 필터링 적용
    - [x] **Transaction Support**: `groupId` 필드를 통해 연관된 여러 커맨드를 한 번에 Undo 하는 기능 구현 완료 (`todo_engine.tsx`)

- [x] **클립보드 시스템 (Clipboard Interop)**
    - [x] **ClipboardManager 컴포넌트**: Native `Copy`/`Paste` 이벤트를 가로채어 엔진과 연동하는 Headless 컴포넌트 구현 (`src/os/ClipboardManager.tsx`)
    - [x] **ImportTodos 커맨드**: 외부 텍스트나 JSON 데이터를 대량으로 삽입하는 로직 구현 (` IMPORT_TODOS`)
    - [x] **Serialization**: Todo 아이템을 JSON 및 Plain Text로 직렬화하여 클립보드에 복사

## 🧹 Phase 3: 레지스트리 및 문법 정비
코드 베이스의 일관성과 유지보수성을 높입니다.

- [x] **Registry 리팩토링**
    - `CONSTITUTION`, `SIDEBAR` 등으로 파편화된 리지스트리를 `UNIFIED_TODO_REGISTRY`로 통합
    - `todo_engine.tsx`에서 단일 레지스트리를 참조하도록 변경하여 초기화 로직 단순화
    - 단일 진실 공급원(Single Source of Truth) 확보

- [x] **Logic Expect 문법 표준화**
    - 테스트와 비즈니스 로직 정의에 사용되는 `expect` 문법 통일 (`Expect('isEditing').toBeFalsy()` 등)
    - `todo_commands.ts`의 주요 커맨드에 적용 완료
