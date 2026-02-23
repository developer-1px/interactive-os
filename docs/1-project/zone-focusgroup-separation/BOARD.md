# BOARD — zone-focusgroup-separation

> Phase: Heavy | Created: 2026-02-23

## Now

- [x] T1: Slot 유틸 구현 — skip (FocusItem에 cloneElement 패턴 이미 존재)
- [x] T2: Context 분리 — ZoneContext + FocusContext ✅ (919 tests green)
  - [x] Step 9-10: ZoneContext/FocusContext 정의, useFocusGroupContext deprecated shim
- [x] T3: Zone.tsx 재작성 — 합성점, OS_ZONE_INIT, ZoneContext ✅ (919 tests green)
  - `FOCUS_GROUP_INIT` → `OS_ZONE_INIT` 리네이밍 + 별도 파일 추출
  - Zone이 zoneId 생성 (`zone-N`), OS_ZONE_INIT dispatch, ZoneContext 제공
  - FocusGroup은 Zone 안에서 ZoneContext 안 뿌림, 독립 사용 시만 fallback
- [ ] T4: FocusGroup.tsx headless 전환 — div 제거, ARIA props 반환
- [ ] T5: ZoneEntry 슬롯 구조 변경 + 커맨드 접근 경로 수정
- [x] T6: data attribute 변경 — `data-focus-group` → `data-zone` ✅ (22곳, 919 tests green)
- [ ] T7: 앱 마이그레이션 (Todo, Builder, DocsViewer)
- [ ] T8: 테스트 마이그레이션 + 전체 검증

## Done

- [x] D0: Discussion 완료 — Zone/FocusGroup 이름·책임 경계 확정
- [x] D1: PRD 작성 완료

## Ideas

- ZoneState 내부 capability 슬롯 분리 (focus slice, dnd slice) — DnD 도입 시점에
