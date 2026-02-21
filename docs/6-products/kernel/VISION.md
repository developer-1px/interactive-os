# Product Vision — Kernel

> 모든 것의 기반. 상태 관리 + 커맨드 디스패치 + 구독의 최소 코어.

## Vision

**웹 앱에 운영체제의 질서를 부여하는 마이크로커널.**
앱이 상태를 선언하면, 커널이 변경을 중재하고, 구독자에게 알리고, 이력을 추적한다.

## Target Group

- **Primary**: Interactive OS 레이어 (os/)
  - 커널 위에 포커스, 네비게이션, 접근성을 구축하는 인프라 소비자

- **Secondary**: defineApp을 통해 간접적으로 사용하는 앱 개발자
  - 커널을 직접 건드리지 않지만, defineApp이 커널 위에 동작

## Needs

1. **단일 상태 저장소** — 앱 + OS 상태를 하나의 트리에 보유
2. **커맨드 기반 변경** — 모든 상태 변경은 defineCommand를 통과
3. **반응적 구독** — 상태 변경 시 관심 있는 소비자만 알림
4. **확장 가능** — Context, Effect, Query, Scope, Middleware로 기능 확장
5. **테스트 가능** — 인스턴스 기반, 싱글턴 없음, HMR-safe

## Product

### 4가지 Primitive

| Primitive | 역할 |
|-----------|------|
| **defineCommand** | 상태 변경의 유일한 문. `(ctx) => (payload) => { state, dispatch?, effect? }` |
| **defineContext** | 커맨드 실행 시 주입되는 외부 데이터 (DOM 등) |
| **defineEffect** | 커맨드 실행 후 부수효과 (DOM 조작, 외부 API 호출) |
| **defineQuery** | 외부 데이터의 반응적 구독 (DOM rect, viewport 등) |

### 인프라 기능

| 기능 | 설명 |
|------|------|
| **Middleware** | dispatch 파이프라인에 끼워 넣는 횡단 관심사 (history, logging) |
| **Scope** | 커맨드의 관할 범위 제한 (Zone별 격리) |
| **useComputed** | shallow 비교 기반 구독. 필요한 부분만 리렌더 |
| **Transaction** | 하나의 dispatch에서 여러 상태 변경을 원자적으로 처리 |
| **Inspector Port** | 개발 도구 연결을 위한 관찰 포트 (Port/Adapter 패턴) |

## Business Goals

1. **OS의 기반** — 포커스, 네비게이션, ARIA, 클립보드 모두 커널 위에 구축
2. **앱과 독립** — `packages/kernel`로 분리. 앱 코드가 커널을 오염시키지 않음
3. **제로 의존성** — React `useSyncExternalStore`만 사용. 외부 상태 라이브러리 없음

## Non-Goals

- ❌ DOM 직접 접근 (커널은 DOM을 모른다)
- ❌ UI 컴포넌트 (커널은 렌더링을 모른다)
- ❌ 앱 비즈니스 로직 (커널은 범용 인프라)
- ❌ 프레임워크 교체 지원 (React에 최적화, 하지만 코어는 프레임워크 무관)

## Now / Next / Later

### 🔴 Now — 안정화

- defineQuery 실전 적용 (DOM rect, viewport 등)
- 타입 안전성 강화 (as unknown as 제거)

### 🟡 Next — 성숙

- 비동기 Query 지원 (fetch, WebSocket)
- Middleware 합성 패턴 정립
- 성능 프로파일링 도구

### 🔵 Later — 확장

- 멀티 커널 (탭 간 통신)
- 영속성 미들웨어 (localStorage, IndexedDB 자동 동기화)
- 서버 사이드 커널 (SSR 초기 상태)

---

_Format: [Product Vision Board](https://www.romanpichler.com/tools/product-vision-board/) (Roman Pichler) + [Now/Next/Later Roadmap](https://www.prodpad.com/blog/invented-now-next-later-roadmap/) (Janna Bastow)_
