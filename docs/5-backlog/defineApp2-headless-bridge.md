# defineApp2 → Headless Bridge 설계

> 작성일: 2026-03-13
> 출처: pit-of-success T10 Blocker

## 문제

defineApp2의 `ZoneBinding2Entry`와 headless `ZoneBindingEntry`가 비호환:

- **defineApp2**: `{ role, commands: Record<string, CommandFactory>, data: (state) => E[] }`
- **headless**: `{ role, bindings: { getItems, onCheck, onAction, onDelete, ... }, keybindings?, triggers? }`

`createPage(app)` → `registerZones(app.__zoneBindings)` 파이프라인에서 commands 기반 API를 callbacks 기반 API로 변환하는 bridge가 필요.

## 핵심 질문

Zone-scoped commands(`toggleTodo`, `deleteTodo`)가 OS-level callbacks(`onCheck`, `onAction`, `onDelete`)에 어떻게 매핑되는가?

## 후보 접근

1. **명시적 매핑**: `createZone("list", { ..., headless: { onCheck: toggleTodo, onDelete: deleteTodo } })`
2. **Convention 기반**: command 이름 패턴으로 자동 매핑 (e.g., `toggle*` → `onCheck`)
3. **Adapter 함수**: `toHeadlessBindings(app.__zoneBindings)` 변환기

## 의존

- pit-of-success Unresolved #5
- BOARD.md T10 (Blocked)
