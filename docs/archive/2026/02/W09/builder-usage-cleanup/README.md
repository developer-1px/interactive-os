# builder-usage-cleanup — Builder Usage 정리 + OS Clipboard 범용화 선행

## WHY

`/doubt` 분석(2026-02-21)에서 Builder app의 usage 패턴에 구조적 문제 12건이 발견되었다.
최종 목적은 **clipboard에 관하여 OS가 범용으로 제공할 수 있는 것들을 발견하고 정식화**하는 것이지만,
현재 코드가 private API 누수, 복제본 동기화, DOM 직접 접근 등으로 오염되어 있어
정리 없이는 범용 패턴을 추출할 수 없다.

**"더러운 코드에서 보편 패턴을 추출하면, 더러움까지 보편화된다."**

## Goals

1. **🔴 Dead code 제거** — `SectionEntry` deprecated type, EditorToolbar 미연결 Undo/Redo
2. **🟡 복제본 동기화 제거** — `ui.selectedId/selectedType` → OS item attribute + query로 대체
3. **🟡 Private API 캡슐화** — `_getClipboardPreview`, `_setTextClipboardStore` → Facade 확장
4. **🟡 DOM 직접 접근 제거** — BuilderPage.tsx type 추론 → `data-builder-type` 선언적 속성
5. **🟡 FocusDebugOverlay 범용화** — Builder 전용 → OS inspector 모듈로 이동
6. **🔍 OS Clipboard 범용 패턴 발견** — 정리 후 clipboard Facade에서 text/structural 이중 모드 추출

## Scope

- `src/apps/builder/` — app.ts, model/appState.ts, FocusDebugOverlay.tsx
- `src/pages/builder/` — BuilderPage.tsx, PropertiesPanel.tsx, EditorToolbar.tsx
- `src/os/collection/` — createCollectionZone Facade 확장
- `src/os/1-listen/clipboard/` — ClipboardListener 정리

## 관련 문서

- [/doubt 분석 결과](../../0-inbox/) (이 세션에서 생성)
- [builder-clipboard PRD](../builder-clipboard/prd.md)
- [why-clipboard](../../official/os/why-clipboard.md)
- [static clipboard bug](../../0-inbox/2026-0220-2211-report-divide-static-clipboard-bug.md)
