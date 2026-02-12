# 📊 Interactive-OS 폴더 구조 MoSCoW 평가 리포트

> **날짜**: 2026-02-12  
> **기준**: 현재 코드베이스 + PARA 문서

---

## 1. 프로젝트 현황 테이블

| 프로젝트 | RAG | Done | In Progress | Todo | 진척률 | 비고 |
|----------|-----|------|-------------|------|--------|------|
| **os-core-refactoring** | 🟡 | 5 | 4 | 7 | ~65% | Kernel ✅, OS 부분완성, App 미착수 |
| **todo-app** | 🟡 | 0 | 1 | 3 | ~30% | Headless PRD(Draft), E2E 전략 수립 중 |
| **tanstack-router** | 🟢 | 3 | 0 | 0 | 100% | 마이그레이션 완료, 운영 중 |
| **focus-recovery** | 🟡 | 3 | 1 | 2 | ~50% | 전략 수립 완료, 커널 기반 재구현 필요 |
| **focus-showcase** | 🟡 | 0 | 0 | 1 | ~20% | 디자인 이슈 분석만 완료 |
| **stream-inspector** | 🟢 | 1 | 0 | 1 | ~60% | 기본 동작, 통합 제안 존재 |
| **runner-architecture** | 🟡 | 0 | 0 | 1 | ~20% | 아키텍처 문서만 존재 |

---

## 2. MoSCoW 폴더 구조 평가

### 🔴 Must Have — 없으면 프로젝트가 작동하지 않는 핵심 구조

| 폴더 | 상태 | 평가 |
|------|------|------|
| `packages/kernel/` | ✅ | **핵심 런타임**. dispatch, bubbling, scoped handler, EffectMap. 완성도 높음 |
| `src/os-new/` (6-Domino) | ⚠️ | **OS 레이어**. 1-listeners → 6-components 계층형 구조. 의미 명확하나 3-commands ⚠️ 과밀 (24 파일) |
| `src/os-new/schema/` | ✅ | 커맨드/이펙트/상태 타입 정의. 29 파일로 커맨드 체계의 SSoT |
| `src/apps/todo/` | ⚠️ | **레퍼런스 앱**. 22 파일. 80%가 이미 headless이나 clipboard에 부수효과 잔존 |
| `src/routes/` | ✅ | TanStack Router 기반. `__root.tsx`, `_minimal/`, `_todo/` 레이아웃 그룹 |
| `src/pages/` | ✅ | 라우트별 페이지 컴포넌트. 6개 페이지 + 6개 하위폴더 |

**MoSCoW 판정**: 핵심 3-Layer 아키텍처(Kernel → OS → App)의 폴더 구조는 **확립됨**. 다만 `os-new/3-commands/`의 과밀과 `os/` 레거시 잔존이 리스크.

---

### 🟡 Should Have — 있어야 생산성과 품질이 보장되는 구조

| 폴더 | 상태 | 평가 |
|------|------|------|
| `packages/surface/` | ⚠️ | OS Facade (`OS.Zone`, `OS.Item` 등). 19 파일. 앱이 OS 내부를 직접 import 하지 않게 하는 **진입점** |
| `src/os-new/keymaps/` | ✅ | 리스너에서 분리된 키맵 설정. 3 파일 — 깔끔 |
| `src/os-new/middleware/` | ✅ | Transaction, debug 등 횡단 관심사. 3 파일 |
| `src/os-new/registry/` | ✅ | ZoneRegistry. 1 파일 |
| `src/os-new/state/` | ✅ | OS 상태 관리. 3 파일 |
| `docs/2-area/` | ✅ | 8개 영역 (00-principles ~ 07-code-standards). 번호 접두사로 정렬. 총 43 문서 |
| `docs/1-project/` | ⚠️ | 7개 프로젝트. os-core-refactoring에 **34문서** 집중 (비대화 징후) |
| `e2e/` | ⚠️ | Playwright 기반 E2E. 13 파일. 전략 전환 중 (TestBot → Playwright-only) |
| `vite-plugins/` | ✅ | spec-wrapper, shim 등 빌드 확장. 8 파일 |

**MoSCoW 판정**: Surface 패키지와 docs PARA 구조는 잘 갖춰져 있으나, `os-core-refactoring` 프로젝트 폴더 비대화와 E2E 전략 전환 미완이 개선 필요.

---

### 🟢 Could Have — 있으면 이상적이지만 없어도 작동하는 구조

