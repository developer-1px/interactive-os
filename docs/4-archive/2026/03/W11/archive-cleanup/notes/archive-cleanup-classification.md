# Archive Cleanup — MECE 분류표

> 작성일: 2026-03-10
> 원칙: **코드가 증거다.** 코드에서 읽히면 삭제. 살아있는 문서에 반영이면 삭제. 코드로도 문서로도 표현 불가한 것만 보존.

---

## 분류 기준 (3-Gate Test)

```
Gate 1: 코드에서 읽을 수 있는가? (타입, 테스트, 구현, 폴더 구조)
  → YES → 🗑️ 삭제

Gate 2: 살아있는 문서에 반영되어 있는가? (official, rules, area, knowledge)
  → YES → 🗑️ 삭제

Gate 3: 코드로도 살아있는 문서로도 표현할 수 없는가?
  → YES → ✅ Archive 보존
```

**핵심 통찰**: 코드에 남는 것 = 채택된 것. 채택되지 않은 것(기각된 대안, 안 간 길, 탈락한 용의자, 겪은 실수)은 코드로 표현할 수 없다. 그것이 아카이브의 존재 이유.

---

## MECE 문서 유형 분류

### 🗑️ 항상 삭제

| 유형 | 판별 기준 | 이유 |
|------|-----------|------|
| **BOARD.md** | 프로젝트 관리 도구 (Now/Done/Unresolved) | 프로젝트 종료 시 자연사. 결과는 코드에 있음 |
| **Plan ([plan])** | Before→After 변환 명세표 | After가 현재 코드. 실행 후 죽음 |
| **Spec (spec.md)** | BDD 시나리오, Decision Table | 코드(테스트)가 이미 spec의 실행 형태. 채택 결과는 6-products/spec에 환류 |
| **단순 버그 (1줄 수정)** | 구조적 통찰 없는 fix | 코드가 증거 |
| **빈 폴더** | 내용 없음 | 존재 이유 없음 |
| **미실행 BOARD** | Now에 🔲만 있고 Done 비어있음 | 미실행 = 죽은 계획, backlog이지 히스토리 아님 |
| **REPORT.md (실행 결과)** | 실행 결과 요약 | 코드와 git이 커버 |
| **Blueprint (실행 설계)** | Goal→Why→Divide 실행 전 분석 | 실행 후 코드가 증거. 단, 기각된 대안이 있으면 예외 |
| **처리 완료 inbox** | retired-inbox의 제안/계획 | 채택됐으면 코드에, 기각됐으면 가치 없음 |

### ✅ 항상 보존

| 유형 | 판별 기준 | 이유 |
|------|-----------|------|
| **ADR (설계 결정 기록)** | 기각된 대안 + 기각 이유 포함 | 채택되지 않은 경로는 코드에 없음 |
| **Discussion 결론** | 선택지 비교, 트레이드오프, "왜 이 길을" | 안 간 길의 이유는 코드로 표현 불가 |
| **Retrospective (KPT)** | 실수, 교훈, 프로세스 개선 | 실수와 교훈은 코드에 안 남음 |
| **깊은 진단 (삽질 일지)** | 3+ 용의자 분석, 탈락한 가설 추적 | fix만 코드에 남고 탈락 용의자는 없음 |
| **설계 비교 다이어그램** | AS-IS vs TO-BE, 대안 시각화 | 비교 맥락은 코드에 없음 |
| **안티패턴 카탈로그** | 하면 안 되는 것 + 이유 | 코드에는 "한 것"만 남음 |

### ⚠️ 개별 판단 필요

| 유형 | 판별 기준 | 판단 방법 |
|------|-----------|-----------|
| **Blueprint (기각 대안 포함)** | 여러 접근법 비교 후 하나 채택 | 기각 대안이 있으면 ✅, 없으면 🗑️ |
| **Gap Report / Audit** | 구조적 결함 전수 분석 | 패턴 분류가 있으면 ✅, 단순 목록이면 🗑️ |
| **Usage Spec** | 이상적 API 설계 탐색 | 채택 안 된 API 시그니처가 있으면 ✅ |

---

## 실행 결과

### W09 — 전체 삭제 (빈 폴더만)

