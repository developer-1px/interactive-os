# headless-simulator

## Context

Claim: Vitest에서 Playwright 수준 검증을 달성한다. DOM → OS VDOM 치환. testing-library 없이 OS 자체 테스트 API로 FE 검증 완성.

Why: e2e(Playwright)는 LLM이 테스트를 지속 관리하기에 불편. vitest만으로는 FE에서 거짓 GREEN이 너무 많다.

Evidence: headless-item-discovery 리팩토링 후 vitest "0 regression" 판정 → Playwright 25/29 FAIL.

Before → After:
- Before: createOsPage는 커맨드 로직만 검증. 투영 축(aria-current 등) 미검증. Playwright만 잡는 버그 존재.
- After: OS TestPage가 State → Projection(VDOM)을 순수 계산. vitest만으로 Playwright 동등 검증. e2e는 VDOM→DOM smoke만.

## Now

### Phase 0: e2e GREEN 복구 (선행 조건)
- [ ] WP1: Phase 1/2 라이프사이클 수정 — Phase 1(useMemo) 재실행 시 Phase 2(useLayoutEffect)의 getItems/getLabels 보존. **이것만 수정하면 e2e 25개 GREEN 복구.**

### Phase 1: headless attrs 갭 메우기
- [ ] WP2: computeAttrs에 aria-current 추가 — `isActiveFocused = isFocused && isActiveZone` 순수 함수화
- [ ] WP3: page.isFocused(itemId) API — toBeFocused() 4개 테스트의 headless 대체

### Phase 2: DX / 인프라
- [ ] WP4: e2e 결과 JSON 저장 — `--reporter=json` → LLM이 결과만 읽기. 매번 37초 대기 제거

## Done

## Unresolved
- WP1 수정 방법: Phase 1이 기존 getItems 보존 vs Phase 1/2 합치기?
- computeAttrs ↔ FocusItem 동형성 보장 방법? (단일 원천 필요)
- 다른 e2e spec(aria-showcase, todo, builder)도 같은 패턴으로 깨져 있는지?

## Ideas
- `os.project()` — 전체 zone/item의 expected attrs를 계산하는 순수 함수
- computeAttrs를 FocusItem이 소비하게 → attrs 계산 단일 원천
- Playwright e2e는 "VDOM→DOM 동형성" smoke test로 역할 축소
- `setGrid()` 패턴을 attrs projection에도 적용
- e2e 결과 파일 기반 읽기 (LLM DX 개선)
