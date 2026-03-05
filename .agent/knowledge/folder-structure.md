# 폴더 구조 원칙 — 불변 로직 트리

> 폴더 구조 판단이 필요할 때 이 문서를 참조한다.

## 로직 트리 (분류 규칙)

새 코드를 OS 패키지에 추가할 때, 아래 질문을 **순서대로** 적용한다:

```
Q1. 어느 패키지에 속하는가?
    ├── os-core      순수 로직 (DOM 무관)
    ├── os-react     React 바인딩 (Listeners, 컴포넌트)
    ├── os-sdk       앱 개발 API (defineApp, modules)
    └── os-devtool   테스트·디버그 도구

Q2. os-core 내 FE 데이터 흐름의 어느 단계인가?
    ├── 1-listen     DOMEvent → TypedInput
    ├── 2-resolve    TypedInput → OSCommand
    ├── 3-inject     DOM → Context Snapshots
    ├── 4-command    OSCommand + Context → NextState + Effects
    └── None → Q3로

Q3. 변경 안정도는? (os-core 인프라)
    ├── Schema    → schema/ (types, state)
    ├── Engine    → engine/ (kernel, registries, middlewares)
    └── Library   → (headless, collection 등)
```

Q1~Q3는 모두 **코드 속성에서 기계적으로 답할 수 있는** 질문이다.

## 현재 구조

```
packages/
├── os-core/src/        순수 로직 (4 패키지 중 핵심)
│   ├── 1-listen/       Pipeline: Event Capture (sense 함수)
│   ├── 2-resolve/      Pipeline: Intent Resolution
│   ├── 3-inject/       Pipeline: Context Injection
│   ├── 4-command/      Pipeline: State Computation
│   ├── engine/         Infrastructure (registries, middlewares)
│   └── schema/         Types, State
├── os-react/src/       React 바인딩
│   ├── 1-listen/       React Listeners (Keyboard, Pointer, Clipboard)
│   └── 6-project/      React 컴포넌트 (Zone, Item, Trigger, Field)
├── os-sdk/src/         앱 개발 API
│   ├── app/            defineApp, modules
│   └── library/        collection 등
└── os-devtool/src/     테스트·디버그
    └── testing/        createOsPage, createHeadlessPage
```

## 4-Lens Stack (충돌 해소)

폴더 구조는 4개 렌즈를 **순서대로** 만족해야 한다. 충돌 시 상위 렌즈가 이긴다.

```
1. Flow       — 데이터가 어디서 어디로 가는가?      (골격)
2. Dependency — 누가 누구에 의존하는가?             (면역)
3. Concept    — 어떤 개념에 속하는가?               (근육)
4. Topology   — 같은 레벨 형제가 같은 성격인가?     (피부)
```

## 허용된 긴장

| 긴장 | 렌즈 | 해소 |
|------|------|------|
| `3-inject` 개념적으로 command에 종속 | Flow > Concept | Flow 우선: inject는 독립 파이프라인 단계 |
| `5-effect` vs `6-project` 둘 다 "투영" | Flow | 명령형(effect) vs 선언형(project) — FE 불변 이분법 |
| `core/` 내부 4개 하위 분류 | Topology | Q4(안정도)로 해소, Stable Dependencies Principle |
