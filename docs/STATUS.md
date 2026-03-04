# Project Dashboard

> Last updated: 2026-03-04 17:35
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, 워크플로우가 갱신한다. git log가 곧 changelog.

---

## 🔥 Active Focus

**zift-usage-spec** — ZIFT 보편 모델 설계. Zone+from/to+with[] + NormalizedStore. 코드 수정 없는 설계 완성. Meta.

**headless-simulator** — Vitest에서 Playwright 수준 검증 달성. DOM → OS VDOM. 거짓 GREEN 근절. Heavy.

**code-hygiene** — eslint errors + test failures → 0. husky 강제 검증. Light.

**builder-v2** — Panel Accordion + OS tree auto-expand. Heavy.

**unified-zift-resolver** — ✅ Phase 1 archived. 4개 resolver → 1 chain executor + Layer[] loop. T1-T9 Done.

**workflow-knowledge-separation** — 워크플로우 범용화 + 토픽 기반 지식 체계. Meta.

---

## 📋 All Active Projects

| Project | Phase | Last Activity | Status |
|---------|-------|---------------|--------|
| action-axis-unification | T1~T6 Done, T7 Unresolved | 03-04 | 🔥 Focus |
| unified-zift-resolver | Scaffold, T1~T7 미착수 | 03-04 | 🔥 Focus |
| workflow-knowledge-separation | T1~T4 | 03-04 | 🔥 Focus |
| zift-usage-spec | Scaffold, T1~T6 미착수 | 03-01 | 🔥 Focus |
| headless-simulator | Phase 1 T4~T6 | 02-27 | 🔥 Focus |
| code-hygiene | T1 ✅, T2~T8 | 03-04 | 🔥 Focus |
| builder-v2 | T12, T13, T20 | 02-26 | 🔥 Focus |
| builder-v3 | 기획만. 개발 보류 | 03-04 | 🟢 Active |
| os-restructure | Phase 2 #6-8 | 03-01 | 🟢 Active |
| test-observability | Scaffold, T1~T4 | 03-03 | 🟢 Active |
| apg-developer-agent | Scaffold, POC | 03-01 | 🟢 Active |
| inspector-dogfooding | T1~T4 ✅, T5 | 03-01 | 🟢 Active |

---

## ✅ Completed (→ 4-archive/)

