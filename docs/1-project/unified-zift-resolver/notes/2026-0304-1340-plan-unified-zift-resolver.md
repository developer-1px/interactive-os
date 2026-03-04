# Plan: Unified ZIFT Resolver

> **Goal**: 4개 개별 resolver + when 가드 + isFieldActive → 1개 generic chain executor
> **Principle**: ordered keymap chain + binary return (Command/NOOP=stop, null=pass)
> **Origin**: `/discussion` 2026-03-04 — design-principles #23-25

---

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `os-core/2-resolve/chainResolver.ts` [NEW] | 없음 | `resolveChain(input, layers): Command\|null` — generic chain executor. layer = `Record<string, Command\|"NOOP"\|Command[]>` | Clear | — | +3 unit tests | 없음 (신규) |
| 2 | `TriggerConfig.ts:TriggerOpenConfig` | `{ onActivate, onClick, onArrowDown, onArrowUp, onHover }` boolean 5개 | **유지 (config는 config)** — boolean 플래그는 그대로. chain executor가 이 boolean을 참조하여 keymap을 build | Clear | — | 기존 타입 유지 | 없음 |
| 3 | `triggerRegistry.ts:triggerPresets` | `open: { onActivate: true, ... }` boolean 테이블 | **유지** + 새 함수 `buildTriggerKeymap(config): Keymap` 추가. config boolean → keymap 변환: `onActivate=true` → `{Enter: OPEN, Space: OPEN}`, `onClick=true` → `{Click: [CLOSE,OPEN]}` | Clear | →#1 | +6 tests (기존 trigger 테스트 유지) | 없음 |
| 4 | `resolveFieldKey.ts:FIELD_KEYMAPS` | 정적 `Record<FieldType, FieldKeymap>` + `resolveFieldKey()` + `resolveFieldKeyByType()` 함수 | `buildFieldKeymap(fieldType, ctx): Keymap` — 기존 keymap을 Keymap 포맷으로 변환. NOOP 흡수: `ZONE_PASSTHROUGH` 역전 → passthrough에 없는 key = NOOP | Clear | →#1, →#6 | 기존 resolve-field-key.test.ts 11 tests 유지 | Field keymap이 absorb 로직 흡수 |
| 5 | `resolveItemKey.ts:ITEM_RESOLVERS` | 정적 `Record<role, resolver>` + `resolveItemKey()` 함수 | `buildItemKeymap(role, ctx): Keymap` — ITEM_RESOLVERS를 Keymap 포맷으로 변환 | Clear | →#1 | 기존 resolve-item-key.test.ts tests 유지 | 없음 |
| 6 | `fieldKeyOwnership.ts:ZONE_PASSTHROUGH_KEYS` | 별도 파일, `isFieldActive` 계산용 | **흡수**: `buildFieldKeymap`이 passthrough 역전으로 NOOP 생성. `isKeyDelegatedToOS` 함수는 유지 가능 (headless sense에서 사용) | Clear | →#4 | 기존 동작 유지 | `resolveIsEditingForKey` 소비자 확인 필요 |
| 7 | `keybindings.ts:when` 가드 | `when: "editing"\|"navigating"` + 3-pass resolve 로직 (L89-112) | `when: "editing"` 제거 (dead code). `when: "navigating"` → chain 위치로 대체 대상이지만, **1차에서는 유지**. osDefaults가 Zone layer keymap이 되면 `when` 불필요해짐 | Clear | — | `command-when.test.ts` 수정 | `when` 제거는 2차 |
| 8 | `resolveKeyboard.ts` | 240줄, 4-layer if 체인 (L100-238) | `resolveChain(input, [fieldKeymap, triggerKeymap, itemKeymap, zoneKeymap])` — 10줄 | Clear | →#1,3,4,5 | 기존 resolveKeyboard.test.ts 유지 | **핵심 변경. regression 주의** |
| 9 | `resolveTriggerClick.ts` | `if (!onClick) return null; if (isOpen) CLOSE; else OPEN;` | `resolveChain(input="Click", [triggerKeymap])` 또는 유지 — Click은 keyboard chain과 별도. **1차에서는 유지 후 2차에서 통합** | Clear | →#3 | 기존 9 tests 유지 | Click chain 통합은 2차 |
| 10 | `resolveTriggerKey.ts` | 78줄, 4개 if문 | **삭제** → `buildTriggerKeymap`으로 대체. `resolveKeyboard`가 직접 사용 안 함 | Clear | →#3,8 | 기존 resolveTriggerKey.test.ts 15 tests → chainResolver 기반으로 전환 | 테스트 마이그레이션 |
| 11 | `resolveFieldKey.ts` | 160줄, FIELD_KEYMAPS + 2개 함수 | **간소화** → `buildFieldKeymap` export. 기존 함수는 backward compat 남기거나 삭제 | Clear | →#4 | 기존 11 tests 유지 | simulate.ts가 직접 사용 |
| 12 | `resolveItemKey.ts` | 107줄, ITEM_RESOLVERS + 함수 | **간소화** → `buildItemKeymap` export. 기존 함수 삭제 가능 | Clear | →#5 | 기존 tests 유지 | 없음 |
| 13 | `osDefaults.ts` | `Keybindings.registerAll([ ... when: "navigating" ... ])` 170줄 | **1차에서는 유지**. 2차에서 Zone layer keymap으로 전환 시 `when` 제거 | Clear | — | 기존 tests 유지 | 2차 범위 |

