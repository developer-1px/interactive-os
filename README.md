# 🌌 Interactive OS

**Interactive OS**는 고해상도 공간 상호작용 중심의 React 기반 인터랙션 OS입니다. 모든 사용자 의도를 **커맨드(Command)**로 공식화하고, 논리적 요소 레지스트리와 물리적 DOM 레이아웃 사이의 간극을 메워 복잡한 웹 애플리케이션을 위한 직관적이고 키보드 우선적인 공간 상호작용을 가능하게 합니다.

---

## 🚀 핵심 철학

### "Structure as Specification"
디렉토리 구조가 곧 아키텍처 문서이며, 모든 상호작용은 단일 커맨드 파이프라인을 통과합니다.

### 5-Phase Interaction Pipeline
```
1-listeners → 2-contexts → 3-commands → 4-effects → 5-hooks → 6-components
```
키보드/마우스 이벤트가 리스너에서 캡처되고, 컨텍스트를 주입받아, 커맨드로 변환되고, 이펙트로 실행되며, 훅을 통해 UI에 반영됩니다.

---

## 🎯 7축 포커스 모델 (The 7-Axis Focus Model)

복잡한 2D 레이아웃에서도 예측 가능한 탐색을 보장하는 7개의 원자적 축:

1. **Direction** — 상하좌우 공간 이동
2. **Edge** — 경계 처리 및 순환(Wrapping) 정책
3. **Tab** — DOM 및 시각적 순서를 따르는 재귀적 선형 탐색
4. **Target** — ID 또는 로직을 통한 직접 포커스 타겟팅
5. **Entry** — 구역(Zone) 간 이동 시 스마트한 진입점 선택 (Seamless Entry)
6. **Restore** — OS 관리 기반의 포커스 메모리 및 복구
7. **Recovery** — 포커스된 항목이 삭제/변경될 때 자동 복구

---

## 🏗️ 아키텍처

### Kernel (`@kernel`)
순수함수 기반의 상태 관리 커널. `createKernel` → `defineCommand` → `dispatch` 패턴으로 모든 상태 변경을 트랜잭션으로 처리합니다.

- **Branded Types** — CommandFactory, EffectToken, ScopeToken으로 타입 안전성 보장
- **Transaction Log** — 최대 200개의 상태 변경 이력 + `travelTo` 지원
- **Scoped Bubbling** — 커맨드가 Zone 스코프에서 앱 스코프로 자동 전파

### defineApp — 앱 정의 API
```tsx
const TodoApp = defineApp<TodoState>("todo", INITIAL, { history: true });
const listZone = TodoApp.createZone("list");
const toggleTodo = listZone.command("TOGGLE", handler);
const { Zone, Item, Field } = listZone.bind({ role: "listbox", onCheck: toggleTodo });
```

`defineApp`은 앱의 상태, 커맨드, Zone을 하나의 선언적 API로 통합합니다. `bind()`를 통해 ARIA role 기반의 프리미티브 컴포넌트를 자동 생성합니다.

### ZIFT 프리미티브 (Zone-Item-Field-Trigger)
| 프리미티브 | 역할 |
|:---|:---|
| **Zone** | 관할권(Jurisdiction) 정의. ARIA role preset으로 동작을 선언적으로 결정 |
| **Item** | 포커스 가능한 공간적 단위. Virtual Focus + Roving TabIndex |
| **Field** | 편집 가능한 텍스트 영역. IME 안전 처리 + 커맨드 기반 커밋/취소 |
| **Trigger** | 클릭/키보드를 커맨드로 변환. asChild 패턴 지원 |

추가 프리미티브: **Dialog**, **Toast**, **QuickPick (Command Palette)**, **Kbd**

---

## 🕹️ 커맨드 시스템

**13개 OS 커맨드 도메인**이 11개 디렉토리에서 관리됩니다:

| 도메인 | 커맨드 예시 |
|:---|:---|
| navigate | `OS_NAVIGATE` (공간 이동) |
| tab | `OS_TAB` (선형 탐색) |
| selection | `OS_SELECT` (단일/다중/범위 선택) |
| interaction | `OS_ACTIVATE`, `OS_CHECK`, `OS_DELETE` |
| field | `OS_FIELD_START_EDIT`, `OS_FIELD_COMMIT`, `OS_FIELD_CANCEL` |
| clipboard | `OS_COPY`, `OS_CUT`, `OS_PASTE` |
| focus | `OS_FOCUS`, `OS_SYNC_FOCUS`, `OS_STACK_PUSH/POP` |
| dismiss | `OS_ESCAPE` (컨텍스트 인식 해제) |
| expand | `OS_EXPAND` (트리 노드 확장/축소) |
| overlay | 다이얼로그/모달 오버레이 관리 |

---

## 🛠️ 주요 애플리케이션

