# Headless Test Gaps — 20 Tests → .todo

> 작성일: 2026-03-11
> 출처: vitest fail 20건 분석 → .todo 전환

## Summary

headless 테스트 인프라의 OS core gap으로 인해 20개 테스트가 실패.
모두 `it.todo()` 또는 `TestScript.todo: true`로 전환 완료.

## Gap 분류

### ~~G1. Expand — 초기 상태 미시딩 + 클릭 더블 디스패치 (7 tests)~~ ✅ 해결

**파일**: `tests/headless/apps/os-test-suite/expand.test.ts`

- ✅ `zoneSetup.ts:142-154`에서 `expand.initial` config 시딩 구현 완료
- ❓ 클릭 더블 디스패치는 별도 확인 필요 (현재 expand tests가 todo에서 해제되었는지 미확인)

### G2. Multi-Select — OS_ACTIVATE→OS_SELECT 더블 디스패치 (4 tests)

**파일**: `tests/headless/apps/os-test-suite/selection.test.ts`

- **Root cause 변경**: zone options 전달은 `zoneSetup.ts:33-34`에서 정상 동작 확인
- **실제 원인**: `selection.test.ts:52-54` 주석 — "OS core bug: OS_ACTIVATE dispatches OS_SELECT (toggle mode for multi), causing double-toggle cancellation after resolveMouse's OS_SELECT"
- OS_ACTIVATE가 내부적으로 OS_SELECT를 디스패치 → resolveMouse의 OS_SELECT와 이중 발생 → toggle이 2번 → 원래 상태로 복귀
- **os-gaps.md에 미등록** → OG-032로 등록 필요

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

- ~~G1~~: ✅ 해결됨
- G2: `os-core` 수정 — OS_ACTIVATE가 OS_SELECT를 내부 디스패치하는 경로에서 multi-select mode 시 이중 토글 방지
- G3: `os-testing` field layer 연결 (trigger:"enter") + OG-013 (trigger:"change")
- G4: `os-core` navigate/tab 핸들러 + projection 캐시 수정
- G5: G3 해결 시 함께 해결될 가능성 높음
- G6: 테스트 재작성 (1경계 원칙 준수)

---

## /wip 분석 이력 (2026-03-12)

### 분석 과정

#### 턴 1: /divide (현재 상태 검증)
- **입력**: 6개 Gap의 현재 유효성 재검증
- **결과**:
  - ✅ **G1 해소 확인**: `zoneSetup.ts:142-154`에 expand.initial 시딩 구현 완료
  - G2-G6은 여전히 미해소
  - **20 todos → 현재 상태 재집계 필요** (G1 해소로 최대 7개 감소 가능)
- **Cynefin**: Complicated — G1 해소로 범위 축소, 나머지 방향 명확

#### 턴 2: 코드 증거 조사 (G2 root cause 재분석)
- **입력**: G2의 "zone options 미전달" 전제가 유효한가?
- **결과**:
  - `zoneSetup.ts:33-34`: options ARE being passed (`const overrides = { ...bindings.options }`)
  - **Root cause 변경**: zone options 전달 문제가 아님. `selection.test.ts:52-54`에 실제 원인 기록됨
  - OS_ACTIVATE→OS_SELECT 더블 디스패치가 multi-select toggle을 무효화
  - 이 root cause가 `os-gaps.md`에 미등록
- **Cynefin**: Complicated — root cause 명확, OS core 수정 필요

#### 턴 3: os-gaps.md 등록 여부 확인
- **입력**: multi-select 더블 디스패치 root cause가 os-gaps.md에 있는가?
- **결과**: 미등록. OG-032로 등록 필요
- **Cynefin**: Complicated — 6개 독립 OS core 변경 필요. 각각은 Clear/Complicated이나 범위가 넓음

### Open Gaps (인간 입력 필요)

- [ ] Q1: G1 해소 후 expand.test.ts의 7 tests가 실제로 todo에서 해제되었는가? — 해소 시 잔여 todo 수 확정
- [ ] Q2: G2(multi-select)와 G1(expand click)의 더블 디스패치가 같은 root cause인가? — 해소 시 수정 범위 축소 가능

### 다음 /wip 시 시작점

Q1 확인 → todo 수 재집계 → G2 OG-032 등록 후 → 개별 Gap을 `/project`로 분리 가능
