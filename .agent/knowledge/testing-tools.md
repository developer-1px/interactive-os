# Testing Tools — 테스트 도구 선택 기준과 코드 템플릿

> 테스트를 작성할 때 어떤 도구를 쓸지, 어떤 구조로 쓸지의 기준. 프로젝트별 도구 설정은 §Config에.
> 공식 문서: `docs/2-area/official/os/headless-page.md`

---

## Config

> **이 섹션이 워크플로우의 Slot이다.**
> `/red` Step 2가 "§Config를 따른다"고 참조하면 여기서 프로젝트별 도구와 템플릿을 읽는다.

### 도구 선택 기준

| 질문 | 예 → | 아니오 → |
|------|------|----------|
| 앱의 Zone/bind/keybinding을 검증하는가? | **Tier 2** `createHeadlessPage(App, UI)` | **Tier 1** `createHeadlessPage()` |

### Tier 1: OS 커널 테스트

> OS 자체의 커맨드 파이프라인을 검증. 앱 코드 없이 커널만 테스트.

```ts
/**
 * @spec docs/1-project/[name]/spec.md
 */
import { createHeadlessPage } from "@os-devtool/testing";

describe("Feature: [태스크명]", () => {
  let page: HeadlessPage;

  beforeEach(() => {
    page = createHeadlessPage();
    page.setupZone(ZONE_ID, { items, role, config });
  });

  it("#N [입력] → [결과]", () => {
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("item-2");
  });
});
```

### Tier 2: 앱 통합 테스트

> 실제 앱의 bind 경로를 검증. **dispatch 금지. click/press만 허용.**
> **2번째 인자(UI Component) 필수.** Component 없으면 React 렌더 없음 = UI 결합 미검증.

```ts
/**
 * @spec docs/1-project/[name]/spec.md
 */
import { createHeadlessPage } from "@os-devtool/testing";
import { BuilderApp } from "@apps/builder/app";
import { BuilderUI } from "@apps/builder/BuilderUI";

describe("Feature: [태스크명]", () => {
  let page: AppPage<BuilderState>;

  beforeEach(() => {
    page = createHeadlessPage(BuilderApp, BuilderUI);
    page.goto("/builder");  // URL only — Playwright 동형
  });

  it("#N [사용자 행동] → [결과]", () => {
    page.click("trigger-id");
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("item-2");
  });
});
```

### 공통 금지 목록

- ❌ `dispatch()` 직접 호출 (Tier 2에서 절대 금지. Tier 1에서도 가급적 회피)
- ❌ 내부 함수 직접 호출 (`Keybindings.resolve()`, `createDrillDown()`, `resolveMouse()`)
- ❌ `node:fs`, 동적 `import()`로 모듈 존재 테스트
- ❌ 커맨드 팩토리 직접 호출 후 반환값 검사
- ✅ `page.click()`, `page.keyboard.press()` → `page.focusedItemId()` / `page.state` / `page.attrs()`

---

## Patterns

| 패턴 | 설명 | 발견일 |
|------|------|--------|
| **입력 우선 테스트** | `page.keyboard.press()` 또는 `page.locator().click()`으로 시작. dispatch 금지 | 2026-02-25 |

## Hazards

| 함정 | 결과 | 대응 | 발견일 |
|------|------|------|--------|
| **Tier 혼동** | Tier 1(OS-only)로 앱 기능 테스트 → 커널만 검증됨 → browser에서 실패 | 도구 선택 기준 표 참조 | 2026-02-25 |

## Precedents

(축적 중)
