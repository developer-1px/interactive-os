# OS Gap Report: @os-core Direct Import Analysis

> Date: 2026-03-06
> Scope: 앱 테스트 (tests/, src/__tests__/)에서 @os-core 직접 import 전수 조사

## Executive Summary

27 앱 테스트 파일에서 @os-core 직접 import를 제거 시도. 결과:

| 결과 | 파일 수 | 설명 |
|------|--------|------|
| **제거 완료** | 9 | dispatch(OS_SELECT) → click() 대체 성공 |
| **OS 테스트 reclassify** | 9 | 앱 테스트가 아닌 OS 내부 테스트 |
| **Gap 잔류** | 9 | page API 부재로 제거 불가 |
| **합계** | 27 | |

## 제거 완료 (9파일) — @os-core import 0건

### dispatch(OS_SELECT) → click() 대체 (7파일, 160 tests PASS)

| 파일 | Before | After |
|------|--------|-------|
| tabs.apg.test.ts | `dispatch(OS_SELECT({mode:"replace"}))` | `click(itemId)` |
| toolbar.apg.test.ts | 동일 | 동일 |
| listbox.apg.test.ts | `dispatch(OS_SELECT({mode:"replace/range/toggle"}))` | `click(id)`, `click(id, {shift})`, `click(id, {meta})` |
| tree.apg.test.ts | 동일 | 동일 |
| radiogroup.apg.test.ts | 동일 | `click(id)` |
| carousel.apg.test.ts | 동일 | `click(id)` |
| switch.apg.test.ts | `import OS_CHECK from @os-core` | `import OS_CHECK from @os-sdk/os` (onAction callback용, SDK에 이미 re-export) |

**핵심 발견**: GAP-SELECT와 GAP-ENFORCE는 gap이 아니었다. click/click+modifier가 이미 OS pipeline을 정상 경유한다.

### 디버깅 코드 제거 (2파일)

| 파일 | 제거된 것 |
|------|----------|
| tab-repro.test.ts | `os.inspector.clearTransactions()`, `dumpTransactions(os)` |
| bulk-undo-repro.test.ts | 동일 |

## OS 테스트 Reclassify (9파일) — 앱 테스트가 아님

이 파일들은 OS 내부 로직을 직접 테스트하므로 @os-core import이 합법적. 별도의 "OS 테스트 객체"의 대상.

| 파일 | @os-core 사용 | 이유 |
|------|--------------|------|
| field-undo-focus.test.ts | os.setState/dispatch/getState, OS_FIELD_* | 순수 커널 행동 검증 (field commit/cancel 후 focus) |
| field-registry.test.ts | FieldRegistry 생명주기 | registry seam test |
| field-infinite-loop.test.tsx | FieldRegistry + useFieldRegistry | React hook 통합 |
| hierarchical-navigation.test.ts | itemQueries, ZoneRegistry, DEFAULT_CONFIG | OS DOM query 함수 검증 |
| docs-scroll.test.ts | os.dispatch(OS_NAVIGATE), os.setState | 순수 OS navigation 검증 |
| docs-section-nav.test.ts | Keybindings.resolve() | OS keybinding infra 검증 |
| tab.test.ts | resolveTab, AppState, initialOSState, ensureZone | OS tab resolve 알고리즘 |
| cut-focus.test.ts | OS_FOCUS | OS focus 이동 검증 |
| deletion-focus.test.ts | OS_FOCUS | OS deletion 후 focus 검증 |

## Gap 잔류 (9파일) — 5개 Gap 유형

### GAP-1: STACK (overlay open/close) — 4파일

**영향**: menu, dialog, dropdown-menu, combobox APG 테스트

**문제**: overlay를 여는(STACK_PUSH) / 닫는(STACK_POP) 것을 input으로 표현할 수 없음.
- STACK_POP은 `Escape`로 대체 가능 (dismiss config 있으면)
- **STACK_PUSH는 input 경로 없음** — 앱의 onAction callback이 STACK_PUSH를 반환해야 하는데:
  1. onAction에서 반환할 OS_STACK_PUSH가 SDK에 없음 (GAP-1a: re-export 필요)
  2. headless page에서 trigger → overlay zone 전환이 자동화되지 않음 (GAP-1b: zone lifecycle)

