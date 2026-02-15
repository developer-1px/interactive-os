# fix-tab-navigation

> Tab/Shift+Tab 키보드 네비게이션 회귀 버그 수정

## WHY

`/playground/focus` 페이지에서 Tab과 Shift+Tab이 작동하지 않는다.
원래 Tab `escape`와 `flow` 모드에서 예상되는 동작이 발생하지 않는다.

## Root Cause (진단 완료)

### 원인 체인:
1. `KeyboardListener`가 Tab 키를 **무조건 가로챈다** (capture: true + `e.preventDefault()`)
2. `osDefaults.ts`에서 `Tab`/`Shift+Tab`에 대한 keybinding이 등록되어 있으므로 항상 resolve됨
3. `TAB` 커맨드가 실행되면:
   - `trap` 모드: ✅ 정상 — `{ state, focus: targetId }` 리턴 → 커널 focus effect 실행
   - `flow` 모드 (내부 이동): ✅ 정상 — `{ state, focus: targetId }` 리턴
   - `flow` 모드 (경계): ❌ **`{ tabEscape: direction }` 리턴** → 커널에 `tabEscape` effect 미등록
   - `escape` 모드: ❌ **`{ tabEscape: direction }` 리턴** → 커널에 `tabEscape` effect 미등록
4. 네이티브 Tab은 이미 `e.preventDefault()`로 차단됨 → 아무 일도 안 일어남

### 핵심: `tabEscape` effect가 커널에 등록되지 않은 채 result로만 리턴됨

## Goals

1. `escape` 모드: Tab → 브라우저 네이티브 Tab으로 zone 밖의 다음 focusable로 이동
2. `flow` 모드: 내부를 다 순회한 뒤 경계에서 → 네이티브 Tab으로 escape
3. `trap` 모드: 변경 없음 (이미 정상 동작)
4. Shift+Tab은 모든 모드에서 역방향 대응

## Scope

- **In**: `tab.ts` 커맨드, `KeyboardListener.tsx`의 Tab 처리, E2E 테스트 추가
- **Out**: cross-zone Tab navigation (Phase 5 계획), 다른 키보드 기능
