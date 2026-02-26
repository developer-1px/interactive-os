---
last-reviewed: 2026-02-21
---

# React 렌더링 without Browser — 브라우저 없이 React 산출물을 얻는 방법들

> React의 VDOM은 JS 객체다. 브라우저 없이도 렌더 결과를 얻고, 검색하고, 검증할 수 있다.

## 왜 이 주제인가

Interaction OS의 headless 테스트는 커맨드 파이프라인과 state 정확성을 검증하지만, **투영(projection) 레이어** — 즉 "state가 맞을 때 DOM이 실제로 나오는가" — 는 검증 범위 밖이었다. `createCompoundTrigger`에서 `Dialog.Content`를 래핑하면서 reference identity가 깨지는 버그가 대표적인 사례로, state는 100% 정확하지만 `<dialog>`가 DOM에 나타나지 않았다.

이 버그를 headless에서 감지하려면 "React를 브라우저 없이 1회 렌더하고 결과를 검사"하는 매커니즘이 필요하다. 이 문서는 그 가능한 방법들을 정리한다.

## Background / Context

React의 렌더링은 3단계로 나뉜다:

```
1. createElement    → React Element (JS 객체, 불변, 선언적)
2. Reconciliation   → Fiber Tree (내부 구조, 가변, 링크드 리스트)
3. Commit           → DOM 변경 (브라우저에서만)
```

- **1단계**는 어디서든 실행 가능 — `React.createElement(div, null, "hello")`는 무려 `{ type: 'div', props: { children: 'hello' } }` 일 뿐이다.
- **2단계**는 React의 reconciler가 필요 — hooks가 실행되고, state가 읽히고, 조건부 렌더가 결정된다.
- **3단계**만 브라우저가 필요 — `document.createElement`, `node.appendChild` 등.

핵심: **2단계까지만 실행하면 브라우저 없이 렌더 결과를 얻을 수 있다.**

## Core Concept: 5가지 방법

### 1. `renderToString` (react-dom/server)

```typescript
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';

const html = renderToString(createElement(MyComponent));
// → '<div class="container"><dialog aria-label="Delete">...</dialog></div>'
```

| 항목 | 내용 |
|------|------|
| **출력** | HTML 문자열 |
| **hooks 지원** | `useState` ✅, `useSyncExternalStore` ✅, `useEffect` ❌ (SSR이라 no-op) |
| **추가 의존성** | 없음 (`react-dom`에 포함) |
| **질의 방법** | 문자열 검색, 정규식, 또는 HTML 파서 (Cheerio 등) |
| **적합한 용례** | "이 엘리먼트가 존재하는가?"의 간단한 검증 |

**장점**: 추가 설치 없음. 동기 함수. 매우 빠름.
**단점**: 결과가 문자열이라 props 검증이 까다로움. CSS 셀렉터 사용 불가.

**Cheerio와 조합하면 객체처럼 사용 가능**:
```typescript
import { load } from 'cheerio';
const $ = load(html);
$('dialog[role="alertdialog"]').length  // → 1
$('dialog').attr('aria-label')          // → "Delete items?"
```

### 2. `react-test-renderer`

```typescript
import TestRenderer from 'react-test-renderer';

const tree = TestRenderer.create(createElement(MyComponent));
const json = tree.toJSON();
// → { type: 'div', props: { className: '...' }, children: [...] }

tree.root.findAllByType('dialog');           // 타입으로 검색
tree.root.findAllByProps({ role: 'alertdialog' }); // props로 검색
```

| 항목 | 내용 |
|------|------|
| **출력** | JS 객체 트리 |
| **hooks 지원** | 모든 hooks ✅ (`useEffect` 포함) |
| **추가 의존성** | `react-test-renderer` 패키지 |
| **질의 방법** | `findByType`, `findByProps`, `findAll` — 객체 순회 |
| **적합한 용례** | "이 props를 가진 엘리먼트가 존재하는가?"의 정밀 검증 |

