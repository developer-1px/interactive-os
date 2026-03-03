# Blueprint: APG Matrix 테스트 7건 실패 해결

## 1. Goal

APG_MATRIX.md 기반 `apg-matrix.test.ts` 26건 전체 PASS.
현재: 19/26 PASS, 7 FAIL.

**Done Criteria**: `npx vitest run apg-matrix.test.ts` → 26/26 PASS.

## 2. Why

APG_MATRIX.md → 선제적 headless 테스트는 OS 커버리지 확보와 회귀 방지.
7건 실패를 방치하면 false negative이 쌓여 테스트 신뢰도가 0이 됨.

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| 7건 실패는 하나의 공통 원인 | ❓ 검증 필요 | 3개 독립 문제로 분리 해결 |
| focusedItemId가 goto 후 null | ❌ **거짓** — listbox ArrowDown→opt-2 PASS가 증명 | **focus는 설정됨.** 실패는 다른 원인 |
| navigate-chain과 동일 코드 경로 | ✅ | — |
| `expandableItems`가 GotoOptions에 있다 | ❌ **없음** — 무시됨 | 이 속성 삭제. 자동 추론에 의존 |

**핵심 무효화**: "focusedItemId가 null이다"는 **거짓 전제**였음.
- listbox ArrowDown: focus=opt-1 → ArrowDown → opt-2 ✅ (focus 작동)
- tabs ArrowRight: focus=tab-1 → ArrowRight → tab-1 ❌ (focus는 있지만 ArrowRight가 작동 안 함)

**진짜 문제**: focusedItemId 아님. ArrowRight→"right" 방향이 tablist/tree에서 다르게 처리됨.

## 4. Ideal

- Tree: ArrowRight→expand, ArrowLeft→collapse, ArrowRight→enterChild 모두 PASS
- Tabs: ArrowRight→next, ArrowLeft→wrap 모두 PASS
- Radio: ArrowUp→wrap PASS
- Switch: click→check PASS
- 총 26/26 PASS

## 5. Inputs

| 파일 | 역할 |
|-|-|
| `navigate/index.ts` L64-127 | chain executor — tree onRight/onLeft |
| `navigate/resolve.ts` L36-63 | orientation filter — horizontal ignores vertical, vice versa |
| `roleRegistry.ts` | tree(vertical, onRight/onLeft), tablist(horizontal), radiogroup(linear-both) |
| `simulate.ts` L69-208 | simulateKeyPress — keybind resolution |
| `osDefaults.ts` | ArrowRight/Left → OS_NAVIGATE direction mapping |
| `resolveKeyboard.ts` | keybind resolver |
| `createHeadlessPage.ts` | page wrapper |
| `page.ts` L737-950 | createOsPage.goto implementation |

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | tree ArrowRight→expand | chain executor + getExpandableItems 자동 공급 | 왜 apg-matrix에서만 안 되는지 **미확인** | High | — |
| G2 | tablist ArrowRight→next tab | orientation="horizontal"에서 "right" 방향 → resolveWithStrategy | resolveWithStrategy가 linear strategy에서 "right"를 "next"로 매핑하는지 **미확인** | High | — |
| G3 | radiogroup ArrowUp→wrap | orientation="linear-both", loop=true | linear-both에서 "up" → "prev" + loop 매핑 **미확인** | Med | G2와 동일 패턴 |
| G4 | switch click→onAction→CHECK | GotoOptions.onAction 연결 | click 후 onAction 호출 경로 **미확인** | Med | — |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| **E0** | 격리 진단 | Clear | — | navigate-chain의 "ArrowRight on collapsed" 테스트를 apg-matrix 파일에 **그대로 복사**하여 PASS/FAIL 확인. PASS면 설정 차이 확정. FAIL이면 파일 수준 충돌. |
| **E1** | G2 진단: orientation+direction 매핑 | Clear | E0 | `resolveWithStrategy("horizontal", ..., "right", ...)` 단위 호출. "right"가 "next"로 매핑되는지 확인. 안 되면 **OS gap**. |
| **E2** | G1 수정: tree 테스트 설정 | Clear | E0 | E0 결과에 따라 `expandableItems` 삭제, items 조정 |
| **E3** | G3 수정: radio wrap | Clear | E1 | E1과 동일 패턴 — "linear-both"에서 "up"→"prev" + loop |
| **E4** | G4 수정: switch click | Clear | — | onAction 연결 경로 확인. 타입 호환성 검증 |
| **E5** | 전체 검증 | Clear | E1-E4 | `vitest run apg-matrix.test.ts` → 26/26 |
