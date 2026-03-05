# Blueprint: OS_ZONE_INIT 제거 — 커맨드 자립 + config 직접 판단

## 1. Goal

**OS_ZONE_INIT 커맨드와 seedAriaState 메커니즘을 완전히 제거한다.**

- `computeItem()`이 "어떤 aria-* 속성을 투영할지"를 items map의 키 존재(`"key" in obj`) 대신 **config에서 직접 판단**
- 모든 커맨드가 `ensureZone()`으로 **자립적으로** zone 상태 존재를 보장
- 결과: 타이밍 버그 원천 소멸, headless/DOM 경로 완전 통일, 코드 순감

**Done Criteria:**
1. `OS_ZONE_INIT` 커맨드 파일 삭제
2. `seedAriaState.ts` 파일 삭제
3. `computeItem()`이 config 기반으로 aria-* 투영 판단
4. 기존 headless 테스트 24/24 PASS (accordion)
5. UI 테스트 3건 PASS (현재 FAIL인 것들)
6. 전체 tsc 0 errors

## 2. Why

### UDE (Undesirable Effects)
- **UDE1**: headless 24/24 PASS인데 UI 3/12 FAIL — Zero Drift 위반
- **UDE2**: `aria-expanded`가 초기 DOM에 투영되지 않음 (null vs "false")
- **UDE3**: `OS_ZONE_INIT`이 Zone `useLayoutEffect`에서 dispatch → `getItems()`가 빈 배열 반환 → seed 스킵
- **UDE4**: `seedAriaState`가 config에서 유도 가능한 정보를 items map에 미리 복사 — 불필요한 간접 계층

### Root Cause
`computeItem()`의 `if ("aria-expanded" in ariaItemState)` 가드가 **config 대신 items map의 키 존재**에 의존한다.
이 설계가 seed를 강제하고, seed의 타이밍 의존성이 DOM 경로에서 버그를 유발한다.

### 원칙 위반
- **Pit of Success 위반**: `OS_ZONE_INIT`이 실패하면 조용히 잘못된 상태가 됨. "잘못 만들기가 더 쉬운" 구조.
- **순서 의존**: Zone.tsx에서 `OS_ZONE_INIT` → `bindElement` → `OS_FOCUS` 순서가 필수. 순서가 틀리면 깨짐.

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| computeItem은 items map에서 키 존재를 확인해야 한다 | ❌ 무효 | config에서 직접 확인 (`config.expand.mode !== "none"`) |
| Zone 상태는 명시적 init 시점에 생성되어야 한다 | ❌ 무효 | ensureZone으로 lazy 생성 (이미 대부분 커맨드가 사용 중) |
| aria-* 키를 미리 심어야 computeItem이 올바르게 동작한다 | ❌ 무효 | 값은 `ariaItemState["key"] ?? false`로 fallback 가능 |
| OS_ZONE_INIT이 없으면 disallowEmpty/autoFocus가 깨진다 | ❌ 무효 | OS_FOCUS/OS_INIT_SELECTION 자체가 ensureZone으로 zone 생성 |

## 4. Ideal

### 4.1 computeItem — config 직접 판단

```typescript
// Before: seed 의존
if ("aria-expanded" in ariaItemState) {
  attrs["aria-expanded"] = isAriaExpanded;
}

// After: config 직접 판단
const shouldProjectExpand = entry?.config?.expand?.mode
  && entry.config.expand.mode !== "none";
if (shouldProjectExpand) {
  attrs["aria-expanded"] = ariaItemState["aria-expanded"] ?? false;
}
```

### 4.2 Zone.tsx — OS_ZONE_INIT 제거

```typescript
// Before
useLayoutEffect(() => {
  os.dispatch(OS_ZONE_INIT(zoneId));  // ← 삭제
  if (containerRef.current) {
    ZoneRegistry.bindElement(zoneId, containerRef.current);
  }
  if (config.project.autoFocus) {
    os.dispatch(OS_FOCUS({...}));  // ensureZone이 zone 생성
  }
```

```typescript
// After
useLayoutEffect(() => {
  if (containerRef.current) {
    ZoneRegistry.bindElement(zoneId, containerRef.current);
  }
  if (config.project.autoFocus) {
    os.dispatch(OS_FOCUS({...}));  // ensureZone이 zone 생성
  }
```

### 4.3 headless page.ts — seed 로직 제거

`setActiveZone()`과 `goto()`에서 `seedAriaState` 호출과 T1+T2 seed 블록 삭제.

## 5. Inputs

### 수정 대상 파일

| File | Role | Change |
|-|-|-|
| `os-core/3-inject/compute.ts` | 투영 hub | `"key" in` 가드 → config 기반 판단 |
| `os-core/3-inject/seedAriaState.ts` | seed 함수 | **삭제** |
| `os-core/4-command/focus/zoneInit.ts` | OS_ZONE_INIT | **삭제** |
| `os-core/4-command/focus/index.ts` | re-export | `OS_ZONE_INIT` export 제거 |
| `os-react/6-project/Zone.tsx` | React Zone | `OS_ZONE_INIT` dispatch 제거 |
| `os-core/3-inject/simulate.ts` | headless sim | `registerHeadlessZone`에서 `OS_ZONE_INIT` 제거 |
| `os-devtool/testing/page.ts` | test infra | `seedAriaState` import/호출 제거, T1+T2 블록 삭제 |
| `os-core/3-inject/__tests__/unit/headless-item-discovery.test.ts` | 단위 테스트 | `OS_ZONE_INIT` 사용 제거 |

