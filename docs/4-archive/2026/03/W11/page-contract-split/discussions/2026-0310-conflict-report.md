# Conflict Report: Page 레거시 식별자 청산

> 생성일: 2026-03-10
> 범위: `packages/os-sdk/app/defineApp/types.ts`, `packages/os-devtool/testing/page.ts`

## Summary

| # | 충돌 | 유형 | 심각도 |
|---|------|------|--------|
| C1 | God Object는 외부에서 죽었지만 내부에서 살아있다 | Pattern Tension | 🔴 |
| C2 | `AppPageInternal` — 삭제 vs 유지 (unit test 정당성) | Boundary Tension | 🟡 |
| C3 | `AppLocatorAssertions` — 중복 vs 패키지 독립 | Pattern Tension | 🟢 |

## Conflicts

---

### C1: God Object는 외부에서 죽었지만 내부에서 살아있다

**충돌 선언**: Playwright Isomorphism을 위해 "Page"는 Playwright subset만 의미해야 한다. 동시에 내부 구현체는 OS 메서드를 포함한 단일 객체여야 한다. 그런데 이 객체가 `AppPage`라는 이름을 갖고 있어서, "Page = Playwright"라는 원칙이 내부에서 위반된다.

#### Thesis: Purity — "Page"는 Playwright만 의미해야 한다

```
주장: AppPage, createAppPage에서 "Page"를 제거해야 한다
근거: 1경계 원칙 확정 (BOARD.md). Page = Playwright subset, 이 등식은 내부에서도 성립해야 한다.
      types.ts의 Page 인터페이스가 이미 canonical truth.
전제: 이름이 개발자의 mental model을 형성한다. "AppPage"라는 이름이 존재하는 한,
      다음 세션의 에이전트가 이것을 "Page의 변종"으로 오해하고 사용할 위험이 있다.
대가: 포기하면 이중 의미("Page"가 두 개의 다른 것을 가리킴)가 영구히 남는다.
```

#### Antithesis: Pragmatism — 내부 구현체도 결국 Page를 만드는 것이다

```
주장: createAppPage는 Page를 "만드는" 함수다. "Page"가 이름에 있는 것이 자연스럽다.
근거: createPage(page.ts:906)가 createAppPage를 호출하고, 반환값을 Page로 좁힌다.
      즉 createAppPage는 Page의 superset을 만드는 팩토리다.
      "Page"를 빼면 이 관계가 이름에서 사라진다.
전제: 내부 코드를 읽는 사람도 "이것이 Page를 포함하는 무언가"임을 이름에서 알 수 있어야 한다.
대가: 포기하면 createPage와 내부 팩토리 사이의 관계가 이름만으로는 보이지 않는다.
```

#### 충돌 지점

```
정확한 위치: types.ts:280 `AppPage<_S>` — 이 타입이 두 세계의 교차점
- Page (goto, click, keyboard, locator, content) — Playwright subset
- OS Internal (focusedItemId, selection, activeZoneId, attrs, kernel, reset, cleanup, dumpDiagnostics)
- Projection (query, html)

이 세 가지가 한 인터페이스에 공존하는 것이 God Object의 정의다.
그러나 구현체(page.ts:658 "Return AppPage")는 이 세 가지를 한 객체로 반환해야 한다.
타입 분리는 가능하지만, 런타임 객체는 하나다.
```

**분류**: Pattern Tension — 외부 API는 새 패턴(Page only), 내부는 옛 패턴(God Object)이 공존.

---

### C2: `AppPageInternal` — 삭제 vs 유지

**충돌 선언**: 1경계 원칙을 위해 테스트에서 `AppPageInternal`을 없애야 한다. 동시에 unit test에서 `dispatch`/`state` 직접 접근이 필요한 정당한 경우가 있다. 그런데 이 접근을 허용하면 1경계가 깨진다.

#### Thesis: 1경계 순수 — 삭제