| Project | Completed | Archived |
|---------|-----------|----------|
| top-down-enforcement | 03-04 | ✅ archive/2026/03/W10 — `@os-react/internal` barrel 생성, 35개 import 일괄 전환, raw primitive 앱 직접 사용 차단. tsc 0. design-principles #30 |
| resolve-axis | 03-04 | ✅ archive/2026/03/W10 — CheckConfig.keys/onClick 추가, config 기반 check keymap 우선순위, ButtonPattern onAction 제거. +9 tests, regression 0. design-principles #27-29 |
| apg-listbox-pattern | 03-02 | ✅ archive/2026/03/W10 — Negative tests 11개 (3 OS 버그 발견). range guard + selectAll guard. APG testbot 6 scripts 탑재 |
| apg-tabs-pattern | 03-02 | ✅ archive/2026/03/W10 — Item.Content 프리미티브, OS_ACTIVATE select fallback, OS_SELECT mode auto-derive. AUDITBOOK 갱신. /review retire |
| command-config-invariant | 03-03 | ✅ archive/2026/03/W10 — Command = { intent + chain }. 9→6 commands. resolveItemKey 삭제. arrowExpand dead code 전수 제거 |
| tab-state | 03-03 | ✅ archive/2026/03/W10 — tablist activate → aria-selected 전환. roleRegistry tablist preset. 6/6 PASS |
| dev-pipeline | 03-03 | ✅ archive/2026/03/W10 — T0-T14 완료. /red+/green+/audit+/bind+/stories+/spec 워크플로우 체계 확립 |
| headless-purity | 02-27 | ✅ archive/2026/02/W09 — AutoFocus DOM fallback 제거(useEffect→Phase 2), getLabels push model. FocusGroup useEffect import 삭제 |
| headless-item-discovery | 02-27 | ✅ archive/2026/02/W09 — 2-contexts DOM 0%. querySelectorAll을 FocusGroup(뷰)로 이동. getItems() push-only. T1~T10, +6 tests, regression 0, 기존 8건 개선 |
| normalized-collection | 02-26 | ✅ archive/2026/02/W09 — NormalizedCollection 타입+helpers, tree-aware ops, view transforms. T1~T7. 109 tests GREEN |
| unified-pointer-listener | 02-26 | ✅ archive/2026/02/W09 — Mouse+Drag→PointerListener 통합. OG-003 해결. +13 tests, 456줄 삭제, Gesture FSM |
| sense-purity | 02-26 | ✅ archive/2026/02/W09 — T1~T7 Done. sense→extract→resolve 동사 법 제정, +13 tests, MouseListener+DragListener 삭제, rules.md 환류 |
| area-praxis | 02-26 | ✅ archive/2026/02/W09 — Meta. 2-area/ 재정립 (인큐베이터→실천지혜). 21파일 분배 + 4 Living Documents + docs 전수검사 17파일 mv |
| go-redesign | 02-25 | ✅ archive/2026/02/W09 — /go 4-Phase 재설계 + RUNBOOK.md 186줄 + /project 조정 |
| field-headless-input | 02-25 | ✅ archive/2026/02/W09 — T1~T6 Done, 13 tests, official/os/why-field.md 갱신 |
| decision-table-contract | 02-25 | ✅ archive/2026/02/W09 — Meta. 8열 결정 테이블 표준 + /red 워크플로우 통합. 템플릿+갭분석 완료 |
| ocp-violations | 02-25 | ✅ archive/2026/02/W09 — T1~T4 Done, +6 tests, blockRegistry 통합 |
| app-modules | 02-25 | ✅ archive/2026/02/W09 — T1~T8 Done, 13 tests, Builder+Todo 마이그레이션 |
| zift-keyboard-resolve | 02-24 | ✅ archive/2026/02/W09 — official/os/why-field.md 갱신 |
| docs-viewer-features | 02-24 | ✅ archive/2026/02/W09 |
| item-expand-primitives | 02-24 | ✅ archive/2026/02/W09 |
| bdd-tdd-gate | 02-23 | ✅ archive/2026/02/W09 |
| zone-focusgroup-separation | 02-23 | ✅ archive/2026/02/W09 |
| dnd-poc | 02-23 | ✅ archive/2026/02/W09 |
| caret-restore | 02-23 | ✅ archive/2026/02/W09 |
| headless-items | 02-23 | ✅ archive/2026/02/W09 |
| docs-sidebar-os | 02-23 | ✅ archive/2026/02/W09 |
| testbot-v2 | 02-23 | ✅ archive/2026/02/W09 (Superseded by Replay) |
| os-page | 02-21 | ✅ archive/2026/02/W09 |
| define-query | 02-21 | ✅ archive/2026/02/W09 |
| builder-usage-cleanup | 02-21 | ✅ archive/2026/02/W09 |
| apg-testing-rebalance | 02-21 | ✅ archive/2026/02/W09 |
| field-compound | 02-20 | ✅ archive/2026/02/W09 |
| philosophy-hygiene | 02-20 | ✅ archive/2026/02/W09 |
| inspector-redesign | 02-20 | ✅ archive/2026/02/W09 |
| field-props-cleanup | 02-21 | ✅ archive/2026/02/W08 |
| lazy-resolution | 02-21 | ✅ archive/2026/02/W08 |
| query-adoption | 02-21 | ✅ archive/2026/02/W08 |
| apg-contract-testing | 02-20 | ✅ archive/2026/02/W08 |
| command-type-unification | 02-20 | ✅ 4-archive/2026-02-command-type-unification |
| collection-clipboard | 02-20 | ✅ 4-archive/2026-02-collection-clipboard |
| apg-axis-audit | 02-20 | ✅ 4-archive/2026-02-apg-axis-audit |
| docs-topology | 02-20 | ✅ 4-archive/2026-02-docs-topology |
| sentinel-removal | 02-19 | ✅ archive/2026/02/W08 |
| test-seam | 02-19 | ✅ archive/2026/02/W08 |
| lint-cleanup | 02-19 | ✅ archive/2026/02/W08 |
| eliminate-sync-draft | 02-20 | ✅ archive/2026/02/W08 |
| registry-monitor-v5 | 02-18 | ✅ archive/2026/02/W08 |
| define-app | 02-18 | ✅ archive/2026/02/W08 |
| builder-mvp | 02-18 | ✅ archive/2026/02/W08 |
| os-prd | 02-18 | ✅ archive/2026/02/W08 |
| naming-convention | 02-17 | ✅ archive/2026/02/W08 |
| field-key-ownership | 02-16 | ✅ archive/2026/02/W07 |
| todo-keyboard-dogfooding | 02-16 | ✅ archive/2026/02/W07 |