**장점**: 결과가 객체라 props 접근이 자연스러움. DOM 불필요.
**단점**: ⚠️ **React 19에서 deprecated**. React 팀이 유지보수 중단 예정.

### 3. JSDOM + `react-dom`

```typescript
// Vitest/Jest 환경 설정에서 environment: 'jsdom'
import { render } from '@testing-library/react';

const { container } = render(createElement(MyComponent));
container.querySelector('dialog[role="alertdialog"]'); // CSS 셀렉터 사용 가능
```

| 항목 | 내용 |
|------|------|
| **출력** | 가짜 DOM 객체 (JavaScript 구현) |
| **hooks 지원** | 모든 hooks ✅ |
| **추가 의존성** | `jsdom` (~11MB) |
| **질의 방법** | 표준 DOM API — `querySelector`, `getAttribute` 등 |
| **적합한 용례** | "브라우저와 동일한 방식으로" 검증 |

**장점**: CSS 셀렉터 사용 가능. 가장 자연스러운 DOM 질의.
**단점**: 가장 무거움. 브라우저 환경 전체를 시뮬레이션.

### 4. happy-dom + `react-dom`

```typescript
// Vitest: environment: 'happy-dom'
import { render } from '@testing-library/react';
// 사용법은 JSDOM과 동일
```

| 항목 | 내용 |
|------|------|
| **출력** | 가짜 DOM 객체 (경량 구현) |
| **크기** | ~2MB (JSDOM의 1/5) |
| **속도** | JSDOM보다 2~3배 빠름 |

**장점**: JSDOM의 경량 버전. Vitest 공식 지원 환경.
**단점**: 일부 고급 DOM API 미지원. `byRole` 쿼리 성능 이슈 보고 있음.

### 5. linkedom

```typescript
import { parseHTML } from 'linkedom';

const html = renderToString(createElement(MyComponent));
const { document } = parseHTML(html);
document.querySelector('dialog[role="alertdialog"]'); // CSS 셀렉터 가능
```

| 항목 | 내용 |
|------|------|
| **출력** | 경량 DOM 객체 (triple-linked list 기반) |
| **크기** | 매우 작음 |
| **접근** | HTML 문자열을 파싱해서 DOM 객체로 변환 |

**장점**: 가장 가볍고 빠름. SSR 용도로 설계됨.
**단점**: 이벤트 모델 없음. React의 reconciler와 직접 통합 불가.

## Usage: 프로젝트에 적용하기

### 최소 비용 방법 (권장 — A안)

```typescript
// os/headless.ts 또는 defineApp.page.ts 확장
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';

function createProjectionCheckpoint(Component: React.FC) {
    return {
        query(search: string): boolean {
            const html = renderToString(createElement(Component));
            return html.includes(search);
        },
        queryAll(pattern: RegExp): string[] {
            const html = renderToString(createElement(Component));
            return html.match(pattern) ?? [];
        },
        html(): string {
            return renderToString(createElement(Component));
        }
    };
}
```

### Cheerio 조합 (CSS 셀렉터 필요 시)

```typescript
import { load } from 'cheerio';

function createProjectionCheckpoint(Component: React.FC) {
    return {
        query(selector: string) {
            const html = renderToString(createElement(Component));
            const $ = load(html);
            return $(selector).length > 0;
        },
        queryAll(selector: string) {
            const html = renderToString(createElement(Component));
            const $ = load(html);
            return $(selector).toArray();
        }
    };
}
```

## Best Practice + Anti-Pattern

### ✅ Do