---

## Phasing 전략

> 명세표가 13행이고 regression 위험이 높으므로 **2-Phase**로 분할.

### Phase 1: Chain Executor + Keyboard 통합 (이 프로젝트)

| 대상 행 | 내용 |
|---------|------|
| #1 | `chainResolver.ts` 신규 |
| #3 | `buildTriggerKeymap` 추가 |
| #4 | `buildFieldKeymap` + NOOP absorb |
| #5 | `buildItemKeymap` |
| #8 | `resolveKeyboard.ts` 리팩토링 |
| #10 | `resolveTriggerKey.ts` 삭제 |
| #11 | `resolveFieldKey.ts` 간소화 |
| #12 | `resolveItemKey.ts` 간소화 |

**DoD**: `resolveKeyboard.ts`가 chain executor 기반. tsc 0. 기존 테스트 전수 PASS.

### Phase 2: Click 통합 + when 제거 (다음 프로젝트)

| 대상 행 | 내용 |
|---------|------|
| #7 | `when: "editing"` 제거 + `when: "navigating"` chain 위치 전환 |
| #9 | `resolveTriggerClick` → chain executor 통합 |
| #13 | `osDefaults.ts` → Zone layer keymap 전환 |

---

## MECE 점검

1. **CE**: Phase 1 + Phase 2 = 전 행 포괄 ✅
2. **ME**: 중복 행 없음 ✅
3. **No-op**: #2(TriggerConfig 유지), #6(fieldKeyOwnership 유지), #7(when 1차 유지), #9(click 1차 유지), #13(osDefaults 1차 유지) — 전부 명시적 "1차 유지" 표기로 2차에서 처리

## 검증 계획

### Automated Tests
```bash
# 기존 테스트 전수 regression 체크
source ~/.nvm/nvm.sh && nvm use && npx vitest run --reporter=verbose 2>&1 | tail -30

# 개별 테스트
npx vitest run packages/os-core/src/2-resolve/__tests__/unit/ --reporter=verbose
npx vitest run packages/os-core/src/1-listen/ --reporter=verbose
npx vitest run packages/os-react/src/1-listen/__tests__/unit/resolveKeyboard.test.ts --reporter=verbose
```

### 신규 테스트
- `chainResolver.test.ts`: chain executor 단독. NOOP stop, null pass, [CLOSE,OPEN] toggle, 빈 chain
- 기존 resolver 테스트: import 경로만 변경, 검증 로직 동일

---

## 라우팅
승인 후 → `/project` — OS 레벨 리팩토링, Phase 1 규모 (8행)
