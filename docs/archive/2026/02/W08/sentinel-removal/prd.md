# PRD — sentinel-removal (ZoneCursor 전환)

## 1. 문제 정의

현재 OS zone 콜백은 `OS_FOCUS` 센티널 문자열을 통해 focusId를 전달한다.
이 패턴은 타입 안전하지 않고, keybinding 경로에서 미해석 버그가 있으며,
multi-select 시 OS가 per-item loop으로 앱의 도메인 결정을 대신한다.

## 2. 요구사항

### FR1: ZoneCursor 인터페이스
- OS는 zone 콜백 호출 시 `ZoneCursor` 객체를 전달한다.
- `ZoneCursor`는 `focusId`, `selection`, `anchor`를 포함한다.
- 콜백 반환 타입은 `BaseCommand | BaseCommand[]`이다.

### FR2: OS 커맨드 단순화
- OS 커맨드(delete, copy, cut, paste, activate, check, move)는 multi-select loop을 하지 않는다.
- cursor를 구성하여 앱 콜백에 **한 번** 전달한다.
- 앱이 batch/per-item 결정을 한다.

### FR3: 앱 batch 지원
- todo 앱의 `deleteTodo`, `copyTodo`, `cutTodo`는 `{ ids: string[] }` batch 페이로드를 지원한다.
- builder 앱도 동일.

### FR4: Keybinding 경로
- 앱 커스텀 키바인딩(Meta+D 등)도 cursor를 올바르게 주입받아야 한다.
- `resolveKeyboard`는 콜백 바인딩을 구분하고, `KeyboardListener`가 cursor를 구성하여 호출한다.

### FR5: 센티널 제거
- `OS_FOCUS`, `OS_SELECTION` 센티널 상수를 삭제한다.
- `resolveFocusId` 유틸리티를 삭제한다.
- 모든 `OS_FOCUS` import를 제거한다.

### FR6: Transaction 정책
- multi-select 작업의 transaction 관리는 OS가 담당한다.
  - 앱이 `BaseCommand[]`를 반환하면 OS가 transaction으로 감싼다.
  - 앱이 `BaseCommand` 1개를 반환하면 그대로 dispatch한다.

### FR7: SELECTION_CLEAR 정책
- delete, cut 후 selection clear는 OS가 자동으로 수행한다.
  - 앱 콜백 반환 이후 OS가 `SELECTION_CLEAR`를 append한다.

## 3. 비기능 요구사항

### NFR1: 타입 안전성
- `OS_FOCUS` 같은 매직 문자열이 없어야 한다.
- 모든 콜백은 `ZoneCallback` 타입으로 검증된다.

### NFR2: 성능
- multi-select N개 삭제 시 state 갱신은 앱의 batch 구현에 따라 1~N회.
- OS 측 dispatch는 앱 반환 기준으로 최소화.

### NFR3: 하위 호환
- `onUndo`, `onRedo`는 cursor 불필요 — `BaseCommand` 유지.
- `onDismiss`도 `BaseCommand` 유지.

## 4. Edge Cases

| 케이스 | 기대 동작 |
|--------|----------|
| selection 비어있음, focusId 있음 | cursor: `{ focusId, selection: [], anchor: null }` |
| selection 있음, focusId 있음 | cursor: `{ focusId, selection: [...], anchor }` |
| focusId 없음 | 콜백 호출하지 않음 (early return) |
| 앱이 빈 배열 반환 | dispatch하지 않음 |
| paste — focusId 없음 | cursor: `{ focusId: "", selection: [], anchor: null }` — 앱이 "append at end" 결정 |

## 5. 비범위

- drag & drop cursor 확장 — 미래 작업
- grid/tree 특화 cursor 필드 — 미래 작업
- `stateSlice`를 통한 OS state 노출 (getSelection API) — 의도적 제외
