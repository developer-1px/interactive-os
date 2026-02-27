# /doubt — FocusGroup.tsx 극한 축소 분석

> **전제**: FocusGroup의 역할은 **React ↔ OS 통로**. Props를 OS에 전달하고, OS state를 React context로 내려보내는 것이 전부.
> **의심**: 611줄이나 되는 이유는 OS가 해야 할 일이 React에 갇혀 있기 때문.

## Round 1: 목록화 + 필터 체인

### 이상적 FocusGroup의 역할 정의

```
FocusGroup = React ↔ OS 통로

책임:
1. Props → OS 등록 (ZoneRegistry.register)
2. DOM ref → OS 바인딩 (element binding)
3. OS state → React context (ZoneContext, FocusContext)
4. Lifecycle → OS 알림 (mount/unmount → init/cleanup)
5. JSX 렌더링 (div + data-zone + role + children)

그 외 = 통로가 아닌 로직 = 빼야 할 후보
```

### 항목별 의심

| # | 항목 | 줄 | 역할 1문장 | ① 쓸모 | ② 여기? | ③ 줄이기 | ④ 병합 | 판정 |
|---|------|-----|-----------|--------|---------|---------|--------|------|
| 1 | **Imports** | 1-46 | 의존성 | ✅ | ✅ | — | — | 🟢 |
| 2 | **ZoneContext** | 48-62 | Zone identity context | ✅ | ✅ | — | — | 🟢 |
| 3 | **FocusContext** | 64-78 | Focus config context | ✅ | ✅ | — | — | 🟢 |
| 4 | **FocusGroupContext (deprecated)** | 80-106 | 하위 호환 composite | ✅ 7곳 사용 | ❌ 별도 파일로 가능 | — | — | 🟡 Fit: 이동 대상 |
| 5 | **FocusGroupProps** | 112-223 | Props 타입 정의 | ✅ | ✅ | 🟡 | ④ 가능 | 🟡 아래 상세 |
| 6 | **generateGroupId** | 229-232 | Auto ID | ✅ | ✅ | — | — | 🟢 |
| 7 | **buildZoneEntry** | 240-297 | Props → ZoneEntry 변환 | ✅ | **❌ OS layer** | — | — | 🟡 Fit |
| 8 | **Config 해석 (resolveRole)** | 347-363 | Role preset + overrides | ✅ | ✅ | — | — | 🟢 |
| 9 | **Phase 1: useMemo register** | 382-433 | Config + callbacks 등록 | ✅ | 🟡 | 🟡 | ④ 가능 | 🟡 아래 상세 |
| 10 | **Phase 2: useLayoutEffect DOM** | 435-500 | DOM binding + getItems/getLabels auto | ✅ | **❌ 가장 문제** | 🟡 | — | 🟡 Fit |
| 11 | **AutoFocus headless** | 502-512 | getItems 있으면 render-time focus | ✅ | **❌ OS layer** | — | — | 🟡 Fit |
| 12 | **AutoFocus stack** | 514-522 | dialog push/pop | ✅ | ✅ | — | — | 🟢 |
| 13 | **isActive computed** | 524-525 | activeZone === groupId | ✅ | ✅ | — | — | 🟢 |
| 14 | **Context values memo** | 527-539 | Context 객체 안정화 | ✅ | ✅ | — | — | 🟢 |
| 15 | **Render: headless mode** | 550-568 | context only, no div | ✅ | ✅ | — | — | 🟢 |
| 16 | **Render: standard mode** | 570-607 | div + attrs + contexts | ✅ | ✅ | — | — | 🟢 |

### 상세 의심

#### #5 FocusGroupProps (112줄 → ?)

```
① 쓸모? Yes — 타입 안전
② 여기? Yes — 컴포넌트 props
③ 줄이기? 🟡 — callback props 18개가 개별 선언. 묶을 수 있음:
   
   현재: onAction, onSelect, onCopy, onCut, onPaste, onCheck, onDelete,
         onMoveUp, onMoveDown, onUndo, onRedo, onDismiss (12개 callback)
   
   대안: callbacks?: ZoneCallbacks (1개 객체)
   
   효과: Props 12줄 → 1줄. buildZoneEntry도 단순화.
   Fence: 개별 props로 만든 이유? → 선언적 API ("onAction만 쓰고 싶다"). 
         하지만 Lean 관점: 과잉처리(Overprocessing). 객체 1개로 충분.
```

#### #7 buildZoneEntry (57줄 → 0줄?)

```
① 쓸모? Yes — Props를 ZoneEntry로 변환
② 여기? ❌ — 이것은 "Props → 등록 데이터 변환" 순수 함수.
   FocusGroup.tsx에만 있는 이유: 다른 데서 안 써서.
   하지만 ZoneRegistry 근처(2-contexts)에 있어야 논리적.
③ 줄이기? 🟡 — #5에서 callbacks를 묶으면 if 체인 18줄 → spread 1줄.
④ 병합? 🟡 — ZoneRegistry.register()가 직접 props를 받으면 별도 함수 불필요.
```

#### #9 Phase 1 (51줄 → ?)

