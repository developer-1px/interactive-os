# /plan — os-sdk Facade 정리

> **Objective**: os-sdk에서 비-Facade 코드를 제거하여 정체성을 확립한다.
> **Source**: `/divide` Report — `REPORT-sdk-refactor.md`

---

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `page.ts:ZoneBindingEntry` (L268-275) | `page.ts`에 정의. `types.ts:320`과 `index.ts:364`가 `import("./page")` 역참조 | `types.ts`로 이동. page.ts가 types.ts를 import (정상 방향) | 🟢 Clear | — | tsc 0 | `page.ts`내 ZoneBindingEntry 사용 3곳 import 갱신 |
| 2 | `page.ts:ZoneOrderEntry` (L612-622) | `page.ts`에 정의. page.ts 내부에서만 사용 | page.ts와 함께 이동 (분리 불필요) | 🟢 Clear | →3 | — | — |
| 3 | `types.ts:import("./page")` (L245, L320) | `AppPage.attrs` 반환 타입 = `import("./page").ItemAttrs`, `__zoneBindings` = `import("./page").ZoneBindingEntry` | L245: `import("@os-core/3-inject/compute").ItemAttrs`. L320: `ZoneBindingEntry` (same-file, #1에서 이동됨) | 🟢 Clear | →1 | tsc 0 | — |
| 4 | `types.ts:AppPage.locator` (L275) | 반환 타입 `import("@os-sdk/app/defineApp/page").OsLocator` | `import("@os-devtool/testing/page").OsLocator` | 🟢 Clear | →6 | tsc 0 | — |
| 5 | `page.ts` L35 headless import | `from "@os-sdk/library/headless"` | `from "@os-core/3-inject/compute"` + `from "@os-core/3-inject/simulate"` 직접 import | 🟢 Clear | — | tsc 0 | — |
| 6 | `page.ts` 물리 이동 | `packages/os-sdk/src/app/defineApp/page.ts` (1,075줄) | `packages/os-devtool/src/testing/page.ts` | 🟢 Clear | →1,3,5 | tsc 0 | 70개 소비자 경로 갱신 |
| 7 | 소비자 import 경로 갱신 (70개) | `from "@os-sdk/app/defineApp/page"` | `from "@os-devtool/testing/page"` | 🟢 Clear | →6 | tsc 0, vitest 기존 테스트 전수 통과 | 누락 시 tsc가 잡음 |
| 8 | `createHeadlessPage.ts` import 갱신 | `from "@os-sdk/app/defineApp/page"` | `from "./page"` (같은 디렉토리) | 🟢 Clear | →6 | tsc 0 | — |
| 9 | `headless/index.ts` 삭제 | `packages/os-sdk/src/library/headless/index.ts` (re-export shim) | 삭제. 유일한 소비자(page.ts) #5에서 제거됨 | 🟢 Clear | →5 | tsc 0 (소비자 0건) | — |
| 10 | `loopGuard.ts` 삭제 | `packages/os-sdk/src/library/lib/loopGuard.ts` | 삭제. 소비자 0건 | 🟢 Clear | — | tsc 0 | — |
| 11 | `library/lib/` 디렉토리 정리 | `useOS.ts` + `loopGuard.ts` | `loopGuard` 삭제(#10). `useOS`는 Inspector 이동(미래) 시 함께 이동. 현재 유지. | 🟢 Clear | — | — | — |

---

## MECE 점검

1. **CE**: #1-#11 전부 실행하면 os-sdk에 비-Facade 코드 0? → **Yes** (page.ts 이동 + headless shim 삭제 + loopGuard 삭제. useOS는 Inspector 이동 시 동반 → 이번 scope 외)
2. **ME**: 중복? → #2는 #6에 포함 (분리 작업 필요 없으므로 자연 이동) → **#2 제거**
3. **No-op**: Before=After? → #11은 "유지" = no-op → **#11 제거**

### 정제된 실행 순서

```
Phase 1 (타입 분리 — 선행 조건):
  #1  ZoneBindingEntry → types.ts 이동
  #3  types.ts의 import("./page") 제거
  #10 loopGuard.ts 삭제

Phase 2 (page.ts 이동):
  #5  page.ts 내부 headless import 해소
  #6  page.ts 물리 이동
  #7  소비자 70개 경로 갱신
  #8  createHeadlessPage.ts 경로 갱신
  #4  types.ts OsLocator import 갱신

Phase 3 (정리):
  #9  headless/index.ts 삭제
```

### 검증 게이트

```bash
# Phase 1, 2, 3 각 완료 후:
source ~/.nvm/nvm.sh && nvm use && npx tsc --noEmit 2>&1 | tail -5
# 최종:
source ~/.nvm/nvm.sh && nvm use && npx vitest run 2>&1 | tail -30
```

---

## 라우팅

승인 후 → `/go` (기존 프로젝트 `os-restructure`) — Phase 1→2→3 순차 실행, #1.5 Meta 프로젝트 직접 실행