| 항목 | 판정 | 이유 |
|------|------|------|
| `apg-testing-rebalance/` | 🗑️ | 빈 폴더 |
| `bdd-tdd-gate/` | 🗑️ | 빈 폴더 |
| `headless-purity/` | 🗑️ | 빈 폴더 |
| `unified-pointer-listener/` | 🗑️ | 빈 폴더 |

### W01

| 항목 | 판정 | 이유 |
|------|------|------|
| `docs-browser/` | 개별 확인 필요 | |

### W08

| 항목 | 판정 | 이유 |
|------|------|------|
| `apg-axis-audit/BOARD.md` | 🗑️ | BOARD |
| `apg-axis-audit/apg-axis-matrix.md` | 개별 확인 | 매트릭스 분석이면 ✅ |
| `apg-axis-audit/discussions/` | ✅ | Discussion |
| `collection-clipboard/BOARD.md` | 🗑️ | BOARD |
| `collection-clipboard/README.md` | 🗑️ | 실행 결과 |
| `command-type-unification/BOARD.md` | 🗑️ | BOARD |
| `command-type-unification/README.md` | 🗑️ | 실행 결과 |
| `command-type-unification/discussions/` | ✅ | Discussion |
| `docs-topology/BOARD.md` | 🗑️ | BOARD |
| `docs-topology/README.md` | 🗑️ | 실행 결과 |
| `docs-topology/discussions/` | ✅ | Discussion |
| `field-props-cleanup/BOARD.md` | 🗑️ | BOARD |
| `field-props-cleanup/README.md` | 🗑️ | 실행 결과 |
| `field-props-cleanup/discussions/` | ✅ | Discussion |
| `lazy-resolution/BOARD.md` | 🗑️ | BOARD |
| `lazy-resolution/README.md` | 🗑️ | 실행 결과 |
| `lazy-resolution/prd.md` | 🗑️ | Spec/PRD |
| `lazy-resolution/discussions/` | ✅ | Discussion |
| `naming-convention/discussions/` | ✅ | Discussion |
| `testbot/0-discussion-journey.md` | ✅ | Discussion journey |
| `testbot/1-discussion-conclusion.md` | ✅ | Discussion 결론 |
| `testbot/2-prd.md` | 🗑️ | Spec/PRD |
| `testbot/3-kpi.md` | 🗑️ | 실행 지표 |
| `testbot/4-proposal.md` | ⚠️ 개별 확인 | 제안에 기각 대안이 있으면 ✅ |
| `testbot/5-status.md` | 🗑️ | 실행 현황 |
| `testbot/discussions/` | ✅ | Discussion |
| `testbot/notes/` | 🗑️ | Plan/notes |

### W10 — 프로젝트별

