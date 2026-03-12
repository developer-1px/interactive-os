# Plan: Condition → Trigger disabled 자동 inject

> Discussion에서 도출: command의 `when: Condition`이 false이면, 해당 command를 사용하는 Trigger에 OS가 `disabled` + `aria-disabled`를 자동 투영한다.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `defineApp/index.ts` — condition lookup API | `flatHandlerRegistry`에 `{handler, when?}` 저장. createTrigger에서 접근 불가 | createTrigger가 command.type으로 when condition을 lookup할 수 있는 내부 API 노출 | Clear | — | tsc 0 | 없음 (내부 API) |
| 2 | `defineApp/trigger.ts:createSimpleTrigger` | `onActivate: command`만 전달. when 무시 | command.type → registry → when condition 조회. condition이 있으면 `useComputed`로 구독하여 `disabled` prop inject | Clear | →#1 | +2 tests | — |
| 3 | `defineApp/trigger.ts:createDynamicTrigger` | factory로 command 생성. when 무시 | #2와 동일 — factory의 command type으로 when condition lookup | Clear | →#1 | +2 tests | factory에서 type 추출 경로 |
| 4 | `os-react/Trigger.tsx` — disabled prop | disabled prop 없음 | `disabled?: boolean` 추가 → `aria-disabled="true"` + click/activate 차단 | Clear | — | +2 tests (aria-disabled 투영, click 차단) | OS primitive 수정 |
| 5 | headless `attrs()` | disabled 투영 없음 | condition false → `attrs().disabled === true` + `attrs()["aria-disabled"] === "true"` | Clear | →#4 | headless attrs 테스트 | — |
| 6 | Todo app 실증 | `cancelEdit`에 `when: isEditing` 있지만 trigger disabled 수동 연결 | 자동 inject 확인 — isEditing=false → cancelEdit trigger 자동 disabled | Clear | →#2 | 기존 tests 유지 | — |

## MECE 점검

- CE: 6행 실행 → condition→disabled 자동 inject 달성 ✅
- ME: 중복 없음 ✅
- No-op: 없음 ✅

## 라우팅

승인 후 → `/project` — 새 프로젝트 `condition-auto-disabled`. Light 규모 (6 tasks, OS primitive 1개 수정 + SDK 연결).

---

## /wip 분석 이력 (2026-03-12)

### 분석 과정

#### 턴 1: /divide (전제 검증)
- **입력**: 6-step 변환 명세의 현재 유효성
- **결과**:
  - **concept 유효**: condition→disabled 자동 inject는 여전히 가치 있음
  - **implementation 전제 변경**: `createSimpleTrigger`/`createDynamicTrigger` 없음. Trigger가 3-Layer 아키텍처로 재구성됨 (L0 headless, L1 data-attr, L2 React)
  - `flatHandlerRegistry`는 `defineApp/index.ts`에 존재 확인
  - **6-step 명세표가 stale** — 현재 Trigger 구조에 맞게 재작성 필요
- **Cynefin**: Complicated — concept Clear, implementation path needs rewrite

### Open Gaps

- [x] Q1: 현재 Trigger 3-Layer에서 condition→disabled를 어디에 주입하는가? → **해소됨** (아래 턴 2 참조)
- [ ] Q2: bind2 프로젝트에서 이 요구사항을 어떤 우선순위로 포함할 것인가?

### 다음 /wip 시 시작점

Q1 해소 → 6-step 명세표 재작성 → `/project` 생성 가능

---

## /wip 분석 이력 #2 (2026-03-12)

### 분석 과정

#### 턴 1: /divide (Trigger 3-Layer 구조 탐색 — Q1 해소)
- **입력**: Q1 "현재 Trigger 3-Layer에서 condition→disabled를 어디에 주입하는가?"
- **결과**:
  - **L0**: `ZoneRegistry`에 item disabled 추적 있음 (`setDisabled`/`isDisabled`). Trigger용은 없음
  - **L1**: `computeTrigger()`는 overlay 관련 attrs만 반환 (`aria-haspopup`, `aria-expanded`, `aria-controls`). disabled 없음
  - **L1**: `computeItem()`은 `ZoneRegistry.isDisabled()` → `aria-disabled` 투영. Trigger에는 이 경로가 없음
  - **L2**: trigger prop-getter는 `data-trigger-id` + `data-trigger-payload`만 반환. disabled 없음
  - **Gap 핵심**: `flatHandlerRegistry`의 `when` 조건이 `ZoneRegistry`나 `computeTrigger()`와 전혀 연결되지 않음
  - **주입점 분석**: 3가지 옵션 존재 — (A) ZoneRegistry 확장, (B) computeTrigger() 확장, (C) prop-getter 확장
- **Cynefin**: Complicated → **Complex** (아래 이유)

#### Complex 판정 이유

현재 bind 구조 위에 condition→disabled를 넣으려면 3-Layer 전체를 관통하는 배관이 필요:
1. `flatHandlerRegistry` → `ZoneRegistry` 연결 (L0)
2. `computeTrigger()` disabled 투영 (L1)
3. prop-getter disabled 전달 (L2)
4. `PointerListener` click 차단 (L2)

이 배관은 **bind 자체의 설계**에 의존한다. bind2에서 bind를 재설계하면 이 배관의 형태가 완전히 달라진다.
→ 현재 bind 위에 덧대면 bind2에서 다시 뜯어야 하는 반창고가 된다.

### 결론

**이 항목은 bind2 프로젝트의 하위 요구사항으로 흡수**되어야 한다.
bind2에서 condition→trigger disabled 배관을 처음부터 설계에 포함시키는 것이 Pit of Success.

### Open Gaps (인간 입력 필요)

- [ ] Q2: bind2 프로젝트 스코프에 condition→disabled를 포함할 것인가? — 포함 시 별도 백로그 불필요
