# OS Testing Architecture — 현황 보고서

> 작성일: 2026-03-06
> 유형: Report (현황 분석)
> 도메인: testing

---

## 1. 패키지 구조

### `packages/os-devtool/src/testing/` — 테스트 인프라의 단일 원천

| 파일 | 역할 | 의존 방향 |
|------|------|-----------|
| `types.ts` | Playwright 호환 `Page`, `Locator`, `LocatorAssertions` 인터페이스 정의 (6 메서드) | 의존 없음 (leaf) |
| `scripts.ts` | `TestScript`, `TestScenario`, `ExpectLocator` 타입 + 내장 ARIA 스크립트 5개 (listbox, toolbar, grid, radiogroup, accordion) | types.ts |
| `scripts/apg/` | APG 패턴별 TestScript 파일 23개 (accordion~tree) + index.ts barrel | scripts.ts |
| `expect.ts` | Playwright `expect(locator)` 호환 래퍼. headless/browser 엔진 공용 | types.ts |
| `simulate.ts` | `simulateKeyPress`, `simulateClick` — headless 상호작용 시뮬레이션 | @os-core 직접 의존 |
| `createOsPage.ts` | OS-only headless simulator (**삭제 예정**). Zone 없이 OS 내부 조립 | simulate.ts, @os-core |
| `createHeadlessPage.ts` | Playwright Page 호환 headless 구현. createOsPage를 래핑 | createOsPage.ts, types.ts |
| `page.ts` | `createAppPage()` — defineApp 기반 앱 통합 테스트 팩토리. 또한 `createOsPage` re-export | simulate.ts, @os-core |
| `createBrowserPage.ts` | 브라우저 실행 엔진 (Inspector/TestBot). real DOM 이벤트 + CSS 애니메이션 | @os-core/engine/kernel |
| `runScenarios.ts` | vitest 자동 러너. `TestScenario[]` → `describe/it` 블록 자동 생성 | createHeadlessPage, page.ts |
| `TestBotRegistry.ts` | Zone-reactive 스크립트 등록. 브라우저 TestBot 패널이 구독 | scripts.ts |
| `zoneItems.ts` | `getZoneItems(zoneId)` — ZoneRegistry 브릿지 (facade-safe) | @os-core |
| `diagnostics.ts` | 테스트 실패 시 상태 진단 포맷터 | @os-core |

---

## 2. 3-Engine 아키텍처

동일한 `TestScript.run(page, expect, items?)` 함수가 3개 엔진에서 실행된다:

| Engine | 구현 | 환경 | 속도 |
|--------|------|------|------|
| **Headless** | `createHeadlessPage()` / `createAppPage()` | vitest (DOM 없음) | <1ms/test |
| **Browser** | `createBrowserPage()` | Inspector (real DOM + 애니메이션) | ~100ms/step |
| **Playwright E2E** | native Playwright Page | 실제 브라우저 | ~1s/test |

### Playwright Strict Subset (K2)

테스트 코드에서 허용하는 API는 6개뿐:

```
page.locator("#id").click()          page.keyboard.press("key")
page.locator("#id").getAttribute()   page.keyboard.type("text")
expect(loc).toHaveAttribute()        expect(loc).toBeFocused()
```

---

## 3. 테스트 팩토리 — 3종류

| 팩토리 | 용도 | 상태 |
|--------|------|------|
| `createOsPage()` | Zone 없이 OS 내부를 직접 조립하는 레거시 도구 | **삭제 예정** (19 파일 잔존) |
| `createHeadlessPage()` | Zone→Input→ARIA 패턴의 OS-level 테스트 | **정규** (5 파일 직접 사용) |
| `createPage(app, component?)` | defineApp 기반 앱 통합 테스트 | **정규** (40 파일 사용) |

### createOsPage 잔존 현황 (마이그레이션 대상)

`import.*createOsPage` 기준 **19 파일**:

| 영역 | 파일 수 | BOARD 태스크 |
|------|---------|-------------|
| `tests/apg/` | 8 (slider, grid, meter, spinbutton 등) | #7 |
| `tests/integration/builder/` | 3 | #8 |
| `tests/integration/docs-viewer/` | 3 | #9 (부분) |
| `tests/integration/todo/` | 1 | #9 (부분) |
| `tests/script/devtool/` | 4 (os-page, diagnostics, pipeline-logging, auto-diagnostics) | #10 |
| `tests/e2e/` | 2 | #10 |

---

## 4. TestScript ONE Format

### 표준 구조

```
testbot-*.ts  →  export { zones, group, scenarios }
                    ↓
runScenarios(scenarios)       ← OS-level (vitest)
runScenarios(scenarios, {app, component})  ← App-level (vitest)
TestBotRegistry.initZoneReactive(manifest) ← Browser auto
```

