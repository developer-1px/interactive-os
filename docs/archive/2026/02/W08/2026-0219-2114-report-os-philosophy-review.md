# OS Philosophy Review + Red Team Analysis

> **날짜**: 2026-02-19  
> **범위**: 전체 프로젝트 (`src/os/`, `src/apps/`, `src/pages/`, `packages/kernel/`)  
> **모드**: 보고서 (정식 코드 리뷰 + 레드팀)

---

## Part 1: /review — 철학 준수 검사

### ✅ 철학 준수: 강력하게 지켜지고 있는 것들

#### 1. 커맨드 원칙 — 🟢 우수
- 모든 인터랙션이 `BaseCommand` 브랜드 타입 기반. `CommandFactory<T, P>`로 타입-세이프 커맨드 생성.
- `defineApp` → `registerCommand` → `CommandFactory` 파이프라인이 일관적.
- 앱 코드(`apps/todo/app.ts`, `apps/builder/app.ts`)에서 **onClick/onKeyDown 0줄** — 철학 완벽 준수.
- OS 커맨드(`FOCUS`, `NAVIGATE`, `SELECT`, `ACTIVATE`, `ESCAPE` 등)가 의미 단위로 잘 분리됨.

#### 2. 번역기 원칙 (Listener → Command) — 🟢 우수
- `KeyboardListener`: KeyboardEvent → `senseKeyboard(DOM)` → `resolveKeyboard(순수)` → `dispatch`
- `MouseListener`: MouseEvent → `senseMouseDown(DOM)` → `resolveMouse(순수)` → `dispatch`
- DOM 감지(sense)와 순수 해석(resolve)의 분리가 깨끗함. 테스트도 `resolveKeyboard.test.ts`, `resolveMouse.test.ts`로 순수 함수만 독립 테스트.

#### 3. 모든 변경은 하나의 문을 통과 — 🟢 우수
- `kernel.dispatch()` + `kernel.processCommand()`가 유일한 상태 변경 경로.
- `FieldRegistry`는 별도 vanilla store이나, 이것은 **데이터 스트림**(keystroke)이지 **커맨드 스트림**이 아님. 설계 의도에 부합.

#### 4. 3-commands는 DOM을 모른다 — 🟢 우수
- grep 결과: `src/os/3-commands/` 내 `document.getElementById`, `document.querySelector`, `document.activeElement` 사용 **0건**.
- ESLint `pipeline/no-dom-in-commands` 규칙이 자동 차단 중.

#### 5. ARIA APG 기반 Role Registry — 🟢 우수
- `roleRegistry.ts`: 20개+ ARIA 역할 프리셋 (`listbox`, `menu`, `tree`, `tablist`, `grid`, `dialog`...)
- 각 프리셋이 APG 스펙에 근거한 `navigate`, `select`, `tab`, `activate`, `dismiss` 설정을 포함.
- `resolveRole()`로 프리셋 + 오버라이드 병합. 앱은 `role="listbox"`만 선언하면 됨.

#### 6. OS 파이프라인 구조 — 🟢 우수
- `1-listen/` → `2-contexts/` → `3-commands/` → `4-effects/` → `5-hooks/` → `6-components/` 번호 접두사 파이프라인.
- 각 레이어의 책임이 명확히 분리됨.

#### 7. Dogfooding — 🟢 우수
- Todo앱, Builder앱 모두 `defineApp` API 사용.
- E2E 테스트 19개 스펙 파일, 단위 테스트 51개 파일 — 이 OS 위에서 이 OS를 테스트하는 구조.
- `TestInstance<S>` 헤드리스 커널 테스트 인프라 구축 완료.

#### 8. 브랜드 타입 시스템 — 🟢 우수
- `Condition<S>`, `Selector<S,T>`, `CommandFactory<T,P>`, `ScopeToken`, `ContextToken`, `EffectToken` 등 브랜드 타입 전면 적용.
- 컴파일 타임에 잘못된 커맨드 조합을 차단.

---

### 🔴 철학 위반

#### V1. `useComputed`가 객체를 반환 — 성능 원칙 위반
`[Blocker]` 규칙: "useComputed selector는 원시값을 반환한다."