### 📝 Reference Todo
벤치마크 SaaS 스타일 Todo 앱:
- **defineApp 패턴** 활용한 선언적 앱 정의
- Kanban 2D Navigation + 멀티 셀렉션
- Undo/Redo 미들웨어 (Noise Filtering, Housekeeping Silence)
- Clipboard OS Bridge + Shift+Arrow 범위 선택
- **BDD 통합 테스트** (headless + browser 이중 검증)

### 🏗️ Web Builder
고해상도 Visual CMS 빌더:
- Bento Grid 레이아웃 + Seamless Section Navigation
- Block Preset 시스템 + Page Template
- Integrated Text Editing (인라인 콘텐츠 편집)

---

## 🧪 테스트 인프라

### Headless Testing (`createOsPage`)
DOM 없이 OS 커맨드 파이프라인을 검증하는 순수함수 기반 테스트:
```ts
const page = createOsPage();
page.goto("list", { items: ["a", "b", "c"], role: "listbox" });
page.keyboard.press("ArrowDown");
expect(page.focusedItemId()).toBe("b");
expect(page.attrs("b").tabIndex).toBe(0);
```

### App-level Testing (`defineApp.create()`)
앱 커맨드를 격리된 커널에서 단위 테스트:
```ts
const app = TodoApp.create();
app.dispatch(toggleTodo({ id: "task-1" }));
expect(app.state.todos["task-1"].completed).toBe(true);
```

### 테스트 스택
- **Vitest** — Unit + Integration (headless)
- **Vitest Browser** — Component rendering 검증
- **Playwright** — E2E (smoke, ARIA showcase, APG contract)

---

## 💎 Teo 디자인 시스템

Interactive OS 애플리케이션의 시각적 근간:
- **Compact Premium Light** — 생산성 중심의 매끄러운 미학
- **Command-Driven Purity** — 프리미티브가 글로벌 OS 신호로 제어
- **Pro-Tool Interaction Paradigms** — 고밀도 전문 도구에 최적화

---

## 🔍 관찰 가능성 및 진단

- **Command Inspector** (`Cmd+D`) — 실시간 이벤트 트레이싱, 상태 검사 (8개 탭)
- **Spatial Laboratory** — `/focus-showcase`, `/aria-showcase`에서 7축 탐색 벤치마킹
- **APG Contract Tests** — W3C WAI-ARIA Authoring Practices 준수 검증

---

## 💻 기술 스택

- **Runtime**: [React 19](https://react.dev/) + [TypeScript 5.9](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **State Management**: Custom Kernel (순수함수 + Transaction Log)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Vanilla CSS
- **Routing**: [TanStack Router](https://tanstack.com/router) (File-based)
- **Testing**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linter/Formatter**: [Biome](https://biomejs.dev/)

---

## 🏁 시작하기

```bash
# 저장소 클론
git clone https://github.com/developer-1px/interactive-os.git

# 의존성 설치
npm install

# 개발 서버 실행 (앱 + 문서 동시)
npm run dev

# 앱만 실행
npm run dev:app

# 테스트
npm test              # unit + integration (headless)
npm run test:browser  # browser component tests
npm run test:e2e      # playwright e2e

# 타입 체크
npm run typecheck
```

---

## 📂 프로젝트 구조

```
src/
├── os/                    # OS 커널 + 파이프라인
│   ├── 1-listeners/       # 키보드/마우스/클립보드 이벤트 리스너
│   ├── 2-contexts/        # DI 컨텍스트 (ZoneRegistry 등)
│   ├── 3-commands/        # 13개 커맨드 도메인 (79 파일)
│   ├── 4-effects/         # Side effects
│   ├── 5-hooks/           # React hooks (useComputed 등)
│   ├── 6-components/      # ZIFT 프리미티브 + Dialog/Toast/QuickPick
│   ├── defineApp.ts       # 앱 정의 API
│   ├── createOsPage.ts    # Headless 테스트 팩토리
│   └── headless.ts        # 순수함수 인터랙션 시뮬레이터
├── apps/
│   ├── todo/              # Reference Todo 앱 (24 파일)
│   └── builder/           # Web Builder 앱 (25 파일)
├── pages/                 # 페이지 컴포넌트 + Showcase
├── routes/                # TanStack Router File-based routes
├── inspector/             # Command Inspector (DevTools)
└── docs-viewer/           # 내장 문서 뷰어

docs/                      # PARA 방법론 기반 문서
├── 0-inbox/               # 새로운 제안 및 작업 초안
├── 1-project/             # 활성 프로젝트
├── 2-area/                # 핵심 아키텍처 표준
├── 3-resource/            # 연구 및 벤치마크
└── archive/               # 완료된 프로젝트 아카이브
```

---

**Built with ❤️ by Interactive OS Team.**
