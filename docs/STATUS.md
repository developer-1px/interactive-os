# Project Dashboard

> Last updated: 2026-02-20 00:20
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, 워크플로우가 갱신한다. git log가 곧 changelog.

---

## 🔥 Active Focus

**builder-v2** — 계층 키보드 내비게이션(itemFilter), Sidebar 키보드 바인딩, PropertiesPanel 라이브 바인딩
**collection-clipboard** — createCollectionZone에 copy/cut/paste 자동 생성 추가
**philosophy-hygiene** — useComputed 성능 위반 수정, ESLint 가드레일 추가, deprecated API 정리

---

## 📋 All Active Projects

| Project | Phase | Last Activity | Status |
|---------|-------|---------------|--------|
| builder-v2 | Execution | 02-19 | 🔥 Focus |
| collection-clipboard | Execution | 02-20 | 🔥 Focus |
| philosophy-hygiene | Execution | 02-19 | 🔥 Focus |
| apg-axis-audit | Discovery | 02-19 | ⏸ Idle |
| command-type-unification | Definition | 02-18 | ⏸ Idle |
| docs-topology | Execution | 02-18 | ⏸ Idle |
| docs-dashboard | Design (PRD/Proposal 완비) | 02-15 | ⏸ Idle |
| testbot | Execution 준비 (Phase 1) | 02-19 | ⏸ Idle |

---

## ✅ Completed (→ archive 완료)

| Project | Completed | Archived |
|---------|-----------|----------|
| sentinel-removal | 02-19 | ✅ archive/2026/02/W08 |
| test-seam | 02-19 | ✅ archive/2026/02/W08 |
| lint-cleanup | 02-19 | ✅ archive/2026/02/W08 |
| eliminate-sync-draft | 02-20 | ✅ archive/2026/02/W08 (FieldRegistry로 대체) |
| registry-monitor-v5 | 02-18 | ✅ archive/2026/02/W08 |
| define-app | 02-18 | ✅ archive/2026/02/W08 |
| builder-mvp | 02-18 | ✅ archive/2026/02/W08 |
| os-prd | 02-18 | ✅ archive/2026/02/W08 (SPEC.md → official/os/SPEC.md) |
| naming-convention | 02-17 | ✅ archive/2026/02/W08 |
| field-key-ownership | 02-16 | ✅ archive/2026/02/W07 |
| todo-keyboard-dogfooding | 02-16 | ✅ archive/2026/02/W07 |
| create-module | — | ✅ archive/2026/02/W07 |
| command-palette-e2e | 02-16 | ✅ archive/2026/02/W08 |
| fix-tab-navigation | 02-16 | ✅ archive/2026/02/W08 |
| docs-system-v2 | 02-16 | ✅ archive/2026/02/W08 |
| builder-focus-navigation | 02-15 | ✅ archive/2026/02/W07 |
| builder-os-panel-binding | 02-15 | ✅ archive/2026/02/W07 |
| os-elegance | 02-14 | ✅ archive/2026/02/W07 |
| focus-recovery | 02-15 | ✅ archive/2026/02/W07 |
| todo-v3-migration | 02-15 | ✅ archive/2026/02/W07 |
| todo-app | 02-15 | ✅ archive/2026/02/W07 |
| workflow-ecosystem-refactoring | 02-13 | ✅ archive/2026/02/W07 |
| test-structure-convention | 02-13 | ✅ archive/2026/02/W07 |
| stream-inspector | 02-13 | ✅ archive/2026/02/W07 |
| os-keybinding-architecture | 02-13 | ✅ archive/2026/02/W07 |
| official-docs | 02-14 | ✅ archive/2026/02/W07 |
| move-docs-script | 02-13 | ✅ archive/2026/02/W07 |
| os-core-refactoring | 02-12 | ✅ archive/2026/02/W07 |

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
| Active Focus | 3 |
| Active Projects (total) | 8 |
| Completed (archived) | 29 |
| Inbox items | 2 |
| Backlog items | 4 |
| Open issues | 1 |

---

## 📝 Recent Changes (2026-02-20)

- 🧹 `/para` 대청소 실행
  - 📥 Inbox 8건 라우팅: 2건 archive, 2건 area(Field/OS 철학), 2건 philosophy-hygiene, 2건 area(커버리지/메타)
  - 📦 4 프로젝트 archive: `sentinel-removal`, `lint-cleanup`, `eliminate-sync-draft`(FieldRegistry 대체), `test-seam`
  - 🗑️ `behavior-first-zone` 백로그 삭제 (가설 무효화, IME 버그가 진짜 원인)
  - 🔧 `2-area/coverage-gap` → `80-cross-cutting/`으로 이동
  - 📊 Summary 수치 교정 (Active Focus 2→3, Open issues 0→1)

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
