---
last-reviewed: 2026-02-10
---

# TanStack Router Core Concepts — MECE 분해

> TanStack Router가 하는 모든 것을, 겹치지 않고 빠짐없이 분해한다.

## 왜 이 주제인가

`@os/router`를 설계하려면 TanStack Router가 **정확히 무엇을 하는지** 알아야 한다. "대충 타입 안전한 라우터"가 아니라, 각 개념이 무슨 문제를 풀고, 서로 어떻게 연결되는지를 MECE(상호배타·전체포괄)로 분해한다. 이를 통해 우리가 TanStack Router에서 **가져갈 것 / 감쌀 것 / 무시할 것**을 판단할 수 있다.

---

## 전체 구조

TanStack Router의 모든 기능은 아래 **6개 도메인**으로 빠짐없이 분류된다.

```
┌─────────────────────────────────────────────────┐
│              TanStack Router                    │
├──────────┬──────────┬──────────┬────────────────┤
│ 1.Route  │ 2.Navi-  │ 3.State  │ 4.Data         │
│   Tree   │  gation  │  (URL)   │   Lifecycle    │
├──────────┴──────────┴──────────┴────────────────┤
│ 5. Rendering                                    │
├─────────────────────────────────────────────────┤
│ 6. Type System (모든 레이어를 관통)              │
└─────────────────────────────────────────────────┘
```

---

## 1. Route Tree — "어떤 라우트가 있는가?"

> **문제**: 앱에 어떤 페이지들이 존재하고, 어떤 계층 구조를 갖는가?

| 개념 | 역할 | 핵심 |
|:--|:--|:--|
| **Root Route** | 모든 라우트의 최상위 부모 | `createRootRoute()` |
| **File-based Routing** | 파일 시스템 구조 → 라우트 트리 자동 생성 | Vite Plugin / CLI |
| **Code-based Routing** | 코드로 라우트 트리를 직접 정의 | `createRoute()`, `routeTree` |
| **Nested Routes** | 부모-자식 관계로 UI 계층 구성 | `<Outlet />` 으로 자식 렌더링 |
| **Layout Routes** | URL에 영향 없이 공유 레이아웃 제공 | 경로 없는 라우트 (pathless) |
| **Grouped Routes** | 논리적 그룹핑 (URL 미반영) | 폴더 이름으로 구분 |

**본질**: "URL 패턴 → 컴포넌트 트리"의 **선언적 매핑 테이블**.

```typescript
// 핵심: URL 구조와 컴포넌트 구조의 매핑
/               → RootLayout > IndexPage
/products       → RootLayout > ProductsLayout > ProductList
/products/:id   → RootLayout > ProductsLayout > ProductDetail
/settings       → RootLayout > SettingsPage
```

---

## 2. Navigation — "어떻게 이동하는가?"

> **문제**: 사용자가 라우트 간 이동을 어떻게 하고, 라우터는 이를 어떻게 제어하는가?

| 개념 | 역할 | API |
|:--|:--|:--|
| **Link** | 선언적 네비게이션 (JSX) | `<Link to="/products" />` |
| **navigate** | 명령적 네비게이션 | `router.navigate({ to })` |
| **useNavigate** | 컴포넌트 내 명령적 네비게이션 | `const nav = useNavigate()` |
| **Redirect** | 라우트 로딩 중 강제 이동 | `throw redirect({ to })` |
| **Preloading** | 이동 전 미리 로드 | `intent` / `viewport` / `render` |
| **Route Masking** | 실제 URL과 표시 URL 분리 | `mask: { to }` |
| **Scroll Restoration** | 이동 후 스크롤 위치 복원 | 자동 / `scrollRestoration` 옵션 |
| **History** | 브라우저 히스토리 통합 | `createBrowserHistory()` |

**본질**: `pushState`를 감싸고, 타입 안전하게 만들고, 최적화(preload)를 얹은 것.

**Preloading 전략 비교**:
```
intent   → 마우스 호버 시 프리로드    (기본값, 가장 흔함)
viewport → 뷰포트에 보이면 프리로드   (리스트/피드에 적합)
render   → 링크가 렌더링되면 즉시     (최적 성능, 비용 높음)
```

---

## 3. State (URL) — "URL에 무슨 상태가 있는가?"

> **문제**: URL의 각 부분(경로, 파라미터, 쿼리)을 어떻게 타입 안전하게 읽고 쓰는가?

