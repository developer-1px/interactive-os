# Kernel — Area Documents

> Source: packages/kernel/
> Official API 문서: [docs/official/kernel/](../../official/kernel/00-overview.md) (10개 문서, 60KB)

## 이 폴더의 문서

| 문서 | 성격 |
|------|------|
| [kernel-adr-journey.md](./kernel-adr-journey.md) | 내부 히스토리 — 27개 ADR을 시간순으로 압축한 의사결정 여정 |
| [10.01-inspector-api.md](./10.01-inspector-api.md) | Inspector API 아키텍처 — getRegistry, evaluateWhenGuard |

## 커널 구조 요약

```
packages/kernel/
├── src/
│   ├── createKernel.ts      — 메인 커널 (723줄, 클로저 기반)
│   ├── createInspector.ts   — Inspector 구현
│   ├── core/
│   │   ├── tokens.ts        — ScopeToken, CommandFactory, Middleware 등 타입
│   │   ├── transaction.ts   — 트랜잭션 모델
│   │   └── inspectorPort.ts — Inspector 인터페이스
│   └── index.ts             — public exports
└── __tests__/               — 521+ unit tests
```

## 핵심 개념

1. **Closure-based** — 전역 상태 없음. 각 createKernel() 호출이 독립 인스턴스
2. **Scope Tree** — GLOBAL → App → Zone → Child Zone. 커맨드는 leaf → root로 버블
3. **When Guard** — 조건부 커맨드 실행 (Condition 평가)
4. **Middleware** — 커맨드 파이프라인에 Before/After/Fallback 훅
5. **Inspector** — 커널 내부 상태를 외부에서 읽기 전용으로 조회

## 공식 문서 바로가기

→ [Kernel Official Docs](../../official/kernel/00-overview.md)
