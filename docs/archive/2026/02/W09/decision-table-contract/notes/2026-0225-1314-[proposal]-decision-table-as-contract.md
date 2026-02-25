# 결정 테이블 = 계약 — 표 ≈ 코드 ≈ 테스트의 동형 구조

| 항목 | 내용 |
|------|------|
| **원문** | todo를 바탕으로 bdd 표 만들어 검증해보기 → LLM이 테스트를 더 잘하고 실수하지 않도록 파이프라인대로 표를 만들어서 MECE하게 만들 수 있는 구조 → 표랑 코드랑 테스트 코드랑 비슷하게, 혹은 거의 같게 만드는 것 → 그러면 강력한 interface 혹은 계약방식을 만들 수 있다 → LLM이 코드를 먼저 작성하면 습관이 있어서 자기 마음대로 짠다. 특히 테스트. 표로 강제하고, 표에서 테스트+스키마를 강제하고, 구현은 자유롭게 |
| **내(AI)가 추정한 의도** | LLM의 습관적 일탈을 구조적으로 차단하기 위해, 결정 테이블을 Single Source of Truth로 두고 표→테스트→앱 스키마를 기계적으로 derive하는 계약 체계를 만들고 싶다 |
| **날짜** | 2026-02-25 |
| **상태** | 🔴 Proposal |

---

## 1. 개요 — 문제와 해법

### 문제: LLM의 습관적 일탈

```
❌ 코드 먼저 → LLM이 자기 습관대로 구현 → 테스트가 구현을 추인(追認)
```

LLM에게 "테스트를 먼저 써"라고 해도, **"내가 짤 코드가 통과하기 쉬운 테스트"**를 만든다. 테스트가 스펙이 아니라 구현의 하청이 된다.

### 해법: 표가 선행하면 여지가 없다

```
✅ 표 먼저 → 표가 LLM을 강제 → 테스트+스키마가 표를 강제 → 구현은 자유
```

**표(Decision Table)가 Single Source of Truth**. 표의 행 수가 테스트 `it()` 수와 앱 바인딩 수를 1:1로 결정한다. LLM은 구현 내부만 자유롭게 하되, **행동의 완전성(MECE)**은 구조적으로 보장된다.

### 핵심 원리

> **표 ≈ 코드 ≈ 테스트가 동형(Isomorphic)이면, 표의 행이 곧 계약이 된다.**

이건 프로그래밍의 `interface`/`protocol` 패턴과 같다:
- 타입시스템에서 `interface`가 "구현은 알아서, **형태**만 맞춰"인 것처럼
- 결정 테이블이 "구현은 알아서, **행동**만 맞춰"가 되는 것

---

## 2. 구조: 3단계 파이프라인

```
① 표 (Decision Table)  ← SSoT. LLM의 자유도를 차단.
   "이 행들이 전부다. 더 없고 덜 없다."
   
      ↓ 기계적 변환 (행 1개 = it() 1개)

② 테스트 코드 (.test.ts) + 앱 스키마 (bind() 선언)
   표의 행이 곧 테스트. 행이 6개면 it()도 6개.
   표의 Intent 열 = bind()의 콜백. 분기가 2행이면 바인딩도 2행.

      ↓ 자유 구현

③ 구현 코드 (커맨드 핸들러 내부)
   여기서만 LLM이 자유. but 테스트가 가드레일.
```

**Rules #13과 직결**: "산출물(Noun)로 증명한다" — 표가 없으면 코드를 쓸 자격이 없다.

---

## 3. Todo 앱 실증 — 동형 구조의 세 가지 모습

### ① 표 — List Zone App 레벨 결정 테이블

| # | Intent | App 조건 | → 커맨드 | Expected State Change |
|---|--------|---------|---------|----------------------|
| 1 | check | — | `toggleTodo` | `todo.completed` 반전 |
| 2 | action | — | `startEdit` | `ui.editingId = focusId` |
| 3 | delete | `selection = []` | `requestDelete([focusId])` | `pendingDeleteIds = [focusId]` |
| 4 | delete | `selection.length > 0` | `requestDelete(selection)` | `pendingDeleteIds = selection` |
| 5 | undo | — | `undoCommand` | 이전 상태 복원 |
| 6 | redo | — | `redoCommand` | 복원 취소 |

### ② 테스트 — 표에서 기계적 변환 (행 1개 = it() 1개)

```typescript
// 행 1 → it() 1
it("#1 check → toggleTodo → completed 반전", () => {
  gotoList(a);
  page.keyboard.press("Space");
  expect(page.state.data.todos[a].completed).toBe(true);
});

// 행 3 → it() 3
it("#3 delete(no selection) → requestDelete([focusId])", () => {
  gotoList(a);
  page.keyboard.press("Backspace");
  expect(page.state.ui.pendingDeleteIds).toEqual([a]);
});

// 행 4 → it() 4
it("#4 delete(with selection) → requestDelete(selection)", () => {
  gotoList(a);
  page.keyboard.press("Shift+ArrowDown");
  page.keyboard.press("Backspace");
  expect(page.state.ui.pendingDeleteIds).toContain(a);
  expect(page.state.ui.pendingDeleteIds).toContain(b);
});
```

