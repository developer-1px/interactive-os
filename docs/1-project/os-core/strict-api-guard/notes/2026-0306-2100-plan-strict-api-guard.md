# Plan: strict-api-guard

> OS 앱 레이어 API 침묵 실패를 Hard error / Dev warning으로 전환

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `TriggerBase.tsx:175` id 없는 Trigger + onActivate | `onActivate` 전달해도 `data-trigger-id=undefined`, PointerListener가 무시. 에러 없음 | `if (!id && onActivate) throw new Error("[Trigger] onActivate requires an id prop")` | Clear | — | +1 test (throw 검증), 기존 trigger 관련 tests 유지 | Trigger 사용처 중 id 없이 onActivate 쓰는 곳이 있으면 깨짐. grep으로 확인 필요 |
| 2 | `Item.tsx:47` onActivate prop | prop 존재하지만 Item 컴포넌트 내에서 `ZoneRegistry.setItemCallback` 안 함. TriggerBase만 이걸 전달받아 Item에 넘김 | Item에서 `onActivate` prop 제거. TriggerBase가 직접 `ZoneRegistry.setItemCallback` 호출하거나, 기존 경로(TriggerBase→Item 경유) 유지하되 Item의 public interface에서 제거 | Complicated | →#1 (Trigger 정리 후) | tsc 0, 기존 Item/Trigger tests 유지 | TriggerBase가 Item에 onActivate를 넘기는 경로 — 제거하면 TriggerBase도 변경 필요 |
| 3 | `roleRegistry.ts:472` resolveRole의 `\|\| {}` | 잘못된 role 문자열 → `{}` 폴백 → group처럼 동작, 에러 없음 | `if (role && !rolePresets[role as ZoneRole]) throw new Error("[Zone] Unknown role: '${role}'")` | Clear | — | +1 test (throw 검증), 기존 rolePresets.test 유지 | `as any` 캐스팅으로 잘못된 role 넣는 테스트가 있으면 깨짐 |
| 4 | `fieldRegistry.ts:197-198` getValue 미등록 필드 | `state.fields.get(id)?.state.value ?? ""` — 미등록 시 `""` 반환, 경고 없음 | `if (!state.fields.has(id)) console.warn("[Field] getValue: '${id}' is not registered")` + 기존 `""` 반환 유지 | Clear | — | +1 test (console.warn 검증), 기존 field.test 유지 | 렌더 순서상 Field 등록 전에 getValue 호출되는 정상 케이스가 있으면 false positive 경고 발생 |
| 5 | `page.ts` TriggerBinding 미매칭 item | `ZoneRegistry.setItemCallback(zoneName, trigger.id, ...)` — trigger.id가 zone items에 없어도 에러 없음 | 등록 시점에 zone items와 대조하여 `console.warn("[TriggerBinding] '${trigger.id}' not found in zone '${zoneName}' items")` | Complicated | — | +1 test, 기존 headless tests 유지 | 등록 시점에 items가 아직 없을 수 있음 (등록 순서). lazy 체크 필요할 수 있음 |

## 제거된 항목 (거짓양성)

| 원래 # | 대상 | 제거 사유 |
|--------|------|----------|
| T6 | defineApp modules 유효성 | `AppModule` 타입 인터페이스가 `install()` 반환값을 강제. 타입 위반이 아닌 한 침묵 실패 없음 |
| T7 | Zone onAction 미등록 + activate 경고 | toolbar, radiogroup 등 많은 role이 onAction 없이 정상 동작 (select/click fallback이 의도). 경고 시 대량 false positive |
| T8 | Field name vs config.fieldName 불일치 | `FieldBindings` 타입에 `fieldName` 필드 없음. 비교 대상 자체가 존재하지 않음 |

## 비-Clear 행 해소

### #2 (Complicated): Item.onActivate prop 제거

**After가 확정되지 않는 이유**: TriggerBase가 `<Item onActivate={activateCmd}>` 형태로 Item에 전달하고 있음 (TriggerBase.tsx:183). Item에서 prop을 제거하면 TriggerBase도 수정 필요.

**제 판단: Item의 public type에서 onActivate를 제거하되, TriggerBase→Item 내부 경로는 internal prop으로 유지.** 이유: 앱 개발자가 `<Item onActivate={cmd}>` 직접 사용하는 것은 dead code이므로 외부 노출을 막되, TriggerBase의 내부 사용은 살려둔다. 구체적으로:
- `ItemProps`에서 `onActivate` 제거
- `ItemInternalProps`(또는 별도 내부 타입)에 유지
- TriggerBase가 내부 타입으로 캐스팅

### #5 (Complicated): TriggerBinding 미매칭 타이밍

**After가 확정되지 않는 이유**: 등록 시점에 zone items가 아직 없을 수 있음. `setItemCallback`은 Zone이 `goto()`되기 전에도 호출 가능.

**제 판단: 즉시 경고 대신 lazy 검증 — `OS_ACTIVATE` dispatch 시점에 trigger.id가 zone items에 없으면 경고.** 이유: activate.ts:39에서 `getItemCallback`을 호출하는 시점이면 zone이 확실히 초기화됨. 이 시점에서 callback은 있는데 item이 zone에 없으면 경고.

## MECE 점검

1. **CE**: 5행 실행 시 목표(침묵 실패 → 에러/경고) 달성? → Yes. 나머지 3개는 거짓양성으로 제거 정당
2. **ME**: 중복 행? → No
3. **No-op**: Before=After? → No

## 라우팅

승인 후 → `/go` (strict-api-guard) — T1~T5 순서대로 Red→Green 사이클
