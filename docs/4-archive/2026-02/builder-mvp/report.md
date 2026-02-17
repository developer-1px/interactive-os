# Builder MVP — 개밥먹기 보고서

> 2026-02-16
> Todo 앱의 `defineApp` v5 패턴(createZone + bind)을 Builder(CMS) 도메인에 적용한 결과.

---

## 1. 구조적 차이: Todo vs Builder

| 축 | Todo | Builder |
|----|------|---------|
| **상태 구조** | 엔티티 맵 `todos: Record<id, Todo>` | flat 맵 `fields: Record<name, string>` |
| **Zone 수** | 5 (list, sidebar, draft, edit, toolbar) | 1 (canvas) |
| **Zone role** | listbox, textbox, toolbar | grid |
| **Navigation** | 1D (↑↓) | 2D spatial (↑↓←→, corner) |
| **편집 패턴** | editingId 토글 → Field mount/unmount | onCommit 콜백 (Field 항상 존재) |
| **패널** | 없음 | PropertiesPanel (선택 요소 속성 편집) |
| **Command 수** | 14+ | 2 (updateField, selectElement) |

## 2. createZone + bind 패턴 적합성 평가

### ✅ 적합

| # | 항목 | 근거 |
|---|------|------|
| 1 | `createZone + zone.command` 시그니처 | flat handler `(ctx, payload) => result`가 Todo(엔티티 CRUD)와 Builder(key-value 업데이트) 모두에서 자연스러움 |
| 2 | `zone.bind({ role: "grid" })` | role만 바꾸면 listbox → grid 전환 완료. OS가 알아서 spatial nav 제공 |
| 3 | 테스트 인스턴스 (`BuilderApp.create()`) | Todo와 동일한 `app.dispatch.commandName()` + `app.select.selectorName()` API로 Builder 상태 검증 |
| 4 | `BoundComponents.Zone` 패턴 | `<TodoList.Zone>` → `<BuilderCanvasUI.Zone>` 동일 사용법 |

### ⚠️ 마찰 발견

| # | 마찰점 | 상세 | 제안 |
|---|--------|------|------|
| 1 | **v3 compat alias 필요** | 기존 코드가 `BuilderCanvas.Zone`, `BuilderCanvas.commands.updateField`를 사용. `createZone + bind` 전환 후 `BuilderCanvasUI = canvasZone.bind(...)` + `BuilderCanvas = { ...BuilderCanvasUI, commands }` 형태로 래핑 필요 | Todo도 동일 (`TodoListUI = listZone.bind(...)`, `TodoList = { ...TodoListUI }`). Alias는 v3→v5 마이그레이션에서 불가피 |
| 2 | **`builderUpdateField` 헬퍼** | NCP 블록들이 `OS.Field onCommit` 콜백에서 직접 호출. zone.command로 dispatch하지 않고 `BuilderApp.setState()`로 우회 | `onCommit`이 콜백 기반이므로 command dispatch 불가. `setState` 직접 호출이 현실적. 향후 `OS.Field`가 command 기반 onCommit을 지원하면 해소 |
| 3 | **Zone bind에 `onAction` 미설정** | Enter(ACTIVATE)가 Builder에서 아무 동작도 안 함. 그러나 적합한 ACTIVATE 대상도 없음(편집은 F2) | Grid role에서 Enter=ACTIVATE가 적절한 행동인지 재검토 필요. Link/Button 요소 클릭은 마우스로만? |

## 3. OS.Field 인라인 편집의 마찰점

| # | 마찰점 | 상세 |
|---|--------|------|
| 1 | **`data-editing` 속성 미동기화** | `FIELD_START_EDIT`가 kernel의 `editingItemId`를 설정하지만, Field 컴포넌트의 `data-editing`은 FieldRegistry.state.isEditing 기반. 두 상태가 동기화되지 않음 |
| 2 | **F2 진입 인지 어려움** | 사용자가 F2로 편집 진입하는 OS 패턴을 알기 어려움. CMS 도메인에서는 Enter 또는 더블클릭이 편집 진입으로 기대됨 |
| 3 | **onCommit vs onSubmit 이원화** | `FIELD_COMMIT`은 `onSubmit` 경로만 처리. `onCommit`(콜백)은 별도 경로. 한 필드에 둘 다 설정하면 혼란 |

