# BOARD — builder-usage-cleanup

## 🔴 Now
- [ ] T4: Private API 캡슐화 — `_getClipboardPreview`, `_setTextClipboardStore` → Facade 메서드
  - `navigator.clipboard.writeText` → OS Bridge 패턴 적용
  - Cynefin: Complicated
- [ ] T5: FocusDebugOverlay 범용화 — `apps/builder/` → `os/` 또는 inspector 모듈
  - `os.getState()` 직접 접근 → 전용 hook 전환
  - Cynefin: Complicated
- [ ] T6: OS Clipboard 범용 패턴 추출 — text/structural 이중 모드 정식화
  - createCollectionZone에서 textCopy/structuralCopy 분리
  - why-clipboard.md 갱신
  - Cynefin: Complex (T4/T5 완료 후 패턴 발견)

## ⏳ Done
- [x] T1: Dead Code 제거 — `SectionEntry` deprecated type 삭제, EditorToolbar Undo/Redo 연결 (02-21)
- [x] T2: `CANVAS_ZONE_ID` 불일치 해소 — "builder-canvas" → "canvas" 통일 (02-21)
- [x] T3: `data-builder-type` → OS item query로 전환 (02-21)
  - `selectElement` command 제거
  - `selectedId`/`selectedType` selectors 제거
  - `BuilderState.ui` 필드 제거
  - BuilderPage.tsx DOM 추론 코드 38줄 제거
  - PropertiesPanel → `useFocusedItem` + `getItemAttribute` 직접 쿼리
  - Builder.Section에 `data-builder-type="section"` 추가
  - 관련 테스트 정리 (65→57 tests, ui 복제본 테스트 8건 삭제)
  - `os` 미사용 import 제거 (BuilderPage.tsx)

## 💡 Ideas
- PropertiesPanel의 `os.dispatch()` 반복 → `BuilderApp.dispatch()` 래퍼로 축소
- `getBuilderState()` → `BuilderApp.getState()` 전환
- cross-app clipboard (빌더 ↔ 다른 앱) — T6 이후 별도 프로젝트