```
① 쓸모? Yes — headless에서 config 접근 가능하게.
② 형태? 🟡 — useMemo 안에 ZoneRegistry.register() 직접 호출.
   deps 18개 — 어떤 것이든 바뀌면 전체 재등록.
   이것이 Phase 2의 getItems를 덮어쓰는 원인.
③ 줄이기? 🟡 — #5 callbacks 묶기하면 deps 18개 → 5개.
   또는: ZoneRegistry.update(groupId, patch)로 변경분만 갱신.
```

#### #10 Phase 2 (65줄 → ?)

```
① 쓸모? Yes — DOM에서 items/labels 자동 스캔.
② 여기? ❌ — 이것이 핵심 문제.
   "DOM에서 아이템을 발견하는 전략"은 OS의 관심사.
   FocusGroup은 "ref를 전달"만 하면 됨.
   
   현재:
     FocusGroup useLayoutEffect → querySelectorAll → getItems closure 생성 → register
   
   이상:
     FocusGroup useLayoutEffect → ZoneRegistry.bindElement(groupId, el)
     ZoneRegistry가 "element가 있으면 DOM scan, 없으면 getItems()"를 내부에서 결정
   
   효과: Phase 2가 65줄 → 3줄.
   
   Fence: 왜 여기에 만들었나? → "DOM scan을 view layer에 두자"는 설계 의도 (headless-purity).
   아직 유효? → 아니. 이 결정이 e2e 25개 실패의 직접 원인.
   결론: 설계 의도 자체가 잘못됐다. DOM scan 전략은 OS가 소유해야 한다.
```

#### #11 AutoFocus headless (10줄 → ?)

```
① 쓸모? Yes — getItems 있으면 render-time autoFocus
② 여기? 🟡 — autoFocus 자체가 OS의 관심사. ZoneRegistry.register() 시점에 자동 실행 가능.
   "zone이 autoFocus=true로 등록되면, 첫 번째 item으로 focus"는 OS 규칙.
③ 줄이기? 🟡 — register() 안에 autoFocus 로직 포함하면 FocusGroup에서 제거 가능.
```

## Chesterton's Fence 검증

| 항목 | 왜 만들었나 | 아직 유효? | 결정 |
|------|------------|-----------|------|
| #4 deprecated context | Zone/FocusGroup 분리 전 통합 context | 아직 7곳 사용 → 점진 제거 | 🟡 장기 제거 |
| #5 개별 callback props | 선언적 API UX | 유효하나 과잉처리 | 🟡 ZoneCallbacks 객체로 묶기 |
| #7 buildZoneEntry | Props→ZoneEntry 변환 | 유효하나 위치가 잘못됨 | 🟡 ZoneRegistry로 이동 |
| #9 Phase 1 deps 18개 | 모든 변경 감지 | e2e 실패의 원인 → 무효 | 🟡 update 패턴 or 묶기 |
| #10 Phase 2 DOM scan | "view layer에 DOM" 의도 | **e2e 25 FAIL로 무효 증명** | 🟡 OS로 이동 |
| #11 AutoFocus in component | headless vs browser 분기 | register 시 처리하면 불필요 | 🟡 OS로 이동 |

## Before → After (목표)

| | Before | After (목표) |
|---|--------|-------------|
| **FocusGroup 전체 줄 수** | 611줄 | ~200줄 (통로 + contexts + JSX만) |
| **콜백 props** | 개별 18개 | ZoneCallbacks 객체 1개 |
| **buildZoneEntry** | FocusGroup.tsx 내 57줄 | ZoneRegistry 또는 별도 유틸 |
| **Phase 1 deps** | 18개 → 불일치 원인 | ~5개 (config, id, callbacks객체, getters) |
| **Phase 2 DOM scan** | 65줄 closure 생성 | `Registry.bindElement(id, el)` 3줄 |
| **AutoFocus 로직** | 컴포넌트 3곳 분산 | OS register 시 자동 |
| **deprecated context** | 27줄 inline | 별도 파일 (장기) |

## 도출: Task 목록

| Task | 내용 | Cynefin | 선행 |
|------|------|---------|------|
| **T-slim-1** | ZoneRegistry.bindElement(id, el) — DOM scan 전략을 OS로 이동. Phase 2를 3줄로 축소 | 🟡 Complicated | — |
| **T-slim-2** | ZoneCallbacks 타입 정의 — callback 18개를 1개 객체로 묶기 | 🟢 Clear | — |
| **T-slim-3** | ZoneRegistry.register()에 autoFocus 자동 실행 통합 | 🟡 Complicated | T-slim-1 |
| **T-slim-4** | Phase 1 deps 축소 — callbacks 묶기 후 useMemo deps 5개로 | 🟢 Clear | T-slim-2 |
| **T-slim-5** | buildZoneEntry를 ZoneRegistry 근처로 이동 (또는 register에 흡수) | 🟢 Clear | T-slim-2 |
| **T-slim-6** | deprecated FocusGroupContext를 별도 compat 파일로 분리 (장기) | 🟢 Clear | — |

## Residual: 자기교정 확인

Phase 2에서 DOM scan을 OS로 되돌리면, 이전 headless-purity 프로젝트에서 "DOM scan을 view layer로 옮기자"고 결정한 것을 뒤집는 것임.
하지만 그 결정이 e2e 25개 FAIL을 만들었으므로 **뒤집는 것이 맞다**.
"view layer에 DOM"이 아니라 "OS가 discovery 전략을 소유하되, DOM이 있으면 사용"이 올바른 형태.
