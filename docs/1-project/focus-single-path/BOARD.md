# BOARD — focus-single-path

## 🔴 Now
(✅ /verify 통과 — tsc clean, 797 tests. 프로젝트 완료 대기)

## ⏳ Done
- [x] C1: DocsPage.tsx — `document.querySelector` → `useRef` (02-21)
- [x] K1: Field.tsx — `useComputed` 내 `document.getElementById` → pure computed + `useLayoutEffect` 분리 (02-21)
- [x] T2: 커맨드에서 `focus:` effect 제거 (02-21)
  - OS_FOCUS, OS_NAVIGATE, OS_TAB, OS_FIELD_COMMIT, OS_FIELD_CANCEL, OS_STACK_POP, OS_RECOVER(2nd path) — 7개 커맨드에서 focus effect 제거
  - 4-effects/focus — recovery 전용으로 역할 좁힘 (OS_RECOVER 1st path만 사용)
  - virtualFocus.test.ts — 새 아키텍처에 맞게 업데이트
  - 797 tests all pass

## 🟢 판정 완료 (수정 불필요)
- T3: useFieldHooks — 커서 복원 로직은 useLayoutEffect에서 유지 (현 상태가 정답)
- T4: QuickPick — virtual focus input.focus()는 Component 책임으로 문서화
- T5: DOM_ZONE_ORDER — ❌ 폐기 (DOM 순서는 Registry로 추적 불가)
- T6: BuilderCursor — 시각 오버레이 전용 DOM 접근은 예외 허용

## 💡 Ideas / Future
- T7: ESLint `no-dom-in-apps` 규칙 — 앱 코드에서 `document.*` 자동 차단
