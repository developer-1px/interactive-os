## /divide Report — 100% React-Free Unified Inspector (OS Dogfooding)

### Problem Frame

| | 내용 |
|---|------|
| **Objective** | `UnifiedInspector.tsx`(1145 LOC)에서 React-specific state/effect(`useState`, `useEffect`, `useMemo`)를 0개로 축출하고, 오직 OS Primitive(ZIFT, Command, Store)만으로 복잡한 UI를 제어할 수 있음을 증명한다. |
| **Constraints** | 단순 우회(Ref DOM 직접 조작 등) 금지. View는 오로지 OS State의 수동적 Projection(투영결과)이어야 함. 액션은 모두 OS Command로 Dispatch되어야 함. |
| **Variables** | 검색 텍스트 필드, 필터 토글 묶음(Groups), 타임라인(Tree/Accordion), 무거운 필터링 연산 로직(Computed), 자동 스크롤(Auto-scroll), 뷰포트 엘리먼트 하이라이팅(Cross-DOM). |

### Backward Chain

| Depth | Subgoal | 충족? | Evidence | 미충족 시 전제조건 |
|-------|---------|-------|----------|--------------------|
| 0 | `UnifiedInspector` React-Free 100% | ❌ | — | → A, B, C, D, E |
| 1 | **A. Search Input (검색어)** 로직이 OS화 됨. `searchQuery` `useState` 제거 | ✅ | `defineApp({ fields })` 및 TodoApp 선례 | `OS_UPDATE_FIELD` 표준 커맨드 사용 가능 |
| 1 | **B. Filter Pills (다중 토글)** `disabledGroups` 제거 | ❌ | — | → B1, B2 |
| 2 | B1. 다중 선택 상태를 OS Store가 관리 | ✅ | `os.defineContext` / `createCollectionZone` | — |
| 2 | B2. 상태 토글용 `OS_TOGGLE_FILTER` 커맨드 | ❌ | — | 🔨 Work Package |
| 1 | **C. Timeline Tree (아코디언)** `manualToggles` 제거 | ❌ | — | → C1 |
| 2 | C1. Collection Zone 기반 트리 확장/축소 (`OS_EXPAND`) 제어 적용 | ❌ | 로직은 있으나 UI 연결 안 됨 (`createCollectionZone.ts`) | 🔨 Work Package |
| 1 | **D. 무거운 파생 상태 연산 (Derived State)** `useMemo(filteredTx)` 제거 | ❌ | — | → D1 |
| 2 | D1. OS 상에서 React(View) 개입 없이 `filteredTx`를 연산/캐싱하는 Query 모델 (OS Gap: Derived State Engine) | ❌ | `defineQuery`는 커널 내부용. App 레벨 Computed Store 부재 | 🔨 Work Package |
| 1 | **E. 자동 스크롤 (Auto-scroll)** `useEffect` + `scrollRef` 제거 | ❌ | — | → E1 |
| 2 | E1. 새로운 트랜잭션 수신 시 최하단으로 스크롤하라는 의도를 선언적으로 발급하는 OS Lifecycle/Scroll primitive (OS Gap: Scroll Intent) | ❌ | Focus 기반 스크롤만 존재, "Append 시 맨밑 유지" 선언적 제어 부재 | 🔨 Work Package |
| 1 | **F. DOM 하이라이팅** `document.querySelector` 직접 참조 제거 | ❌ | — | → F1 |
| 2 | F1. Hover 시 "이 엘리먼트를 빛나게 하라"는 OS 커맨드(`OS_HIGHLIGHT`) 및 투영 체계 (OS Gap: Overlay Projection) | ❌ | Focus 외에 임시적인 Visual Highlight를 제어하는 OS 스펙 부재 | 🔨 Work Package |

### Work Packages

| WP | Subgoal | 왜 필요한가 (chain) | Evidence (현재 위반 코드) |
|----|---------|-------------------|----------|
| **WP1** | **[OS Gap] Derived State Engine (Computed)** | Goal ← D ← D1 | `UnifiedInspector.tsx` L268: `useMemo(() => { let result = ... })` |
| **WP2** | **[OS Gap] Scroll Intent Primitive** | Goal ← E ← E1 | `UnifiedInspector.tsx` L355: `useEffect(() => { scrollToBottom() })` |
| **WP3** | **[OS Gap] Visual Highlight Overlay** | Goal ← F ← F1 | `UnifiedInspector.tsx` L205: `document.querySelector('[data-id]')` 직접 조작 |
| **WP4** | **Filter & Tree State App Config 마이그레이션** | Goal ← B/C | `useState<Set>()` 3종 세트 |
| **WP5** | **Inspector Component 뷰 계층 쪼개기** | (Pre-requisite / Hygiene) | `export function UnifiedInspector` 단일 컴포넌트 비대화 |

### Residual Uncertainty

- **WP1 (Derived State)**: `filteredTx` 필터링 연산이 OS Store의 Middleware나 Reducer 레벨에서 동기적으로 돌 때 퍼포먼스(Transaction 1000개 시 UI 블로킹) 문제가 없을지 확인 필요.
- **WP2 (Scroll Intent)**: 스크롤이 OS의 본질적 책임인가, 아니면 View의 순수 렌더링 효과인가? (ZIFT 철학에서 DOM Scroll의 위치 논쟁). 이 Dogfooding을 통해 Scroll 역시 OS Command의 Jurisdiction임을 증명할 수 있을지?
