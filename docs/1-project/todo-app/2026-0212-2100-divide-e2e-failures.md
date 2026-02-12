# E2E 테스트 실패 6건 — Divide 분석

## 분해 구조

6개 실패를 **정답 유무** 기준으로 분류:

### ✅ Determinate (정답 있음 — 바로 실행 가능)

| # | 테스트 | 원인 | 해법 |
|---|--------|------|------|
| 1 | **Edit: Enter saves** | `FIELD_COMMIT`이 `UpdateTodoText`를 dispatch하지 않음. FieldRegistry에 `onSubmit`이 등록되지만 FIELD_COMMIT에서 호출 안 함. ID 불일치 (`editingItemId="1"` vs field `name="EDIT"`) | FIELD_COMMIT에 FieldRegistry bridge 추가 (작업 중) |
| 2 | **Backspace deletes** | `OS_DELETE` → `onDelete` 파이프라인 존재. keybinding `Backspace → OS_DELETE` 확인 필요 | keybinding 확인 → 연결 |
| 3 | **Arrow navigation** | `ArrowDown → NAVIGATE({ direction: "next" })` 존재. navigate 커맨드의 focus 이동 로직 확인 | navigate 커맨드 디버깅 |

### ❓ Indeterminate (정답 없음 — 나눠서 봐야 함)

| # | 테스트 | 문제 | 나눌 축 |
|---|--------|------|---------|
| 4 | **Meta+Arrow reorders** | `getCanonicalKey`에서 `Meta+ArrowDown → "End"` 리매핑 발견! macOS 네이티브 동작과 OS 커맨드 충돌 | **책임**: getCanonicalKey가 OS keybinding보다 먼저 변환 → 키매핑 우선순위 설계 문제 |
| 5 | **Sidebar keyboard nav** | Sidebar Zone의 ArrowDown이 focus를 이동시키는지, ACTIVATE(Enter)가 category selection을 트리거하는지 | **레이어**: (a) Zone wiring (b) ACTIVATE → onAction 연결 (c) Sidebar 컴포넌트 |
| 6 | **Sidebar Meta+Arrow** | #4와 동일한 getCanonicalKey 문제 + Sidebar Zone에 onMoveUp/Down이 등록되었는지 | **모듈**: getCanonicalKey 해결 후 재검증 |

## 실행 완료

- `FIELD_COMMIT` bridge 작업 착수: FieldRegistry에서 `onSubmit` 찾아 dispatch하는 코드 추가
- ID 불일치 발견 (`editingItemId` vs field `name`) → `getActiveField()` fallback 추가

## 미결

### 1. `getCanonicalKey` 키매핑 충돌 (정답 없음)
- `Meta+ArrowDown`이 `"End"`로 변환됨 → keybinding에서 `Meta+ArrowDown` 매칭 불가
- **선택지**:
  - (A) `getCanonicalKey`에서 리매핑 제거 → macOS 네이티브 동작 깨질 수 있음
  - (B) keybinding에 `End` → `OS_MOVE_DOWN` 추가 → 의미가 다름
  - (C) `getCanonicalKey`와 keybinding 사이 우선순위 도입 → 복잡도 증가
- → **사용자 결정 필요**

### 2. FIELD_COMMIT ID 불일치 (정답 있지만 설계 냄새)
- 현재: `editingItemId="1"` (todo ID), field `name="EDIT"` (고정)
- 이건 돌아가지만 근본적으로 editingItemId와 field name 매핑이 없음
- → 당장은 workaround로 진행, 나중에 설계 정리

## 다음 단계

1. **정답 있는 것 먼저**: Edit Save (#1), Backspace (#2), Arrow Nav (#3)
2. **정답 없는 것**: getCanonicalKey 충돌 (#4, #6) → 사용자와 토론
3. **Sidebar (#5, #6)**: #4 해결 후 재검증
