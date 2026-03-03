# /plan — 테스트 역할별 분류 및 물리 분리

> **Date**: 2026-03-03
> **Goal**: 소스 폴더에서 unit만 남기고, 통합/e2e/스크립트를 `tests/`로 분리
> **원칙**: 표에 없는 것은 하지 않는다. 표에 있는 것은 전부 한다.

---

## 전수 분류 결과 (144 테스트 파일)

### 이동 대상: e2e (headless 시뮬레이션 — 49파일)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | APG 헤드리스 15파일 | `packages/os-core/src/4-command/tests/apg/*.apg.test.ts` | `tests/apg/` | 🟢 | — | vitest 15 pass | import 경로 변경 |
| 2 | os-guarantee.test.ts | `packages/os-core/src/4-command/tests/apg/` | `tests/apg/` | 🟢 | →#1 | vitest 1 pass | #1과 동시 이동 |
| 3 | APG UI 3파일 | `src/pages/apg-showcase/tests/unit/*.apg.ui.test.tsx` | `tests/apg/ui/` | 🟢 | — | vitest 3 pass | React 의존 유지 |
| 4 | OS integration 7파일 | `packages/os-core/src/4-command/tests/integration/` | `tests/integration/os/` | 🟢 | — | vitest 7 pass | |
| 5 | Todo integration 9파일 | `src/apps/todo/tests/integration/` | `tests/integration/todo/` | 🟢 | — | vitest 9 pass | |
| 6 | Builder integration 4파일 | `src/apps/builder/tests/integration/` | `tests/integration/builder/` | 🟢 | — | vitest 4 pass | |
| 7 | Docs integration 6파일 | `src/docs-viewer/tests/integration/` | `tests/integration/docs-viewer/` | 🟢 | — | vitest 6 pass | |
| 8 | os-react headless 4파일 | `packages/os-react/src/6-project/tests/{unit,integration}/` (headless) | `tests/e2e/os-react/` | 🟢 | — | vitest 4 pass | |
| 9 | os-core headless 2파일 | `packages/os-core/src/4-command/tests/unit/` (stale-focus, zone-initial) | `tests/e2e/os-core/` | 🟢 | — | vitest 2 pass | |
| 10 | Builder headless 2파일 | `src/apps/builder/tests/unit/` (builder-e2e, builder-headless-items) | `tests/e2e/builder/` | 🟢 | — | vitest 2 pass | |

### 이동 대상: script/devtool (12파일)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 11 | devtool testing 12파일 | `packages/os-devtool/src/testing/tests/` 전체 | `tests/script/devtool/` | 🟢 | — | vitest 12 pass | |

### 잔류: unit (co-located 유지 — ~80파일)

소스 폴더 내 `tests/unit/` 유지. 이동 없음.

### 인프라

| # | 대상 | Before | After | Cynefin |
|---|------|--------|-------|---------|
| 12 | `vitest.config.ts` | packages/src 패턴만 포함 | `tests/` 경로 추가 | 🟢 |
| 13 | `tsconfig.app.json` | packages/src만 include | `tests/` 추가 | 🟢 |

---

## 예상 결과 구조

```
tests/                              ← NEW (루트)
├── apg/                            ← APG 패턴 검증 (16+3=19파일)
│   ├── accordion.apg.test.ts
│   ├── ...14 more...
│   ├── os-guarantee.test.ts
│   └── ui/                         ← APG React UI 테스트
│       ├── accordion.apg.ui.test.tsx
│       ├── alert.apg.ui.test.tsx
│       └── tree.apg.ui.test.tsx
├── integration/                    ← 앱/OS 통합 시나리오 (26파일)
│   ├── os/                         ← OS pipeline 시나리오
│   ├── todo/                       ← Todo BDD
│   ├── builder/                    ← Builder 시나리오
│   └── docs-viewer/                ← Docs 시나리오
├── e2e/                            ← 헤드리스 시뮬레이션 (8파일)
│   ├── os-core/
│   ├── os-react/
│   └── builder/
└── script/                         ← 테스트 봇/인프라 (12파일)
    └── devtool/

packages/*/src/.../tests/unit/      ← unit만 잔류 (~80파일)
```

## MECE 점검

1. **CE**: #1~#13 실행하면 목표(unit만 소스 안, 나머지 분리) 달성? → ✅
2. **ME**: 중복? → ❌ 없음
3. **No-op**: Before=After? → ❌ 없음

## 검증 계획

### Automated
```bash
npx tsc --noEmit                    # tsc 0
npx vitest run                      # 141/144 pass (pre-existing 3 fail 유지)
```

## 라우팅

승인 후 → `/go` (기존 프로젝트 `os-restructure`) — Phase 3 Meta 실행
