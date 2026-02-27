# headless-simulator

## Context

Claim: Vitest에서 Playwright 수준 검증을 달성한다. DOM → OS VDOM 치환. testing-library 없이 OS 자체 테스트 API로 FE 검증 완성.

Why: e2e(Playwright)는 LLM이 테스트를 지속 관리하기에 불편. vitest만으로는 FE에서 거짓 GREEN이 너무 많다.

Evidence: headless-item-discovery 리팩토링 후 vitest "0 regression" 판정 → Playwright 25/29 FAIL. Phase 1/2 라이프사이클 불일치를 headless에서 원리적 감지 불가.

Before → After:
- Before: createOsPage는 커맨드 로직만 검증. React 렌더/투영 축은 미검증. Playwright만 잡는 버그 존재 (거짓 GREEN).
- After: OS TestPage가 State → Projection(VDOM)을 순수 계산. DOM 없이 attrs(aria-current, tabIndex, aria-selected 등) 검증 가능. vitest만으로 Playwright와 동등한 검증 달성.

Risks: FocusItem attrs 로직 복잡도(role 추론, expandable 결정). 추출 시 FocusItem과의 중복 관리. DOM 레이어 "얇게 뜨기"의 범위 결정.

## Now
- [ ] T1: 깨진 e2e 25개 분류 — 어떤 종류의 검증인지 (attrs, navigation, focus stack 등) 분석
- [ ] T2: 현재 createOsPage.attrs()와 FocusItem의 attrs 계산 비교 — 갭 분석
- [ ] T3: Phase 1/2 라이프사이클 불일치 수정 (e2e GREEN 복구가 선행 조건)

## Done

## Unresolved
- OS VDOM의 구체적 형태?
- FocusItem attrs 순수 함수 추출 범위?
- DOM 레이어를 "얇게 뜨는" 기준선?
- TestPage와 createOsPage, createPage의 관계 재정의?

## Ideas
- `os.project()` — 전체 zone/item의 expected attrs를 계산하는 순수 함수
- `page.expectAttrs("item-id", { "aria-current": true })` — createOsPage 확장
- `setGrid()` 패턴을 attrs projection에도 적용
- Playwright e2e는 "VDOM→DOM 동형성" 검증으로 역할 축소 (smoke test)
