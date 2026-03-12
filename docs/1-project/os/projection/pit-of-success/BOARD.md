# pit-of-success

| Key | Value |
|-----|-------|
| Claim | `createZone`이 role+fields+triggers+callbacks를 직접 소유하고, `(zone) =>` 콜백이 zone.items/field/trigger/selection을 제공한다. bind() 레이어 불필요. Entity Scope Closure + unstyled component로 LLM이 ARIA를 틀릴 수 없는 구조 |
| Before | bind()가 5개 React 컴포넌트(Zone,Item,Field,When,triggers)를 생성. LLM이 entity 직접 참조, ARIA 수동 동기화, 동기화 포인트 3+개 |
| After | createZone 선언 = 완전한 projection. `(zone) =>` 콜백에서 zone.items/count/selection/field/trigger 접근. `zone.items((item) => JSX)`에서 item.프로퍼티(TS 추론)로 entity scope closure |
| Size | Heavy |
| Risk | 기존 bind() API 전면 재설계. 25+ showcase 앱 마이그레이션 필요. createZone 제네릭 복잡도 |
| Approach | **Spike** — 기존 defineApp/bind 수정 금지. 별도 구현으로 설계 검증. Usage Spec이 Goal |

## Context (Discussion 결론 2026-03-12)

### 핵심 발견
1. **bind() 제거**: v2(bind2)에서 React 컴포넌트가 5→1(Zone)로 줄면서 bind의 존재 이유(컴포넌트 생성) 소멸
2. **`(zone) =>` 콜백**: `(item) =>`은 여지가 너무 좁음. zone이 items/field/trigger/selection/count 전부 제공
3. **Stringly-typed 제거**: `item.field("text")` → `item.text` (TS가 fields config에서 추론)
4. **v3은 없다**: Entity Scope Closure가 핵심 발견이고, bind 제거가 그것의 정직한 적용. 근본적으로 다른 v3 없음

### 오컴의 면도날 검증
- React 컴포넌트: 5 → 1(Zone) + 함수
- 동기화 포인트: 3+ → 0
- ARIA 관여: 일부 수동 → 완전 봉인
- 복잡도는 감소가 아닌 **이동**(React→config) — 그러나 P4(소비자=LLM) 기준으로 올바른 방향

### 확증편향 점검 결과
- Spike 246줄 vs Production 1000+줄 비대칭 비교
- ⚠️ 8건(edit, drag, overlay, selection, tree 등)은 설계만, 코드 미검증
- Unstyled component 스타일링 현실(sr-only+peer) 미검증
- **결론**: Entity Scope Closure는 진짜 나아졌으나, "v1 대체 가능"은 미증명

## Now

- [ ] T1: `createZone` spike 함수 — Zone 컴포넌트 + `(zone) =>` 콜백 반환 — S, 의존: —
- [ ] T2: zone context 객체 — items(), count, zone.트리거명(), zone.필드명() — S, 의존: →T1
- [ ] T3: item context TS 제네릭 — fields config → `item.프로퍼티` 추론 — M, 의존: →T1
- [ ] T4: TodoList 데모 재작성 — createZone 패턴 — S, 의존: →T2,T3
- [ ] T5: 기존 18 tests 마이그레이션 — S→M, 의존: →T4
- [ ] T6: zone-level 신규 테스트 (count, zone callback 구조) — S, 의존: →T4

## Tasks (Detail)

| # | Task | Before | After | 크기 | 의존 | 검증 | 상태 |
|---|------|--------|-------|------|------|------|------|
| T1 | `createZone` spike 함수 | `bind2(config)` → `{Zone, items, field, trigger}` | `createZone(config)` → `{Zone}`. Zone children: `(zone) => ReactNode` | S | — | tsc 0 | ⬜ |
| T2 | zone context 객체 | zone 개념 없음 | `zone.items(cb)`, `zone.count`, `zone.트리거명(opts)`, `zone.필드명(opts)` | S | →T1 | tsc 0 | ⬜ |
| T3 | item TS 제네릭 추론 | `item.field("text")` stringly-typed | `item.text` (fields keyof 추론), `item.Delete()` (triggers keyof 추론) | M | →T1 | tsc 0 + 타입 테스트 | ⬜ |
| T4 | TodoList 데모 재작성 | `bind2` + `<Zone>{items(...)}</Zone>` | `createZone` + `<Zone>{(zone) => zone.items(...)}</Zone>` | S | →T2,T3 | renderToString | ⬜ |
| T5 | 기존 18 tests 마이그레이션 | bind2 기반 | createZone 기반 동일 검증 | M | →T4 | 18 tests PASS | ⬜ |
| T6 | zone-level 신규 테스트 | 없음 | zone.count, zone+items 공존, (zone)=> 콜백 구조 | S | →T4 | +5 tests | ⬜ |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| 1 | createCollectionZone의 TS 제네릭: fields config → item.프로퍼티 추론이 실제로 가능한가? | 핵심 DX. 불가능하면 stringly-typed로 fallback |
| 2 | (zone) => 콜백의 zone 타입: items/count/selection/field/trigger를 어떻게 합성하는가? | zone 객체의 타입 설계 |
| 3 | edit 모드: item.text가 display/edit 자동 전환하는가, item.editText 별도인가? | inline edit 패턴 |
| 4 | Item.Content(탭패널/아코디언): zone.items 콜백에서 when("expanded")로 대체 가능한가? | expansion 패턴 |
| 5 | Unstyled component 스타일링: field()가 반환하는 HTML을 어떻게 커스텀하는가? | 디자인 자유도 |
