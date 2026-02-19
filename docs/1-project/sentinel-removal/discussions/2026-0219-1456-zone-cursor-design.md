# ZoneCursor 설계 결정

> 2026-02-19 | sentinel-removal 프로젝트 승격 계기

## 배경

`OS_FOCUS` 센티널 제거를 위해 `(focusId: string) => BaseCommand` 함수 패턴을 시도했으나,
구현 중 근본적인 설계 문제를 발견.

## 발견 과정 (소크라테스식)

### Q1: multi-select를 고려했나?
→ OS_DELETE, OS_COPY, OS_CUT은 selection을 loop하며 per-item 호출.
  앱은 selection 전체를 볼 수 없음.

### Q2: selection은 어디서 오나?
→ `os.focus.zones[zoneId].selection` — kernel state에서 OS 커맨드가 읽음.
  앱은 `stateSlice` 격리 때문에 접근 불가.

### Q3: focus도 kernel state인데 왜 인자로 전달하나?
→ multi-select loop에서 전달하는 건 `focusedItemId`가 아니라 각 selected item의 ID.
  인자는 "focus"가 아니라 "이번 target".

### Q4: 그러면 앱은 selection을 어떻게 아나?
→ **모른다.** OS가 per-item loop으로 처리. 앱은 단일 아이템만 처리.

### Q5: multi-select delete가 단일 커맨드 N번 호출?
→ 맞다. N개 selected → N번 dispatch → N번 state 갱신 → N번 produce.
  비효율적이고, OS가 앱의 도메인 결정(multi = N×single)을 대신함.

### Q6: `getSelection()` 같은 API로 앱이 직접 읽으면?
→ `stateSlice` 격리를 깨는 것. 전역 사이드 채널.
  **인자가 OS→App 경계를 넘는 유일한 정당한 인터페이스.**

## 결론

**OS는 "무엇이 선택돼 있는지" 전달, 앱은 "어떻게 처리할지" 결정.**

```ts
interface ZoneCursor {
  focusId: string;
  selection: string[];
  anchor: string | null;
}

type ZoneCallback = (cursor: ZoneCursor) => BaseCommand | BaseCommand[];
```

### 원칙

| 책임 | OS | App |
|------|-----|------|
| focus/selection 상태 관리 | ✅ | |
| cursor 구성 및 전달 | ✅ | |
| 도메인 액션 결정 | | ✅ |
| batch vs per-item 결정 | | ✅ |
| transaction 관리 | ✅ (앱이 반환한 commands를 감싼다) | |

### 이름: Cursor

- "위치 + 선택 범위" 의미
- kernel의 `Context`(DI), `Scope`, `State`와 충돌 없음
- 인터페이스 shape은 future pattern에 따라 확장 가능
