## /plan — 100% React-Free Unified Inspector (OS Dogfooding)

이 명세표는 `UnifiedInspector.tsx`의 React State/Effect 의존성을 0%로 만들면서도, **"OS는 얇은 상호작용의 물리법칙(ZIFT+Bus)만 제공하고, 앱의 도메인(필터링, 파생 연산, 하이라이팅 기준)은 앱이 주도적으로 통제한다"**는 엄격한 Jurisdiction Boundary(관할 경계)를 증명하기 위해 재작성되었습니다.

### 핵심 원칙 (App vs OS 책임 분리)
1. **App의 책임 (Inspector Domain)**: 트랜잭션을 필터링하는 규칙(`searchQuery`, `disabledGroups`), 어떻게 묶을 것인가(`groupConsecutive`), 새 아이템 추가 시 어디로 이동할 것인가(스크롤 의지), 마우스를 올렸을 때 무엇을 빛나게 할 것인가(하이라이트 의지).
2. **OS의 책임 (Kernel Primitives)**: App이 던진 `OS_UPDATE_FIELD` 커맨드를 받아 Store를 갱신하고, App이 던진 `OS_SCROLL`이나 `OS_HIGHLIGHT` 커맨드를 해석해 DOM에 부작용(Side-effect)을 투영하는 파이프라인.

---

### 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|---|---|---|---|---|---|---|
| 1 | `UnifiedInspector` (Search) | `useState(searchQuery)` 사용, input `onChange` 로컬 상태 갱신 | App 수준의 `InspectorStore` (또는 Context) 생성. 검색 필드 조작은 `OS_UPDATE_FIELD` 커맨드로 발급하여 App Store의 `searchQuery`를 갱신 | 🟢 Clear | — | `tsc 0`, React State 없이 Field 상태 연동 | 없음 |
| 2 | `UnifiedInspector` (Filter) | `useState(disabledGroups)` 사용, 로컬 Set 토글 | App Store에 `disabledGroups` 저장. Button은 `OS_TOGGLE_FILTER` (또는 커스텀 App Command) 발급 | 🟢 Clear | — | `tsc 0`, 그룹별 필터링 정상 동작 | 없음 |
| 3 | `UnifiedInspector` (Accordion) | `useState(manualToggles)` 사용, 로컬 Set 토글 | App Store에 `expandedIds` 저장. Collection Zone의 `OS_EXPAND`/`OS_COLLAPSE` 커맨드 인터페이스 활용 | � Clear | — | `tsc 0`, 개별 노드 및 전체 펼치기/접기 정상 동작 | 없음 |
| 4 | 파생 상태 연산 (Derived State) | `useMemo`로 `transactions`, `searchQuery` 변경 시 동기적 리렌더링 연산 | **[App의 책임]** View 컴포넌트 밖(App Model/Reducers)에서 순수 함수로 `filteredTx` 연산 후 Store 갱신 시 주입 | � Clear | 1, 2 | `tsc 0`, 대규모 트랜잭션 시에도 성능 유지 (Memoization 로직 분리 증명) | 없음 |
| 5 | 자동 스크롤 (Auto Scroll) | `useEffect` + `scrollRef` (View가 DOM 직접 조작하여 스크롤 유지) | **[OS Gap]** OS 레벨에서 `OS_SCROLL_TO_BOTTOM`(또는 Zone 단위 Scroll) Command Primitive 신설. App(Store)은 새 Tx 발생 시 이 커맨드를 Dispatch. | � Complicated | — | `tsc 0`, Transaction 추가 시 자동 스크롤 연동 | Focus Scroll과 Scroll Command 간의 주도권 충돌 |
| 6 | 시각적 하이라이트 (Visual) | `highlightElement` 내에서 `document.querySelector` 직접 참조 후 inline style 주입 | **[OS Gap]** OS 커널에 임시 오버레이를 그리는 `OS_HIGHLIGHT` (또는 `HighlightProjection`) 시스템 도입. App은 타겟 ID만 Command/State로 넘김 | � Complicated | — | `tsc 0`, Element Hover 시 뷰포트 내 하이라이트 투영 | Focus Ring(`useFocusOverlay`)과의 레이어 겹침 |
| 7 | 컴포넌트 분할 (View) | 1145줄 단일 `UnifiedInspector` 함수 내에 전체 뷰 로직 혼재 | 구조 분리: `InspectorApp`(진입점), `InspectorFilterBar`, `InspectorTimeline`, `TimelineNode` | 🟢 Clear | 1~3 | `tsc 0`, 기능별 Rendering 무결성 유지 | Context Provider 누락 이슈 |

### 비-Clear 행 분석 제안 (Step 3 즉석 해소)

#### 5번: 자동 스크롤 (Complicated)
- **왜 확정되지 않는가?**: "조건부 스크롤(예: 사용자가 위로 스크롤 중이면 밑으로 내리지 않음)" 로직을 OS가 판단해야 하는가, App이 판단해야 하는가?
- **제안 (책임 분할)**: 
  - **App**: "현재 스크롤이 맨 밑인지" 판단(`isUserScrolled` 상태 관리)하고, 필요 시 `dispatch({ type: "OS_SCROLL", target: "bottom", zoneId })`를 던지는 주체.
  - **OS**: 단순히 해당 Zone을 맨 밑으로 스크롤시키는 Side Effect 파이프라인(`ScrollHandler`)만 제공. 
  - 이렇게 하면 OS는 범용성을 유지하고, 자동 스크롤 기믹은 App 로직으로 뺄 수 있습니다.

#### 6번: 시각적 하이라이트 (Complicated)
- **왜 확정되지 않는가?**: `FocusRing`은 "현재 활성 요소"를 그리는 핵심 모델이나, Highlight는 "App이 지시한 임의의 요소"를 잠깐 그리는 부가 모델임.
- **제안 (책임 분할)**:
  - **App**: 언제, 무엇을 하이라이트할지 결정(Hover Event 수신 → `dispatch({ type: "OS_HIGHLIGHT", targetId })` 발송).
  - **OS**: Global State에 `highlightedElementId`를 두고, `FocusOverlay` 옆에 `HighlightOverlay` 프록시 컴포넌트(Portal)를 띄워 그려주는 투영기(Projector)만 제공.

### 라우팅
승인 후 → `/go` (기존 `inspector-dogfooding` 프로젝트)
이 명세에 따라 BOARD.md를 갱신하고, App State 구조 설계(T1)부터 시작.
