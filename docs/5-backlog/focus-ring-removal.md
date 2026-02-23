# Focus Ring 제거 — OS FocusItem의 네이티브 :focus-visible outline

## 증상

FocusItem에 `.focus()`가 호출되면 브라우저 UA 스타일시트의 `:focus-visible { outline: -webkit-focus-ring-color auto 1px; }` 가 적용되어 파란 ring이 보임.

OS는 `data-focused` + `isFocused` render prop으로 자체 포커스 시각화를 제공하므로 이 ring은 중복.

## 시도한 것

- `* { outline-width: 0; }` — specificity (0,0,0)이 UA의 `:focus-visible` (0,1,0)에 짐
- `[data-focus-item]:focus-visible { outline: none; }` — specificity (0,1,1)로 이겨야 하는데 안 됨
  - 원인 미확인: Tailwind v4 `@import "tailwindcss"` 레이어 우선순위? 다른 요인?

## 해결 방향

- DevTools에서 실제 적용되는 규칙 체인 확인
- `!important` 테스트 (임시)
- Tailwind v4 CSS Layer cascade 확인
- 또는 FocusItem에서 인라인 `style={{ outline: 'none' }}` 직접 적용 검토