| 폴더 | 상태 | 평가 |
|------|------|------|
| `src/command-palette/` | ⚠️ | 4 파일. 별도 폴더로 분리되었으나 아직 초기 상태 |
| `src/docs-viewer/` | ✅ | 공유 docs 뷰어. 8 파일. 중복 코드 통합 완료 |
| `src/inspector/` | ✅ | DevTools 인스펙터. 57 파일 — 기능 풍부하나 규모 대비 독립 패키지화 고려 가능 |
| `src/lib/` | ✅ | 공유 유틸리티. 3 파일. 적절한 크기 |
| `docs/3-resource/` | ✅ | 54 참고자료. kernel-adr/ (22 ADR) 포함. **풍부한 의사결정 기록** |
| `docs/10-devnote/` | ✅ | 개발 노트. 4 파일 |
| `docs/11-discussions/` | ✅ | 토론 기록. 15 파일 |
| `docs/4-archive/` | ✅ | 아카이브. 7 파일. PARA 워크플로우 정상 작동 |
| `scripts/` | ✅ | 유틸 스크립트. 2 파일 |
| `.agent/workflows/` | ✅ | 18개 AI 워크플로우. 체계적 |

**MoSCoW 판정**: 개발 경험 향상 도구들이 잘 갖춰져 있음. Inspector는 규모가 커져 장기적으로 패키지 분리 검토 가능.

---

### ⚪ Won't Have (현재) — 현재 존재하지 않거나, 의도적으로 배제한 구조

| 폴더/구조 | 이유 | 향후 필요성 |
|-----------|------|------------|
| `src/os/` (레거시) | `os-new/`로 마이그레이션 중. 47곳 교차 import 잔존 | 🔴 삭제 필요 (마이그레이션 완료 후) |
| `packages/kernel/test/` | 커널 단위 테스트 없음 | 🟡 Should에 해당하나 현재 미착수 |
| `src/apps/kanban/` | 아직 미구현 | 🟢 Later 단계 |
| `src/os-new/3-commands/` 서브폴더 | 24 파일이 평탄 구조. 서브폴더 재구조화 proposal 존재 | 🟡 곧 실행 예정 |
| PersistenceAdapter | 상태 영속화. Non-Goals에 명시 (아키텍처 전환 후) | 🟢 Later |
| CI/CD 설정 | `.github/workflows/` 등 | 🟢 프로덕션 배포 시점 |

---

## 3. 소스 폴더 전체 MoSCoW 맵

```
interactive-os/
├── packages/                         🔴 Must
│   ├── kernel/     (5 files)         🔴 Must  — 핵심 런타임 ✅
│   └── surface/    (19 files)        🟡 Should — OS Facade ⚠️
│
├── src/
│   ├── os-new/     (95 files)        🔴 Must  — OS 레이어 ⚠️
│   │   ├── 1-listeners/  (3)         ✅ 완료
│   │   ├── 2-contexts/   (2)         ✅ 완료
│   │   ├── 3-commands/   (24)        ⚠️ 과밀, 분리 필요
│   │   ├── 4-effects/    (1)         ✅ 완료
│   │   ├── 5-hooks/      (9)         ✅ 완료
│   │   ├── 6-components/ (13)        ⚠️ Zone,Item만 완료
│   │   ├── keymaps/      (3)         ✅ 분리 완료
│   │   ├── middleware/   (3)         ✅ 횡단관심사
│   │   ├── registry/     (1)         ✅
│   │   ├── schema/       (29)        🔴 Must — 타입 SSoT
│   │   ├── state/        (3)         ✅
│   │   └── lib/          (1)         ✅
│   │
│   ├── apps/                         🔴 Must
│   │   ├── todo/   (22 files)        🟡 Should — Headless 분리 필요
│   │   └── builder/ (8 files)        🟢 Could — NCP 데모 전용
│   │
│   ├── routes/     (16 files)        🔴 Must  — TanStack Router ✅
│   ├── pages/      (33 files)        🔴 Must  — 페이지 컴포넌트 ✅
│   ├── command-palette/ (4 files)    🟢 Could — 초기 단계
│   ├── docs-viewer/ (8 files)        🟢 Could — 문서 뷰어 ✅
│   ├── inspector/  (57 files)        🟢 Could — DevTools
│   └── lib/        (3 files)         🟡 Should — 공유 유틸
│
├── docs/                              🟡 Should
│   ├── 0-inbox/                       ✅ 비어있음 (정리 완료)
│   ├── 1-project/  (51 docs)          🟡 os-core에 34개 집중
│   ├── 2-area/     (43 docs)          ✅ 8개 영역 체계적
│   ├── 3-resource/ (54 docs)          ✅ ADR 22개 포함
│   ├── 4-archive/  (7 docs)           ✅ PARA 정상
│   ├── 10-devnote/ (4 docs)           🟢 개발 일지
│   └── 11-discussions/ (15 docs)      🟢 토론 기록
│
├── e2e/            (13 files)         🟡 Should — 전략 전환 중
├── vite-plugins/   (8 files)          🟡 Should — 빌드 확장
└── .agent/workflows/ (18 files)       🟢 Could — AI 워크플로우
```

