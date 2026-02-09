# 에이전트 시대에 왜 이 아키텍처인가

> 날짜: 2026-02-09
> 태그: architecture, LLM, agent, re-frame
> 상태: Draft
> 대상 독자: 이 프로젝트를 처음 보는 개발자, 또는 "왜 이렇게까지 해야 하나?" 싶은 사람

---

## 0. 한 문장 요약

> **LLM이 코드를 읽고, 쓰고, 고치는 시대에는 — 사람이 아니라 기계가 이해하기 쉬운 구조가 곧 생산성이다.**

---

## 1. 세상이 바뀌었다

2024년까지 코드는 사람이 읽고 사람이 썼다.
"좋은 아키텍처"란 팀원이 빠르게 온보딩하고, 리뷰하기 쉬운 구조를 의미했다.

2025년부터 코드를 **읽는 것도, 쓰는 것도, 리팩토링하는 것도 LLM 에이전트가 한다.**
Claude Code, Cursor, Copilot Workspace — 이들은 코드베이스를 탐색하고, 이해하고, 수정한다.

그런데 이 에이전트들에게는 사람과 다른 인지 특성이 있다:

| 특성 | 사람 | LLM 에이전트 |
|---|---|---|
| **컨텍스트** | 프로젝트 전체를 "대충" 기억 | 컨텍스트 윈도우 안의 것만 "정확히" 봄 |
| **추론** | 암묵지, 관례, 경험으로 추론 | 명시적 구조와 타입으로 추론 |
| **수정** | 여러 파일을 동시에 고칠 수 있음 | 한 번에 하나의 변경이 안전 |
| **검증** | "이 정도면 되겠지" | 타입 체크 + 테스트로만 확신 |
| **탐색** | 폴더 구조, 파일명, 패턴 매칭 | grep, glob, AST 파싱 |

이 차이가 아키텍처 선택에 직접적으로 영향을 미친다.

---

## 2. LLM 에이전트가 잘하는 것, 못하는 것

### 잘하는 것

- **순수함수 작성** — 입력과 출력이 명확하면 정확한 코드를 생성
- **데이터 구조 생성** — JSON, config 객체, 타입 정의를 빠르고 정확하게 작성
- **패턴 반복** — "이 패턴으로 X를 만들어줘" → 일관된 결과
- **타입 기반 추론** — 타입이 있으면 올바른 코드를 유추
- **테스트 작성** — 입력/출력이 명확한 함수의 테스트는 거의 완벽

### 못하는 것

- **숨겨진 부수효과 추적** — "이 함수가 전역 상태를 바꾸는지" 알기 어려움
- **암묵적 흐름 파악** — 이벤트 버스, 옵저버 패턴 등 간접적 연결
- **여러 파일에 걸친 상태 변이 이해** — 상태가 어디서 어떻게 바뀌는지 추적 불가
- **"관례"에 의존하는 코드** — 문서화되지 않은 팀 규칙
- **비결정적 동작 디버깅** — race condition, 타이밍 의존 버그

### 핵심 통찰

> LLM 에이전트의 강점을 극대화하고 약점을 회피하는 아키텍처를 선택하면,
> 에이전트가 10배 더 정확한 코드를 10배 빠르게 작성한다.

---

## 3. 왜 re-frame 스타일인가

re-frame(2015)은 LLM을 위해 만들어진 게 아니다.
하지만 **우연히도** LLM 에이전트에게 가장 이상적인 구조를 가지고 있다.

### 3.1 순수함수 핸들러 → LLM이 가장 잘 쓰는 코드

```typescript
// 이 함수를 "작성해줘"라고 하면 LLM은 거의 완벽하게 만든다.
// 왜? 입력(cofx, payload)과 출력(fx-map)이 타입으로 명확하기 때문.

regEventFx("NAVIGATE", (cofx, payload) => {
  const { db } = cofx;
  const zone = db.focus.zones[db.focus.activeZoneId];
  const items = cofx["dom-items"];
  const nextId = findNext(items, zone.focusedItemId, payload.direction);

  return {
    db: { ...db, focus: { ...db.focus, zones: { ...db.focus.zones,
      [db.focus.activeZoneId]: { ...zone, focusedItemId: nextId }
    }}},
    focus: nextId,
    scroll: nextId,
  };
});
```

