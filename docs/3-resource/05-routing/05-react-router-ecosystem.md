---
last-reviewed: 2026-02-10
---

# React 라우팅 생태계 완전 정복

> 10년간의 라우팅 전쟁: 설정 파일에서 타입 안전 URL 상태 관리까지.
>
> 🔗 **관련**: [라우터의 개념적 진화사](./06-router-conceptual-evolution.md) | [TanStack Router Philosophy](../00-guides/tanstack-router-philosophy.md) | [TanStack Router MECE 분해](./07-tanstack-router-mece.md)

## 왜 이 주제인가

우리는 `@os/router`를 OS의 1급 모듈로 제공하려 한다. 어떤 라우터를 내부에 쓸지, 어떤 철학을 따를지 결정하려면 **전체 생태계의 지형도**를 먼저 알아야 한다. 이 문서는 React 세계의 모든 라우팅 솔루션을 조사하고, 각각의 철학·장단점·역사를 정리한다.

---

## 1. React Router — 왕좌의 10년

React 생태계에서 가장 오래되고 가장 많이 쓰이는 라우터. **버전마다 철학이 바뀌었다**는 점이 핵심이다.

### v1–v3: 정적 설정 시대 (2014–2017)

```javascript
// v3 스타일: 중앙집중 설정
<Router history={browserHistory}>
  <Route path="/" component={App}>
    <Route path="about" component={About} />
    <Route path="users" component={Users} />
  </Route>
</Router>
```

- **철학**: 서버 사이드 프레임워크(Rails, Express) 스타일. 라우트를 한 곳에 선언.
- **특징**: `onEnter` 가드, 중앙집중 설정 파일, `history` 패키지 의존.
- **한계**: React의 "컴포넌트가 전부" 철학과 충돌. 라우트가 컴포넌트 트리와 분리됨.

### v4: 대격변 — "Everything is a Component" (2017)

```jsx
// v4: 라우트가 곧 컴포넌트
function App() {
  return (
    <BrowserRouter>
      <Route path="/about" component={About} />
      <Route path="/users" component={Users} />
    </BrowserRouter>
  )
}
```

- **철학 전환**: 정적 설정 → **동적 컴포넌트 기반**. "라우트는 특별하지 않다, 그냥 컴포넌트다."
- **논란**: v3에서 v4로의 마이그레이션이 **거의 전면 재작성** 수준. 커뮤니티 반발이 컸음.
- **핵심 변화**: `react-router` → `react-router-dom` 분리, inclusive routing (여러 Route 동시 매칭).
- **교훈**: 라이브러리의 급격한 철학 변경은 생태계 신뢰를 훼손할 수 있다.

### v5: 안정기 (2019)

- v4와 **100% 호환**. 코드 변경 0으로 업그레이드 가능.
- React 16 지원 강화, `StrictMode` 경고 제거.
- **의미**: "우리가 v4에서 너무 급했다. 이번엔 쉬어가자."

### v6: 정리의 시대 (2021)

```jsx
// v6: element prop, Routes 컴포넌트
<Routes>
  <Route path="/about" element={<About />} />
  <Route path="/users" element={<Users />} />
</Routes>
```

- **`Switch` → `Routes`**: 매칭 알고리즘 개선, `exact` prop 불필요.
- **Hooks 전면 도입**: `useNavigate` (← `useHistory`), `useParams`, `useSearchParams`.
- **번들 58% 축소**: v5 대비 절반 크기.
- **상대 경로**: `<Link to>` 가 부모 라우트 기준 상대 경로.

### v7: 프레임워크가 되다 (2024–2025)

```typescript
// v7 Framework Mode: loader + action
export async function loader({ params }) {
  return fetchUser(params.userId)
}

export async function action({ request }) {
  const formData = await request.formData()
  return updateUser(formData)
}
```

- **Remix 흡수**: Remix 팀이 React Router 팀에 합류. Remix의 `loader`/`action` 패턴이 React Router에 내장.
- **2가지 모드**: 
  - **Library Mode**: 기존 SPA용 클라이언트 라우터
  - **Framework Mode**: SSR, file-based routing, data loading — 사실상 Next.js 경쟁자
