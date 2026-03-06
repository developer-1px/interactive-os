# os-restructure — Phase 2: tsx 로직 추출

## Context

tsx를 최대한 얇은 bypass 통로로 만든다. Zone.tsx/Item.tsx가 모범 사례.
규모: **Meta** (파일 이동 + 함수 추출, 새 기능 없음)

## Now
- [ ] #6-8: Field/QuickPick 유틸 함수 분리

## Done
- [x] #1: 5-effect → os-core 이동 ✅ (`packages/os-core/src/5-effect/` — index.ts 존재)
- [x] #2: 1-listen/*.ts 순수 파일 → os-core 이동 ✅ (`os-core/1-listen/` 하위: keyboard/, mouse/, pointer/, clipboard/)
- [x] #3: senseKeyboard() 추출 ✅ (`os-core/1-listen/keyboard/senseKeyboard.ts`)
- [x] #4: PointerListener 핸들러 로직 추출 ✅ (`os-core/1-listen/mouse/resolveClick.ts`, `resolveMouse.ts`)
- [x] #5: ClipboardListener sense 로직 추출 ✅ (`os-core/1-listen/clipboard/resolveClipboard.ts`)
- (Phase 1 완료: T1~T8, 패키지 물리 분리)

## os-restructure — Phase 3: createKernel 분리

커널 책임을 분리하여 응집도 향상, React 바인딩 분리.

## Now (Phase 3)
- [x] #9: createKernel에서 React Hooks (useComputed, useQuery) 외부 팩토리(`createReactBindings.ts`)로 분리. Kernel에서 `react` 의존성 제거. — 리팩토링 완료, 의존성 삭제 및 os 인스턴스에 병합 ✅

## os-restructure — Phase 4: os-react widgets 정화

os-react에는 OS 프리미티브만 허용. 개밥먹기 위젯은 소비자(src/) 옆에 배치.

## Done (Phase 4)
- [x] #10: os-react/widgets 정화 — tsc 0 | 6 tests PASS ✅
  - Modal.tsx 삭제 (dead code, 0 사용처)
  - Kbd.tsx 삭제 (inspector版 중복)
  - QuickPick.tsx → `src/command-palette/` 이동
  - ToastContainer.tsx → `src/widgets/` 이동
  - Dialog.tsx만 유지 (SDK 인프라 의존)

## os-restructure — Phase 5: zoneRegistry Muda 제거

> [blueprint](blueprint-zoneregistry-muda.md) | [plan](notes/2026-0305-1104-plan-zoneregistry-muda.md)
> /why: LLM path-of-least-resistance 관성으로 6개 관심사가 단일 파일에 누적

## Now (Phase 5)
(모든 태스크 완료)

## Done (Phase 5)
- [x] #11: triggerOverlays → triggerRegistry 이동 — tsc pre-existing only | 142 test files PASS (36 pre-existing fail) | zoneRegistry 399→340줄 ✅
- [x] #12: getZoneItems → resolveItems SPoT 통합 — itemQueries.ts 단순화 (18줄→5줄) ✅
- [x] #13: resolveItems/Labels dead fallback 제거 — DOM scan 38줄 삭제 ✅

## os-restructure — Phase 6: roleRegistry dead util 제거

> /discussion: v10.0 config-driven projection이 isCheckedRole/isExpandableRole을 obsolete로 만듦

## Now (Phase 6)
(모든 태스크 완료)

## Done (Phase 6)
- [x] #14: isCheckedRole + CHECKED_ROLES + isExpandableRole + EXPANDABLE_ROLES 제거 — dead code 30줄 삭제 ✅
- [x] #15: roleHelpers.test.ts dead 테스트 제거 — 80줄→38줄 (13 dead tests 삭제) ✅
- [x] #16: DeepPartial 중복 제거 — schema/types/utils.ts SPoT 생성, 2파일에서 import ✅

## Phase 7: page.ts 분리 (God Object 해소)

> /why: 1b8175b6에서 별도 파일이던 createOsPage.ts를 page.ts에 합침 (God Object 관성)
> types.ts에서 page.ts 의존성 제거 완료 (사용자 수동 편집)

## Now (Phase 7)
- [x] #17: formatDiagnostics → diagnostics.ts 분리 — 94줄 추출, 8 tests PASS, re-export 유지 ✅
- [x] #18: createOsPage → createOsPage.ts 분리 — 485줄 추출, 0 regression ✅
- [x] #19: page.ts에 createAppPage + createPage만 남기기 — page.ts 978→398줄 (59% 감소) ✅
