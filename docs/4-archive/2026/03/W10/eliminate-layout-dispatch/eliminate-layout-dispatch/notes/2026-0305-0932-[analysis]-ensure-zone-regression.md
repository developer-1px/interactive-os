# Zone 초기화 경로 재설계 — ensureZone 접근 실패 분석

| 항목 | 내용 |
|------|------|
| 원문 | useLayoutEffect에서 kernel dispatch를 제거하고 config.initial 선언형으로 대체하자 |
| 내(AI)가 추정한 의도 | **경위**: OS_ZONE_INIT + seedAriaState 제거 성공 후, 같은 패턴(useLayoutEffect dispatch)이 3곳 더 잔존함을 발견. **표면**: Zone.tsx의 `OS_INIT_SELECTION`, `OS_FOCUS`, `OS_STACK_PUSH` dispatch를 제거하고 선언형으로 대체. **의도**: React mount 타이밍 의존을 완전히 제거하여 headless/UI 완전 동치 달성 + top-down 아키텍처 완성 |
| 날짜 | 2026-03-05 |
| 상태 | ⛔ 첫 번째 접근 실패 — 재설계 필요 |

## 1. 개요

Zone.tsx의 useLayoutEffect에서 3가지 kernel dispatch를 config 선언형으로 대체하려는 시도.
첫 번째 접근(`ensureZone`에서 config-driven initial state)이 **101 regression**을 발생시켜 롤백.

## 2. 분석

### 2.1 제거 대상 (현행)

| # | Zone.tsx 위치 | dispatch | 하는 일 |
|---|-------------|----------|--------|
| Z1a | L187-198 | `OS_INIT_SELECTION` | disallowEmpty → 첫 아이템 자동 선택 |
| Z1b | L173-182 | `OS_FOCUS` | autoFocus → dialog/menu 열리면 첫/마지막 아이템 포커스 |
| Z2 | L206-212 | `OS_STACK_PUSH/POP` | overlay focus stack 관리 |

### 2.2 시도한 접근: ensureZone에서 config 참조

```typescript
// 시도: ensureZone 내부에서 ZoneRegistry.get(zoneId).config 참조
// Zone이 처음 만들어질 때 disallowEmpty → 첫 아이템 자동 선택
export function ensureZone(draft, zoneId) {
  if (!draft.focus.zones[zoneId]) {
    draft.focus.zones[zoneId] = { ...initialZoneState, ... };
    // ← 여기에 config-driven initial state 넣기
    const entry = ZoneRegistry.get(zoneId);
    if (entry?.config.select.disallowEmpty) {
      // 첫 아이템 aria-selected: true
    }
  }
  return draft.focus.zones[zoneId];
}
```

### 2.3 실패 원인: 101 regression

**근본 원인**: `ensureZone`은 **모든 command handler에서 호출**됨 (30+ 호출부).

```
OS_FOCUS → ensureZone → (zone 없으면 만들면서 자동 선택) → 충돌
OS_SELECT → ensureZone → (zone 없으면 만들면서 자동 선택) → 충돌
OS_CHECK → ensureZone → (zone 없으면 만들면서 자동 선택) → 충돌
...모든 command에서 같은 패턴
```

`ensureZone`의 원래 계약: "없으면 빈 틀만 만든다" (no side effects).
이것에 config-driven side effect를 넣으면 **lazy creation의 의미가 변질**됨.

### 2.4 실패의 구체적 메커니즘

headless(`page.goto`)에서:
1. `page.goto` → zone 등록 + `OS_FOCUS` dispatch
2. `OS_FOCUS` handler → `ensureZone` → **zone 새로 만들면서 자동 선택 발동**
3. 이 자동 선택이 `OS_FOCUS`의 followFocus 로직과 충돌
4. 일부 테스트: "선택이 없어야 하는 zone"에서 자동 선택이 발생

### 2.5 검토한 대안

| 방법 | 설명 | 판정 |
|------|------|------|
| A. ensureZone에서 config 적용 | ❌ 시도 → 101 regression | 실패 |
| B. ensureZone 시그니처 변경 `ensureZone(draft, id, config?)` | 호출부 30곳 수정 | 과도 |
| C. ZoneRegistry.register에서 적용 | os state draft에 접근 불가 (Immer produce 외부) | 구조적 한계 |
| D. 별도 `initializeZoneState(draft, id, config)` 함수 | ensureZone 영향 없음. 호출 시점은? | **유력** |
| E. `OS_ZONE_READY` command | Zone mount 완료 후 한 번만 dispatch | OS_ZONE_INIT 부활? |
| F. 현행 유지 (useLayoutEffect dispatch) | headless는 page.goto가 처리 | 원칙 위반 잔존 |

## 3. 결론 / 제안

### 핵심 긴장

```
ensureZone = "lazy creation" = "어떤 command든 zone이 없으면 빈 틀만 만든다"
vs.
config-driven init = "zone이 만들어질 때 config에 따라 초기 상태를 적용한다"

이 두 가지를 같은 함수에서 하면 안 된다.
"만들기"와 "초기화하기"를 분리해야 한다.
```

### 유력한 방향

**D. 별도 `initializeZoneState` 함수**:
- `ensureZone` = 빈 틀 생성 (현행 유지, side-effect-free)
- `initializeZoneState` = config 기반 초기 상태 적용 (disallowEmpty, autoFocus)
- 호출 시점: ???? ← **이것이 핵심 미해결 질문**

## 4. Cynefin 도메인 판정

**🔴 Complex** — "initializeZoneState의 호출 시점" 결정이 아키텍처의 근본 문제를 건드림.
- useLayoutEffect에서 호출? → 원래 문제와 동일 (mount 타이밍 의존)
- command에서 호출? → 어떤 command? "zone에 처음 접근하는 command"를 어떻게 알지?
- ZoneRegistry.register 안에서? → os state draft에 접근 불가

## 5. 인식 한계

- 이 분석은 headless 테스트 환경에서만 검증. UI(React) 환경에서의 mount 순서 영향은 미확인.
- dialog focus restore 2건 pre-existing failure가 T3(STACK_PUSH)와 관련되는지 미확인.
- "Zone 초기화 = 별도 함수"가 다른 패키지(os-react)에서의 호출 패턴에 어떤 영향을 주는지 미분석.

## 6. 열린 질문

1. **"zone 초기화"의 호출 시점은 어디여야 하는가?** → useLayoutEffect도 아니고, ensureZone도 아니면?
2. **"만들기"와 "초기화하기"를 분리하는 것이 진짜 답인가?** → 아니면 lazy creation 자체를 재설계?
3. **headless와 UI의 초기화 경로가 다른 것이 원래 문제인가?** → headless는 page.goto가 직접 state를 쓰고, UI는 useLayoutEffect dispatch. 이 이원화 자체가 근본 원인?

> **3줄 요약**: ensureZone에 config-driven initial state를 넣는 접근은 101 regression 유발 (모든 command에서 호출되므로). "zone 생성"과 "zone 초기화"를 분리해야 하나, 초기화의 호출 시점이 미해결. headless/UI 초기화 경로 이원화 자체가 근본 원인일 수 있다.
