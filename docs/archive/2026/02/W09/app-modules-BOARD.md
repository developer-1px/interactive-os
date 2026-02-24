# app-modules

## Context

Claim: `defineApp({ modules: [history(), persistence(), deleteToast()] })` —
AppModule 인터페이스(`{ id, install }`)를 도입하고, 기존 history/persistence를 모듈로 리팩토링하며,
deleteToast를 세 번째 모듈로 추가한다. appSlice 코어는 `modules.forEach(m => os.use(m.install()))` 한 줄로 단순화.

Before → After:
- Before: `defineApp("builder", state, { history: true, persistence: { key } })` — boolean/object config, 모듈이 늘면 appSlice에 if문 추가
- After: `defineApp("builder", state, { modules: [history(), persistence({ key }), deleteToast()] })` — 배열 기반, 코어 변경 0

Risks:
- 리팩토링 범위: defineApp, appSlice, defineApp.testInstance, Builder app, Todo app
- 모듈 간 의존 (deleteToast ↔ history) 해결 필요
- 커맨드 타입 패턴 매칭 (`:remove`)에 의존 → 네이밍 컨벤션 법 준수 필수

## Now
(All tasks complete — ready for retrospect + archive)

## Done
- [x] T7: 소비자 마이그레이션 — Builder + Todo `{ history: true }` → `{ modules: [history()] }` — tsc 0 | regression 0 | build OK ✅
- [x] T1: `AppModule` 인터페이스 정의 — `os/modules/types.ts` — tsc 0 | +4 tests | vitest 🟢
- [x] T2: `history()` 모듈 — `os/modules/history.ts` — tsc 0 | +2 tests | vitest 🟢
- [x] T3: `persistence()` 모듈 — `os/modules/persistence.ts` — tsc 0 | +1 test | vitest 🟢
- [x] T4: `deleteToast()` 모듈 — `os/modules/deleteToast.ts` — tsc 0 | +3 tests | vitest 🟢
- [x] T5: `appSlice.ts` 리팩토링 — `modules` 배열 수용 + 설치 루프 추가 — backward compat 유지
- [x] T6: `defineApp` config 타입 변경 — `modules?: AppModule[]` 추가 — backward compat 유지
- [x] T8: 테스트 인프라 — `defineApp.testInstance.ts` 모듈 지원 + OS_TOAST_SHOW 핸들러 등록 — 13 tests 🟢 | regression 0

## Unresolved
- 모듈 간 의존 해결 방법: deleteToast가 history의 undoCommand를 참조해야 함
- OS-level 모듈 (`os.use()` 전역)과 App-level 모듈의 인터페이스 분리
- 모듈 실행 순서 보장 (배열 순서 = 실행 순서?)

## Ideas
- preset 번들: `modules: [saasPreset()]` → history + persistence + deleteToast 한 번에
- 모듈이 제공하는 condition/selector를 앱이 접근하는 API
- OS-level 모듈: `os.use(accessibilityModule)` — 모든 앱에 적용