**현재 패턴**: `page.dispatch(OS_STACK_PUSH())` → `page.goto("dialog", {...})`

**이상적 패턴**: `page.click("open-dialog-btn")` → onAction → STACK_PUSH → dialog zone 자동 활성

### GAP-2: FIELD (field 값 관찰/조작) — 3파일

**영향**: todo-user-journey, todo-draft, field-headless-input

**문제**: `FieldRegistry.getValue("DRAFT")` / `FieldRegistry.updateValue()` — page API에 field 값 접근 방법 없음.

**현재 패턴**: `FieldRegistry.getValue("DRAFT")`

**이상적 패턴**: `page.locator("#draft-input").inputValue()` (Playwright 동형)

**Note**: page.locator().inputValue()는 현재 미구현.

### GAP-3: ZONE-SETUP (headless zone 자동 등록) — 5파일

**영향**: locale-dropdown, docs-tab, headless-smoke, builder-interaction-spec, command-palette

**문제**: headless에서 zone이 자동 등록되지 않음. 테스트가 `ZoneRegistry.register()` / `ZoneRegistry.get().getItems = ...`로 수동 설정.

**현재 패턴**:
```ts
ZoneRegistry.register("menu-zone", { ... });
ZoneRegistry.get("menu-zone")!.getItems = () => items;
```

**이상적 패턴**: `createPage(app)` 시점에 defineApp의 zone 정의가 자동 등록. 추가 setup 불필요.

**근본 원인**: headless page는 React render를 하지 않으므로 zone bind effect가 실행되지 않음.

### GAP-4: OVERLAY-STATE (overlay 상태 관찰) — 3파일

**영향**: locale-dropdown, trigger-push-model, command-palette

**문제**: `os.getState().os.overlays.stack` — overlay가 열려있는지를 page API로 관찰할 수 없음.

**현재 패턴**: `expect(os.getState().os.overlays.stack).toHaveLength(1)`

**이상적 패턴**: `expect(page.locator("#dialog").attrs()["aria-modal"]).toBe(true)` (DOM 상태로 관찰)

### GAP-5: TRIGGER (standalone trigger callback) — 1파일

**영향**: docs-prev-next

**문제**: `ZoneRegistry.setItemCallback("__standalone__", triggerId, { onActivate })` — standalone trigger의 callback을 page API로 등록할 수 없음.

**현재 패턴**: 수동 ZoneRegistry callback 등록

**이상적 패턴**: createTrigger 정의 시 callback이 자동 등록되어 page.click(triggerId)로 트리거

## Gap 우선순위 (제안)

| 순위 | Gap | 영향 | 해결 복잡도 | 비고 |
|------|-----|------|-----------|------|
| 1 | GAP-3: ZONE-SETUP | 5파일 | High | createPage가 app 정의를 완전 실현해야 함 |
| 2 | GAP-1: STACK | 4파일 | Medium | re-export + onAction 패턴 정립 |
| 3 | GAP-2: FIELD | 3파일 | Medium | locator.inputValue() 구현 |
| 4 | GAP-4: OVERLAY-STATE | 3파일 | Low | attrs에 aria-modal/aria-expanded 투영 |
| 5 | GAP-5: TRIGGER | 1파일 | Low | createTrigger 자동 등록 |

## Appendix: 원래 예상 vs 실제

| 원래 예상한 Gap | 실제 결과 |
|----------------|----------|
| GAP-SELECT (초기 선택) | **gap 아님** — click()이 이미 동작 |
| GAP-ENFORCE (enforceMode) | **gap 아님** — click+modifier가 이미 동작 |
| GAP-CHECK (menu check) | GAP-1에 흡수 (STACK과 동일 파일) |
| GAP-REEXPORT (command SDK 미노출) | GAP-1a로 흡수 (OS_STACK_PUSH/POP 미노출) |
| GAP-STATE (앱 초기 상태) | GAP-3에 흡수 (zone setup의 일부) |
