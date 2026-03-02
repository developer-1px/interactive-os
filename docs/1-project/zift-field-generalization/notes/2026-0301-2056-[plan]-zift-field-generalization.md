# ZIFT Field 일반화 — 변환 명세표

| 항목 | 내용 |
|------|------|
| **선행** | `docs/0-inbox/2026-0301-2056-[discussion]-zift-field-identity-and-ownership.md` |
| **Claim** | Field = Entity Property의 1:1 편집 인터페이스. FieldType을 `string \| boolean \| number \| enum \| enum[]`로 일반화 |
| **날짜** | 2026-03-01 |

---

## 변환 명세표

> **전제**: 이 프로젝트는 **OS 코어** 변경. regression 위험이 크므로 point-cut 단위로 분해.
> **전략**: computeItem 분해는 **내부 추출 → 외부 승격** 2단계 점진 전략.

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `fieldRegistry.ts:FieldType` | `"inline" \| "tokens" \| "block" \| "editor"` (string only) | `+ "boolean" \| "number"` | Clear | — | tsc 0, 기존 4 text preset 유지 | 소비자 18곳, union 확장이므로 하위호환 |
| 2 | `fieldRegistry.ts:FieldState.value` | `value: string` | `value: string \| boolean \| number` | Clear | →#1 | tsc 0, 기존 string 동작 유지 | `updateValue(id, value: string)` → union 시그니처. `getValue` 반환 타입 변경 |
| 3 | `resolveFieldKey.ts:FIELD_KEYMAPS` | 4개 (inline/tokens/block/editor) | +2개 (boolean: Space/Enter→OS_CHECK, number: Arrow/Home/End→OS_VALUE_CHANGE) | Clear | →#1 | +2 keymap tests, 기존 4 tests 유지 | 없음 (추가만) |
| 4 | `resolveItemKey.ts:ITEM_RESOLVERS` | checkbox/switch/slider가 Item resolver | checkbox/switch/slider **제거** (Field로 이동) | Clear | →#3 | 기존 tests 수정 (Item→Field 이동), regression 0 | resolveKeyboard.ts의 호출 순서: Field→Item→Zone. Field가 먼저 잡으므로 Item에서 빠져도 OK |
| 5 | `compute.ts:computeItem` — 내부 추출 | `aria-checked`, `aria-valuenow/min/max` 로직이 computeItem 안에 inline | `computeFieldAttrs()`로 내부 함수 추출. computeItem이 호출. **외부 인터페이스 불변** | Clear | — | 기존 tests 100% 유지 (내부 리팩토링) | 없음. 외부 시그니처 불변 |
| 6 | `fieldKeyOwnership.ts` | 4개 FieldType 기준 passthrough | +2개 (boolean/number) passthrough 규칙 추가 | Clear | →#1 | tsc 0 | 없음 (추가만) |
| 7 | `defineApp.types.ts` + `defineApp.ts` | `createField` 없음 | `createField({ type, role, ... })` API 추가 | Complicated | →#1,#2 | +tests for createField, tsc 0 | API 설계 결정 필요 (Step 3에서 해소) |
| 8 | `roleRegistry.ts` | switch preset에 `check: { mode: "check" }` (Zone config) | switch를 FieldType "boolean"으로 인식하는 경로 추가. 기존 preset 하위호환 유지 | Complicated | →#1,#5 | 기존 switch.apg.test.ts 유지 | 기존 onAction workaround가 동작하면서, 새 createField도 동작해야 함 |
| 9 | KI 갱신: `zift_standard_specification` | Field = "Text Conduit" (현재 정의) | Field = "Entity Property를 편집하는 1:1 인터페이스" + FieldType 일반화 | Clear | →#1,#2,#3 | — | 없음 |
| 10 | `official/os/` 문서 갱신 | Field 관련 문서가 string 전제 | boolean/number/enum 예시 추가 | Clear | →#9 | — | 없음 |

---

## 비-Clear 행 즉석 해소

### #7: createField API 설계 (Complicated)

**왜 확정 안 됨**: `createField`의 시그니처가 미확정. 특히 enum Field가 Zone+Item을 내부에 합성하는 구조의 구체적 구현.

**제 판단: Phase 분리. 1차에서는 boolean/number만, 2차에서 enum/enum[] 추가.**

이유:
- boolean/number는 standalone Field (Zone+Item 합성 불필요). 구현 단순
- enum/enum[]은 Zone+Item을 내부 위젯으로 사용하는 합성 패턴. 설계 복잡도 높음
- switch/slider의 Pit of Success가 1차 성과물로 즉시 증명 가능

1차 API (boolean/number):
```typescript
App.createField({ type: "boolean", role: "switch" })
App.createField({ type: "number", role: "slider", min: 0, max: 100 })
```

2차 API (enum/enum[] — 후속):
```typescript
App.createField({ type: "enum", role: "radiogroup", options: [...] })
```

→ **Clear로 전환**: 1차 = boolean/number only.

### #8: roleRegistry switch preset (Complicated)

**왜 확정 안 됨**: 기존 `onAction → OS_CHECK` workaround와 새 createField 경로가 공존해야 함. 마이그레이션 전략.

**제 판단: 기존 preset 유지 + createField 경로 추가 (additive).**

이유:
- 기존 switch.apg.test.ts가 `onAction → OS_CHECK` 패턴으로 통과
- createField가 추가되면 새 테스트로 검증
- 기존 앱 코드는 점진 마이그레이션 (강제 breaking change 없음)

→ **Clear로 전환**: additive (기존 유지 + 새 경로 추가).

---

## MECE 점검

1. **CE**: 모든 행을 실행하면 목표 달성? → ✅ (FieldType 일반화 + resolveFieldKey 확장 + resolveItemKey 정리 + computeItem 내부 추출 + createField API + 문서)
2. **ME**: 중복 행? → ❌ 없음
3. **No-op**: Before=After? → ❌ 없음

---

## 라우팅

승인 후 → `/project` (새 프로젝트 생성) — **zift-field-generalization**: OS 코어 Heavy 프로젝트. Field를 Entity Property 소유자로 일반화.

Phase 1 (이 프로젝트): #1~#6, #9, #10 (boolean/number, 내부 추출)
Phase 2 (후속): #7 createField API, #8 enum/enum[] 합성 (별도 프로젝트)
