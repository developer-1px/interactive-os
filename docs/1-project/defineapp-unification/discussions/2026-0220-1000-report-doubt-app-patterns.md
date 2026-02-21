# /doubt 결과 (Todo + Builder 앱 선언 패턴 — 2라운드 수렴)

## 대상
- `src/apps/todo/app.ts` (379줄) — Todo defineApp 선언
- `src/apps/todo/triggers.ts` (52줄) — Trigger 컴포넌트 선언
- `src/apps/builder/app.ts` (267줄) — Builder defineApp 선언

## 라운드 요약
| Round | 🔴 제거 | 🟡 축소 | ↩️ 자기교정 | 수렴? |
|:-----:|:------:|:------:|:---------:|:----:|
| 1     | 1      | 1      | 0         | ❌  |
| 2     | 0      | 0      | 0         | ✅  |

## 🔴 제거 (총 1건)
- **`triggers.ts` 파일 전체 삭제** (52줄): `DeleteButton`, `DuplicateButton`, `ToggleButton`, `EditButton` — 4개 Simple Trigger가 **어디서도 import되지 않는** 완전한 Dead Code (과잉생산). `ClearDialog`만 유일하게 사용되었으나 `TodoToolbar`로 이관 후 파일 자체가 불필요해짐.

## 🟡 축소/이관 (총 1건)
- **`ClearDialog` → `TodoToolbar`로 이관**: 별도 파일에 있던 ClearDialog를 `TodoToolbar` namespaced export에 통합. `TodoToolbar.ClearDialog.Root/Trigger/Content/Dismiss/Confirm` 형태로 접근 가능. `TodoToolbar.tsx`의 import를 `triggers.ts`에서 `app.ts`로 변경.

## 🟢 유지 (주요 항목)
- **Namespaced export 패턴** (`TodoList`, `TodoSidebar` 등): Zone/Item/Field + commands + triggers를 하나의 namespace로 묶는 패턴. 뷰에서 `TodoList.Zone`, `TodoList.triggers.DeleteTodo` 등으로 활발히 사용
- **CRUD re-export 7건** (`deleteTodo` 등): `TodoList.commands.*`와 중복이지만 직접 import가 더 간결한 테스트에서 유효. zero-cost alias
- **`*UI` export 5건**: namespaced export의 raw material이며, 직접 사용 가능성을 열어둠
- **`listCollection` export**: integration test에서 `.cut()` 직접 호출용 escape hatch
- **import 분산 배치**: section별 구분으로 가독성 확보하는 의도적 선택
- **Builder에 Namespaced export 없음**: Builder는 자체 `Builder.Item` 프리미티브 사용 — 구조가 달라 강제 통일 불필요 (이전 T6 판정 유지)

## 📊 Before → After (누적)
- 파일 수: 3개 → 2개 (−1파일)
- 줄 수: 698줄 → 652줄 (−46줄, triggers.ts 52줄 삭제 + ClearDialog 6줄 추가)
