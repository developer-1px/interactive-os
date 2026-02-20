# Project Dashboard

> Last updated: 2026-02-21 00:34
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, 워크플로우가 갱신한다. git log가 곧 changelog.

---

## 🔥 Active Focus

**builder-usage-cleanup** — T1: Dead code 제거 + CANVAS_ZONE_ID 통일

---

## 📋 All Active Projects

| Project | Phase | Last Activity | Status |
|---------|-------|---------------|--------|
| builder-usage-cleanup | T1 Dead code 제거 | 02-21 | 🟢 Active |
| apg-testing-rebalance | T1~T3 완료 | 02-21 | ✅ Done |
| builder-v2 | T13 Container Block PoC | 02-20 | 🟢 Active |
| builder-clipboard | T1 사이드바 clipboard | 02-20 | 🟡 Paused |
| field-compound | T1~T4 완료 | 02-20 | ✅ Done |
| os-api-rename | T1 kernel→os rename | 02-20 | 🟢 Active |
| defineapp-unification | T1 타입 안전화 | 02-20 | 🟡 Paused |

---

## ✅ Completed (→ 4-archive/)

| Project | Completed | Archived |
|---------|-----------|----------|
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

| # | Item | Related Project | Suggested Action |
|---|------|-----------------|------------------|
| 1 | [os-code-review-issues](0-inbox/2026-0219-1312-[analysis]-os-code-review-issues.md) | command-type-unification | P1: defineCommand when guard 공식화, P3: React 타입 일괄 정리 |
| 2 | [workflow-dependency-graph](0-inbox/2026-0219-1328-[analysis]-workflow-dependency-graph.md) | — | 참고용 시각화. 고립 노드(/design) 정리 검토 |

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Active Focus | 1 |
| Active Projects (total) | 2 |
| Completed (archived) | 18+ |
| Inbox items | 2 |
| Backlog items | 5 (docs-dashboard 포함) |
| Open issues | 1 |
| Deferred (testbot) | 1 → 4-archive/2026-02-testbot |

---

## 📝 Recent Changes (2026-02-20)

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
