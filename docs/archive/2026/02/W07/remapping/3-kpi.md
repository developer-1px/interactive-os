# 리매핑 설계 — KPI

## 성공 기준

| # | 지표 | 현재 값 | 목표 값 | 측정 방법 |
|---|------|---------|---------|-----------|
| 1 | `KeyboardListener` 내 플랫폼 분기 | 1 (`getMacFallbackKey` 호출) | 0 | `grep getMacFallbackKey KeyboardListener.tsx` |
| 2 | `getCanonicalKey` 내 Mac normalization | 1 (`MAC_KEY_NORMALIZATION` 사용) | fallback으로 이동 | `getCanonicalKey.ts`에서 `MAC_KEY_NORMALIZATION` export만, 내부 사용 없음 |
| 3 | 커널 `resolveFallback` API | 없음 | 존재 + 테스트 통과 | `createKernel.ts`에 `resolveFallback` 함수 존재 |
| 4 | Middleware `fallback` 훅 | 없음 | 타입 정의됨 | `tokens.ts`의 `Middleware` 타입에 `fallback` 필드 |
| 5 | Mac fallback 미들웨어 | 없음 | 등록 + 테스트 통과 | `mac-normalize` 미들웨어 파일 존재 |
| 6 | 기존 키바인딩 테스트 | PASS | PASS (회귀 없음) | `vitest run keybindings.test.ts` |
| 7 | `Meta+ArrowUp` → `OS_MOVE_UP` (Mac) | PASS (2-pass inline) | PASS (미들웨어 경유) | E2E 또는 통합 테스트 |
