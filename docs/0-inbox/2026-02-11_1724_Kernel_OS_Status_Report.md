# Kernel & OS 현황 리포트

> 2026-02-11 17:24 — Kernel/OS 서브시스템 한정 현황

---

## 프로젝트 현황 테이블

| 영역 | RAG | Done | In Progress | Todo | 진척률 | 비고 |
|---|---|---|---|---|---|---|
| **Kernel Core** | 🟢 | 9 | 0 | 1 | **95%** | `@frozen` — 코어 동결. StateLens 추가 완료 |
| **Kernel ↔ App 통합 (Gaps)** | 🟢 | 4 | 1 | 0 | **80%** | Gap 1~4 해결, Gap 5 분석 완료 |
| **OS 커맨드 Pipeline** | 🟢 | 8 | 0 | 3 | **73%** | 주요 커맨드 Kernel 등록 완료. FIELD_*, DELETE, TOGGLE 미전환 |
| **OS 컴포넌트 (Primitives)** | 🟡 | 3 | 0 | 6 | **33%** | Zone, Item, Modal 완료. Field, Trigger, App 등 미전환 |
| **OS Store (Zustand→Kernel)** | 🟡 | 2 | 0 | 3 | **40%** | Kernel state 인프라 완료. FocusGroupStore/FieldRegistry 아직 Zustand |
| **OS 미들웨어** | 🟡 | 2 | 1 | 0 | **67%** | Persistence ✅, History ⚠️ (Gap 5: after 안전성 이슈) |
| **Legacy 제거** | 🔴 | 1 | 0 | 4 | **20%** | Phase 0 dead code 완료. Bridge layer, os/ 폴더 제거 미착수 |

---

## Kernel Core 상세

```
✅ 완료 (동결됨)                          
──────────────────────────────────────
createKernel → Unified Group API         @frozen 2026-02-11
  defineCommand, defineEffect, defineContext
  group(), dispatch, use, reset
Scoped dispatch + bubbling
StateLens (state scoping)                 ← NEW (오늘)
Effect scoping + bubbling + try-catch
Context Token (wrapper object, C1 해결)
CommandFactory 패턴 (오버로딩 금지)
Transaction log + time travel
React hooks (useComputed, useDispatch)
createStore (0-dep reactive store)

📐 미구현
──────────
removeScopedCommand (동적 해제)
Store 타입 전파 (H3)
```

---

## Kernel ↔ App 통합 (Gap 해결 현황)

| Gap | 문제 | 해결 | 검증 |
|---|---|---|---|
| **Gap 1** | 커맨드 정의 패턴 불일치 | StateLens — 앱은 자기 slice만 봄 | ✅ 13/13 pass |
| **Gap 2** | OS.FOCUS placeholder | Context injection으로 자연 소멸 | ✅ smoke test |
| **Gap 3** | state.effects[] 배열 패턴 | defineEffect + return으로 대체 | ✅ 13/13 pass |
| **Gap 4** | Keybinding when 조건 | 3-layer 분해 (OS 게이트 / scope / handler) | ✅ 설계 확정 |
| **Gap 5** | History MW after 안전성 | ⚠️ `ctx.state` 변경이 `effects.state`에 덮일 가능성 | 📐 분석 완료 |

---

## OS Pipeline 마이그레이션 현황

### ✅ Kernel 등록 완료 커맨드
NAVIGATE, ACTIVATE, ESCAPE, TAB, SELECT, SELECTION_*, EXPAND, FOCUS, SYNC_FOCUS, RECOVER

### ⚠️ 미전환 (Pipeline only)
| 커맨드 | 우선순위 | 비고 |
|---|---|---|
| FIELD_* (5개) | 🔴 높음 | Field 편집의 핵심. Kernel 전환 필수 |
| DELETE | 🟡 중간 | Pipeline에만 존재 |
| TOGGLE | 🟡 중간 | Pipeline에만 존재 |

---

## 블로커 (🔴)

| 블로커 | 설명 | 영향 |
|---|---|---|
| **Gap 5: History MW** | `after`에서 `ctx.state` 변경이 `executeEffects`의 `effects.state`와 충돌 가능 | History 유실 위험 |
| **Zustand 공존** | `FocusGroupStore` + `FieldRegistry`가 아직 Zustand 의존 | Kernel 단일 상태 트리 미완성 |

## 주의 항목 (🟡)

| 항목 | 설명 |
|---|---|
| **FIELD_* 미전환** | Todo 앱 개밥먹기 전에 Kernel 등록 필요 |
| **Component 전환률 33%** | Zone, Item만 Kernel 기반. Field, Trigger, App 등 6개 미전환 |
| **Legacy Pipeline 공존** | `os-new/` 안에 두 아키텍처 공존 중. 혼란 가능 |

## 최근 완료 항목

| 날짜 | 항목 |
|---|---|
| 2026-02-11 | Kernel `@frozen` — 코어 동결 |
| 2026-02-11 | StateLens 구현 + smoke test (13/13) |
| 2026-02-11 | Gap 1~4 전부 해결 |
| 2026-02-11 | Keybinding `when` 재설계 논의 완료 (3-layer 분해) |
| 2026-02-11 | Import 확장자 에러 수정 (21파일), TS4111 수정 |
| 2026-02-10 | FocusGroup Kernel 기반 재작성 |
| 2026-02-10 | OS Modal 컴포넌트 구현 |
| 2026-02-10 | Dismiss command 리팩토링 |

---

## 다음 단계 (우선순위)

```
1. Gap 5 수정 — History MW가 ctx.effects를 변환하도록 변경
2. FIELD_* 커맨드 Kernel 등록
3. Todo 앱 개밥먹기 (Commit 2-1)
4. Bridge layer 제거 (Phase 3)
5. Legacy Pipeline 삭제 (Phase 4)
```
