---
last-reviewed: 2026-02-18
---

# Code Coverage — 측정 원리와 도구 체인

> 커버리지 숫자 뒤에는 AST 파싱, 카운터 주입, 바이트코드 조작이라는 컴파일러 수준의 메커니즘이 있다.

## 왜 이 주제인가

`npx vitest run --coverage`를 실행하면 파일별 퍼센트가 나온다. 하지만 **어떻게** 측정되는지 모르면 숫자를 맹신하거나, 반대로 불신하게 된다. 현재 프로젝트에서 `@vitest/coverage-v8`을 사용하고 있으니, V8 엔진 수준의 원리부터 이해하면 커버리지 수치를 올바르게 해석할 수 있다.

## Background

커버리지 측정은 1960년대 구조적 테스팅(structural testing) 연구에서 시작됐다. "테스트가 코드를 얼마나 실행했는가?"라는 질문에 대한 정량적 답이다. JavaScript 세계에서는 두 가지 근본적으로 다른 접근법이 경쟁한다:

| 접근법 | 대표 도구 | 핵심 아이디어 |
|:-------|:----------|:-------------|
| **Source Instrumentation** | Istanbul (nyc) | 소스 코드를 **변환**해서 카운터를 삽입 |
| **Engine-native** | V8 Coverage | 엔진 **내부 메커니즘**을 재활용 |

## Core Concept

### 1. 4가지 측정 지표

어떤 방식이든, 측정하는 것은 동일한 4가지다:

```
┌──────────────┬───────────────────────────────────────┐
│ Statement    │ 실행된 문(statement)의 비율             │
│ Branch       │ if/else, switch, 삼항 등 분기 경로 비율  │
│ Function     │ 호출된 함수의 비율                      │
│ Line         │ 실행된 라인의 비율                      │
└──────────────┴───────────────────────────────────────┘
```

Statement와 Line의 차이: 한 줄에 `a++; b++`가 있으면 Line은 1개, Statement는 2개.

### 2. Istanbul 방식 — Source Instrumentation

Istanbul은 **코드를 실행하기 전에 변환**한다. Babel 플러그인(`babel-plugin-istanbul`)이 AST를 파싱하고, 전략적 위치에 카운터 코드를 삽입한다.

#### 원본 코드:

```js
function greet(name) {
  if (name) {
    return "Hello, " + name;
  }
  return "Hello, stranger";
}
```

#### Istanbul이 변환한 코드 (개념적):

```js
// 글로벌 카운터 객체 초기화
const __coverage__ = {
  path: "/src/greet.js",
  s: { 0: 0, 1: 0, 2: 0 },  // statement counters
  b: { 0: [0, 0] },          // branch counters [then, else]
  f: { 0: 0 },               // function counters
};

function greet(name) {
  __coverage__.f[0]++;           // 함수 진입 카운트
  __coverage__.s[0]++;           // statement 0
  if (name) {
    __coverage__.b[0][0]++;      // then 분기
    __coverage__.s[1]++;
    return "Hello, " + name;
  } else {
    __coverage__.b[0][1]++;      // else 분기
  }
  __coverage__.s[2]++;
  return "Hello, stranger";
}
```

실행 완료 후 `__coverage__` 객체를 수집하면, 어떤 문/분기/함수가 몇 번 실행됐는지 알 수 있다.

**핵심 원리: AST → 카운터 삽입 → 전역 객체에 누적 → 리포트 생성**

#### 장점:
- 모든 JS 런타임에서 동작 (V8 의존 없음)
- implicit else까지 정확하게 추적
- 소스맵과 자연스럽게 통합

#### 단점:
- 빌드 시간 + 런타임 오버헤드 (코드량이 2~3배)
- 새 문법 지원에 AST 파서 업데이트 필요

### 3. V8 방식 — Engine-native Coverage

V8은 **코드를 변환하지 않는다**. 대신 엔진 내부에 이미 존재하는 메커니즘을 재활용한다.

#### 3-1. 함수 수준 커버리지 (Best-effort)

