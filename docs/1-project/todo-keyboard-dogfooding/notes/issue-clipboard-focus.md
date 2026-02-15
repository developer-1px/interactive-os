# 🐛 Todo 앱에서 복사/붙여넣기 시 포커스가 붙여넣기 된 곳으로 이동하지 않음
> 등록일: 2026-02-13
> 상태: resolved ✅
> 심각도: P2

## 원문
todo앱에서 복사나 붙여넣기 시 포커스 위치가 붙여넣기 된 곳이 아냐

## 해석
- **기대 동작**: `Cmd+C` → `Cmd+V` 시 새로 생성된 항목에 포커스가 이동해야 한다
- **실제 동작**: 붙여넣기 후 포커스가 원래 위치에 그대로 남아있다
- `DuplicateTodo`(Cmd+D), Undo/Redo 후 포커스 복원도 동일한 문제를 가질 가능성이 높다

## 첫 감
`PasteTodo`가 `state.effects.push({ type: "FOCUS_ID", id: newId })`로 포커스 요청을 남기지만, 이 `state.effects[]` 큐를 소비하는 코드가 **존재하지 않는다**.

커널의 올바른 패턴은 커맨드 핸들러에서 `{ focus: itemId }`를 반환하는 것 (예: `NAVIGATE`가 `{ focus: navResult.targetId, scroll: navResult.targetId }`를 반환하는 것처럼). 이렇게 하면 `kernel.defineEffect("focus")`로 등록된 `FOCUS_EFFECT`가 DOM `el.focus()`를 트리거한다.

**변경 예상 파일**:
- `src/apps/todo/features/commands/clipboard.ts` — `PasteTodo`, `DuplicateTodo`
- `src/apps/todo/features/commands/history.ts` — `UndoCommand`, `RedoCommand`

## 관련 이슈
- [2026-02-13_native-clipboard-blocked.md](./2026-02-13_native-clipboard-blocked.md) — 클립보드 관련 이슈
