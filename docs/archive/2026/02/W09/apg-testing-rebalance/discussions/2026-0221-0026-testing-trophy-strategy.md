# Testing Trophy 전략 전환 — Discussion + Solve 결과

> 2026-02-21
> Discussion → Solve 통합 문서

---

## Journey

**🧑 사용자**: 유닛테스트가 많고 통합테스트가 적은데, 테스트 트로피 전략으로 바꾸면서 통합 테스트 비중을 높이겠다.

**🤖 AI**: 현재 테스트 분포를 분석했다. Unit 54(59%), APG 8(9%), Integration 8(9%), E2E 22(24%). 전형적인 테스트 피라미드. 기존 `apg-testing-rebalance` 프로젝트에서 KernelTestKit 인프라는 이미 구축됨. `Delete → Focus Draft` 버그가 "유닛으로는 오케스트레이션을 못 잡는다"를 증명.

---

**🧑 사용자**: 고민은 2가지. 통합 테스트를 press/mousedown 등 shim으로 시작해서 attr까지 갈 것인가? 아니면 dispatch부터 시작해서 state로 검증할 것인가?

**🤖 AI**: `createTestOsKernel`을 분석한 결과, 이미 두 접근법이 공존. 접근법 A(`pressKey→attrs`)는 Phase 1→5 전체 파이프라인, 접근법 B(`dispatch→state`)는 Phase 3→4 오케스트레이션만. `tree.apg.test.ts`가 접근법 A의 선례. 핵심 발견: 이 둘은 **다른 질문에 답하는 도구**다.

- 접근법 A: "사용자 행동 → APG 스펙 준수" 증명
- 접근법 B: "커맨드 간 상호작용이 올바른가" 증명

Either/or가 아니라 **2-Tier 구조**가 답.

---

**🧑 사용자**: 맞아. `/solve` 해봐.

**🤖 AI**: `/solve` Step 1 분해 → 전체 조각이 Complicated로 내려감 → 실행 프로토콜로 전수 분류 완료.

**한 줄 요약**: Either/or의 함정에서 벗어나, APG Contract(pressKey→attrs)과 Orchestration Integration(dispatch→state)의 2-Tier 구조로 테스트 트로피를 설계했다.

---

## Conclusion

### Why
테스트 피라미드(Unit 과다)는 이 OS의 핵심 복잡성인 **커맨드 간 오케스트레이션**을 검증하지 못한다. `Delete → Focus Draft` 버그가 증거.

### Intent
Testing Trophy 전략으로 전환하여, Integration 레이어를 가장 두껍게 만든다.

### Warrants

| # | Warrant | 증거 |
|---|---------|------|
| W1 | 유닛으로는 오케스트레이션 이슈를 못 잡는다 | Delete→Focus Draft 버그 |
| W2 | Integration이 가장 높은 Confidence per Dollar | Testing Trophy (Kent C. Dodds) |
| W3 | 핵심 복잡성은 커맨드 간 상호작용 | OS 아키텍처 (5-Phase Pipeline) |
| W4 | KernelTestKit 인프라 이미 존재 | createTestOsKernel.ts |
| W5 | Phase 1 (Listener)은 순수 함수, 이미 유닛으로 커버됨 | resolveKeyboard.test.ts |
| W6 | Phase 5 (DOM 투사)는 순수 계산, 독립 검증 가능 | attrs() 함수 |
| W7 | pressKey→attrs 풀 파이프라인은 APG 준수 증명에 맞음 | tree.apg.test.ts 선례 |

### 2-Tier 전략

```
E2E (Playwright) ─── 가드레일. 실제 브라우저. 크리티컬 패스만. 현행 유지.

Tier 1: APG Contract (pressKey/click → attrs)
  질문: "사용자 행동이 APG 스펙을 준수하는가?"
  Input: t.pressKey("ArrowDown"), t.click("b", {shift: true})
  Assert: t.attrs("b").tabIndex === 0, aria-selected === true
  범위: Phase 1→2→3→4→5

Tier 2: Orchestration Integration (dispatch → state)
  질문: "커맨드 간 상호작용이 올바른가?"
  Input: t.dispatch(t.OS_NAVIGATE({direction: "down"}))
  Assert: t.focusedItemId() === "b", t.selection()
  범위: Phase 3→4

Unit ─── 순수 알고리즘/함수에만. focusFinder, strategies, resolveTab 등.
```

### Unit 전수 분류

**🟢 Keep as Unit (20개)**: 순수 함수/알고리즘
- focusFinder, strategies, tab(resolveTab), escape, expand, cornerNav
- resolveKeyboard, resolveMouse, resolveClipboard
- keybindings, command-when, app-keybindings, mac-fallback
- roleHelpers, rolePresets, treeUtils, tree-ops
- fuzzyMatch, inferSignal, FieldRegistry

**🟡 Promote to Integration (19개)**: 커맨드 dispatch 기반
- selection → selection-orchestration.test.ts로 통합
- sync-focus → focus.test.ts(기존)에 흡수
- recover, stack, overlay, clipboard-commands, multi-select-commands
- delete(37L), activate(30L), check(37L) → APG/Integration에 흡수 후 제거
- move, undo-redo, field, virtualFocus, zone-cursor, typeahead
- history, transaction

**🔵 Keep as-is (15개)**: 앱 레벨 로직
- builder (7), todo (1), command-palette (2), docs-viewer (1), collection (4)

### 목표 수치

| 레이어 | Before | After | 변화 |
|--------|:------:|:-----:|:----:|
| Unit | 54 (59%) | ~35 (38%) | ↓19 |
| APG Contract (Tier 1) | 8 (9%) | 8 (9%) | 품질↑ pressKey→attrs |
| Integration (Tier 2) | 8 (9%) | ~22 (24%) | ↑14 |
| E2E | 22 (24%) | 22 (24%) | 유지 |

**한 줄 요약**: 유닛 테스트를 줄이고, APG Contract(사용자 행동→ARIA 명세)과 Orchestration Integration(커맨드→상태)의 2-Tier 구조로 테스트 트로피를 달성한다.