```
주장: AppPageInternal 타입을 삭제하고, 모든 테스트를 page-only로 재작성해야 한다
근거: "사용자가 도달할 수 없는 상태를 테스트하는 것은 거짓 양성의 원천" (rules.md:90)
      dispatch로 직접 상태를 세팅하는 것은 사용자가 도달할 수 없는 경로다.
전제: 모든 상태가 page 행동(click/keyboard)만으로 도달 가능하다.
대가: 포기하면 "동형"이라는 단어가 거짓이 된다. E2E로 옮길 때 dispatch 호출을 번역할 수 없다.
```

#### Antithesis: 실용 — 유지 (이름만 변경)

```
주장: dispatch/state 접근이 필요한 unit test가 있다. 타입명만 바꾸면 된다.
근거: todo.test.ts에서 dispatch(addTodo(...))로 데이터 시딩 — 키보드로 4개 todo 입력은 비효율적.
      setupZone은 삭제 가능하지만, dispatch/state는 Arrange 단계의 정당한 도구.
전제: TestScript(동형)과 unit test(.test.ts)는 다른 목적이다.
      동형은 TestScript에서만 강제되면 충분하다.
대가: 포기하면 unit test 작성이 극도로 번거로워진다 (모든 상태를 keyboard로 도달해야 함).
```

#### 충돌 지점

```
tests/headless/apps/todo/todo.test.ts:10 — import AppPageInternal
tests/headless/apps/todo/todo.test.ts:15 — type P = AppPageInternal<AppState>

이 3개 파일이 유일한 소비자. "정당한 unit test" vs "동형 위반"의 경계선 위에 있다.
핵심 질문: Arrange에서 dispatch를 쓰는 것은 1경계 위반인가?
```

**분류**: Boundary Tension — TestScript(동형 필수)와 unit test(실용 허용)의 책임 경계 불명확.

---

### C3: `AppLocatorAssertions` 중복

**충돌 선언**: 타입 일관성을 위해 중복 타입을 통합해야 한다. 동시에 os-sdk와 os-devtool은 독립 패키지여야 한다.

#### Thesis: 통합

```
주장: LocatorAssertions(types.ts)과 AppLocatorAssertions(defineApp/types.ts)는 동일 구조. 하나만 남겨야.
근거: 같은 메서드 시그니처 (toHaveAttribute, toBeFocused, toBeChecked, toBeDisabled, not).
전제: 하나의 canonical 타입이 있어야 이름 혼란이 없다.
대가: 포기하면 "어떤 LocatorAssertions를 import해야 하지?" — 불필요한 인지 부하.
```

#### Antithesis: 패키지 독립

```
주장: os-sdk(AppPage 타입 정의)와 os-devtool(Page/Locator 실행)은 별개 패키지. 의존 방향을 강제하지 않아야.
근거: 현재 os-devtool → os-sdk 의존은 있지만, os-sdk → os-devtool 의존은 없다.
      LocatorAssertions를 os-devtool에서만 export하면 os-sdk가 os-devtool에 의존해야 함.
전제: 패키지 의존 방향은 쉽게 바꿀 수 없다.
대가: 포기하면 중복 코드가 남지만, 패키지 독립은 유지된다.
```

#### 충돌 지점

```
AppPage 자체가 삭제/리네이밍되면 AppLocatorAssertions의 소비자가 사라진다.
→ C1 해소 시 C3은 자동 해소될 가능성이 높다.
```

**분류**: Pattern Tension — 그러나 C1에 종속적.

---

## Recommendations

1. **즉시 해소: C1** — God Object 내부 이름 청산. 이것이 Phase 3의 본질. `/discussion`으로 naming 결정 필요.
2. **즉시 해소: C2** — Arrange에서 dispatch 허용 여부를 결정해야 Phase 3 스코프가 확정됨. `/discussion`.
3. **관리하며 유지: C3** — C1 해소 시 `AppLocatorAssertions`의 유일한 소비자(`AppPage`)가 사라짐. 자연 소멸 가능. C1 이후 재평가.