| 파일 | 코드 | 심각도 |
|------|------|--------|
| `apps/todo/widgets/ListView.tsx:14` | `TodoApp.useComputed((s) => s)` | 🔴 전체 상태 구독 |
| `pages/KernelLabPage.tsx:348` | `kernel.useComputed((s) => s)` | 🟡 디버그 페이지 |
| `inspector/panels/InspectorAdapter.tsx:13` | `kernel.useComputed((s) => s)` | 🟡 인스펙터 (허용 가능) |
| `pages/builder/*.tsx` (8개 파일) | `BuilderApp.useComputed((s) => s.data.fields)` | 🔴 `Record<string, string>` 반환 |
| `apps/todo/widgets/Sidebar.tsx:47-49` | `TodoApp.useComputed((s) => s.data.categories)` | 🟡 객체 반환 |

- **ListView.tsx**: `(s) => s`는 모든 상태 변경마다 리렌더. 리스트 아이템이 많아지면 치명적.
- **Builder 블록들 8개**: `s.data.fields` (Record 객체)를 그대로 반환. 필드 하나만 바뀌어도 모든 블록이 리렌더.

#### V2. `pages/` 레이어에 `useState` 다수 잔존
`[Suggest]` 규칙: "앱 코드에 useState, useEffect, onClick이 0줄인 세계"

| 파일 | useState 수 | 역할 |
|------|-----------|------|
| `BuilderPage.tsx` | 1 (`viewport`) | UI 상태 |
| `BuilderListPage.tsx` | 2 (`searchQuery`, `activeFilter`) | 필터 상태 |
| `DocsPage.tsx` | 2 (`content`, `error`) | 비동기 로드 |
| `KernelLabPage.tsx` | 3 | 디버그 도구 |
| `TestDashboard.tsx` | 7+ | 테스트 러너 |
| `aria-showcase/index.tsx` | 6+ | 쇼케이스 |

- **apps/ 내부**에는 useState가 `FocusDebugOverlay.tsx` 1곳뿐 — 앱 레이어는 깨끗.
- **pages/ 레이어**는 "뷰 레이어"로서 `useState`가 일부 허용될 수 있으나, `BuilderPage.tsx`의 `viewport` 상태나 `BuilderListPage.tsx`의 `searchQuery`는 커널 state로 이관 가능.

#### V3. `pages/builder/EditorToolbar.tsx` + `PropertiesPanel.tsx`에 `onClick` 직접 사용
`[Suggest]` 규칙: "모든 인터랙션 prop이 BaseCommand 브랜드 타입"

- `EditorToolbar.tsx`: viewport 전환 버튼에 `onClick` 4곳
- `PropertiesPanel.tsx`: 아이콘 선택에 `onClick` 1곳
- 이들은 OS 커맨드로 전환 가능. `Trigger` 컴포넌트나 `ACTIVATE` 패턴으로 대체해야 함.

#### V4. `console.log` 잔존
`[Nitpick]` 규칙: "`console.log` 대신 `logger` 사용"

- `BuilderListPage.tsx:97`: `console.log("Navigating to builder for:", pageId)`
- 테스트/E2E 파일의 `console.log`는 허용 가능하나, 앱 코드에서는 제거 필요.

---

### 🟡 네이밍/구조 위반

#### N1. `FocusDebugOverlay.tsx` 위치
`[Suggest]` 현재 `apps/builder/` 안에 있으나, 디버그 도구는 `inspector/` 또는 `os/` 하위가 적절.

#### N2. `pages/builder/` 블록 파일 네이밍 불일치
- `NCPHeroBlock.tsx`, `NCPNewsBlock.tsx`, `NCPServicesBlock.tsx`, `NCPFooterBlock.tsx`와
- `HeroBlock.tsx`, `CTABlock.tsx`, `FeaturesBlock.tsx`, `TestimonialsBlock.tsx`가 혼재.
- NCP 접두사 유무가 일관적이지 않음. 동일한 역할인데 이름 컨벤션이 다름.

#### N3. `FieldBindings.onSubmit` deprecated 표시되었으나 완전 제거 안됨
`[Nitpick]` `@deprecated Use onCommit instead` 주석이 달렸지만 `FieldRegistry.ts`의 `FieldConfig`에도 `onSubmit` 필드가 남아있음. 코드에서는 `onCommitRef.current = onCommit || onSubmit`으로 폴백 중.

---

### 🔵 개선 제안

