# Project Dashboard

> Last updated: 2026-03-12T18:00
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, `/status`가 갱신한다. 과거 기록은 git log가 담당한다.
>
> **구조**: 도메인(제품 레이어) > epic(확정 컨셉, 영구) > 프로젝트(작업 단위) > 태스크(BOARD 내 항목)
> **원본**: `docs/1-project/[domain]/[epic]/[project]/` 폴더 구조가 SSOT. 이 파일은 투영.
> **이름 규칙**: epic 이름 = 코드 canonical name (kebab-case). 모든 문서에서 통일.
> **상태 4분류**: Active(진행) · Hold(멈춤, epic 유지) · Archive(완료·폐기) · Backlog(컨셉 미확정)

---

## 🔥 Active Focus

**harness/skill/wip-skill** — `/wip` 스킬 생성 (Meta)

---

## 📋 Domains

### kernel
> `packages/kernel/`

| Epic | Project | Status | Last Activity |
|------|---------|--------|---------------|
| (프로젝트 생길 때 epic 발견) | — | — | — |

### os
> `packages/os-core/` · `packages/os-sdk/` · `packages/os-react/` · `packages/os-testing/` · `packages/os-devtool/`

| Epic | Project | Status | Last Activity |
|------|---------|--------|---------------|
| **sdk-role-factory** | Phase 1 ✅, Phase 2 미착수 | ⚠️ Hold | 03-11 |
| **ban-os-from-tsx** | T1-T8 scaffold | ⚠️ Hold | 03-09 |
| **apg** | apg-suite: WP0 Done, WP1-2 미착수 | ⚠️ Hold | 03-07 |
| **headless-page** | headless-simulator: P7 Done, P1-6 미착수 | ⚠️ Hold | 03-07 |
| **headless-page** | headless-test-gaps | ⚠️ Hold | 03-11 |
| **testbot** | testbot-e2e | ⚠️ Hold | 03-11 |
| collection | — | — | — |
| command | — | — | — |
| devtool-split | ✅ Archived (W11) | Archive | 03-11 |
| field | — | — | — |
| inspector | — | — | — |
| navigate | — | — | — |
| overlay | — | — | — |
| trigger | — | — | — |
| zift | — | — | — |

### apps
> `src/apps/`

| Epic | Project | Status | Last Activity |
|------|---------|--------|---------------|
| **builder** | builder-v2: T12, T13, T20 | ⚠️ Hold | 03-05 |
| **builder** | builder-v3: 기획 완료, 개발 보류 | ⚠️ Hold | 03-05 |
| todo | — | — | — |

### harness
> LLM 자율 실행 프레임워크 (`.claude/skills/`, hooks, pipelines)

| Epic | Project | Status | Last Activity |
|------|---------|--------|---------------|
| **skill** | wip-skill: `/wip` 스킬 생성 | 🔥 Active | 03-12 |
| agent | design-review-agent: ✅ Archived (W11) | Archive | 03-12 |
| agent | qa-agent: ✅ Archived (W11) | Archive | 03-11 |
| pipeline | meta-pipeline: ✅ Archived (W11) | Archive | 03-12 |

### agent-activity
> 에이전트 활동 관리 도구 (`src/apps/docs-viewer/` → 진화 중)

| Epic | Project | Status | Last Activity |
|------|---------|--------|---------------|
| **docs-viewer** | os-migration: T7 OS gap 발견 후 멈춤 | ⚠️ Hold | 03-10 |
| **docs-viewer** | hmr-activity: ✅ Archived (W11) | Archive | 03-12 |
| activity-feed | — | — | — |
| dashboard | — | — | — |

---

## ⚠️ Active Migrations

없음

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Domains | 5 (kernel, os, apps, harness, agent-activity) |
| Epics (confirmed) | 21 |
| Active Projects | 1 |
| Hold Projects | 7 |
| Archived (this session) | 7 (devtool-split, agent-recent, archive-cleanup, qa-agent, hmr-activity, design-review-agent, meta-pipeline) |
| Backlog (demoted) | 3 (replay, test-observability, condition-auto-disabled) |
| Inbox | docs/0-inbox/ |
| Backlog | docs/5-backlog/ |