V8의 Ignition 인터프리터는 함수가 호출될 때마다 **feedback vector**의 invocation counter를 증가시킨다. 이건 원래 JIT 최적화(인라이닝 결정)를 위해 존재하던 것이다.

```
함수 호출 → Ignition 인터프리터 → feedback vector.counter++
```

코드 커버리지 요청 시, V8은 힙을 순회하며 살아있는 함수들의:
- invocation count (feedback vector에서)
- source range (`Function.prototype.toString` 용도로 이미 저장됨)

를 수집한다. **추가 오버헤드 제로** — 이미 존재하는 데이터를 읽기만 한다.

단, GC가 함수를 수거하면 데이터가 사라진다 → "best-effort"라 부르는 이유.

#### 3-2. 함수 수준 커버리지 (Precise)

GC 손실을 방지하기 위해, 모든 feedback vector를 root set에 추가한다. 대신 메모리를 더 쓴다. 또한 최적화 컴파일러(TurboFan)가 invocation counter를 증가시키지 않으므로, **최적화를 비활성화**해야 정확한 count를 얻는다.

```
Precise mode:
  1. 모든 feedback vector → GC root set (수거 방지)
  2. TurboFan 최적화 비활성화 (counter 정확성)
  → 메모리 ↑, 성능 ↓, 정확성 ↑
```

#### 3-3. 블록 수준 커버리지 (Block-granularity)

함수 수준으로는 삼항 연산자의 어떤 분기가 실행됐는지 알 수 없다:

```js
function f(a) { return a ? b : c; }
f(true);  // c는 실행 안 됨 — 함수 수준에선 구분 불가
```

이를 해결하기 위해 V8은 두 가지를 추가했다:

**① 파서 확장 — Source Range Collection**

파서가 AST를 만들 때, if-else의 then/else 블록, 삼항 연산자의 각 분기, loop body 등의 **소스 범위(byte range)**를 수집한다.

```
if (cond) {
  /* then: range [11, 28] */
} else {
  /* else: range [36, 53] */
}
```

**② 바이트코드 삽입 — `IncBlockCounter`**

Ignition 바이트코드 생성 시, 각 블록 진입 지점에 `IncBlockCounter` 명령을 삽입한다:

```
// Bytecode (개념적):
IncBlockCounter #0     // then 분기 진입 시
  ... then body ...
Jump @after
IncBlockCounter #1     // else 분기 진입 시
  ... else body ...
@after:
IncBlockCounter #2     // continuation (if-else 이후)
```

런타임에 `IncBlockCounter`가 실행되면, 함수 객체에 달린 보조 데이터 구조의 해당 카운터를 증가시킨다.

**핵심 원리: 소스코드 변환 없이, 바이트코드 수준에서 카운터를 삽입**

### 4. V8 → Istanbul 변환 (v8-to-istanbul)

V8이 수집하는 커버리지 데이터는 **바이트 오프셋 범위 + 실행 횟수**이다:

```json
{
  "scriptId": "42",
  "url": "file:///src/greet.js",
  "functions": [{
    "functionName": "greet",
    "ranges": [
      { "startOffset": 0, "endOffset": 120, "count": 5 },
      { "startOffset": 42, "endOffset": 78, "count": 3 },
      { "startOffset": 80, "endOffset": 118, "count": 2 }
    ]
  }]
}
```

`v8-to-istanbul` 라이브러리가 이 데이터를 소스맵과 대조하여 Istanbul 포맷(`__coverage__` 호환)으로 변환한다. 그래서 Vitest가 V8 방식으로 수집해도 Istanbul과 동일한 HTML 리포트를 생성할 수 있다.

```
V8 Engine → byte ranges + counts
     ↓
v8-to-istanbul + source maps
     ↓
Istanbul coverage format (__coverage__)
     ↓
istanbul-reports → HTML, LCOV, text
```

## 이 프로젝트에서의 도구 체인

