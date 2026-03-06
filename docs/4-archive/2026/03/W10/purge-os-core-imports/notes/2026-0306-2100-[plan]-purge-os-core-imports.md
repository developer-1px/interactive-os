# /plan: purge-os-core-imports

> **Goal**: 앱 테스트 27파일에서 @os-core 직접 import를 제거한다. 제거 불가능한 곳 = OS gap 리포트.
>
> **원칙**: page = Playwright subset. OS 내부 개념(zone, command, registry)이 page 표면에 노출되면 안 된다.

## 분류

27파일을 3개 범주로 분류:

| 범주 | 파일 수 | 조치 |
|------|--------|------|
| A. OS 내부 테스트 (앱 테스트 아님) | 6 | reclassify — 별도 OS 테스트 객체 대상 |
| B. 디버깅 repro 테스트 | 2 | os.inspector 제거 |
| C. 앱 테스트 (gap 대상) | 19 | @os-core 제거 시도 → gap 문서화 |

### 범주 A: OS 내부 테스트 (reclassify)

| 파일 | 이유 |
|------|------|
| tests/integration/todo/field-undo-focus.test.ts | os.setState/dispatch/getState 직접 — 순수 커널 행동 검증 |
| tests/e2e/os-react/field-registry.test.ts | FieldRegistry 생명주기 직접 테스트 |
| tests/e2e/os-react/field-infinite-loop.test.tsx | React hook + FieldRegistry 통합 |
| src/apps/builder/__tests__/unit/hierarchical-navigation.test.ts | itemQueries 직접 호출 — OS DOM 쿼리 검증 |
| src/docs-viewer/__tests__/unit/docs-scroll.test.ts | os.dispatch(OS_NAVIGATE) + os.setState — 순수 OS 검증 |
| src/docs-viewer/__tests__/unit/docs-section-nav.test.ts | Keybindings.resolve() 직접 — OS 인프라 검증 |

### 범주 B: 디버깅 repro

| 파일 | 사용 | 조치 |
|------|------|------|
| tests/integration/todo/tab-repro.test.ts | os.inspector.clearTransactions() | os import 제거, dumpTransactions 제거 |
| tests/integration/todo/bulk-undo-repro.test.ts | os.inspector.clearTransactions() | 동일 |

## 변환 명세표 (범주 C: 19파일)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | Gap |
|---|------|--------|-------|---------|------|------|-----|
| 1 | tests/apg/tabs.apg.test.ts | `dispatch(OS_SELECT)` — 초기 탭 선택 setup | click(tab) 으로 초기 선택? | Clear | — | 기존 테스트 PASS | GAP-SELECT: 초기 선택을 input으로 표현할 방법 없음 |
| 2 | tests/apg/toolbar.apg.test.ts | `dispatch(OS_SELECT)` — tabs variant 초기 선택 | 동일 | Clear | — | 동일 | GAP-SELECT |
| 3 | tests/apg/listbox.apg.test.ts | `dispatch(OS_SELECT)` x6 — 초기 선택 + enforceMode 테스트 | click + Shift+click 으로 range/toggle? | Complicated | — | 동일 | GAP-SELECT + GAP-ENFORCE |
| 4 | tests/apg/tree.apg.test.ts | `dispatch(OS_SELECT)` x4 — enforceMode 테스트 | 동일 | Clear | — | 동일 | GAP-ENFORCE |
| 5 | tests/apg/radiogroup.apg.test.ts | `dispatch(OS_SELECT)` — 초기 선택 | click(radio) | Clear | — | 동일 | GAP-SELECT |
| 6 | tests/apg/switch.apg.test.ts | `OS_CHECK` in onAction callback | import 경로만 문제 — SDK re-export? | Clear | — | 동일 | GAP-REEXPORT: OS_CHECK가 SDK에 없음 |
| 7 | tests/apg/menu.apg.test.ts | `OS_STACK_PUSH/POP` + `OS_CHECK` | click(trigger)→open, Escape→close, click(item)→check | Complicated | — | 동일 | GAP-STACK + GAP-CHECK |
| 8 | tests/apg/dialog.apg.test.ts | `OS_STACK_PUSH/POP` — 다이얼로그 open/close | click(trigger)→open, Escape→close | Clear | — | 동일 | GAP-STACK |
| 9 | tests/apg/dropdown-menu.apg.test.ts | `OS_STACK_PUSH/POP` | click(trigger)→open | Clear | — | 동일 | GAP-STACK |
| 10 | tests/apg/carousel.apg.test.ts | `dispatch(OS_SELECT)` — 초기 탭 선택 | click(tab) | Clear | — | 동일 | GAP-SELECT |
| 11 | tests/apg/combobox.apg.test.ts | `OS_STACK_PUSH/POP` | click/focus→open, Escape→close | Clear | — | 동일 | GAP-STACK |
| 12 | tests/integration/todo/todo-user-journey.test.ts | `FieldRegistry.getValue("DRAFT")` | page.locator("DRAFT").inputValue()? | Clear | — | 동일 | GAP-FIELD: field 값 관찰 API 없음 |
| 13 | tests/integration/todo/todo-draft.test.ts | `FieldRegistry.getValue("DRAFT")` | 동일 | Clear | — | 동일 | GAP-FIELD |
| 14 | tests/integration/todo/field-headless-input.test.ts | `FieldRegistry.getValue/updateValue` | page.keyboard.type() + locator | Clear | — | 동일 | GAP-FIELD |
| 15 | tests/integration/builder/locale-dropdown.test.ts | ZoneRegistry + os + resolveRole + OS_OVERLAY_CLOSE | createPage(app) 자동 등록 + click/Escape | Complicated | — | 동일 | GAP-ZONE-SETUP + GAP-STACK + GAP-OVERLAY-STATE |
| 16 | tests/script/devtool/trigger-push-model.test.ts | os.getState().overlays.stack + ZoneRegistry.findItemCallback | page.locator().attrs() | Clear | — | 동일 | GAP-OVERLAY-STATE |
| 17 | src/docs-viewer/__tests__/unit/docs-tab.test.ts | ZoneRegistry.get().getItems injection | createPage(app) 자동 등록 | Clear | — | 동일 | GAP-ZONE-SETUP |
| 18 | src/docs-viewer/__tests__/unit/docs-prev-next.test.ts | ZoneRegistry.setItemCallback | page.click(trigger) 자동 동작 | Clear | — | 동일 | GAP-TRIGGER |
| 19 | src/apps/builder/__tests__/unit/headless-smoke.test.ts | os.setState/dispatch/getState + initialAppState | page API로 전환 | Complicated | — | 동일 | GAP-ZONE-SETUP + GAP-STATE |
| 20 | src/apps/builder/__tests__/unit/builder-interaction-spec.test.ts | ZoneRegistry.register + DEFAULT_CONFIG | createPage(app) 자동 등록 | Clear | — | 동일 | GAP-ZONE-SETUP |
| 21 | src/command-palette/__tests__/unit/command-palette.test.ts | os + ZoneRegistry + OS_OVERLAY_* + initialZoneState | page API 전체 전환 | Complicated | — | 동일 | GAP-ZONE-SETUP + GAP-STACK + GAP-OVERLAY-STATE |

