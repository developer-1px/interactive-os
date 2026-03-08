# Blueprint: Zone Initial State Ownership

> 생성일: 2026-03-08 23:45
> 기원: /discussion → /conflict → /blueprint

## 1. Goal

**Zone의 선언적 초기 상태(value.initial, select.initial, expand.initial)가 register 경로와 무관하게 자동 적용되어야 한다.**

UDE (Undesirable Effects):
- U1. headless에서 `value.initial`이 적용되지 않음 → 9개 value 테스트 실패
- U2. headless에서 `expand.initial`이 `seedInitialState`에서만 부분 적용 → 7개 expand 테스트 실패
- U3. 초기 상태 로직이 3곳(Zone.tsx, seedInitialState, setupZone)에 분산 → 새 initial 타입 추가 시 누락 필연
- U4. Zone.tsx가 `os.setState()` 직접 호출 → "모든 상태 변경은 Command 통과" 원칙 위반

Done Criteria:
- [ ] Zone.tsx `useLayoutEffect`에서 `os.setState()` 직접 호출 0건
- [ ] page.ts `seedInitialState` 함수 제거 (별도 함수 불필요)
- [ ] 초기 상태 로직이 1곳에만 존재
- [ ] OS Test Suite: expand 7건 + value 9건 = 16건 GREEN (초기 상태 관련)
- [ ] 기존 전체 테스트 regression 0
- [ ] tsc 0

## 2. Why

rules.md 위반 2건:

1. **"모든 상태 변경은 Command(데이터)를 통과한다"** — Zone.tsx가 `os.setState(produce(...))` 직접 호출로 Command Pipeline 우회
2. **"100% Observable"** — headless에서 재현 불가능한 상태 변경은 관찰 불가능

근본 원인: 초기 상태 적용의 **trigger**(React mount)와 **logic**(상태 계산)이 분리되지 않았다. Logic이 React 레이어(Zone.tsx)에 있어서 headless에서 실행 불가.

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| A1. "ZoneRegistry.register()가 초기 상태를 적용해야 한다" | 부분적 — ZoneRegistry는 `os`에 접근 못함 (pure registry) | register 시점에 hook으로 분리 |
| A2. "Command dispatch로 해야 한다 (OS_INIT_ZONE)" | 위험 — React mount에서 dispatch하면 headless에서 trigger 없음. 같은 문제 반복 | Command가 아닌 register hook |
| A3. "zone.bind() 시점에 적용하면 된다" | 무효 — bind()는 정의 시점. Router lazy load 전에 실행되면 전역 오염 + HMR 불가 | — |
| A4. "seedInitialState에 value.initial만 추가하면 된다" | 증상 치료 — 다음 initial 타입에서 또 누락. 3곳 동기화 영구 부채 | 근본 해결 |

**진짜 Goal**: React mount가 trigger하되, 초기 상태 logic은 OS 레이어에 1곳만 존재해야 한다.

## 4. Ideal

```
// 앱 개발자는 bind config에 선언만 한다 (지금과 동일)
zone.bind({
  options: {
    expand: { initial: ["section-a"] },
    value: { initial: { "spin": 50 } },
    select: { initial: "item-1" },
  },
});

// Browser path:
//   React Router → lazy load → Zone mount → ZoneRegistry.register()
//   → register 내부의 onRegister hook이 초기 상태 자동 적용
//
// Headless path:
//   page.goto("/") → registerZoneFromBinding() → ZoneRegistry.register()
//   → 같은 onRegister hook이 초기 상태 자동 적용
//
// 차이: 0. 경로가 달라도 결과가 같다.
```

Negative Branch:
- NBR1: register() 안에서 os.setState()를 호출하면 ZoneRegistry가 os에 의존 → 순환 의존 가능성
  → 해소: hook 패턴으로 DI. register가 os를 import하지 않고, os가 hook을 install한다.

## 5. Inputs

| 입력 | 위치 | 역할 |
|------|------|------|
| ZoneRegistry.register() | `packages/os-core/src/engine/registries/zoneRegistry.ts:134` | zone 등록 (pure registry) |
| Zone.tsx useLayoutEffect | `packages/os-react/src/6-project/Zone.tsx:159-263` | Browser: register + 초기 상태 3종 |
| seedInitialState() | `packages/os-devtool/src/testing/page.ts:398-453` | Headless: 초기 상태 2종 (value 누락) |
| setupZone() | `packages/os-devtool/src/testing/page.ts:205-298` | Legacy: 초기 상태 3종 (수동) |
| FocusGroupConfig | `packages/os-core/src/schema/types/focus/config/` | config 타입 정의 |
| os singleton | `packages/os-core/src/engine/kernel.ts` | 상태 관리 |

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | register 시 초기 상태 자동 적용 | register는 Map.set만 수행 | **onRegister hook** — register 후 실행되는 콜백 | High | — |
| G2 | 초기 상태 로직 1곳 | 3곳 분산 (Zone.tsx, seedInitialState, setupZone) | **applyZoneInitials 함수 추출** → hook에서 호출 | High | G1 |
| G3 | Zone.tsx에서 os.setState 제거 | 3건 직접 호출 | G2의 함수로 **대체** | High | G2 |
| G4 | page.ts seedInitialState 제거 | 별도 함수 존재 | hook이 자동 처리하므로 **삭제** | Med | G2 |
| G5 | 16건 headless 테스트 GREEN | 16건 FAIL (value 9 + expand 7) | G1~G4 완료 시 자동 해소 | High | G1~G4 |
| G6 | setupZone legacy 정리 | 수동 초기 상태 코드 | hook 의존으로 **간소화** | Low | G2 |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| T1 | `applyZoneInitials(os, zoneId, config)` 함수 추출 | Clear | — | Zone.tsx의 초기 상태 로직 3종(value/select/expand)을 os-core 공유 함수로 추출. `os-core/3-inject/` 또는 `os-core/engine/` 배치 |
| T2 | ZoneRegistry에 `onRegister` hook 설치 메커니즘 | Clear | — | `ZoneRegistry.setOnRegister(callback)` — 등록 시마다 callback(id, entry) 호출. DI로 순환 의존 방지 |
| T3 | os singleton이 hook 설치 | Clear | T1, T2 | `os` 초기화 시 `ZoneRegistry.setOnRegister((id, entry) => applyZoneInitials(os, id, entry.config))` |
| T4 | Zone.tsx에서 os.setState 직접 호출 제거 | Clear | T3 | useLayoutEffect의 value/select/expand 블록 제거. register()가 hook을 통해 자동 적용하므로 불필요 |
| T5 | page.ts seedInitialState 제거 | Clear | T3 | goto()에서 seedInitialState 호출 제거. register가 hook으로 자동 처리 |
| T6 | page.ts setupZone 간소화 | Clear | T3 | 수동 초기 상태 코드 제거. register hook에 위임 |
| T7 | 검증 — tsc 0 + 전체 테스트 | Clear | T4~T6 | regression 없음 확인 + OS Test Suite 16건 GREEN 확인 |

### 의존 그래프

```
T1 (추출) ──┐
            ├──→ T3 (hook 설치) ──→ T4 (Zone.tsx 정리)
T2 (hook) ──┘                   ──→ T5 (seedInitialState 제거)
                                ──→ T6 (setupZone 간소화)
                                ──→ T7 (검증)
```

## 라우팅
승인 후 → /project (새 프로젝트) — os-core 리팩토링, testing/os-core 도메인
