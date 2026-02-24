# /divide — DocsViewer Todo 패턴 리팩토링 (v2)

> Date: 2026-02-23 21:15
> Supersedes: 2026-0223-2114-report-divide-docsviewer-pattern.md

## 근본 원인

`ZoneCursor`가 `{ focusId, selection, anchor }`만 전달.
OS가 이미 아는 `isExpandable`, `isDisabled`, `treeLevel`을 안 넘김.
→ 앱이 `id.startsWith("folder:")` 같은 문자열 컨벤션으로 우회.

## Tasks

| # | Task | Domain | Dep |
|---|------|--------|-----|
| T1 | `ZoneCursor`에 meta 추가 (isExpandable, isDisabled, treeLevel) | Clear | — |
| T2 | `buildZoneCursor`에서 ZoneRegistry 읽어 meta 주입 | Clear | T1 |
| T3 | DocsApp state 추가 (activePath) | Clear | — |
| T4 | `selectDoc` 커맨드 정의 (app.ts) | Clear | T3 |
| T5 | bind()에 onAction/onSelect 연결 (Todo 패턴) | Clear | T4 |
| T6 | DocsSidebar handleAction/handleSelect 제거 | Clear | T5 |

## Reference: Todo Sidebar 패턴

```typescript
onAction: (cursor) => selectCategory({ id: cursor.focusId }),
onSelect: (cursor) => selectCategory({ id: cursor.focusId }),
```

## Warrants (from Discussion)

- W7: 앱이 인터랙션 라우팅을 하면 Headless 경계 위반
- W13: OS가 meta를 전달해야. 판단은 앱. 재료는 OS.
- W16: behavior는 defineApp.command. 콜백을 컴포넌트에 쓰면 누출.
