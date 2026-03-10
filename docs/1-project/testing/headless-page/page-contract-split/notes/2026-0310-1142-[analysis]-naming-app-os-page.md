# Naming Analysis: app · os · page 삼각 구조

> 범위: 3개 개념의 관련 파일 6개
> - `packages/kernel/src/createKernel.ts` — Kernel 팩토리
> - `packages/kernel/src/core/tokens.ts` — Kernel 타입 원형
> - `packages/os-core/src/engine/kernel.ts` — OS 싱글턴
> - `packages/os-core/src/engine/appState.ts` — App Slice 등록
> - `packages/os-sdk/src/app/defineApp/types.ts` — defineApp 타입 정의
> - `packages/os-devtool/src/testing/types.ts` — Playwright subset (Page, Locator)

---

## 1. Key Pool

### Layer 1: Kernel (프레임워크 — 앱도 OS도 모른다)

| 식별자 | Key 분해 | Category | 역할 |
|--------|----------|----------|------|
| `createKernel` | `create` + `Kernel` | Verb + Noun | 상태 관리 엔진 인스턴스 생성 |
| `defineScope` | `define` + `Scope` | Verb + Noun | 커맨드 격리 영역 생성 |
| `ScopeToken` | `Scope` + `Token` | Noun + Suffix | 스코프 식별자 (branded) |
| `ContextToken` | `Context` + `Token` | Noun + Suffix | DI 컨텍스트 식별자 |
| `QueryToken` | `Query` + `Token` | Noun + Suffix | 캐시 쿼리 식별자 |
| `EffectToken` | `Effect` + `Token` | Noun + Suffix | 사이드이펙트 식별자 |
| `Command` | `Command` | Noun | 커맨드 타입 (type + payload) |
| `BaseCommand` | `Base` + `Command` | Adj + Noun | 타입 소거된 커맨드 |
| `CommandFactory` | `Command` + `Factory` | Noun + Suffix | 커맨드 생성 함수 |
| `Middleware` | `Middleware` | Noun | 커맨드 중간 처리기 |
| `GLOBAL` | `GLOBAL` | Const | 루트 스코프 상수 |

### Layer 2: OS (인터랙션 OS — Kernel 위에 동작)

| 식별자 | Key 분해 | Category | 역할 |
|--------|----------|----------|------|
| `os` | `os` | Noun (싱글턴) | createKernel 결과 + React 바인딩 |
| `AppState` | `App` + `State` | Noun + Suffix | 전체 상태 `{ os, apps }` |
| `initialAppState` | `initial` + `App` + `State` | Adj + Noun + Suffix | 초기 상태 |
| `OSState` | `OS` + `State` | Noun + Suffix | OS 자체 상태 (focus, overlay 등) |
| `registerAppSlice` | `register` + `App` + `Slice` | Verb + Noun + Noun | 앱 상태를 커널에 등록 |
| `AppSliceConfig` | `App` + `Slice` + `Config` | Noun + Noun + Suffix | 등록 설정 |
| `AppSliceHandle` | `App` + `Slice` + `Handle` | Noun + Noun + Suffix | 등록 결과 API |
| `resetAllAppSlices` | `reset` + `All` + `App` + `Slices` | Verb + Adj + Noun + Noun | 테스트 격리 초기화 |

### Layer 3: App SDK (앱 개발자 표면)

| 식별자 | Key 분해 | Category | 역할 |
|--------|----------|----------|------|
| `defineApp` | `define` + `App` | Verb + Noun | 앱 정의 팩토리 |
| `AppHandle` | `App` + `Handle` | Noun + Suffix | defineApp 반환값 — 앱 정의 API |
| `ZoneHandle` | `Zone` + `Handle` | Noun + Suffix | createZone 반환값 — zone 정의 API |
| `TestInstance` | `Test` + `Instance` | Noun + Suffix | app.create() 반환값 — 테스트 런타임 |
| `AppPage` | `App` + `Page` | Noun + Noun | Playwright 동형 headless 테스트 API |
| `AppPageInternal` | `App` + `Page` + `Internal` | Noun + Noun + Adj | AppPage + dispatch/state (오염) |
| `AppLocatorAssertions` | `App` + `Locator` + `Assertions` | Noun + Noun + Suffix | assertion 타입 |
| `BoundComponents` | `Bound` + `Components` | Adj + Noun | bind() 반환값 — React 컴포넌트 |
| `Condition` | `Condition` | Noun | when 가드 (branded) |
| `Selector` | `Selector` | Noun | 상태 파생 (branded) |
| `FlatHandler` | `Flat` + `Handler` | Adj + Noun | (ctx, payload) → result |
| `ZoneBindings` | `Zone` + `Bindings` | Noun + Suffix | zone 콜백 선언 |
| `FieldBindings` | `Field` + `Bindings` | Noun + Suffix | field 콜백 선언 |
| `TriggerBinding` | `Trigger` + `Binding` | Noun + Suffix | 아이템 트리거 선언 |

### Layer 4: Page (Playwright subset — OS도 App도 모른다)

| 식별자 | Key 분해 | Category | 역할 |
|--------|----------|----------|------|
| `Page` | `Page` | Noun | Playwright Page interface |
| `Locator` | `Locator` | Noun | 요소 탐색 + assertion |
| `LocatorAssertions` | `Locator` + `Assertions` | Noun + Suffix | assertion 메서드 집합 |

---

## 2. 이상 패턴 리포트

### 🔴 동의어 충돌

