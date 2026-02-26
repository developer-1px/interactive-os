---
last-reviewed: 2026-02-10
---

# TanStack Router: From "Routing" to "URL State Management"

> 라우팅은 단순히 "페이지 이동"이 아니라, "애플리케이션 상태의 동기화"이다.

## 왜 이 주제인가

현재 우리는 `react-router-dom`에서 **TanStack Router**로의 대규모 마이그레이션을 진행 중입니다. 단순히 "새로운 라이브러리 교체"로 접근하면, TanStack Router가 제공하는 **Type Safety**와 **Search Params State Manager**로서의 강력함을 놓칠 수 있습니다. 이 문서는 우리가 왜 이 변화를 선택했는지, 그리고 어떻게 써야 "잘 쓰는 것"인지를 다룹니다.

## Background / Context

### React Router의 유산과 한계
React Router는 오랫동안 표준이었습니다. "컴포넌트로서의 라우트"(`Route`, `Link`)는 혁명적이었지만, 앱이 커지면서 한계가 드러났습니다:
- **Loose Typing**: URL 파라미터나 경로가 런타임 문자열에 의존하여, 오타 하나가 앱을 망가뜨릴 수 있었습니다.
- **Data Fetching의 분리**: 라우팅과 데이터 로딩이 분리되어 있어 "Render-then-Fetch" 워터폴 현상이 발생하기 쉬웠습니다.
- **State와의 단절**: URL query param을 다루는 것이 번거로워, 많은 상태가 전역 스토어(Zustand 등)로 숨어버렸습니다. (Deep Linking 불가능)

### TanStack Router의 등장
React Query(TanStack Query)로 "서버 상태 관리"의 패러다임을 바꾼 Tanner Linsley는 라우팅을 **"URL 상태 관리(URL State Management)"** 문제로 재정의했습니다. 즉, 라우터는 단순한 스위치가 아니라 **URL을 Source of Truth로 하는 상태 관리자**라는 것입니다.

## Core Concept

### 1. 100% Type Inference
TanStack Router의 가장 큰 차별점은 **완벽한 타입 추론**입니다.
- `createFileRoute('/posts/$postId')`로 라우트를 만들면, `$postId`는 자동으로 타입 시스템에 등록됩니다.
- `<Link to="/posts/$postId" params={{ postId: '123' }} />`에서 `postId`가 누락되거나 타입이 틀리면 **컴파일 에러**가 납니다.
- 이는 대규모 앱 리팩토링 시 "깨진 링크"에 대한 공포를 0으로 만듭니다.

### 2. Search Params as Global State
기존에는 URL 쿼리 파라미터(`?sort=desc&filter=active`)를 다루기 위해 `URLSearchParams`를 직접 파싱하거나 문자열로 관리했습니다.
TanStack Router는 이를 **Schema Validation(Zod 등)을 거친 Typed State**로 취급합니다.

```typescript
// 라우트 정의에서 search param 스키마 정의
validateSearch: (search) => parse(searchSchema, search)
```

이제 컴포넌트에서는 `useSearch()`를 통해 완벽하게 타이핑된 객체를 얻습니다. URL은 이제 **Redux/Zustand를 대체하는 전역 상태 저장소**가 됩니다.

## Usage

### Validate Search Params (필수 패턴)

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const productSearchSchema = z.object({
  page: z.number().catch(1),
  filter: z.enum(['new', 'popular']).catch('new'),
})

export const Route = createFileRoute('/products/')({
  validateSearch: (search) => productSearchSchema.parse(search),
})
```

이렇게 하면 URL이 `?page=abc` 처럼 오염되어도 자동으로 `page=1`로 복구됩니다. 방어적 프로그래밍이 라우터 레벨에서 해결됩니다.

### Loader for Data Dependencies

컴포넌트가 렌더링되기 *전에* 데이터를 로드합니다.

```typescript
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params: { postId } }) => fetchPost(postId),
})

function PostComponent() {
  const post = Route.useLoaderData() // 데이터 타입 자동 추론
  return <div>{post.title}</div>
}
```

## Best Practice + Anti-Pattern

### ✅ Best Practice
1.  **모든 필터/정렬 상태를 URL로**: 새로고침해도, 링크를 공유해도 같은 화면이 보이게 하세요. "모달이 열린 상태"조차 URL에 있는 것이 이상적입니다.
2.  **Zod로 방어하기**: 사용자가 URL을 임의로 조작하는 것을 `validateSearch`로 막으세요.
3.  **File-based Routing**: `src/routes` 구조를 믿으세요. 수동으로 라우트 트리를 구성하는 것보다 훨씬 생산적입니다.

### 🚫 Anti-Pattern
1.  **`useNavigate` 남용**: 가능한 `<Link>` 컴포넌트를 사용하세요. `Link`는 prefetching 기능을 내장하고 있어 UX가 훨씬 좋습니다.
2.  **URL에 민감 정보 넣기**: URL은 공유 가능하고, 브라우저 히스토리에 남습니다. 개인정보나 토큰은 절대 Search Param에 넣지 마세요.
3.  **`beforeLoad`에서 무거운 작업**: 라우트 진입을 막는 가드(`beforeLoad`)는 빨라야 합니다. 무거운 비동기 작업은 `loader`로 미루세요.

## 흥미로운 이야기들

### "Global State는 필요 없다"
Tanner Linsley는 "Server State(React Query)"와 "URL State(Router)" 두 가지만 잘 다루면, 클라이언트 전역 상태(Zustand, Redux)는 극소수(테마, 토스트 등)만 남는다고 주장합니다. 우리가 지금 OS-New 리팩토링에서 **Zustand를 제거하려는 방향성**과 정확히 일치합니다. TanStack Router 도입은 단순한 라우터 교체가 아니라, **상태 관리 철학의 대전환**입니다.

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|:--|:--|:--|:--|:--|
| **Zod Schema Validation** | Search Param 검증의 핵심 기술 | [Zod 공식 문서](https://zod.dev) | 하 | 30분 |
| **URL as State Manager** | 상태 관리의 패러다임 시프트 | [My Custom React Router (Tanner Linsley)](https://www.youtube.com/watch?v=OrAp6x97J2M) | 중 | 40분 |
| **Search Params API** | 브라우저 표준 API 이해 | [MDN URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) | 하 | 20분 |
