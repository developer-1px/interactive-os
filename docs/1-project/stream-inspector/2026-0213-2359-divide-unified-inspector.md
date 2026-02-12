# UnifiedInspector 고도화 — Divide 보고서

## 대상

`src/inspector/panels/UnifiedInspector.tsx` — Inspector의 "Vision" 탭.

## 분해 결과

| 조각 | 정답 유무 | 검증 방법 | 결과 |
|------|----------|----------|------|
| `InspectorEvent` 타입 제거 → `Transaction` 직접 사용 | ✅ 정답 | tsc 빌드 | ✅ 0 errors |
| `inferPipeline()` 순수함수 | ✅ 정답 | 단위 테스트 | ✅ 12/12 passed |
| `InspectorAdapter` 단순화 | ✅ 정답 | tsc 빌드 | ✅ 0 errors |
| null safety (`tx.changes`, `tx.effects`) | ✅ 정답 | 단위 테스트 | ✅ null 케이스 통과 |
| UI/UX (파이프라인 바 디자인) | ❌ 정답 없음 | 사용자 확인 필요 | ⏳ |

## 실행한 것

### 1. `UnifiedInspector.tsx` 재작성

- `InspectorEvent` 중간 타입 제거 → `Transaction[]` 직접 수신
- `inferPipeline(tx)`: 순수함수로 6-Domino 추론
  - Input → Dispatch → Command → State → Effect → Render
  - 각 단계별 pass/fail/skip 판정
- 파이프라인 바: 수평 칩 레이아웃, 색상 구분 (emerald=pass, red=fail, gray=skip)
- 확장 시 Kernel(handler/path) → State Diff → Effects → Raw 순서

### 2. `InspectorAdapter.tsx` 단순화

- ~100줄 → ~17줄. 변환 로직 전부 제거
- `kernel.getTransactions()` → `UnifiedInspector`로 패스스루

### 3. `inferPipeline.test.ts` 단위 테스트

- 12 케이스, 4ms 전체 통과
- 6-domino 순서, pass/fail/skip 추론, null safety, detail 내용 검증

## 남은 것

- UI/UX 확인: 실제 브라우저에서 파이프라인 바가 의도한 대로 보이는지 (사용자 확인)
- 추가 기능: Time Travel, 검색/필터, Correlation ID 등은 별도 과제
