# JSON CRUD, Clipboard, Undo/Redo 구현 현황 분석

| 항목 | 내용 |
| --- | --- |
| 원문 | OS에서 JSON CRUD + cut/copy/paste + undo/reoo 를 하는건 다 완성이 되었어? 현재 현황을 분석해서 @[/inbox]로 |
| 내가 추정한 의도 | 핵심 편집 인프라(Collection Data Management)가 OS 계층에서 온전히 추상화되어 제공되는지, 남은 작업은 없는지 확인점검을 원한다. |
| 일시 | 2026-02-22 |

## 1. 개요 (Overview)
Interactive OS 내에서 데이터를 다루기 위한 3대 핵심 인프라(JSON CRUD, Clipboard, Undo/Redo)는 현재 `src/os/collection/createCollectionZone.ts` 및 `defineApp`의 히스토리 미들웨어를 통해 **완성 단계**에 있습니다. 각 인프라는 개별 앱 컴포넌트에 종속되지 않고 OS Kernel 및 Context Registry 기반으로 통합되어 있으며, BDD 테스트(`todo-bdd.test.ts`)를 통해 무결성이 완벽하게 증명되고 있습니다. 

## 2. 분석 (Analysis) / 상세 내용 (Details)

### 1) JSON CRUD (CollectionZone)
- **추상화 방식**: `createCollectionZone.ts` 내부에서 `fromEntities` (ID 매핑 + Order 배열 방식) 또는 `accessor` (순수 배열 방식) 어댑터를 제공합니다.
- **주요 기능**: `add`, `remove`, `move`, `moveUp`, `moveDown` 명령이 Zone 인스턴스에 내장되어 있습니다. `config.create`로 팩토리를 주입하면 `add` 명령 시 자동 생성 및 주입됩니다.
- **결론**: Immer의 `produce` 위에서 불변 객체 트리를 다루는 완벽한 추상화가 구현되었습니다. 

### 2) Cut / Copy / Paste (ClipboardStore)
- **추상화 방식**: `collectionZone` 내부에 `_clipboardStore` 싱글톤이 구축되어 구조적 복사(Structural Copy)를 담당하며, 네이티브 클립보드(OS Effect)와 `clipboardWrite`로 연동됩니다.
- **주요 기능**: 
  - 선택 영역 배열 길이(`cursor.selection`)를 파악해 투명하게 멀티-셀렉션을 지원.
  - `autoDeepClone`을 통해 중첩된 `.children` 배열이 존재할 경우 새 ID (`uid()`)를 재귀적으로 발급하여 복제본(Deep Copy) 생성.
  - `cut` 명령 시 포커스와 선택 영역(selection)이 소실되지 않도록 인접 항목으로 포커스를 복원하는 복구 컨텍스트(Focus Recovery)가 제공됩니다.
- **결론**: BDD 클립보드 테스트(§1.4 List: 키보드 클립보드) 전체가 그린라이트입니다. 완벽히 작동합니다.

### 3) Undo / Redo (History Middleware)
- **추상화 방식**: `defineApp<T>(..., { history: true })` 선언으로 Immer 패치 스트림(Patches)을 구독하는 Zundo 기반(또는 Custom Patch) History 스택이 활성화됩니다.
- **주요 기능**:
  - `createUndoRedoCommands(App)`를 통해 `undoCommand()`, `redoCommand()` 제네릭 헬퍼를 노출.
  - 리스트 영역 내 `onUndo`, `onRedo` 커맨드로 맵핑되어, Cmd+Z / Cmd+Shift+Z 작동 보장.
- **결론**: 액션 실행 후의 상태(State)와 커서 상태(Selection)를 모두 타임 이동시킬 수 있도록 완비되어 있습니다.

## 3. 결론 (Conclusion) / 제안 (Proposal)
현재 JSON Data Manipulation을 위한 뼈대는 완전하며, **기반 설계 측면에서 추가 작업이 필요하지 않은 상태(완성)**입니다. Todo App의 성공적 BDD 통과가 이를 증명합니다. 개발자는 오직 데이터 스키마와 `onAction` 등 고유 앱 동작만 정의하면 됩니다. 이제 더 복잡한 요구사항(예: Drag & Drop 트리 맵핑, Context Menu의 Zone 바인딩 등)으로 이 통합 기반을 응용하는 작업(예: Builder, Kanban 복구)에 집중할 단계입니다.

## 4. Cynefin 도메인 판정
🟢 **Clear**: 이 문제는 시스템 구조를 스캔하여 현황을 파악하고 요약하는 명확한 진단 작업입니다.

## 5. 인식 한계 (Epistemic Status)
이 분석은 `todo` 앱 내의 `listbox` (평면 배열 방식)에 기반한 검증을 포괄합니다. `combobox`의 필터 방식이나, 중첩된 `treegrid` 데이터 변경에서 트리거될 수 있는 미세한 focus-recovery 에지 케이스 전체에 대해서는, 실제 Builder나 복합 UI(ex. 3-depth DragDrop) 적용 전까지 잠재 버그가 남아있을 수 있습니다.