#### I1. `ZoneRegistry`와 `FieldRegistry`의 이중 store 구조 정리
`[Thought]` 현재 `ZoneRegistry` (Map 기반), `FieldRegistry` (vanilla store + `useSyncExternalStore`), `kernel state`가 3개의 독립 store. 원칙 #3 "모든 변경은 하나의 문"과의 긴장 관계가 있음. 데이터 스트림 vs 커맨드 스트림 분리라는 설계 의도는 이해하나, 새 개발자/에이전트에게 어떤 상태가 어디에 있는지 판단하는 학습 비용이 발생.

#### I2. `Zone` 컴포넌트의 prop spreading 패턴
`[Thought]` `Zone.tsx`에서 모든 prop을 `{...(x !== undefined ? { x } : {})}` 패턴으로 전달. 약 20줄의 반복 코드. `Object.fromEntries(Object.entries(props).filter(([,v]) => v !== undefined))` 등으로 정리 가능.

#### I3. 커스텀 ESLint 규칙 5개 — 잘 구축됨
`[Praise]` `no-pipeline-bypass`, `no-direct-commit`, `no-handler-in-app`, `no-imperative-handler`, `no-dom-in-commands` 5개 규칙이 철학을 기계적으로 강제. 에이전트 가드레일로서 매우 효과적.

---

## Part 2: /redteam — 🔴 레드팀 분석

> "이 결정의 약점은?" — Interactive OS의 근본적 설계 결정에 대한 공격적 반론.

### 🏗️ 구조적 약점

#### R1. Kernel이 싱글턴이다
`kernel.ts`에서 `export const kernel = createKernel<AppState>(initialAppState)`로 모듈-레벨 싱글턴. 
- **공격**: 서버 컴포넌트, 마이크로프론트엔드, 멀티 페이지 아키텍처에서 kernel 인스턴스 공유 불가. 테스트에서도 `resetAllAppSlices()`로 우회 중.
- **현실 영향**: 현재 SPA 전제에서는 문제 없으나, "플랫폼"을 표방하는 이상 앱 격리(isolation) 시나리오를 막기 어려움.
- **디자인 텐션**: `createKernel`은 팩토리인데, 앱에선 싱글턴으로 사용. "하나의 앱이 아니라 플랫폼"이라면, 복수 커널이 공존해야 하는 순간이 올 수 있음.

#### R2. DOM 의존성이 Context Provider에 집중
`2-contexts/index.ts`의 `DOM_ITEMS`, `DOM_RECTS`, `DOM_ZONE_ORDER`가 `document.querySelectorAll`로 매 인터랙션마다 DOM을 순회.
- **공격**: N개 zone × M개 아이템일 때, 모든 커서 이동에 O(N×M) DOM 쿼리 발생 가능. 캐싱 없음.
- **완화**: `data-focus-group` + `data-item-id` 기반 쿼리셀렉터가 네이티브 최적화를 탐. 그러나 zone이 100개 이상이면?
- **근본 질문**: "Headless" 커널이라면서 context provider가 DOM을 직접 읽는 것은 사실상 DOM 의존 커널 아닌가?

#### R3. ZoneRegistry가 kernel 밖에 존재
`ZoneRegistry`는 plain Map. kernel의 트랜잭션 로깅, 미들웨어, 인스펙터의 보호를 받지 못함.
- **공격**: zone 등록/해제가 트랜잭션에 기록되지 않아 디버깅 시 "왜 이 zone이 사라졌는지" 추적 불가.
- **공격**: `ZoneRegistry.register()`가 `kernel.dispatch` 없이 직접 호출되어, "모든 변경은 하나의 문" 원칙과 충돌.
- **방어 가능 지점**: "선언 상태"(config, role)는 kernel 밖에 두는 것이 규칙 #10의 의도. 그러나 disabled items도 ZoneRegistry에 있어 경계가 흐림.

### 🧠 인지적 약점