## Gap 요약 (6종)

| Gap ID | 설명 | 영향 파일 |
|--------|------|----------|
| **GAP-SELECT** | 초기 선택 상태를 input(click/press)으로 설정할 방법 없음. 현재 dispatch(OS_SELECT) 사용 | #1,2,3,5,10 (5파일) |
| **GAP-ENFORCE** | selection enforceMode(range→replace 다운그레이드 등)를 input으로 검증할 방법 없음 | #3,4 (2파일) |
| **GAP-STACK** | overlay open/close를 input(click trigger, Escape)으로 할 수 없음. headless에서 trigger→overlay 연결 미구현 | #7,8,9,11,15,21 (6파일) |
| **GAP-CHECK** | menu checkbox/radio의 check를 input(click/Space)으로 토글할 수 없음 | #7 (1파일) |
| **GAP-FIELD** | field 값을 page API로 관찰(read)/조작(write)할 수 없음 | #12,13,14 (3파일) |
| **GAP-ZONE-SETUP** | headless에서 zone이 자동 등록되지 않음. 수동 ZoneRegistry.register() 필요 | #15,17,19,20,21 (5파일) |
| **GAP-OVERLAY-STATE** | overlay stack 상태를 page.locator().attrs()로 관찰할 수 없음 | #15,16,21 (3파일) |
| **GAP-TRIGGER** | standalone trigger의 callback을 page API로 등록할 수 없음 | #18 (1파일) |
| **GAP-REEXPORT** | OS_CHECK 등 command factory가 SDK에 re-export 안 됨 | #6 (1파일) |
| **GAP-STATE** | 앱 초기 상태를 page API로 설정할 방법 없음 | #19 (1파일) |

## MECE 점검

1. **CE**: 21행 + 범주A 6파일 + 범주B 2파일 = 27파일 전수 (빠짐 없음 + 2파일 중복 카운트 제거 = 실제 27)
2. **ME**: tree.apg(#4)는 GAP-ENFORCE만, listbox.apg(#3)는 GAP-SELECT + GAP-ENFORCE — 중복 아님
3. **No-op**: switch.apg(#6)은 dispatch 없이 onAction 콜백에서 사용 — import 경로만 문제. 최소 변경

## 라우팅

승인 후 → /project (testing/purge-os-core-imports) — 새 프로젝트. Meta 성격 (코드 수정 + gap 리포트)
