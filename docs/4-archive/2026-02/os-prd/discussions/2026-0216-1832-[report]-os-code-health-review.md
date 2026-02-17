# OS 코드 현황 보고서

| 항목 | 값 |
|------|-----|
| 원문 | OS의 코드적인 측면에서 현황을 검토해줘 |
| 내(AI)가 추정한 의도 | OS 코드의 건강 상태를 진단하고, 기술부채와 개선 기회를 파악하여 다음 작업 우선순위 결정에 활용 |
| 날짜 | 2026-02-16 |
| 상태 | report |

---

## 1. 개요 (Overview)

OS 레이어(`src/os/`)의 코드 현황을 **구조, 규모, 타입 안전성, 테스트 커버리지, SPEC 정합성** 다섯 축으로 진단한다.

---

## 2. 코드 규모 (Metrics)

### 2.1 Production Code

| 항목 | 값 |
|------|-----|
| 소스 파일 수 (test 제외) | 100개 |
| 총 라인 수 | **9,639줄** |
| 스키마/타입 정의 (`schema/`) | 27개 파일 |
| 커맨드 (`3-commands/`) | 47개 파일 (10 도메인) |
| 컴포넌트 (`6-components/`) | 13개 파일 |

### 2.2 Test Code

| 항목 | 값 |
|------|-----|
| Unit test 파일 | 21개 |
| Unit test LOC | **3,399줄** |
| Unit test 수 | 476개 (전체 프로젝트) |
| E2E spec 파일 | 18개 (전체 프로젝트) |
| E2E test LOC | 4,134줄 |
| E2E test 수 | 164개 |
| **Test : Code 비율** | **35.3%** (3,399 / 9,639) |

### 2.3 Big Files (300줄 초과)

| 파일 | 라인 | 역할 | 리스크 |
|------|------|------|--------|
| `defineApp.ts` | 912 | 앱 프레임워크 팩토리 | ⚠️ 역할 과중, `as any` 25개 |
| `QuickPick.tsx` | 502 | OS Combobox primitive | `as any` 5개 — kernel.dispatch 타입 |
| `FocusGroup.tsx` | 419 | Zone 구현체 | 정상 범위 |
| `Trigger.tsx` | 381 | 트리거 컴포넌트 | `as any` 6개 |
| `roleRegistry.ts` | 345 | Role preset 테이블 | 구조적으로 큰 것이 자연스러움 |
| `focusFinder.ts` | 324 | Spatial nav 알고리즘 | 정상 범위 |

---

## 3. 타입 안전성 (Type Safety)

### 3.1 `as any` 현황

| 파일 | 개수 | 주요 원인 |
|------|------|-----------|
| `defineApp.ts` | **25** | kernel generic 타입 불일치, proxy 패턴 |
| `Trigger.tsx` | 6 | ref 합성, BaseCommand → dispatch |
| `QuickPick.tsx` | 5 | kernel.dispatch(COMMAND() **as any**) |
| `Field.tsx` | 3 | ref 합성, props spread |
| `FocusItem.tsx` | 2 | ref 합성 |
| `Dialog.tsx` | 1 | child.type 비교 |
| **합계** | **42** | — |

### 3.2 `: any` 타입 선언 현황

| 위치 | 개수 | 주요 원인 |
|------|------|-----------|
| `defineApp.ts` | ~20 | CommandFactory generic, payload |
| `keybindings.ts` | 2 | command generic |
| `HistoryState.ts` | 2 | snapshot/command |
| 기타 | 34 | 다양한 핸들러/유틸리티 |
| **합계** | **58** | — |

### 3.3 분석

- **가장 큰 타입 보틀넥: `defineApp.ts`** — 900줄 파일에 `as any` 25개, `: any` 20개. 전체 OS의 `any` 중 45%가 이 파일에 집중. 주 원인은 **kernel의 Command/Payload generic이 `defineApp`의 dynamic proxy 패턴과 불일치**하기 때문.
- **`kernel.dispatch(CMD() as any)` 패턴**: QuickPick, Trigger 등에서 반복. OS 커맨드의 타입 시그니처와 kernel.dispatch의 generic이 불일치. 이것은 kernel 레벨의 타입 설계 문제.
- **ref 합성의 `as any`**: FocusItem, Trigger, Field에서 React ref + cloneElement 합성 시 발생. React 타입 한계.

