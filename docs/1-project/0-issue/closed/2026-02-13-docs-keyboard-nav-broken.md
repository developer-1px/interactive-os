# 🐛 [Closed] Docs 키보드 네비게이션(←/→) 동작 안함
> 등록일: 2026-02-13
> 상태: closed
> 심각도: P1

## 원문
docs에 있던 키보드 네비게이션이 안돼 확인해서 수정

## 해석
- **기대 동작**: Docs 페이지에서 ArrowLeft/Right 키로 헤딩 간 스크롤(heading-snapping)이 동작해야 함
- **실제 동작**: 아무 반응 없음. ArrowLeft/Right가 씹힘

## 첫 감
미들웨어 조건이 `activeZoneId`를 체크하는데, 다른 페이지에서 세팅된 stale한 `activeZoneId`가 docs 페이지에서도 남아있어서 redirect가 안 될 것 같다.

## 진단 결과

**근본 원인**: `register.ts:122` 미들웨어 가드 `if (state.os.focus.activeZoneId) return ctx`가 stale한 `activeZoneId`를 구분하지 못함.

### 상세 추적

1. `KeyboardListener` → `Keybindings.resolve("ArrowRight")` → `NAVIGATE({ direction: "right" })` dispatch
2. `processCommand`에서 GLOBAL scope 미들웨어 실행:
   - `docsNavigateMiddleware.before()` 진입
   - `ctx.command.type === "OS_NAVIGATE"` ✅
   - `document.querySelector("[data-docs-scroll]")` ✅ (DocsPage에 존재)
   - **`state.os.focus.activeZoneId`가 non-null** → `return ctx` (redirect 스킵) ❌
3. `OS_NAVIGATE` 핸들러 실행: `if (!activeZoneId) return` — 반대로 activeZoneId가 있으니 진행
4. 하지만 해당 zone에 등록된 DOM items가 없음 → `items.length === 0` → early return
5. 결과: 아무 일도 안 일어남

### `activeZoneId`가 stale한 이유
- 이전 페이지(Todo, Builder 등)에서 zone에 포커스를 주면 `SYNC_FOCUS`가 `activeZoneId`를 설정
- 라우트 이동 시 이전 zone은 `ZoneRegistry`에서 unregister되지만, **커널 상태의 `activeZoneId`는 클리어되지 않음**
- Docs 페이지에 도착해도 stale한 `activeZoneId`가 그대로 남아있음

### 테스트가 통과하는 이유
- 단위 테스트에서 `kernel.setState`로 `activeZoneId: null`을 수동 설정
- 실제 런타임의 stale 상태를 재현하지 못함

## 관련 이슈
없음

## 해결 요약
- 원인: 라우트 이동 후 stale한 `activeZoneId`가 미들웨어 가드를 통과시킴
- 수정: `register.ts` 미들웨어 가드에서 zone DOM 존재 + focusable items 확인 로직 추가
- 검증: smoke ✅ / type ✅ / test 8/8 ✅
