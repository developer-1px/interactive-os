# Project Dashboard

> Last updated: 2026-02-26 20:14
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, 워크플로우가 갱신한다. git log가 곧 changelog.

---

## 🔥 Active Focus

**code-hygiene** — 540 eslint errors + 20 test failures → 0. husky 강제 검증. Light.

**builder-v2** — Panel Accordion + OS tree auto-expand. Heavy.

**dropdown-dismiss** — OG-001 해소. outsideClick 런타임 + LocaleSwitcher 리팩토링. Light.

---

## 📋 All Active Projects

| Project | Phase | Last Activity | Status |
|---------|-------|---------------|--------|

| builder-v2 | T5 DnD Done, OS gap 회고 완료 | 02-26 | 🔥 Focus |
| dropdown-dismiss | Scaffold, T1~T3 | 02-26 | 🔥 Focus |
| trigger-listener-gap | Push model 설계 | 02-26 | 🟢 Active |
| test-reliability | 거짓 GREEN 방지 plan | 02-26 | 🟢 Active |
| content-edit-mode | T1~T4 Done, T5~T7 FSM v3 원자 전이 | 02-24 | 🟢 Active |
| dev-pipeline | T0 Done (/red /green 생성), T1~T3 | 02-24 | 🟢 Active |
| cursor-ocp | Scaffold 완료, T1~T7 | 02-23 | 🟢 Active |
| todo-dogfooding | T1~T4 Done. ⚠️ 1-project/ 폴더 없음, re-scaffold 필요 | 02-22 | 🟢 Active |
| tab-state | Scaffold, /audit에서 발견. T1 Red 대기 | 02-24 | 🟢 Active |
| replay | T1 headless e2e 완성 | 02-21 | 🟢 Active |
| builder-property-schema | Scaffold, T1~T5 | 02-24 | 🟢 Active |
| tree-click-defaults | Scaffold, T1~T3 | 02-24 | 🟢 Active |
| builder-i18n | Scaffold, T1~T4 (US-001) | 02-25 | 🟢 Active |
| test-observability | Scaffold | 02-26 | 🟢 Active |
| docs-section-nav | Scaffold | 02-24 | 🟢 Active |
| docs-subgrid-table | Scaffold | 02-24 | 🟢 Active |

---

## ✅ Completed (→ 4-archive/)

| Project | Completed | Archived |
|---------|-----------|----------|
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
| `2026-0226-2021-[proposal]-verification-level-up.md` | 검증 부족 영역 11건 식별 | code-hygiene | → `1-project/code-hygiene/notes/` |
| `2026-0226-2130-[proposal]-verification-hardening-roadmap.md` | 검증 고도화 4-Phase 로드맵 | code-hygiene | → `1-project/code-hygiene/notes/` |

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Active Focus | 2 |
| Active Projects (total) | 16 (13 Active + 2 Focus + 1 re-scaffold) |
| Completed (archived) | 43 |
| Inbox items | 2 |
| Backlog items | 15 |
| Open issues | 0 |

---

## 📝 Recent Changes (2026-02-26)

- 🪦 `/retire`: 7건 아카이브 (backlog 5 + 11-discussions 2). Inspector 2건·PointerListener·DnD retrospect·ghost-projects·solve discussion·area-mirroring discussion. MIGRATION_MAP 갱신. Backlog 20→15.
- 🧹 `/para`: Inbox 10건→0건 (3→archive, 4→project notes, 2→backlog, 1→resource). Active 테이블에서 Completed 3건 제거. 고아 프로젝트 5건 등록 (trigger-listener-gap, test-reliability, test-observability, docs-section-nav, docs-subgrid-table).
- 🔍 `/doubt`: −37파일 (decisions/ 17→archive, 3-resource/ 10→archive, workflows 하위폴더 6 삭제, 유령 프로젝트 4→backlog). 3-resource/ 번호 접두사 9개 제거. CLAUDE.md official/ 토폴로지 갱신.
- ✅ `sense-purity` Light 프로젝트 완료 — sense 함수 순수화. T1~T7 (워크플로우 갱신, DOM 인라인, extractMouseInput/extractDropPosition 순수화, senseClick 삭제, MouseListener+DragListener 450줄 삭제, 파이프라인 동사 법 제정). +13 tests (58→71). audit OG-006/007 발견. rules.md `sense→extract→resolve` 법 추가.
- ✅ `area-praxis` Meta 프로젝트 완료 — 2-area/ 재정립 (인큐베이터→실천지혜). 21파일 분배 (official 14, resource 1, archive 3, keep 3). 4 Living Documents 생성 (26개 교훈). docs 전수검사 17파일 mv. CLAUDE.md 토폴로지 갱신.

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