| Practice | 이유 |
|----------|------|
| `renderToString`의 `getServerSnapshot` 제공 | `useSyncExternalStore`의 3번째 인자. SSR에서 state를 읽으려면 필수 |
| 투영 검증은 **선택적 checkpoint**로 | 모든 테스트에 render를 넣으면 headless의 속도 이점이 사라짐 |
| `useEffect`에 의존하는 로직은 투영 검증 대상에서 제외 | `renderToString`에서 `useEffect`는 실행 안 됨 |
| HTML 파싱이 필요하면 Cheerio 또는 linkedom 사용 | 정규식보다 안정적 |

### ❌ Don't

| Anti-Pattern | 이유 |
|--------------|------|
| `react-test-renderer`에 의존하지 마라 | React 19에서 deprecated. 미래 보장 없음 |
| 모든 테스트를 렌더 기반으로 만들지 마라 | headless의 순수성과 속도를 잃음 |
| VDOM 내부 구조(Fiber)에 의존하지 마라 | `child`, `sibling`, `return` 은 React 내부 API — 버전 간 보장 없음 |
| `renderToString` 결과로 스타일/레이아웃 검증하지 마라 | CSS는 적용 안 됨. 구조적 존재만 확인 가능 |

## 흥미로운 이야기들

### React의 두 번째 reconciler는 잊혀진 존재

`react-test-renderer`는 `react-dom`과 별개의 reconciler입니다. React 팀은 이것을 유지하기 싫어서 deprecated 시켰는데, 사실 "DOM 없이 React를 돌리는 유일한 공식 경로"였습니다. React 19에서 이것이 사라지면, 남는 건 `renderToString`뿐입니다.

### Fiber Tree는 JSON이 아니다

React의 Fiber는 `child → sibling → return` 으로 연결된 **링크드 리스트**입니다. "트리"라 부르지만 실제로는 첫 번째 자식만 `child`로 연결하고 나머지는 `sibling` 체인입니다. 이건 React가 렌더링을 **중단하고 재개**할 수 있게 해주는 핵심 구조입니다. 하지만 테스트에서 이 구조에 직접 접근하는 건 위험합니다 — React 내부 API이고 버전 간 보장이 없습니다.

### Cheerio의 탄생

Cheerio는 원래 "서버에서 웹 스크래핑"을 위해 만들어졌습니다. jQuery의 API를 Node.js에서 쓸 수 있게 한 거죠. 그런데 지금은 "React SSR 결과를 검사하는 도구"로도 쓰입니다. 공식 React 팀이 `react-test-renderer` 대안으로 "Cheerio로 파싱하라"고 제안했을 정도입니다.

### 왜 happy-dom이 JSDOM보다 빠를까

JSDOM은 W3C 표준을 충실히 구현합니다 — CSS 파싱, MutationObserver, Range API 등 대부분의 브라우저 API를 지원합니다. happy-dom은 이 중 테스트에 **자주 쓰이는 것만** 구현합니다. 이 "80/20 전략"이 2~5배의 속도 차이를 만듭니다. 하지만 대가가 있습니다 — 복잡한 DOM 조작이나 `byRole` 쿼리에서 때때로 예상치 못한 성능 저하가 보고됩니다.

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|------|------|------|:------:|:----:|
| React Server Rendering API | `renderToString`의 동작 원리와 한계 | [React 공식 문서](https://react.dev/reference/react-dom/server/renderToString) | ★★ | 30분 |
| Cheerio 기본 사용법 | HTML 파싱 + CSS 셀렉터 질의 | [Cheerio GitHub](https://github.com/cheeriojs/cheerio) | ★ | 20분 |
| React Fiber 아키텍처 | VDOM의 내부 구조 이해 | [React Fiber Architecture (acdlite)](https://github.com/acdlite/react-fiber-architecture) | ★★★ | 1시간 |
| happy-dom vs JSDOM 비교 | 경량 DOM 구현체의 trade-off | [Steve Kinney 비교글](https://stevekinney.com) | ★★ | 30분 |
| React 19 변경사항 | deprecated API와 새 SSR API (prerender) | [React 19 Blog](https://react.dev/blog) | ★★★ | 45분 |
