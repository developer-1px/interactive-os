# Project Dashboard

> Last updated: 2026-02-18 10:30
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, 워크플로우가 갱신한다. git log가 곧 changelog.

---

## 🔥 Active Focus

_(없음 — 다음 Focus 프로젝트 선택 대기)_

---

## 📋 All Active Projects

| Project | Phase | Last Activity | Status |
|---------|-------|---------------|--------|
| docs-dashboard | Design (PRD/Proposal 완비) | 02-15 | ⏸ Idle |
| testbot | Execution 준비 (Phase 1) | 02-15 | ⏸ Idle |

---

## ✅ Completed (→ archive 완료)

| Project | Completed | Archived |
|---------|-----------|----------|
| registry-monitor-v5 | 02-18 | ✅ 4-archive/2026-02 |
| define-app | 02-18 | ✅ 4-archive/2026-02 |
| builder-mvp | 02-18 | ✅ 4-archive/2026-02 |
| os-prd | 02-18 | ✅ 4-archive/2026-02 (SPEC.md → 2-area/20-os/SPEC.md) |
| naming-convention | 02-17 | ✅ 4-archive/2026-02 |
| field-key-ownership | 02-16 | ✅ 4-archive/2026-02 |
| todo-keyboard-dogfooding | 02-16 | ✅ 4-archive/2026-02 |
| create-module | — | ✅ 4-archive/2026-02 (superseded by define-app) |
| command-palette-e2e | 02-16 | ✅ 4-archive/2026-02 |
| fix-tab-navigation | 02-16 | ✅ 4-archive/2026-02 |
| docs-system-v2 | 02-16 | ✅ 4-archive/2026-02 |
| builder-focus-navigation | 02-15 | ✅ 4-archive/2026-02 |
| builder-os-panel-binding | 02-15 | ✅ 4-archive/2026-02 |
| os-elegance | 02-14 | ✅ 4-archive/2026-02 |
| focus-recovery | 02-15 | ✅ 4-archive/2026-02 |
| todo-v3-migration | 02-15 | ✅ 4-archive/2026-02 |
| todo-app | 02-15 | ✅ 4-archive/2026-02 |
| workflow-ecosystem-refactoring | 02-13 | ✅ 2026 |
| test-structure-convention | 02-13 | ✅ 2026 |
| stream-inspector | 02-13 | ✅ 2026 |
| os-keybinding-architecture | 02-13 | ✅ 2026 |
| official-docs | 02-14 | ✅ 2026 |
| move-docs-script | 02-13 | ✅ 2026 |
| os-core-refactoring | 02-12 | ✅ 2026 |

---

## 📥 Inbox

**✨ Inbox is empty!**

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Active Focus | 0 |
| Active Projects (total) | 2 |
| Completed (archived) | 24 |
| Inbox items | 0 |
| Backlog items | 4 |
| Open issues | 0 |

---

## 📝 Recent Changes (2026-02-18)

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
