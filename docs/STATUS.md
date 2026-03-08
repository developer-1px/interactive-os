# Project Dashboard

> Last updated: 2026-03-08T23:50
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, `/status`가 갱신한다. 과거 기록은 git log가 담당한다.
>
> **구조**: 도메인(상설 범주) > epic(확정 컨셉) > 프로젝트(작업 단위) > 태스크(BOARD 내 항목)
> **원본**: `docs/1-project/[domain]/[epic]/[project]/` 폴더 구조가 SSOT. 이 파일은 투영.
> **이름 규칙**: epic 이름 = 코드 canonical name (kebab-case). 모든 문서에서 통일.

---

## 🔥 Active Focus

| Domain | Project | Phase |
|--------|---------|-------|
| apg | **layer-playground** | T1~T8 Done |
| inspector | **inspector-dogfooding** | T5 Next |
| testing | **os-test-suite** | T1~T4 Done |

---

## 📋 Domains

### os-core
> `packages/kernel/` · `packages/os-core/` · `packages/os-react/` · `packages/os-sdk/`

| Project | Phase | Last Activity |
|---------|-------|---------------|
| ~~trigger-click-fix~~ | ✅ Archived (W10) | 03-08 |
| ~~trigger-unify~~ | ✅ Archived (W10) | 03-08 |
| docs-freshness | WP1~WP8 | 03-06 |
| kernel-docs-sync | — | 03-06 |
| keyboard-input-isomorphism | — | 03-07 |

### testing
> `packages/os-devtool/` · `tests/`

| Project | Phase | Last Activity |
|---------|-------|---------------|
| **headless-page**/headless-simulator | Phase 7 Done, Phase 1-6 미착수 | 03-07 |
| os-test-suite | T1~T4 Done | 03-08 |
| ~~headless-overlay~~ | ✅ Archived (W10) | 03-08 |
| lint-zero | T1~T5 Now | 03-06 |
| test-observability | Scaffold, T1~T4 | 03-05 |
| replay | Scaffold, T1 | 03-05 |

### builder
> `src/` builder 관련

| Project | Phase | Last Activity |
|---------|-------|---------------|
| builder-v2 | T12, T13, T20 | 03-05 |
| builder-v3 | 기획 완료. 개발 보류 | 03-05 |

### inspector
> `src/inspector/`

| Project | Phase | Last Activity |
|---------|-------|---------------|
| inspector-dogfooding | T1~T4,T6~T9 ✅, T5 Next | 03-08 |
| ~~testbot-zift~~ | ✅ Archived (W10) | 03-08 |

### apg
> `tests/apg/` · `src/pages/apg-showcase/` · `packages/os-core/` headless role support

| Project | Phase | Last Activity |
|---------|-------|---------------|
| apg-suite | WP0 Done (331→0 fail), WP1-WP2 Backlog | 03-07 |
| ~~apg-dt-standard~~ | ✅ Archived (W10) | 03-07 |
| layer-playground | T1~T8 Done | 03-08 |

### nondeterministic-paradigm
> 탐색적 연구

| Project | Phase | Last Activity |
|---------|-------|---------------|
| (domain-level) | 탐색 중 | 03-06 |

---

## ⚠️ Active Migrations

(없음)

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Domains | 6 |
| Active Projects | 14 |
| Epics (confirmed) | 1 (headless-page) |
| Active Focus | 3 (layer-playground, inspector-dogfooding, os-test-suite) |
| Stale (7d+) | 0 |
| Active Migrations | 0 |
| Inbox | docs/0-inbox/ |
| Backlog | docs/5-backlog/ |
