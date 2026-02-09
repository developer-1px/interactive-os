# core

런타임 구현 — 1~4를 실행하는 오케스트레이터.

## 파일

- `dispatch.ts` — createCommandStore (트랜잭션 경계)
- `route.ts` — 커맨드 라우팅 + zone bubbling
- `middleware.ts` — 미들웨어 합성

## 역할

파이프라인(1~4)을 실제로 실행하는 런타임.
- dispatch → route → command → store → effect
- 트랜잭션 관리
- 에러 처리
- 미들웨어 적용
