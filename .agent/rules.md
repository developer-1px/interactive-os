# 프로젝트 규칙

## 네이밍 컨벤션

- **파일명 = Export명**: 파일명은 메인 export와 일치. 컴포넌트는 PascalCase, hooks/함수는 camelCase.
- **접두어 그룹핑**: 관련 파일은 공통 개념을 접두어로 묶어 알파벳 정렬 시 그룹화. (`commandsClipboard.ts`, `commandsNavigation.ts`)
- **콜백/프로세서 타입 = `*Handler`**: 콜백이나 내부 처리 함수 타입은 `*Fn`이 아니라 `*Handler`로 통일. (`CommandHandler`, `EffectHandler`, `ContextProvider`)
- **인터페이스/타입 약어 금지**: 인터페이스와 타입 이름에 약어를 쓰지 않는다. `MiddlewareContext` (O), `MiddlewareCtx` (X).
- **변수명 약어 허용 범위**: `ctx`, `cmd`, `id`, `ref`, `props`, `e`만 허용. 그 외 약어 금지. 풀네임 사용.
- **이벤트 기반 커맨드명**: OS 커맨드는 행동이 아닌 이벤트로 명명. `OS_ESCAPE` (O), `OS_DISMISS` (X).
- **하나의 개념 = 하나의 이름**: 같은 개념에 다른 이름을 만들지 않는다. 파일명, 폴더명, 타입, 변수 모두 동일. `UserProfile`, `UserProfileData`, `UserProfileInfo` 중 하나만 쓴다.

## 대원칙

### 1. OS-First
> **"컴포넌트에서 해결하지 말고, OS 레벨 프리미티브로 설계하라"**

요구사항을 받으면 해당 컴포넌트에서 ad-hoc으로 구현하지 않는다. Focus, Selection, Navigation 등은 모두 OS 레벨 커맨드로 설계하여 시스템 전체에서 일관되게 동작하게 한다.

### 2. Listener = 번역기
> **"무슨 일이 일어났는지만 전달하고, 어떻게 처리할지는 관여하지 않는다"**

- Listener는 DOM 이벤트를 Kernel Command로 번역만 한다.
- 키보드 이벤트 → `Keybindings.resolve()` → `kernel.dispatch(command)`.
- Listener는 상태를 갖지 않으며, 판단·분기·부수효과를 수행하지 않는다.

### 3. Kernel 파이프라인
> **"모든 상태 변경은 Kernel의 단일 파이프라인을 통과한다"**

```
DOM Event → Listener → Keybindings → kernel.dispatch(Command)
→ Command Handler (순수함수) → State Mutation + EffectMap
→ defineEffect (부수효과 실행) → Transaction 기록
```

- Command Handler: `(ctx) => (payload) => EffectMap | void` — 순수하게 상태를 변경하고 필요한 Effect를 선언한다.
- Side-effect는 `defineEffect`로 등록된 핸들러에서 실행한다.
- 모든 dispatch는 Transaction으로 기록되어 Inspector에서 추적 가능하다.

### 4. 설정 주도 (Config-Driven)
> **"동일한 커맨드가 Zone의 config에 따라 다르게 동작한다"**

| 커맨드 | Config | 동작 |
|--------|--------|------|
| NAVIGATE | `navigate.orientation` | vertical / horizontal / grid |
| TAB | `tab.trap` | trap / escape |
| ACTIVATE | `activate.mode` | automatic / manual |
| ESCAPE | `dismiss.escape` | deselect / close / none |

하드코딩된 `if/else` 대신, Zone별 선언적 config로 행동을 결정한다.

### 5. 코드 최소주의
> **"모든 코드는 부채다. 기능에 기여하지 않으면 삭제한다"**

- YAGNI: 미래를 위한 추측성 코드 금지.
- Ad-hoc 금지: `if (id === 'DRAFT')` 같은 특수 케이스를 범용 코드에 넣지 않는다.
- 200줄 초과 시 분리 검토.

### 6. 정답 먼저
> **"FE 생태계에 검증된 해법이 있으면 그걸 먼저 제안한다"**

React Aria, W3C ARIA Practices, 브라우저 API 등 검증된 해법을 커스텀 구현보다 먼저 제시한다.

### 7. AI 친화적 설계
> **"AI가 실수해도 구조가 잡아주고, 깨져도 빠르게 복구할 수 있는 시스템"**

- **관찰 가능**: 모든 파이프라인 단계가 Transaction으로 기록 → Inspector에서 실시간 추적.
- **검증 가능**: 순수 함수 → 입출력만 테스트.
- **재현 가능**: 불변 상태 + Transaction 로그 → 동일 상태 재현.
- **복구 가능**: 스냅샷 기반 → 이전 상태 롤백.

### 8. W3C 표준 절대 준수
> **"W3C WAI-ARIA가 정의한 것은 우리의 원칙이다. 예외 없음."**