```
Vitest
  ├── @vitest/coverage-v8   ← coverage provider
  │     ├── V8 Inspector API (Profiler.startPreciseCoverage)
  │     ├── v8-to-istanbul   ← V8 → Istanbul 변환
  │     └── istanbul-reports ← HTML/text 리포트 생성
  └── vitest.config.ts
        └── test.coverage.provider = "v8"
```

명령어:
```bash
# 텍스트 리포트
npx vitest run --coverage

# HTML 리포트 (coverage/index.html)
# vitest.config.ts에 reporter: ['text', 'html'] 설정 필요
```

## Best Practice + Anti-Pattern

### ✅ Do

| Practice | 이유 |
|:---------|:-----|
| **Branch coverage를 주시** | 100% line이어도 else가 0%면 버그 잠복 |
| **커버리지 추세를 추적** | 절대 수치보다 방향이 중요 |
| **커버리지가 낮은 이유를 구분** | React 컴포넌트 → E2E 영역, 순수 함수 → unit 영역 |
| **uncoveredLines 확인** | % 보다 "어떤 라인이 빠졌나"가 더 유용 |

### ❌ Don't

| Anti-Pattern | 이유 |
|:-------------|:-----|
| **100% 맹목 추구** | 테스트 유지보수 비용 > 한계 효용 |
| **커버리지 = 품질로 착각** | `expect(true).toBe(true)` 도 커버리지 올림 |
| **Istanbul + V8 혼용** | 소스맵 매핑 충돌 위험 |
| **E2E에서 커버리지 측정** | 번들된 코드라 소스맵 정확도 떨어짐 |

## 흥미로운 이야기들

### V8이 "공짜로" 커버리지를 쓸 수 있는 이유

V8 블로그에 따르면, 함수 호출 카운터는 원래 **JIT 인라이닝 결정**을 위해 존재했다. 소스 범위는 `Function.prototype.toString()`을 위해 존재했다. 커버리지 팀은 이미 있는 데이터를 그냥 읽기만 하면 됐다. "We got lucky" — V8 팀의 표현.

### 왜 Precise mode에서 최적화를 끄는가

TurboFan(V8의 최적화 컴파일러)은 핫 함수를 기계어로 컴파일하는데, 이 과정에서 invocation counter 증가 코드를 제거한다(성능!). 그래서 Precise coverage mode에서는 **의도적으로 최적화를 비활성화**한다. 테스트할 때 느려지는 이유가 여기 있다.

### Block coverage의 `IncBlockCounter`

V8은 if-else의 then/else 각각에 `IncBlockCounter`를 삽입하는데, **if-else 전체 이후에도 하나 더** 삽입한다 (continuation counter). 이유: then 내부에서 `return`이나 `throw`로 빠져나가면, else가 실행됐는지 continuation이 실행됐는지로 분기 커버리지를 구분할 수 있다.

### Istanbul의 `__coverage__` 표준

Istanbul이 만든 `__coverage__` 포맷은 사실상 JavaScript 커버리지의 표준이 됐다. V8조차 자체 형식으로 수집하지만, 결국 `v8-to-istanbul`로 이 포맷에 맞춘다. 도구 생태계의 관성.

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|:-----|:-----|:-----|:------:|:----:|
| V8 커버리지 내부 구현 | 엔진 수준 이해 | [v8.dev/blog/javascript-code-coverage](https://v8.dev/blog/javascript-code-coverage) | ★★★ | 30m |
| Istanbul 설계 문서 | AST 변환 이해 | [github.com/istanbuljs/istanbuljs](https://github.com/istanbuljs/istanbuljs) | ★★☆ | 1h |
| Vitest Coverage 공식 문서 | 프로젝트 설정 | [vitest.dev/guide/coverage](https://vitest.dev/guide/coverage) | ★☆☆ | 15m |
| V8 Block Coverage Design Doc | bytecode 수준 | [goo.gl/hSJhXn](https://goo.gl/hSJhXn) | ★★★★ | 1h |
| Source Map Spec | 번들 → 원본 매핑 | [sourcemaps.info/spec.html](https://sourcemaps.info/spec.html) | ★★★ | 45m |
