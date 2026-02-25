# T2 갭 분석: 결정 테이블 23행 vs 기존 테스트 31 it()

## 방법

결정 테이블의 각 행(T1~T23)을 기존 `todo-bdd.test.ts`의 it()과 1:1 매핑한 뒤, 양쪽에만 있는 항목을 식별한다.

---

## 결정 테이블 행 → 테스트 매핑

| 표 행 | Intent | When | 매핑된 it() | 상태 |
|-------|--------|------|-----------|------|
| T1 | check | Space | `§1.3 Space — completed 토글` | ✅ |
| T2 | action | Enter | `§1.3 Enter — 인라인 편집 시작` | ✅ |
| T3 | delete (no sel) | Backspace | `§1.3 Backspace — onDelete → pendingDeleteIds` | ✅ |
| T4 | delete (with sel) | Backspace | `§1.3 다중 선택 후 Backspace — 배치` | ✅ |
| T5 | delete (no sel) | Delete | `§1.3 Delete — onDelete (Backspace와 동일)` | ✅ |
| T6 | dismiss | Escape | `§1.2 Escape — 선택 해제` | 🔴 FAIL |
| T7 | navigate (mid) | ArrowDown | `§1.1 ArrowDown — 다음 항목으로` | ✅ |
| T8 | navigate (boundary) | ArrowDown | `§1.1 ArrowDown at bottom — 경계에서 멈춤` | ✅ |
| T9 | navigate (mid) | ArrowUp | `§1.1 ArrowUp — 이전 항목으로` | ✅ |
| T10 | navigate (boundary) | ArrowUp | `§1.1 ArrowUp at top — 경계에서 멈춤` | ✅ |
| T11 | range_select | Shift+ArrowDown | `§1.2 Shift+ArrowDown — 선택 확장` | ✅ |
| T12 | range_select (extending) | Shift+ArrowDown | `§1.2 Shift+ArrowDown 연속 — 범위 확장` | ✅ |
| T13 | range_select (contracting) | Shift+ArrowUp | `§1.2 Shift+ArrowUp — 선택 축소` | ✅ |
| T14 | move | Meta+ArrowUp | `§1.3 Cmd+ArrowUp — 순서 위로` | ✅ |
| T15 | move | Meta+ArrowDown | `§1.3 Cmd+ArrowDown — 순서 아래로` | ✅ |
| T16 | copy | Meta+C | `§1.4 Cmd+C — 복사` | ✅ |
| T17 | cut | Meta+X | `§1.4 Cmd+X — 잘라내기` | ✅ |
| T18 | paste | Meta+V | `§1.4 Cmd+C → Cmd+V — 복사 후 붙여넣기` | ✅ |
| T19 | duplicate | Meta+D | `§1.4 Cmd+D — 복제` | ✅ |
| T20 | select_all | Meta+A | `§1.2 Cmd+A — 전체 선택` | ✅ |
| T21 | click | Click | `§1.5 항목 클릭 → 포커스 + 선택` | ✅ |
| T22 | range_click | Shift+Click | `§1.5 Shift+클릭 → 범위 선택` | ✅ |
| T23 | toggle_click | Meta+Click | `§1.5 Meta+클릭 → 추가 선택` | ✅ |

**23/23행 매핑 완료.** 결정 테이블의 모든 행에 대응하는 테스트 존재.

---

## 테스트에만 있고 결정 테이블에 없는 it() (8건)

| it() | 분류 | 결정 테이블에 없는 이유 |
|------|------|---------------------|
| `§1.1 Home — 첫 번째 항목으로` | **navigate(Home)** | 표에서 Home 입력 미열거 |
| `§1.1 End — 마지막 항목으로` | **navigate(End)** | 표에서 End 입력 미열거 |
| `§1.3 Delete Cancel — 삭제 취소 시 선택 유지` | **연쇄(sequence)** | 단일 입력-결과가 아닌 multi-step |
| `§1.3 Undo — 다중 삭제 후 복원` | **연쇄(sequence)** | multi-step (delete→confirm→undo) |
| `§1.3 F2 — 편집 시작 (OS 표준)` | **navigate(F2)** | 표에서 F2 입력 미열거 |
| `§ARIA 포커스된 Item: tabIndex=0, data-focused=true` | **속성 검증** | intent-action이 아닌 속성 스냅샷 |
| `§ARIA 선택된 Item: aria-selected=true` | **속성 검증** | intent-action이 아닌 속성 스냅샷 |
| `§ARIA 완료된 Item: completed state` | **속성 검증** | T1(Space→toggle)의 중복 관점 |

---

## 갭 분류

### 1. 결정 테이블 누락 — 입력 미열거 (3건)

| 빠진 When | Intent | 추가해야 할 행 |
|----------|--------|------------|
| **Home** | navigate | `T24: focused=last → Home → focusedItemId=first` |
| **End** | navigate | `T25: focused=first → End → focusedItemId=last` |
| **F2** | action | `T26: focused=A → F2 → editingId=A` (Enter 대칭) |

**원인**: Step 1-A에서 입력 열거 시 Home/End/F2를 빠뜨림. 템플릿의 입력 목록에는 있음 → LLM이 열거를 게을리 했을 때 발생하는 전형적 누락.

### 2. 표의 범위 밖 — 연쇄 시나리오 (2건)

| 시나리오 | 단계 수 |
|---------|--------|
| Delete Cancel → 선택 유지 | 3단계 (select → delete → cancel) |
| Delete Confirm → Undo → 복원 | 4단계 (select → delete → confirm → undo) |

**이건 8열 표로 표현 불가** — Unresolved U1과 직결. 별도 시퀀스 테이블 필요.

### 3. 표의 범위 밖 — 속성 검증 (3건)

ARIA 속성 검증은 "입력 → 결과"가 아닌 "상태 → 속성" 검증. 결정 테이블의 Then 열에 포함시킬 수 있지만, 별도 it()로 존재하는 것이 더 명확.

---

## 결론

| 분류 | 건수 | 조치 |
|------|------|------|
| **표↔테스트 1:1 매핑** | 23/23 | ✅ 완전 |
| **표에서 빠진 입력** | 3건 (Home, End, F2) | T24~T26 추가 필요 |
| **연쇄 시나리오** | 2건 | U1 해결 후 별도 표 |
| **속성 검증** | 3건 | 표 밖, 별도 유지 |
| **현재 FAIL** | 1건 (T6: Escape → focus 유지) | OS 버그 또는 스펙 불일치 |

**핵심 발견**: 결정 테이블에서 Home/End/F2를 빠뜨렸다. 이건 Step 1-A(입력 열거)에서 LLM이 게을리 했기 때문이며, 템플릿의 입력 체크리스트가 이를 방지할 수 있다.
