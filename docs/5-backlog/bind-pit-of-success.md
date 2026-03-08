# bind() Pit of Success 개선

> 작성일: 2026-03-09
> 출처: /discussion — bind() 3축 분석 (Pit of Success, LLM 친화성, 코드 복잡도)

## 핵심 문제

`zone.bind()`에 7개 관심사(role, options, callbacks, triggers, field, keybindings, data accessors)가 단일 객체로 합쳐져 있어 silent failure와 제약 충돌이 발생한다.

## 우선순위 1: options 제약 충돌이 타입에 표현되지 않음

`role: "grid"`에 `select: { followFocus: true }`를 넣으면 컴파일 통과하지만 의미 없는 동작이 된다.

### 제약 관계 (현재 암묵적)

| option | 유효 조건 |
|--------|----------|
| `select.followFocus` | `select.mode: "single"`에서만 의미 있음 |
| `select.range` | `select.mode: "multiple"`에서만 의미 있음 |
| `select.toggle` | `select.mode: "multiple"`에서만 의미 있음 |
| `navigate.typeahead` | grid role에서 사용 불가 |
| `navigate.orientation: "corner"` | grid role에서만 의미 있음 |
| `expand` | accordion, tree, disclosure 등 특정 role에서만 유효 |
| `value` | meter, spinbutton, slider 등 value role에서만 유효 |

### 가능한 해법

1. **Discriminated union**: `role`에 따라 `options` 타입이 달라지는 제네릭 (가장 강력, 가장 복잡)
2. **Role preset 강화**: role 선언 시 비호환 option을 넣으면 런타임 warning
3. **Lint rule**: `bind({ role: "grid", options: { navigate: { typeahead: true } } })` 패턴 감지

## 우선순위 2: silent failure

- `field.fieldName`이 `<Field name="...">` prop과 불일치하면 컴파일 통과, 키보드 무반응
- `...collectionBindings` spread 후 override 순서 실수 시 silent 덮어쓰기

## 우선순위 3: 콜백 시그니처 혼재

- `onAction: (cursor) => Command` vs `onUndo: BaseCommand` — 같은 `on*` prefix, 다른 시그니처
- triggers 내부에 command factory와 OverlayHandle이 공존 (namespace merge 패턴)

## 판단 기준 (원칙 13-1)

> LLM 실수율 ≈ API 자유도 × 작성 빈도

bind()는 71회/41파일, 12+ 결정 지점 — **코드베이스에서 가장 위험한 API surface**.
