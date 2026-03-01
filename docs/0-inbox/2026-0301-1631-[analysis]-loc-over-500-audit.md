# LOC 500 라인 초과 파일 전수 감사 보고서

| 항목 | 내용 |
| --- | --- |
| 원문 | loc를 조사해서 500 라인이 넘어가는 것들을 전부 조사해서 그럴수 밖에 없는지 아닌지 전수 조사를 해서 표로 만들어 보고해줘 |
| 내(AI)가 추정한 의도 | 1. **경위** — 코드베이스가 커지면서 기능이 집약된 거대 파일(God Object)이 있는지 점검하고 싶음.<br>2. **표면** — 500라인이 넘는 파일을 전부 찾아내고, 각각 분리해야 하는지/그럴만한 사유가 있는지 표로 정리 요구.<br>3. **의도** — 리팩토링(분할) 대상의 우선순위를 식별하여 코드베이스 위생(Hygiene)과 응집도를 높이고자 함. |

## 1. 개요 (Overview)
`src/` 및 `docs/` 디렉토리 내의 소스 파일(`.ts`, `.tsx`, `.js`, `.jsx`) 전수 조사 결과, **총 19개**의 파일이 500라인을 초과했습니다.
이 파일들은 크게 테스트(E2E/Unit), 거대 UI 패널(Inspector/Builder), OS Core(Headless/Registry), 그리고 쇼케이스 및 앱 정의 영역으로 분류됩니다.

## 2. 분석 (Analysis) / 상세 내용 (Details)

| 랭킹 | 파일 경로 | LOC | 분류 | 분리 권장 (리팩토링) | 사유 / 평가 |
| --- | --- | --- | --- | --- | --- |
| 1 | `src/pages/focus-showcase/tests/e2e/focus-showcase.spec.ts` | 1243 | Test (E2E) | 🟡 보류 (Optional) | E2E 테스트 특성상 길어질 수 있음. 시나리오별로 스위트를 분리할 수 있으나 강제할 필요는 없음 |
| 2 | `src/inspector/panels/UnifiedInspector.tsx` | 1145 | UI Panel | 🔴 높음 (Required) | 단일 컴포넌트가 과도하게 큼. 하위 탭/패널(Timeline, State 등)을 별도 컴포넌트로 분리 렌더링 시급 |
| 3 | `src/pages/aria-showcase/index.tsx` | 1099 | Showcase | 🟡 보류 (Optional) | 다수의 UI 데모 컴포넌트를 모아둔 진입점. 본질적으로 코드가 길 수밖에 없는 특성 지님 |
| 4 | `src/inspector/panels/TestBotPanel.tsx` | 920 | UI Panel | 🔴 높음 (Required) | 복잡한 TestBot 상태 관리 로직과 UI 컴포넌트가 강하게 결합되어 팽창. 분할 필요 |
| 5 | `src/os/defineApp.page.ts` | 820 | OS Core | 🟡 중간 (Moderate) | Headless Simulator의 핵심 모듈. 다양한 액션(click, pressKey)이 집약되어 있음 |
| 6 | `src/inspector/panels/ElementPanel.tsx` | 769 | UI Panel | 🔴 높음 (Required) | Inspector 패널 컴포넌트 중 하나. 기능 단위 서브 렌더러로 분할 렌더링 필요 |
| 7 | `src/pages/builder/PropertiesPanel.tsx` | 706 | UI Panel | 🔴 높음 (Required) | 우측 속성 편집 패널. 다양한 폼/입력 컨트롤러가 집적되어 있어 Property Editor별로 분할 필요 |
| 8 | `src/os/3-commands/tests/integration/navigate.test.ts` | 648 | Test (Int) | 🟢 허용 (Acceptable) | 네비게이션 복잡도를 촘촘히 검증하는 통합 테스트. 시나리오가 많아 자연스럽게 길어짐 |
| 9 | `src/pages/focus-showcase/focusScripts.ts` | 647 | Showcase | 🟡 보류 (Optional) | 샘플 데이터와 스크립트 모음. 향후 데이터 분리로 몸집을 줄일 수는 있음 |
| 10 | `src/os/collection/createCollectionZone.ts` | 631 | OS Core | 🔴 높음 (Required) | List, Tree, Grid 등의 로직이 뒤섞여 있어 향후 Strategy(패턴) 단위로 분리 검토 필요 |
| 11 | `src/os/testing/createBrowserPage.ts` | 578 | OS Core | 🟡 중간 (Moderate) | Headless Page (Playwright 연동/추상화 로직)라 커질 여지가 있음 |
| 12 | `src/apps/todo/tests/e2e/todo.spec.ts` | 576 | Test (E2E) | 🟢 허용 (Acceptable) | Todo 앱의 E2E 테스트 검증용. 용인 가능한 크기 |
| 13 | `src/pages/KernelLabPage.tsx` | 572 | Showcase | 🟡 보류 (Optional) | 실험실(Lab) 성격. 분리 시 응집도가 오히려 깨질 수 있어 우선순위는 낮음 |
| 14 | `src/os/collection/tests/unit/collection-zone.test.ts` | 546 | Test (Unit) | 🟢 허용 (Acceptable) | 핵심 논리 검증 테스트. 분할하지 않아도 됨 |
| 15 | `src/docs-viewer/DocsViewer.tsx` | 542 | UI Component | 🟡 중간 (Moderate) | Outline/Sidebar/Content 영역을 별도 컴포넌트로 빼면 줄어듦 |
| 16 | `src/apps/builder/app.ts` | 533 | App Config | 🟢 허용 (Acceptable) | 메인 진입점에서 모든 트리거/필드를 선언적으로(Configuration) 정의하므로 긴 것이 정상 |
| 17 | `src/apps/todo/tests/unit/todo.test.ts` | 529 | Test (Unit) | 🟢 허용 (Acceptable) | 유닛 테스트 묶음. |
| 18 | `src/apps/todo/app.ts` | 529 | App Config | 🟢 허용 (Acceptable) | 전체 App 의존성과 스키마를 구성하는 진입점. |
| 19 | `src/os/6-components/quickpick/QuickPick.tsx` | 520 | UI Component | 🟡 중간 (Moderate) | OS 수준 공통 컴포넌트 내부에 목록, 필터링 로직이 공존. |

