---
last-reviewed: 2026-02-12
---

# Nominal Typing in a Structural World

> TypeScript의 구조적 타이핑(Structural Typing) 한계를 극복하고, 커널 수준의 절대적 타입 안전성을 확보하는 패턴들.

## 왜 이 주제인가

interactive-os 커널은 **"100% Type-Strict"**를 지향한다. 그런데 최근 `AnyCommand` 도입 과정(`inbox/AnyCommand_Type.md`)에서 TypeScript의 구조적 타이핑으로 인한 호환성 문제가 드러났다.

- `Command<string, void>`가 `Command<string, number>`와 호환되지 않음 (당연함)
- 하지만 `payload`가 없는 객체가 `payload: void` 객체와 호환되지 않는 문제 (TS `exactOptionalPropertyTypes`)
- `{ type: "TEST" }` 리터럴이 `Command` 타입으로 오인되는 문제

이 리소스는 커널이 왜 **Branded Types**, **Phantom Types** 같은 기법을 사용하여 **명목적 타이핑(Nominal Typing)**을 흉내 내는지, 그 원리와 Best Practice를 정리한다.

## Background / Context

### Structural vs. Nominal

- **Nominal Typing (Java, C#, Rust)**: 이름이 같아야 같은 타입이다.
    ```java
    class Dog { String name; }
    class Cat { String name; }
    Dog d = new Cat(); // ❌ 컴파일 에러 (다른 타입)
    ```
- **Structural Typing (TypeScript, Go, OCaml)**: 구조(속성)가 같으면 같은 타입이다. (Duck Typing)
    ```typescript
    class Dog { name: string; }
    class Cat { name: string; }
    const d: Dog = new Cat(); // ✅ 호환됨
    ```

### 커널에서의 문제

커널에서는 **의도치 않은 호환성**이 치명적이다.

1. **ID 충돌**: `ScopeToken("GLOBAL")`과 `EffectToken("GLOBAL")`은 런타임에서 둘 다 문자열 `"GLOBAL"`이다. TS는 이 둘을 구분하지 못한다.
2. **객체 오인**: `{ type: "OPEN" }`이라는 일반 객체를 `dispatch()`에 넣으면, 구조적으로는 `Command`와 같아 보일 수 있다. 하지만 커널은 `CommandFactory`를 통하지 않은 객체를 거부해야 한다.

## Core Concept

### 1. Branded Types (Opaque Types)

구조적 타이핑을 깰 수 있는 유일한 방법은 **"런타임에는 없지만 컴파일 타임에만 존재하는 유니크한 속성"**을 추가하는 것이다.

```typescript
declare const __brand: unique symbol; // 런타임엔 undefined, 타입에선 고유

type Brand<T, B> = T & { readonly [__brand]: B };

type UserId = Brand<string, "UserId">;
type PostId = Brand<string, "PostId">;

const userId = "user_1" as UserId;
const postId = "post_1" as PostId;

function deleteUser(id: UserId) { ... }

deleteUser(postId); // ❌ 컴파일 에러: Type 'PostId' is not assignable to type 'UserId'.
```

**커널 적용사례**: `ScopeToken`, `EffectToken`, `Command`
- `ScopeToken`은 런타임에선 그냥 `string`이다. (JSON 직렬화 가능)
- 하지만 컴파일 타임에선 `ScopeToken` 외에는 할당 불가능하다.

### 2. Phantom Types

런타임 데이터에는 존재하지 않지만, 타입 시스템의 흐름(Flow)을 제어하기 위해 추가하는 제네릭 타입 파라미터.

```typescript
// T는 값으로 사용되지 않음 (Phantom)
interface ContextToken<Id extends string, Value> {
  id: Id;
  // readonly _marker?: Value; // 타입을 "묻혀두는" 공간
}
```

**커널 적용사례**: `ContextToken<"user", User>`
- 런타임 객체: `{ id: "user" }` — `User` 객체는 들어있지 않음.
- 하지만 `ctx.inject(token)`을 호출하면 반환값은 `User` 타입으로 추론됨.
- 토큰 자체가 "타입의 열쇠(Key)" 역할을 수행.

### 3. Covariance & Contravariance (공변성/반공변성)

`AnyCommand` 이슈의 핵심. 제네릭 타입 `Command<P>`가 있을 때:

- `P extends void` (구체)
- `any extends P` (넓음)

일반적으로 객체는 공변적(Covariant)이다. `Dog`는 `Animal`이다.
하지만 함수 인자는 반공변적(Contravariant)이다. `(a: Animal) => void` 함수는 `(d: Dog) => void` 자리에 쓰일 수 없다. (반대는 가능)

커널의 `dispatch(cmd)`는 `cmd`를 소비(Consume)하는 곳이므로, 넓은 타입을 좁은 타입에 넣을 수 없다. 이것이 `AnyCommand = Command<string, any>`가 필요한 수학적 이유다.

## Usage: 커널의 타입 패턴

### A. Branded String (ID 보호)

값이 primitive(문자열/숫자)여야 할 때 사용. JSON 직렬화/DB 저장 시 유리.

```typescript
// 정의
declare const __effectBrand: unique symbol;
export type EffectToken<T extends string> = T & { readonly [__effectBrand]: true };

// 생성 (Casting 필요)
function defineEffect<T extends string>(type: T): EffectToken<T> {
  return type as unknown as EffectToken<T>;
}
```

### B. Branded Object (객체 보호)

객체가 특정 팩토리를 통과했음을 보증할 때 사용.

```typescript
// 정의
declare const __commandBrand: unique symbol;
export type Command = {
  type: string;
  payload: unknown;
  readonly [__commandBrand]: true; // 구조적 타이핑 방지
};
```

### C. Phantom Builder (타입 운반)

값을 생성하지 않고 타입만 전달하는 토큰.

```typescript
// 정의
type ValueToken<T> = {
  __phantom: T; // 컴파일 타임에만 존재
};

// 사용
function getValue<T>(token: ValueToken<T>): T {
  return {} as T; // 런타임 로직은 별도
}
```

## Best Practice + Anti-Pattern

### ✅ Do

| 패턴 | 설명 | 이유 |
|---|---|---|
| **unique symbol 사용** | `declare const __brand: unique symbol` | 문자열 키(`"__brand"`) 안 겹침 보장 |
| **Type Predicates** | `function isCommand(x): x is Command` | `as` 캐스팅 대신 안전한 런타임 검사 |
| **Zod와 결합** | `z.string().brand("UserId")` | I/O 경계에서 런타임 검증 + Branded Type 부여 |

### ❌ Don't

| Anti-Pattern | 왜 위험한가 | 대체제 |
|---|---|---|
| **Private Class Fields** | `#brand`를 사용하여 구조적 타이핑 막기 | 클래스 인스턴스 오버헤드 발생, 직렬화 불가 |
| **Enum 사용** | TS Enum은 Nominal이지만 런타임 코드 생성함 | Union Type + Branding |
| **빈 인터페이스** | `interface UserId {}` | TS는 빈 인터페이스끼리 호환됨 (구조가 같으므로) |
| **`__brand`를 public 속성으로** | `{ _brand: "user" }` | 실수로 같은 문자열을 쓰면 뚫림 |

## 흥미로운 이야기들

- **TypeScript 팀의 입장**: "Nominal Typing을 공식 지원해달라"는 요청은 10년째 열려 있지만, TS 팀은 "구조적 타이핑이 JS 생태계에 더 맞다"며 `unique symbol`을 통한 우회법만 제공한다.
- **Flow의 방식**: Facebook의 Flow는 `class`를 Nominal로 취급한다. TS와 가장 큰 차이점 중 하나.
- **`void`의 배신**: TS에서 `Promise<void>`는 값을 반환해도 된다(무시됨). 하지만 `Command<void>`에서는 "값이 없음"을 엄격히 체크해야 해서 `AnyCommand` 문제가 복잡해졌다.

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|---|---|---|---|---|
| **Effective TypeScript Item 37** | "공식적인" Branded Types 패턴 가이드 | Effective TypeScript (댄 밴더캄) | ★☆☆ | 30min |
| **Michal Zalecki: Nominal Typing** | TS에서 명목적 타이핑을 구현하는 다양한 기법 비교 | [블로그 링크](https://michalzalecki.com/nominal-typing-in-typescript/) | ★★☆ | 1h |
| **Kobalte/Radix Source** | 고품질 오픈소스 라이브러리의 Phantom Type 활용 사례 | Github Source | ★★★ | 2h |
