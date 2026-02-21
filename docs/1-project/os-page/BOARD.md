# OS Page — BOARD

## 🔴 Now

- [ ] **T1: OS Page 인터페이스 설계 + 최소 구현** [WIP]
  - `defineApp.createPage()` → production kernel + preview sandbox
  - `headless.ts`: 공용 함수 추출 (simulateKeyPress/simulateClick/computeAttrs)
  - DOM contexts headless override (dom-items, zone-config, dom-rects, etc.)
  - `zone.bind()`의 onAction/onDelete/onCheck를 ZoneRegistry에서 headless 재활용
  - Kernel 버그 수정: `processCommand`에서 bare `state` → `getState()` (preview 투명성)
  - PoC: Todo 앱 9개 테스트 GREEN (Factory, Navigation, Click, Full Stack Integration)
  - [x] Step 7: /naming — TestPage, createPage, goto, keyboard.press, attrs
  - [x] Step 8: /tdd — 9개 RED 테스트 작성
  - [x] Step 9: /solve — preview 기반 구현, headless 공용 함수 추출, 커널 버그 수정
  - [ ] Step 10: /refactor ← 다음

## ✅ Done

(없음)

## 💡 Ideas

- T2: 기존 `createTestOsKernel`을 OS Page 위에서 재구현 (앱 없는 Page = OS-only Page)
- T3: 기존 APG 테스트를 OS Page API로 마이그레이션
- T4: Todo unit test를 pressKey 기반 integration test로 전환 (일부)
- T5: TestBot v2가 OS Page를 visual runtime으로 사용
- `createPage` 네이밍 재검토 — "create"가 격리 인스턴스를 연상시킴. preview 기반이라 실체와 다름. `Page`도 어색. `enterTestMode()`, `sandbox()` 등 후보 검토
- `page.goto(zoneName)` — zone 자동 activate + items 설정
- Playwright `expect(locator).toBeFocused()` 동형 assertions

## 📎 References

- Discussion: `discussions/2026-0221-1635-os-page-vision.md`
- 기존 격리 커널: `src/os/defineApp.testInstance.ts`
- 기존 pressKey 구현: `src/os/3-commands/tests/integration/helpers/createTestOsKernel.ts`
- TestBot v2 BOARD: `docs/1-project/testbot-v2/BOARD.md`
