# sentinel-removal — OS Sentinel → ZoneCursor 전환

## WHY

OS zone 콜백이 `OS_FOCUS` 센티널 문자열을 통해 focusId를 전달하는 현재 패턴은:

1. **타입 안전성 부재**: 런타임 문자열 치환 (`resolveFocusId`)이 타입 시스템을 우회
2. **keybinding 경로 버그**: 앱 커스텀 키바인딩(`Meta+D`)이 `resolveFocusId`를 거치지 않아 센티널이 미해석 상태로 dispatch됨
3. **selection 정보 단절**: OS가 selection을 per-item loop으로 처리하여 앱이 batch context를 볼 수 없음
4. **레이어 경계 위반**: OS가 "multi-delete = N × single-delete" 같은 도메인 결정을 앱 대신 수행

## 목표

센티널 패턴을 제거하고, **ZoneCursor** 기반 함수 콜백으로 전환한다.

```ts
interface ZoneCursor {
  focusId: string;
  selection: string[];
  anchor: string | null;
}

type ZoneCallback = (cursor: ZoneCursor) => BaseCommand | BaseCommand[];
```

**원칙**: OS는 "무엇이 선택돼 있는지"를 알려주고, 앱은 "그걸 어떻게 처리할지"를 결정한다.

## 설계 근거

### 왜 `(focusId: string)` 가 아닌가

- `focusId`만 전달하면 OS가 multi-select loop을 소유해야 함 → N번 dispatch, N번 state 갱신
- 앱이 batch/확인대화/순서제어 등 도메인 결정을 할 수 없음
- `stateSlice` 격리 때문에 앱 커맨드 핸들러에서 `os.focus`에 직접 접근 불가 → 인자가 유일한 인터페이스

### 왜 `ZoneCursor` 인가

- `focusId` + `selection` + `anchor`는 모두 `os.focus.zones[zoneId]`에서 온다
- OS가 이 세 값을 **한 번에** 전달하면 앱이 도메인에 맞게 처리 가능
- 이름 `Cursor`는 "위치 + 선택 범위"를 의미하며 kernel의 `Context`와 충돌하지 않음
- 인터페이스 shape은 future interaction pattern에 따라 성장 가능

## Scope

- `ZoneCursor` 타입 정의
- `ZoneEntry`, `ZoneBindings`, `KeybindingEntry` 타입 전환
- `Zone.tsx`, `FocusGroup.tsx` props 전환
- OS 커맨드 (`delete`, `move`, `activate`, `check`, `clipboard`) — loop 제거, cursor 전달
- `defineApp.bind.ts` — keybinding 등록 경로 수정
- `resolveKeyboard.ts`, `KeyboardListener.tsx` — callback dispatch 경로 추가
- 앱 전환 (`todo`, `builder`) — 콜백을 ZoneCursor 기반으로
- `resolveFocusId.ts` 삭제, `sentinels.ts` 삭제
- 전체 테스트 업데이트

## Scale: Heavy

아키텍처 변경. OS↔App 인터페이스 계약이 바뀜.
