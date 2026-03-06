# Project Dashboard

> Last updated: 2026-03-06T24:30
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, `/status`가 갱신한다. 과거 기록은 git log가 담당한다.
>
> **구조**: 도메인(상설 범주) > 프로젝트(작업 단위) > 태스크(BOARD 내 항목)
> **원본**: `docs/1-project/[domain]/[name]/` 폴더 구조가 SSOT. 이 파일은 투영.

---

## 🔥 Active Focus

(없음 — eliminate-createOsPage 완료, 아카이브됨)

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

(없음 — createOsPage 마이그레이션 완료. 잔여 import = 인프라 내부만)

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Domains | 6 |
| Active Projects | 9 |
| Active Focus | 0 |
| Stale (7d+) | 0 |
| Active Migrations | 0 |
| Inbox | docs/0-inbox/ |
| Backlog | docs/5-backlog/ |
