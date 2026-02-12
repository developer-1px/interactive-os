# defineApp — KPI

## 성공 기준

| 지표 | 현재 값 (v2) | 목표 값 (v3) | 측정 방법 |
|------|:---:|:---:|-----------|
| 위젯 import 문 수 | 19줄 (5개 위젯) | ≤10줄 | `grep "^import" widgets-v3/*.tsx \| wc -l` |
| Zone 바인딩 코드 줄 수 | 10줄/Zone | **0줄** | 위젯 JSX에서 `onCheck=`, `onAction=` 등 수동 바인딩 수 |
| 위젯에서 `OS` import | 필요 | **불필요** | `grep "from.*@os" widgets-v3/` |
| 커맨드 네이밍 이중 표현 | 있음 (`TOGGLE_TODO` ≠ `toggleTodo`) | **없음** (키 = 문자열) | `define.command` 호출 패턴 검사 |
| 테스트 API | `app.dispatch.toggleTodo()` | **동일** (호환) | 테스트 코드 변경 없이 통과 |
| Unit test | 21/21 pass | 21/21 pass | `vitest run` |
| E2E test | 11/12 pass (원본과 동일) | 11/12 pass (원본과 동일) | `playwright test` |
