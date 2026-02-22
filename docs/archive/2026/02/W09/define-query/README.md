# define-query — 커널의 네 번째 기둥

## Why

앱이 DOM API를 직접 호출하는 근본 원인: 커널에 "외부 세계 → 컴포넌트" 구독 경로가 없다.

현재 커널은 re-frame의 3기둥을 보유:
- `defineEffect` (fx) — 커널 → 외부 (Write)
- `defineContext` (cofx) — 외부 → 커맨드 (Read, Pull)
- `useComputed` (sub) — 상태 → 뷰 (Subscribe)

빠진 것: **외부 → 뷰 (Read + Subscribe)** = `defineQuery`

## Goals

1. **커널에 `defineQuery` primitive 추가** — 외부 세계(DOM, HTTP, WebSocket 등)의 데이터를 컴포넌트에서 선언적으로 구독하는 메커니즘
2. **동기/비동기 범용** — DOM rect(동기)와 HTTP fetch(비동기) 모두 같은 패턴
3. **앱의 DOM API 직접 호출 제거** — BuilderCursor 등이 `useQuery`로 전환

## Scope

- **IN**: `defineQuery` 커널 API 설계 및 구현, `useFocusedRect()` 등 OS 편의 훅, BuilderCursor OS 레이어 승격
- **OUT**: 기존 `defineEffect`/`defineContext` 변경 없음 (보완 관계)

## Track

**Heavy** — 아키텍처 변경, 커널 새 primitive 도입

## Related

- `focus-single-path` — DOM 안티패턴 전수 조사에서 파생
- `archive/...effect-syscall-model.md` — 과거 effect 모델 제안서
- re-frame `reg-cofx`, `reg-sub` / React Query `useQuery` — 이론적 기반
