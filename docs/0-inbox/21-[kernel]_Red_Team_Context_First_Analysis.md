# [Red Team] Kernel v2.1 Context-First API 분석

**작성일**: 2026-02-09
**대상**: Kernel Unified Group API v2.1 (Context-First Curried Pattern)
**커밋**: `834d2bb`

---

## 1. 개요 (Overview)

`defineCommand((ctx) => (payload) => ...)` 패턴 도입이 가져온 이점과 잠재적 위험을 분석한다.
이점(Type Safety, Zero Annotation)은 명확하므로, **위험(Risks)과 비용(Costs)**에 집중한다.

## 2. 주요 발견 (Key Findings)

### 2.1 인지 부하 (Cognitive Load)

> **"화살표가 너무 많다."**

- **이중 화살표**: `(ctx) => () => ({ ... })`
- **의미론적 혼동**: 개발자가 "왜 함수를 리턴해야 하지?"라고 물을 때, "TS 추론 때문"이라는 답변은 구현 세부사항(Implementation Detail)을 사용자에게 노출시키는 것이다.
- **Mental Model**: "컨텍스트를 주입받고(1), 그 다음 페이로드를 받아(2) 처리한다"는 논리는 타당하나, JS/TS 생태계에서 흔한 패턴은 아니다 (React Hook, HOC 등과 유사하지만 Command Handler로서는 낯섦).

### 2.2 런타임 오버헤드 (Runtime Overhead)

- **Closure Creation**: 모든 `dispatch`마다 핸들러가 실행되어 *내부 함수(클로저)*를 생성하고, 그것이 다시 실행된다.
- **Memory**: 클로저 생성 비용은 미미하지만(modern JS engines optimize well), 1초에 수천 번 디스패치되는 고빈도 액션(예: `MOUSE_MOVE`, `SCROLL`)에서는 GC 압력이 될 수 있다.
- **Stack Trace**: 에러 발생 시 스택 트레이스에 익명 함수 뎁스가 하나 더 추가된다.

### 2.3 툴링 호환성 (Tooling Compatibility)

- **Prettier/Biome**: `(ctx) => () =>` 포맷팅이 가독성을 해치지 않는지 확인 필요. 다행히 Biome은 이를 잘 처리함.
- **ESLint**: `no-unused-vars` 규칙이 `(ctx)` 또는 `()` 사이에서 오작동할 가능성 점검. (`_ctx` 컨벤션 필요)

### 2.4 타입 시스템 엣지 케이스 (Type System Edge Cases)

- **Optional Payload**: `(ctx) => (payload?: number) => ...`
  - 현재 구조에서 `CommandFactory`는 `Payload` 유무에 따라 조건부 타입을 사용함.
  - 핸들러에서 `payload?`를 사용하면 `P`가 `number | undefined`가 되고, `CommandFactory`는 이를 `payload`가 필수인 것으로 간주할 수 있음 (또는 반대).
  - -> **검증 필요**: Payload가 optional인 커맨드를 정의할 수 있는가?

## 3. 시나리오 테스트 (Scenario Testing)

### S1. Optional Payload

**Status**: ✅ **해결 완료 (`19a1c1b`)**
- `tokens.ts`의 `CommandFactory` 조건부 타입 수정 (`undefined extends Payload ? [p?] : [p]`).
- 이제 `OPT()` 호출이 정상 동작함.

```typescript
// 의도: payload 없이도 호출 가능해야 함
defineCommand("OPT", (ctx) => (p?: number) => ({ state: p ?? 0 }));
```
- **예상**: `OPT()` (X), `OPT(undefined)` (O), `OPT(1)` (O).
- **현실**: Factory 타입이 `P`를 어떻게 해석하느냐에 달림. `void`가 아니면 `payload`는 필수 인자가 됨.

### S2. Generic Payload

```typescript
// 의도: 호출 시점에 타입 결정? (불가능)
// 리덕스 액션 자체는 제네릭일 수 없음. 커맨드 정의 시점에 구체화됨.
defineCommand("ECHO", (ctx) => <T>(p: T) => ({ ... })); // TS Error
```
- 이는 제약사항이 아니라 디자인 의도(Action must be serializable/concrete)와 부합함.

## 4. 결론 및 제언 (Conclusion & Recommendations)

**결론**: 이점(Type Safety)이 비용(Double Arrow Syntax)을 상회함.

**제언**:
1. **Optional Payload 검증**: `test-ctx-first-v2.ts`에 해당 케이스 추가 검증 필요.
2. **Shortcuts?**: 만약 `ctx`를 안 쓰는 핸들러라면 `defineCommand("NO_CTX", () => ({ ... }))` 숏컷을 허용할 것인가?
   - -> **비추천**. 일관성이 더 중요함. 모든 핸들러가 `(ctx) => ...` 형태를 유지하는 것이 예측 가능함.
3. **Snippets**: VSCode 스니펫 제공으로 `(ctx) => () =>` 타이핑 피로 감소.

---

**승인 여부**: ✅ **승인 (Approved with Recommendations)**
- S1(Optional Payload)에 대한 동작만 명확히 확인하고 문서화할 것.
