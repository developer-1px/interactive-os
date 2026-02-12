# createModule Usage 회고: todoSlice → TodoModule 마이그레이션

| 항목 | 값 |
|------|-----|
| 원문 | 회고를 써봐 특히 usage를 중심으로 어떤가 궁금해 |
| 내(AI)가 추정한 의도 | createModule이 실제 위젯 코드에서 어떤 DX 차이를 만드는지, 도입 가치가 있는지 판단하고 싶다 |
| 날짜 | 2026-02-13 |
| 상태 | 검증 완료 (v2: 11/12 E2E, 21 unit — 원본과 동일) |

---

## 1. 개요

`todoSlice` + 분산 커맨드 파일 5개로 구성된 기존 Todo 앱을, `createModule` 기반 `TodoModule` 단일 모듈로 교체하는 마이그레이션을 수행했다. 이 보고서는 **위젯(소비자) 코드 관점에서의 usage 변화**를 분석한다.

---

## 2. 정량 비교

### Import 구조

| 지표 | v1 (todoSlice) | v2 (TodoModule) | 변화 |
|------|:-:|:-:|:-:|
| import 문 수 (5개 위젯 합계) | 28 | 19 | **-32%** |
| 고유 import source 수 | 13 | 9 | **-30%** |
| 총 줄 수 | 588 | 492 | **-16%** |

### Import Source 비교

**v1에만 있는 것 (v2에서 제거됨):**
- `@apps/todo/app` (todoSlice)
- `@apps/todo/features/commands/list` (AddTodo, DeleteTodo 등 8개)
- `@apps/todo/features/commands/clipboard` (CopyTodo, CutTodo, PasteTodo)
- `@apps/todo/features/commands/history` (UndoCommand, RedoCommand)
- `@apps/todo/features/commands/ToggleView`
- `@apps/todo/features/commands/MoveCategoryUp` (MoveCategoryUp, MoveCategoryDown, SelectCategory)

**v2에서 대체:**
- `@apps/todo/module` (TodoModule) — **단 1개**

### 파일별 줄 수

| 위젯 | v1 | v2 | 변화 |
|------|:-:|:-:|:-:|
| ListView | 126 | 105 | -17% |
| TaskItem | 181 | 151 | -17% |
| TodoToolbar | 95 | 67 | **-29%** |
| Sidebar | 161 | 147 | -9% |
| TodoPanel | 25 | 22 | -12% |

---

## 3. 질적 분석 — Usage 패턴 변화

### 3.1 Before: "어디서 뭘 가져오지?"

```tsx
// ListView.tsx — v1: 7개 import 문, 3개 커맨드 파일에서 12개 심볼
import { CopyTodo, CutTodo, PasteTodo } from "@apps/todo/features/commands/clipboard";
import { RedoCommand, UndoCommand } from "@apps/todo/features/commands/history";
import { AddTodo, DeleteTodo, MoveItemDown, MoveItemUp, StartEdit, SyncDraft, ToggleTodo } from "@apps/todo/features/commands/list";
import { TaskItem } from "@apps/todo/widgets/TaskItem";
import { OS } from "@os/AntigravityOS";
import { todoSlice } from "@apps/todo/app";
import { Plus} from "lucide-react";
```

**문제:**
- 커맨드가 `clipboard.ts`, `history.ts`, `list.ts`, `ToggleView.ts`, `MoveCategoryUp.ts`에 분산 → **새 커맨드를 쓰려면 어떤 파일에 있는지 먼저 찾아야 함**
- `todoSlice`(상태)와 커맨드 파일(액션)이 별도 import → 둘의 관계가 명시적이지 않음
- 새 개발자가 "delete는 어디에?" 하고 물으면 `features/commands/list.ts` 안에 있다고 답해야 함

### 3.2 After: "모듈 하나면 끝"

```tsx
// ListViewV2.tsx — v2: 4개 import 문, 도메인 import는 TodoModule 하나
import { TodoModule } from "@apps/todo/module";
import { TaskItemV2 } from "@apps/todo/widgets-v2/TaskItemV2";
import { OS } from "@os/AntigravityOS";
import { Plus } from "lucide-react";
```

