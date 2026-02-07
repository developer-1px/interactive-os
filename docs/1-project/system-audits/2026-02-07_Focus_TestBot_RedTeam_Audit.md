# Red Team Audit: Focus Showcase TestBot 테스트 검증 강도 분석

## 1. 개요 (Overview)

Focus Showcase 페이지의 TestBot 테스트 12개가 실제로 검증하고자 하는 의도 대비 얼마나 약한지를 분석한 레드팀 감수 보고서.

**핵심 발견**: 12개 테스트 중 **대부분이 의도한 기능의 10~30%만 검증**하고 있으며, UI 컴포넌트에 존재하는 기능의 상당수가 TestBot에 미반영됨. AriaFacadeTest와 AriaInteractionTest는 **TestBot 테스트 자체가 없음**.

---

## 2. 테스트별 감수 (Test-by-Test Audit)

### 🔴 Critical: 테스트가 아예 없는 컴포넌트

| 컴포넌트 | UI에서 검증하는 것 | TestBot 커버리지 |
|---|---|---|
| `AriaFacadeTest` | role 전파, aria-selected/controls/checked, aria-orientation | **없음** |
| `AriaInteractionTest` | Trigger onPress, Selection aria-selected, Field data-focused | **없음** |

---

### 🟠 High: 핵심 동작을 검증하지 않는 테스트

#### Test 9: Dismiss: Escape
```
현재: click → expect focused
의도: click → select → press Escape → assert deselected
```
- **위험**: Escape 키를 **아예 누르지 않음**. `dismiss.escape: "deselect"` 모드의 실제 동작 검증 0%
- **누락**: `escape: 'close'` 모드 검증. `outsideClick: 'close'` 검증
- **UI에 있지만 미검증**: 3가지 dismiss 모드 중 0개 실제 검증

#### Test 8: Activate: Automatic
```
현재: click → expect focused
의도: click → verify activation callback fired
```
- **위험**: `activate.mode: 'automatic'`의 핵심은 **포커스 즉시 활성화**인데, 활성화 콜백을 검증하지 않음
- **누락**: `activate.mode: 'manual'` (Enter/DblClick 필요) 검증. 두 모드의 **차이** 검증

#### Test 12: Focus Stack: Restore
```
현재: click #fs-base-2 → expect focused
의도: click → open modal → focus modal item → close modal → verify restored
```
- **위험**: 모달 열기/닫기를 전혀 수행하지 않음. 단순 클릭만 있어 **FocusStack API를 전혀 검증하지 않음**
- **누락**: `pushFocusStack` → `popAndRestoreFocus` 체인. 중첩 모달 복원. Scroll Sync

---

### 🟡 Medium: 부분적으로만 검증하는 테스트

#### Test 4: Select: Range Selection
```
현재: click #sel-range-0 → expect aria-selected
의도: click → Shift+Click → verify range, Ctrl+Click → verify toggle
```
- **누락**: Shift+Click 범위 선택 (핵심 기능). Ctrl+Click 토글 선택
- TestBot API에 modifier key 지원이 필요할 수 있음

#### Test 5: Select: Toggle Mode
```
현재: click → expect aria-selected
의도: click → selected, click again → deselected (toggle behavior)
```
- **누락**: 토글 해제 검증. 단일 선택이 다른 항목 선택 해제하는지 검증

#### Test 6: Select: Follow Focus
```
현재: click A → check, click B → check
의도: click A → ArrowDown → B auto-selected (keyboard follow)
```
- **위험**: followFocus의 핵심은 **키보드 이동 시 자동 선택**인데, 클릭만 테스트. 클릭 선택은 일반 selection이지 followFocus 아님
- Radio 역할의 `aria-checked` 사용은 올바름

#### Test 7: Tab: Trap Mode
```
현재: click → expect focused → Tab → expect next focused
의도: click last → Tab → wraps to first (trap). Shift+Tab → wraps to last
```
- **누락**: `tab.behavior: 'escape'` 모드 (Tab이 zone 밖으로). `tab.behavior: 'flow'` 모드. Trap의 순환 동작 (마지막→첫번째). Shift+Tab 역방향

#### Test 10: Autofocus: Entry Focus
```
현재: click two items → verify aria-current
의도: entry:'first'→첫번째 자동선택, entry:'last'→마지막, entry:'restore'→복원
```
- **누락**: `entry: 'restore'` 복원 검증 (포커스 이동 후 재진입), `entry: 'last'` 검증. `project.autoFocus` 마운트 시 자동 포커스

---

### 🟢 Low: 비교적 적절하지만 보강 필요

#### Tests 1-3: Navigate 시리즈
- Vertical Loop, Horizontal Clamped, 2D Grid 모두 **핵심 동작은 검증함**
- **보강 필요**:
  - Vertical: 아래로 끝까지 이동 후 Loop 확인 (역방향만 테스트됨)
  - Grid: 경계에서의 clamped 동작
  - Navigate 후 `document.activeElement`가 실제로 해당 요소인지 이중 확인

#### Test 11: Expand: Tree Toggle
- 확장/축소의 핵심 동작을 검증함 ✓
- **보강 필요**:
  - 확장 후 **자식 노드가 DOM에 나타나는지** 검증
  - 리프 노드에서 ArrowRight는 무시되는지
  - Enter/Space 토글 검증

---

## 3. 구조적 문제

### TestBot API 한계
- **modifier key 미지원**: `t.click(selector, { shift: true })` 같은 API가 없어 Shift/Ctrl 클릭 불가
- **TestBot `press()` 후 상태 대기**: `press()` → `expect()` 사이에 React 리렌더 대기 시간이 부족할 수 있음
- **모달/다이얼로그 제어 불가**: TestBot은 외부 상태(React state)를 직접 조작할 수 없어 FocusStack 테스트가 어려움

### 레거시 테스트와의 이원화
- 각 `*Test.tsx` 컴포넌트에 **자체 `runTest()` 함수**가 존재 (구 testUtils 기반)
- `FocusShowcaseBot.tsx`의 TestBot 테스트는 **이를 대체하려 했지만 불완전**
- 결과적으로 구 테스트의 검증 범위가 TestBot에 옮겨지지 않음

---

## 4. 제안 (Proposal)

### 즉시 조치 (P0)
1. **Dismiss 테스트**: `t.press("Escape")` 추가하여 실제 Escape 동작 검증
2. **Expand 테스트**: 자식 노드 존재 여부 검증 추가
3. **Select Follow Focus**: 키보드 이동 후 자동 선택 검증으로 변경

### 단기 조치 (P1)
4. AriaFacadeTest, AriaInteractionTest에 대한 TestBot 테스트 추가
5. FocusStack 테스트: 모달 열기→닫기→복원 체인을 TestBot에서 검증할 방법 설계
6. TestBot에 modifier key 지원 (`t.click(sel, { shift: true })`) 추가

### 중기 조치 (P2)
7. Tab 3가지 모드(escape/trap/flow) 각각 테스트
8. Autofocus entry 3가지 전략(first/last/restore) 각각 테스트
9. Activate 2가지 모드(automatic/manual) 콜백 검증

---

*감수 기준: 각 TestBot 테스트가 대응하는 UI 컴포넌트의 모든 의도된 기능과 ARIA 스펙을 검증하는지 평가*