| 항목 | 판정 | 이유 |
|------|------|------|
| **action-axis-unification/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ retrospective.md | ✅ | KPT |
| └ notes/ | 🗑️ | Plans |
| **ai-native-pipeline/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **ai-native-pipeline-enhance/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **apg-dt-standard/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plans |
| **apg-test-fidelity/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **apg-test-fix-18/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ retrospective.md | ✅ | KPT |
| └ notes/ | 🗑️ | Plan |
| **closed-issues/** | | |
| ├ docviewer-mermaid-error.md | 🗑️ | 단순 버그 |
| ├ max-update-depth-exceeded.md | ✅ | 3용의자 깊은 진단 |
| ├ selection-focus-recovery.md | 🗑️ | 단순 버그 |
| ├ naming-consistency.md | 🗑️ | 코드에 반영됨 + knowledge에 환류됨 |
| └ 2026-03-closed-issues/ | 개별 확인 | |
| **code-hygiene/** | 🗑️ | 빈 폴더 |
| **collection-crud-showcase/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ | 🗑️ | Plan |
| **command-config-invariant/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ blueprint-*.md | 🗑️ | Blueprint (실행 설계) |
| ├ spec.md | 🗑️ | Spec |
| ├ retrospective.md | ✅ | KPT |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ | 🗑️ | Plan |
| **compute-refactor/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ REPORT.md | 🗑️ | 실행 결과 |
| └ notes/ | 🗑️ | Plan |
| **dev-pipeline/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ discussions/ | ✅ | 워크플로우 설계 논의 |
| └ notes/ | 🗑️ | Plan |
| **docs-router/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ REPORT.md | 🗑️ | 실행 결과 |
| └ notes/ | 🗑️ | Plan |
| **docs-structure/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **eliminate-createOsPage/** | | |
| ├ blueprint-*.md | 🗑️ | Blueprint |
| └ notes/ | 🗑️ | Plan |
| **eliminate-layout-dispatch/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ retrospective.md | ✅ | KPT |
| └ 하위 notes/ | 🗑️ | Plans + 단, analysis 개별 확인 |
| **headless-overlay/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **headless-page-docs/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan/Report |
| **initial-state-aria-controls/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **locator-projection/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ | 🗑️ | Plan |
| **og-012-expandable-wiring/** | | |
| └ BOARD.md | 🗑️ | BOARD |
| **os-restructure/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ REPORT*.md | 🗑️ | 실행 결과 |
| ├ blueprint-*.md | 🗑️ | Blueprint |
| ├ discussions/ | ✅ | "tsx 책임 분리", "OS 냉정한 평가" — 핵심 설계 논의 |
| └ notes/ | 🗑️ | Plans |
| **page-layer-separation/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **playwright-subset/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **purge-os-core-imports/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ (gap-report) | ⚠️ | 구조적 갭 분석이면 ✅ |
| **remove-dynamic-trigger/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **require-component/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ | 🗑️ | Plan |
| **retired-inbox/** (전체) | 🗑️ | 처리 완료 inbox |
| **strict-api-guard/** | | |
| ├ BOARD.md | 🗑️ | BOARD (Why/Principles는 knowledge에 환류해야) |
| └ notes/ | 🗑️ | Plan |
| **tab-state/** | | |
| ├ BOARD.md | 🗑️ | BOARD (Unresolved는 backlog로) |
| └ notes/ | 🗑️ | Plan |
| **test-cleanup/** | | |
| └ BOARD.md | 🗑️ | BOARD (RC분석은 knowledge에 환류해야) |
| **test-page-unification/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **test-structure-standardization/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ | 🗑️ | Plan |
| **testbot-zift/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ spec*.md | 🗑️ | Spec |
| ├ retrospective.md | ✅ | KPT |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ | 🗑️ | Plan |
| **todo-test-modernize/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ blueprint-*.md | 🗑️ | Blueprint |
| ├ retrospective.md | ✅ | KPT |
| └ notes/ | 🗑️ | Plan |
| **trigger-click-fix/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ retrospective.md | ✅ | KPT |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ | 🗑️ | Plan |
| **trigger-id/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **trigger-listener-gap/** | | |
| ├ discussions/ | ✅ | Trigger 설계미스 논의 |
| └ notes/ | 🗑️ | Plans + audit |
| **trigger-unify/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ retrospective.md | ✅ | KPT |
| └ notes/ | 🗑️ | Plan |
| **unified-zift-resolver/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ retrospective.md | ✅ | KPT |
| └ notes/ | 🗑️ | Plan |
| **workflow-knowledge-separation/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ | 🗑️ | Plan |
| **zero-drift/** | 🗑️ | 빈 폴더 |
| **zift-usage-spec/** | | |
| ├ discussions/ | ✅ | ADR + 근본적 회의 + trigger 설계 |
| └ notes/ | 🗑️ | Plan |

### W10 — Loose files

| 항목 | 판정 | 이유 |
|------|------|------|
| `1-blueprint-overlay-escape-dismiss.md` | 🗑️ | Blueprint |
| `2026-0304-plan-top-down-enforcement.md` | 🗑️ | Plan |
| `2026-0306-plan-auto-session-isolation.md` | 🗑️ | Plan |
| `eliminate-createOsPage-BOARD.md` | 🗑️ | BOARD |
| `eliminate-createOsPage-blueprint.md` | 🗑️ | Blueprint |
| `infrastructure-inventory.md` | 🗑️ | 실행 시점 인벤토리 |
| `resolve-axis-BOARD.md` | 🗑️ | BOARD |
| `top-down-enforcement-BOARD.md` | 🗑️ | BOARD |

### W11 — 프로젝트별

| 항목 | 판정 | 이유 |
|------|------|------|
| **action-centric-trigger/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ spec.md | 🗑️ | Spec |
| ├ retrospective.md | ✅ | KPT |
| └ notes/ | 🗑️ | Plans + audit |
| **ban-dispatch-tsx/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ | 🗑️ | Plan |
| **combobox-relay/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ spec.md | 🗑️ | Spec |
| ├ retrospective.md | ✅ | KPT |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ (blueprint) | ⚠️ | Blueprint — 기각 대안 있으면 ✅ |
| **dispatch-tsx/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ plan-*.md | 🗑️ | Plan |
| └ violations.md | 🗑️ | 실행 시점 목록 |
| **docs-freshness/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ REPORT.md | 🗑️ | 실행 결과 |
| **inspector-dogfooding/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ REPORT.md | 🗑️ | 실행 결과 |
| ├ spec.md | 🗑️ | Spec |
| ├ blueprint-*.md | 🗑️ | Blueprint |
| ├ plan-*.md | 🗑️ | Plan |
| ├ retrospective.md | ✅ | KPT |
| ├ discussions/ | ✅ | view-state vs OS primitive |
| └ notes/ | 🗑️ | Plan |
| **kernel-docs-sync/** | | |
| └ BOARD.md | 🗑️ | BOARD |
| **keyboard-input-isomorphism/** | | |
| └ BOARD.md | 🗑️ | BOARD |
| **layer-playground/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ blueprint-*.md | 🗑️ | Blueprint |
| ├ retrospective.md | ✅ | KPT |
| └ notes/ | 🗑️ | Plan |
| **lint-zero/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **nondeterministic-paradigm/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **os-test-suite/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **pipeline-v2-discussions/** | 🗑️ | 빈 폴더 |
| **pipeline-v2-notes/** | | |
| ├ pipeline-redesign.md | ✅ | 설계 비교 다이어그램 (AS-IS vs TO-BE) |
| └ skill-taxonomy.md | ✅ | 분류 체계 분석 |
| **projection-items/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ | 🗑️ | Plan |
| **repro-skill/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ | 🗑️ | Plan |
| **seal-useComputed/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ retrospective.md | ✅ | KPT |
| └ notes/ (blueprint) | ⚠️ | Blueprint — 기각 대안 있으면 ✅ |
| **testbot-apg-fix/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ retrospective.md | ✅ | KPT |
| └ notes/ | 🗑️ | Plan |
| **testbot-discovery/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ (blueprint) | ⚠️ | Blueprint — 개별 확인 |
| **unify-scenario-items/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| └ notes/ (analysis) | ✅ | 삽질 일지 — 깊은 진단 |
| **zero-drift-proof/** | | |
| ├ BOARD.md | 🗑️ | BOARD |
| ├ REPORT.md | 🗑️ | 실행 결과 |
| ├ discussions/ | ✅ | Discussion |
| └ notes/ | 🗑️ | Plan |

### W11 — Loose files

| 항목 | 판정 | 이유 |
|------|------|------|
| `2026-0218-kernel-dispatch-generic.md` | 🗑️ | 코드에 반영됨 |
| `2026-0304-plan-menu-button-test-unification.md` | 🗑️ | Plan |
| `2026-0309-[antipattern]-os-react-overengineering.md` | ✅ | 안티패턴 카탈로그 |
| `2026-0309-plan-ap4-pilot.md` | 🗑️ | Plan |
| `docs-viewer-headless-BOARD.md` | 🗑️ | BOARD |
| `pipeline-v2-BOARD.md` | 🗑️ | BOARD |
| `react-antipattern-BOARD.md` | 🗑️ | BOARD |
| `react-antipattern-spec.md` | 🗑️ | Spec — 코드에 반영됨 |

---

## 향후 적용: 프로젝트 스캐폴딩 개선 제안

현재 아카이브의 노이즈는 프로젝트 생성 시점에 disposable과 archivable을 분리하지 않았기 때문.

```
# 제안: 프로젝트 폴더 구조
project-name/
  BOARD.md          ← 항상 삭제 (실행 도구)
  plans/            ← 항상 삭제 (실행 계획)
  specs/            ← 항상 삭제 (코드/테스트에 반영)
  decisions/        ← 항상 archive로 이동 (의사결정 기록)
    adr-*.md
    retrospective.md
    discussion-*.md
    diagnosis-*.md
```

이렇게 하면 `/archive`는:
1. 살아있는 지식 → official/rules 추출
2. `decisions/` → `4-archive/`로 이동
3. 나머지 전부 삭제

**분류 판단 = 0. 구조가 강제. Pit of Success.**
