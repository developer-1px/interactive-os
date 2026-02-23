# Project Dashboard

> Last updated: 2026-02-23 18:29
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, 워크플로우가 갱신한다. git log가 곧 changelog.

---

## 🔥 Active Focus

**dnd-poc** — TodoList reorder PoC. Pointer Events + 커널 커맨드로 Zone 합성점 DnD 검증.

---

## 📋 All Active Projects

| Project | Phase | Last Activity | Status |
|---------|-------|---------------|--------|
| headless-items | ✅ Done (T1-T6 + OCP) | 02-23 | ✅ Done |
| kernel-items | Discussion 완료, Scaffold | 02-22 | 🔥 Focus |
| os-collection | T1-T7 Done (patches + undo/redo) | 02-22 | ✅ Done |
| projection-checkpoint | T1-T4 Done | 02-21 | ✅ Done |
| replay | T1 headless e2e 완성 | 02-21 | 🟢 Active |
| builder-v2 | T13 Container Block 범용화 | 02-21 | 🟢 Active |
| cursor-ocp | Scaffold 완료, T1~T7 | 02-23 | 🟢 Active |
| caret-restore | All Done — 브라우저 확인 완료 | 02-23 | ✅ Done |
| todo-dogfooding | T1~T4 Done (Dialog, Search, Bulk, Toast) | 02-22 | 🟢 Active |
| testbot-v2 | Superseded by Replay | 02-21 | 🔴 Superseded |
| focus-single-path | T1 이중 경로 통합 설계 | 02-21 | 🟢 Active |
| os-api-rename | T1 kernel→os rename | 02-20 | 🟢 Active |
| builder-clipboard | T1 사이드바 clipboard | 02-20 | 🟡 Paused |
| defineapp-unification | T1 타입 안전화 | 02-20 | 🟡 Paused |
| docs-viewer-features | T7 Tree Click-to-Activate + ExpandTrigger | 02-23 | 🔥 Focus |
| zone-focusgroup-separation | All Done (T2+T3+T4+T6) | 02-23 | ✅ Done |
| dnd-poc | Scaffold, T1~T4 등록 | 02-23 | 🔥 Focus |

---

## ✅ Completed (→ 4-archive/)

| Project | Completed | Archived |
|---------|-----------|----------|
| headless-items | 02-23 | ✅ archive/2026/02/W09 |
| os-page | 02-21 | ❌ T1~T3 완료, T4 skip. AppPage rename ✅ createTestOsKernel 제거 ✅ |
| field-props-cleanup | 02-21 | ✅ archive/2026/02/W08 |
| lazy-resolution | 02-21 | ✅ rules.md #15 (Lazy Resolution) | ✅ archive/2026/02/W08 |
| query-adoption | 02-21 | ✅ 6-products/builder/design/builder-cursor.md | ✅ archive/2026/02/W08 |
| define-query | 02-21 | ❌ T1/T2/T5 완료 (defineQuery, useQuery, bridge) |
| builder-usage-cleanup | 02-21 | ❌ T1~T6 완료 |
| apg-testing-rebalance | 02-21 | ❌ T1~T3 완료 |
| field-compound | 02-20 | ❌ T1~T4 완료 |
| apg-contract-testing | 02-20 | ✅ Layer A 완료 (58 APG tests, 4 patterns) |
| inspector-redesign | 02-20 | ✅ archive/2026/02/W08/inspector-redesign |
| command-type-unification | 02-20 | ✅ 4-archive/2026-02-command-type-unification (자연 해소) |
| philosophy-hygiene | 02-20 | ✅ 4-archive/2026-02-philosophy-hygiene (예정) |
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

- `docs/0-inbox/2026-0222-1937-analysis-json-crud-clipboard-undo-status.md` (JSON CRUD, Clipboard, Undo/Redo 현황 분석)
  - Related Project: `os-collection`, `todo-dogfooding`
  - Suggested Action: 추가 인프라 구축 생략 후 응용 기능(Builder 맵핑, DnD 등)으로 진행

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Active Focus | 1 |
| Active Projects (total) | 6 (3 Active + 3 Paused) |
| Completed (archived) | 23+ |
| Inbox items | 1 |
| Backlog items | 5 |
| Open issues | 0 |

---

## 📝 Recent Changes (2026-02-21)

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

<details>
<summary>📝 Previous Changes (2026-02-19)</summary>

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
