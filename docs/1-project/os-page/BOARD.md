# OS Page — BOARD

## 🔴 Now

- [ ] **T3: APG 테스트를 createOsPage로 마이그레이션** [Medium /refactor]
  - [ ] Step 9: /solve ← 시작
- [ ] **T4: Todo unit test를 createPage 기반으로 전환** [Medium /refactor]
  - [ ] Step 9: /solve

## ✅ Done

- [x] **T2: createOsPage — OS-only TestPage factory** ✅
  - `createOsPage()` — 격리 커널 + TestPage 인터페이스 + OS helpers
  - `goto()` = setItems + setRole + setActiveZone 통합
  - headless.ts 공용 함수 활용 (코드 중복 0)
  - 7/7 Listbox PoC 테스트 GREEN, 865/865 전체 통과
- [x] **T1: OS Page 인터페이스 설계 + 최소 구현** ✅
  - `defineApp.createPage()` → production kernel + preview sandbox
  - `headless.ts`: 공용 함수 추출 (simulateKeyPress/simulateClick/computeAttrs)
  - Kernel 버그 수정: `processCommand`에서 bare `state` → `getState()` (preview 투명성)
  - 9/9 테스트 GREEN, 858/858 기존 테스트 통과

## 💡 Ideas

- T3: 기존 APG 테스트를 createOsPage API로 마이그레이션 (contracts.ts 타입 변경)
- T4: Todo unit test를 pressKey 기반 integration test로 전환 (일부)
- T5: TestBot v2가 OS Page를 visual runtime으로 사용
- `createPage` 네이밍 재검토 — preview 기반이라 실체와 다름
- Playwright `expect(locator).toBeFocused()` 동형 assertions

## 📎 References

- Discussion: `discussions/2026-0221-1635-os-page-vision.md`
- 기존 격리 커널: `src/os/defineApp.testInstance.ts`
- 기존 pressKey 구현: `src/os/3-commands/tests/integration/helpers/createTestOsKernel.ts`
- TestBot v2 BOARD: `docs/1-project/testbot-v2/BOARD.md`
