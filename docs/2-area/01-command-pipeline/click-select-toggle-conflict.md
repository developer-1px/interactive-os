# Click → SELECT → onToggle 충돌 문제

**발견일**: 2026-02-12
**심각도**: 🔴 구조적 결함 (E2E 7개 테스트 실패의 핵심 원인)

## 문제 요약

`FocusListener.senseMouseDown`이 **모든 mousedown**에서 `FOCUS + SELECT`를 디스패치한다.
`SELECT`는 `ZoneRegistry.onToggle`이 등록된 Zone에서 앱의 토글 커맨드(예: `ToggleTodo`)를 실행한다.

**결과**: Todo 아이템 클릭 = 완료/미완료 토글. 의도치 않은 동작.

## 재현 경로

```
mousedown on todo item
  → FocusListener.senseMouseDown()
    → kernel.dispatch(FOCUS({zoneId, itemId}))     // ✅ 정상
    → dispatchSelectCommand(e, itemId)              // ❌ 문제
      → kernel.dispatch(SELECT({mode: "replace"}))
        → SELECT handler checks ZoneRegistry.onToggle
          → resolveFocusId(ToggleTodo({id: "OS.FOCUS"}), "1")
            → kernel.dispatch(ToggleTodo({id: 1}))  // 💥 의도치 않은 토글
```

## 검증된 사실 (Vitest 60/60)

- L2~L6 파이프라인은 모두 정상 동작
- **현재 코드의 설계 의도대로** 정확히 동작 중 (코드 버그 아님, **설계 충돌**)

## 설계 충돌 분석

| 개념 | OS Selection | App Toggle |
|------|-------------|------------|
| 트리거 | 클릭, Shift+클릭, Ctrl+클릭 | Space 키 |
| 의미 | 시각적 선택/하이라이트 | 체크박스 on/off |
| 기대 | 클릭 → 아이템 선택 표시 | Space → 완료 토글 |
| 현실 | `SELECT` 커맨드가 둘 다 처리 | `onToggle`이 모든 SELECT에 반응 |

**핵심**: `SELECT` 커맨드가 "OS 선택"과 "앱 토글"을 구분 없이 처리.

## 해결 옵션

### A. SELECT에서 onToggle 분리

`SELECT` 핸들러에서 `onToggle`을 제거하고, `onToggle`은 Space 키 전용 커맨드(새 `TOGGLE` 커맨드)로 분리.

```diff
// select.ts
- if (entry?.onToggle) {
-   return { dispatch: resolveFocusId(entry.onToggle, targetId) };
- }
```

```typescript
// 새 TOGGLE 커맨드 (Space 전용)
export const TOGGLE = kernel.defineCommand("OS_TOGGLE", ...);
```

**장점**: SELECT = 시각적 선택 only. 깔끔한 분리.
**단점**: Space keybinding 변경 필요, osDefaults 수정.

### B. FocusListener에서 클릭 시 SELECT 제거

`senseMouseDown`에서 `dispatchSelectCommand` 호출을 제거하거나, 무수정 클릭(no modifier)일 때는 SELECT를 디스패치하지 않도록 변경.

```diff
// FocusListener.tsx
- // Then SELECT based on modifiers
- dispatchSelectCommand(me, itemId);
+ // SELECT only with explicit modifier keys
+ if (e.shiftKey || e.metaKey || e.ctrlKey) {
+   dispatchSelectCommand(me, itemId);
+ }
```

**장점**: 기존 커맨드 구조 유지. 최소 변경.
**단점**: "클릭 = 선택" 패러다임 깨짐. 다중 선택 앱에서 단일 클릭 선택 불가.

### C. SELECT handler에서 mousedown 원천 구분

`SELECT` 핸들러가 `meta.input.type === "MOUSE"`일 때 `onToggle`을 생략.

```typescript
// select.ts handler
const entry = ZoneRegistry.get(activeZoneId);
if (entry?.onToggle && !isMouseTriggered) {
  return { dispatch: resolveFocusId(entry.onToggle, targetId) };
}
```

**장점**: 커맨드, 바인딩 구조 변경 없음.
**단점**: 커맨드 핸들러가 입력 소스를 알아야 — 관심사 분리 위반.

## 추천

**옵션 A** (SELECT와 TOGGLE 분리)를 추천. OS의 원래 설계 철학(각 커맨드 = 하나의 명확한 의미)에 부합.

## 관련 파일

- [FocusListener.tsx](file:///Users/user/Desktop/interactive-os/src/os-new/1-listeners/FocusListener.tsx) — L131, `senseMouseDown`
- [select.ts](file:///Users/user/Desktop/interactive-os/src/os-new/3-commands/selection/select.ts) — L46-51, `onToggle` 분기
- [osDefaults.ts](file:///Users/user/Desktop/interactive-os/src/os-new/keymaps/osDefaults.ts) — Space→SELECT 바인딩
- [todo.spec.ts](file:///Users/user/Desktop/interactive-os/e2e/todo/todo.spec.ts) — 실패하는 E2E 테스트
