# headless-simulator

## Context

Claim: Vitest에서 Playwright 수준 검증을 달성한다. DOM → OS VDOM 치환. testing-library 없이 OS 자체 테스트 API로 FE 검증 완성.

Why: e2e(Playwright)는 LLM이 테스트를 지속 관리하기에 불편. vitest만으로는 FE에서 거짓 GREEN이 너무 많다.

Evidence: headless-item-discovery 리팩토링 후 vitest "0 regression" → Playwright 25/29 FAIL.

Before → After:
- Before: 20 tsx 4,465줄. adapter 두꺼움. computeAttrs ↔ FocusItem 중복. 거짓 GREEN.
- After: Layer 1 Adapter ~1,000줄. Layer 2 Composition은 OS 직접 접근 ❌. vitest = Playwright 동등 검증.

Architecture:
```
OS (순수 함수)
  ↓
Layer 1: Adapter — OS ↔ React 통로 (Declare, Bind, Project, Notify만)
  FocusGroup, FocusItem, Zone, Item, Field, Listeners
  OS를 직접 import. 극단적으로 얇아야 함.
  ↓
Layer 2: Composition — Adapter를 조합하여 쌓아 올리는 부분
  QuickPick, Dialog, Modal, Trigger.Portal, Toast, 앱 컴포넌트  
  Adapter만 import. OS 직접 접근 ❌.
```

Risks: headless-purity "DOM scan을 view layer로" 결정 뒤집음. 대규모 리팩토링.

## Now

### Phase 0: DX 인프라
- [x] WP4: e2e JSON reporter + summary script ✅

### Phase 1: FocusGroup 얇게 뜨기 (시작점)
- [ ] T1: `ZoneRegistry.bindElement(id, el)` — DOM scan을 OS로 이동. Phase 2: 65줄→3줄
- [ ] T2: `ZoneCallbacks` 타입 — callback 18개를 1개 객체로 묶기
- [ ] T3: `register()` 안에 autoFocus 통합 — FocusGroup에서 제거
- [ ] T4: Phase 1 deps 축소 — useMemo deps 18개→5개
- [ ] T5: `buildZoneEntry`를 ZoneRegistry로 이동 (또는 register에 흡수)
- [ ] T6: deprecated `FocusGroupContext` 분리
- [ ] T1-V: e2e 25개 GREEN 복구 확인

### Phase 2: FocusItem 단일 원천화
- [ ] T7: `computeAttrs`에 `aria-current` 추가 — FocusItem과 동일 계산
- [ ] T8: FocusItem이 `computeAttrs` 소비 — attrs 계산 중복 제거 (263줄→~30줄)
- [ ] T9: `page.isFocused(itemId)` API — toBeFocused 4개 headless 대체
- [ ] T2-V: vitest에서 e2e와 동등한 attrs 검증 확인

### Phase 3: Layer 2 분리 (Composition)
- [ ] T10: QuickPick.tsx를 OS에서 앱(pages/ 또는 features/)으로 이동 — Fit 위반 해소
- [ ] T11: Trigger.tsx — overlay 분기 로직 정리. OS 직접 접근 최소화
- [ ] T12: Dialog.tsx / Modal.tsx — adapter만 사용하도록 확인 (현재 양호)
- [ ] T13: Layer 1/2 경계 lint rule 검토 — Layer 2에서 OS 직접 import 금지

### Phase 4: Field 장기 과제
- [ ] T14: Field.tsx 491줄 — 본질적 DOM sync와 OS 로직 분리 가능한 부분 식별
- [ ] T15: FieldInput/FieldTextarea 유사 코드 통합 검토 (209+206줄)

### Phase 5: Listener 점검
- [ ] T16: PointerListener.tsx 308줄 — DOM traversal 축소 가능한 부분 식별
- [ ] T17: Zone.tsx 306줄 — FocusGroup 축소 후 자동 개선분 확인

### Phase 6: 규칙 환류
- [ ] T18: TSX Adapter Contract를 rules.md에 공식 추가 — 실전 경험 바탕
- [ ] T19: Layer 1/2 경계 규칙 정립

## Done
- [x] WP4: e2e JSON reporter + summary script — `playwright.config.ts` dual reporter + `scripts/e2e-summary.mjs` ✅

## Unresolved
- ZoneCallbacks 묶기 시 기존 API 하위 호환?
- bindElement에서 OS의 DOM scan 전략 소유 형태?
- computeAttrs ↔ FocusItem 단일 원천 방법? (os.useAttrs hook?)
- Field의 contentEditable은 얼마나 OS 밖으로 뺄 수 있는가?
- Layer 2에서 os.useComputed 접근은 허용? (readonly는 OK?)

## Ideas
- `os.useAttrs(itemId)` — computeAttrs를 React hook으로 감싸서 FocusItem이 소비
- Layer 2 허용 범위: os.useComputed(readonly)는 OK, os.dispatch는 ❌ → adapter에서 감싸서 노출
- 전수 조사 목표: **4,465줄 → ~2,200줄 (−50%)**
