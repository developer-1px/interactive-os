# lazy-resolution — BOARD

> Focus/Selection 복구를 Write-time → Read-time Lazy Resolution으로 전환

## Now

- [x] **T1** `resolveItemId` + `resolveSelection` 순수함수 구현 + 단위 테스트
  - [x] Step 8: /tdd — 18 tests (happy, stale, edge, undo scenario)
  - [x] Step 9: /solve — `src/os/state/resolve.ts`
- [x] **T2** `useFocusedItem` / `getFocusedItem` 반환 경로에 resolve 삽입
  - [x] Step 9: /solve — `getZoneItems` 유틸 + `useFocusedItem` lazy resolution 통합
  - 앱은 해석된 값만 받는다 (투명 프록시) ✅
- [x] **T3** Selection lazy filter
  - [x] Step 9: /solve — `useSelection` + `resolveSelection` 통합
- [x] **T4** 제거: `recoveryTargetId`, `OS_RECOVER`
  - [x] Step 9: /solve — `OSState.recoveryTargetId` 필드 제거
  - [x] `recover.ts` + `recover.test.ts` 파일 삭제
  - [x] `focus.ts`, `navigate/index.ts` — recoveryTargetId 계산 로직 제거
  - [x] `OSCommands.ts`, `OSCommandPayload.ts` — OS_RECOVER 스키마 제거
  - [x] `FocusListener.tsx` — MutationObserver + OS_RECOVER dispatch 제거
  - [x] `historyKernelMiddleware.ts` — passthrough 목록에서 제거
  - [x] `os-guarantee.test.ts` — Lazy Resolution 패턴으로 재작성
  - [x] `navigate.test.ts` — recoveryTargetId describe 제거
  - [x] `virtualFocus.test.ts`, `createTestOsKernel.ts` — 정리

## Done

- [x] T1~T4: OS 커널에서 Lazy Resolution 기반 완전 전환 (835 tests pass)

## Ideas

- [ ] **T5** Collection의 `remove`/`cut` 에서 `OS_FOCUS` recovery dispatch 제거 → lazy로 전환
  - 주의: undo 동작 변화 검증 필요
- `lastKnownIndex` 저장 — 삭제 전 인덱스 기억으로 정확한 next > prev 계산
