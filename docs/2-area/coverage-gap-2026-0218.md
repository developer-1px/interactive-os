---
last-reviewed: 2026-02-18
---

# Coverage Gap Analysis — 2026-02-18

## Before / After 전체 커버리지

| 지표 | Before | After | 변화 |
|------|--------|-------|------|
| Stmts | 54.10% | **60.45%** | +6.35% |
| Branch | 38.41% | **45.53%** | +7.12% |
| Funcs | 47.11% | **54.18%** | +7.07% |
| Lines | 55.89% | **62.28%** | +6.39% |

## 처리 파일별 Before → After

| 파일 | Before Lines | After Lines | 추가 테스트 |
|------|:-----------:|:-----------:|:-----------:|
| navigate/focusFinder.ts | 0% | **95.4%** | 26 tests |
| navigate/cornerNav.ts | 1.5% | **97.0%** | 17 tests |
| selection/selection.ts | 30% | **100%** | 14 tests |

총 **57개 테스트** 추가, 모두 PASS.

## 남은 Unit 갭 파일

| 파일 | Lines | Branch | 분류 |
|------|------:|-------:|------|
| navigate/strategies.ts | 43.8% | 34% | 🔧 Unit 갭 |
| navigate/index.ts | 58.3% | 34% | 🔧 Unit 갭 (커널 통합) |
| selection/selectAll.ts | 10% | 0% | 🔧 Unit 갭 (커널 통합) |
| selection/select.ts | 58.8% | 38% | 🔧 Unit 갭 (커널 통합) |
| dismiss/escape.ts | 5% | 0% | 🔧 Unit 갭 (커널 통합, resolver는 100%) |
| tab/tab.ts | 4.5% | 0% | 🔧 Unit 갭 (커널 통합, resolver는 97%) |
| field/field.ts | 70.6% | 43% | 🔧 Unit 갭 (커널 통합) |

### E2E 영역 (Unit 대상 아님)

- components/base/ (FocusGroup, FocusItem): 4-6%
- components/primitives/ (Field, Item, Trigger, Zone, Label): 0-28%
- hooks/ (useFieldHooks, useTargetPosition): 5-11%
- defineApp.bind.ts, defineApp.trigger.ts: 0-27%