---

## 📥 Inbox

| File | Topic | Related Project | Suggested Action |
|------|-------|-----------------|------------------|
| `2026-0228-1949-[proposal]-item-descriptor-unification.md` | N-getter→1-accessor. ItemDescriptor 단일 정규화. 3축 발견 (Enumeration/Capability/Topology) | (cross-cutting OS core) | → `1-project/` 신규 or 5-backlog/ |
| `2026-0227-1024-[analysis]-headless-simulator-vision.md` | Vitest에서 Playwright 수준 검증. 거짓 GREEN 근절 | headless-simulator | → `1-project/headless-simulator/notes/` |
| `2026-0227-1044-[research]-workflow-methodology-mapping.md` | 40+ 워크플로우 × 30+ 전문 방법론 MECE 매핑 | meta (cross-cutting) | → `2-area/praxis/` or keep inbox |
| `2026-0226-2021-[proposal]-verification-level-up.md` | 검증 부족 영역 11건 식별 | code-hygiene | → `1-project/code-hygiene/notes/` |
| `2026-0226-2130-[proposal]-verification-hardening-roadmap.md` | 검증 고도화 4-Phase 로드맵 | code-hygiene | → `1-project/code-hygiene/notes/` |
| `2026-0301-1631-[analysis]-loc-over-500-audit.md` | 500라인 초과 파일 전수 조사 및 리팩토링 검토 | code-hygiene | → `1-project/code-hygiene/notes/` |

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Active Focus | 5 |
| Active Projects (total) | 9 (5 Active + 4 Focus) |
| Completed (archived) | 51 |
| Inbox items | 6 |
| Backlog items | 15 |
| Open issues | 0 |

---

## 📝 Recent Changes (2026-03-04)

- ✅ `top-down-enforcement` 완료 → archive/2026/03/W10. @os-react/internal barrel 생성, 35개 import 일괄 전환, raw primitive 앱 직접 사용 차단. design-principles #30.

- ✅ `resolve-axis` 완료 → archive/2026/03/W10. CheckConfig.keys/onClick, config 기반 check keymap 우선순위, ButtonPattern onAction 수동 배선 제거. +9 tests. design-principles #27-29 (action축=mode, ZIFT primitive=2개, zone.item()빌더). Discussion→action-axis-unification usage-spec 작성.

- 🆕 `unified-zift-resolver` Heavy 프로젝트 생성 — Discussion에서 발견: ZIFT 4개 resolver가 같은 패턴(input→command chain). 1개 generic executor로 통합. design-principles #23-25 추가

- ✅ `command-config-invariant` 완료 → archive/2026/03/W10. 9→6 commands, resolveItemKey 삭제, arrowExpand dead code 전수 제거 (23+ 파일, ~37 occurrences)
- ✅ `tab-state` 완료 → archive/2026/03/W10. tablist preset, 6/6 PASS
- ✅ `dev-pipeline` 완료 → archive/2026/03/W10. T0-T14 전부 완료
- 🧹 STATUS.md 전수 조사: 폴더 없는 ghost 엔트리 10건 제거 (18→8 active). tsc dead code 30건 수정

<details>
<summary>📝 Previous Changes (2026-03-01)</summary>

