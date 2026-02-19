# 용어집

> 정식 용어, 네이밍 규칙, 동결된 설계 결정

---

## 용어

| 용어 | 정의 | 금지 표현 |
|---|---|---|
| Kernel | 범용 커맨드 처리 엔진 | runtime, core |
| Group | 유일한 추상화 단위. `defineCommand`, `defineEffect`, `defineContext`, `group`, `dispatch`, `use`, `register`, `reset`을 제공한다. Kernel 자체도 Group이다. | module, namespace |
| Command | 불변 객체 `{ type, payload?, scope? }`. CommandFactory가 생성한다. | event, action, message |
| CommandFactory | `defineCommand()`가 반환하는 함수. 타입 안전한 Command를 생성한다. handler, tokens 메타데이터를 운반한다. | CommandToken, creator |
| EffectMap | 핸들러의 반환값. `{ state?, [EffectToken]?, dispatch? }` | result, fx-map, response |
| Effect | `defineEffect()`로 등록된 부수 효과 핸들러. 엔진이 실행한다. | side-effect, fx |
| EffectToken | 브랜드 문자열. `defineEffect()`의 반환값이며 computed key로 사용한다. | effect key, effect ID |
| Context | 읽기 전용 외부 데이터. `{ state, ...injected }`. `group({ inject })`로 주입한다. | cofx, coeffects |
| ContextToken | 래퍼 객체 `{ __id, __phantom? }`. `defineContext()`의 반환값이다. | context key |
| Scope | 계층적 커맨드 해석을 위한 문자열 ID. Group당 하나가 할당된다. | layer, level, namespace |
| ScopeToken | 브랜드 문자열. `defineScope()`의 반환값이다. | scope ID |
| Middleware | `{ id, before?, after?, fallback? }`. 횡단 관심사 훅이다. | interceptor, plugin |
| When Guard | 커맨드 실행의 선행 조건. `{ when: (state) => boolean }`. guard 실패 시 버블링한다. | precondition, filter |
| State | 단일 불변 상태 트리 | db, DB, store, OSState |
| Token | 타입 안전 참조. `define*()`으로만 생성한다. 원시 문자열 사용을 방지한다. | ID, key, tag |
| Computed | `useComputed(selector)`를 통한 파생 상태 | subscription, selector |
| State Lens | `{ get, set }` 쌍. 스코프 격리를 위한 상태 슬라이스이다. 자식 스코프가 자동 상속할 수 있다. | reducer, slice |
| Transaction | 상태 스냅샷을 포함한 커맨드 실행 기록이다. 타임 트래블을 지원한다. | event, log entry |
| Bubble Path | 구체→일반 순의 스코프 배열. 예: `[TODO, SIDEBAR, APP, GLOBAL]` | scope chain |
| Inspector | Port/Adapter 패턴으로 분리된 읽기 전용 내부 관찰 인터페이스이다. `kernel.inspector`로 접근한다. | debugger, devtools |
| Register | 외부 CommandFactory의 핸들러를 현재 커널에 등록한다. 테스트-프로덕션 핸들러를 공유하는 데 사용한다. | import, bind |

---

## 네이밍 규칙

### 토큰은 SCREAMING_CASE

모든 토큰(CommandFactory, EffectToken, ScopeToken, ContextToken)은 SCREAMING_CASE를 사용한다.

```typescript
const INCREMENT = kernel.defineCommand("INCREMENT", handler);
const FOCUS_ID = kernel.defineEffect("FOCUS_ID", handler);
const TODO_LIST = defineScope("TODO_LIST");
const DOM_ITEMS = kernel.defineContext("DOM_ITEMS", provider);
```

변수 이름은 문자열 리터럴과 반드시 일치해야 한다. grep 및 find-replace의 일관성을 위해서다.

### 금지 약어

| 약어 | 전체 이름 |
|---|---|
| `db` | `state` |
| `fx` | `effect` |
| `cofx` | `ctx` (context) |
| `mw` | `middleware` |
| `sub` | `computed` |
| `cmd` | `command` |

---

## 설계 결정

아래 결정은 동결(frozen) 상태이며, 전체 설계 리뷰 없이 변경해서는 안 된다.

### D1: Command, Event가 아닌

디스패치 데이터를 Command라고 부른다. DOM Event와의 충돌을 방지하기 위해서다. 커널은 Command를 처리하고, 브라우저는 Event를 처리한다.

### D2: 이펙트 선언 모델

핸들러는 부수 효과를 직접 실행하지 않는다. 발생할 이펙트를 선언하는 EffectMap을 반환하면 엔진이 핸들러 반환 후 이를 실행한다. 핸들러가 순수하고 테스트 가능하게 유지된다.

