# pit-of-success

| Key | Value |
|-----|-------|
| Claim | asChild + Entity-driven Zone API. Framework DOM element 0개. `item.fieldName`(데이터) + `item.Field.fieldName`(asChild) + `zone.Trigger`(Command 연결). Entity interface가 SSOT |
| Before | bind()가 5개 React 컴포넌트 생성. LLM이 ARIA 수동 관리, entity 직접 참조, 동기화 포인트 3+개 |
| After | `createZone(name, config)` 단일 API. asChild 통일. Item=순수 데이터, Trigger=Zone 소유. LLM은 content만 작성 |
| Size | Heavy |
| Risk | 기존 bind() API 전면 재설계. 25+ showcase 앱 마이그레이션 필요 |
| Approach | **OS 설계** — `/go --os` 파이프라인: discussion → explain → stub → red → green |

## Context

### Phase 1 (2026-03-12, archived)
- createZone spike: Entity Scope Closure 증명, 15 tests PASS
- 실패: usage-spec 무시하고 독자 구현 → API 일치율 0%
- 교훈: interface 확정 단계(/stub) 없으면 에이전트 독자 행동 차단 불가

### Phase 2 (2026-03-13, current)
/discussion에서 "React가 받아야 하는 최소 계약"을 DOM에서 역추적하여 새 API 도출.

**합의된 설계 결정 (K1~K8):**
1. **asChild 통일** — Framework DOM element 0개. Zone, Items, Field, Trigger 전부 asChild (cloneElement)
2. **Primitive 2종** — Field=순수 데이터, Trigger=asChild ReactElement
3. **Field 이중 접근** — `item.text`(데이터) + `<item.Field.text>`(asChild 편집 마킹)
4. **Entity interface = SSOT** — 별도 field 선언 불필요, mapped type으로 추론
5. **Item = 순수 데이터** — Trigger는 Zone 소유 (Command 연결)
6. **Zone별 command 등록** — `cmd`에 등록된 것만 노출 (Pit of Success)
7. **bind() 제거** — `createZone(name, config)` 단일 API
8. **item.Children** — 같은 시그니처로 Tree 재귀

## Done

- [x] T1~T6: Phase 1 createZone spike (archived)
- [x] T7: `/stub` — interface + stub + usage 검증 (tsc 0 errors) ✅

## Now

- [ ] T8: `/red` — interface 기반 테스트 작성
- [ ] T9: `/green` — 구현
- [ ] T10: showcase 마이그레이션

## Unresolved

| # | Question | Impact | 상태 |
|---|----------|--------|------|
| 1 | `entity: Todo` phantom type marker — `undefined as unknown as Todo` 필요 | API 인체공학 | 미해소 — generic `<Todo>` 대안 검토 필요 |
| 2 | inline edit 모드 — `item.Field.text` 편집 시 OS가 DOM target 식별 방법 | Field 편집 | 미해소 — `data-field` attr로 해결 가정 |
| 3 | cross-zone 키보드 (draft→list 화살표 이동) | UX | 미해소 — `linkZones()` vs combobox |
| 4 | Grid column(gridcell) 경계 표현 | Grid/Treegrid | 미해소 — Field 변형 vs 별도 primitive |