- ✅ `headless-purity` Light 프로젝트 완료 — AutoFocus DOM fallback(useEffect+rAF+querySelector) 제거→Phase 2 통합. getLabels accessor 추가→typeahead headless 가능. FocusGroup useEffect import 삭제. regression 0. → archive/2026/02/W09
- ✅ `headless-item-discovery` Heavy 프로젝트 완료 — 2-contexts DOM 0%. querySelectorAll 6곳→1곳(DOM_RECTS, 후속). DOM 스캔을 FocusGroup.useLayoutEffect(뷰)로 이동. getItems() push-only. createOsPage.goto() 자동등록. T1~T10, +6 tests, regression 0, 기존 failures 21→13(8건 개선). → archive/2026/02/W09
- ✅ `headless-zone-registry` Heavy 프로젝트 완료 — FocusGroup Zone 등록 Phase 1(논리, useMemo)/Phase 2(물리, useLayoutEffect) 분리. autoFocus getItems() headless 경로 추가. T1~T3 완료, T4-T6 scope out. +7 tests, 0 regression. → archive/2026/02/W09

</details>

<details>
<summary>📝 Previous Changes (2026-02-26)</summary>

- 🪦 `/retire`: 7건 아카이브 (backlog 5 + 11-discussions 2). Inspector 2건·PointerListener·DnD retrospect·ghost-projects·solve discussion·area-mirroring discussion. MIGRATION_MAP 갱신. Backlog 20→15.
- 🧹 `/para`: Inbox 10건→0건 (3→archive, 4→project notes, 2→backlog, 1→resource). Active 테이블에서 Completed 3건 제거. 고아 프로젝트 5건 등록 (trigger-listener-gap, test-reliability, test-observability, docs-section-nav, docs-subgrid-table).
- 🔍 `/doubt`: −37파일 (decisions/ 17→archive, 3-resource/ 10→archive, workflows 하위폴더 6 삭제, 유령 프로젝트 4→backlog). 3-resource/ 번호 접두사 9개 제거. CLAUDE.md official/ 토폴로지 갱신.
- ✅ `sense-purity` Light 프로젝트 완료 — sense 함수 순수화. T1~T7 (워크플로우 갱신, DOM 인라인, extractMouseInput/extractDropPosition 순수화, senseClick 삭제, MouseListener+DragListener 450줄 삭제, 파이프라인 동사 법 제정). +13 tests (58→71). audit OG-006/007 발견. rules.md `sense→extract→resolve` 법 추가.
- ✅ `area-praxis` Meta 프로젝트 완료 — 2-area/ 재정립 (인큐베이터→실천지혜). 21파일 분배 (official 14, resource 1, archive 3, keep 3). 4 Living Documents 생성 (26개 교훈). docs 전수검사 17파일 mv. CLAUDE.md 토폴로지 갱신.

</details>

<details>
<summary>📝 Previous Changes (2026-02-25)</summary>

- ✅ `field-headless-input` Heavy 프로젝트 완료 — AppPage에 `keyboard.type()`/`fill()` 추가, Field Enter를 OS ZIFT 파이프라인으로 올림. OS_FIELD_COMMIT 동기 dispatch (kernel return key). 13 new tests (4 pipeline proof + 9 user journey). ListView `fieldType="inline"` 버그 수정. `clipboardWrite` headless no-op.

- 🐛 `docs-viewer-missing-wiring` **Closed** — Inspector(Cmd+D) + Space 키 미동작. vite.docs.config.ts에 inspector 플러그인 누락 + DocsReaderUI.Zone 미렌더링 + NEXT/PREV_SECTION 미export. 3건 LLM 연결 누락 수정.

- ✅ `decision-table-contract` **완료** (Meta) — 8열 결정 테이블 표준 확정. `/red` Step 1 재정렬(A~F), 완료 기준 MECE 5항목, Todo 갭분석(23/23 매핑, Home/End/F2 누락 발견). `/go` Meta 분기 추가. → archive/2026/02/W09

- 🆕 `app-modules` Heavy 프로젝트 생성 — Discussion에서 발견: "삭제 시 undo 토스트" → OS App Module System으로 발전. `defineApp({ modules: [history(), persistence(), deleteToast()] })` 배열 기반 모듈 설치. ESLint/Vite plugin 모델. 기존 history/persistence boolean config → 모듈로 리팩토링.

