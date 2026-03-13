# pit-of-success

| Key | Value |
|-----|-------|
| Claim | asChild + Entity-driven Zone API v2.2. Framework DOM element 0개. `(item, Item)` 2-arg render prop. Entity interface가 SSOT |
| Before | bind()가 5개 React 컴포넌트 생성. LLM이 ARIA 수동 관리, entity 직접 참조, 동기화 포인트 3+개 |
| After | `defineApp2().createZone(name, config)` → `ZoneHandle<E,C>`. asChild 통일. item=data(lowercase), Item=components(PascalCase). Two-track Big Bang |
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

**합의된 설계 결정 (K1~K9):**
1. **asChild 통일** — Framework DOM element 0개. Zone, Items, Field, Trigger 전부 asChild (cloneElement)
2. **Primitive 2종** — Field=순수 데이터, Trigger=asChild ReactElement
3. **(item, Item) 2-arg render prop** — item=Readonly\<E\>(데이터, 1st), Item=ItemComponents\<E\>(asChild wrapper, 2nd)
4. **Entity interface = SSOT** — 별도 field 선언 불필요, mapped type으로 추론
5. **Item = 순수 데이터** — Trigger는 Zone 소유 (Command 연결)
6. **Zone별 command 등록** — `cmd`에 등록된 것만 노출 (Pit of Success)
7. **defineApp2** — Two-track Big Bang. 기존 defineApp 유지, defineApp2 병렬 추가. 검증 후 전면 교체
8. **item.Children** — 같은 (item, Item) 시그니처로 Tree 재귀
9. **data accessor** — ZoneConfig에 `data: (state: S) => E[]`. collection의 `_ops.getItems` 재사용

## Done

- [x] T1~T6: Phase 1 createZone spike (archived)
- [x] T7: `/stub` — interface + stub + usage 검증 (tsc 0 errors) ✅

## Now

- [x] T8: **defineApp2 SDK 팩토리** — `packages/os-sdk/src/app/defineApp2/`: AppHandle2 + createZone(ZoneConfig<E,C>) → ZoneHandle<E,C> + data accessor + __zoneBindings. [Evidence: 9 tests PASS, tsc 0] ✅
- [x] T9: **Projection React 4컴포넌트** — Zone FC in defineApp2/createZone: asChild render prop(ZoneRenderContext), Items(data→(item,Item)+ARIA injection), Trigger(data-trigger-id), FieldWrapper(data-field). [Evidence: 9 tests PASS, tsc 0] ✅
- [ ] T10: **Todo v2 + headless 검증** — `src/apps/todo-v2/`: defineApp2+fromEntities+widget + createPage headless tests. 크기: M, 의존: →T8,T9

## Unresolved

| # | Question | Impact | 상태 |
|---|----------|--------|------|
| 1 | `entity: Todo` phantom type marker — `undefined as unknown as Todo` 필요 | API 인체공학 | 미해소 — generic `<Todo>` 대안 검토 필요 |
| 2 | inline edit 모드 — `item.Field.text` 편집 시 OS가 DOM target 식별 방법 | Field 편집 | 미해소 — `data-field` attr로 해결 가정 |
| 3 | cross-zone 키보드 (draft→list 화살표 이동) | UX | 미해소 — `linkZones()` vs combobox |
| 4 | Grid column(gridcell) 경계 표현 | Grid/Treegrid | 미해소 — Field 변형 vs 별도 primitive |
