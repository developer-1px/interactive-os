# ARIA E2E 테스트 실패 분석

## 1. 개요 (Overview)

`e2e/aria-showcase/` 의 **9개 스펙, 51개 테스트** 전체 실패 → 원인 수정 후 **40 passed / 11 failed**.

## 2. 수정 완료: 라우트 URL 불일치

모든 스펙의 `beforeEach`가 `/aria-showcase`로 이동했으나 실제 라우트는 `/playground/aria`.

```diff
- await page.goto("/aria-showcase");
+ await page.goto("/playground/aria");
```

9개 파일 전부 수정 → **40개 테스트 통과**.

## 3. 잔여 실패 11건 분석

| # | 스펙 파일 | 테스트명 | 실패 유형 |
|---|---|---|---|
| 1 | `complex-patterns` | Dialog: Escape to Close | focus restore 실패 |
| 2 | `complex-patterns` | AlertDialog: Cancel Action | focus restore 실패 |
| 3 | `disclosure` | Enter Key Toggle | Enter 키로 `aria-expanded` 토글 안 됨 |
| 4 | `disclosure` | Space Key Toggle | Space 키로 `aria-expanded` 토글 안 됨 |
| 5 | `grid` | Home/End Navigation | Home/End 키 미지원 |
| 6 | `menu` | Checkbox Toggle | Space → `aria-checked` 토글 안 됨 |
| 7 | `menu` | Click Interaction | disabled 아이템 click 시 timeout (`aria-disabled` 요소에 Playwright click 차단) |
| 8 | `toolbar` | Toggle Buttons | Enter → `aria-pressed` 토글 안 됨 |
| 9 | `toolbar` | Click Toggle | click → `aria-pressed` 초기값 기대 불일치 |
| 10 | `toolbar` | Disabled Button | disabled 요소 click timeout |
| 11 | `tree` | Click Interaction | click → `aria-expanded` 토글 안 됨 |

### 3-1. 카테고리별 근본 원인

#### A. `aria-expanded` / `aria-pressed` / `aria-checked` 토글 미동작 (7건)
- **Disclosure**: Enter/Space 키로 토글되지 않음 — `useFocusExpansion` 훅이 키보드 이벤트(Enter/Space)를 처리하지 않거나, `aria-expanded` 속성 반영이 누락.
- **Toolbar**: `aria-pressed`가 click/Enter에 반응하지 않음 — `FocusItem`이 toggle 상태를 `aria-pressed`에 반영하지 않고 `aria-current`/`data-selected`만 사용.
- **Menu**: `aria-checked`가 Space에 반응하지 않음 — checkbox 역할의 menuitem에 checked 토글 로직 미구현.
- **Tree**: click으로 `aria-expanded` 토글 안 됨 — click 이벤트가 expansion 토글을 트리거하지 않음.

#### B. Dialog/AlertDialog focus restore 실패 (2건)
- Escape/Cancel 후 trigger 버튼으로 포커스 복구가 안 됨. `handleClose` 내 동기 focus restore 로직이 실제 DOM 상태와 타이밍 불일치.

#### C. Disabled 요소 click timeout (2건)
- `aria-disabled="true"` 요소에 대해 Playwright의 `click()`은 enabled 상태를 기다림 → 30s timeout.
- 테스트 수정 필요: `{ force: true }` 사용 또는 `click()` 대신 `focus()` + assertion.

## 4. 제안 (Proposal)

### 우선순위 높음
1. **FocusItem/FocusGroup**: Enter/Space/Click → `aria-expanded`, `aria-pressed`, `aria-checked` 토글 로직 통합
2. **Dialog/AlertDialog**: close 시 focus restore 타이밍 수정

### 우선순위 보통
3. **Grid**: Home/End 키 네비게이션 구현
4. **E2E 테스트**: disabled 요소 click 시 `{ force: true }` 옵션 사용으로 테스트 수정

### 재발 방지
- E2E URL 상수 추출 (`e2e/constants.ts`)
- 라우트 변경 시 E2E URL 동기화 체크리스트
