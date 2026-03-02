# 폴더 구조 원칙 — 불변 로직 트리

> 폴더 구조 판단이 필요할 때 이 문서를 참조한다.

## 로직 트리 (분류 규칙)

새 코드를 `src/os/`에 추가할 때, 아래 질문을 **순서대로** 적용한다:

```
Q1. FE 데이터 흐름의 어느 단계에 속하는가?
    ├── 1 listen     DOMEvent → TypedInput
    ├── 2 resolve    TypedInput → OSCommand
    ├── 3 inject     DOM → Context Snapshots
    ├── 4 command    OSCommand + Context → NextState + Effects
    ├── 5 effect     Effects → DOM mutations
    ├── 6 project    NextState → DOM attributes (ZIFT)
    └── None → Q2로

Q2. 앱의 선언적 진입점인가? (defineApp 시그니처에 등장)
    ├── YES → app/ (defineApp + modules)
    └── NO → Q3로

Q3. 테스트 전용 코드인가?
    ├── YES → testing/
    └── NO → core/ → Q4로

Q4. 변경 안정도는? (core 내부)
    ├── Schema    → schema/ (types, state)
    ├── Engine    → engine/ (kernel, registries, middlewares)
    ├── Library   → library/ (headless, collection)
    └── Adapter   → adapter/ (widgets)
```

Q1~Q4는 모두 **코드 속성에서 기계적으로 답할 수 있는** 질문이다.

## 현재 구조

```
src/os/ (9 folders)
├── 1-listen/      Pipeline: Event Capture
├── 2-resolve/     Pipeline: Intent Resolution
├── 3-inject/      Pipeline: Context Injection
├── 4-command/     Pipeline: State Computation
├── 5-effect/      Pipeline: Side Effects
├── 6-project/     Pipeline: Declarative Projection (ZIFT)
├── app/           App Framework
│   ├── defineApp/
│   └── modules/
├── core/          Infrastructure
│   ├── schema/    (types, state)
│   ├── engine/    (kernel, appState, registries, middlewares)
│   ├── library/   (headless, collection)
│   └── adapter/   (widgets)
└── testing/       Verification
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