### 현재 testbot 파일 (4개)

| 파일 | zones | 사용처 |
|------|-------|--------|
| `src/apps/todo/testbot-todo.ts` | todo zones | `todo-interaction.test.ts` via runScenarios |
| `src/docs-viewer/testbot-docs.ts` | docs zones | `docs-testbot.test.ts` via runScenarios |
| `src/apps/builder/testbot-builder-arrow.ts` | builder zones | 브라우저 전용 (headless 미지원) |
| `src/testing/testbot-manifest.ts` | 전체 매니페스트 | TestBot 브라우저 패널 |

### runScenarios 사용처 (2개)

- `src/apps/todo/__tests__/unit/todo-interaction.test.ts`
- `src/docs-viewer/__tests__/unit/docs-testbot.test.ts`

---

## 5. APG 테스트 스크립트 현황

`scripts/apg/` 디렉토리: **23개 패턴 파일**

accordion, button, carousel, checkbox, disclosure, feed, grid, listbox-single, listbox-multi, menu, menu-button, meter, radiogroup, slider, slider-multithumb, spinbutton, switch, tabs, toolbar, tooltip, tree, treegrid, window-splitter

`tests/apg/` 디렉토리: **24개 테스트 파일** (*.apg.test.ts + os-guarantee + disallow-empty-initial + ui/)

---

## 6. 테스트 디렉토리 구조

```
tests/
├── apg/                    # APG 패턴별 테스트 (24 files)
│   ├── *.apg.test.ts       # headless APG 테스트
│   └── ui/                 # UI projection APG 테스트
├── integration/            # 앱/OS 통합 테스트
│   ├── builder/            # 4 files
│   ├── collection/         # 2 files (tree-ops, tree-paste)
│   ├── docs-viewer/        # 5 files
│   ├── os/                 # 6 files (tab, history, deletion-focus 등)
│   └── todo/               # 9 files
├── script/devtool/         # devtool 인프라 테스트 (12 files)
└── e2e/                    # 종단간 테스트
    ├── builder/            # 2 files
    ├── os-core/            # 2 files
    └── os-react/           # 3 files
```

패키지 내부 테스트:
```
packages/os-core/src/**/__tests__/    # OS 코어 단위 테스트
packages/os-react/src/**/__tests__/   # OS React 바인딩 테스트
packages/os-sdk/src/**/__tests__/     # SDK 테스트
packages/kernel/src/**/__tests__/     # 커널 단위 테스트
```

---

## 7. 현재 수치

| 메트릭 | 값 |
|--------|-----|
| 테스트 파일 | 167 |
| 테스트 수 | 1,754 passed, 2 todo |
| 실행 시간 | ~14s |
| APG 스크립트 | 23 패턴 |
| testbot 파일 | 4개 |
| runScenarios 사용 | 2개 앱 (todo, docs) |
| createOsPage 잔존 | 19 파일 (마이그레이션 중) |

---

## 8. 진행 중인 마이그레이션: eliminate-createOsPage

**BOARD**: `docs/1-project/testing/eliminate-createOsPage/BOARD.md`

### 완료 (#1~#6)
- goto() 옵션 확장 (treeLevels, expandableItems, rects)
- page.os escape hatch 제거
- @testing-library 잔여 확인 (import 0)
- resolve* 직접 테스트 11파일 삭제 (-126 tests)
- tests/integration/os/ 3파일 삭제 (-55 tests)

### 진행 중 (#7~#10)
- #7: tests/apg/ createOsPage 마이그레이션 (8파일)
- #8: tests/integration/builder/ 마이그레이션 (3파일)
- #9: tests/integration/docs+todo 마이그레이션 (6파일)
- #10: tests/script+e2e 마이그레이션 (5파일)

### 미착수 (#11~#12)
- #11: createOsPage.ts 삭제
- #12: page.ts export 정리

---

## 9. 구조적 특성 요약

1. **Zero Drift 보장**: headless compute 함수가 OS의 두뇌. DOM 컴포넌트는 투영. headless 테스트 통과 = DOM 동일 동작
2. **3-engine 호환**: 테스트 코드 1벌로 vitest + browser + Playwright 동시 지원
3. **Playwright Subset 강제**: OS 자체 API가 아닌 Playwright 표준 API만 테스트에 노출
4. **Zone→Input→ARIA 패턴**: OS 계약("Zone 선언 → 행동 보장")을 직접 검증. dispatch/getState 우회 금지
5. **TestScript ONE Format**: testbot-*.ts → runScenarios()로 보일러플레이트 제거. 2개 앱 적용 완료
6. **createOsPage 퇴장 중**: Zone 없이 OS 내부를 조립하는 레거시 도구. 19파일 잔존, 12단계 마이그레이션 중 #7~#10 진행 예정