### 이미 ensureZone을 쓰는 커맨드 (변경 불필요)

OS_FOCUS, OS_NAVIGATE, OS_EXPAND, OS_SELECT, OS_TAB, OS_ESCAPE, OS_CHECK, OS_PRESS, OS_VALUE_CHANGE, OS_SYNC_FOCUS, selectAll, clear — **14개 커맨드 모두 이미 ensureZone 사용 중**.

### ensureZone을 안 쓰는 커맨드 (확인 필요)

| Command | 현재 패턴 | 영향 |
|-|-|-|
| `OS_INIT_SELECTION` | `draft.os.focus.zones[zoneId]` 직접 접근 | ensureZone으로 교체 필요 |
| `field/startEdit.ts` | `draft.os.focus.zones[activeZoneId]` 직접 접근 | ensureZone으로 교체 필요 |
| `field/commit.ts` | `draft.os.focus.zones[activeZoneId]` 직접 접근 | ensureZone으로 교체 필요 |
| `field/cancel.ts` | `draft.os.focus.zones[activeZoneId]` 직접 접근 | ensureZone으로 교체 필요 |
| `clipboard/copy,cut,paste` | `ctx.state` 읽기 전용 (write 없음) | zone 없으면 early return. 변경 불필요 |
| `activate/activate.ts` | `ctx.state` 읽기 전용 | zone 없으면 early return. 변경 불필요 |

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | computeItem이 config에서 aria-* 투영 판단 | `"key" in ariaItemState` 가드 | config 기반 판단 로직으로 교체 | **High** | — |
| G2 | seedAriaState.ts 삭제 | 존재함 (83줄) | 파일 삭제 + 모든 import 제거 | **High** | G1 |
| G3 | OS_ZONE_INIT 삭제 | zoneInit.ts 존재 (48줄) | 파일 삭제 + export/import/dispatch 5곳 제거 | **High** | G1, G2 |
| G4 | Zone.tsx에서 dispatch 제거 | L162 `os.dispatch(OS_ZONE_INIT(zoneId))` | 1줄 삭제 + import 정리 | **Med** | G3 |
| G5 | headless page.ts seed 로직 제거 | setActiveZone의 seed (L820-838), goto의 T1+T2 (L1008-1075) | seed 블록 삭제, seedAriaState import 제거 | **High** | G1, G2 |
| G6 | simulate.ts registerHeadlessZone 수정 | L355 `kernel.dispatch(OS_ZONE_INIT(zoneId))` | OS_FOCUS 또는 ensureZone 직접 사용으로 교체 | **Med** | G3 |
| G7 | initSelection/field 커맨드 ensureZone 교체 | 직접 `zones[id]` 접근 (4곳) | ensureZone import + 교체 | **Low** | — |
| G8 | headless-item-discovery 테스트 수정 | OS_ZONE_INIT 사용 (L48) | 제거 후 대안 세팅 | **Low** | G3 |
| G9 | 전체 테스트 통과 확인 | accordion headless 24/24, UI 9/12 | tsc 0 + accordion headless PASS + UI PASS | **High** | G1-G8 |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| T1 | computeItem config 기반 전환 | 🟢 Clear | — | `"key" in"` 가드 4곳을 config 기반 판단으로 교체. `aria-expanded`, `aria-selected`, `aria-checked`, `aria-pressed` 각각. |
| T2 | seedAriaState.ts 삭제 | 🟢 Clear | T1 | 파일 삭제. zoneInit.ts와 page.ts의 import 제거. |
| T3 | OS_ZONE_INIT 삭제 | 🟢 Clear | T2 | zoneInit.ts 삭제. focus/index.ts export 제거. |
| T4 | Zone.tsx dispatch 제거 | 🟢 Clear | T3 | L162 삭제, OS_ZONE_INIT import 제거. |
| T5 | headless page.ts seed 제거 | 🟢 Clear | T2 | setActiveZone의 seed 블록(L820-838), goto의 T1+T2 블록(L1008-1075) 삭제. seedAriaState import 제거. |
| T6 | simulate.ts 수정 | 🟢 Clear | T3 | registerHeadlessZone에서 OS_ZONE_INIT dispatch → ensureZone 직접 또는 제거 |
| T7 | ensureZone 미사용 커맨드 교체 | 🟢 Clear | — | initSelection, field/startEdit, field/commit, field/cancel의 `draft.os.focus.zones[id]` → ensureZone |
| T8 | 테스트 수정 + 검증 | 🟢 Clear | T1-T7 | headless-item-discovery 테스트 OS_ZONE_INIT 제거. tsc 0. accordion headless + UI 전 PASS. |

**총 예상 삭제**: seedAriaState.ts (83줄) + zoneInit.ts (48줄) + page.ts seed 블록 (~70줄) + simulate.ts seed (~5줄) ≈ **~200줄 순감**

**실행 순서**: T1 → T2 → T3 → T4/T5/T6 (병렬) → T7 → T8
