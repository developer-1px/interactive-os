# OS Router — Usage 제안서

> **참고 리소스**: [React 라우팅 생태계 완전 정복](../3-resource/05-react-router-ecosystem.md) | [TanStack Router Philosophy](../3-resource/00-guides/tanstack-router-philosophy.md)

> **날짜:** 2026-02-10  
> **태그:** os-router, routing, architecture, proposal  
> **상태:** 아이디어 단계

## 1. 개요 (Overview)

OS Layer를 설치하면 상태관리(Kernel) + UI(Focus/ARIA) + API(Command/Effect)가 함께 제공되는데, **라우팅만 사용자가 별도 설치·설정**해야 한다. 이 문서는 `@os/router`를 OS의 1급 모듈로 통합하여 "설치하면 끝"인 경험을 제공하는 Usage를 제안한다.

## 2. 핵심 가치

| 현재 (사용자가 직접) | 제안 (@os/router) |
|:--|:--|
| TanStack Router 별도 설치 | OS 설치 시 포함 |
| 라우트 전환 후 포커스 수동 관리 | 자동 포커스 복원 |
| 키보드 네비게이션 직접 구현 | `Cmd+1/2/3` 기본 제공 |
| Inspector에 라우트 안 보임 | 라우트 히스토리 자동 표시 |
| 라우트 변경 = Kernel 모름 | `ROUTE_CHANGED` 이벤트 자동 발행 |

## 3. Usage 제안

### 3.1 기본 설정 — `createApp`

```typescript
import { createApp } from '@os/core'
import { routerPlugin } from '@os/router'

const app = createApp({
  plugins: [
    routerPlugin({
      // TanStack Router 옵션을 그대로 전달
      routeTree,
      defaultPreload: 'intent',
    })
  ]
})
```

> OS를 셋업할 때 `routerPlugin`만 추가하면, 포커스 복원·키바인딩·Inspector 연동이 자동 활성화.

### 3.2 라우트 정의 — TanStack Router API 그대로

```typescript
// src/routes/products.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products')({
  // 기존 TanStack Router API 100% 호환
  validateSearch: (search) => productSchema.parse(search),
  loader: () => fetchProducts(),
})
```

> 사용자는 TanStack Router API를 그대로 사용. 학습 비용 = 0.

### 3.3 OS가 자동으로 해주는 것들

#### 포커스 복원

```typescript
// 사용자가 아무것도 안 해도 됨
// /products → /settings → 뒤로가기 → /products
// → 마지막으로 포커스했던 요소에 자동 복귀
```

#### 키보드 네비게이션

```typescript
// OS가 자동 등록하는 키바인딩:
// Cmd+1 → 첫 번째 라우트
// Cmd+2 → 두 번째 라우트
// Cmd+[ → 뒤로가기
// Cmd+] → 앞으로가기
```

#### Kernel 이벤트 발행

```typescript
// 라우트가 바뀔 때마다 Kernel에 자동 dispatch
// Inspector에서 이렇게 보임:
//
// INPUT:  ROUTE_CHANGED { from: "/products", to: "/settings" }
// CMD:    OS_FOCUS_RESTORE
// EFFECT: FOCUS_ID("settings-title")
```

### 3.4 고급 — 라우트별 포커스 정책

```typescript
export const Route = createFileRoute('/modal')({
  // OS 전용 확장 메타데이터
  staticData: {
    os: {
      focusPolicy: 'trap',         // 포커스 트랩 자동 활성화
      restoreFocus: true,          // 닫을 때 이전 포커스 복원
      announceRoute: 'Settings',   // 스크린리더: "Settings 페이지로 이동"
    }
  }
})
```

### 3.5 Inspector 연동

```
┌─ Inspector ──────────────────────────────┐
│ ROUTE  /products → /settings      12:03  │
│  ├─ CMD   OS_FOCUS_RESTORE               │
│  ├─ EFX   FOCUS_ID("settings-title")     │
│  └─ ARIA  announce("Settings 페이지")     │
│ ROUTE  / → /products              12:02  │
│  └─ CMD   OS_FOCUS_INITIAL               │
└──────────────────────────────────────────┘
```

## 4. 아키텍처

```
사용자 코드 (App)
  └─ TanStack Router API 그대로 사용
       │
@os/router (어댑터)
  ├─ router.subscribe() → 라우트 변경 감지
  ├─ kernel.dispatch(ROUTE_CHANGED)
  ├─ focusPipeline.restore(routeId)
  ├─ keybinding.register(Cmd+1, navigate)
  └─ inspector.log(routeEvent)
       │
@os/core (Kernel + Focus + ARIA)
```

## 5. 결론 (Proposal)

- **구현 복잡도**: 낮음 (TanStack Router의 `router.subscribe`로 라우트 변경 감지만 하면 됨)
- **사용자 학습 비용**: 0 (TanStack Router API 변경 없음)
- **제공 가치**: 높음 (포커스 복원 + 키보드 + Inspector + 접근성 = 공짜)
- **우선순위**: Kernel + Focus Pipeline 안정화 이후 (Phase 2)
