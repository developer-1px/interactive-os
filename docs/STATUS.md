# Project Dashboard

> Last updated: 2026-03-05 11:00
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, `/status`가 갱신한다. 과거 기록은 git log가 담당한다.
>
> **구조**: 도메인(상설 범주) > 프로젝트(작업 단위) > 태스크(BOARD 내 항목)
> **원본**: `docs/1-project/[domain]/[name]/` 폴더 구조가 SSOT. 이 파일은 투영.

---

## 🔥 Active Focus

**os-core / zift-usage-spec** — ZIFT 보편 모델 설계. Zone+from/to+with[] + NormalizedStore. 코드 수정 없는 설계 완성. Meta.

**testing / headless-simulator** — Vitest에서 Playwright 수준 검증 달성. DOM → OS VDOM. 거짓 GREEN 근절. Heavy.

**builder / builder-v2** — Panel Accordion + OS tree auto-expand. Heavy.

---

## 📋 Domains

### os-core
> `packages/kernel/` · `packages/os-core/` · `packages/os-react/` · `packages/os-sdk/`

| Project | Phase | Last Activity |
|---------|-------|---------------|
| 🔥 zift-usage-spec | Scaffold, T1~T6 미착수 | 03-04 |
| selection-unification | Scaffold, plan 미착수 | 03-05 |
| eliminate-layout-dispatch | Scaffold, T1~T4 | 03-05 |
| condition-auto-disabled | 기획 중 (BOARD 없음) | new |
| os-restructure | Phase 4 Done | 03-05 |

### testing
> `packages/os-devtool/` · `tests/`

| Project | Phase | Last Activity |
|---------|-------|---------------|
| 🔥 headless-simulator | Phase 1 T4~T6 | 03-03 |
| test-observability | Scaffold, T1~T4 | 03-04 |
| replay | Scaffold, T1 | 02-21 ⚠️ |

### builder
> `src/` builder 관련

| Project | Phase | Last Activity |
|---------|-------|---------------|
| 🔥 builder-v2 | T12, T13, T20 | 03-02 |
| builder-v3 | 기획 완료. 개발 보류 | 03-04 |

### inspector
> `src/inspector/`

| Project | Phase | Last Activity |
|---------|-------|---------------|
| inspector-dogfooding | T1~T4 ✅, T5 | 03-02 |

### apg
> `src/pages/apg-showcase/` · `tests/apg/`

(현재 활성 프로젝트 없음. 15 patterns 구현 완료, OS core 변경 대기)

---

## ⚠️ Active Migrations

> 패턴 전환이 진행 중인 항목. 에이전트는 Old 패턴을 사용하지 않는다.
> 해당 파일을 수정할 때 New 패턴으로 전환한다.

| Old Pattern | New Pattern | Remaining |
|-------------|-------------|-----------|
| `zone.selection[]` 배열 | `zone.items[id]["aria-selected"]` map | → selection-unification |
| `useLayoutEffect` 내 dispatch | `config.initial` 선언적 | → eliminate-layout-dispatch |

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Domains | 5 |
| Active Projects | 11 |
| Active Focus | 3 |
| Stale (7d+) | 1 (replay) |
| Active Migrations | 2 |
| Inbox | docs/0-inbox/ (7건) |
| Backlog | docs/5-backlog/ |