#### R4. defineApp의 API 표면 복잡도
`defineApp`이 반환하는 `AppHandle<S>`의 메서드: `condition`, `selector`, `command`, `createZone`, `createTrigger`, `useComputed`, `create`. `ZoneHandle<S>`의 메서드: `command`, `createZone`, `bind`. `BoundComponents<S>`: `Zone`, `Item`, `Field`, `When`.
- **공격**: 하나의 앱을 만들려면 최소 3계층의 API를 조합해야 함. 새 에이전트가 "Zone을 만들고, command를 등록하고, bind를 해서 BoundComponents를 받아 JSX에 사용"하는 흐름을 학습하는 비용.
- **반론**: "학습 비용 0"(Goal #6)을 추구하지만, 현재 API는 OS의 내부 구조를 반영한 것이지 "이미 아는 것"은 아님.

#### R5. 3개의 상태 저장소
1. `kernel state` (os.focus, apps.*)
2. `ZoneRegistry` (config, element, callbacks, disabledItems)
3. `FieldRegistry` (value, isDirty, error)

- **공격**: "어떤 데이터가 어디에 있는가?"를 매번 판단해야 함. 규칙 #10("변경 주체에 따라 배치")이 있으나, 실무에서 "disabled는 선언 상태니까 ZoneRegistry, 하지만 selection은 액션 상태니까 kernel"이라는 판단에 추론이 필요.

### 🔄 진화적 약점

#### R6. `pages/` 레이어의 정체성 위기
- `pages/builder/*.tsx`에 15개 이상의 UI 블록 파일이 있으나, `apps/builder/`에는 `app.ts`, `features/`, `6-project/` 구조.
- FSD(Feature-Sliced Design) 원칙에 따르면 블록 컴포넌트는 `widgets/` 하위여야 하나, `pages/` 루트에 혼재.
- **공격**: 앱이 성장하면 pages/builder/ 안에 100개 이상의 파일이 쌓이며, "어디까지가 OS, 어디까지가 앱"의 경계가 무너짐.

#### R7. deprecated API의 제거 지연
- `FieldBindings.onChange`, `FieldBindings.onSubmit`이 `@deprecated` 표시만 하고 코드에 남아있음.
- `ZoneCallback` 타입이 `ZoneEntry`의 12개 optional 콜백 필드에 반복. 콜백 종류가 늘어날수록 `ZoneEntry` 인터페이스가 비대해짐.

#### R8. useComputed의 성능 규칙이 구조적으로 강제되지 않음
- 규칙 #1 "useComputed selector는 원시값을 반환한다"가 rules.md에만 존재하고 ESLint/타입 시스템으로 강제되지 않음.
- Builder 블록 8개가 `s.data.fields`(Record 객체)를 반환하는 위반이 이미 퍼져 있음.
- **공격**: 규칙이 "soft"면 에이전트가 반복적으로 위반. lint로 `no-object-return-in-useComputed` 규칙을 추가하지 않으면 계속 재발.

---

## 종합 평가

### 점수

| 영역 | 점수 | 비고 |
|------|------|------|
| **커맨드 아키텍처** | 9/10 | 거의 완벽한 커맨드 패턴 |
| **Listener 파이프라인** | 9/10 | sense/resolve 분리 모범적 |
| **타입 안전성** | 8/10 | 브랜드 타입 우수. `as any`는 대부분 테스트/인스펙터 |
| **ARIA/APG 준수** | 9/10 | 20개+ 역할 프리셋, E2E 테스트 |
| **성능 규칙 준수** | 5/10 | `useComputed` 객체 반환 8+건 |
| **useState/onClick 0줄** | 7/10 | apps/ 깨끗, pages/ 다수 잔존 |
| **네이밍 일관성** | 7/10 | NCP / non-NCP 혼재, deprecated 미정리 |
| **ESLint 가드레일** | 9/10 | 5개 커스텀 규칙 운영 중 |
| **테스트 커버리지** | 8/10 | 51 unit + 19 E2E |
| **문서 수준** | 9/10 | official/ + why-*.md + kernel 문서 10편 |

### 결론

**아키텍처 수준에서, Interactive OS는 자체 선언한 철학을 높은 수준으로 준수하고 있습니다.**

핵심 파이프라인(Listener → Context → Command → Effect → Component)의 분리가 깨끗하고, `defineApp` API가 앱 개발자에게 타입 안전한 인터페이스를 제공합니다. 특히 ESLint 커스텀 규칙 5개로 아키텍처 위반을 기계적으로 차단하는 점이 "에이전트의 시행착오 비용을 줄인다"는 Goal #1에 직결됩니다.

**가장 시급한 문제는 `useComputed` 성능 위반의 구조적 방치입니다.** Builder 블록 8개가 `s.data.fields` 객체를 직접 반환하는 패턴이 이미 확산되었고, 이것은 ESLint 규칙으로 강제되지 않아 재발합니다.

---

> 🔵 **블루팀 방어를 진행할까요?**
