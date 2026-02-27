# headless-simulator

## Context

Claim: Vitest에서 Playwright 수준 검증을 달성한다. DOM → OS VDOM 치환. testing-library 없이 OS 자체 테스트 API로 FE 검증 완성.

Why: e2e(Playwright)는 LLM이 테스트를 지속 관리하기에 불편. vitest만으로는 FE에서 거짓 GREEN이 너무 많다.

Evidence: headless-item-discovery 리팩토링 후 vitest "0 regression" → Playwright 25/29 FAIL.

Before → After:
- Before: FocusGroup.tsx 611줄. DOM scan 로직이 React에 갇혀 있음. createOsPage는 투영 축 미검증. 거짓 GREEN.
- After: FocusGroup.tsx ~200줄 (통로 only). DOM scan은 OS 소유. computeAttrs 완전. vitest = Playwright 동등 검증.

Risks: headless-purity에서 "DOM scan을 view layer로" 결정을 뒤집음. ZoneCallbacks 묶기 시 기존 API 호환성.

## Now

### Phase 0: DX 인프라
- [x] WP4: e2e JSON reporter + summary script — `npm run test:e2e:summary` ✅

### Phase 1: FocusGroup 얇게 뜨기 (통로화)
- [ ] T-slim-1: `ZoneRegistry.bindElement(id, el)` — DOM scan 전략을 OS로 이동. Phase 2를 65줄→3줄로
- [ ] T-slim-2: `ZoneCallbacks` 타입 — callback 18개를 1개 객체로 묶기
- [ ] T-slim-3: `ZoneRegistry.register()`에 autoFocus 자동 실행 통합
- [ ] T-slim-4: Phase 1 deps 축소 — callbacks 묶기 후 useMemo deps 18개→5개로
- [ ] T-slim-5: `buildZoneEntry`를 ZoneRegistry로 이동 (또는 register에 흡수)
- [ ] T-slim-6: deprecated `FocusGroupContext`를 별도 compat 파일로 분리

### Phase 2: headless attrs 갭 메우기
- [ ] WP2: computeAttrs에 `aria-current` 추가
- [ ] WP3: `page.isFocused(itemId)` API

### 검증
- [ ] V1: e2e 25개 GREEN 복구 확인 (T-slim-1 완료 후)
- [ ] V2: vitest에서 e2e와 동등한 attrs 검증 가능 확인 (WP2+WP3 완료 후)

## Done
- [x] WP4: e2e JSON reporter + summary script — `playwright.config.ts` dual reporter + `scripts/e2e-summary.mjs` ✅

## Unresolved
- ZoneCallbacks 묶기 시 기존 API 하위 호환? (spread로 보존 가능할 것)
- bindElement에서 OS가 DOM scan 전략을 어떻게 소유? (getItems fallback as default)
- computeAttrs ↔ FocusItem 단일 원천 보장?
- 다른 e2e spec(aria-showcase, todo, builder)도 같은 패턴?

## Ideas
- FocusGroup 이상적 형태: ~30줄의 통로 (register, bindElement, context, JSX)
- ZoneRegistry.register()가 autoFocus, getItems fallback을 전부 처리
- computeAttrs를 FocusItem이 소비하게 → attrs 단일 원천
- `os.project()` — 전체 zone/item attrs 순수 계산
- e2e 결과 파일 기반 읽기 + watch mode (LLM DX)