LLM에게 이 작업을 시키려면 필요한 것:
1. `cofx`의 타입 정의 (무엇을 읽을 수 있는가)
2. 반환하는 fx-map의 타입 정의 (무엇을 선언할 수 있는가)
3. 기존 핸들러 예시 1~2개

**3개의 정보만으로 새로운 커맨드를 완벽하게 생성할 수 있다.**

반면 현재 구조에서 같은 작업을 시키면:

```
"NAVIGATE 커맨드를 만들어줘"
→ LLM: osCommand.ts의 OSContext 30+필드를 이해해야 함
→ LLM: buildContext가 어떻게 호출되는지 추적해야 함
→ LLM: ctx.store.setState()가 어떤 Zustand 스토어인지 파악해야 함
→ LLM: executeDOMEffect가 어떤 switch문인지 읽어야 함
→ LLM: FocusData.setActiveZone()의 부수효과를 이해해야 함
→ 5개 파일을 읽고, 3개의 간접 참조를 따라가야 정확한 코드 작성 가능
```

**컨텍스트 윈도우를 5배 더 소모하고, 정확도는 떨어진다.**

### 3.2 Effect as Data → LLM이 안전하게 부수효과를 다루는 방법

LLM에게 가장 위험한 것: **부수효과를 직접 실행하는 코드를 작성하게 하는 것.**

```typescript
// 위험: LLM이 이런 코드를 만들면 어디서 뭐가 터질지 모른다
function handleNavigate(direction: string) {
  const zone = FocusData.getById(activeZoneId);        // 전역 상태 읽기
  const store = zone.store;                              // 스토어 참조 획득
  const items = getGroupItems(activeZoneId);             // DOM 쿼리
  const nextId = findNext(items, store.getState().focusedItemId, direction);
  store.setState({ focusedItemId: nextId });             // 스토어 직접 조작
  document.getElementById(nextId)?.focus();              // DOM 직접 조작
  document.getElementById(nextId)?.scrollIntoView();     // DOM 직접 조작
  FocusData.setActiveZone(activeZoneId);                 // 전역 상태 변경
}
```

```typescript
// 안전: LLM이 이런 코드를 만들면 — 틀려도 부수효과 없음
regEventFx("NAVIGATE", (cofx, payload) => {
  const nextId = findNext(cofx["dom-items"], cofx.db.focusedItemId, payload.direction);
  return { db: setFocused(cofx.db, nextId), focus: nextId, scroll: nextId };
});
// 반환값이 데이터일 뿐이므로:
// - 틀리면 타입 에러 (컴파일 단계에서 차단)
// - 실행해봐도 fx executor가 검증 (알 수 없는 이펙트 키 경고)
// - 테스트로 즉시 확인 (cofx 주입 → fx-map 비교)
```

> **LLM이 만든 코드가 틀렸을 때의 폭발 반경(blast radius)이 완전히 다르다.**

순수함수 반환값이 틀리면 → 잘못된 데이터가 나올 뿐, 시스템은 안전하다.
부수효과를 직접 실행하면 → 상태 오염, DOM 꼬임, 복구 불가능한 버그가 생긴다.

### 3.3 선언적 레지스트리 → "기능 추가"가 파일 하나 추가

LLM 에이전트에게 "새 기능 추가"를 시키는 시나리오:

**현재 구조:**
```
"DRAG_START 커맨드를 추가해줘"
→ 1. osCommand.ts에 OSCommand 타입을 이해
→ 2. FocusIntent.tsx에 switch case 추가
→ 3. commandMap에 등록
→ 4. resolveKeybinding에 바인딩 추가
→ 5. executeDOMEffect에 새 effect 추가 (필요하면)
→ 6. buildContext에 새 cofx 추가 (필요하면)
→ 기존 파일 4~6개 수정. 하나라도 빠지면 런타임 에러.
```

