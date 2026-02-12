# 리매핑 설계 — STATUS

> 생성일: 2026-02-13

## 현재 단계: ✅ 구현 완료

## 작업 분해 (/divide)

### 🟢 Known (정답 있음 → AI 바로 실행)

| # | 작업 | 근거 |
|---|------|------|
| K1 | `Middleware` 타입에 `fallback` 필드 추가 | Discussion 결론에서 확정. optional 필드 1개 추가 |
| K2 | `createKernel`에 `resolveFallback` 함수 추가 | Discussion 결론 코드 그대로. 미들웨어 체인 순회 → dispatch |
| K3 | `resolveFallback`를 kernel return에 노출 | 한 줄 추가 |
| K4 | `macFallbackMiddleware.ts` 작성 | Discussion 결론 + 현재 `getMacFallbackKey` 로직 재사용 |
| K5 | `KeyboardListener` 2-pass 제거 → `resolveFallback` 호출 | 코드 단순화 (삭제 > 추가) |
| K6 | 기존 `keybindings.test.ts` 회귀 확인 | 기존 테스트 실행만 |

### 🟡 Constrained → ✅ 결정됨

| # | 작업 | 결정 |
|---|------|------|
| C1 | `resolveFallback` 미들웨어 순회 범위 | **(A) GLOBAL만** — scope 컨텍스트 없으므로 ||
| C2 | `resolveFallback` 반환 타입 | **boolean 반환** — 리스너가 preventDefault 판단 |

### 🔴 Open → ✅ 결정됨

| # | 결정 |
|---|------|
| O1 | `@frozen` 해제 승인. 단, 미들웨어 관련 코드만 수정 허가 |

## 진행 기록

| 날짜 | 이벤트 | 커밋 | changelog |
|------|--------|------|-----------|
| 2026-02-12 | Discussion 완료 | — | Journey + Conclusion 작성 |
| 2026-02-13 | 프로젝트 전환 | — | PRD, KPI, Proposal 작성 |
| 2026-02-13 | 제안서 승인, 구현 시작 | — | — |
| 2026-02-13 | K1-K6 구현 완료 | `a082bb3` | `tokens.ts` fallback 훅, `createKernel.ts` resolveFallback API, `macFallbackMiddleware.ts` 신규, `KeyboardListener.tsx` 2-pass 제거 |
