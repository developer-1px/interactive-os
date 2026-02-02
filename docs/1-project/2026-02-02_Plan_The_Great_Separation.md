# Plan: The Great Separation (Command / Key / Menu)

## 1. Objective
User 님의 확인대로, **`when` 조건을 커맨드에서 제거하고 Keybinding과 Menu로 분리**하여 명확한 역할 분담(Separation of Concerns)을 구현합니다.

## 2. Changes
### A. `todo_commands.ts` (Purification)
-   `when` 속성을 제거합니다. (Pure Command Logic만 남음)
-   `allowInInput` 등 순수 로직 속성은 유지합니다.

### B. `todo_keys.ts` (Input Jurisdiction)
-   모든 키바인딩에 명확한 `when` 조건을 부여합니다.
-   예: `Enter` 키의 경우 `Zones.TodoList` vs `Zones.Sidebar` 조건을 여기서 관리합니다.

### C. `todo_menus.ts` (New UI Jurisdiction)
-   커맨드 팔레트, 버튼, 컨텍스트 메뉴를 위한 노출 조건을 정의합니다.
-   기존 `Command.when`이 하던 역할(UI 가시성)을 이쪽으로 옮깁니다.

## 3. Migration Steps
1.  **Create `todo_menus.ts`**: 기존 커맨드의 `when` 조건을 기반으로 메뉴 정의 생성.
2.  **Update `CommandRegistry`**: `getMenu(id)` 같은 메서드 추가 (UI 쪽 조회용).
3.  **Refactor `todo_keys.ts`**: input-specific `when` 들이 모두 잘 정의되어 있는지 확인.
4.  **Purge `todo_commands.ts`**: `when` 삭제.
5.  **Update UI (`CommandInspector`)**: `Command.when` 대신 `MenuRegistry`나 `KeyRegistry`를 참조하여 상태 표시.

이 작업을 진행하시겠습니까? (예상 공수: Medium)