**제안 구조:**
```
"DRAG_START 커맨드를 추가해줘"
→ 1. dragStart.ts 파일 생성
→ 2. regEventFx("DRAG_START", handler) 작성
→ 3. 끝.
```

**기존 파일 수정: 0개. 새 파일 생성: 1개.**

이것이 Open-Closed Principle이고, re-frame의 레지스트리 패턴이며,
LLM 에이전트가 가장 안전하게 작업할 수 있는 구조다.
기존 코드를 건드리지 않으니 **회귀 버그 가능성이 0**이다.

### 3.4 단일 상태 트리 → LLM이 전체 상태를 한눈에 파악

```typescript
// LLM에게 "현재 상태를 보여줘"
console.log(JSON.stringify(getDb(), null, 2));
```

```json
{
  "focus": {
    "activeZoneId": "sidebar-menu",
    "zones": {
      "sidebar-menu": { "focusedItemId": "menu-item-3", "selection": ["menu-item-3"] },
      "main-list": { "focusedItemId": null, "selection": [] }
    }
  },
  "app": {
    "activeAppId": "kanban",
    "kanban": { "boards": [...], "activeBoard": "board-1" }
  }
}
```

LLM이 이 JSON을 보면 **즉시** 시스템 상태를 이해한다.
"sidebar-menu의 3번째 아이템에 포커스가 있고, main-list는 비활성화 상태"

분산된 상태(focusData 전역변수 + Zone별 스토어 + CommandEngine)를 가지면:

```
LLM: "현재 상태를 확인하려면..."
→ FocusData.getActiveZoneId() 호출
→ FocusData.getById(zoneId).store.getState() 호출
→ useCommandEngineStore.getState() 호출
→ 3곳을 조합해서 "현재 상태"를 머릿속에서 재구성
→ 컨텍스트 윈도우 3배 소모, 실수 가능성 증가
```

### 3.5 트랜잭션 로그 → 버그 리포트 자체가 재현 스크립트

사용자가 버그를 보고하면:

```
"ArrowDown 두 번 누르고 Enter 했더니 이상하게 동작해요"
```

트랜잭션 로그를 LLM에게 주면:

```json
[
  { "command": "NAVIGATE", "payload": { "direction": "down" },
    "snapshot": { "focus": { "activeZoneId": "list-1", "zones": { "list-1": { "focusedItemId": "item-2" } } } } },
  { "command": "NAVIGATE", "payload": { "direction": "down" },
    "snapshot": { "focus": { "activeZoneId": "list-1", "zones": { "list-1": { "focusedItemId": "item-3" } } } } },
  { "command": "ACTIVATE", "payload": { "targetId": "item-3" },
    "snapshot": { "focus": { "activeZoneId": "list-1", "zones": { "list-1": { "focusedItemId": "item-3" } } } },
    "diff": [] }
]
```

LLM은 이 로그만 보고:
- "ACTIVATE에서 diff가 비어있네요. 상태가 안 바뀌었습니다."
- "item-3의 activateCommand가 등록되지 않았거나, 핸들러가 null을 반환했을 가능성이 있습니다."
- "해당 핸들러를 확인해보겠습니다."

**재현 스크립트를 작성할 필요가 없다. 로그 자체가 재현이다.**

### 3.6 cofx 주입 → DOM 없이 테스트 가능 → CI에서 LLM이 검증

LLM 에이전트가 코드를 작성한 뒤 **스스로 테스트를 돌려 검증**하는 시대다.

