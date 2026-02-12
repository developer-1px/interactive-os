# 프로젝트 완료·잔여 현황 감사

| 항목 | 내용 |
|------|------|
| **원문** | project 중에 끝난거 없는지 확인해봐 아니면 뭐가 남았는지 작성해 |
| **내(AI)가 추정한 의도** | 8개 활성 프로젝트의 실제 완료 여부를 점검하고, 아카이브 대상과 남은 작업을 정리하려 한다 |
| **날짜** | 2026-02-13 |

---

## 1. 개요

PARA 정리 직후 `docs/1-project/`에 남은 8개 프로젝트를 점검하여 **완료(Archive 대상)**, **비활성(Stale)**, **진행 중**으로 분류했다.

---

## 2. 프로젝트별 현황

### ✅ 완료 — 아카이브 대상

| 프로젝트 | 근거 | 조치 |
|----------|------|------|
| **remapping** | STATUS에 `✅ 구현 완료` 명시. K1-K6 전부 완료. 커밋 `a082bb3` 기록. | → `docs/4-archive/2026/remapping/` |

---

### ⚠️ 비활성(Stale) — 아카이브 또는 Area로 전환 검토

| 프로젝트 | 문서 수 | 마지막 갱신 | 상태 | 제안 |
|----------|---------|------------|------|------|
| **focus-showcase** | 1 | 02-08 | 설계 이슈 분석만 존재. 구현 계획 없음 | → Archive (또는 `02-focus-navigation` Area에 병합) |
| **runner-architecture** | 1 | 02-08 | Runner 아키텍처 제안서. 레거시 파이프라인 제거로 **전제가 바뀜** (`CommandEngineStore` 삭제됨) | → Archive (전제 소멸) |

---

### 🚧 진행 중 — 남은 작업 정리

#### 1. os-core-refactoring (~65%)

| 카테고리 | 남은 항목 |
|----------|----------|
| **Now** | Legacy Dead Code 제거, FocusData→Kernel, FIELD_* 커맨드 등록, Field 컴포넌트 재작성 |
| **Next** | CommandEngineStore→Kernel 전환, Legacy Pipeline 최종 삭제, COPY/CUT/PASTE Kernel 등록, useFocusRecovery 재구현, OS 커맨드 단위 테스트 |
| **Later** | Builder* 처리, Trigger/Label/Root 전환, PersistenceAdapter, `os/`→`os-new/` 리네임 |
| **Blockers** | Builder* 유지 여부 미결정, Zustand 제거 시점, `os/`↔`os-new/` 교차 import ~47곳 |

#### 2. todo-app (~30%)

| 남은 항목 |
|----------|
| Headless Layer PRD 리뷰/실행 (7 Phase: Model → Commands → Selectors → Effects → Logic → Keymap → AppSlice) |
| clipboard.ts 이펙트 분리 (`navigator.clipboard` 직접 호출 제거) |
| clipboardData 모듈 변수 → AppState.clipboard 이동 |
| 카테고리 CRUD 신규 구현 |
| E2E 남은 3건: Meta+Arrow 리매핑 충돌 2건 + Sidebar nav 1건 |

#### 3. focus-recovery (~50%)

| 남은 항목 |
|----------|
| 하이브리드 전략(결론) 구현: FocusSync Safety Net 추가 |
| `resolveRecovery`를 FocusSync에서 호출하도록 연결 |
| 커널 기반 재구현 (현재 레거시 `useFocusRecovery` 의존) |

#### 4. create-module (Phase 1 초기)

| 남은 항목 |
|----------|
| PROPOSAL 리뷰/승인 |
| /divide 실행 |
| `createModule.ts` 구현 |
| `TodoModule` 정의 |
| 테스트 재작성 및 검증 |
| KPI 측정 |

#### 5. stream-inspector (~60%)

| 남은 항목 |
|----------|
| UnifiedInspector UI/UX 브라우저 확인 |
| Inspector Shell 일반화 (하드코딩 탭 → InspectorRegistry) |
| Correlation ID 구현 (OS 커맨드 ↔ Kernel Transaction 매핑) |
| Time Travel, 검색/필터 등 추가 기능 |

---

## 3. 결론 / 제안

| 조치 | 건수 |
|------|------|
| **즉시 아카이브** | 1 (`remapping`) |
| **아카이브 검토** | 2 (`focus-showcase`, `runner-architecture`) |
| **계속 진행** | 5 |

> **즉시 실행 가능**: `remapping` 아카이브. `runner-architecture`는 전제가 소멸했으므로 강력히 아카이브 추천.

---

## 4. 해법 유형

🟢 **Known** — 프로젝트 STATUS 문서와 코드 커밋 기록으로 완료 여부가 자명하게 판단 가능.

## 5. 인식 한계

- `os-core-refactoring`의 진행률 65%는 STATUS 문서 자기 평가 기반. 실제 코드 diff와 다를 수 있음.
- `focus-showcase`, `runner-architecture`의 비활성 판단은 최종 갱신일(02-08) 기준이며, 사용자의 미래 계획은 반영하지 못함.

## 6. 열린 질문

1. `remapping`을 바로 아카이브할까?
2. `focus-showcase`를 아카이브할까, `02-focus-navigation` Area에 병합할까?
3. `runner-architecture`를 아카이브할까? (레거시 파이프라인 제거로 전제 소멸)

---

**한줄요약**: 8개 프로젝트 중 `remapping`은 완료(아카이브 대상), `focus-showcase`·`runner-architecture`는 비활성(아카이브 검토), 나머지 5개는 명확한 잔여 작업이 있어 계속 진행.
