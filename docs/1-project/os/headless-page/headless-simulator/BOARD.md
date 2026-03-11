# headless-simulator

| Key | Value |
|-----|-------|
| Claim | Vitest에서 Playwright 수준 검증을 달성한다. DOM → OS VDOM 치환. testing-library 없이 OS 자체 테스트 API로 FE 검증 완성 |
| Before | 20 tsx 4,465줄. adapter 두꺼움. computeAttrs ↔ FocusItem 중복. 거짓 GREEN |
| After | Layer 1 Adapter ~1,000줄. Layer 2 Composition은 OS 직접 접근 ❌. vitest = Playwright 동등 검증 |
| Size | Heavy |
| Risk | headless-purity DOM scan → view layer 결정 뒤집음. 대규모 리팩토링 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | ZoneRegistry.bindElement(id, el) | bind 구현 | ✅ | zoneRegistry.ts L240 |
| T2 | ZoneCallbacks 타입 | 타입 정의 | ✅ | zoneContext.ts L111 |
| T3 | register() + senseKeyboard/resolveClick 추출 | 분리 | ✅ | os-restructure #3-#5 |
| T4 | Phase 1 deps 축소 | useMemo deps 확인 | ⬜ | — |
| T5 | buildZoneEntry → ZoneRegistry 이동 | 흡수 | ⬜ | — |
| T6 | deprecated FocusGroupContext 분리 | 분리 | ⬜ | — |
| T7 | computeAttrs에 aria-current 추가 | FocusItem 동일 계산 | ⬜ | — |
| T8 | FocusItem이 computeAttrs 소비 | 263줄→~30줄 | ⬜ | — |
| T9 | page.isFocused(itemId) API | toBeFocused 4개 headless 대체 | ⬜ | — |
| T10 | QuickPick.tsx 앱으로 이동 | Fit 위반 해소 | ⬜ | — |
| T11 | Trigger.tsx overlay 분기 정리 | OS 직접 접근 최소화 | ⬜ | — |
| T12 | Dialog.tsx / Modal.tsx adapter 확인 | adapter만 사용 확인 | ⬜ | — |
| T13 | Layer 1/2 경계 lint rule | Layer 2 OS 직접 import 금지 | ⬜ | — |
| T14 | Field.tsx 491줄 분리 | DOM sync vs OS 로직 분리 | ⬜ | — |
| T15 | FieldInput/FieldTextarea 통합 | 209+206줄 유사 코드 | ⬜ | — |
| T16 | PointerListener.tsx 308줄 축소 | DOM traversal 축소 | ⬜ | — |
| T17 | Zone.tsx 306줄 개선 | FocusGroup 축소 후 자동 개선 | ⬜ | — |
| T18 | TSX Adapter Contract rules.md 추가 | 실전 경험 바탕 규칙 | ⬜ | — |
| T19 | Layer 1/2 경계 규칙 정립 | 정립 | ⬜ | — |
| T20 | WP-DATA-ATTR | data-item-id 제거 + data-focus-item → data-item | ✅ | tsc 0, 30+ files |
| T21 | WP-LOCATOR | #id selector 파싱 + 6 assertions + inputValue() | ✅ | tsc 0 |
| T22 | WP-FIELD-EDITING | data-editing attr + toBeEditing() | ✅ | tsc 0 |
| WP4 | e2e JSON reporter + summary script | dual reporter + scripts/e2e-summary.mjs | ✅ | playwright.config.ts |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | ZoneCallbacks 묶기 시 기존 API 하위 호환? | Phase 1 |
| U2 | bindElement에서 OS의 DOM scan 전략 소유 형태? | Phase 1 |
| U3 | computeAttrs ↔ FocusItem 단일 원천 방법? | Phase 2 |
| U4 | Field의 contentEditable은 얼마나 OS 밖으로 뺄 수 있는가? | Phase 4 |
| U5 | Layer 2에서 os.useComputed 접근은 허용? (readonly OK?) | Phase 3 |