```typescript
// LLM이 작성한 테스트 — DOM 불필요, 브라우저 불필요
test("NAVIGATE down moves to next item", () => {
  const cofx = {
    db: { focus: { activeZoneId: "list", zones: { list: { focusedItemId: "item-1" } } } },
    "dom-items": ["item-1", "item-2", "item-3"],
    "zone-config": { navigate: { orientation: "vertical", loop: false } },
  };

  const fx = handleNavigate(cofx, { direction: "down" });

  expect(fx.db.focus.zones.list.focusedItemId).toBe("item-2");
  expect(fx.focus).toBe("item-2");
  expect(fx.scroll).toBe("item-2");
});
```

현재 구조에서는 `buildContext()`가 실제 DOM을 쿼리하므로:
- jsdom 또는 브라우저 환경 필요
- DOM 세팅 코드가 테스트의 80%를 차지
- LLM이 DOM fixture를 정확하게 만들기 어려움
- CI가 느리고 불안정

cofx 주입 패턴에서는:
- **순수 JavaScript 객체만으로 테스트**
- LLM이 cofx를 만들고, fx-map을 검증
- 0.1ms에 100개 케이스 실행
- CI에서 LLM이 자신의 코드를 즉시 검증 가능

---

## 4. 에이전트 시대의 아키텍처 체크리스트

우리가 이 아키텍처를 선택해야 하는 이유를 일반 원칙으로 정리하면:

### LLM-Friendly Architecture Principles

| # | 원칙 | 근거 | 우리의 적용 |
|---|---|---|---|
| 1 | **함수는 순수하게** | LLM은 `(input) → output`을 가장 정확하게 작성한다 | `regEventFx` 핸들러 |
| 2 | **부수효과는 데이터로** | LLM이 만든 코드의 폭발 반경을 제한한다 | fx-map 반환 |
| 3 | **상태는 한 곳에** | LLM이 시스템 상태를 즉시 파악할 수 있다 | 단일 `db` |
| 4 | **기능 추가는 파일 추가로** | 기존 코드 수정 없이 확장한다 (회귀 버그 0) | `regEventFx`, `regFx` 레지스트리 |
| 5 | **모든 변경은 기록** | 버그 리포트 = 재현 스크립트 | 트랜잭션 로그 |
| 6 | **타입이 곧 문서** | LLM은 타입 정의를 읽고 올바른 코드를 유추한다 | 엄격한 TypeScript |
| 7 | **테스트는 DOM 없이** | LLM이 작성한 코드를 즉시 검증할 수 있다 | cofx 주입 |
| 8 | **간접층은 최소로** | LLM의 컨텍스트 윈도우는 유한하다 | dispatch → handler → fx (3단계) |
| 9 | **관례보다 구조** | LLM은 암묵적 규칙을 모른다. 구조가 강제해야 한다 | 파이프라인, 레지스트리 |
| 10 | **작은 파일, 단일 책임** | LLM은 200줄 파일을 완벽히 이해한다. 2000줄은 못 한다 | 200줄 상한 |

---

## 5. 실제 시나리오: LLM 에이전트가 기능을 추가하는 과정

### 시나리오: "드래그 앤 드롭으로 아이템 순서 변경 기능을 추가해줘"

#### 현재 구조에서 LLM의 작업

```
1. 기존 커맨드 패턴 분석 (osCommand.ts, 300줄 읽기)
2. buildContext에 드래그 관련 정보 추가 필요 → osCommand.ts 수정
3. DRAG_START, DRAG_OVER, DROP 커맨드 3개 작성
4. FocusIntent.tsx에 switch case 3개 추가
5. commandMap에 3개 등록
6. executeDOMEffect에 드래그 관련 effect 추가
7. KeyboardSensor는 드래그에 안 맞으므로 새 DragSensor 작성
8. DragSensor → CommandEngineStore 연결 방법 파악
9. 테스트: DOM fixture 필요, jsdom 설정, 드래그 이벤트 시뮬레이션...

수정 파일: 6개+
새 파일: 4개+
컨텍스트 필요: ~3000줄
예상 정확도: 60-70% (1-2회 수정 필요)
```

#### 제안 구조에서 LLM의 작업

