# OS 마이그레이션 Pre-Mortem 분석

> 날짜: 2026-02-10  
> 태그: pre-mortem, os, migration, risk  
> 가정: "6개월 후, 이 마이그레이션은 실패했다. 왜?"

---

## 1. 개요 (Overview)

Pre-mortem은 **프로젝트가 실패했다고 가정하고, 그 원인을 역추적**하는 분석 기법이다.  
현재 `os/` → `os-new/`(Kernel 기반) 마이그레이션의 진행률은 약 65%. 아래는 이 마이그레이션이 실패하거나 중단될 수 있는 시나리오들이다.

---

## 2. 실패 시나리오

### 🔴 시나리오 1: "영원한 공존"

> `os/`와 `os-new/`가 둘 다 사라지지 않고 계속 공존한다.

**원인:**
- Legacy `os/`를 참조하는 외부 파일이 **47곳 이상** — 한 번에 전환하기엔 blast radius가 너무 크다
- `primitives/FocusGroup.tsx`(Legacy)를 **30곳 이상**이 부르고 있어 `6-components/Zone.tsx`(Kernel)으로 교체가 영원히 연기됨
- 앱 레이어(`apps/todo/`, `apps/kanban/`)가 `os/`와 `os-new/` **양쪽을 동시에** import하고 있어, 어느 하나를 끊으면 전부 깨짐

**증거 (현재 코드):**
```
os/features/AntigravityOS.tsx     → os-new/core/logic 사용
os/app/export/primitives/Zone.tsx → os-new/primitives/FocusGroup 사용
os/app/export/primitives/*.tsx    → os-new/store, os-new/schema 다수 참조
apps/todo/                        → os-new/lib, os-new/core 참조
```

**완화 전략:**
- `os/app/export/primitives/`를 thin wrapper로 만들어 `os-new/6-components/` 위임
- 앱 레이어의 import를 `os-new/`로 통일하는 작업을 **하나의 atomic 단계**로 진행
- `DEPRECATED` 주석 + `eslint no-restricted-imports` 룰 추가

---

### 🔴 시나리오 2: "Zustand를 못 죽인다"

> Kernel State가 완성되었지만, `store/focusGroupStore.ts`(Zustand per-zone)를 제거하지 못한다.

**원인:**
- `focusGroupStore`는 Zone별로 **독립 인스턴스**를 생성하는 구조. Kernel은 단일 state tree
- Zone이 mount/unmount 될 때 **Zustand 인스턴스 생명주기**를 수동 관리 중 (`storeCache`)
- Kernel State에서 Zone 엔트리의 생성/제거 타이밍을 맞추려면 **Zone 컴포넌트 자체를 재작성**해야 함
- 이 작업은 `primitives/FocusGroup.tsx` 전체를 `6-components/Zone.tsx`로 교체하는 것을 의미 → 시나리오 1과 연쇄

**완화 전략:**
- Kernel State에 `registerZone(id)` / `unregisterZone(id)` 커맨드 추가
- Zone 컴포넌트의 `useEffect`에서 register/unregister 호출
- Zustand 스토어와 Kernel State를 **동기화하는 bridge**를 먼저 만들어 점진적 전환

---

### 🟡 시나리오 3: "FIELD가 블로커"

> Field 관련 기능(inline edit)이 Kernel으로 전환되지 못해 전체 마이그레이션이 막힌다.

**원인:**
- FIELD_* 커맨드 5개 (`START_EDIT`, `COMMIT`, `CANCEL`, `BLUR`, `SYNC`)가 아직 **Kernel에 미등록**
- `os/app/export/primitives/Field.tsx`가 `FieldRegistry`(Zustand)와 `useCommandListener`(EventBus)에 강하게 결합
- 이벤트 버스 기반의 `useFieldHooks.ts`를 Kernel dispatch로 교체하려면 **Field 생명주기 전체 재설계** 필요
- Field는 Todo/Kanban 앱의 **핵심 인터랙션** — 깨지면 앱 사용 불가

**완화 전략:**
- `FieldRegistry`를 `store/`에 이미 복사해둔 상태 — Kernel State가 아닌 standalone registry로 유지 가능
- 커맨드만 먼저 Kernel에 등록하고, UI 컴포넌트는 **나중에** 교체
- Field를 마지막에 하는 대신, **가장 먼저** spike로 검증

---

### 🟡 시나리오 4: "성능 회귀"

