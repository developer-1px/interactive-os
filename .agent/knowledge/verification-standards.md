# 검증 표준

> 이 문서는 rules.md의 "100% Observable" 원칙을 구체화하는 검증 기준이다.
> 테스트를 작성하거나, 리팩토링 가치를 판단하거나, APG 패턴을 구현할 때 참조한다.

---

## 테스트 원칙

1. **테스트가 먼저다.** 코드를 쓰기 전에 테스트를 쓴다. 테스트가 스펙이고, 통과가 증명이다.

2. **이 OS 위에서 이 OS를 테스트한다.** `@testing-library/react`는 사용하지 않는다 — testing-library가 필요하다는 것은 OS의 테스트 API가 부족하다는 증거다. OS가 자체적으로 Playwright 수준의 검증을 vitest에서 제공해야 한다.

3. **E2E는 블랙박스다.** 내부 로직을 전혀 모르는 상태에서 검증해야 진짜 테스트다.

4. **증명 없는 통과는 통과가 아니다.** 빌드가 됐다는 건 안 깨졌다는 증거가 아니다. 자동화된 검증만 증거다.

5. **빌드 통과 ≠ 런타임 정상.** `vite build`(Rollup)와 dev 서버(esbuild)는 모듈 해석이 다르다. E2E Smoke가 진짜 검증이다.

6. **안 쓰는 테스트는 정리한다.** 죽은 테스트는 거짓 안전감을 준다.

## 테스트 구조 — 1-Root 5-Tier (Updated: 2026-03-07)

> 테스트 파일은 `tests/`에만 존재한다. `src/`, `packages/`에 `__tests__/` 없음. 예외 없음.

### 위치 규칙

```
tests/                         ← 유일한 테스트 루트
├── apg/                       ← W3C APG 계약 테스트 (*.apg.test.ts)
├── headless/                  ← Headless 상호작용 (createPage + keyboard → ARIA)
│   ├── os/                    ← OS 수준 통합 (tab, history, focus 등)
│   └── apps/{app}/            ← 앱별 headless 테스트
├── unit/                      ← 순수 함수 (OS 불필요, page 불필요)
│   ├── os-core/               ← resolveTab, rolePresets 등
│   ├── os-sdk/                ← treeUtils, collection 등
│   └── apps/{app}/            ← findBlockInfo, i18n 등
├── infra/                     ← 테스트 인프라 검증 (Playwright compat 등)
└── e2e/                       ← Playwright E2E (*.spec.ts). 유일한 브라우저.
```

### 확장자 관습

| 확장자 | 의미 | 실행 환경 |
|--------|------|----------|
| `.test.ts` | Headless (vitest) | Node.js |
| `.apg.test.ts` | APG 계약 (headless) | Node.js |
| `.spec.ts` | Playwright E2E | 실제 브라우저 |

### Headless 전환 원칙

- **Headless로 전환 가능하면 이동한다. 불가능하면 삭제한다.**
- `dispatch()` 기반 테스트는 headless 전환 대상이다. `createHeadlessPage()` + `keyboard.press()` → ARIA 검증으로 재작성한다.
- `__tests__/` 안의 `.tsx` 파일이 반드시 테스트는 아니다 — showcase 컴포넌트가 혼재할 수 있다. 분리 필요.

## 테스트 도구

7. **OS 테스트의 처음과 끝 = Zone → Input → ARIA.**
   - OS의 계약 = "Zone을 선언하면 행동을 보장한다". 테스트는 이 계약을 검증한다.
   - **처음**: `page.goto("zone", { role, items, config })` — Zone 선언
   - **입력**: `page.keyboard.press()`, `page.locator("#id").click()` — 사용자 입력
   - **끝**: `locator().toBeFocused()`, `locator().toHaveAttribute()` — ARIA 속성 검증
   - `dispatch()`, `getState()`, `setState()` — OS 내부 우회이므로 테스트 코드에서 금지. 예외 없음.
   - `createOsPage()` — 삭제 대상. `createHeadlessPage()`가 유일한 OS 테스트 팩토리
   - `createPage(app)` = 앱 통합 테스트 (Builder, Todo)
   - **순수 함수 테스트는 page 불필요.** `findBlockInfo`, `parseHashToPath`, `i18n` 등 상태·상호작용이 없는 순수 함수는 직접 호출이 정당하다. `tests/unit/`에 배치.
   - **위배 시**: dispatch를 쓰면 OS Pipeline(listen→resolve→inject→command→project)을 건너뛰어 "vitest에서 통과하지만 브라우저에서 실패"하는 거짓 GREEN이 된다.

