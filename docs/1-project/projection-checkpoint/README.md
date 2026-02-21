# Projection Checkpoint

## Summary

`createPage(Component)` API를 통해 headless 테스트에 `renderToString` 기반 투영 검증을 추가한다.
LLM이 브라우저 없이도 state-DOM 불일치를 감지하여 자가복구 루프를 완성할 수 있게 하는 가드레일.

## Motivation

### 문제
Headless 테스트는 커맨드 파이프라인과 state 정확성을 검증하지만, **투영 레이어(state → DOM)의 배선 버그**는 감지하지 못한다.

실제 발생한 버그: `createCompoundTrigger`에서 `Dialog.Content`를 래핑 → reference identity 깨짐 → `os.overlays.stack`은 정확하지만 `<dialog>` DOM이 미생성. State 검증만으로는 이 버그의 실패 신호가 발생하지 않아, LLM이 감지할 수 없었다.

### 핵심 통찰
- **LLM의 병목은 Detection이다.** 신호가 없으면 코드를 볼 이유가 없다.
- **실패 신호 = State와 DOM의 불일치.** 둘 다 알아야 불일치를 발견한다.
- **`renderToString`은 React를 브라우저 없이 1회 실행하는 최소 비용 경로다.**

### 출처
- Discussion: `discussions/2026-0221-2132-projection-detection.md`

## Guide-level explanation

### 기존 (headless only)
```typescript
const page = TodoApp.createPage();
page.keyboard.press("Backspace");
expect(page.state.ui.pendingDeleteIds).toContain(a);
// ← dialog 존재 여부는 알 수 없음
```

### 도입 후 (headless + projection)
```typescript
const page = TodoApp.createPage(ListView);
page.keyboard.press("Backspace");
expect(page.state.ui.pendingDeleteIds).toContain(a);   // state 가드레일
expect(page.query("dialog")).toBe(true);                 // 투영 가드레일
```

동일한 `page` 객체에서 keyboard, state, DOM query를 모두 수행.
Component를 넘기지 않으면 기존 headless와 동일하게 동작 (하위 호환).

## Reference-level explanation

### API
```typescript
interface AppPage<S> {
    // 기존
    keyboard: { press(key: string): void; ... };
    click(id: string): void;
    get state(): S;
    attrs(id: string): Record<string, any>;

    // NEW
    query(search: string): boolean;      // HTML에 search 문자열 포함 여부
    html(): string;                      // renderToString 전체 결과
}
```

### 내부 구현 방향
```typescript
function createAppPage<S>(appId, zoneBindings, Component?: React.FC) {
    // ... 기존 headless 로직 ...

    return {
        ...existingPage,
        query(search: string): boolean {
            if (!Component) throw new Error("Component 필요");
            const html = renderToString(createElement(Component));
            return html.includes(search);
        },
        html(): string {
            if (!Component) throw new Error("Component 필요");
            return renderToString(createElement(Component));
        },
    };
}
```

### 기술 전제
- `useSyncExternalStore`의 `getServerSnapshot` (3번째 인자)가 제공되어야 SSR에서 state를 읽을 수 있음 → 현재 코드에서 이미 제공 중
- `useEffect`/`useLayoutEffect`는 SSR에서 실행되지 않음 → 투영 존재 검증에는 영향 없음

## Drawbacks

- `renderToString` 결과는 HTML 문자열이라 CSS 셀렉터 사용 불가 (문자열 검색 또는 Cheerio 파싱 필요)
- 모든 테스트에 render를 넣으면 headless의 속도 이점이 줄어듦 (선택적 사용 권장)

## Unresolved questions

- Cheerio 같은 HTML 파서를 추가 의존성으로 도입할 것인가?
- `page.query()` 호출 시 매번 `renderToString`을 실행할 것인가, 캐싱할 것인가?
- 향후 CSS 셀렉터 기반 질의가 필요해지면 linkedom 등으로 업그레이드할 것인가?