> 단일 Kernel State로 통합한 뒤, Zone간 격리가 깨져 **불필요한 리렌더링**이 폭발한다.

**원인:**
- 현재 Zustand per-zone store는 **자연스러운 격리** 제공: Zone A의 상태 변경이 Zone B의 구독자를 trigger하지 않음
- Kernel 단일 state tree에서는 `state.os.focus.zones[zoneA]`가 바뀌면 **모든 zones 구독자**에게 알림이 갈 수 있음
- `useComputed` selector의 정교한 granularity가 필요하지만, 실수로 넓은 selector를 쓰면 cascade 리렌더

**완화 전략:**
- `useComputed`에 **shallow comparison** 기본 적용
- Zone별 selector 패턴 문서화: `useComputed(s => s.os.focus.zones[zoneId]?.focusedItemId)`
- React DevTools Profiler로 전환 전후 비교 측정
- 문제 발견 시 zone 데이터를 **별도 atom**으로 분리하는 fallback 계획

---

### 🟢 시나리오 5: "Builder가 유령이 된다"

> Builder* 컴포넌트 6개가 마이그레이션 대상에서 빠져 영원히 Legacy에 남는다.

**원인:**
- Builder 컴포넌트는 **NCP 데모 페이지 전용** — 일반 OS 기능과 무관
- 마이그레이션 우선순위가 계속 뒤로 밀림
- 결국 `os/` 폴더를 삭제할 때 Builder만을 위해 `os/`를 유지해야 하는 상황

**완화 전략:**
- Builder를 `os/`도 `os-new/`도 아닌 **`pages/builder/` 또는 `apps/builder/`로 이동** — 도메인 코드이므로 OS 레이어에 있을 이유 없음
- 또는 Builder의 OS 의존성을 분석하여 `6-components/`의 Zone/Item만으로 대체 가능한지 확인

---

### 🟢 시나리오 6: "테스트 커버리지 부재"

> 마이그레이션 중 동작이 미묘하게 달라졌지만, 아무도 눈치채지 못한다.

**원인:**
- TestBot(E2E)은 `os/` 전용 — `os-new/` Kernel Pipeline에 대한 테스트 없음
- Unit test 0개 (Kernel 패키지 자체는 70개 있지만, OS Layer 커맨드에 대한 테스트 없음)
- `focus-showcase` 페이지가 수동 테스트 역할이지만, CI에 통합되어 있지 않음

**완화 전략:**
- `3-commands/` 각 커맨드에 대한 **순수함수 단위 테스트** 추가 (resolve 로직)
- `focus-showcase` 기반 Playwright 스냅샷 테스트
- 마이그레이션 전후 동일 시나리오의 **transaction log 비교**

---

## 3. 리스크 매트릭스

| 시나리오 | 영향도 | 발생 가능성 | 리스크 | 완화 난이도 |
|---|---|---|---|---|
| 1. 영원한 공존 | 🔴 높음 | 🔴 높음 | **치명적** | 중간 |
| 2. Zustand 못 죽임 | 🔴 높음 | 🟡 중간 | **높음** | 높음 |
| 3. FIELD 블로커 | 🟡 중간 | 🟡 중간 | **중간** | 중간 |
| 4. 성능 회귀 | 🟡 중간 | 🟢 낮음 | **낮음** | 낮음 |
| 5. Builder 유령 | 🟢 낮음 | 🔴 높음 | **낮음** | 낮음 |
| 6. 테스트 부재 | 🟡 중간 | 🔴 높음 | **중간** | 중간 |

---

## 4. 결론 (Conclusion)

**가장 위험한 시나리오는 "영원한 공존"(시나리오 1)**이다. 이를 방지하려면:

1. **전환 deadline 설정** — "N일 후 `os/` 삭제" 목표를 세우고 거꾸로 계획
2. **앱 레이어 import 통일** — `os/`에서 `os-new/`로의 re-export를 활용하되, 최종 정리 단계를 반드시 실행
3. **FIELD를 spike로 빠르게 검증** — 가장 복잡한 컴포넌트를 먼저 해결하면 나머지는 자연스럽게 따라옴
4. **테스트 추가** — 마이그레이션 전후 동작 동일성을 보장하는 최소한의 자동화 테스트

> **핵심 경고:** 현재 구조는 "점진적 마이그레이션"을 사용하고 있지만, 점진적 마이그레이션의 최대 리스크는 **영원히 완료되지 않는 것**이다. 마감 일자 없는 점진적 마이그레이션은 거의 항상 실패한다.