### 앱 테스트 표준 패턴 — TestScript ONE Format

> 앱 통합 테스트의 표준: `testbot-*.ts` + `runScenarios(scenarios)`.

```ts
// testbot-myapp.ts — "Write once, run anywhere"
export const zones = ["my-zone"];
export const group = "MyApp";
export const scenarios: TestScenario[] = [
  { zone: "my-zone", items: [...], role: "listbox", scripts: myScripts },
];
```

```ts
// tests/headless/apps/myapp/myapp-interaction.test.ts — OS-level (zone만, app 없음)
import { runScenarios } from "@os-devtool/testing/runScenarios";
import { scenarios } from "@apps/myapp/testbot-myapp";
runScenarios(scenarios);
```

```ts
// tests/headless/apps/myapp/myapp-interaction.test.ts — App-level (React projection 포함)
import { runScenarios } from "@os-devtool/testing/runScenarios";
import { scenarios } from "@apps/myapp/testbot-myapp";
import { MyApp } from "@apps/myapp/app";
import { MyView } from "@apps/myapp/MyView";
runScenarios(scenarios, { app: MyApp, component: MyView });
```

- `runScenarios(scenarios)` — OS-level: `createHeadlessPage()` + 수동 zone setup
- `runScenarios(scenarios, { app, component })` — App-level: `createPage(app, component)` + zone bindings 자동 해석
- **3-engine 호환**: 같은 `run(page, expect, items?)` 함수가 (1) vitest headless, (2) browser TestBot, (3) Playwright E2E에서 동작
- **모범 사례**: `todo-interaction.test.ts`, `docs-testbot.test.ts`
- **Playwright Strict Subset (K2)**: `page.locator("#id").click()`, `page.keyboard.press()`, `expect(loc).toHaveAttribute()`, `expect(loc).toBeFocused()` — 이 API만 사용

## 코드 품질 기준

8. **`as any`는 해결이 아니라 부채다.** 올바른 분류: ① 진짜 수정 (타입을 맞춘다) ② skip (프로덕션 타입 설계 변경 필요 → 지금은 안 건든다). `as any`로 메우는 ③번 선택지는 없다.

9. **리팩토링은 측정 가능한 지표가 단조 개선될 때만 한다.** cast 수, import 수, 의존 방향 수, 코드 줄 수 — 하나 이상이 strictly 개선되고, 나머지가 악화되지 않아야 한다. 등가 교환이면 하지 않는다.

10. **OS 코드는 DOM을 직접 조작하지 않는다.** `document.querySelector`, `.click()`, `.focus()` 등의 직접 DOM 접근은 3-commands뿐 아니라 OS 전체(6-components 포함)에서 금지. 기존 기능이 없으면 우회하지 말고 새 메커니즘을 설계한다. DOM 데이터가 필요하면 `ctx.inject()`나 kernel state를 사용한다.

11. **Focus/Keyboard 동작은 APG가 스펙이다.** 구현 전에 [APG](https://www.w3.org/WAI/ARIA/apg/) 해당 패턴을 읽는다. 순서: ① APG 패턴 읽기 → ② 요구사항을 테스트로 인코딩 → ③ 테스트를 통과하는 코드 작성.

## 완료 기준

12. **"완료"는 Red→Green 증명이다.** 수정 전에 버그를 재현하는 Red 테스트를 먼저 쓰고, 수정 후 Green이 되는 것이 "완료"의 유일한 정의다. 증명 없이 수정만 했으면 "현황 보고"로 종료한다.
