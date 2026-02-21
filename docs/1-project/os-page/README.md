# OS Page — RFC

> **상태**: Active
> **시작일**: 2026-02-21

## Summary

OS가 Playwright의 `Page`와 동형(isomorphic)인 headless integration test API를 first-class로 제공한다. `defineApp.createPage()`로 앱별 격리 커널에서 `pressKey/click/attrs`로 Full Stack Integration Test를 실행한다.

## Motivation

### 문제

현재 테스팅은 두 세계로 분리되어 있다:

1. **앱 Unit Test** (`TodoApp.create()` → `dispatch(cmd)` → `state`)
   - 앱 로직만 검증. OS 파이프라인(키→커맨드 해석, focus, selection)을 건너뜀.
   
2. **OS APG Test** (`createTestOsKernel()` → `pressKey` → `attrs`)
   - OS 로직만 검증. 앱 커맨드(addTodo, requestDeleteTodo...)를 모름.

**현실의 버그는 이 둘의 사이에서 터진다.** "Delete를 눌렀는데 삭제가 안 돼" — 이건 키→커맨드 해석, zone config, onDelete 콜백, 앱 로직이 전부 관여하는 문제다.

`dispatch` 수준 테스트로는 이 문제를 재현할 수 없고, LLM이 이런 버그를 진단·수정하기 매우 어렵다.

### 해결

OS가 Playwright `Page` 인터페이스를 headless로 제공하면:

```ts
const page = TodoApp.createPage();
page.goto("list");
page.keyboard.press("ArrowDown");
page.keyboard.press("Delete");

// OS state + App state 모두 검증
expect(page.focusedItemId()).toBe("todo-2");
expect(page.state.ui.pendingDeleteIds).toContain("todo-1");
```

- **LLM이 현실 버그에 가까운 테스트를 쓸 수 있다** (W4)
- **같은 테스트 코드가 headless/visual 양쪽에서 동작** — TestBot v2의 진짜 기반
- **학습 비용 0** — Playwright API를 이미 아는 개발자/LLM이 그대로 사용 (W6)

### 기존 자산

| 조각 | 존재 여부 | 위치 |
|------|-----------|------|
| 격리 커널 (앱 + OS) | ✅ | `defineApp.create({ withOS: true })` → `defineApp.testInstance.ts` |
| `pressKey` → OS 커맨드 변환 | ✅ | `resolveKeyboard` + `createTestOsKernel.pressKey()` |
| `click` → OS 커맨드 변환 | ✅ | `resolveMouse` + `createTestOsKernel.click()` |
| `attrs()` DOM projection | ✅ | `createTestOsKernel.attrs()` |
| mock contexts | ✅ | `createTestOsKernel`의 `dom-items`, `zone-config` 등 |
| 앱 키바인딩 선언 | ✅ | `zone.bind({ onDelete, onAction, onCheck, keybindings })` |

**모든 조각이 이미 존재한다. 합치는 인터페이스만 만들면 된다.**

## Detailed Design

→ `prd.md` 참조

## Drawbacks

- `createTestOsKernel`이 레거시가 됨 — 기존 APG 테스트 마이그레이션 필요
- Page API 표면적이 Playwright와 일치하지 않는 부분이 생길 수 있음 (DOM 없는 한계)

## Alternatives

1. **현상 유지** (dispatch 기반 unit + Playwright E2E) — Full Stack headless gap이 남음
2. **Vitest Browser Mode로 실제 DOM에서 테스트** — 느림, 격리 어려움
3. **ShimPage 확장** — DOM 의존이 근본 문제, headless 불가

## Unresolved Questions

- 앱 등록 시 `zone.bind()`의 콜백들이 headless 커널에 자동 등록되는 메커니즘
- `page.goto(zoneName)` 시 mock items/config를 어떻게 설정할 것인가
- Playwright API와의 일치 범위 (어디까지 흉내낼 것인가)