- **`react-router-dom` deprecated**: `react-router`에서 직접 import 권장.
- **TypeScript 강화**: 라우트 파라미터, loader 데이터에 타입 추론.

> **10년의 교훈**: React Router는 "라우팅이란 무엇인가"에 대해 4번 마음을 바꿨다. 설정 → 컴포넌트 → Hooks → 프레임워크.

---

## 2. TanStack Router — 타입 안전의 끝판왕

> 이미 [별도 문서](../00-guides/tanstack-router-philosophy.md)에서 심층 분석. 여기선 비교 관점으로.

- **창시자**: Tanner Linsley (TanStack Query 제작자)
- **핵심 차별점**: **100% 타입 추론** — 라우트 경로, params, search params 모두 컴파일 타임 검증.
- **Search Params = State**: URL 쿼리를 Zod 스키마로 검증하여 전역 상태처럼 사용.
- **TanStack Query 통합**: `loader`에서 Query를 직접 사용, 캐싱+프리페칭 자동.
- **File-based + Code-based**: 둘 다 지원, 선택 가능.

**vs React Router v7**:
| | React Router v7 | TanStack Router |
|:--|:--|:--|
| 타입 안전 | 개선됨 (v7) | **네이티브, 완벽** |
| 데이터 로딩 | loader/action (Remix 스타일) | loader + TanStack Query |
| Search Params | `useSearchParams` (문자열) | **스키마 검증 + 타입 추론** |
| SSR | Framework Mode 지원 | TanStack Start (별도) |
| 성숙도 | 10년+ | 2년 (빠르게 성장 중) |

---

## 3. Wouter — 미니멀리즘의 극단

```jsx
import { Route, Link } from 'wouter'

<Link href="/about">About</Link>
<Route path="/about" component={About} />
```

- **크기**: **~1KB** gzipped (React Router의 1/20)
- **의존성**: 0개
- **철학**: "라우터는 복잡할 필요 없다." Hook 기반의 최소한의 API.
- **Preact 지원**: React뿐 아니라 Preact에서도 동작.
- **한계**: Search params, data loading, 타입 안전 등 고급 기능 없음.
- **적합한 곳**: 프로토타입, 위젯, 임베드 앱 등 경량 프로젝트.

---

## 4. Reach Router — 접근성 우선 (은퇴)

- **창시자**: Ryan Florence (React Router 공동 제작자)
- **핵심 철학**: **접근성이 라우터의 기본 책임**이다.
- **혁신**: 라우트 전환 시 자동으로 새 콘텐츠에 포커스 이동, 스크린리더 announce.
- **운명**: React Router v6에 합류하여 **공식 후계자에 흡수됨**.
- **교훈**: 접근성을 라우터 레벨에서 해결한다는 아이디어는 **우리 `@os/router`의 직접적 선례**.

> 🔥 **우리에게 중요**: Reach Router가 시도한 "라우트 전환 시 포커스 자동 관리"는 정확히 우리가 `@os/router`에서 하려는 것이다!

---

## 5. Generouted — File-System Routing 어댑터

```
src/pages/
  index.tsx        → /
  about.tsx        → /about
  posts/
    [id].tsx       → /posts/:id
```

- **정체**: 독립 라우터가 아닌, **React Router 또는 TanStack Router 위에 올리는 래퍼**.
- **영감**: Next.js의 파일 기반 라우팅을 **프레임워크 없이** SPA에서 사용.
- **장점**: Convention over Configuration. 파일만 만들면 라우트 자동 생성.
- **한계**: 래퍼이므로 기반 라우터의 기능에 의존.

---

## 6. Next.js Router — 프레임워크 내장 라우터

### Pages Router (레거시)
- `pages/` 디렉토리 기반. 파일 = 라우트.
- `getServerSideProps`, `getStaticProps`로 서버 사이드 데이터 페칭.
- 레이아웃은 `_app.js`로 우회 구현.

