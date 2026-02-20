# /doubt 분석 — Builder App Usage

> 2026-02-21 00:31 | `/doubt` Round 1 (수렴: 분석만)

## 발견 요약

### 🔴 제거 확정 (2건)
1. **`SectionEntry` type alias** — deprecated, 외부 사용 0건
2. **EditorToolbar Undo/Redo 버튼** — onClick 미연결, 시각만 존재 (결함)

### 🟡 재설계/축소 후보 (10건)
3. **`ui.selectedId/selectedType` 복제본** — OS focus state 복제. Rule #11 위반
4. **`selectElement` command** — 복제 동기화 커맨드
5. **Focus→selectElement 동기화 코드** — DOM 직접 접근 (document.getElementById, el.tagName)
6. **`getBuilderState()`** — os.getState() 직접 접근 (Hollywood Principle 위반)
7. **`_getClipboardPreview`/`_setTextClipboardStore`** — Private API 누수
8. **`navigator.clipboard.writeText`** — Browser API 직접 호출 (OS Bridge 미사용)
9. **`FocusDebugOverlay`** — 273줄 범용 도구가 Builder에 묶여 있음
10. **PropertiesPanel의 `os.dispatch()` 반복** — 11회 직접 호출
11. **`CANVAS_ZONE_ID` 불일치** — "canvas" vs "builder-canvas"
12. **DOM type 추론** — el.tagName, el.querySelector("svg") 등

### 🟢 유지 (8건)
- `useSectionFields`, `useFieldByDomId`, `updateFieldByDomId`, `updateField`
- `resolveFieldAddress`, `createFieldCommit`, sidebarCollection, BuilderCanvasUI

## 핵심 구조적 문제

### #1 복제본 동기화 안티패턴
OS focus가 이미 focusedItemId를 가지고 있는데, 앱이 `selectedId/selectedType`을 별도로 복제.
`data-builder-type` attribute를 선언하면 OS item query로 해결 가능.

### #2 Private API Leak
`_` 접두어 함수를 앱이 직접 호출 → Facade 경계 위반.

### #3 FocusDebugOverlay 위치
Builder 전용일 이유가 없는 범용 도구. OS inspector로 이동 가능.
