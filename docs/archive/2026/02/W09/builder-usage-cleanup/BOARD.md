# BOARD — builder-usage-cleanup

## ⏳ Done
- [x] T1: Dead Code 제거 — `SectionEntry` deprecated type 삭제, EditorToolbar Undo/Redo 연결 (02-21)
- [x] T2: `CANVAS_ZONE_ID` 불일치 해소 — "builder-canvas" → "canvas" 통일 (02-21)
- [x] T3: `data-builder-type` → OS item query로 전환 (02-21)
  - `selectElement` command 제거
  - `selectedId`/`selectedType` selectors 제거
  - `BuilderState.ui` 필드 제거
  - BuilderPage.tsx DOM 추론 코드 38줄 제거
  - PropertiesPanel → `useFocusedItem` + `getItemAttribute` 직접 쿼리
- [x] T4: Private API 캡슐화 (02-21)
  - `_setTextClipboardStore` → `setTextClipboard` (public)
  - `_getClipboardPreview` → `getClipboardPreview` (public)
  - `navigator.clipboard.writeText` → `clipboardWrite` effect (OS 위임)
- [x] T5: `FocusDebugOverlay` → `BuilderCursor` 이름 변경 (02-21)
  - Builder 전용 UI 기능. 커서 대체 역할을 반영하는 이름으로 변경.
- [x] T6: OS Clipboard 범용 패턴 정식화 (02-21)
  - why-clipboard.md v2: 3 Universal Rules + Dual Mode + clipboardWrite effect 규약
  - Working Draft → Candidate Recommendation 승격

## ❌ Cancelled
- (없음)

## 💡 Ideas
- PropertiesPanel의 `os.dispatch()` 반복 → `BuilderApp.dispatch()` 래퍼로 축소
- `getBuilderState()` → `BuilderApp.getState()` 전환
- cross-app clipboard (빌더 ↔ 다른 앱) — 별도 프로젝트
