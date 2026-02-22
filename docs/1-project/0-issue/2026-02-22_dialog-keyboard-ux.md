# 🐛 Issue: Todo 삭제 다이얼로그 키보드 UX

> Date: 2026-02-22
> Priority: P1 (기능불가)
> Status: [Open — 설계 완료, 구현 대기]

## 증상

- 삭제 확인 다이얼로그에서 Enter로 확인 실행 안 됨
- 다이얼로그 내 Tab으로 버튼 간 포커스 이동 안 됨
- keyboard-only 사용자에게 마우스 강제

## 기대 동작 (APG modal dialog 스펙)

1. Dialog 열림 → 첫 번째 focusable element에 focus
2. Tab → dialog 내 tabbable elements 사이 순환 (trap)
3. Enter → focused button 활성화 (각 버튼의 고유 action)
4. Escape → dialog 닫기

## 근본 원인

OS의 `onAction` 시스템이 **Zone 레벨에서 하나의 callback**만 지원.
Dialog buttons는 각각 **서로 다른 command**(confirm vs cancel)를 가짐.
→ Zone 레벨의 단일 onAction으로 해결 불가.

## 설계: item-level actionCommand

### 현재 파이프라인 (Enter)

```
User presses Enter
→ KeyboardListener → resolveKeyboard
→ Keybindings.resolve("Enter") → OS_ACTIVATE command
→ OS_ACTIVATE handler → zone의 onAction(cursor) 호출
→ onAction이 command 반환 → dispatch
```

### 변경된 파이프라인

```
FocusItem mount
→ FocusGroup이 itemRegistry에 { id, actionCommand } 등록

User presses Enter
→ OS_ACTIVATE
→ handler: focusedItem의 actionCommand가 있는가?
  → Yes: 해당 command dispatch (zone onAction보다 우선)
  → No: 기존대로 zone onAction 호출
```

### 수정 파일

| # | 파일 | 변경 |
|---|------|------|
| 1 | `FocusItem.tsx` | `actionCommand?: BaseCommand` prop 추가 |
| 2 | `FocusGroup.tsx` | item 등록 시 actionCommand를 zoneRegistry에 전달 |
| 3 | `zoneRegistry.ts` | item별 actionCommand 저장/lookup 함수 추가 |
| 4 | OS_ACTIVATE handler | focused item의 actionCommand 우선 dispatch |
| 5 | `Trigger.tsx` (TriggerDismiss) | `onPress`를 FocusItem의 `actionCommand`로 전달 |

### 엔트로피 체크 (Project #1)

- 새 유일 패턴? → **No**. FocusItem에 prop 1개, registry에 lookup 1개. 기존 command dispatch 패턴 재사용.
- 기존 메커니즘 확장? → **Yes**. onAction의 "zone 레벨 → item 레벨" 확장.
- `eslint-disable`, `as any`, `document.querySelector`? → **None**.

### 설계 냄새 4질문

1. 개체 증가? → FocusItem prop 1개. 최소.
2. 내부 노출? → No. 기존 FocusItem API 확장.
3. 동일 이슈 타 경로? → toolbar button, menu item 등도 이 패턴 사용 가능.
4. API 확장? → 앱에서 dialog 외에도 item별 다른 action이 필요한 곳에 범용.

### 테스트 시나리오

```
1. Dialog 열림 → Confirm 버튼에 autoFocus  ✓ (이미 DIALOG_ZONE_OPTIONS)
2. Enter → confirmDeleteTodo dispatch
3. Tab → Cancel 버튼으로 포커스 이동
4. Enter → cancelDeleteTodo dispatch (dialog 닫힘)
5. Escape → dialog 닫힘 ✓ (이미 onDismiss)
6. 기존 listbox onAction 동작 변경 없음 (회귀 테스트)
```

### 의문점

- `actionCommand`가 변경될 때 re-register가 필요한가? → `useEffect` deps에 포함
- zone onAction과 item actionCommand가 둘 다 있으면? → **item 우선, zone fallback**
- Tab 순환은 이미 `tab: { behavior: "trap" }`으로 동작하는가? → 확인 필요

### 오답 이력

- ~~오답 #1: DOM `.click()` 호출~~ → ZIFT 위반, 되돌림
- ~~오답 #2: 브라우저 native behavior에 위임~~ → OS 존재 이유 부정, 폐기
- 상세: `.agent/precedents/2026-02-22_dialog-keyboard-ux.md`
