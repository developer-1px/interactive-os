# Blueprint: Dialog Keyboard (Tab/Enter) 미동작

## 1. Goal

**UDE (Undesirable Effects):**
- Todo 삭제 시 alertdialog가 열리지만, Tab으로 Cancel↔Delete 버튼 사이 이동 불가
- Enter로 포커스된 버튼을 활성화(activate)할 수 없음
- 결과적으로 Dialog 내 키보드 상호작용이 완전히 불가 — 마우스로만 조작 가능

**Done Criteria:**
> Dialog(alertdialog 포함) 내부에서 Tab이 FocusItem 간을 trap 모드로 순환하고, Enter가 포커스된 버튼의 onAction/click을 실행한다.

---

## 2. Why

**근본 원인: Zone 이중 생성 (Duplicate Zone)**

`DialogRoot`가 `Dialog.Content`를 `Trigger.Portal`로 변환할 때, Zone이 두 번 생성된다:

```
Trigger.Portal (line 319)
  → <Zone id="todo-delete-dialog" role="alertdialog">   ← 외부 Zone (Trigger.Portal 내부)
    → DialogZone (line 108)
      → <Zone role="alertdialog" options={autoFocus}>    ← 내부 Zone (Dialog 자체)
        → FocusItem(cancel-btn)
        → FocusItem(delete-btn)
```

**위반 원칙:**
- **Rules #1 (엔트로피 감소):** Dialog 경로와 Trigger.Portal 경로 두 곳에서 각자 Zone을 만드는 것은 고유 패턴 수 증가 = 엔트로피 증가.
- **Rules #5 (단일 문 통과):** Zone 등록이 두 경로를 통과한다. FocusItem은 내부 Zone에 등록되지만, OS_TAB/OS_ACTIVATE는 외부 Zone(activeZoneId)에서 동작하므로 items가 비어있다.
- **Rules 검증 #9 (표준은 행동 스펙):** APG Dialog Pattern은 Tab trap + Enter activate를 요구하나, 이중 Zone으로 인해 동작하지 않는다.

---

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|---|---|---|
| Dialog.tsx와 Trigger.Portal이 각각 Zone을 만들어야 한다 | ❌ **무효** | 한 곳에서만 Zone을 만들면 된다 |
| DialogZone은 autoFocus + onDismiss를 위해 별도 Zone이 필요하다 | ❌ **무효** | Trigger.Portal의 Zone에 options를 전달하면 충분 |
| CompoundTrigger 경로에서만 문제가 발생한다 | ⚠️ 부분 유효 | Dialog를 직접 쓰는 경우도 동일 경로 (DialogRoot → Trigger.Portal) |
| 내부 DialogZone을 제거하면 onDismiss가 깨진다 | ❌ **무효** | Trigger.Portal이 이미 `onDismiss={OS_OVERLAY_CLOSE}` 를 Zone에 설정 (line 322) |

**진짜 Goal:** `DialogRoot`가 `Trigger.Portal`로 변환할 때 중복 Zone을 만들지 않도록 단일 경로를 보장한다.

---

## 4. Ideal

**해결 후 바람직한 상태:**

1. **Tab trap 동작:** Dialog가 열리면 Tab은 Cancel → Delete → Cancel 순환 (trap 모드)
2. **Enter activate 동작:** 포커스된 버튼에서 Enter → onAction → click 또는 command dispatch
3. **Escape dismiss 유지:** ESC → OS_OVERLAY_CLOSE (기존 동작 보존)
4. **autoFocus 유지:** Dialog 열릴 때 첫 번째 FocusItem으로 자동 포커스
5. **단일 Zone:** Dialog당 Zone이 정확히 1개 — id, role, options, onDismiss가 한 곳에서 설정됨
6. **기존 테스트 통과:** dialog-focus-trap.test.ts 4개 + 전체 테스트 스위트 통과

**부정적 분기(NBR):**
- `Dialog`를 `Trigger.Portal` 없이 직접 사용하는 케이스가 있는가? → 없음. `DialogRoot`는 항상 `Trigger.Portal`로 변환.
- `DialogZone` 제거 시 다른 곳에서 import하는가? → `Dialog.tsx` 내부 전용, 외부 노출 없음.

