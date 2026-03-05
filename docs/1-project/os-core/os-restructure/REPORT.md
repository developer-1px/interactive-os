# 테스트 분리 — Discussion + /divide Report

## Discussion Journey

**🧑 사용자**: 테스트를 따로 모아서 관리하도록 하자. 기존 폴더에 섞지 말고.

**🤖 AI**: 업계 표준 조사. 프론트엔드는 co-located 주류. 현재 이미 `tests/unit/` 하위 디렉토리로 소스와 분리.

---

**🧑 사용자**: 그건 유닛들이고, 우리의 테스트는 e2e를 표방하는 테스트를 더 많이 하고 싶은건데?

**🤖 AI**: 핵심 구분 확인 — e2e 테스트는 Pipeline 전체를 관통, 특정 패키지 소속 부적절. 루트 `tests/`로 분리 제안.

---

## Discussion Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | e2e/integration 테스트를 루트 `tests/`로 분리. pure unit은 co-located 유지 |
| **📊 Data** | 144 테스트 중 ~64파일이 e2e 성격 (APG 18 + integration 30 + "unit" 폴더 headless 16). `4-command/tests/apg/`처럼 소속 부적절 |
| **🔗 Warrant** | e2e 테스트는 시스템 전체를 테스트 → 특정 모듈에 co-located하면 소속 혼란 |
| **📚 Backing** | Cypress/Playwright의 루트 `tests/` 구조, Go test 패턴 |
| **⚖️ Qualifier** | 🟡 Complicated |
| **⚡ Rebuttal** | 파일 이동 시 import path 변경 비용. vitest.config 수정 필요 |
| **❓ Open Gap** | 정확한 분류 기준: "headless simulation 사용 = e2e"? |

---

## /divide Report — 테스트 파일 물리 분리

### Problem Frame

| | 내용 |
|---|------|
| **Objective** | 🟢 e2e/integration 테스트를 루트 `tests/`로 분리. 소스 폴더에서 제거 |
| **Constraints** | 🟢 tsc 0, vitest 0 regression, import path 정합성 |
| **Variables** | 🟡 "e2e" 분류 기준 — headless 시뮬레이션 사용 여부로 판단 |

### Backward Chain

| Depth | Subgoal | 충족? | Evidence | 미충족 시 전제조건 |
|-------|---------|-------|----------|-------------------|
| 0 | 모든 e2e/integration 테스트가 루트 `tests/`에 위치 | ❌ | 현재 30개 디렉토리에 분산 | → A, B, C, D |
| 1 | A: APG 패턴 테스트 분리 | ❌ | `os-core/src/4-command/tests/apg/` 15파일 + `apg-showcase/` 3파일 | 🔨 WP-A |
| 1 | B: 앱 integration 테스트 분리 | ❌ | `todo/tests/integration/` 9, `builder/tests/integration/` 4, `docs-viewer/tests/integration/` 6 | 🔨 WP-B |
| 1 | C: OS integration 테스트 분리 | ❌ | `os-core/4-command/tests/integration/` 7 | 🔨 WP-C |
| 1 | D: "unit" 라벨이지만 e2e 성격 테스트 재분류 | ❌ | headless 시뮬레이션 사용 16파일 | 🔨 WP-D |
| 1 | E: vitest.config 패턴 갱신 | ❌ | 새 `tests/` 경로 포함 필요 | 🔨 WP-E |

### Work Packages

| WP | 파일수 | From | To | 비고 |
|----|--------|------|----|------|
| **WP-A** | 18 | `os-core/.../tests/apg/` + `apg-showcase/tests/` | `tests/apg/` | APG 패턴 전수 |
| **WP-B** | 19 | `apps/*/tests/integration/` | `tests/integration/apps/{todo,builder,docs-viewer}/` | 앱 시나리오 |
| **WP-C** | 7 | `os-core/.../tests/integration/` | `tests/integration/os/` | OS 파이프라인 시나리오 |
| **WP-D** | 16 | 각종 `tests/unit/` | `tests/e2e/` 또는 재분류 | headless 시뮬레이션 사용 |
| **WP-E** | — | `vitest.config.ts` | 패턴 갱신 | `tests/` include 추가 |

### 예상 결과 구조

```
tests/
├── apg/                    ← W3C APG 패턴 검증 (18파일)
├── integration/
│   ├── os/                 ← OS 파이프라인 시나리오 (7파일)
│   ├── todo/               ← Todo 앱 BDD (9파일)
│   ├── builder/            ← Builder 통합 (4파일)
│   └── docs-viewer/        ← Docs 통합 (6파일)
└── e2e/                    ← 헤드리스 시뮬레이션 기반 (16파일)

packages/*/src/...tests/unit/  ← pure unit 유지 (~80파일)
```

### Residual Uncertainty

- WP-D의 16파일 중 일부는 실제로 unit에 가까울 수 있음 (파일별 개별 판단 필요)

## 라우팅

승인 후 → `/go` (기존 프로젝트 `os-restructure`) — Phase 3: 테스트 분리
