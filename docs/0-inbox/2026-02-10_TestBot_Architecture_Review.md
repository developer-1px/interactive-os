# TestBot 아키텍처 개선 제안: 런타임 시각화의 우아한 해결책

**날짜**: 2026-02-10
**작성자**: Antigravity
**주제**: Playwright e2e 테스트의 런타임 시각화(TestBot) 구조 개선

---

## 1. 개요 (Overview)
현재 `TestBot`은 Playwright의 e2e 테스트 코드(`.spec.ts`)를 브라우저 내에서 직접 import하여 실행하고 시각화하는 독창적인 기능을 제공합니다. 그러나 `.spec.ts` 파일은 본래 Node.js 환경에서 실행되도록 설계된 파일이기 때문에, 이를 브라우저 번들에 포함시키는 과정에서 다음과 같은 "마찰(Friction)"이 발생하고 있습니다:

1.  **TypeScript 오류**: Node.js 모듈(Playwright)을 import하는 파일을 브라우저 코드에서 참조하므로 타입 해석이 꼬임 (예: `default export` 부재).
2.  **빌드 복잡성**: Vite 플러그인을 사용하여 런타임에 코드를 변환(Wrap)해야 하며, 이 과정이 불투명함.
3.  **Shim 유지보수**: Playwright API(`page.click`, `expect` 등)를 브라우저에서 흉내내기 위한 `shim` 계층의 복잡도가 증가함.

이 제안서는 이러한 마찰을 제거하고, "런타임 시각화"라는 핵심 가치를 더 우아하게 달성하기 위한 세 가지 아키텍처를 제안합니다.

---

## 2. 제안 (Options)

### Option A: Isomorphic Action Pattern (공유 액션 패턴)
테스트 시나리오의 **행위(Action)**와 **환경(Environment)**을 분리합니다.

-   **구조**:
    -   `my-feature.actions.ts`: 순수 함수로 정의된 테스트 시나리오. `PageAdapter` 인터페이스에 의존.
    -   `my-feature.spec.ts`: Playwright `test()` 안에서 `actions`를 호출.
    -   `MyFeaturePage.tsx` (TestBot): `TestBot` shim을 주입하여 `actions`를 호출.

-   **장점**:
    -   Node.js 의존성 제거 (브라우저는 `actions.ts`만 import).
    -   TypeScript 완전 호환.
    -   점진적 적용 가능.
-   **단점**:
    -   기존 `.spec.ts`를 분리하는 리팩토링 비용 발생.
    -   여전히 `shim` 구현은 필요함.

### Option B: Build-time Transpilation (빌드 타임 변환)
`.spec.ts` 파일을 소스 코드로 취급하지 않고, **데이터 소스**로 취급합니다.

-   **구조**:
    -   **Compiler Plugin**: 빌드 시점에 `.spec.ts`를 AST 파싱하여, 테스트 단계(Step)와 메타데이터가 담긴 `myt-feature.scenarios.json` (또는 JS) 파일을 생성.
    -   **TestBot**: 생성된 시나리오 데이터를 읽어서 플레이어처럼 재생.

-   **장점**:
    -   개발자는 표준 `.spec.ts`만 작성하면 됨 (DX 최상).
    -   런타임 의존성 완벽 제거.
-   **단점**:
    -   Playwright의 복잡한 로직(조건문, 루프 등)을 JSON으로 표현하기엔 한계가 있음 (단순 선형 시나리오만 가능).
    -   AST 파서 구현 난이도가 높음.

### Option C: Remote Control Architecture (원격 제어)
브라우저가 테스트를 "실행"하는 것이 아니라, "중계"만 합니다.

-   **구조**:
    -   **Runner (Node.js)**: 실제 Playwright가 Headless/Headed 모드로 실행됨.
    -   **TestBot (Browser)**: Runner와 WebSocket으로 연결됨.
    -   **Flow**:
        1.  Runner가 `page.click('#btn')`을 실행하려 함.
        2.  Runner -> WebSocket -> TestBot: "하이라이트 #btn, 클릭 대기 중"
        3.  TestBot 화면에 시각화.
        4.  Runner가 실제 클릭 수행.

-   **장점**:
    -   **완벽한 격리**: 브라우저는 Node.js 코드를 몰라도 됨.
    -   **기능 제약 없음**: Playwright의 모든 기능(네트워크 제어, 다중 컨텍스트 등) 사용 가능.
    -   `shim` 구현 불필요.
-   **단점**:
    -   아키텍처 복잡도 증가 (별도의 Runner 프로세스 및 서버 필요).
    -   네트워크 레이턴시로 인한 미세한 딜레이.

---

## 3. 결론 및 추천

**추천: Option A (Isomorphic Actions)로 시작하여 Option C (Remote Control)로 발전**

1.  **단기적 (Isomorphic Actions)**:
    -   당장의 TS 에러와 빌드 문제를 해결하기 위해, 테스트 로직을 분리하는 패턴을 도입합니다.
    -   `TestBot`이 `.spec.ts`를 직접 import하는 것을 금지하고, `actions.ts`를 공유하는 방식으로 전환합니다.
    -   이는 리팩토링 비용이 들지만 가장 안전하고 확실한 방법입니다.

2.  **장기적 (Remote Control)**:
    -   `TestBot`이 단순한 시각화 도구를 넘어 "Playwright GUI Runner"로 진화하려면, 실제 실행은 Node.js에 위임해야 합니다.
    -   VS Code의 Playwright 확장 프로그램과 유사한 구조입니다.

### 실행 계획 (Action Plan)
1.  **POC (Proof of Concept)**: `Login` 또는 `Todo` 기능 하나를 `actions.ts`로 분리하여 Option A 구조 검증.
2.  **Workflow Update**: 테스트 작성 시 `actions` 분리를 강제하는 린트 룰이나 가이드 마련.
3.  **Shim 강화**: `shim`을 `Isomorphic Interface`에 맞춰 재정비.

이 제안이 승인되면 `docs/1-project/testbot-refactor` 계획을 수립하겠습니다.
