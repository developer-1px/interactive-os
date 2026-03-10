# Naming Analysis — APG Test Fixture Pattern

> 범위: `tests/apg/` — Phase 3 재작성에 필요한 식별자 설계
> 날짜: 2026-03-10
> 수정: /doubt 반영 — 3경계→2경계, Fixture 인라인, os 0줄

---

## 0. 핵심 원칙: Playwright 동형 = os import 0줄

테스트에서 `os` 직접 import는 Playwright 동형 위반이다.

```
❌ expect(readFocusedItemId(os)).toBe("banana");
❌ expect(computeAttrs(os, "banana").tabIndex).toBe(0);

✅ expect(page.locator("#banana")).toBeFocused();
✅ expect(page.locator("#banana")).toHaveAttribute("tabindex", "0");
```

Playwright에서 관찰 수단은 **locator뿐**이다.
`readFocusedItemId`, `computeAttrs` — Playwright에 없다. 쓰면 동형이 깨진다.

## 1. 2경계 (3경계 아님)

> `/doubt` 결과: `os` 경계는 테스트 작성자에게 존재하지 않는다. 과잉 개념이었다.
> `os`는 locator 구현체 내부의 세부사항이다.

| 경계 | 역할 | 사용 |
|------|------|------|
| **page** | 행동 + 관찰 | `keyboard.press()`, `click()`, `locator().toBeFocused()` |
| **app** | 커맨드 dispatch + 상태 읽기 | `app.dispatch(cmd)`, `app.state` |

테스트 작성자가 아는 것: **page + app**. 끝.

## 2. Key Pool

### 테스트에서 사용하는 식별자

| Category | Key | Meaning | Status |
|----------|-----|---------|--------|
| Verb | `create` | 새 인스턴스 반환 | ✅ 유지 |
| Noun | `Page` | Playwright subset (행동 + 관찰) | ✅ 유지 |
| Noun | `Locator` | 요소 관찰 + assertion | ✅ 유지 |

### 제거 확정

| Key | 이유 |
|-----|------|
| ~~`Factory`~~ (타입명) | 인라인으로 충분. 외부 export 안 함 |
| ~~`Fixture`~~ (타입명) | 같은 이유. 이름 짓기에 에너지 소비 = 과잉처리 |
| ~~`setup`~~ | 삭제 대상 |
| ~~`Internal`~~ | God Object |
| ~~`read`~~ (test code) | os 0줄 → 불필요 |
| ~~`compute`~~ (test code) | os 0줄 → 불필요 |

## 3. 이상 패턴 리포트

### 3.1 동의어 충돌: fixture 함수 이름 (4종) → `create{Role}`로 통일

| Before | After |
|--------|-------|
| `createDialogApp` | `createDialog` |
| `singleSelect` | `createListbox` |
| `navTreeFactory` | `createNavTree` |
| `createMenubar` | `createMenubar` (OK) |

규칙: `create` (naming.md 동사) + `{Role}` (glossary 용어). `App`/`Factory` 접미사 불필요.

### 3.2 os import = 동형 위반

contracts.ts의 현재 코드가 위반:
```typescript
// ❌ 현재 (os import 0줄 위반)
import { os } from "@os-core/engine/kernel";
import { readFocusedItemId } from "@os-core/3-inject/readState";
expect(readFocusedItemId(os)).toBe(opts.lastId);

// ✅ 올바른 (locator만)
expect(page.locator("#" + opts.lastId)).toBeFocused();
```

## 4. 확정된 테스트 표준

```typescript
// import: page + app만. os 0줄.
import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { expect } from "@os-devtool/testing";

// fixture: create{Role} → { page, cleanup }
function createListbox(focusedItem = "apple") {
  const app = defineApp("test-listbox", {});
  const zone = app.createZone("listbox");
  zone.bind({ role: "listbox", getItems: () => ITEMS, options: CONFIG });
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(focusedItem);
  return { page, cleanup };
}

// test: locator로 assertion. os 0줄.
it("Down Arrow: moves focus to next item", () => {
  const { page, cleanup } = createListbox();
  page.keyboard.press("ArrowDown");
  expect(page.locator("#banana")).toBeFocused();
  expect(page.locator("#banana")).toHaveAttribute("tabindex", "0");
  expect(page.locator("#apple")).toHaveAttribute("tabindex", "-1");
  cleanup();
});
```

이 코드를 Playwright E2E로 바꾸면?
`createPage` → native `page`, `createListbox` → `page.goto("/listbox")`.
나머지 코드 0줄 변경. **이것이 동형이다.**

## 5. /doubt 적용 결과

| 항목 | 판정 | 내용 |
|------|------|------|
| 3경계 프레이밍 | 🟡→축소 | 2경계 (page + app). os는 인프라 세부사항 |
| `Fixture` 타입명 | 🟡→축소 | 인라인. 내부만 쓰는 타입에 이름 불필요 |
| T7 contracts.ts | 🟡→재작성 | os import 위반. locator 기반으로 재재작성 필요 |
| `create{Role}` 규칙 | 🟢 유지 | 최소 1줄 규칙 |
| `contracts.ts` 존재 | 🟢 유지 | 9파일 중복 방지 |
| `content()` 메서드 | 🟢 유지 | Playwright에 있다 |
