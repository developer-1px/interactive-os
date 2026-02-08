# 레드팀 감사 보고서: 포커스 파이프라인 v1.3

이 보고서는 `Focus Pipeline Invariants v1.3` 명세에 대한 공격적 기술 감사를 수행하여, 실제 복잡한 애플리케이션 환경에서 발생할 수 있는 아키텍처 취약점과 결함을 지적합니다.

---

## 1. 아키텍처 취약점 (Architectural Vulnerabilities)

### 🚨 [CRITICAL] Source of Truth Conflict (상태 동기화 충돌)
**현상**: `FocusGroupProps.state`에서 `value`를 제공할 때, 이는 React의 상위 상태(State)입니다. 하지만 OS 파이프라인은 내부적으로 `selectionStore`를 가지고 있습니다.
- **공격 시나리오**: 유저가 클릭하여 파이프라인이 내부 상태를 먼저 변경했으나, 상위 `onValueChange`에서 특정 조건으로 인해 상태 업데이트를 거절하거나(Validation failure) 지연시킬 경우(Async), **DOM에 그려진 선택 상태와 실제 앱의 상태가 불일치**하게 됩니다.
- **취약점**: 파이프라인이 "결정론적"이라고 가정하지만, 외부 React 상태와의 양방향 동기화(Lifting state up)가 개입하는 순간 비결정론적(Race condition)이 됩니다.

### 🚨 [CRITICAL] The "Black Hole" Strategy vs. "Flow" Mode
**현상**: 명세는 모든 요소를 `tabIndex="-1"`로 설정하여 브라우저의 Tab 개입을 차단합니다.
- **공격 시나리오**: `tabBehavior: 'flow'` 모드(브라우저 기본 흐름을 따름)는 브라우저가 다음 `tabIndex >= 0`인 요소를 찾아갈 것을 기대합니다. 하지만 모두가 `-1`이면 브라우저는 바로 주소창으로 튀어버립니다.
- **취약점**: OS 레이어가 브라우저의 Tab 순서(Sequential Focus Navigation)를 **"완벽하게 시뮬레이션(Virtual Sequencer)"**하지 않는 한, `flow` 모드는 작동 불가능한 기표일 뿐입니다.

### ⚠️ [HIGH] Jurisdictional Conflict (관할권 충돌)
**현한**: 중첩된 `FocusGroup` (예: Sidebar > Navigation > Item) 환경.
- **공격 시나리오**: 자식과 부모가 모두 `intercept.keyboard: true`일 때, 이벤트를 누가 먼저 가로채는가?
- **취약점**: 이벤트 전파(Capture/Bubble)에 대한 명확한 관할권 우선순위(Jurisdiction Priority)가 없습니다. 자식이 처리하고 `stopPropagation`을 안 하면 부모가 이중으로 파이프라인을 실행하여 포커스가 두 번 튀는 현상이 발생합니다.

---

## 2. 런타임 결함 (Runtime Defects)

### ⚠️ [HIGH] Stale Registry on Dynamic Deletion
**현상**: `RESOLVE` 단계는 `registry`를 참조하여 다음 타겟을 계산합니다.
- **공격 시나리오**: 유저가 아이템을 삭제(Delete 키)하는 순간 `NAVIGATE`가 동시에 발생하면, 파이프라인은 아직 소멸하지 않은(Unregister 전) DOM 요소를 타겟으로 잡습니다.
- **결과**: `document.activeElement`가 사라진(removed) 요소를 가리키게 되어, 포커스가 유실(Focus loss)되고 `body`로 전락합니다.

### ⚠️ [MEDIUM] Selection Follows Focus Feedback Loop
**현상**: `radiogroup`처럼 포커스가 가면 즉시 선택되는 모드.
- **공격 시나리오**: `setFocus` -> `onSelectionChange` -> `App Re-render` -> `FocusGroup Mount/Update` -> `autoFocus`.
- **결과**: 무한 포커스/선택 루프에 빠질 위험이 큽니다. 특히 `restoreFocus`와 결합될 때 치명적입니다.

### ⚠️ [MEDIUM] Typeahead vs. Trigger Collision
**현상**: `Space` 키가 `triggers.select`이면서 동시에 `typeahead` 입력일 때.
- **취약점**: 검색을 위해 스페이스를 쳤는데 아이템이 선택/활성화되는 충돌. 이에 대한 우선순위(Time-window 기반 필터링 등)가 명세에 누락되었습니다.

---

## 3. Red Team 권고 사항 (Remediations)

1.  **Strict One-Way Flow**: 내부 `selectionStore`를 제거하거나, 무조건 상위 `value`를 "Singular Source of Truth"로 강제하고 파이프라인은 "변경 요청(Proposal)"만 보내야 함.
2.  **Virtual Tab Sequencer**: `flow` 모드 지원을 위해 OS 수준에서 전체 DOM 트리를 순회하는 가상 탭 순서 계산기가 필요함.
3.  **Transactional Commit**: 아이템 삭제와 포커스 이동을 하나의 트랜잭션으로 묶는 `Atomic Registry` 작업 필요.
4.  **Jurisdiction ID**: 이벤트 객체에 `handledByZoneId`를 마킹하여 이중 실행 방지.

---
*Audit Performed by: Antigravity Red Team (2026-02-05)*
