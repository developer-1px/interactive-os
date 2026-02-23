# caret-restore — 편집 종료 시 캐럿 위치 보관 및 복원

> **Type**: Light (기능)
> **Created**: 2026-02-23
> **Status**: Active

## Summary

Field 편집 종료 후 재편집 진입 시, 마지막 캐럿 위치를 복원한다.
FieldRegistry에 `caretPosition: number | null`을 추가하여 headless 검증 가능하게 만든다.

## Motivation

### 현재 문제

편집 종료 → 재편집 시 캐럿이 항상 처음(또는 끝)으로 이동한다.
사용자가 텍스트 중간을 편집하다 나갔다가 돌아오면 다시 위치를 찾아야 한다.

### 더 큰 문제

이 버그를 **headless로 재현/검증할 수 없었다.**
- `cursorRef`는 React 로컬 ref — 관찰 불가, 테스트 불가
- `getCaretPosition`/`setCaretPosition`은 DOM 직접 조작 — headless에서 동작 안 함
- 결과: 추측성 수정 → 삽질

### Discussion에서 도출된 Warrant

- W1. OS는 focus를 state로 모델링한다 (focusedItemId). caret에도 동일 패턴 적용 가능.
- W2. `wasActiveRef`, `cursorRef`는 로컬 ref — 관찰/테스트 불가.
- W3. Testability Principle — 테스트 불가 = 설계 결함.
- W4. `getCaretPosition`/`setCaretPosition`이 이미 number ↔ DOM Selection 변환 수행. 직렬화 인프라는 존재.
- W5. FieldRegistry가 이미 per-field state(value, error) 관리. caretPosition 추가는 자연스러운 확장.
- W6. FieldRegistry는 순수 JS 스토어 — DOM 무관, vitest 완전 검증 가능.
- W7. focusedItemId와 동일 패턴: "State 계약 테스트 + DOM effect trust".
- W8. 커맨드 = 의도, 관찰 ≠ 의도. 캐럿 이동은 editing의 부산물. 고빈도 → 커맨드 부적합.
- W9. InputListener가 이미 "관찰 → state 보관" 패턴 사용 (updateValue). 선례 존재.

## Guide-level explanation

### Before

```
caret 위치: cursorRef (React ref, 로컬, 업데이트 안 됨)
          → 재편집 시 항상 null → 기본 위치
          → headless 검증 불가
```

### After

```
caret 위치: FieldRegistry.state.caretPosition (number | null)
          → 편집 종료 시 저장
          → 재편집 시 복원
          → headless 검증 가능
```

## Reference-level explanation

1. **FieldRegistry**: `FieldState`에 `caretPosition: number | null` 추가 + `updateCaretPosition()` 메서드
2. **useFieldFocus**: deactivate 시 `getCaretPosition()` → `FieldRegistry.updateCaretPosition()` 저장
3. **useFieldFocus**: activate 시 `FieldRegistry.getField().state.caretPosition` → `setCaretPosition()` 복원
4. **Red→Green 테스트**: headless에서 state 계약 검증

## Drawbacks

- FieldState에 필드 1개 추가 (caretPosition). 최소한의 확장.
- 고빈도 defineQuery 추상화는 보류 — 사용처가 caret 하나뿐.