### ② 앱 스키마 — 표에서 기계적 변환

```typescript
// 현재: 행 3,4가 콜백 안 분기로 숨어있음
onDelete: (cursor) => requestDeleteTodo({
  ids: cursor.selection.length > 0 ? cursor.selection : [cursor.focusId]
})

// 이상적: 행 수 = 바인딩 수 (when-router 확장 후)
onDelete: requestDeleteFocused,   when: noSelection,
onDelete: requestDeleteSelected,  when: hasSelection,
```

**셋 다 6행. 표가 6행이면 테스트도 6개, 바인딩도 6개.**

---

## 4. 앱 레벨 결정 테이블의 열(Column) 구조

빌더(41분기)와 달리, 일반적인 앱에서는 **4열이면 충분**하다:

| 열 | 설명 | 누가 결정하는가 |
|----|------|---------------|
| **Intent** | 의도 (check, action, delete, undo...) | OS가 물리적 입력에서 번역 |
| **App 조건** | 같은 의도가 다른 결과를 내는 조건 | App이 결정 |
| **→ 커맨드** | 실행할 커맨드 | App이 정의 |
| **Expected State Change** | 기대 상태 변화 | 테스트가 검증 |

### OS 레벨 vs 앱 레벨

- **OS 레벨 (1차 분기)**: 물리적 입력 × OS 조건(isEditing, isFieldActive) → Intent
  - `/red` Step 1-2가 이것을 담당. OS가 관리.
- **앱 레벨 (2차 분기)**: Intent × App 조건 → 커맨드
  - 이 표가 담당. 앱이 관리.

일반적인 앱(Todo)은 **앱 레벨 표만으로 충분**하다. 빌더처럼 복잡한 앱만 OS 레벨까지 필요.

---

## 5. LLM에게 주는 지시의 변화

```
Before: "Todo 리스트의 키보드 인터랙션을 구현해줘"
         → LLM: (자기 습관대로 20개 짜거나 3개만 짬)

After:  "이 표의 6행을 구현해줘. 행 수 바꾸지 마."
         → LLM: (6개 정확히. 더도 덜도 아님)
```

---

## 6. 기존 구조와의 관계

| 기존 | 역할 | 이 제안과의 관계 |
|------|------|----------------|
| `/red` 결정 테이블 | OS+App 전체 파이프라인 | 이 제안의 App 부분만 추출한 간소 버전 |
| `keyboard-and-mouse.md` BDD 스펙 | Gherkin 시나리오 목록 | 표의 행을 풀어쓴 것. 표가 더 밀도 높음 |
| `bind()` 선언 | 앱의 Intent→커맨드 매핑 | 표의 구현체. 행 수가 일치해야 함 |
| `todo-bdd.test.ts` | 통합 테스트 | 표에서 derive된 검증. 행 수가 일치해야 함 |
| `when-router` 제안 | bind() API 확장 | 콜백 안 분기를 표면으로 끌어내 행 수 일치를 가능하게 함 |

---

## 7. Cynefin 도메인 판정

🟡 **Complicated** — 방향은 확정(표→테스트→스키마→구현). 남은 것은 표 포맷 표준화와 `/red` 워크플로우 통합. 분석하면 답이 좁혀진다.

## 8. 인식 한계

- **when-router 미구현**: 이상적 모습(바인딩 행 수 = 표 행 수)은 when-router 확장이 완료되어야 달성됨. 현재는 콜백 안 분기가 존재.
- **마우스 인터랙션**: 이 제안은 키보드 인터랙션 중심. 마우스 클릭(onClick)의 결정 테이블 적용은 추가 설계 필요.
- **Zone 간 상호작용**: 한 Zone 안의 Intent→커맨드 매핑만 다룸. Zone 간 포커스 전환은 OS 레벨.

## 9. 열린 질문

1. **표 포맷 표준화**: 앱 레벨 4열(`Intent | App 조건 | → 커맨드 | Expected State Change`)이면 충분한가? 아니면 Zone 열도 필요한가?
2. **`/red` 워크플로우 통합**: 현재 `/red`는 OS+App 전체 결정 테이블. 앱 레벨 전용 간소 Step을 추가할 것인가, 별도 워크플로우를 만들 것인가?
3. **자동 생성 가능성**: 표 → 테스트 코드를 기계적으로 생성하는 스크립트가 가능한가? 아니면 "/red Step 2에서 LLM이 이 표를 보고 변환" 수준이면 충분한가?

---

> **한줄요약**: 결정 테이블(표)을 SSoT로 두고, 표의 행 수 = 테스트 it() 수 = 앱 바인딩 수로 동형(Isomorphic) 강제하면, LLM의 습관적 일탈을 구조적으로 차단하면서도 구현의 자유는 보장하는 계약 구조가 된다.
