# defineApp — KPI

## 성공 기준

| 지표 | 현재 값 (v2) | 목표 값 (v3) | 실측 값 (v5) | 상태 |
|------|:---:|:---:|:---:|:---:|
| 위젯 import 문 수 | 19줄 (5개 위젯) | ≤10줄 | 19줄 | ⚠️ 유지 |
| Zone 바인딩 코드 줄 수 | 10줄/Zone | **0줄** | **0줄** | ✅ |
| 위젯에서 `OS` import | 필요 | **불필요** | 3개 위젯 (OS.When, OS.Trigger) | ⚠️ 부분 달성 |
| 커맨드 네이밍 이중 표현 | 있음 | **없음** | **없음** | ✅ |
| 테스트 API | `app.dispatch.toggleTodo()` | **동일** (호환) | **동일** (v3 30개 호환) | ✅ |
| Unit test | 21/21 pass | 21/21 pass | **171/171 pass** | ✅✅ |
| E2E test | 11/12 pass | 11/12 pass | **12/12 pass** | ✅✅ |

## 비고

- **import 줄 수**: 위젯이 Zone/Field를 앱에서 import하므로 줄 수는 비슷하나, OS 바인딩 코드(onCheck, onAction 등)가 0줄로 감소
- **OS import 3개**: `OS.When` (조건부 렌더링), `OS.Trigger` (체크박스 트리거) — 이들은 범용 프리미티브로 앱이 직접 사용하는 것이 자연스러움
- **E2E 12/12**: 원본(v2) 대비 개선됨. Meta+Arrow reorder + sidebar navigation까지 통과