### App Router (현재 권장, Next.js 13+)
- `app/` 디렉토리 기반. **폴더 = 라우트**, `page.tsx` = UI.
- **React Server Components (RSC)** 기본: 컴포넌트가 기본으로 서버에서 실행.
- `layout.tsx`로 중첩 레이아웃 네이티브 지원.
- `loading.tsx`, `error.tsx`로 로딩/에러 상태 자동 처리.
- Streaming + Suspense 기본 지원.

### 우리와의 관계
Next.js는 **풀스택 프레임워크**의 맥락에서 라우팅을 해결한다. 우리 OS는 **클라이언트 사이드 인터랙션 프레임워크**이므로 직접 경쟁하지 않지만, Next.js 안에서 우리 OS를 쓸 수는 있다.

---

## 7. 기타 솔루션

| 라우터 | 크기 | 특징 | 상태 |
|:--|:--|:--|:--|
| **React Mini Router** | ~4KB | 최소 기능, 간단한 앱용 | 유지보수 중 |
| **Router-Kit** | 경량 | "에코 프렌들리" 철학, 2025년 신규 | 초기 |
| **Custom (History API)** | 0KB | `useSyncExternalStore` + `popstate` 직접 구현 | — |

---

## 전체 비교표

| | React Router v7 | TanStack Router | Wouter | Next.js App Router |
|:--|:--|:--|:--|:--|
| **철학** | 프레임워크화 | 타입 안전 URL 상태 | 미니멀 | 풀스택 RSC |
| **타입 안전** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ |
| **번들 크기** | 중 | 중 | **극소** | N/A (서버) |
| **Data Loading** | loader/action | loader + Query | ❌ | RSC + fetch |
| **Search Params** | 문자열 기반 | **스키마 검증** | 기본 | 문자열 기반 |
| **SSR** | Framework Mode | TanStack Start | ❌ | **네이티브** |
| **접근성** | 수동 | 수동 | 수동 | 수동 |
| **포커스 관리** | ❌ | ❌ | ❌ | ❌ |

> ⚠️ 마지막 두 행을 보라. **모든 라우터가 접근성과 포커스 관리를 사용자에게 떠넘기고 있다.** 이것이 `@os/router`의 존재 이유다.

---

## 흥미로운 이야기들

### Ryan Florence의 두 라우터
React Router의 공동 창시자 Ryan Florence는 자신이 만든 React Router에 불만을 품고 **Reach Router**를 별도로 만들었다 (접근성 우선). 결국 두 프로젝트는 React Router v6에서 다시 합쳐졌다. 한 사람이 같은 문제를 두 번 다른 철학으로 풀었다는 점이 흥미롭다.

### Remix의 흡수
Remix는 원래 React Router 위에 만들어진 풀스택 프레임워크였다. 2024년, Remix 팀이 React Router v7에 Remix의 핵심 기능(loader, action, SSR)을 직접 넣으면서 **Remix는 사실상 React Router v7이 되었다**. "프레임워크가 라우터를 먹었다"가 아니라 "라우터가 프레임워크를 먹었다."

### 라우팅 철학의 진화
```
2014: 라우팅 = 설정 파일 (Rails처럼)
2017: 라우팅 = 컴포넌트 (React처럼)
2021: 라우팅 = Hooks (함수형 React처럼)
2024: 라우팅 = 프레임워크 (Next.js처럼)
2025: 라우팅 = 타입 안전 상태 관리 (TanStack처럼)
```

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|:--|:--|:--|:--|:--|
| **Reach Router의 포커스 관리** | `@os/router` 설계의 직접적 선례 | [Reach Router Docs (Archive)](https://reach.tech/router/) | 중 | 30분 |
| **React Router v7 Framework Mode** | 경쟁자 이해 | [React Router v7 Docs](https://reactrouter.com/) | 중 | 1시간 |
| **History API 직접 구현** | 라우팅의 본질 이해 | [MDN History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) | 하 | 20분 |
| **RSC와 라우팅의 관계** | 서버 컴포넌트 시대의 라우팅 | [Josh Comeau — RSC Demystified](https://www.joshwcomeau.com/react/server-components/) | 상 | 2시간 |
