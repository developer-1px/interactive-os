# Discussion: Undo Toast → App Module System

> 2026-02-25 00:08 | Builder 삭제 시 Undo 토스트 → OS App Module System 도입

## Journey

**🧑 사용자**: 빌더에서 삭제 시 cmd+z를 모를 수도 있는 사람들을 위해 undo 토스트를 띄워주고 싶어.

**🤖 AI**: 인프라가 100% 존재 (OS Toast + Builder Undo + Todo 선례). 앱 레벨 인라인(3줄) vs OS 레벨 두 방향 제시. Rule of Three 미달로 인라인 추천.

---

**🧑 사용자**: 앱 레벨인데 모듈화를 시킬까?

**🤖 AI**: 3줄 인라인의 엔트로피 < 새 모듈의 엔트로피. 현재 2번째 앱이라 시기상조.

---

**🧑 사용자**: **우리 목표는 OS를 만드는 거지 빌더를 만드는 게 아냐.** ← Inflection Point

**🤖 AI**: (방향 교정 수용) 앱 개발자 관점이 아니라 OS 설계자 관점으로 전환. "파괴적 액션 후 Undo 토스트"는 앱의 요구가 아니라 OS의 행동 표준.

---

**🧑 사용자**: OS에 설치하는 게 아냐, App에 설치하는 거지. 물론 OS에 설치하는 형태도 있어.

**🤖 AI**: 2-tier 모델 정리. npm의 project-level vs global-level. Todo(confirmDialog)와 Builder(deleteToast)가 같은 "삭제"에 다른 행동 = 앱별 선택 필수.

---

**🧑 사용자**: 다른 레퍼런스를 보여줘봐, 어떻게 feature flag를 달성할 수 있나?

**🤖 AI**: Vite Plugin(배열), Zustand Middleware(감싸기), Unity ECS(부착), ESLint Plugin(2단계) 비교. Vite 모델이 TypeScript빌드타임 + Hook기반 + 파라미터화에서 최적합.

---

**🧑 사용자**: 그러면 결합 방식은 미들웨어를 통해서 커널 파이프라인에 접근?

**🤖 AI**: 코드베이스 조사 결과 `os.use(middleware)` + `Middleware { before, after }` 인프라가 이미 존재. historyMiddleware, persistenceMiddleware가 이미 정확히 같은 패턴으로 동작 중.

---

**🧑 사용자**: **history도 config가 아니라 모듈로 만들어야 함. ESLint가 그랬듯이.** ← Convergence Point

**🤖 AI**: `defineApp({ modules: [history(), persistence(), deleteToast()] })` 통일 모델. `AppModule { id, install }` 인터페이스. appSlice 코어는 `modules.forEach` 한 줄로 단순화. 코어가 모듈 수에 무관하게 일정 = O(1) 코어 복잡도.

---

**🧑 사용자**: 3개 모두 한 번에 (B).

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | `defineApp({ modules: [history(), persistence(), deleteToast()] })` — AppModule 인터페이스를 도입하고, 기존 history/persistence를 모듈로 리팩토링하며, deleteToast를 세 번째 모듈로 추가한다. |
| **📊 Data** | 1. OS에 `os.use(middleware)` + `Middleware { id, scope, before, after }` 인프라 이미 존재. 2. `historyMiddleware`, `persistenceMiddleware`가 동일 패턴으로 동작 중. 3. Todo 앱에서 `OS_TOAST_SHOW` + `actionCommand: undoCommand()` 검증됨. |
| **🔗 Warrant** | 1. Rule #7 "앱은 선언, OS가 보장" — `modules: [history()]`가 선언. 2. Rule #9 "플랫폼을 만든다" — 빌더의 요구를 OS 기능으로 풀어야. 3. ESLint plugin 모델 — boolean config 대신 모듈 배열이 확장 가능. 4. Vite plugin 모델 — 배열 존재 = ON, 부재 = OFF, 주석 = feature flag. |
| **📚 Backing** | Vite Plugin, ESLint Flat Config, Zustand Middleware, Unity ECS — 산업 표준 plugin/module 아키텍처. |
| **⚖️ Qualifier** | **Complicated** — 리팩토링 범위 넓지만(history, persistence, defineApp config), 각 단계는 Clear |
| **⚡ Rebuttal** | 1. 리팩토링 범위: defineApp, appSlice, 모든 앱의 config 변경 필요. 2. history/persistence 미들웨어의 현재 if문 분기가 module.install()로 이동할 뿐실 로직 변경 없음 → 리스크 낮음. 3. 커맨드 타입 패턴 매칭(`:remove`)에 의존 → 네이밍 컨벤션 법 준수 필수. |
| **❓ Open Gap** | 1. 모듈 간 의존 (deleteToast가 history의 undoCommand 참조) 해결 방법. 2. OS-level 모듈 (`os.use()` 전역)과 App-level 모듈의 정확한 인터페이스 분리. 3. 테스트 인프라(`defineApp.testInstance.ts`)의 모듈 지원. |
