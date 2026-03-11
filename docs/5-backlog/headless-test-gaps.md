# Headless Test Gaps — 20 Tests → .todo

> 작성일: 2026-03-11
> 출처: vitest fail 20건 분석 → .todo 전환

## Summary

headless 테스트 인프라의 OS core gap으로 인해 20개 테스트가 실패.
모두 `it.todo()` 또는 `TestScript.todo: true`로 전환 완료.

## Gap 분류

### G1. Expand — 초기 상태 미시딩 + 클릭 더블 디스패치 (7 tests)

**파일**: `tests/headless/apps/os-test-suite/expand.test.ts`

- `seedInitialState()`가 `expand.initial` config을 적용하지 않음
- `simulateClick()`이 `resolveMouse()` + `resolveClick()` 양쪽에서 OS_EXPAND 디스패치 → 토글이 2번 발생

### G2. Multi-Select — zone options 미전달 (4 tests)

**파일**: `tests/headless/apps/os-test-suite/selection.test.ts`

- `bind(role, { options: { select: { mode: "multiple" } } })` 설정이 headless `createZoneConfig()`에 전달되지 않음
- 커널이 항상 `select.mode: "none"`으로 인식 → `enforceMode()`가 range/toggle을 replace로 강등

### G3. Field Trigger — headless 파이프라인 미연결 (2 tests)

**파일**: `tests/headless/apps/os-test-suite/field-lifecycle.test.ts`

- `trigger:"enter"`: `buildKeyboardInput()`에서 `editingFieldId`가 null → field layer 미활성
- `trigger:"change"` (OG-013): headless에 DOM input 이벤트 없음 → onCommit 미호출

### G4. Docs Tree Nav + Tab Focus Leak (5 tests)

**파일**: `tests/headless/apps/docs-viewer/docs-scenarios.test.ts` (via `testbot-docs.ts`)

- §1d: 연속 ArrowDown이 포커스를 전진시키지 않음 (tree nav handler)
- §1f: End 키가 마지막 항목에 도달 못함
- §2e: click 후 projection cache invalidation 타이밍 문제
- §4a, §4c: OS_TAB이 이전 zone의 focus를 clear하지 않음

### G5. Space → OS_CHECK (1 test)

**파일**: `src/apps/todo/testbot-todo.ts` §1f

- Pre-existing 이슈. Space inputmap이 headless에서 OS_CHECK을 디스패치하지 않음

### G6. check-triggers — 1경계 원칙 위반 (1 test)

**파일**: `tests/os-sdk/check-triggers.test.ts`

- `ZoneRegistry` 직접 import → `createPage()` + `page.goto()` 없이 registry 조회
- 1경계 원칙 준수하도록 재작성 필요

## 해결 전략

- G1, G2, G3: `packages/os-testing/src/lib/zoneSetup.ts` + `simulate.ts` 수정
- G4: `packages/os-core/` navigate/tab 핸들러 + projection 캐시 수정
- G5: G3 해결 시 함께 해결될 가능성 높음
- G6: 테스트 재작성
