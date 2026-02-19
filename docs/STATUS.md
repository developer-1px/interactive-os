# Project Dashboard

> Last updated: 2026-02-19 16:12
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, 워크플로우가 갱신한다. git log가 곧 changelog.

---

## 🔥 Active Focus

**builder-v2** — 계층 키보드 내비게이션(itemFilter), Sidebar 키보드 바인딩, PropertiesPanel 라이브 바인딩

---

## 📋 All Active Projects

| Project | Phase | Last Activity | Status |
|---------|-------|---------------|--------|
| builder-v2 | Execution | 02-19 | 🔥 Focus |
| sentinel-removal | Done | 02-19 | ✅ Complete |
| apg-axis-audit | Discovery | 02-19 | ⏸ Idle |
| command-type-unification | Definition | 02-18 | ⏸ Idle |
| docs-topology | Execution | 02-18 | ⏸ Idle |
| docs-dashboard | Design (PRD/Proposal 완비) | 02-15 | ⏸ Idle |
| testbot | Execution 준비 (Phase 1) | 02-19 | ⏸ Idle |

---

## ✅ Completed (→ archive 완료)

| Project | Completed | Archived |
|---------|-----------|----------|
| test-seam | 02-19 | ✅ docs/1-project/test-seam |
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
| 3 | [field-commit-design](0-inbox/2026-0219-1813-field-commit-design.md) | — | FieldState 표준화 + 입력 경로 단일화 실행. 프로젝트화 또는 즉시 실행 |

> ✅ [area-stale-docs-audit](0-inbox/2026-0218-1046-[analysis]-area-stale-docs-audit.md) — /solve로 해결 (3건 삭제 + 4건 축소/교정). 참고용으로 보존.

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Active Focus | 1 |
| Active Projects (total) | 6 |
| Completed (archived) | 25 |
| Inbox items | 2 |
| Backlog items | 4 |
| Open issues | 0 |

---

## 📝 Recent Changes (2026-02-19)

- ✅ field-architecture-refactor — FieldRegistry implementation, syncDraft removal, TodoApp migration.

- 🔧 `2-area/` 소스코드 미러 구조로 재편 — Johnny.Decimal 번호 체계 적용
  - `10-kernel/`, `20-os/{21-commands,22-focus,23-primitives,24-aria}`, `30-apps/`, `80-cross-cutting/`, `90-meta/`
- 🔧 `/archive` 워크플로우 재정의 — 프로젝트 완료 시 지식을 Area/Resource로 분배
- 🆕 `/retire` 워크플로우 분리 — 기존 `/archive`(문서 퇴출)를 `/retire`로 이름 변경
- 🔧 `/para`, `/project`, `/refactor` 워크플로우 갱신 — `/archive`·`/retire` 호출 연결
- 🆕 `/solve` 워크플로우 신설 — Complex 자율 해결 4단계 래더
- 🔧 `/go` 워크플로우 갱신 — Complex 시 `/solve` 호출하도록 통합
- ✅ `registry-monitor-v5` 완료 — kernel inspector 직접 연결, GroupRegistry 삭제, 521 unit tests
- ✅ `define-app` Phase 3 완료 확인 → archive
- ✅ `builder-mvp` Definition 완료 → archive (Ideas는 별도 프로젝트로)
- ✅ `os-prd` Closing — SPEC.md → 2-area/20-os/SPEC.md, 나머지 archive
- ✅ `create-module` → archive (superseded by define-app)
- 📦 closed issues 7건 → archive
- 📥 Inbox 5건 전부 라우팅
- 📝 `as any` 근본해결 → 백로그 등록
