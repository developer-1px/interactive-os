# seal-useComputed

## Context

Claim: `os.useComputed`를 앱 레벨(src/)에서 호출할 필요가 없는 구조로 전환한다.

Before → After:
- Before: 앱이 `os.useComputed(s => s.os.path)` 직접 호출 (10곳). LLM pre-trained habit(Redux useSelector)과 동형 → Pit of Success 파괴
- After: OS 상태 = accessor hook 경유만 허용. 앱 상태 = app.useComputed(selector). `src/`에서 os.useComputed 직접 호출 0건

핵심 논거:
- Goodhart's Law: "LLM 친화적" 설계가 오히려 환각의 원인
- Trigger prop-getter 선례: hook이 필요 없는 구조 > hook을 숨기는 것
- 이 세션 실증: AI가 만든 ModalPortal이 useOverlay 대신 os.useComputed 직접 호출

Risks:
- Inspector는 OS 전체 상태를 읽어야 함 → @os-react/internal 경로로 예외
- 새 OS 상태 축마다 accessor hook 추가 필요

## Now

## Done
- [x] T1: accessor hook 4개 신규 — useEditingItem, useZoneValue, useNotifications, useActiveZone — tsc 0 ✅
- [x] T2: 기존 hook 교체 5곳 — QuickPick→useOverlay, LocaleSwitcher→useOverlay, SectionSidebar→useDragState, EditorToolbar(focusedItemId)→useFocusedItem, ToastContainer→useNotifications — tsc 0 ✅
- [x] T3: 신규 hook 교체 5곳 — BuilderCursor, EditorToolbar(editingItemId), BuilderPage, WindowSplitter, SliderMultiThumb — tsc 0 ✅
- [x] T4: contract-checklist 갱신 — os.useComputed 금지 패턴 + accessor hook 수정 대응표 추가 ✅
- [x] T5: rules.md 원칙 추가 — "Pit of Success = 잘못 쓰기 어려운 API" + Goodhart's Law ✅

## Unresolved
