# Blueprint: zoneRegistry Muda 제거

> /why 분석: LLM 에이전트의 "path of least resistance" 관성이 5주간 누적되어 
> 6개 독립 관심사가 하나의 399줄 파일에 동거. triggerRegistry.ts 탄생(669c16e9)과 
> 동일 커밋에서 triggerOverlays를 ZoneRegistry에 넣은 자기모순이 핵심 증거.

## 1. Goal

**zoneRegistry.ts의 관심사를 분리하여 단일 책임 원칙을 회복한다.**

UDE (Undesirable Effects):
- UDE1: Trigger overlay 메타데이터가 Zone과 무관함에도 ZoneRegistry에 동거
- UDE2: DOM 스캔 로직이 `bindElement`, `resolveItems`, `getZoneItems` 3곳에 중복
- UDE3: `resolveLabels` fallback과 `bindElement.getLabels` 자동생성이 동일 패턴

Done Criteria:
- [ ] triggerOverlays가 ZoneRegistry에서 완전히 제거됨
- [ ] DOM 스캔 패턴이 단일 출처(SPoT)로 통합됨
- [ ] 기존 테스트 전부 PASS (`tsc --noEmit` + `vitest`)
- [ ] zoneRegistry.ts 줄 수가 350줄 이하로 감소

## 2. Why

- **rules.md #1 Pit of Success**: "같은 문제를 푸는 선택지가 여럿이면, 하나만 열려 있다"
  - DOM_ITEMS, getZoneItems, resolveItems — 3개 선택지가 열려 있다 → SPoT 위반
- **전제 무효화**: "런타임 레지스트리 = ZoneRegistry에 모든 것을 넣는다"는 전제가 
  triggerRegistry.ts 탄생으로 이미 깨짐 → 관성으로 유지된 잔재 청소
- **LLM God Object 관성 방지**: 이 정리 자체가 "파일 단일 관심사" 규칙의 선례가 됨

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| triggerOverlays는 ZoneRegistry에 있어야 한다 | ❌ Zone lifecycle과 독립. set은 os-sdk/trigger.ts, get은 sense*.ts | triggerRegistry.ts로 이동 |
| resolveItems의 DOM fallback이 필요하다 | ❓ bindElement가 항상 getItems를 설치하므로 fallback 도달 가능성 극히 낮음 | fallback 제거 후 테스트로 검증 |
| getZoneItems와 DOM_ITEMS가 별도로 필요하다 | ❌ 주석이 "same logic"이라고 고백 | getZoneItems → ZoneRegistry.resolveItems 위임 |
| disabled/itemCallbacks를 분리해야 한다 | ⚠️ 유효하나 ROI 낮음 — Zone lifecycle(register/unregister)과 결합 | 현재는 유지. 향후 필요 시 분리 |

## 4. Ideal

### 결과 상태
```
engine/registries/
├── zoneRegistry.ts     — Zone CRUD + snapshot + disabled + itemCallbacks (~320줄)
├── triggerRegistry.ts   — trigger role presets + overlay runtime metadata
├── roleRegistry.ts      — (변경 없음)
└── fieldRegistry.ts     — (변경 없음)

3-inject/
├── itemQueries.ts       — getZoneItems → ZoneRegistry.resolveItems 위임
└── index.ts             — DOM_ITEMS는 ZoneRegistry.resolveItems 사용 (변경 없음)
```

### 부정적 분기 (Negative Branch)
- triggerOverlays 이동 시 import 경로 변경 → 3개 파일(senseKeyboard, senseMouse, compute.ts)
- resolveItems fallback 제거 후 edge case 발생 가능 → 테스트 커버리지로 보호

## 5. Inputs

### 관련 파일
| 파일 | 역할 | 수정 필요 |
|-|-|-|
| `engine/registries/zoneRegistry.ts` (399줄) | 수술 대상 | ✅ |
| `engine/registries/triggerRegistry.ts` (206줄) | triggerOverlays의 새 집 | ✅ |
| `3-inject/compute.ts` | `getTriggerOverlay` import 변경 | ✅ |
| `1-listen/keyboard/senseKeyboard.ts` | `getTriggerOverlay` import 변경 | ✅ |
| `1-listen/_shared/senseMouse.ts` | `getTriggerOverlay` import 변경 | ✅ |
| `os-sdk/src/app/defineApp/trigger.ts` | `setTriggerOverlay` import 변경 | ✅ |
| `os-devtool/src/testing/page.ts` | `setTriggerOverlay` import 변경 | ✅ |
| `3-inject/itemQueries.ts` | getZoneItems 단순화 | ✅ |

### 지식/참조
- /why Report (이 discussion에서 도출)
- KI: ZIFT Standard Specification → ZoneRegistry lifecycle
- rules.md #1: Pit of Success (단일 선택지)

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | triggerOverlays가 triggerRegistry에 | zoneRegistry에 동거 (25줄) | 이동 + import 5곳 변경 | High | — |
| G2 | DOM 스캔 SPoT | 3곳 중복 (bindElement, resolveItems, getZoneItems) | resolveItems를 SPoT로 통합, getZoneItems를 위임 | Med | G1 ✅ 후 |
| G3 | getLabels 스캔 SPoT | 2곳 중복 (bindElement, resolveLabels) | resolveLabels를 SPoT로, bindElement fallback 정리 | Low | G2 ✅ 후 |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| T1 | triggerOverlays → triggerRegistry | 🟢 Clear | — | zoneRegistry에서 triggerOverlays Map + set/clear/get 3메서드(25줄) 삭제 → triggerRegistry.ts에 runtime section 추가. import 5곳 변경 |
| T2 | getZoneItems → resolveItems 위임 | 🟢 Clear | T1 | itemQueries.ts의 getZoneItems 본문을 `ZoneRegistry.resolveItems(zoneId)` + itemFilter 호출로 대체. 사실상 resolveItems가 SPoT |
| T3 | resolveItems fallback 정리 | 🟡 Complicated | T2 | bindElement가 항상 getItems를 설치하는지 확인 후, resolveItems의 DOM fallback(L344-352) 제거 가능성 판단. 테스트 실행으로 검증 |
| T4 | resolveLabels fallback 정리 | 🟡 Complicated | T3 | T3과 동일 패턴. bindElement.getLabels 자동생성이 커버하므로 resolveLabels의 DOM fallback 제거 가능성 |
| T5 | Green 검증 | 🟢 Clear | T1~T4 | `tsc --noEmit` + `vitest run` 전체 통과 확인 |
