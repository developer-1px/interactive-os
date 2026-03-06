# Project Dashboard

> Last updated: 2026-03-06T24:00
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, `/status`가 갱신한다. 과거 기록은 git log가 담당한다.
>
> **구조**: 도메인(상설 범주) > 프로젝트(작업 단위) > 태스크(BOARD 내 항목)
> **원본**: `docs/1-project/[domain]/[name]/` 폴더 구조가 SSOT. 이 파일은 투영.

---

## 🔥 Active Focus

| Domain | Project | Phase |
|--------|---------|-------|
| testing | eliminate-createOsPage | #1-#10 Done, #11-#15 Later (OS gap 대기) |

---

## 📋 Domains

### os-core
> `packages/kernel/` · `packages/os-core/` · `packages/os-react/` · `packages/os-sdk/`

| Project | Phase | Last Activity |
|---------|-------|---------------|
| docs-freshness | WP1~WP8 | 03-06 |
| kernel-docs-sync | — | 03-06 |
| condition-auto-disabled | 기획 중 (BOARD 없음) | 03-05 |

### testing
> `packages/os-devtool/` · `tests/`

| Project | Phase | Last Activity |
|---------|-------|---------------|
| eliminate-createOsPage | #1-#10 Done, #11-#15 Later | 03-06 🔥 |
| headless-simulator | Phase 7 Done, Phase 1-6 미착수 | 03-06 |
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
| inspector-dogfooding | T1~T4 ✅, T5 | 03-05 |

### apg
> `src/pages/apg-showcase/` · `tests/apg/`

(현재 활성 프로젝트 없음. 15 patterns 구현 완료, OS core 변경 대기)

### nondeterministic-paradigm
> 탐색적 연구

| Project | Phase | Last Activity |
|---------|-------|---------------|
| nondeterministic-paradigm | 탐색 중 | 03-06 |

---

## ⚠️ Active Migrations

> 패턴 전환이 진행 중인 항목. 에이전트는 Old 패턴을 사용하지 않는다.
> 해당 파일을 수정할 때 New 패턴으로 전환한다.

| Old | New | Remaining |
|-----|-----|-----------|
| `createOsPage()` | `createHeadlessPage()` / `createPage(app)` | 16파일 (value-based APG 6, builder 3, dispatch 3, createOsPage.ts 자체 등) |

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Domains | 6 |
| Active Projects | 10 |
| Active Focus | 1 (eliminate-createOsPage) |
| Stale (7d+) | 0 |
| Active Migrations | 1 (createOsPage→createHeadlessPage) |
| Inbox | docs/0-inbox/ |
| Backlog | docs/5-backlog/ |