| 개념 | 역할 | API |
|:--|:--|:--|
| **Path Params** | URL 경로의 동적 세그먼트 | `/products/$id` → `useParams()` |
| **Search Params** | URL 쿼리 = 전역 상태 | `validateSearch` + `useSearch()` |
| **Search Validation** | 스키마로 search params 검증 | Zod, Valibot 등 |
| **Search Middleware** | search params 변환/정규화 | `search.middlewares` |
| **Search Serialization** | search params ↔ URL 문자열 변환 | JSON 기본, 커스텀 가능 |
| **loaderDeps** | search params → loader 의존성 연결 | `loaderDeps: ({ search }) => …` |

**본질**: **URL을 `useState`처럼 쓸 수 있게** 한 것. TanStack Router의 가장 독창적 기여.

```typescript
// Search Params = 타입 안전 전역 상태
export const Route = createFileRoute('/products')({
  validateSearch: z.object({
    page: z.number().default(1),
    sort: z.enum(['price', 'name']).default('name'),
    filters: z.object({ category: z.string().optional() }),
  }),
})

// 컴포넌트에서: useState처럼 사용
const { page, sort, filters } = useSearch({ from: '/products' })
```

**Search Params 상속 구조**:
```
RootRoute (validateSearch: { locale })
  └─ ProductsRoute (validateSearch: { page, sort })
      └─ ProductDetail → { locale, page, sort } 모두 접근 가능
```

---

## 4. Data Lifecycle — "데이터를 언제, 어떻게 불러오는가?"

> **문제**: 라우트가 필요한 데이터를 언제 가져오고, 어디에 캐싱하고, 어떻게 무효화하는가?

### 실행 순서 (핵심!)

```
네비게이션 시작
  │
  ├─ 1. beforeLoad (순차) → 인증, 컨텍스트 구축
  │     parent.beforeLoad → child.beforeLoad
  │
  ├─ 2. loader (병렬) → 데이터 페칭
  │     parent.loader ↕ child.loader (동시)
  │
  └─ 3. component 렌더링 → useLoaderData()로 접근
```

| 개념 | 실행 시점 | 실행 방식 | 용도 |
|:--|:--|:--|:--|
| **beforeLoad** | loader 이전 | **순차** (부모→자식) | 인증, 가드, 컨텍스트 |
| **loader** | beforeLoad 이후 | **병렬** (형제 라우트) | 데이터 페칭 |
| **loaderDeps** | loader 이전 | — | loader 의존성 선언 |
| **Built-in Cache** | loader 결과 캐싱 | SWR (stale-while-revalidate) | 재방문 시 즉시 표시 |
| **Invalidation** | 수동 | `router.invalidate()` | 캐시 무효화 |
| **External Cache** | — | TanStack Query 등 | 더 강력한 캐싱 |

**본질**: `beforeLoad`(순차 가드) + `loader`(병렬 데이터) + 캐시 = **라우트 단위 데이터 관리**.

**beforeLoad vs loader 판단 기준**:
```
"이게 실패하면 아예 이 페이지를 안 보여줘야 해?" → beforeLoad
"이 데이터가 없으면 로딩 UI를 보여줄까?"           → loader
```

---

## 5. Rendering — "무엇을 그리는가?"

> **문제**: 각 라우트의 상태(로딩, 에러, Not Found)에 따라 무엇을 보여주는가?

| 개념 | 언제 렌더링되는가 | 기본값 |
|:--|:--|:--|
| **component** | 정상 로딩 완료 | 필수 — 라우트의 주 UI |
| **pendingComponent** | loader가 `pendingMs` 초과 | 전역 기본 or 없음 |
| **errorComponent** | loader/beforeLoad에서 에러 발생 | 전역 기본 에러 UI |
| **notFoundComponent** | URL이 매칭 안 됨 / `notFound()` 호출 | 전역 404 |
| **Outlet** | 자식 라우트의 렌더링 위치 | `<Outlet />` |
| **wrapInSuspense** | Suspense 경계 자동 래핑 | `true` |

**본질**: 라우트의 **4가지 상태(정상/로딩/에러/404)** 각각에 대한 UI 선언.

```typescript
export const Route = createFileRoute('/products/$id')({
  component: ProductDetail,       // 정상
  pendingComponent: Skeleton,     // 로딩 중
  errorComponent: ErrorFallback,  // 에러
  notFoundComponent: NotFound,    // 404
})
```

**Code Splitting과의 관계**:
```
Critical (초기 로드):        route config, path, validateSearch
Non-Critical (lazy 로드):   component, pendingComponent, errorComponent, notFoundComponent
```

TanStack Router는 이 분리를 **자동으로** 해준다 (file-based 사용 시).

