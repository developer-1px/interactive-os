# BOARD — zone-focusgroup-separation

> Phase: Heavy | Created: 2026-02-23

## Now

- [ ] T1: PRD 작성 — 구체적 파일별 변경 사항, 인터페이스 설계, 마이그레이션 순서

## Done

- [x] D0: Discussion 완료 — Zone/FocusGroup 이름·책임 경계 확정

## Ideas

- Zone asChild Slot 메커니즘 설계 (Radix Slot 참고)
- ZoneState 내부 capability 슬롯 구조 (focus, dnd, ...)
- ZoneEntry capability 슬롯 구조
- Context 분리: ZoneContext + FocusContext
- `FOCUS_GROUP_INIT` → `OS_ZONE_INIT` 리네이밍
- `data-focus-group` → `data-zone` 리네이밍
- `useFocusGroupContext` → Zone용/Focus용 분리
- `FocusGroupConfig` → 유지 (APG config로 정확)
- `generateGroupId` → `generateZoneId`, auto ID `zone-N`
- FocusGroup headless 전환: div 제거 → ARIA를 Zone child에 투사
- 기존 앱 마이그레이션: Todo, Builder, DocsViewer
- 테스트 마이그레이션: unit, integration, e2e
