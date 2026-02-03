# /inbox: Focus Navigation & Bubbling Failure Report

## 1. 개요 (Overview)
사용자가 "Focus Navigation 및 Bubble 등의 동작이 제대로 안 됨"을 보고하였습니다. 이전에 `/inbox`가 동작하지 않았던 문제는 해결되었으며, 본 문서는 원래 사용자가 요청한 **"네비게이션 및 입력 버블링 오동작"**에 대한 심층 조사 결과입니다.

## 2. 분석 (Analysis)

### 2.1 문제의 핵심 (Root Cause)
`Field` 컴포넌트에서 `ArrowUp/Down` 이벤트를 `stopPropagation` 하지 않고 상위로 올려보내도(Bubbling), 최상위 `InputEngine`에서 이를 **"Input 내부에서 발생한 이벤트"**라고 판단하여 강제로 차단하고 있습니다.

**현재 `InputEngine.tsx` 로직 (Line 82):**
```typescript
if (isInput && !b.allowInInput) return false;
```
- `isInput`: `document.activeElement`가 Input/Textarea/ContentEditable인지 확인 (True가 됨).
- `b.allowInInput`: 해당 단축키(ArrowDown 등)가 Input 내부 허용으로 설정되었는지 확인.
- **결과**: 네비게이션 단축키가 `allowInInput: true`로 설정되지 않았다면, `Field`가 이벤트를 올려보내도 `InputEngine`이 명령을 실행하지 않습니다.

### 2.2 논리적 모순
우리가 지향하는 **"Natural Focus"** 모델에서는:
1. Input 컴포넌트가 이벤트를 처리하고 싶으면 `stopPropagation()`을 호출합니다.
2. 처리하지 않고 상위로 보냈다는 것은 **"OS가 처리해도 좋다"**는 명시적 의사표시입니다.
3. 그러나 `InputEngine`은 이 의사를 무시하고, 정적인 설정(`allowInInput`)만 보고 실행을 거부합니다.

### 3. 현행 동작 vs 목표 동작

| Scenario | 현재 동작 (Bug) | 목표 동작 (Focus Bubble) |
| :--- | :--- | :--- |
| **Field (Single)**에서 `ArrowDown` | `Field`가 버블링함 -> `InputEngine` 수신 -> `isInput` 체크 -> **차단됨** (Caret만 이동) | `Field`가 버블링함 -> `InputEngine` 수신 -> `isInput` 무시 -> **NAVIGATE_DOWN 실행** |
| **Field (Multi)**에서 `ArrowDown` | `Field`가 `stopPropagation`함 -> `InputEngine` 수신 불가 -> 정상 (Caret 이동) | 위와 동일 (변경 없음) |

## 4. 제안 (Proposal)

### InputEngine의 `isInput` 가드 제거
`InputEngine`은 `window` 레벨의 리스너이므로, 이벤트가 여기까지 도달했다는 것 자체가 **"하위 요소들이 이벤트를 처리하지 않았음"**을 의미합니다. 따라서 별도의 `allowInInput` 체크 없이 명령을 실행해도 안전합니다.

**수정 계획:**
1. `src/os/core/input/InputEngine.tsx`에서 `isInput` 관련 차단 로직 삭제.
2. Keybinding 설정에서 불필요해진 `Meta+Arrow` 바인딩을 일반 `Arrow`로 변경.
3. `todoKeys.ts` 등 앱 레벨 키바인딩도 `allowInInput` 속성 제거 및 정리.

이 변경을 통해 `Field` (Single-line)에서의 자연스러운 포커스 이동이 가능해집니다.