---

## 5. Inputs

**파일:**
- `src/os/6-components/radox/Dialog.tsx` — DialogRoot, DialogZone, DialogContent
- `src/os/6-components/primitives/Trigger.tsx` — TriggerPortal (line 253-343)
- `src/os/defineApp.trigger.ts` — createCompoundTrigger
- `src/os/registries/roleRegistry.ts` — dialog/alertdialog 프리셋    
- `src/os/3-commands/tab/tab.ts` — OS_TAB (trap 로직)
- `src/os/3-commands/interaction/activate.ts` — OS_ACTIVATE (Enter 로직)

**테스트:**
- `src/apps/todo/tests/integration/dialog-focus-trap.test.ts` — 4개 기존 테스트

**KI:**
- Accessibility & ARIA Standards — dialog/alertdialog 초기화 물리학
- ZIFT Standard Specification — Zone 단일 경로 원칙

**APG 레퍼런스:**
- [Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

---

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|---|---|---|---|---|---|
| G1 | Dialog당 Zone 1개 | Zone 2개 (Trigger.Portal + DialogZone) | DialogRoot의 변환 로직에서 DialogZone을 제거하거나, Trigger.Portal의 Zone을 비활성화 | **High** | — |
| G2 | Trigger.Portal Zone에 autoFocus 옵션 전달 | Trigger.Portal Zone은 role만 받음, options 전달 경로 없음 | Trigger.Portal에 options prop 추가하거나, Dialog가 role preset에 의존 | **Med** | G1 |
| G3 | Tab trap이 dialog zone items를 순환 | activeZoneId의 items가 비어있어 Tab이 동작하지 않음 | G1 해결 시 자동 해소 (FocusItem이 올바른 Zone에 등록됨) | **High** | G1 |
| G4 | Enter가 focusedItemId의 버튼을 activate | focusedItemId가 null (autoFocus가 잘못된 Zone에서 동작) | G1 해결 시 자동 해소 | **High** | G1 |
| G5 | 기존 테스트 4개 + 전체 스위트 통과 | 현재도 통과 (headless에서는 Zone 구조가 다름) | 수정 후 regression 확인 필요 | **Med** | G1-G4 |

**핵심 관찰: G1만 해결하면 G3, G4는 자동 해소된다.**

---

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|---|---|---|---|---|
| T1 | DialogRoot 변환 로직에서 DialogZone 제거 | **Clear** | — | `DialogRoot`가 `Trigger.Portal`로 변환할 때, `<DialogZone>` 래퍼를 제거하고 children을 직접 전달. Trigger.Portal 내부의 Zone이 유일한 Zone이 됨. |
| T2 | DialogZone의 options(autoFocus)를 Trigger.Portal로 전달 | **Complicated** | T1 | 방법 A: roleRegistry의 dialog/alertdialog 프리셋에 이미 `autoFocus: true`가 있으므로 별도 전달 불필요. 방법 B: Trigger.Portal props에 options를 추가. → **방법 A 검증**: roleRegistry 확인 결과 `project: { autoFocus: true }` 이미 존재. ✅ 추가 작업 없음. |
| T3 | DialogZone 함수 제거 또는 비활성화 | **Clear** | T1 | dead code 정리. `DIALOG_ZONE_OPTIONS` 상수도 함께 제거. |
| T4 | dialog-focus-trap.test.ts 검증 | **Clear** | T1-T3 | 기존 4개 테스트 실행. headless에서 Zone 구조가 정상인지 확인. |
| T5 | 전체 테스트 스위트 실행 | **Clear** | T4 | `npx vitest run` — regression 없음 확인. |
| T6 | 브라우저 수동 검증 | **Clear** | T5 | Todo → Delete → Dialog → Tab/Enter 동작 확인. |

**실행 순서:** T1 → T2(검증만) → T3 → T4 → T5 → T6

**예상 변경 범위:** Dialog.tsx 1개 파일, ~20줄 이내 수정.