| # | Key A | Key B | 의미 | 판정 |
|---|-------|-------|------|------|
| 1 | `create` (`createKernel`) | `define` (`defineApp`) | 인스턴스 생성 | **의도적 분리**. `create` = 런타임 인스턴스, `define` = 정의+등록. naming.md 일치 |
| 2 | `AppState` | `OSState` | 상태 타입 | **상위/하위**. `AppState = { os: OSState, apps: {} }`. 혼동 가능 — `AppState`라는 이름이 "전체 상태"인데 `App-`이 붙어서 "앱 상태"로 오해 |
| 3 | `AppHandle` | `AppSliceHandle` | defineApp 반환값 vs registerAppSlice 반환값 | **레이어 다름**. `AppHandle`(SDK) > `AppSliceHandle`(Engine). 하지만 둘 다 `App-Handle`이라 혼동 가능 |

### 🟡 고아 Key

| Key | 출현 | 판정 |
|-----|------|------|
| `Flat` | `FlatHandler` 1회 | "curried가 아닌 평탄한" — 내부 컨벤션. OK |
| `Bound` | `BoundComponents` 1회 | bind() 결과 — 전용 접두사. OK |
| `Internal` | `AppPageInternal` 1회 | **제거 대상** (Page 오염 안티패턴) |

### 🟣 의미 과적

| Key | 의미 1 | 의미 2 | 의미 3 | 심각도 |
|-----|--------|--------|--------|--------|
| **`App`** | 전체 상태 (`AppState`) | 개별 앱 (`defineApp`) | headless 테스트 (`AppPage`) | **🔴 심각** |
| **`Page`** | Playwright interface (`Page`) | headless 구현 (`AppPage`) | 내부 확장 (`AppPageInternal`) | **🔴 심각** |
| `Handle` | defineApp 결과 (`AppHandle`) | registerAppSlice 결과 (`AppSliceHandle`) | overlay 결과 (`OverlayHandle`) | 🟡 보통 |

---

## 3. 핵심 발견: `App` Key의 삼중 과적

**`App`이 3개의 전혀 다른 개념에 사용** 되고 있습니다:

```
App ──┬── AppState      = "전체" 상태 (OS + 모든 앱)
      ├── defineApp      = "하나의" 앱 정의
      └── AppPage        = "앱별" headless 테스트 Page
```

이것이 `const os = defineApp("os")`가 자연스럽게 느껴졌던 이유입니다 — `App`이라는 Key가 이미 과적되어 경계가 흐려져 있으니까요.

실제로 `AppState`는 **OS 전체**를 가리키지, "하나의 앱"을 가리키지 않습니다:

```typescript
interface AppState {
  os: OSState;           // ← OS 전체
  apps: Record<string, unknown>;  // ← 앱들
}
```

이름만 보면 `AppState`은 "앱의 상태"인데, 실제로는 "앱 + OS를 포함하는 전체 상태"입니다.

---

## 4. 대등 관계 — 구조적 비교표

```
┌────────────┬──────────────────┬──────────────────┬────────────────┐
│  계층       │  OS 쪽            │  App 쪽           │  Page 쪽       │
├────────────┼──────────────────┼──────────────────┼────────────────┤
│  생성       │  createKernel()  │  defineApp()      │  (없음)        │
│  반환 타입   │  Kernel (무명)    │  AppHandle        │  (해당 없음)   │
│  런타임 API │  os.dispatch()   │  test.dispatch()  │  page.press()  │
│            │  os.getState()   │  test.state       │  page.locator()│
│  상태 위치   │  state (루트)     │  state.apps[id]   │  (상태 없음)   │
│  상태 타입   │  AppState        │  S (제네릭)        │  —             │
│  스코프      │  GLOBAL          │  defineScope(id)  │  —             │
│  소유 기능   │  Focus, Overlay  │  없음 (OS 소비)    │  —             │
│  테스트 접근 │  os 직접 사용     │  app.create()     │  createPage()  │
│  React     │  os.useStore()   │  slice.useComputed│  —             │
└────────────┴──────────────────┴──────────────────┴────────────────┘
```

### 핵심: os와 app의 관계는 **container ↔ guest**

```
os  = createKernel<AppState>(initialAppState)
                    ↓
app = defineApp("todo", state)
       → registerAppSlice("todo", ...)
         → os.group({ scope: "todo" })  ← os 안에서 생성됨
```

**`defineApp("os")`가 불가능한 이유**: `defineApp`은 내부에서 `registerAppSlice`를 호출하고, 이것은 `os.group()`의 자식으로 등록됩니다. OS가 자기 자신의 자식으로 등록될 수는 없습니다.

---

## 5. 신규 이름 제안 — `App` Key 과적 해소

| 현재 | 문제 | 제안 | 근거 |
|------|------|------|------|
| `AppState` | "전체 상태"인데 `App-` 접두사 | `RootState` 또는 `KernelState` | "루트" 또는 "커널"이 소유 범위를 정확히 반영 |
| `initialAppState` | 위와 동일 | `initialRootState` | 대칭 |
| `AppPage` | Page에 OS 확장을 붙인 것 | **제거** — `Page`(Playwright) + `TestInstance`(app/os)로 분리 | 백로그에 이미 기록됨 |
| `AppPageInternal` | AppPage + dispatch/state | **제거** | 위와 동일 |
| `AppLocatorAssertions` | AppPage 전용 | **제거** — `LocatorAssertions`(types.ts)로 통합 | 중복 타입 |
