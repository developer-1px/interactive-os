# Coverage Gap Analysis — 2026-02-18

## 📊 Before → After (전체)

| 지표 | Before | After |
|:-----|:------:|:-----:|
| Total Tests | 615 | 645 |
| Test Files | 36 | 37 |

## 처리 파일 상세

| 파일 | Before Lines | After Lines | Before Branch | After Branch |
|:-----|:-----------:|:-----------:|:------------:|:------------:|
| `strategies.ts` | 42% | **97%** | 34% | **88%** |
| `typeahead.ts` | 79% | **100%** | 71% | **92%** |

## 추가한 테스트

| 파일 | 신규 테스트 수 | 내용 |
|:-----|:-----------:|:-----|
| `strategies.test.ts` | 26 | resolveWithStrategy facade, linear 전략, spatial 전략, orientation alias |
| `typeahead.test.ts` | +4 | isSameChar cycling branch (buffer window 내 동일 문자 반복) |

## 남은 Unit 갭 분류

### 🔧 Unit 가능하지만 kernel 통합 필요 (ROI 낮음)

| 파일 | Lines | Branch | 이유 |
|:-----|:-----:|:------:|:-----|
| `dismiss/escape.ts` | 4% | 0% | `kernel.defineCommand` 어댑터. resolver(`resolveEscape`)는 100% |
| `tab/tab.ts` | 4% | 0% | `kernel.defineCommand` 어댑터. resolver(`resolveTab`)는 97% |
| `selection/selectAll.ts` | 8% | 0% | `kernel.defineCommand` 어댑터 |
| `selection/select.ts` | 53% | 38% | DOM 접근(`document.getElementById`) 포함 |
| `expand/index.ts` | 6% | 0% | `kernel.defineCommand` 어댑터. resolver는 100% |
| `navigate/index.ts` | 57% | 34% | `kernel.defineCommand` 어댑터 |

→ 이 파일들은 **E2E 테스트로 커버**하는 것이 적절하다. 순수 resolver 파일은 모두 90%+ 달성.

### 🎭 E2E 영역 (Unit 대상 아님)

| 범위 | Lines | 이유 |
|:-----|:-----:|:-----|
| `5-hooks/*` | <11% | React hooks — DOM/focus 의존 |
| `schemas/state/OSStateDiff.ts` | 0% | 렌더 연결 |
| `schemas/effect/EffectRecord.ts` | 0% | 타입 정의 |

### 🔗 Seam 영역 (Integration 대상 — 2026-02-19 재분류)

| 범위 | Lines | 이유 | 상태 |
|:-----|:-----:|:-----|:----:|
| `6-components/primitives/FieldRegistry.ts` | — | vanilla store lifecycle (register/unregister/updateValue) | ✅ 8 tests |
| `6-components/primitives/Field.tsx` ↔ FieldRegistry | — | useEffect deps → re-registration → localValue 리셋 | ✅ seam test로 커버 |
| `6-components/**/*.tsx` (나머지) | <11% | 순수 React 렌더링 — E2E 유지 | — |

> **교훈 (2026-02-19)**: `6-components`를 일괄 "E2E 영역"으로 분류한 것이 잘못이었다.
> React component 중에서도 **vanilla store와 상호작용하는 경계(seam)** 는 Vitest integration으로 검증 가능.
> 실제로 FieldRegistry lifecycle 버그는 E2E에서만 발견되었고, seam test로 회귀 방지됨.

### ✅ 충분 (80% 이상)

| 범위 | Lines | Branch |
|:-----|:-----:|:------:|
| `1-listeners/resolve*.ts` | 94-100% | 92-100% |
| `navigate/cornerNav.ts` | 97% | 91% |
| `navigate/focusFinder.ts` | 95% | 95% |
| `navigate/entry.ts` | 95% | 76% |
| `navigate/resolve.ts` | 100% | 96% |
| `navigate/strategies.ts` | **97%** | **88%** |
| `navigate/typeahead.ts` | **100%** | **92%** |
| `keymaps/*` | 88-100% | 77-100% |
| `state/*` | 100% | 100% |
| `registries/*` | 100% | 100% |

---

## 📝 Update (2026-02-19)

| 지표 | 02-18 | 02-19 | 변화 |
|:-----|:-----:|:-----:|:-----|
| Total Tests | 645 | 581 | −64 (중복 압축 −144, seam +8, 기타 증분 +72) |
| Test Files | 37 | 41 | +4 |
| Seam Tests | 0 | 8 | 🆕 `field-registry.test.ts` |
| rolePresets.test.ts | 163 tests | 19 tests | `it.each` 통합 (동일 커버리지) |