**개선:**
- `TodoModule.commands.xxx` — 자동완성으로 모든 커맨드 발견 가능
- `TodoModule.useComputed` — 상태 구독도 같은 객체에서
- **import source가 1개 → 인지 부하 최소화**

### 3.3 Usage 패턴: Zone 바인딩

```diff
 // v1 — 각 커맨드를 개별 import해서 바인딩
-onCheck={ToggleTodo({ id: OS.FOCUS })}
-onCopy={CopyTodo({ id: OS.FOCUS })}
-onDelete={DeleteTodo({ id: OS.FOCUS })}
-onUndo={UndoCommand()}
+// v2 — cmds 하나로 통일
+const cmds = TodoModule.commands;
+onCheck={cmds.toggleTodo({ id: OS.FOCUS })}
+onCopy={cmds.copyTodo({ id: OS.FOCUS })}
+onDelete={cmds.deleteTodo({ id: OS.FOCUS })}
+onUndo={cmds.undoCommand()}
```

**차이:** 커맨드 네이밍이 `PascalCase`(class-like) → `camelCase`(method-like)로 바뀜. `cmds.` prefix가 자동완성의 진입점 역할.

### 3.4 아직 느껴지는 마찰점

1. **커맨드 이름 불일치**: v1은 `ToggleTodo`, `CopyTodo`(PascalCase), v2는 `toggleTodo`, `copyTodo`(camelCase). 컨벤션은 v2가 맞지만, 기존 코드와 혼용 기간에 혼동 가능.

2. **`cmds.syncDraft`와 `cmds.addTodo`의 호출 형태 차이**: `onChange`에는 커맨드 팩토리 자체를 넘기고(`cmds.syncDraft`), `onSubmit`에도 팩토리 자체를 넘기지만, Zone 이벤트에는 호출한 결과(`cmds.addTodo()`)를 넘김. 이 차이가 직관적이지 않을 수 있음.

3. **module.ts가 500줄**: 모든 커맨드를 한 파일에 모으니 파일이 커짐. 하지만 import하는 쪽의 복잡도가 줄었으므로 **복잡성이 소비자→생산자로 이동**한 것이고, 이는 의도된 트레이드오프.

---

## 4. 해법 유형

🟡 **Constrained** — 모듈 패턴 자체는 업계 Best Practice(Facade)이지만, 기존 코드와의 공존 방식, 네이밍 컨벤션, 파일 크기 관리는 프로젝트 맥락에 따른 선택이 필요.

---

## 5. 인식 한계

- 이 분석은 **코드 정적 분석 + E2E 테스트 결과**에 기반. 런타임 성능 차이는 측정하지 않았다.
- v2 위젯은 AI가 기계적으로 변환한 것이므로, 사람이 처음부터 TodoModule API로 작성했을 때의 DX와는 다를 수 있다.
- module.ts 내부의 커맨드 핸들러 로직은 기존 분산 파일에서 복사한 것으로, 리팩토링 여지가 있다.

---

## 6. 열린 질문

1. **module.ts 파일 크기 관리**: 500줄이 넘어감. 커맨드를 별도 파일로 분리하되 `TodoModule.commands`로 re-export하는 패턴이 필요한가? 아니면 현재 구조가 충분한가?

2. **마이그레이션 전략**: v2가 검증되었으므로, 기존 widgets를 바로 삭제하고 v2로 교체할 것인가, 아니면 점진적으로 전환할 것인가?

3. **다른 앱에 적용**: Builder 같은 다른 앱에도 createModule 패턴을 적용할 것인가? 적용한다면 우선순위는?

---

**한줄요약**: createModule은 위젯 코드의 import 복잡도를 -32% 줄이고, 커맨드 발견성(discoverability)을 획기적으로 높이며, 복잡성을 소비자→생산자로 의도적 이동시키는 Facade 패턴으로 DX 개선 효과가 확인됨.
