# Discussion: Item의 데이터 바인딩 — createItem vs payload 연결

> **일시**: 2026-02-16 09:36~10:33
> **시작점**: `http://localhost:5555/playground/command-palette` — virtualFocus 미동작

---

## Journey

**🧑 사용자**: Command Palette playground을 열었다. 핵심은 타이핑하면서 키보드로 위아래 선택 가능하면서 입력 포커스가 유지되는 건데, 전혀 동작하지 않고 E2E도 실패한다.

**🤖 AI**: 코드 분석 결과 virtualFocus 구현 코드는 존재하지만 E2E 3/8 실패. `OS.Item`의 `isFocused` 조건이 `activeZoneId === zoneId`에 종속되어 있어, input에 focus가 있으면 Zone이 active가 아닌 것으로 판단 → `isFocused`가 항상 `false`. 이것이 근본 원인.

**🧑 사용자**: defineApp 리팩토링이 먼저여야 할 것 같다. `OS.Item`이 아니라 `createItem`으로 노선을 바꿀 거다.

---

**🤖 AI**: `createItem`이 `createZone`과 동일한 패턴(handle → command → bind)이면 Item이 일급 스코프 엔티티가 된다. Entity Tree가 App → Zone → Item으로 3단계.

**🧑 사용자**: `createZone`과 동일한 패턴. `bind()` 반환 컴포넌트에 `id` required.

**🤖 AI**: QuickPick도 `defineApp`으로 재작성? 팩토리 패턴으로?

**🧑 사용자**: A (둘 다 맞다).

---

**🧑 사용자**: Item의 역할을 분명하게 정의해보자. OS가 지향하는 Item이란?

**🤖 AI**: Item = Zone 안에서의 원자적 상호작용 단위. OS 행위(포커스, 선택)와 앱 도메인(토글, 편집)이 만나는 경계. 커맨드 스코프이자 버블링 단계.

**🧑 사용자**: Cmd+C, Delete를 위해 실제 data의 힌트가 되는 역할도 필요하다.

**🤖 AI**: 현재 Todo 앱 분석 결과, 모든 커맨드가 `payload.id → state.data.todos[id]` 역변환 보일러플레이트를 반복 중.

---

**🧑 사용자**: 우리의 방향은 극도로 단순화되는 미니멀인데, 어떻게 생각해?

**🤖 AI**: **Red Team 분석 결과 —** `createItem`이 해결하는 3가지 문제 중:
1. ID→데이터 변환 → Zone resolver로 해결 가능
2. virtualFocus → 버그 수정으로 해결 가능
3. 아이템 레벨 커맨드 스코핑 → 현재 실수요 없음 (YAGNI)

더 나아가, `OS.Item`에 이미 **`payload` prop이 존재하지만 사용되지 않고 있다.** 이를 OS 커맨드 파이프라인에 연결하면 `createItem` 없이 **새 개념 0개**로 동일 Intent 달성 가능.

**🧑 사용자**: 아냐 좋았어. 나는 How를 제시하지만, 그 How의 의도를 알아차리고 이미 알려진 더 좋은/단순한 방법을 발견하기 위해 Discussion을 하는 거다.

> Discussion workflow 규칙 3 추가: **How → Intent → 더 나은 How**

---

**한 줄 요약**: `createItem`이라는 How에서 출발했지만, Intent를 추적하니 기존 `payload` prop 연결 + virtualFocus 버그 수정이라는 더 단순한 해법에 도달.

---

## Conclusion

### Why
Command Palette의 핵심 UX(타이핑 중 키보드 네비게이션 + 입력 포커스 유지)가 동작하지 않는다. 근본 원인은 `OS.Item`의 상태 투영 구조와 데이터 접근 방식.

### Intent
1. Item이 수동적 프로젝터가 아니라, OS 오퍼레이션에 데이터 힌트를 제공하는 바인딩 포인트여야 한다
2. ID → 데이터 역변환 보일러플레이트를 제거해야 한다
3. virtualFocus가 올바르게 동작해야 한다

### Warrants

| # | Warrant |
|---|---------|
| W1 | E2E 3/8 실패의 근본 원인: `OS.Item`의 `isFocused` = `focusedItemId === id && activeZoneId === zoneId` — Zone이 active가 아니면 항상 false |
| W2 | 현재 `defineApp.bind()` Item = `OS.Item` pass-through, 커맨드/스코프/키바인딩 없는 빈 껍데기 |
| W3 | 모든 아이템 커맨드가 `payload.id → state.data[id]` 역변환 반복 (deleteTodo, copyTodo, cutTodo 등) |
| W4 | `OS.Item`에 이미 `payload` prop 존재 (Item.tsx line 18) — 사용되지 않음 |
| W5 | `createItem`이 해결하는 문제 중 실수요 있는 것은 payload 연결과 virtualFocus — 둘 다 기존 수단으로 해결 가능 |
| W6 | 아이템 레벨 커맨드 스코핑은 현재 앱(Todo, Builder, CommandPalette)에서 실수요 없음 (YAGNI) |
| W7 | "단순"은 쉽고 조악한 것이 아니라, 불필요한 개념을 추가하지 않으면서 우아하게 해결하는 것 |

### 결론: 최소 해법 (새 개념 0개)

1. **`OS.FOCUS` 센티널 resolve 시 payload 함께 주입** — OS 커맨드 파이프라인 수정 1곳
2. **virtualFocus 버그 수정** — `activeZoneId` 종속 조건 수정 1곳
3. `createItem`은 YAGNI — 아이템 레벨 스코핑이 필요해지면 그때 도입

### 부산물

- Discussion workflow 규칙 3 추가: "How가 아닌 Why를 추적한다"

**한 줄 요약**: Item의 데이터 바인딩 문제는 새로운 `createItem` 추상화가 아니라, 기존 `payload` prop을 OS 파이프라인에 연결하는 것으로 해결한다.