</details>

<details>
<summary>📝 Previous Changes (2026-02-24)</summary>

- 🧹 `/para`: Inbox 10건→1건, 1-project/ 9개 폴더 아카이브 (bdd-tdd-gate, caret-restore, dnd-poc, zone-focusgroup-separation, testbot-v2, accessor-first-cleanup, on-select, philosophy-hygiene, inspector-redesign). Completed ❌ 5건 → ✅. Resource 루트 파일 2건 → 하위 카테고리 이동. Stale 프로젝트 6건 유지.

</details>

<details>
<summary>📝 Previous Changes (2026-02-21)</summary>

- 🆕 `projection-checkpoint` Light 프로젝트 생성 — Discussion에서 발견: state 정확해도 투영(DOM) 깨지는 배선 버그는 headless에서 감지 불가. `createPage(Component)` + `renderToString`로 projection checkpoint 추가. LLM 자율 개발 가드레일.
- 🐛 `defineApp.trigger.ts` — Dialog 미렌더 버그 수정. `createCompoundTrigger`가 `Dialog.Content`를 래핑해 reference identity 깨짐. 1줄 수정.
- 🆕 `os-page` Heavy 프로젝트 생성 — Discussion에서 발견: OS가 Playwright Page 동형 headless integration test API를 제공. `defineApp.createPage()` → `pressKey/click/attrs`. TestBot v2의 선행 의존.
- ✅ `todo-dogfooding` T4 완료 — **OS Toast primitive 신규**. `ToastEntry` 상태 + `OS_TOAST_SHOW`/`OS_TOAST_DISMISS` 커맨드. `ToastContainer` (`aria-live`, 자동 해제, 액션 버튼). 삭제/완료삭제 후 "Undo" 토스트.
- ✅ `todo-dogfooding` T3 완료 — Bulk Action Bar. `useSelection("list")` 기반 다중 선택 감지. 2+ 선택 시 절대 위치 하단 툴바 표시. `bulkToggleCompleted` 신규 커맨드.
- ✅ `todo-dogfooding` T2 완료 — Search. `ui.searchQuery` 상태 추가, selector 검색 필터 확장, `TodoSearch` zone (textbox), 검색 0건 빈 상태 메시지 분기.
- ✅ `todo-dogfooding` T1 완료 — `ClearDialog` 및 `DeleteDialog`에 `role: "alertdialog"` OS 패턴 적용. 포커스 트랩, Escape 닫기 완벽 지원. 다중 선택 개수 표기 및 `listCollection`과 연동.
- 🆕 `todo-dogfooding` Heavy 프로젝트 생성 — Todo에 8개 OS 패턴 추가 (Dialog, Context Menu, Toast, Search, Bulk Action, DnD, Date Picker, Export). "데이터 스키마만 있으면 앱이 된다"를 증명. PRD 8개 Feature × BDD Scenarios 완비.
- 📄 `6-products/testbot/VISION.md` — TestBot Product Vision 확정. "LLM이 만든 테스트를 인간이 시각적으로 검증하는 도구". How는 바뀔 수 있지만 비전은 불변. Discussion → Product 승격.
- 🆕 `field-props-cleanup` Light 프로젝트 생성 — /discussion + /doubt에서 Editable props 정리. 15→10 prop, 파생 prop 5개 제거, FieldProps→EditableProps rename. Pit of Success: 모순 조합 불가.
- 🆕 `lazy-resolution` Heavy 프로젝트 생성 — Focus/Selection 복구를 Write-time → Read-time Lazy Resolution으로 전환. recoveryTargetId/OS_RECOVER 4개 개체 → resolveId 1개. Zero-cost undo restoration.
- 📄 `6-products/builder/VISION.md` — Visual CMS Product Vision Board 작성 (빌더가 아니라 Visual CMS임을 확인)
- 🔧 `query-adoption` BuilderCursor 리팩토링 — useElementRect 훅 추출 (266→140줄), block metadata를 state에서 읽기, findBlockInfo 모델 유틸 분리. 13 new tests.
- ✅ `define-query` 완료 — T1(defineQuery+resolveQuery+QueryToken+invalidateOn), T2(useQuery React hook), T5(query→cofx bridge). 커널 4번째 primitive 확립. 16 unit tests.
- 🧹 `/para`: Inbox 13건→0건. define-query/builder-usage-cleanup/apg-testing-rebalance/field-compound → Completed.
- 🆕 `define-query` 프로젝트 생성 — /doubt(DOM API 전수 조사) + /discussion에서 커널의 빠진 네 번째 primitive 발견. re-frame cofx/sub 사이의 빈칸 = `defineQuery`. 동기/비동기 범용 외부 데이터 구독.
- 🆕 `focus-single-path` 프로젝트 생성 — /doubt + /divide에서 DOM 안티패턴 전수 조사. Focus 이중 경로(4-effects vs Component) 근본 원인 발견. C1(DocsPage ref), K1(Field computed 순수성) 즉시 수정 완료.