---

## 4. SPEC 정합성 (Spec Alignment)

### 4.1 구현 상태별 분류

| Status | 커맨드 수 | 상세 |
|--------|----------|------|
| ✅ 구현 + 테스트 | **22** | FOCUS, NAVIGATE, TAB, SELECT(7), ACTIVATE, OS_CHECK, ESCAPE, OS_DELETE, EXPAND, OS_COPY/CUT/PASTE |
| ⚠️ 구현됨, 테스트 미흡 | **13** | SYNC_FOCUS, RECOVER, STACK_PUSH/POP, OS_MOVE_UP/DOWN, OS_UNDO/REDO, FIELD(3), OVERLAY(2) |
| ❌ 미구현 | **0** | — |

### 4.2 ⚠️ 상세 분석

| 커맨드 | 구현 | 문제 |
|--------|------|------|
| `SYNC_FOCUS` | ✅ | E2E 없음, unit 없음. FocusListener.focusin에서만 사용 |
| `RECOVER` | ✅ | E2E 없음. MutationObserver 기반으로 실제 삭제 시나리오 테스트 필요 |
| `STACK_PUSH/POP` | ✅ unit | `stack.test.ts`에 unit 있으나 E2E에서 직접 검증은 dialog 통합에 의존 |
| `OS_MOVE_UP/DOWN` | ✅ | dogfooding E2E에서 간접 검증, 전용 테스트 없음 |
| `OS_UNDO/REDO` | ✅ unit + E2E | `history.test.ts` + dogfooding E2E. 실질적으로 ✅에 가까움 |
| `FIELD_*` (3) | ✅ unit | `field.test.ts` 14개. E2E 없음 (Field는 contentEditable 기반이라 E2E 어려움) |
| `OVERLAY_*` (2) | ✅ unit | `overlay.test.ts` 9개. E2E는 dialog 통합에 의존 |
| `macFallback` | ✅ | 동작하지만 전용 테스트 없음 |

### 4.3 Known Gaps (SPEC Appendix)

| Gap | Severity | 상태 |
|-----|----------|------|
| G4: `recoveryTargetId` 미검증 | Low | **Open** — RECOVER E2E 없음 |
| G5: `seamless` 네비 미확인 | Low | **Open** — builderBlock에서 사용하나 명확한 스펙 없음 |

---

## 5. 구조적 관찰 (Structural Observations)

### 5.1 아키텍처 계층 준수 ✅

```
1-listeners → keymaps → 3-commands → 4-effects
     ↑                       ↓
6-components ← 2-contexts ← state/schema
```

- 레이어 간 의존 방향이 일관적: listeners → commands → state
- 역방향 참조 없음 (good)
- components(6)는 contexts(2)와 schema만 참조 (good)

### 5.2 관심사 분리 상태

| 도메인 | 파일 수 | 상태 |
|--------|--------|------|
| Focus | 5 commands + FocusGroup + FocusItem + FocusListener | ✅ 잘 분리됨 |
| Navigate | 7 files (index, strategies, focusFinder, cornerNav, typeahead, resolvers) | ✅ 전략 패턴으로 분리 |
| Selection | 4 files | ✅ |
| Tab | 3 files (tab, resolveTab, resolveEscape) | ✅ 순수함수 추출됨 |
| Keyboard | KeyboardListener + keymaps(6) + fieldKeyOwnership | ✅ middleware 체인 |
| Clipboard | 1 file | ✅ 단순 |
| Overlay | 1 file | ✅ 단순 |

### 5.3 `defineApp.ts` — 구조적 위험

- **912줄** — OS에서 가장 큰 파일
- 역할: CommandFactory, SelectorFactory, ConditionFactory, ZoneHandle, BoundComponents, SimpleTrigger, persistence middleware, keybinding registration, when guard evaluation
- **최소 5가지 책임**을 하나의 파일에서 담당

