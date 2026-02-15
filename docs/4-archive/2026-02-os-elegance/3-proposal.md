# OS Elegance — Proposal

## 구현 전략 개요

| 작업 단위 | 유형 | 예상 난이도 |
|-----------|------|-------------|
| **W1: GlobalNav 리디자인** | 시각적 | M |
| **W2: 404 페이지 리디자인** | 시각적 | S |
| **W3: Root Layout 개선** | 시각적 | S |
| **W4: 디자인 토큰 보강** | 시각적 | S |
| **W5: Todo v5 코드 정리** | 코드 | M |
| **W6: Stale 라우트 제거** | 코드 | S |
| **W7: Router Devtools dev-only** | 코드 | S |

---

## W1: GlobalNav 리디자인

### 현재 상태
- 40px 폭의 좁은 사이드바
- `#F8FAFC` 배경 + 1px 보더
- 8x8 아이콘, 기본 hover 효과
- 활성 상태: indigo 배경색 + 그림자

### 개선 방향
- **48px 폭**으로 확대 — 아이콘 터치 타겟 개선
- **트위라이트 그라디언트 배경** — #0f172a → #1e293b (다크 사이드바)
- **활성 아이콘에 글로우 효과** — `box-shadow: 0 0 12px rgba(99, 102, 241, 0.4)`
- **호버에 미세 스케일** — `transform: scale(1.08)` + 배경 하이라이트
- **구분선** — 상단 네비와 하단 도구 사이 미세 구분선
- **아이콘 크기 20px** — 시각적 무게감 증가

### 리스크
- GlobalNav 폭 변경 시 레이아웃 영향 — `app-viewport` flex가 자동 조정하므로 낮음

---

## W2: 404 페이지 리디자인

### 현재 상태
```tsx
<h1>404 - Page Not Found</h1>
<p>The page you are looking for does not exist.</p>
<Link to="/">Go Home</Link>
```

### 개선 방향
- **대형 타이포그래피** — "404"를 반투명 대형 숫자로 (120px, opacity 0.05)
- **아이콘** — Lucide `search` 또는 `compass` 아이콘
- **메시지** — "이 페이지는 존재하지 않습니다" + 부제 "길을 잃으셨나요?"
- **CTA 버튼** — 프라이머리 스타일의 "홈으로 돌아가기"
- **미세 애니메이션** — fade-in + slide-up

---

## W3: Root Layout 개선

### 현재 상태
- `app-viewport` 배경: `#0a0a0a` (GlobalNav 뒤에 보이는 다크 배경)
- 전환 효과 없음

### 개선 방향
- **Outlet 전환** — route 변경 시 `opacity + translateY` 미세 전환 (CSS transition)
- 세련된 layout gap / 여백 미세 조정

---

## W4: 디자인 토큰 보강

### 추가할 토큰
```css
/* Gradients */
--gradient-sidebar: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
--gradient-brand: linear-gradient(135deg, #6366f1, #8b5cf6);

/* Glow */
--glow-brand: 0 0 12px rgba(99, 102, 241, 0.3);

/* Transitions */
--transition-fast: 150ms cubic-bezier(0.16, 1, 0.3, 1);
--transition-normal: 250ms cubic-bezier(0.16, 1, 0.3, 1);
```

---

## W5: Todo v5 코드 정리

코드 리뷰 발견사항 처리:

| # | 항목 | 작업 |
|---|------|------|
| R1 | UNDO/REDO dead guard | `if (!prev) return;` 제거, `at(-1)!` 사용 |
| E1 | undo/redo spread → Immer | `produce()` 사용으로 일관성 확보 |
| E4 | HandlerResult.dispatch 타입 | `Command \| Command[]` 또는 단수 경로 통일 |
| E6 | void 무덤 13줄 | 미사용 변수 제거 또는 export |
| Y1/Y2 | `void name` 패턴 | `_name`, `_config`으로 변경 |

### 대상 파일
- `src/os/defineApp.ts` (production 코드)
- `src/apps/todo/app.ts` (Todo v5 native)

---

## W6: Stale 라우트 제거

### 삭제 후보
현재 `src/routes/_minimal/` 아래 playground 라우트:
- `playground.playwright.tsx` — Playwright 관련은 제거됨
- `playground.aria.tsx` — ARIA showcase 별도 존재
- `playground.focus.tsx` — Focus showcase 별도 존재
- 기타 사용하지 않는 playground

### 절차
1. 각 라우트의 실제 사용 여부 확인
2. 사용하지 않는 라우트 파일 삭제
3. `routeTree.gen.ts` 재생성 확인

---

## W7: Router Devtools dev-only

### 현재
```tsx
<TanStackRouterDevtools />  // 항상 렌더
```

### 변경
```tsx
{import.meta.env.DEV && <TanStackRouterDevtools />}
```

---

## 구현 순서

```
W7 (dev-only)    → 가장 간단, 즉시 효과
W4 (토큰 보강)    → 이후 시각 작업의 기반
W1 (GlobalNav)   → 첫인상 핵심
W2 (404)         → 완성도 신호
W3 (Layout)      → 전체 느낌
W5 (코드 정리)    → 별도 독립
W6 (라우트 정리)  → 마지막 정리
```

## 변경 범위
- `src/routes/__root.tsx` — W2, W3, W7
- `src/components/GlobalNav.tsx` — W1
- `src/index.css` — W1, W4
- `src/os/defineApp.ts` — W5
- `src/apps/todo/app.ts` — W5
- `src/routes/_minimal/playground.*` — W6

## 리스크
| 리스크 | 대응 |
|--------|------|
| GlobalNav 폭 변경 시 다른 페이지 레이아웃 깨짐 | flex layout이므로 자동 조정. 빌드 후 브라우저 확인 |
| defineApp.ts 수정 시 런타임 버그 | 기존 31 unit tests 통과 확인 |
| 라우트 삭제 시 참조 깨짐 | `tsc --noEmit` + `vite build` 검증 |
