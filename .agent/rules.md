# 프로젝트 규칙

## 네이밍 컨벤션

- **파일명 = Export명**: 파일명은 메인 export와 일치. 컴포넌트는 PascalCase, hooks/함수는 camelCase.
- **접두어 그룹핑**: 관련 파일은 공통 개념을 접두어로 묶어 알파벳 정렬 시 그룹화. (`commandsClipboard.ts`, `commandsNavigation.ts`)
- **약어 금지**: `ctx`, `cmd`, `id`, `ref`, `props`, `e` 외에는 약어 금지. 풀네임 사용.
- **이벤트 기반 커맨드명**: OS 커맨드는 행동이 아닌 이벤트로 명명. `OS_ESCAPE` (O), `OS_DISMISS` (X).
- **하나의 개념 = 하나의 이름**: 같은 개념에 다른 이름을 만들지 않는다. 파일명, 폴더명, 타입, 변수 모두 동일. `UserProfile`, `UserProfileData`, `UserProfileInfo` 중 하나만 쓴다.

## 대원칙

### 1. OS-First
> **"컴포넌트에서 해결하지 말고, OS 레벨 프리미티브로 설계하라"**

요구사항을 받으면 해당 컴포넌트에서 ad-hoc으로 구현하지 않는다. Focus, Selection, Navigation 등은 모두 OS 레벨 커맨드로 설계하여 시스템 전체에서 일관되게 동작하게 한다.

### 2. Sensor = 번역기
> **"무슨 일이 일어났는지만 전달하고, 어떻게 처리할지는 관여하지 않는다"**

- Sensor는 DOM 이벤트를 OS Command로 번역만 한다.
- 상황별 분기는 커맨드 핸들러가 config를 보고 결정한다 — 정보가 있는 곳에서 판단한다.

### 3. 순수 함수 파이프라인
> **"모든 상태 변경은 단일 파이프라인을 통과한다"**

```
DOM Event → Sensor → OS Command → Intent → runOS(순수함수) → State + DOM Effects
```

- 커맨드는 순수 함수: `(ctx, payload) → OSResult | null`
- Store 직접 조작 금지, `el.focus()` 직접 호출 금지.
- DOM Effect는 OSResult의 `domEffects` 배열로만 선언한다.

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

- **관찰 가능**: 모든 파이프라인 단계가 명시적 → 로그/트레이싱 용이.
- **검증 가능**: 순수 함수 → 입출력만 테스트.
- **재현 가능**: 불변 상태 + 액션 로그 → 동일 상태 재현.
- **복구 가능**: 스냅샷 기반 → 이전 상태 롤백.

## 에이전트 규칙

- **불확실하면 묻는다**: 요구사항이나 구현 방법이 불확실하면 구현하지 말고 먼저 질문한다.
- **직접 경로 import**: 기본은 직접 경로 import. Feature의 public API entry point만 `index.ts` 허용.
- **레이어 의존성**: `src/os/features/` (OS) → `src/apps/` (앱) → `src/pages/` (페이지). 하위 레이어는 상위를 import하지 않는다.

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
