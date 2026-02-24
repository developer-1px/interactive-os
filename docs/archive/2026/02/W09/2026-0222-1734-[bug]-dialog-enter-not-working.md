# Dialog Enter 키 미동작 — Inspector 로그 분석

| 항목 | 내용 |
|------|------|
| 원문 | 내가 실제 브라우저에서 삭제 tab 5번 엔터 1번 ESC를 누른 로그야. 안되고 있어. 무슨 차이가 있는지 분석해서 보고서를 작성해 |
| 내(AI)가 추정한 의도 | Zone 이중 생성 수정 후에도 브라우저에서 Dialog 키보드가 안 되는 이유를 정확히 파악하라 |
| 날짜 | 2026-02-22 17:34 |
| 상태 | 현황 보고 |

---

## 1. 개요

사용자가 브라우저에서 Todo 삭제 Dialog를 열고 Tab 5번 + Enter 1번 + ESC 1번을 누른 Inspector 로그를 제공.
**Tab은 동작하고, Enter는 동작하지 않는다.**

이전에 수행한 DialogZone 제거 수정은 **Tab을 성공적으로 복구**했으나, **Enter는 별도 원인으로 미동작**.

---

## 2. 분석

### 2.1 Tab: ✅ 정상 동작 (수정 효과 확인)

Inspector 로그에서 Tab이 `dismiss ↔ confirm` 사이를 trap 모드로 순환:

```
Tab: todo-delete-dialog-dismiss → todo-delete-dialog-confirm  ✅
Tab: todo-delete-dialog-confirm → todo-delete-dialog-dismiss  ✅
Tab: todo-delete-dialog-dismiss → todo-delete-dialog-confirm  ✅
Tab: todo-delete-dialog-confirm → todo-delete-dialog-dismiss  ✅
```

DialogZone 제거 수정이 올바르게 동작. 단일 Zone에 items가 등록되어 OS_TAB가 정상 순환.

### 2.2 Enter: ❌ OS_ACTIVATE → click effect → 무반응

```
Enter → OS_ACTIVATE → Effects: click
Enter → OS_ACTIVATE → Effects: click  (5번 반복, 모두 동일)
```

**OS_ACTIVATE의 실행 경로 (activate.ts line 16-51):**

```
1. zone.focusedItemId 있음 → "todo-delete-dialog-dismiss" ✅
2. disabled 체크 → 통과 ✅
3. expandable 체크 → 해당 없음 ✅
4. entry?.onAction → ❌ 없음 (dialog zone에 onAction 미등록)
5. Fallback → { click: zone.focusedItemId } ← 여기
```

**문제: `click` effect가 커널에 등록되어 있지 않다.**

`src/os/4-effects/index.ts`에 등록된 effect:
- `focus` ✅
- `scroll` ✅
- `clipboardWrite` ✅
- `click` ❌ **미등록**

OS_ACTIVATE가 `{ click: "todo-delete-dialog-dismiss" }`를 반환하면, 커널은 `click` effect handler를 찾지만 등록된 handler가 없으므로 **조용히 무시**된다.

### 2.3 부수 발견: FOCUS_GROUP_INIT 이중 호출

```
FOCUS_GROUP_INIT "todo-delete-dialog"  (1회)
FOCUS_GROUP_INIT "todo-delete-dialog"  (2회)
```

동일 ID로 FocusGroup이 2번 초기화된다. 
가능한 원인: React Strict Mode의 double mount, 또는 HMR에 의한 재마운트.
Dialog 동작에 직접 영향은 없으나 불필요한 작업.

### 2.4 OS_STACK_PUSH → POP → PUSH 시퀀스

```
OS_STACK_PUSH   → focusStack: [{zoneId: "list", itemId: "todo_1"}]
OS_STACK_POP    → focusStack: []
OS_STACK_PUSH   → focusStack: [{zoneId: "list", itemId: "todo_1"}]
```

`requestDeleteTodo`가 `OS_OVERLAY_CLOSE` → `OS_OVERLAY_OPEN`을 순서대로 dispatch하기 때문.
CLOSE 시 stack pop, OPEN 시 stack push → net 결과는 정상이지만 불필요한 왕복.

---

## 3. 결론 / 제안

### Tab: 수정 완료 ✅

DialogZone 제거(Zone 이중 생성 해소)가 Tab을 복구. 브라우저 로그로 확인.

### Enter: 별도 수정 필요

**두 가지 해결 방안:**

| # | 방안 | 설명 | 영향도 |
|---|------|------|--------|
| A | `click` effect를 `4-effects/index.ts`에 등록 | `os.defineEffect("click", (itemId) => findItemElement(zoneId, itemId)?.click())` | 모든 zone에 적용. 가장 범용적 |
| B | Dialog zone에 `onAction`을 설정하여 click fallback을 피함 | Trigger.Portal의 Zone에 onAction 콜백 추가 → 해당 FocusItem의 click() 호출 | Dialog 전용 |

**권장: 방안 A.** `click` effect는 OS_ACTIVATE의 설계 의도상 존재해야 하며, 등록하지 않은 것은 구현 누락으로 판단된다.

---

## 4. Cynefin 도메인 판정

🟢 **Clear** — `click` effect handler 등록 누락. 해법은 자명하다: `4-effects/index.ts`에 `click` effect를 추가.

---

## 5. 인식 한계

- Inspector 로그는 사용자가 제공한 1회 세션 기반. 다른 dialog(e.g., todo-clear-dialog)에서도 동일한 증상인지 미확인.
- `click` effect가 의도적으로 미등록된 것인지(설계 결정), 누락인지(버그) 확인 필요. OS_ACTIVATE 코드에 `click` 반환 경로가 명시적으로 있으므로 **누락으로 판단**.
- FOCUS_GROUP_INIT 이중 호출의 정확한 원인(Strict Mode vs HMR vs 실제 중복)은 미확인.

---

## 6. 열린 질문

1. `click` effect 등록 시 `el.click()` vs `el.dispatchEvent(new MouseEvent('click'))`? (브라우저 호환성)

---

**한줄요약:** Tab은 Zone 이중생성 수정으로 복구 확인, Enter는 `click` effect 미등록이라는 별도 원인 — `4-effects/index.ts`에 click handler 추가 필요.
