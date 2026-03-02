# Tension Report: ZIFT Field Key Ownership

> 생성일: 2026-03-01 21:40
> 범위: `src/os/keymaps/`, `src/os/1-listen/keyboard/`, `src/os/headless/`

## Summary

| # | 긴장 | 유형 | 심각도 |
|---|------|------|--------|
| T1 | Key Identity Paradox | Boundary | 🔴 |
| T2 | Dual Ownership Anti-pattern | Pattern | 🟡 |
| T3 | Editing Gate Mismatch | Value | 🔴 |

---

## Tensions

### T1: Key Identity Paradox — Field는 Key를 소유하지만, 대상을 모른다

**Thesis**: "Field가 Key를 소유한다" — ZIFT 일반화의 핵심 주장. boolean의 Space/Enter, number의 Arrow는 Field 레이어가 처리해야 한다. (`resolveFieldKey.ts` BOOLEAN_KEYMAP, NUMBER_KEYMAP)

**Antithesis**: "Item이 대상 신원(Identity)을 소유한다" — OS_CHECK에는 `targetId`가 필요하다. 이 값은 `focusedItemId`로, Item 레이어에서만 알 수 있다. Field는 `fieldId`만 안다.

**현재 상태**: `BOOLEAN_KEYMAP`에서 `OS_CHECK({ targetId: "" })`로 **빈 문자열을 하드코딩**. 이 커맨드는 실제 CHECK 핸들러에서 동작하지 않는다.

