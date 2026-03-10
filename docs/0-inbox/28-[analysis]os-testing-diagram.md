# os-testing 아키텍처 다이어그램

> 작성일: 2026-03-11
> 목적: `os-devtool → os-testing` 분리 후 테스팅 패키지의 모듈 관계와 데이터 흐름을 시각화

## 1. 패키지 분리 구조

두 패키지의 책임 경계를 보여준다. `@os-testing`은 headless(순수 함수), `@os-devtool/testing`은 browser-only.

```mermaid
graph TB
  subgraph "@os-testing (headless)"
    direction TB
    createPage["createPage()"]
    expect["expect()"]
    runScenarios["runScenarios()"]
    simulate["simulate"]
    scripts["scripts (TestScript[])"]
    zoneItems["zoneItems"]
    types["types (Page, Locator)"]

    subgraph "lib/"
      setupEnv["setupHeadlessEnv"]
      zoneSetup["zoneSetup"]
      projection["projection"]
      locator["locator"]
      typeField["typeIntoField"]
    end
  end

  subgraph "@os-devtool/testing (browser)"
    direction TB
    createBrowserPage["createBrowserPage()"]
    TestBotRegistry["TestBotRegistry"]
  end

  createPage --> setupEnv
  createPage --> zoneSetup
  createPage --> projection
  createPage --> locator
  createPage --> typeField
  createPage --> simulate
  createPage --> types

  runScenarios --> createPage
  runScenarios --> expect
  runScenarios --> scripts
  runScenarios --> zoneItems

  TestBotRegistry -.->|"import TestScript"| scripts
  createBrowserPage -.->|"shares types"| types
```

## 2. createPage 내부 흐름

테스트의 유일한 API인 `page`가 어떻게 조립되는지 보여준다.

```mermaid
flowchart LR
  subgraph "createPage(app, Component?)"
    direction TB
    A["setupHeadlessEnv(keybindings)"] --> B["registerZones(bindings)"]
    B --> C["seedInitialState(zones)"]
    C --> D["createProjection(Component)"]
    D --> E["Page 객체 조립"]
  end

  subgraph "Page API"
    direction TB
    goto["goto(url)"]
    click["click(selector)"]
    press["keyboard.press(key)"]
    type["keyboard.type(text)"]
    loc["locator(selector)"]
    content["content()"]
  end

  E --> goto
  E --> click
  E --> press
  E --> type
  E --> loc
  E --> content

  click -->|"simulateClick"| SIM["simulate.ts"]
  press -->|"simulateKeyPress"| SIM
  loc -->|"createLocator"| LOC["locator.ts"]
  type -->|"typeIntoField"| TIF["typeIntoField.ts"]
  content -->|"render()"| PROJ["projection.ts"]
```

## 3. Isomorphism — 3환경 동일 스크립트

`TestScript.run(page, expect)` 하나로 3개 환경에서 동일하게 실행된다.

```mermaid
flowchart TB
  TS["TestScript.run(page, expect, items?)"]

  subgraph "1. Headless (vitest)"
    HP["createPage() → Page"]
    HE["@os-testing expect()"]
  end

  subgraph "2. Browser (Inspector)"
    BP["createBrowserPage() → Page"]
    BE["@os-testing expect()"]
  end

  subgraph "3. Playwright E2E"
    PP["native page"]
    PE["@playwright/test expect()"]
  end

  TS --> HP
  TS --> BP
  TS --> PP
  TS -.->|"inject"| HE
  TS -.->|"inject"| BE
  TS -.->|"inject"| PE
```

## 4. simulate.ts — OS Pipeline 진입점

headless에서 사용자 입력이 OS 커맨드로 변환되는 경로.

```mermaid
flowchart LR
  subgraph "simulateKeyPress"
    K1["normalizeKey"] --> K2["clipboardShim?"]
    K2 -->|"yes"| K3["dispatch OS_COPY/CUT/PASTE"]
    K2 -->|"no"| K4["overlayFocusTrap?"]
    K4 -->|"blocked"| K5["return (NOOP)"]
    K4 -->|"pass"| K6["buildKeyboardInput"]
    K6 --> K7["resolveKeyboard"]
    K7 --> K8["dispatchResult"]
  end

  subgraph "simulateClick"
    C1["findItemCallback"] --> C2{"trigger only?"}
    C2 -->|"standalone"| C3["dispatch onActivate"]
    C2 -->|"zone item"| C4["resolveMouse"]
    C4 --> C5["resolveClick"]
    C5 --> C6["dispatchResult"]
    C6 --> C7["trigger onActivate (후순위)"]
  end
```

## 5. 의존성 계층

패키지 간 import 방향. 화살표 = import 방향.

```mermaid
graph BT
  subgraph "Tests (vitest / e2e)"
    T["tests/**/*.test.ts"]
  end

  subgraph "Apps"
    APP["src/apps/*/app.ts"]
  end

  subgraph "Packages"
    OT["@os-testing"]
    OD["@os-devtool/testing"]
    SDK["@os-sdk"]
    CORE["@os-core"]
    K["@kernel"]
  end

  T --> OT
  T --> APP
  OT --> CORE
  OT --> SDK
  OD --> OT
  OD --> CORE
  SDK --> CORE
  CORE --> K
  APP --> SDK
```

## 범례

| 기호 | 의미 |
|------|------|
| `→` 실선 | 직접 import / 호출 |
| `-.->` 점선 | 타입 공유 / 런타임 주입 |
| subgraph | 패키지 또는 모듈 경계 |
| `?` 분기 | 조건부 경로 |