## 4. 패널 동기화 패턴의 자연스러움

### ✅ 매우 자연스러움

```
캔버스 수정:  OS.Field onCommit → builderUpdateField() → BuilderApp.setState()
패널 수정:    textarea onChange → builderUpdateField() → BuilderApp.setState()
패널 읽기:    BuilderApp.useComputed((s) => s.data.fields[selectedId])
캔버스 읽기:  BuilderApp.useComputed((s) => s.data.fields)
```

**동일한 state + 동일한 updater** = **자연스러운 양방향 동기화**. React의 단방향 데이터 흐름 덕분.

- `builderUpdateField`가 단일 진입점 역할을 하여, 캔버스/패널 어디서든 수정해도 같은 state가 갱신됨
- `useComputed`로 구독하면 어디서든 자동 반영
- 추가 동기화 코드 불필요

### ⚠️ 개선점

- 패널에서 textarea `onChange` 사용 → 모든 키 입력에 state 업데이트. 대규모 필드에서 성능 문제 가능
- `mode="deferred"` + debounce 패턴이 패널에도 필요할 수 있음

## 5. defineApp API 개선 제안

| # | 제안 | 이유 | 우선순위 |
|---|------|------|---------|
| 1 | **`OS.Field` command-based onCommit** | `onCommit` 콜백 대신 `updateField` command를 직접 연결하면 `builderUpdateField` 헬퍼 불필요. `zone.bind({ field: { onCommit: updateField } })` 패턴 | 중 |
| 2 | **`data-editing` ↔ kernel editingItemId 동기화** | FieldRegistry.isEditing과 kernel.editingItemId 이원화 해소 | 중 |
| 3 | **Grid role에서 Enter → edit 지원** | CMS 도메인에서 F2보다 Enter가 직관적. `zone.bind` 옵션으로 `{ onAction: "startEdit" }` 내장 지원 | 낮 |
| 4 | **`createZone` 결과에 `.commands` 자동 연결** | v3 compat alias를 매번 수동으로 만들어야 하는 번거로움 해소 | 낮 |

## 6. 테스트 커버리지 결과

| 범주 | 이전 | 이후 | 차이 |
|------|------|------|------|
| Unit 테스트 | 23개 | 23개 | 유지 (createZone 전환 호환) |
| Spatial E2E | 10개 | 10개 | 유지 |
| Editing E2E | 0개 | 2개 | +2 (F2 진입 + Escape 취소) |
| Panel Sync E2E | 0개 | 3개 | +3 (선택→표시, 패널→캔버스, 전환) |
| **총 E2E** | **10개** | **15개** | **+5** |

## 7. 결론

**defineApp v5 (createZone + bind) 패턴은 CMS/Builder 도메인에서도 자연스럽게 작동한다.**

핵심 검증 포인트별 결과:

| # | 질문 | 답 |
|---|------|----|
| 1 | createZone + bind가 grid 도메인에서 통하는가? | ✅ role만 바꾸면 끝 |
| 2 | flat handler가 key-value 업데이트에 적합? | ✅ Todo와 동일한 자연스러움 |
| 3 | onAction이 인라인 편집 트리거로 작동? | ⚠️ Enter=ACTIVATE, 편집은 F2 (OS 표준) |
| 4 | 패널↔캔버스 같은 커맨드 공유가 자연스러운가? | ✅ 매우 자연스러움 |
| 5 | OS.Field의 onCommit이 CMS에 충분한가? | ⚠️ 작동하지만, command 기반이면 더 깔끔 |
