# /divide Report — os-sdk를 순수 App Facade로 정리

## Problem Frame

| | 내용 |
|---|------|
| **Objective** | os-sdk가 "앱 개발자를 위한 단일 Facade" (defineApp + Modules + Collection + View Binding) 정체성에 맞도록 비-Facade 코드를 올바른 패키지로 이동 |
| **Constraints** | C1. os-sdk → os-core, os-react 의존 허용 (Facade니까) / C2. os-devtool → os-sdk 의존 허용 / C3. 순환 의존 금지 / C4. 기존 테스트 전부 통과 / C5. Inspector는 os-devtool로 이동 예정 (미래 계획) |
| **Variables** | V1. page.ts 이동 위치 / V2. headless shim 처리 / V3. loopGuard 이동 위치 / V4. useOS 이동 위치 / V5. Inspector 이동 범위 |

> 확신도: Objective 🟢, C1-C4 🟢, C5 🟢 (사용자 명시), V1-V5 🟢

---

## Backward Chain

| Depth | Subgoal | 충족? | Evidence | 미충족 시 전제조건 |
|-------|---------|-------|----------|--------------------|
| 0 | **os-sdk에 Facade가 아닌 코드 0건** | ❌ | page.ts, headless/, loopGuard, useOS 존재 | → A, B, C, D |
| 1 | **A: page.ts가 os-devtool에 있다** | ❌ | `packages/os-sdk/src/app/defineApp/page.ts` (1,075줄) | → A1, A2, A3 |
| 2 | A1: page.ts의 os-sdk 내부 의존 해소 | ❌ | `@os-sdk/library/headless` import (L35), `./types` import (L53), `./index` import (L609) | 🔨 **WP-A1** |
| 2 | A2: page.ts 소비자 import 경로 갱신 | ❌ | 60+개 테스트 파일이 `@os-sdk/app/defineApp/page` import | 🔨 **WP-A2** |
| 2 | A3: `defineApp.ts` → `page.ts` 역참조 제거 | ❌ | `__zoneBindings` 타입이 `import("./page").ZoneBindingEntry` (types.ts:320, index.ts:364) | 🔨 **WP-A3** |
| 1 | **B: headless shim이 os-sdk에 없다** | ❌ | `packages/os-sdk/src/library/headless/index.ts` (re-export) | → B1, B2 |
| 2 | B1: headless shim의 소비자가 직접 os-core import로 전환 | ❌ | page.ts(L35)만 사용. page.ts가 이동하면 자동 해소 | → A (A 완료 시 자동 해소) |
| 2 | B2: headless/ 디렉토리 삭제 | ❌ | B1 완료 후 실행 가능 | 🔨 **WP-B2** |
| 1 | **C: loopGuard가 os-sdk에 없다** | ✅ | `grep: @os-sdk/library/lib/loopGuard` → **0건**. 소비자 없음. | — (삭제 가능) |
| 1 | **D: useOS가 os-sdk에 없다** | ❌ | `src/inspector/shell/components/Kbd.tsx`가 유일한 소비자 | → D1 |
| 2 | D1: useOS를 Inspector와 함께 이동 또는 surface 패키지로 이동 | ❌ | Inspector → os-devtool 이동 계획 존재. Inspector와 함께 이동이 자연스러움 | 🔨 **WP-D1** |
| 1 | **E: Inspector가 os-devtool에 있다** | ❌ | `src/inspector/` (28개 파일) | → E1, E2 |
| 2 | E1: Inspector 의존성이 os-devtool에서 해결 가능 | ✅ | `@kernel` (type-only), `@os-core` (7파일), `@os-sdk` (3파일: app.ts+Kbd+test), `@os-devtool` (2파일: TestBotPanel+api) — 전부 하위 의존 | — |
| 2 | E2: Inspector 파일을 os-devtool/inspector/로 물리 이동 + import 갱신 | ❌ | 28개 파일 이동 + src/ 내 Inspector 참조 갱신 필요 | 🔨 **WP-E2** |

---

## Work Packages

| WP | Subgoal | 왜 필요한가 (chain) | 작업 내용 | 규모 |
|----|---------|-------------------|----------|------|
| **WP-A3** | `ZoneBindingEntry` 타입 분리 | Goal ← A ← A3 | `ZoneBindingEntry` 인터페이스를 `page.ts`에서 `types.ts`(또는 별도 파일)로 추출. `defineApp.ts`와 `types.ts`의 `import("./page")` 제거. | S |
| **WP-A1** | page.ts 의존 해소 | Goal ← A ← A1 | page.ts 내 `@os-sdk/library/headless` → `@os-core/3-inject/...` 직접 import. `./types` → `@os-sdk/app/defineApp/types` 절대경로. `./index` → `@os-sdk/app/defineApp/index` 절대경로. 이동 후에도 os-sdk를 의존하는 건 허용 (C2). | S |
| **WP-A2** | page.ts 이동 + 소비자 갱신 | Goal ← A ← A2 | `page.ts`를 `packages/os-devtool/src/testing/page.ts`로 이동. 60+개 테스트의 `@os-sdk/app/defineApp/page` → `@os-devtool/testing/page`로 일괄 치환. `createHeadlessPage.ts`의 import도 갱신. | M (파일 수 많지만 기계적) |
| **WP-B2** | headless shim 삭제 | Goal ← B ← B2 | `packages/os-sdk/src/library/headless/` 디렉토리 삭제. WP-A1 완료 후 소비자 0. | XS |
| **WP-C** | loopGuard 삭제 | Goal ← C | `packages/os-sdk/src/library/lib/loopGuard.ts` 삭제. 소비자 0건 (이미 확인). | XS |
| **WP-D1** | useOS 이동 | Goal ← D ← D1 | Inspector 이동(WP-E2) 시 함께 이동. `useOS`를 `os-devtool/inspector/` 내부로 동봉. | XS |
| **WP-E2** | Inspector → os-devtool 이동 | Goal ← E ← E2 | `src/inspector/` 28개 파일 → `packages/os-devtool/src/inspector/`로 이동. `@os-devtool/inspector/` alias 추가. src/ 내 Inspector 참조 갱신. | L |

---

## 실행 순서 (의존 관계 기반)

```
Phase 1 — 선행 조건 (코드 분리)
  WP-A3: ZoneBindingEntry 타입 분리
  WP-C:  loopGuard 삭제 (독립, 병렬 가능)

Phase 2 — page.ts 이동
  WP-A1: page.ts 내부 의존 해소
  WP-A2: page.ts 물리 이동 + 소비자 갱신

Phase 3 — 잔여 정리
  WP-B2: headless shim 삭제 (A1 완료 후)

Phase 4 — Inspector 이동 (별도 PR 가능)
  WP-E2: Inspector → os-devtool 이동
  WP-D1: useOS 동봉 이동
```

---

## Residual Uncertainty

- **WP-A2 범위**: 60+개 import 경로 변경은 기계적이지만 누락 위험. `grep -r` + `tsc --noEmit`으로 검증 필수.
- **WP-E2 범위**: Inspector가 `src/` 내 라우팅/레이아웃에 어떻게 마운트되는지 추가 조사 필요. 앱 레이어에서 `os-devtool`을 import하는 형태가 될 수 있음 (런타임 devtool이므로 정당).

## Definition of Done

- [x] Problem Frame 3요소 확정
- [x] 모든 leaf가 ✅ 또는 🔨
- [x] 최소 depth 3 도달 (depth 0→1→2)
- [x] 모든 판정에 코드 증거
- [x] Constraints 위반 없음
- [x] Report 저장
