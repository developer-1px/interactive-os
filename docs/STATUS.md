# Project Dashboard

> Last updated: 2026-03-10T15:00
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, `/status`가 갱신한다. 과거 기록은 git log가 담당한다.
>
> **구조**: 도메인(상설 범주) > epic(확정 컨셉) > 프로젝트(작업 단위) > 태스크(BOARD 내 항목)
> **원본**: `docs/1-project/[domain]/[epic]/[project]/` 폴더 구조가 SSOT. 이 파일은 투영.
> **이름 규칙**: epic 이름 = 코드 canonical name (kebab-case). 모든 문서에서 통일.

---

## 🔥 Active Focus

**testing/headless-page/zero-drift-proof** — Zero Drift 경험적 증명 (1 script → headless + E2E)

---

## 📋 Domains

### os-core
> `packages/kernel/` · `packages/os-core/` · `packages/os-react/` · `packages/os-sdk/`

| Project | Phase | Last Activity |
|---------|-------|---------------|
| ban-os-from-tsx | Scaffold (T1-T8) | 03-09 |

### testing
> `packages/os-devtool/` · `tests/`

| Project | Phase | Last Activity |
|---------|-------|---------------|
| **headless-page**/zero-drift-proof 🔥 | Scaffold | 03-10 |
| **headless-page**/headless-simulator ⚠️ | Phase 7 Done, Phase 1-6 미착수 | 03-07 |
| test-observability ⚠️ | Scaffold, T1~T4 | 03-05 |
| replay ⚠️ | Scaffold, T1 | 03-05 |

### builder
> `src/` builder 관련

| Project | Phase | Last Activity |
|---------|-------|---------------|
| builder-v2 ⚠️ | T12, T13, T20 | 03-05 |
| builder-v3 ⚠️ | 기획 완료. 개발 보류 | 03-05 |

### apg
> `tests/apg/` · `src/pages/apg-showcase/` · `packages/os-core/` headless role support

| Project | Phase | Last Activity |
|---------|-------|---------------|
| apg-suite ⚠️ | WP0 Done (331→0 fail), WP1-WP2 Backlog | 03-07 |

---

## ⚠️ Active Migrations

(없음)

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Domains | 4 |
| Active Projects | 8 |
| Epics (confirmed) | 1 (headless-page) |
| Active Focus | 1 |
| Stale (4d+) | 6 |
| Active Migrations | 0 |
| Inbox | docs/0-inbox/ |
| Backlog | docs/5-backlog/ |