---

## 6. 코드 위생 (Code Hygiene)

| 지표 | 값 | 판정 |
|------|-----|------|
| TODO/FIXME/HACK 주석 | **0개** (production OS 코드) | ✅ |
| Biome lint errors | **0개** | ✅ |
| Biome warnings | ~85개 (전체 프로젝트) | ⚠️ 대부분 pre-existing |
| tsc errors | 0 | ✅ |
| 미사용 export | 확인 안됨 | — |
| Dead code | `/doubt` 워크플로우로 정리됨 (02-15) | ✅ |

---

## 7. 결론 및 제안 (Conclusion & Proposals)

### 건강 상태 요약

| 축 | 등급 | 근거 |
|-----|------|------|
| 구조 | 🟢 A | 레이어 일관성, 역참조 없음, 관심사 분리 양호 |
| 규모 | 🟢 A | 9.6K줄에 100개 커맨드/컴포넌트. 적정 규모 |
| 타입 | 🟡 B | `as any` 42개, 80%가 defineApp + kernel dispatch 타입 불일치 |
| 테스트 | 🟡 B+ | 커버리지 35%, 핵심 경로 ✅, ⚠️ 13개 커맨드가 간접 검증에 의존 |
| SPEC 정합 | 🟢 A | 미구현 0, Known Gap 2개 (Low severity) |

### 개선 우선순위

| # | 제안 | 영향 | 난이도 | 유형 |
|---|------|------|--------|------|
| 1 | **defineApp.ts 분할** | 타입 안전성 + 가독성 개선 | Medium | 🔴 Open — 분할 경계 설계 필요 |
| 2 | **kernel.dispatch 타입 개선** | `as any` 42개 중 30+개 제거 가능 | High | 🟡 Constrained — kernel 패키지 수정 필요 |
| 3 | **⚠️ 커맨드 유닛 테스트 보강** | SYNC_FOCUS, RECOVER 등 직접 검증 | Low | 🟢 Known — 기존 test util 활용 |
| 4 | **SPEC ⚠️ → ✅ 승격 판정** | 실제로 ✅인 것(UNDO/REDO 등) SPEC 갱신 | Low | 🟢 Known |

---

## 8. 해법 유형 (Solution Landscape)

- **🟢 Known**: 테스트 보강(#3), SPEC 갱신(#4) — 기계적으로 실행 가능
- **🟡 Constrained**: kernel dispatch 타입(#2) — generic 수준의 설계는 정해져 있으나 구현 범위가 kernel 패키지까지 확장
- **🔴 Open**: defineApp 분할(#1) — ZoneHandle, BoundComponents, persistence를 어떻게 분리할지 아키텍처 의사결정 필요

---

## 9. 인식 한계 (Epistemic Status)

- 이 분석은 **정적 코드 분석**에 기반하며, 런타임 성능(렌더링 횟수, 메모리 사용량 등)은 확인하지 않았다.
- `as any` 카운트는 grep 기반이며, 의도적 타입 단언(React ref 합성 등)과 실질적 타입 구멍을 구분하지 않았다.
- E2E 테스트에서 간접적으로 ⚠️ 커맨드를 검증하는 범위는 정확히 측정하지 못했다.

---

## 10. 열린 질문 (Open Questions)

1. `defineApp.ts` 분할을 진행할 것인가? 진행한다면 어떤 경계로 나눌 것인가?
2. kernel 패키지의 Command generic 타입 개선을 별도 프로젝트로 진행할 것인가?
3. ⚠️ 커맨드들의 테스트 보강을 독립 작업으로 할 것인가, 아니면 관련 기능 작업 시 점진적으로 해결할 것인가?

---

> **한줄요약**: OS 코드는 구조적으로 건강하나(A등급), 타입 안전성(B)이 보틀넥이며 `defineApp.ts`(912줄, as any 25개)의 분할과 kernel dispatch 타입 개선이 가장 큰 개선 기회다.