### D3: CommandFactory 패턴

dispatch 오버로딩을 두지 않는다. `dispatch(CMD())`가 유일한 호출 형태이며, 팩토리가 Command를 생성하고 dispatch가 이를 수신한다. `dispatch(TOKEN, payload)` 형태는 LLM 환각(hallucination)을 유발하기 쉬우므로 설계 단계에서 제거하였다.

### D4: 브랜드 타입

모든 토큰은 TypeScript 브랜드 타입(`unique symbol`)을 사용한다. 구조적 하위 타입화를 방지하여 `{ type: "INCREMENT" }`와 같은 리터럴 객체가 유효한 Command로 취급되지 않도록 한다. CommandFactory만이 브랜드 Command를 생성할 수 있다.

### D5: 인덱스 시그니처 제거

EffectMap과 Context에 인덱스 시그니처(`[key: string]: unknown`)를 사용하지 않는다. 명시적으로 정의된 키만 유효하며, 오타와 미등록 키가 컴파일 타임에 포착된다.

### D6: ContextToken의 래퍼 객체 형태

ContextToken은 브랜드 문자열 대신 래퍼 객체 `{ __id, __phantom? }`를 사용한다. TypeScript의 mapped type이 브랜드 문자열에서 Value를 추론하지 못하기 때문이다. 래퍼 형태가 `InjectResult<Tokens>`의 올바른 동작을 보장한다.

### D7: Group = 유일한 인터페이스

Kernel 자체가 GLOBAL 스코프의 Group이다. 별도의 "커널 API"와 "그룹 API"를 구분하지 않고 동일한 인터페이스를 사용하여 API 표면과 학습 비용을 최소화한다.

### D8: 미들웨어 모델

미들웨어는 `{ id, before, after }` 형태를 사용한다. re-frame의 인터셉터 모델에서 영감을 받았으며, Redux의 `(next) => (state, action) => ...` 체이닝과 다르다. 각 미들웨어가 독립적이므로 순서 변경이 자유롭다.

### D9: 스코프는 명시적

커맨드는 스코프를 `cmd.scope`에 명시한다. 호출 사이트(call-site)나 실행 컨텍스트에서 암시적으로 스코프를 파생하지 않는다. 명시적이고 결정적이며 재생 가능하다.

### D10: 입력 비의존성

Kernel은 입력 소스에 대해 알지 못한다. 키보드, 마우스, 클립보드 등 모든 입력 처리는 OS 레이어의 관심사다. Kernel은 Command를 수신하며, 출처를 묻지 않는다.

### D11: 클로저 기반 격리

`createKernel()`은 모든 내부 상태에 클로저를 사용한다. `globalThis`나 싱글턴 레지스트리가 없으며, 각 인스턴스가 독립적이므로 HMR 환경에서 안전하고 테스트에 적합하다.

### D12: When Guard 외부화

`when` 옵션은 핸들러의 선행 조건을 핸들러 외부에 선언한다. 이를 통해 Inspector가 `inspector.evaluateWhenGuard(scope, type)` API로 guard 상태를 런타임에 시각화할 수 있다. 핸들러 내부의 `if` 문은 동일한 기능을 제공하지만 외부에서 관찰할 수 없다.

### D13: Inspector Port/Adapter 패턴

Inspector는 커널 내부의 원시 Map이나 핸들러 참조에 직접 접근하지 않는다. 좁은 포트 인터페이스(`KernelIntrospectionPort`)를 통해 가공된 이름(string)만 수신한다. Interface Segregation Principle을 준수한다.

### D14: CommandFactory 메타데이터

CommandFactory는 `handler`와 `tokens`를 메타데이터로 운반한다. 이를 통해 `register()` API가 동작하며, 테스트 커널이 프로덕션 핸들러를 중복 없이 재사용할 수 있다.

---

## 영감의 출처

| 출처 | 차용한 개념 |
|---|---|
| re-frame | Effects as data, 인터셉터 모델, coeffects → inject |
| Redux | 단일 상태 트리, 미들웨어, 타임 트래블 |
| Zustand | 클로저 기반 스토어, `useSyncExternalStore` |
| Elm | Cmd 패턴 (update 함수가 이펙트를 반환) |
| DOM | 이벤트 버블링 → 스코프 버블링 |

---

## 동결 상태

> `@frozen 2026-02-11 — 검토 및 잠금 완료. 설계 리뷰 없이 수정 금지.`

커널 소스 코드(`packages/kernel/src/`)는 동결 상태다.

- 공식 설계 리뷰 없이 새로운 기능을 추가할 수 없다
- 버그 수정은 회귀 테스트를 동반해야 한다
- 본 문서에 기술된 API 표면이 최종 공개 API다