```
1. 기존 핸들러 예시 1개 읽기 (navigateHandler.ts, 30줄)
2. 새 파일 작성:

   // dragHandlers.ts
   regEventFx("DRAG_START", (cofx, { itemId }) => ({
     db: assocIn(cofx.db, ["drag", "activeItem"], itemId),
     "drag-image": itemId,
   }));

   regEventFx("DRAG_OVER", (cofx, { targetId }) => ({
     db: assocIn(cofx.db, ["drag", "overTarget"], targetId),
     "drop-indicator": targetId,
   }));

   regEventFx("DROP", (cofx, { targetId }) => ({
     db: reorderItem(cofx.db, cofx.db.drag.activeItem, targetId),
     dispatch: { type: "app/items-reordered" },
   }));

3. 새 파일 작성:

   // dragEffects.ts
   regFx("drag-image", (itemId) => { ... });
   regFx("drop-indicator", (targetId) => { ... });

4. 새 파일 작성:

   // dragSensor.ts
   function onDragStart(e) { dispatch({ type: "DRAG_START", payload: { itemId: e.target.id } }); }
   function onDragOver(e) { dispatch({ type: "DRAG_OVER", payload: { targetId: e.target.id } }); }
   function onDrop(e) { dispatch({ type: "DROP", payload: { targetId: e.target.id } }); }

수정 파일: 0개
새 파일: 3개
컨텍스트 필요: ~200줄
예상 정확도: 95%+ (타입 체크 + 테스트로 즉시 검증)
```

**차이: 기존 코드 수정 0, 필요 컨텍스트 15분의 1, 정확도 30%↑**

---

## 6. "사람이 읽기 어려워지는 거 아닌가?"

아니다. 오히려 반대다.

re-frame 스타일 아키텍처가 사람에게도 좋은 이유:

1. **새 팀원 온보딩**: "모든 상태 변경은 핸들러에서. 모든 부수효과는 fx에서." — 이 두 문장이면 전체 흐름 파악.

2. **디버깅**: 트랜잭션 로그를 열면 "언제, 무슨 이벤트가, 무슨 상태 변화를, 무슨 이펙트를 일으켰는지" 한눈에 보임.

3. **코드 리뷰**: 핸들러가 순수함수이므로 PR의 diff만 보고 "입력 대비 출력이 맞는지" 판단 가능. 부수효과 추적 불필요.

4. **테스트 작성**: cofx를 만들고 fx-map을 비교. DOM 셋업 코드 0줄.

**LLM에게 좋은 구조는 사람에게도 좋은 구조다.**
명시적이고, 추적 가능하고, 테스트 가능한 코드는 누가 읽든 이해하기 쉽다.

---

## 7. 결론: 구조가 곧 경쟁력

2026년의 개발 생산성은 **"얼마나 뛰어난 개발자를 채용했느냐"**가 아니라
**"LLM 에이전트가 얼마나 정확하게 작업할 수 있는 구조를 가졌느냐"**로 결정된다.

같은 Claude Code를 쓰더라도:
- 부수효과가 곳곳에 숨어있는 코드베이스 → 에이전트 정확도 60%, 매번 수정 필요
- 순수함수 + Effect as Data 코드베이스 → 에이전트 정확도 95%, 한 번에 완료

이 차이가 팀 규모와 무관하게 **개발 속도를 2~5배** 가른다.

우리가 re-frame 스타일 아키텍처를 채택하는 이유:

1. **LLM이 정확한 코드를 생성**할 수 있는 순수함수 핸들러
2. **LLM이 안전하게 확장**할 수 있는 레지스트리 패턴 (기존 코드 수정 0)
3. **LLM이 즉시 검증**할 수 있는 DOM-free 테스트
4. **LLM이 즉시 디버깅**할 수 있는 트랜잭션 로그
5. **LLM이 전체 상태를 파악**할 수 있는 단일 상태 트리

이것은 기술적 우아함을 위한 선택이 아니다.
**에이전트 시대의 생존 전략이다.**