- 🆕 `os-api-rename` 프로젝트 생성 — Discussion + /doubt + /divide에서 도출. kernel→os rename, OS_ 접두어 통일, 훅 네이밍 정비
- 🔥 `builder-v2` T13 등록 — Tab Container → 범용 Container Block. `accept` 제약 + Dual Projection (Tree ↔ Canvas) 아키텍처
- 🔥 `builder-v2` Active Focus 전환 — Block Tree + Tab Container Discussion에서 보편 빌더 아키텍처 발견. T9(Block Tree 모델) + T10(Tabs 프리미티브) + T11(사이드바 트리뷰) 태스크 등록
- ✅ `inspector-redesign` — 타임라인 기반 Signal vs Noise 인스펙터 아키텍처 재설계 완수 및 `/archive` 매장 완료. `inferSignal` OS 관찰 원칙 `rules.md` 환류.
- 🆕 `defineapp-unification` 프로젝트 생성 — Discussion에서 8개 문제 분해, Headless-first 원칙 확립, createTrigger Pit of Success 방향 확정
- 📏 `rules.md`에 9개 학문적 원칙 추가 — Pit of Success, POLA, Hollywood, SRP, CQS, Ubiquitous Language 등 + Headless-first (Project #1)
- 🗑️ `/retire` Round 2: 5건 심층 보관 → `archive/legacy-docs` (02-12 스냅샷 3건 + src/os/ 리뷰 + mermaid 분석)
- 🔍 `/doubt docs/`: 완료 프로젝트 4개 → 4-archive/, testbot 보류 → 4-archive/2026-02-testbot, docs-dashboard → 5-backlog/
- 🔍 `/doubt workflow 문서 타입`: README.md/KPI/retrospect/daily-log 제거 대상 확정, /project 최소 패키지 = BOARD.md + discussions/ 만

</details>

<details>
<summary>📝 Changes (2026-02-19)</summary>

- ✅ `builder-v2` T8: Collection Zone Facade 완료 — `createCollectionZone` + `fromArray`/`fromEntities`. Builder sidebar 120줄→55줄. Facade 경계 발견: 단순 CRUD+ordering = facade, 필터/clipboard/포커스 = 앱 책임.
- 🆕 `philosophy-hygiene` 프로젝트 생성 — /review + /redteam 분석 결과 기반. useComputed 성능 위반 10건, ESLint 규칙 추가, deprecated API 정리.
- ✅ field-architecture-refactor — FieldRegistry implementation, syncDraft removal, TodoApp migration.
- 🔧 `2-area/` 소스코드 미러 구조로 재편 — Johnny.Decimal 번호 체계 적용
- 🔧 `/archive` 워크플로우 재정의 — 프로젝트 완료 시 지식을 Area/Resource로 분배
- 🆕 `/retire` 워크플로우 분리 — 기존 `/archive`(문서 퇴출)를 `/retire`로 이름 변경
- 🆕 `/solve` 워크플로우 신설 — Complex 자율 해결 4단계 래더
- ✅ `registry-monitor-v5`, `define-app`, `builder-mvp`, `os-prd`, `create-module` → archive
- 📦 closed issues 7건 → archive

</details>