- Roles, States, Properties, 키보드 인터랙션 패턴, 포커스 관리 — 모두 [W3C WAI-ARIA](https://www.w3.org/TR/wai-aria-1.2/) 및 [APG](https://www.w3.org/WAI/ARIA/apg/)가 공식 정의한 표준을 따른다.
- 구현 판단 기준은 "다른 앱은 어떻게 하지?"가 아니라 **"W3C 스펙에 뭐라고 되어 있지?"**이다.
- `roleRegistry.ts`의 preset, TestBot 테스트 케이스 모두 W3C 스펙에서 직접 도출한다.

### 9. React와 외부 스토어의 경계를 의식하라
> **"외부 상태를 React에 연결할 때, React의 비교 방식을 항상 먼저 생각하라"**

- `useSyncExternalStore`의 `getSnapshot`은 **참조 안정성(referential stability)**을 보장해야 한다. 매 호출마다 새 객체/배열을 반환하면 무한 루프.
- zustand `persist` 미들웨어 사용 시, `partialize`로 함수는 제외하고 값만 저장한다.
- 외부 스토어(Map, Set, Registry 등)를 React에 연결할 때는 반드시 **캐시된 스냅샷 패턴**을 사용한다.

## 에이전트 규칙

- **불확실하면 묻는다**: 요구사항이나 구현 방법이 불확실하면 구현하지 말고 먼저 질문한다.
- **직접 경로 import**: 기본은 직접 경로 import. Feature의 public API entry point만 `index.ts` 허용.
- **레이어 의존성**: `src/os/` (OS) → `src/apps/` (앱) → `src/pages/` (페이지). `src/inspector/`는 OS에 의존하되 OS와 강결합하지 않는 플러그인. 하위 레이어는 상위를 import하지 않는다.
- **커밋 자주하기**: 하나의 논리적 단계가 완료될 때마다 커밋한다. 여러 작업을 하나의 거대한 커밋에 담지 않는다. (예: 파일 복원 → 커밋, import 리매핑 → 커밋, 스토어 수정 → 커밋). `--no-verify` 사용 시에도 단계별 커밋 원칙을 지킨다.
- **빌드 통과 ≠ 안전**: `tsc` + `npm run build` 통과 후에도 반드시 `npx playwright test e2e/smoke.spec.ts`로 런타임을 검증한다. 특히 alias 변경, 파일 이동 후에는 Vite 캐시(`node_modules/.vite`) 삭제 + dev server 재시작까지 수행.

### 파일 이동/삭제 시 필수 체크리스트

> **파일을 이동하거나 삭제할 때 아래를 반드시 수행한다. 하나라도 빠뜨리면 런타임 크래시가 발생한다.**

1. **참조 검색**: 이동/삭제 대상 파일명과 경로를 `grep -rn` 으로 프로젝트 전체에서 검색. 검색 범위에 반드시 포함할 것:
   - `src/` (소스 코드)
   - `e2e/` (테스트)
   - `vite-plugins/` (Vite 플러그인 — 경로 하드코딩 주의)
   - `vite.config.ts`, `tsconfig.*.json`, `playwright.config.ts` (인프라 설정)

2. **동반 자산 확인**: `.tsx`/`.ts` 파일을 이동할 때, 같은 디렉토리의 동반 파일도 함께 이동:
   - `.css`, `.module.css` (스타일)
   - `.json`, `.svg`, `.png` (정적 자산)
   - 상대경로 `import "./Something.css"` 가 깨지지 않는지 확인

3. **import 경로 변경은 파일 이동과 동시에**: 경로만 바꾸고 파일 안 옮기거나, 파일만 옮기고 참조 안 고치면 안 된다. 반드시 atomic하게.

4. **스모크 테스트**: 파일 이동/삭제 작업 후에는 `tsc` 만으로 끝내지 않는다. **`npx playwright test e2e/smoke.spec.ts` 까지 실행**하여 런타임 정상 확인.

## TestBot 사용법

> **테스트 실행/수집은 항상 `window.__TESTBOT__` 글로벌 API를 사용한다.**

브라우저에서 TestBot 테스트를 실행할 때, UI 버튼을 수동으로 클릭하지 않는다. 대신 브라우저 JavaScript 실행을 통해 글로벌 API를 호출한다.

```js
// 전체 테스트 실행
window.__TESTBOT__.runAll()

// 실행 완료 대기 (polling)
window.__TESTBOT__.isRunning()  // false가 될 때까지 대기

// 구조화된 결과 수집 (JSON)
JSON.stringify(window.__TESTBOT__.getResults(), null, 2)

// 실패만 조회 (이름 + 실패 단계 + 에러 메시지)
window.__TESTBOT__.getFailures()

// 한줄 요약: "PASS: 8 / FAIL: 4 / TOTAL: 12"
window.__TESTBOT__.summary()

// 실패한 스위트만 재실행
window.__TESTBOT__.rerunFailed()

// 개별 스위트 실행
window.__TESTBOT__.runSuite(0)          // 인덱스로
window.__TESTBOT__.runByName("테스트명")  // 이름으로

// 등록된 스위트 목록
window.__TESTBOT__.listSuites()
```

- `runAll()`은 async — 호출 후 `isRunning()`으로 완료를 확인한다.
- `getResults()`는 `{ summary, suites[] }` 구조의 전체 JSON을 반환한다.
- **`getFailures()`는 실패한 스위트만 `{ name, failedStep }` 형태로 반환한다.**
- **`summary()`는 한줄 문자열로 pass/fail/total 수를 반환한다.**
- **`rerunFailed()`는 직전에 실패한 스위트만 순차적으로 재실행한다.**
