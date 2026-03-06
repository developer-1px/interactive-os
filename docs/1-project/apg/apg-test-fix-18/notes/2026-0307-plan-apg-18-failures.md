# Plan: Fix 18 APG Test Failures (5 Root Causes)

> 2026-03-07 | 5 files fail, 18 tests fail, 5 distinct root causes

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `roleRegistry.ts:453-457` checkbox preset | `inputmap: { Space: [OS_CHECK()], click: [OS_CHECK()] }` — Enter falls through to global OS_ACTIVATE → toggle | `inputmap: { Space: [OS_CHECK()], click: [OS_CHECK()], Enter: [] }` — Enter blocked by empty command array | Clear | — | checkbox.apg +1 test GREEN | 다른 role의 Enter 동작 영향 없음 (checkbox만 변경) |
| 2 | `page.ts:193-249` goto() bindingEntry 미발견 분기 | `bindingEntry` 없으면 zone 미등록 (silent skip) → createTrigger zones 사용 불가 | `bindingEntry` 없어도 `opts.config?.role` 또는 `opts` 제공 시 fallback 등록: `ZoneRegistry.register(zoneName, { role, config: resolveRole(role, opts.config), getItems: () => opts.items })` | Clear | — | menu-button.apg +11 tests GREEN | page.ts public API 변경 없음. opts에 role 추가 필요 |
| 3 | `menu-button.apg.test.ts:34-41` createMenuPage | `page.goto("apg-menu-button-popup", { items, focusedItemId })` — role 미지정 | `page.goto("apg-menu-button-popup", { items, focusedItemId, config: { role: "menu" } })` — 또는 GotoOptions에 role 추가 | Clear | →#2 | menu-button.apg +11 tests GREEN | — |
| 4 | `TreePattern.tsx:92` select config | `select: { mode: "multiple", followFocus: false, range: true, toggle: true }` | single-select 테스트용 별도 factory 생성, 또는 테스트에서 config override: `page.goto("tree", { config: { select: { mode: "single" } } })` | Clear | — | tree.apg +3 tests GREEN | multi-select 테스트(line 248-276) 깨지면 안 됨 |
| 5 | `tabs.apg.test.ts:159` assertion | `expect(t.attrs("tab-lange-muller")["aria-selected"]).toBe(true)` — 2번째 ArrowRight 후 index 3 기대 | `expect(t.attrs("tab-fonseca")["aria-selected"]).toBe(true)` — 2번째 ArrowRight 후 index 2가 정답 | Clear | — | tabs.apg +1 test GREEN | — |
| 6 | `page.ts` goto() valueNow 초기화 | `zone.valueNow = {}` (빈 객체) — config.value.initial 무시 | goto() 시 `config.value?.initial` 있으면 `zone.valueNow = { ...config.value.initial }` 설정 | Clear | — | meter.apg +1 test GREEN | valueNow 쓰는 다른 패턴(spinbutton, slider) 영향 확인 |

## MECE 점검

1. **CE**: 6행 전부 실행 → 18 tests GREEN. ✅
2. **ME**: 중복 없음. #2와 #3은 os-core fix + test fix로 별개. ✅
3. **No-op**: 없음. ✅

## 라우팅

승인 후 → `/go` (새 프로젝트: apg-test-fix-18) — os-core 3건 + test fix 3건, Light 스코프