## 3. 결론 (Conclusion) / 제안 (Proposal)
500라인 초과 파일 중 **테스트 코드류(Test)**와 **앱 선언부(Config)**, **쇼케이스(Showcase)** 등 절반(10+ 개)은 본질적으로 그럴만하며(Acceptable) 문제되지 않습니다.

그러나 특정 UI Panel들과 OS Core 논리 파일은 **SRP(단일 책임 원칙) 위반에 따른 분할**이 권장됩니다.
- **최우선 조치 제안 (UI Panels)**: `UnifiedInspector`, `TestBotPanel`, `ElementPanel`, `PropertiesPanel`은 React 컴포넌트 하나의 몸집을 키우는 안티패턴에 해당합니다. 탭 또는 도메인 단위로 내부 컴포넌트를 분리해야 합니다.
- **구조 개선 제안 (OS Core)**: `createCollectionZone.ts`는 Collection 타입 파생별 로직 분리(List/Tree/Grid 전략화)를 통해 복잡도를 낮출 여지가 존재합니다.

## 4. Cynefin 도메인 판정
🟢 **Clear**
LOC 정보와 파일 역할을 기반으로 긴 파일의 원인을 규명하고 조치(컴포넌트 분할) 하는 것은 자명한 베스트 프랙티스(Best Practice)입니다.

## 5. 인식 한계 (Epistemic Status)
- 본 분석은 단순히 **코드 LOC 및 파일 경로/이름** 표면을 기반으로 휴리스틱하게 추정한 것입니다.
- 500라인이 넘더라도 내부적으로 `eslint` 룰과 모듈 단위 캡슐화가 철저하다면 실제 분할 강제성은 낮을 수 있습니다; 내부 코드를 깊게 들여다봐야만 분할 여부를 100% 장담할 수 있습니다.

## 6. 열린 질문 (Complex Questions)
1. 리팩토링 최우선 대상으로 지목된 **Inspector Panel** / **Builder Panel** 4종부터 코드를 분할(Divide)하는 작업을 진행하기 원하시나요?
2. `createCollectionZone.ts`의 경우, Tree와 List의 책임이 섞여있다면 이 부분도 OS 개선 이슈(Focus/Active 프로젝트)로 올릴까요?
3. E2E 및 유닛 테스트 시나리오(1000라인 이상)도 향후 길이를 엄격히 제한(예: setup/utils 공통화)하는 룰을 도입할까요?

> **요약**
> > 총 19개의 500 LOC 초과 파일 중 절반은 테스트 및 선언 파일로 허용되나, Inspector 계열 등 5개의 비대한 파일을 식별했습니다.
> > UI 구조가 방대해진 React Panel 들이 최우선 분할 대상이며, OS Collection 로직도 개선 후보입니다.
> > 파일 리팩토링(특히 Inspector류 패널 파일 분할) 작업을 진행할지 결정 부탁드립니다.
