# Onboarding: 매 대화에서 꼭 알아야 할 핵심 지식

| 항목 | 내용 |
|------|------|
| 원문 | 매번 대화를 할때마다 다들 이해하거나 뭘 해야할지 다르더라도 그래서 꼭 알아야 할 핵심은 미리 알려주려고. 반복되는 패턴이나 지식 뒤져서 제시해봐 |
| 내(AI)가 추정한 의도 | 대화마다 반복되는 삽질을 없애기 위해, 프로젝트의 핵심 규칙·함정·워크플로를 하나로 모은 onboarding 시스템 프롬프트를 만들고 싶다. |

---

## 1. 개요

20개+ 대화와 `rules.md`, `CLAUDE.md`, 문서 전체, 워크플로를 분석하여 **반복적으로 등장하거나 위반 시 삽질하게 되는 핵심 지식**을 추출했다. 이 문서는 향후 `/onboarding` 워크플로의 콘텐츠 소스가 된다.

---

## 2. 분석: 반복되는 7가지 핵심 지식

### 🔴 1. 디버깅은 브라우저 수동 조작이 아니라 TestBot / Playwright

| DO | DON'T |
|----|-------|
| `window.__TESTBOT__.runAll()` → `getFailures()` | Inspector DOM 수동으로 뒤지기 |
| `npx playwright test e2e/smoke.spec.ts` | 브라우저에서 눈으로 확인하고 "통과" 판단 |

**근거**: 대화 `1d716e59`, `6f1c5ebc`, `fca0500f` 등에서 TestBot shim 관련 반복 이슈. DOM 수동 파싱은 스타일 변경에 깨짐 (docs/2-area/06-testing/standards/00-llm-friendly-spec.md).

**API 요약**:
```js
window.__TESTBOT__.runAll()        // 전체 실행 (async)
window.__TESTBOT__.summary()       // "PASS: 8 / FAIL: 4 / TOTAL: 12"
window.__TESTBOT__.getFailures()   // 실패만 조회
window.__TESTBOT__.rerunFailed()   // 실패만 재실행
```

---

### 🔴 2. 아키텍처 파이프라인은 무조건 한 방향

```
DOM Event → Listener → Keybindings → kernel.dispatch(Command)
→ Command Handler (순수함수) → State + EffectMap
→ defineEffect (부수효과) → Transaction 기록
```

- **Listener = 번역기**. 상태도 판단도 분기도 하지 않는다.
- **Command Handler = 순수함수**. `(ctx) => (payload) => EffectMap | void`.
- **Side-effect는 defineEffect에서만**.
- **모든 dispatch는 Transaction 기록** → Inspector에서 추적 가능.

**위반하면**: 커맨드에 if/else 분기 넣기, Listener에서 직접 상태 변경, 컴포넌트에 로직 삽입 → 전부 나중에 리팩토링 대상.

---

### 🔴 3. 레이어 의존성은 단방향

```
packages/kernel/ → src/os-new/ → src/os/ → src/apps/ → src/pages/
```

- 하위 → 상위 import **절대 금지**
- `OS` facade(`AntigravityOS.tsx`)를 통해서만 접근: `OS.Zone`, `OS.Item`, `OS.Trigger`
- 직접 import 위반 → 대화 `198ca7da`에서 집중 수정함

---

### 🟡 4. 파일 이동/삭제 시 반드시 지켜야 할 체크리스트

1. **참조 검색**: `grep -rn` 으로 `src/`, `e2e/`, `vite-plugins/`, 설정 파일 전체 검색
2. **동반 자산**: `.css`, `.json`, `.svg` 등 함께 이동
3. **Atomic 변경**: 경로 변경 + 파일 이동 동시에
4. **스모크 테스트**: `tsc` 만으로 끝내지 말고 `npx playwright test e2e/smoke.spec.ts`까지 실행

**근거**: `rules.md` #94~111에 명시. 실제로 alias 변경 후 Vite 캐시 문제로 런타임 크래시 반복 경험.

---

### 🟡 5. 커맨드는 Config-Driven, 하드코딩 금지

같은 OS 커맨드가 Zone의 config에 따라 다르게 동작:

| 커맨드 | Config | 동작 |
|--------|--------|------|
| NAVIGATE | `navigate.orientation` | vertical / horizontal / grid |
| TAB | `tab.trap` | trap / escape |
| ACTIVATE | `activate.mode` | automatic / manual |
| ESCAPE | `dismiss.escape` | deselect / close / none |

Zone별 선언적 config로 행동 결정. 컴포넌트에 ad-hoc `if/else` 넣지 않는다.

---

### 🟡 6. 네이밍 = 법칙, 예외 없음

| 규칙 | 예시 |
|------|------|
| 파일명 = Export명 | `CommandPalette.tsx` → `export const CommandPalette` |
| 콜백 타입 = `*Handler` | `CommandHandler` (O), `CommandFn` (X) |
| 약어 금지 (변수: ctx,cmd,id,ref,props,e만 허용) | `MiddlewareContext` (O), `MiddlewareCtx` (X) |
| OS 커맨드 = 이벤트명 | `OS_ESCAPE` (O), `OS_DISMISS` (X) |
| 하나의 개념 = 하나의 이름 | `UserProfile` 하나만 쓴다 |

---

### 🟢 7. 유용한 도구 & 워크플로 목록

| 상황 | 쓸 것 |
|------|-------|
| 빌드/타입 에러 수정 | `/fix` |
| 코드 정리 후 린트 체크 | `/cleanup` |
| 요청 분석 → 정형 보고서 | `/inbox` |
| 설계 토론/논증 | `/discussion` |
| 설계 검증 (공격/방어) | `/redteam` |
| 테스트 자동 생성 | `/test` |
| 아이디어 → spike 구현 | `/make` |
| PARA 기반 문서 정리 | `/para` |
| Inspector 열기 | `Cmd+D` |
| Path alias | `@os/*`, `@apps/*`, `@/*`, `@kernel` |

---

## 3. 결론 / 제안

### Onboarding workflow가 해야 할 일

1. **매 대화 시작 시** 위 7가지 핵심을 시스템 프롬프트 수준으로 주입
2. **조건부 활성화**: 작업 유형에 따라 관련 섹션만 강조 (예: 파일 이동 작업이면 #4 체크리스트 강조)
3. **규칙 변경 시 동기화**: `rules.md`나 `CLAUDE.md` 변경 시 onboarding도 자동 반영

### 구현 형태 옵션

| 옵션 | 장점 | 단점 |
|------|------|------|
| A) `CLAUDE.md` 보강 | 모든 도구가 자동으로 읽음 | 파일이 커지면 토큰 낭비 |
| B) `/onboarding` 워크플로 | 대화 시작 시 명시적 호출 | 호출을 잊을 수 있음 |
| C) `.agent/rules.md` 정리 + `CLAUDE.md` 요약 | 계층적 관리 | 동기화 필요 |

---

## 4. 해법 유형 (Solution Landscape)

🟡 **Constrained** — 핵심 지식 자체는 이미 `rules.md`와 `CLAUDE.md`에 상당 부분 존재한다. 문제는 "포맷과 전달 방식"이며, 위 3가지 옵션 중 선택의 문제다.

---

## 5. 인식 한계 (Epistemic Status)

- 이 분석은 현재까지의 20개 대화 기록, 프로젝트 문서, 워크플로 파일에 기반한다.
- 실제 다른 LLM/에이전트(Claude Code 등)가 이 프로젝트에서 겪는 어려움은 직접 관찰하지 못했다.
- "어떤 지식이 빠지면 실제로 삽질하는가"에 대한 정량적 데이터는 없다.

---

## 6. 열린 질문 (Open Questions)

1. **형태**: A/B/C 중 어떤 방식으로 갈 것인가? (아니면 혼합?)
2. **범위**: 위 7가지 외에 추가해야 할 항목이 있는가?
3. **트리거**: `/onboarding`을 매번 수동 호출할 것인가, 아니면 자동으로 주입되게 할 것인가?

---

**한줄요약**: 20개+ 대화에서 반복된 삽질 패턴(TestBot 미사용, 레이어 위반, 파일 이동 미검증 등)을 7가지 핵심 지식으로 추출하여, onboarding 워크플로의 콘텐츠 소스로 정리한 보고서.
