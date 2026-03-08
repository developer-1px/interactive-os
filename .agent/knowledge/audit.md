# AUDITBOOK — OS 감사 지식베이스

> `/audit` 시작 시 반드시 읽는다.
> 감사 기준, 알려진 OS 갭, 정당한 예외를 축적하여 재논쟁을 방지한다.
> 새 판정이 생기면 `/audit` 종료 시 이 파일을 갱신한다.

---

## 1. 반드시 써야 하는 OS 패턴

> 이 패턴이 있는데 App이 직접 구현했으면 → 즉시 **🔴 LLM 실수**.

### 1-A. 앱→OS (기존)

| 패턴 | OS API | 잘못된 예 |
|------|--------|-----------|
| 상태 관리 | `BuilderApp.useComputed()`, `os.getState()` | `useState` |
| 커맨드 dispatch | `os.dispatch(command())` | 직접 state mutate |
| 목록 포커스/네비게이션 | Zone `bind({ role: "tree"/"grid" })` | `onKeyDown` arrow key |
| 아이템 선택 | Zone `onAction`, `onActivate` | `onClick` 직접 state 변경 |
| 필드 편집 | `Field.Editable`, `OS_FIELD_COMMIT` | `<input onChange>` |
| Undo/Redo | `createUndoRedoCommands` | 별도 history stack |

### 1-B. OS 내부 계약 (OS↔OS)

> OS 프리미티브 간의 일관성. 위반 시 **🟡 OS 갭**.

| 패턴 | 올바른 예 | 잘못된 예 |
|------|----------|----------|
| Zone 콜백 시그니처 | `(info) => BaseCommand \| BaseCommand[]` (선언형) | `(info) => void` (명령형) |
| Listener 격리 | 하나의 물리 제스처 → 하나의 Listener | 같은 pointerdown을 Mouse+Drag 각각 처리 |
| DOM convention 자동화 | OS가 `data-*` 속성 자동 주입 | 앱이 `data-drag-handle` 수동 부착 |

### 1-C. OS↔앱 계약 완전성

> bind() 연결이 실제로 동작하는가. 위반 시 **🔴 LLM 실수** 또는 **🟡 OS 갭**.

| 검사 항목 | 방법 |
|----------|------|
| bind()에서 호출하는 메소드가 존재하는가 | tsc + 수동 확인 |
| 앱이 `os.dispatch`를 onReorder 등 콜백 안에서 직접 호출하는가 | grep → 있으면 OS gap |
| 콜백에서 리턴한 커맨드를 OS가 실제로 dispatch하는가 | OS command 코드 확인 |

### 1-D. 표준 명세 준수 (Standard Conformance)

> OS가 구현을 보장하는 외부 표준 명세(W3C APG 등)가 있을 경우, 구현이 명세의 Example과 **구조적으로 일치**하는지 검증한다.
> 이것은 특수 규칙이 아니다. W3C ARIA는 이 OS의 표준 명세 자체이므로, §1 필수 패턴의 연장선이다.

| 검사 항목 | 방법 |
|----------|------|
| 명세 Example의 HTML 구조를 따르는가 | Example HTML과 실제 컴포넌트 DOM 비교 |
| 명세에서 필수로 요구하는 ARIA 속성이 누락되지 않았는가 | Compliance Matrix `H1~Hn` 전수 대조 |
| 불일치가 있을 경우 정당한 사유(🔄 OS Auto)가 문서화되어 있는가 | 코드 주석 또는 Compliance Matrix에 사유 기재 |

---

## 2. 알려진 OS 갭

> 아직 OS에 없는 것. 발견되어도 🔴가 아니라 🟡. `5-backlog/os-gaps.md` 참조.