**증거**:
- [resolveFieldKey.ts:65](file:///Users/user/Desktop/interactive-os/src/os/keymaps/resolveFieldKey.ts#L65) — `OS_CHECK({ targetId: "" })`
- [resolveItemKey.ts:56](file:///Users/user/Desktop/interactive-os/src/os/keymaps/resolveItemKey.ts#L56) — Item에서는 `ctx.itemId`로 정확한 targetId 전달
- [resolveKeyboard.ts:120](file:///Users/user/Desktop/interactive-os/src/os/1-listen/keyboard/resolveKeyboard.ts#L120) — Item 경로에서 `elementId: input.focusedItemId` 주입

**유형**: Boundary
**심각도**: 🔴 해소 필요 — Field keymap이 실전에서 동작하지 않는 빈 targetId를 생산

**학문적 선례**: Information Expert principle (GRASP) — "정보를 가진 객체가 책임을 져야 한다." targetId 정보는 Item이 갖고 있으므로, **커맨드 생성과 컨텍스트 주입의 분리**가 필요.

**해소 전략 후보**:
- A: **Field에 context 주입** — `resolveFieldKey(fieldId, key, { itemId })` 시그니처 변경. 대가: Field의 순수성 약화. Field가 "나와 무관한 정보(itemId)"를 받아야 함.
- B: **resolveKeyboard 후처리** — Field가 `OS_CHECK({})`을 반환하면, `resolveKeyboard`가 `focusedItemId`를 payload에 주입. 대가: 레이어 간 결합도 증가. "리졸버가 커맨드를 후수정한다"는 냄새.
- C: **합(Synthesis): Keymap을 factory-of-factory로** — `BOOLEAN_KEYMAP`이 `(ctx) => OS_CHECK({ targetId: ctx.itemId })`를 반환. `resolveFieldKey`가 context를 받되 **keymap 정의 시점에 주입**, Field 자체는 순수. 대가: keymap 타입이 복잡해짐.

---

### T2: Dual Ownership Anti-pattern — 같은 Key가 두 레이어에 동시 존재

**Thesis**: "Field가 소유한다" — BOOLEAN_KEYMAP에 Space/Enter→OS_CHECK 등록됨.
**Antithesis**: "Item이 소유한다" — resolveSwitch에 Space/Enter→OS_CHECK가 여전히 존재.

**현재 상태**: Phase 1에서 Field keymap을 **additive**로 추가했지만, Item에서 제거하지 못했다. 두 레이어에 **같은 키 → 같은 커맨드** 매핑이 공존.

**증거**:
- [resolveFieldKey.ts:64-66](file:///Users/user/Desktop/interactive-os/src/os/keymaps/resolveFieldKey.ts#L64-L66) — BOOLEAN: Space→OS_CHECK
- [resolveItemKey.ts:65-69](file:///Users/user/Desktop/interactive-os/src/os/keymaps/resolveItemKey.ts#L65-L69) — switch: Space→OS_CHECK
- Responder Chain 우선순위: Field가 `editingFieldId` 있을 때만 실행. 없으면 Item이 처리. **조건부 이중 소유.**

**유형**: Pattern
**심각도**: 🟡 주의 — 현재는 동작하지만 ("둘 다 있으니 어떻게든 처리"), 소유권 모호가 누적되면 디버깅 불가.

**학문적 선례**: Single Responsibility Principle — 하나의 key 처리에 대한 책임이 두 모듈에 분산.

**해소 전략 후보**:
- A: **Field 우선, Item 제거** — T1 해소 후 Item에서 제거. 대가: 기존 APG 테스트 전면 수정 필요.
- B: **Item 유지, Field 제거** — Phase 1 rollback. 대가: Field 일반화 목표 포기.
- C: **과도기 허용** — 명시적 마이그레이션 기한 설정. NOTE 주석은 이미 존재. 대가: 기한 없으면 영구화.

---

### T3: Editing Gate Mismatch — boolean/number는 "편집 상태"가 없다

**Thesis**: "Field는 editingFieldId가 있을 때만 활성화된다" — resolveKeyboard L87: `if (input.editingFieldId)`. text Field는 Enter로 편집 시작, Escape로 편집 종료. 명확한 진입/퇴장.

**Antithesis**: "boolean/number Field에는 편집 상태가 없다" — switch는 항상 Space로 토글 가능. slider는 항상 Arrow로 값 조정 가능. **편집 시작/종료 라이프사이클이 존재하지 않는다.**

**현재 상태**: boolean/number Field가 resolveKeyboard의 Field layer를 통과하려면 `editingFieldId`가 설정되어야 하지만, switch/slider에는 편집 시작 개념이 없어서 `editingFieldId`가 null. **Field layer가 영원히 스킵된다.**

**증거**:
- [resolveKeyboard.ts:87](file:///Users/user/Desktop/interactive-os/src/os/1-listen/keyboard/resolveKeyboard.ts#L87) — `if (input.editingFieldId)` 가드
- [simulate.ts:111](file:///Users/user/Desktop/interactive-os/src/os/headless/simulate.ts#L111) — headless에서 `entry?.fieldId ?? null`
- switch APG: `fieldId`를 설정하지 않음 → Field layer 스킵 → Item layer에서 처리

**유형**: Value
**심각도**: 🔴 해소 필요 — **이것이 T1, T2의 근본 원인.** `editingFieldId` 게이트가 text 중심의 가정에 기반. boolean/number는 이 게이트를 통과할 수 없어서 Item에 남아 있을 수밖에 없다.

**학문적 선례**: Leaky Abstraction (Joel Spolsky) — `editingFieldId`라는 추상화가 text 편집에만 유효하고, 새 타입에서 "누수"된다.

**해소 전략 후보**:
- A: **Always-Active Field** — boolean/number는 `editingFieldId`가 아니라 **`activeFieldId`** 같은 별도 경로. focus만으로 활성화. 대가: resolveKeyboard에 새 경로 추가.
- B: **Auto-edit** — boolean/number Field가 focus를 받으면 자동으로 `editingFieldId` 설정. 대가: "편집 중" 상태의 의미가 희석. text와 boolean의 편집 생명주기가 다른데 같은 flag 공유.
- C: **합(Synthesis): Field Presence** — `editingFieldId` 가드를 `activeFieldId || editingFieldId`로 확장. text Field는 기존대로 `editingFieldId` (명시적 진입/퇴장), boolean/number는 `activeFieldId` (focus 시 자동 활성). 두 경로 모두 `resolveFieldKey`를 호출하되, 활성화 조건만 다름.

---

## Recommendations

1. **즉시 해소 필요: T3** — 이것이 **근본**이다. T3를 해소하지 않으면 T1, T2는 해소 불가. `editingFieldId` 게이트를 boolean/number가 통과할 수 있도록 확장해야 한다. → **T3-C(Field Presence)** 전략 추천.

2. **T3 해소 후 자동 해소: T1** — T3-C로 boolean/number가 Field layer를 통과하면, `resolveFieldKey`에 `focusedItemId`를 context로 전달(T1-C)하여 targetId 문제 해결.

3. **T1+T3 해소 후: T2 정리** — Item에서 checkbox/switch/slider resolver 제거. APG 테스트를 Field 경로로 전환.

> **해소 순서**: T3 → T1 → T2 (근본 → 파생 → 정리)