---

## 6. Type System — 모든 것을 관통하는 뼈대

> **문제**: 위 5개 도메인의 모든 것이 컴파일 타임에 검증되는가?

| 타입 추론 대상 | 예시 |
|:--|:--|
| **라우트 경로** | `to: '/produts'` → ❌ 컴파일 에러 |
| **Path Params** | `params.idd` → ❌ 컴파일 에러 |
| **Search Params** | `search.pge` → ❌ 컴파일 에러 |
| **Loader 반환값** | `useLoaderData()` → 정확한 타입 |
| **Context** | `useRouteContext()` → 부모 포함 머지된 타입 |
| **Link 유효성** | 존재하지 않는 라우트로 링크 → ❌ |

**본질**: TanStack Router의 **진짜 차별점**. 다른 모든 기능은 React Router도 가지고 있지만, **100% 타입 추론**은 TanStack만의 것.

---

## MECE 검증: 빠진 것이 없는가?

| 관심사 | 분류 | 확인 |
|:--|:--|:--|
| URL에서 어떤 라우트인가? | 1. Route Tree | ✅ |
| 다른 라우트로 어떻게 가는가? | 2. Navigation | ✅ |
| URL에 어떤 상태가 있는가? | 3. State (URL) | ✅ |
| 데이터를 언제 어떻게 가져오는가? | 4. Data Lifecycle | ✅ |
| 화면에 무엇을 보여주는가? | 5. Rendering | ✅ |
| 위의 모든 것이 타입 안전한가? | 6. Type System | ✅ |

**겹침(ME) 검증**: 각 도메인은 서로 다른 질문을 해결하며, 하나의 기능이 두 도메인에 동시 속하지 않는다.

---

## 우리(@os/router)에게 주는 시사점

| 도메인 | 우리의 전략 |
|:--|:--|
| 1. Route Tree | **그대로 사용** — TanStack의 정의 방식 100% 호환 |
| 2. Navigation | **감싸기** — `navigate` 호출 시 Kernel event 발행 + 포커스 복원 추가 |
| 3. State (URL) | **그대로 사용** — search params 체계는 건드릴 이유 없음 |
| 4. Data Lifecycle | **그대로 사용** — loader/beforeLoad는 앱 레이어의 관심사 |
| 5. Rendering | **확장** — `pendingComponent`에 `focusTarget` 속성 추가 등 |
| 6. Type System | **호환** — 우리가 추가하는 API도 타입 추론 지원 |

> 결론: 6개 중 **5개는 건드리지 않고**, Navigation만 감싸고, Rendering만 살짝 확장하면 된다.

---

## 흥미로운 이야기들

### "Search Params는 가장 강력한 상태 관리자다"

TanStack Router 공식 문서의 표현: *"Search params are the most powerful state manager in your entire application."* — 전역적이고, 직렬화 가능하고, 북마크 가능하고, 공유 가능하기 때문이다. Redux도 Zustand도 이 조건을 다 만족시키지 못한다.

### 영감의 소스

TanStack Router가 공식적으로 인정하는 영감:
- **tRPC** — 타입 안전 API의 선례
- **Remix** — loader/action 패턴
- **Chicane** — (잘 알려지지 않은) 타입 안전 라우팅 선구자
- **Next.js** — 파일 기반 라우팅

### beforeLoad의 순차 실행이 중요한 이유

인증 가드를 생각해보자:
```
RootRoute.beforeLoad → { user: await getUser() }
AdminRoute.beforeLoad → if (!context.user.isAdmin) throw redirect('/login')
AdminDashboard.loader → fetchAdminData()  ← 인증 안 된 유저는 여기 도달 못함
```
만약 병렬이었다면, 인증 안 된 유저가 adminData를 요청하는 보안 문제가 생긴다.

---

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|:--|:--|:--|:--|:--|
| **Search Params 심화** | URL state 패턴 마스터 | [TanStack Search Params Guide](https://tanstack.com/router/latest/docs/framework/react/guide/search-params) | 중 | 30분 |
| **Data Loading 가이드** | beforeLoad vs loader 패턴 | [TanStack Data Loading](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading) | 중 | 30분 |
| **Route Context 가이드** | 인증/테마 패턴 | [TanStack Route Context](https://tanstack.com/router/latest/docs/framework/react/guide/route-context) | 중 | 20분 |
| **Code Splitting 가이드** | Critical vs Lazy 분리 | [TanStack Code Splitting](https://tanstack.com/router/latest/docs/framework/react/guide/code-splitting) | 하 | 15분 |