| ID | 패턴 | 상태 | 발견일 |
|----|------|------|--------|
| OG-001 | Dropdown (listbox) Zone — 열기/닫기/Escape/Arrow/backdrop 통합 | ✅ 해결 (dropdown-dismiss: Trigger+Portal 패턴. 새 프리미티브 불필요) | 2026-02-25 |
| OG-002 | `onReorder: void` — 명령형 시그니처. 다른 콜백은 선언형(BaseCommand 리턴) | ✅ 해결 | 2026-02-26 |
| OG-003 | MouseListener + DragListener 충돌 — 같은 물리 제스처를 경쟁 처리 | ✅ 해결 (unified-pointer-listener) | 2026-02-26 |
| OG-004 | `data-drag-handle` DOM convention — OS가 자동 주입하지 않음. 앱이 수동 부착 | 🟡 미해결 | 2026-02-26 |
| OG-005 | 커서 메타 등록 — 앱이 useEffect로 수동 mount/unmount 동기화. OS 미들웨어/ZoneRegistry 확장 필요 | 🟡 미해결 | 2026-02-26 |
| OG-006 | drag cursor/userSelect — PointerListener가 document.body.style 직접 조작. OS가 drag 상태에 따라 자동 관리해야 | 🟡 미해결 | 2026-02-26 |
| OG-007 | zone element lookup — Listener가 `document.querySelector("[data-zone=...]")`로 zone DOM 탐색. ZoneRegistry에 element ref 제공 필요 | 🟡 미해결 | 2026-02-26 |
| OG-008 | `role="alert"` 자동화 — Alert 프리미티브 부재. 앱이 `role="alert"` 수동 부착 필요. OS에서 live region을 자동 관리하는 메커니즘 없음 | 🟡 미해결 | 2026-02-28 |
| OG-021 | SDK `OS_OVERLAY_OPEN` re-export 미제공. zone-level trigger binding을 SDK 수준에서 선언 불가 | 🟡 미해결 | 2026-03-08 |
| OG-022 | Headless hover 시뮬레이션 부재. tooltip `onHover` trigger 테스트 불가 | 🟡 미해결 | 2026-03-08 |
| OG-023 | AlertDialog Escape 차단 미구현. `role="alertdialog"` overlay에서 Escape가 close 동작 | 🟡 미해결 | 2026-03-08 |
| OG-024 | 동적 아이템 초기 확장 선언 — `expand.initial`은 정적 아이템만 지원. 동적 getItems 결과의 초기 expand 불가 | 🟡 미해결 | 2026-03-08 |

> **주의**: OG-001 관련 패턴(드롭다운 onClick)은 OS 갭이므로 🔴로 분류하지 않는다.
> **주의**: OG-003, OG-004 관련 패턴은 OS 갭이므로 🔴로 분류하지 않는다.
> **주의**: OG-006, OG-007 관련 패턴은 OS 갭이므로 🔴로 분류하지 않는다.

---

## 3. 알려진 정당한 예외

> OS가 대체할 수 없는 것. 발견되어도 무시. ⚪.

| 패턴 | 이유 | 예시 |
|------|------|------|
| `window.addEventListener` (OS 진입점) | OS 커널이 브라우저 이벤트를 받는 유일한 진입점 | `packages/os-react/src/1-listen/` |
| 외부 라이브러리 ref/callback | 써드파티 API 요구사항 | leaflet, chart.js 등 |
| `document.getElementById` (포커스 복구) | 브라우저 포커스 API 직접 호출 | 모달 dismiss 후 복구 |
| `@os-core/*` import in `src/inspector/` | Inspector는 devtool — os-devtool과 동일 패턴. facade 경계는 앱 코드(`src/apps/`)에 적용 | ZiftMonitor, ElementPanel |
| `document.caretRangeFromPoint` (caret seeding) | 브라우저 caret API 직접 사용 필수 | PointerListener seedCaretFromPoint |
| sense 함수 내 DOM 읽기 | sense 어댑터의 정당한 책임 — DOM→순수데이터 변환 | `senseMouse.ts` querySelector, getElementById |
| TanStack Router useEffect/onClick | 라우터 네비게이션은 OS 관할 밖. redirect + navigate 패턴 | APG showcase, Layer showcase index.tsx |

---

## 4. 근본 원인 진단표

> 🔴 LLM 실수 발견 시, 어느 파이프라인 단계로 루프백할지 판단.

| 근본 원인 | 판정 기준 | 루프백 |
|----------|----------|--------|
| Story / DT 잘못됨 | DT에 없는 커맨드를 구현했거나, DT 자체가 OS 불가능 구조 | → `/stories` |
| Spec Scenario 잘못됨 | DT를 잘못 번역하여 BDD가 OS 패턴과 어긋남 | → `/spec` |
| Red 테스트 잘못됨 | 테스트가 DOM/이벤트를 직접 검증 (OS Hook 미사용) | → `/red` |
| Bind 잘못됨 | OS Hook/Command가 있는데 raw HTML 이벤트 사용 | → `/bind` |

---

## 5. 판정 선례

> 과거 감사에서 내린 분류 결정. 같은 패턴이 나오면 재논쟁 없이 동일 적용.

