# 프로젝트 현황 리포트

> 생성일: 2026-02-14 23:15
> 기준: `docs/1-project/`, `docs/2-area/`, 코드베이스 교차 검증

---

## 📊 프로젝트 현황 테이블

| # | 프로젝트 | RAG | Done | In Progress | Todo | 진척률 | 비고 |
|---|----------|-----|------|-------------|------|--------|------|
| 1 | **define-app** (v5) | 🟢 | 14 | 1 | 1 | **90%** | Production 전환 완료. Builder v5 마이그레이션 잔여 |
| 2 | **os-core-refactoring** | 🟡 | 8 | 2 | 5 | **55%** | Kernel 완성, FIELD_* 미등록, Legacy 공존 |
| 3 | **os-elegance** | 🟢 | 7 | 0 | 3 | **70%** | 코드 정리 3커밋 완료. 시각적 개선(W1-4) 미착수 |
| 4 | **os-keybinding-architecture** | 🟢 | 6 | 0 | 0 | **100%** | ✅ 완료. 후속 UI과제 2건 low priority |
| 5 | **test-structure-convention** | 🟢 | 7 | 0 | 0 | **100%** | ✅ 완료 |
| 6 | **official-docs** | 🟢 | 4 | 0 | 0 | **100%** | ✅ 완료. KPI 7/7 |
| 7 | **move-docs-script** | 🟢 | 3 | 0 | 0 | **100%** | ✅ 완료 |
| 8 | **testbot** | 🟡 | 2 | 0 | 3 | **40%** | Proposal 작성 완료, 구현 미착수 |
| 9 | **create-module** | 🟡 | 3 | 0 | 2 | **60%** | defineApp에 흡수, 정리 필요 |
| 10 | **todo-app** | 🟢 | 5 | 1 | 1 | **75%** | v5 31 unit + 12 E2E. 붙여넣기 포커스 버그 잔여 |
| 11 | **todo-v3-migration** | 🟢 | 3 | 0 | 0 | **100%** | ✅ 완료 (defineApp에 포함) |
| 12 | **stream-inspector** | 🟡 | 2 | 0 | 3 | **40%** | Unified Inspector UI 검증 미완 |
| 13 | **docs-dashboard** | 🟡 | 1 | 0 | 3 | **25%** | Proposal만 존재, 구현 미착수 |
| 14 | **builder-focus-navigation** | 🔴 | 0 | 0 | 4 | **0%** | 프로젝트 시작만. 구현 미착수 |
| 15 | **builder-os-panel-binding** | 🔴 | 0 | 0 | 4 | **0%** | 프로젝트 시작만. 구현 미착수 |
| 16 | **focus-recovery** | 🟡 | 2 | 0 | 3 | **40%** | 전략 문서화 완료, 구현 미착수 |
| 17 | **workflow-ecosystem-refactoring** | 🟡 | 3 | 0 | 2 | **60%** | Proposal 완료, 실행 부분 진행 |

**전체 요약**: 19개 프로젝트 중 **7개 완료(🟢100%)**, 4개 궤도(🟢70%+), 6개 주의(🟡), 2개 미착수(🔴)

---

## 🔴 블로커

| 항목 | 영향 범위 | 설명 |
|------|-----------|------|
| **Builder* 유지 여부** | os-core-refactoring, builder-*, define-app | 6개 Builder 컴포넌트가 NCP 데모 전용. 삭제 vs v5 전환 결정 미정 |
| **`os/` ↔ legacy 교차 import ~47곳** | os-core-refactoring | Legacy Pipeline 완전 삭제 조건 |
| **defineApp.ts 90+ biome `noExplicitAny`** | os-elegance | v3 compat 타입 소거 vs 파일 예외 처리 결정 필요 |

---

## 🟡 주의 항목

| 항목 | 리스크 |
|------|--------|
| **FIELD_* 커맨드 미등록** | os-core-refactoring 다음 마일스톤이나, 진척 없음 (2/12 이후 정체) |
| **Todo 붙여넣기 포커스 버그** | 근본 원인 진단됨 (`FOCUS_ID` effect), 수정 미완료 |
| **Unified Inspector 브라우저 검증** | UI 구현 완료 상태이나 실제 동작 검증 안 됨 |
| **TestBot 구현 미착수** | Proposal 준비 완료, 착수 대기 |
| **데드라인 미설정** | 모든 프로젝트에 공통. 점진적 마이그레이션의 최대 리스크 |

---

## ✅ 최근 완료 항목 (2026-02-14)

| 항목 | 커밋 |
|------|------|
| defineApp v5 Production 전환 (Phase 3 핵심) | `6685468` ~ `d15b2a5` |
| Todo v5 native: 31 unit + 12 E2E | `0b3c845` ~ `d15b2a5` |
| OS Elegance: deprecated 삭제, `as any` 정리, Devtools lazy-load | `f0e8d71`, `81e6c5e` |
| Workflow KPT: /go 탈출조건, /verify Lint 단계 추가 | `ecdfd6e` |
| 공식 문서 PARA 분리 (10 docs, 17 links) | `673c538` |

---

## 📚 영역(Area) 개요

| 영역 | 문서 수 | 설명 |
|------|---------|------|
| `00-principles` | 2 | 프로젝트 철학, 설계 원칙 |
| `01-command-pipeline` | 4 | 커맨드 파이프라인 설계/결정 |
| `02-focus-navigation` | 9 | 포커스 관리 전략/구현 |
| `03-os-primitives` | 8 | Zone, Item, Field, Trigger 등 |
| `04-aria` | 4 | ARIA 패턴/역할 매핑 |
| `05-kernel` | 2 | Kernel 설계 (공식 문서 분리됨 → `docs/official/kernel/`) |
| `06-testing` | 13 | 테스트 전략/구조/도구 |
| `07-code-standards` | 5 | 코드 스타일/관례 |

---

## 🐛 Open Issues (6건)

| # | 이슈 | 상태 |
|---|------|------|
| 1 | focus-showcase tree toggle modal focus | Open |
| 2 | native clipboard blocked | Open |
| 3 | todo clipboard focus (paste 후 포커스) | Open |
| 4 | todo copy-paste fail | Open |
| 5 | command-palette focus | Open |
| 6 | command-palette UX | Open |
| — | docs keyboard nav broken | ✅ Closed |
| — | focus infinite loop | ✅ Closed |

---

## 🏗️ 코드베이스 건강 지표

| 지표 | 값 |
|------|-----|
| **Unit Tests** | 141/141 passed (13 files) |
| **tsc** | 0 errors |
| **Build** | ✅ OK |
| **Apps** | 2 (todo, builder) |
| **OS Layers** | 6-Domino (1-listeners → 6-components) + keymaps, lib, schema, state |
| **Kernel** | 독립 패키지 (`packages/kernel/`), createKernel + tokens |
| **Routes** | 13개 playground 라우트 |
| **Workflows** | 30개 `.agent/workflows/` |
| **@deprecated** | 0건 ✅ |
| **FIXME/HACK** | 0건 ✅ |
| **Production console.log** | 0건 ✅ |
