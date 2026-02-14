# defineApp — STATUS

| 항목 | 상태 |
|------|------|
| 시작일 | 2026-02-13 |
| 현재 Phase | **Phase 3: Production 전환 진행 중** |
| 선행 프로젝트 | [create-module](../create-module/) (Phase 1 완료) |

## 진행 상황

### Phase 1 (v3, 완료)

- [x] Discussion 완료 → Zone binding 결론 도출
- [x] 관련 문서 수집 (Discussion + usage 회고)
- [x] PRD 작성
- [x] KPI 작성
- [x] PROPOSAL 작성
- [x] PROPOSAL 리뷰/승인
- [x] /divide 실행 — 작업 분류
- [x] `defineApp.ts` 구현 (280줄)
- [x] `createWidget` 구현 (Zone, Item, Field 렌더 컴포넌트 포함)
- [x] Todo v3 app 정의 (5 widgets: TodoList/Sidebar/Draft/Edit/Toolbar)
- [x] 유닛 테스트 19/19 통과

### Phase 2 (v5, 확정)

- [x] v4 Usage PoC → 타입 검증
- [x] v5 Entity Tree 설계 (App → Zone → Command, Condition/Selector 분리)
- [x] Red Team 분석 (8개 공격)
- [x] Blue Team 방어 + Red Team Round 2
- [x] Red/Blue 합의표 도출
- [x] v5 PoC 구현 — `tsc --strict` 0 errors
- [x] v5 PoC 런타임 — 26 assertions 통과
- [x] 코드 우아함 리뷰 — ⭐⭐⭐⭐⭐
- [x] v5 Design Specification 작성 (`6-v5-design.md`)

### Phase 3 (Production 전환, **진행 중**)

- [x] P0: kernel when guard 구현 (W26/W33 — `processCommand` 체크)
- [x] P0: `createZone` → `kernel.group` 통합 (scope 버블링)
- [x] P1: `defineApp.ts` v5 재작성 (branded types, flat handler, when guard)
- [x] P1: v3 compat layer — createWidget, useComputed lambda, dialog pattern
- [x] P1: 140/140 테스트 통과 (Todo v3 30개 포함)
- [ ] P2: Builder 앱 v5 네이티브 마이그레이션
- [ ] P2: Todo 앱 v5 네이티브 마이그레이션 (compat → native)
- [ ] P2: lint rule — 앱 코드 getState() 경고
- [ ] E2E 테스트 통과 확인
- [ ] KPI 측정 (최종)

## 진행 기록

| 날짜 | 이벤트 | changelog |
|------|--------|-----------|
| 2026-02-13 01:49 | Zone binding 디스커션 완료 | `defineApp + createWidget` 아키텍처 결정 |
| 2026-02-13 02:10 | 프로젝트 시작 | PRD/KPI/Proposal 작성 |
| 2026-02-13 02:20 | Phase 1 완료 | `defineApp.ts` + `todo/v3/app.ts` + 19/19 unit tests |
| 2026-02-14 16:30 | v4 Usage PoC | 타입 검증, 구조적 gap 발견 |
| 2026-02-14 16:54 | v5 Entity Tree 확정 | Condition/Selector 분리, App owns Command |
| 2026-02-14 17:01 | Red Team 분석 | 8개 공격, Zone 정의/Scope 버블링 핵심 |
| 2026-02-14 17:14 | Red/Blue 합의 | W20' 수정, 합의표 10개 항목 |
| 2026-02-14 17:25 | v5 최종본 | 26 assertions, ⭐⭐⭐⭐⭐ |
| 2026-02-14 17:27 | 커밋 + 프로젝트 격상 | Phase 2 완료 |
| 2026-02-14 17:37 | kernel when guard | `scopedWhenGuards` + `processCommand` 체크 |
| 2026-02-14 17:44 | defineApp v5 production | v3 compat layer, 140/140 tests |

## 📚 관련 리소스

- [12-headless-ui-patterns.md](../../3-resource/12-headless-ui-patterns.md) — 업계 Headless UI 패턴(Radix, React Aria 등)과 우리 커널의 비교
- [v5 Design Spec](./6-v5-design.md) — 확정된 Entity Tree + Warrants + API
- [Red Team Report](../../0-inbox/2026-02-14_defineApp-v5_RedTeam.md) — 8개 공격 분석
- [Divide Report](../../0-inbox/2026-0214-1704-divide-v5-redteam.md) — Known/Open 분류
- [when guard discussion](../../11-discussions/2026-0214-1734-when-guard-kernel.md) — kernel 단일 파이프라인 결정