| 선례 | 패턴 | 판정 | 이유 | 날짜 |
|------|------|------|------|------|
| LocaleSwitcher onClick 4건 | 드롭다운 내부 onClick | 🟡 OS 갭 (OG-001) | Dropdown Zone 프리미티브 부재. LLM 실수가 아님 | 2026-02-25 |
| BuilderTabs useState | 탭 활성 상태 useState | 🟡 OS 갭 (T5) → ✅ 해결 | Item.Content + OS_ACTIVATE selection 경로 구현 | 2026-02-25 |
| DnD onReorder void | zone 콜백 명령형 시그니처 | 🟡 OS 갭 (OG-002) → ✅ 수정 | void 콜백은 앱이 os.dispatch 직접 호출 강제. 선언형으로 수정 | 2026-02-26 |
| DnD BuilderApp.dispatch | 존재하지 않는 메소드 호출 | 🔴 LLM 실수 (OG-002 기인) | OS gap이 LLM 실수를 유발한 사례 | 2026-02-26 |
| DnD e.preventDefault 충돌 | Listener 간 side-effect | 🟡 OS 갭 (OG-003) | Mouse+Drag 분리 구조의 한계 | 2026-02-26 |
| DragListener.tsx dead code | 삭제 누락 | 🔴 LLM 실수 | PointerListener 대체 후 T6에서 MouseListener만 삭제, DragListener 누락 | 2026-02-26 |
| PointerListener body.style | drag cursor/userSelect 직접 조작 | 🟡 OS 갭 (OG-006) | OS가 drag 상태를 시각화하는 메커니즘 부재 | 2026-02-26 |
| PointerListener querySelector("[data-zone]") | zone element DOM 탐색 | 🟡 OS 갭 (OG-007) | ZoneRegistry에 element ref API 부재 | 2026-02-26 |
| Accordion aria-controls 수동 | 앱이 `aria-controls={...}` 수동 부착 | ✅ 해결 | computeItem이 expand axis일 때 `aria-controls="panel-{id}"` 자동 설정 | 2026-02-28 |
| Accordion panel DOM 구조 | Item 안에 패널 포함 → 패널 클릭이 토글 | ✅ 해결 | Item.Region 컴파운드 컴포넌트로 분리. 패널은 OS state 구독 투영 | 2026-02-28 |
| Accordion tab escape | Tab이 zone 탈출 (표준 위반) | ✅ 해결 | `tab.behavior="native"` 추가. 브라우저 기본 Tab 순서 허용 | 2026-02-28 |
| AlertPattern useState/onClick | raw React 패턴 사용 | 🔴 LLM 실수 → ✅ 수정 | defineApp + createTrigger로 교체 | 2026-02-28 |
| AlertPattern role="alert" 수동 | OS에 alert 프리미티브 없음 | 🟡 OS 갭 (OG-008) | live region 자동 관리 메커니즘 부재 | 2026-02-28 |
| TabsPattern useState 모드 토글 | `useState("auto"\|"manual")` + `onChange` radio | ⚪ 정당한 예외 | 데모 전환 UI — OS 관할 밖 view-level 상태. 인터랙션 state 아님 | 2026-03-02 |
| Item.Content visibility | OS가 Zone role 따라 hidden/visible 자동 결정 | ✅ 해결 (신규) | roleRegistry contentVisibilityMap + bind.ts ContentComponent | 2026-03-02 |
| OS_ACTIVATE selection 경로 | Enter → 선택 가능한 Zone에서 OS_SELECT dispatch | ✅ 해결 (신규) | tablist manual mode Enter 키 활성화 | 2026-03-02 |
| CheckboxPattern onClick 2건 | raw onClick + useDevDispatch | 🔴 LLM 실수 → ✅ 수정 | onAction + activate.onClick 패턴으로 교체. SwitchPattern 참조 | 2026-03-03 |
| Popover outside-click 수동 | `document.addEventListener("mousedown")` + `document.querySelector` | 🟡 OS 갭 → ✅ 해결 | `menu` role에 `dismiss.outsideClick: "close"` 추가. PointerListener가 자동 처리 | 2026-03-04 |
| Popover menuitem onClick 수동 | `onClick` → `os.dispatch(OS_OVERLAY_CLOSE)` | 🟡 OS 갭 → ✅ 해결 | `menu` role에 `activate.onClick: true` 추가. click→OS_ACTIVATE→onAction 경로 | 2026-03-04 |
| TriggerDismiss 이중 dispatch | `onClick` + `Item.onActivate` 중복 | 🔴 Bind 실수 → ✅ 수정 | handleClick 제거, Item.onActivate 경로에 일임. dialog/alertdialog에 `activate.onClick: true` 추가 | 2026-03-04 |
| Trigger dead props (Pure Projection) | `dispatch`/`allowPropagation`/`onClick` destructure 잔존 | 🔴 LLM 실수 → ✅ 수정 | Pipeline 이관 후 behavior 함수 삭제 시 props 정리 누락 | 2026-03-04 |
| Trigger extractTriggerClickInput | 정의만 하고 미사용 함수 | 🔴 LLM 과잉생산 → ✅ 삭제 | PointerListener가 DOM 직접 읽기로 전환. /doubt에서 발견 | 2026-03-04 |
| Button toggle aria-checked | computeFieldAttrs가 hardcoded aria-checked 방출 (button은 aria-pressed 필요) | 🟡 OS 갭 → ✅ 해결 | `CheckConfig.aria?: "checked" \| "pressed"` + `CHECK_ATTR_MAP` lookup. Item→Zone 버블링 | 2026-03-04 |
| TestBot button script aria-checked | TestBot이 aria-checked 검증 (잘못된 속성) | 🔴 LLM 실수 → ✅ 수정 | aria-pressed로 교정 | 2026-03-04 |
| Field resetOnSubmit DOM sync | `handleCommit`에서 `FieldRegistry.reset()` 후 DOM innerText 미동기화 | ⚪ OS 내부 수정 → ✅ 해결 | 기존 패턴(innerRef.innerText=value) 재사용. 3줄 추가. 이중 commit 경로(Field handleCommit vs OS_FIELD_COMMIT) 구조적 부채 잔존 | 2026-03-04 |
| MeterPattern useEffect+dispatch (시뮬레이션) | setInterval로 OS_VALUE_CHANGE dispatch | ⚪ 정당한 예외 | 외부 데이터 시뮬레이션 (CPU/메모리 변동). 초기값은 value.initial로 선언형 완료. 런타임 업데이트는 앱 책임 | 2026-03-05 |
| resolveRole("button"/"list") throw 실패 | ZoneRole union에 없지만 유효 ARIA role | ⚪ 정당한 예외 → warn 전환 | "button", "list" 등은 ZoneRole에 없지만 실제 사용 중. throw는 과잉 → console.warn + fallback이 적절 | 2026-03-06 |
| Layer showcase @os-core import 6건 | `OS_OVERLAY_OPEN` 직접 import | 🟡 OS 갭 (OG-021) | SDK가 overlay command를 re-export하지 않음. createTrigger는 React 전용이라 headless 대안 없음 | 2026-03-08 |
| Layer showcase useEffect redirect | TanStack Router redirect | ⚪ 정당한 예외 | 라우터 네비게이션은 OS 관할 밖. APG showcase 동일 패턴 | 2026-03-08 |
| Layer showcase sidebar onClick | Router navigate onClick | ⚪ 정당한 예외 | 라우터 네비게이션은 OS 관할 밖. APG showcase 동일 패턴 | 2026-03-08 |
| Tooltip headless 테스트 4건 todo | hover simulation 부재 | 🟡 OS 갭 (OG-022) | headless page에 pointer-enter 시뮬레이션 없음. 브라우저 TestBot으로만 가능 | 2026-03-08 |
| AlertDialog Escape 차단 실패 | alertdialog overlay Escape close | 🟡 OS 갭 (OG-023) | escape.ts가 overlay type 미구분. alertdialog는 Escape 차단 필요 | 2026-03-08 |
| strict-api-guard 전체 (T1-T5) | OS 앱 API 침묵 실패 → hard error/warn 전환 | ✅ 통과 (0건 위반) | throw는 논리적 불가능에만, warn은 의심스러운 사용에. 2-tier 기준 확립 | 2026-03-06 |
| TestBot ZoneRegistry facade 위반 | `src/apps/testbot/app.ts`에서 `@os-core/engine/registries/zoneRegistry` 직접 import | 🔴 LLM 실수 → ✅ 수정 | `@os-devtool/testing`에 `getZoneItems()` facade helper 추가. `zoneItems.ts` 생성 | 2026-03-06 |
| TestScript.run items 3rd param | K2 위반 여부 판단 | ⚪ 정당한 예외 | `items` param은 K3(infra layer) — 데이터 주입이지 DOM 인터랙션 아님. K2 scope는 page/expect만 | 2026-03-06 |
| [data-inspector] 가드 제거 | 이벤트 차단 → scope 필터 전환 | ✅ 해결 | 임시 조치(로그 노이즈)를 과도한 수단(이벤트 전면 차단)으로 구현. 트랜잭션 scope 필터로 대체 | 2026-03-08 |
| ZiftMonitor useEffect expand-all | 동적 아이템 초기 확장 | 🟡 OS 갭 (OG-024) | expand.initial은 정적 아이템만 지원. 동적 getItems의 초기 expand 선언 메커니즘 부재 | 2026-03-08 |

---

## 갱신 방법

`/audit` 종료 시:
1. **새 OS 갭** 발견 → §2에 추가 + `5-backlog/os-gaps.md`에 등록
2. **새 정당한 예외** 확인 → §3에 추가
3. **새 판정 선례** 생성 → §5에 추가
4. **OS 갭 해결됨** → §2 항목 `✅ 해결`로 체크 + `os-gaps.md` 업데이트
