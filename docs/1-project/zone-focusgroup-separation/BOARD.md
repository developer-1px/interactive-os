# BOARD — zone-focusgroup-separation

> Phase: Heavy | Created: 2026-02-23

## Done

- [x] D0: Discussion 완료 — Zone/FocusGroup 이름·책임 경계 확정
- [x] D1: PRD 작성 완료
- [x] T1: Slot 유틸 구현 — skip (FocusItem에 cloneElement 패턴 이미 존재)
- [x] T2: Context 분리 — ZoneContext + FocusContext ✅
  - useZoneContext() + useFocusContext() 신규. useFocusGroupContext() deprecated shim.
- [x] T3: Zone.tsx 재작성 — 합성점, OS_ZONE_INIT, ZoneContext ✅
  - `FOCUS_GROUP_INIT` → `OS_ZONE_INIT` 리네이밍 + 별도 파일 추출
  - Zone이 zoneId 생성, OS_ZONE_INIT dispatch, ZoneContext 제공
- [x] T4: FocusGroup.tsx headless 전환 ✅
  - `headless` + `containerRef` props. Zone renders div, FocusGroup context-only.
  - Standalone FocusGroup (aria-showcase) backward compat 유지.
- [x] T6: `data-focus-group` → `data-zone` (22곳 전수 변경) ✅
- [x] T7: 앱 마이그레이션 — defineApp이 Zone 자동 wrapper 제공, 변경 불필요 ✅
- [x] T8: 테스트 검증 — 919/919 전수 통과 ✅

## Ideas

- T5: ZoneEntry 슬롯 구조 변경 → DnD 도입 시점에
- ZoneState 내부 capability 슬롯 분리 (focus slice, dnd slice) → DnD 도입 시점에
- aria-showcase의 FocusGroup 직접 사용을 Zone으로 점진 마이그레이션