---

## 4. 블로커 (🔴)

| 블로커 | 영향 | 긴급도 |
|--------|------|--------|
| `os/` 레거시 잔존 (47곳 교차 import) | `os-new/` → `os/` 리네임 불가 | 🔴 |
| `3-commands/` 24 파일 평탄 구조 | 응집도 저하, 탐색 비용 증가 | 🟡 |
| Builder* 유지 여부 미결정 | `os/` 삭제 시점 결정 불가 | 🟡 |
| E2E 전략 전환 미완 | TestBot ↔ Playwright 이중 구조 | 🟡 |

## 5. 주의 항목 (🟡)

| 항목 | 설명 |
|------|------|
| `inspector/` 57 파일 | 규모 대비 패키지 분리 미검토 |
| `os-core-refactoring` 프로젝트 34문서 | notes/ 폴더에 21개 집중. 아카이빙 대상 선별 필요 |
| `packages/surface/` 진입점 정리 | OS Facade import 위반 일부 잔존 |
| Todo 앱 clipboard 부수효과 | `navigator.clipboard` 직접 호출이 커맨드 핸들러에 잔존 |

## 6. 최근 완료 항목

| 완료 항목 | 날짜 |
|-----------|------|
| Kernel 패키지 완성 | 02-09 |
| 6-Domino 폴더 구조 적용 | 02-09 |
| Spike (Zone 프로토타입) | 02-10 |
| Legacy Dead Code 1차 정리 | 02-10 |
| Dialog/Modal Kernel 구현 | 02-11 |
| Listeners 리팩토링 (3파일로 정리) | 02-11 |
| docs-viewer 중복 통합 | 02-12 |
| Todo E2E 전략 수립 (Playwright-only) | 02-12 |
| OS Facade import 위반 수정 | 02-12 |
| AnyCommand 제거, BaseCommand 통일 | 02-12 |

## 7. 영역(Area) 개요

| 영역 | 문서 수 | 최근 갱신 |
|------|---------|-----------|
| `00-principles` | 2 | 02-12 |
| `01-command-pipeline` | 3 | 02-12 |
| `02-focus-navigation` | 9 | 02-12 |
| `03-zift-primitives` | 8 | 02-11 |
| `04-aria` | 4 | 02-10 |
| `05-kernel` | 3 | 02-10 |
| `06-testing` | 10 | 02-12 |
| `07-code-standards` | 4 | 02-11 |

---

## 8. 종합 평가

### 🏆 잘 된 점

1. **3-Layer 아키텍처**(Kernel → OS → App)가 폴더 구조에 명확히 반영됨
2. **6-Domino 구조** (1-listeners → 6-components)가 의존 방향을 강제하는 좋은 설계
3. **PARA 문서 시스템**이 체계적으로 운영됨. Inbox가 비어있는 것은 정리가 잘 되고 있다는 증거
4. **Kernel ADR 22개** — 의사결정 추적이 우수

### ⚠️ 개선 필요

1. **`3-commands/` 서브폴더 분리** — MoSCoW: Should. 24 파일은 너무 많음
2. **`os/` 레거시 완전 삭제** — MoSCoW: Must. 47곳 교차 import가 가장 큰 기술 부채
3. **`os-core-refactoring/notes/` 아카이빙** — 21개 노트 중 완료된 항목은 4-archive로 이동 고려
4. **`inspector/` 패키지 분리 검토** — 57 파일은 독립 패키지 수준

### 📈 MoSCoW 점수 요약

| 등급 | 항목 수 | 현재 상태 |
|------|---------|-----------|
| 🔴 Must Have | 6 | 5/6 확립 (os/ 레거시 미삭제) |
| 🟡 Should Have | 9 | 6/9 완료 (commands 분리, 커널 테스트, E2E 미완) |
| 🟢 Could Have | 7 | 5/7 존재 (command-palette 초기, kanban 미착수) |
| ⚪ Won't Have | 6 | 의도된 배제 3 + 미래 필요 3 |

> **전체 평가**: 폴더 구조의 **Must Have는 83% 달성**, Should Have는 67% 달성. 핵심 아키텍처가 폴더에 잘 반영되어 있으나, `os/` 레거시 삭제와 `3-commands/` 분리가 남은 핵심 과제.
