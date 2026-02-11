# ⌘K Command Palette — 구현 회고록

> **Date**: 2026-02-11  
> **Author**: AI + Human pair programming  
> **Status**: ✅ Shipped (build pass, smoke tests pass)

---

## 1. 개요 (Overview)

Spotlight 스타일의 Command Palette (⌘K)를 OS 컴포넌트 스택 위에 구현했다. 기존 OS의 Dialog, Zone, Item, Kbd, Keybinding 시스템을 **독푸딩(dogfooding)** 하면서, 실제 프로덕트 레벨의 UX 컴포넌트를 만들어본 첫 사례다.

### 목표
- ⌘K로 열고and닫기
- Fuzzy search로 라우트 필터링
- ↑↓ 키보드 탐색 → Enter 이동
- OS 커널의 Dialog/Overlay 시스템 위에 구축
- Light Premium Minimal Pro Tool UI

### 파일 구조 (4개 신규 파일)

```
src/command-palette/
├── CommandPalette.tsx   — 메인 UI 컴포넌트 (Tailwind CSS)
├── fuzzyMatch.ts        — 경량 subsequence 매칭 + 스코어링
├── useRouteList.ts      — TanStack Router route tree → flat list
└── register.ts          — ⌘K 키바인딩 + TOGGLE 커맨드 등록
```

---

## 2. 핵심 설계 결정과 회고

### 2.1 OS 컴포넌트 독푸딩: 성공과 한계

**성공한 점:**
- `OS.Dialog` → `OS.Dialog.Content` → `OS.Zone` → `OS.Item` 구조가 자연스럽게 중첩됨
- `kernel.dispatch(OVERLAY_OPEN/CLOSE)` 로 오버레이 라이프사이클 관리가 깔끔
- `OS.Kbd` 재사용으로 키보드 힌트 렌더링이 일관적

**발견된 문제 (버그 수정 포함):**

#### 🔴 Nested `<button>` Hydration Error
```
<button> cannot be a descendant of <button>
```

`DialogRoot`가 `<Trigger role="dialog">`를 감싸고, `Trigger` 기본 렌더가 `<button>`이었음.
사용자가 `Dialog.Trigger` 안에 `<button>`을 넣으면 `button > span > button` 구조가 됨.

→ **수정**: `Trigger`에 `overlayId` prop 추가, `Dialog`에 `id` prop 전달 경로 확보.

#### 🔴 `exactOptionalPropertyTypes` 빌드 오류
```
Type 'string | undefined' is not assignable to type 'string'
```

`tsconfig`에 `exactOptionalPropertyTypes: true`가 켜져 있어서, optional prop에 `undefined`를 명시적으로 허용해야 했음.

→ **수정**: `overlayId?: string | undefined`, `zoneClassName?: string | undefined`

### 2.2 CSS → Tailwind 마이그레이션

처음에는 별도 `commandpalette.css` 파일로 스타일링했으나, 사용자 요청으로 **순수 Tailwind CSS**로 전환.

**교훈:**
- `<dialog>` 요소는 브라우저 기본 스타일(`margin: auto`, `max-width`, `max-height`)이 강하다
- Tailwind로 완전히 덮으려면 `w-screen h-screen max-w-none max-h-none m-0`이 필요
- `::backdrop` 슈도 엘리먼트는 Tailwind로 제어 불가 → `index.css`의 `os-modal::backdrop` 스타일과 공존

### 2.3 성능 문제: 두 가지 원인

#### 원인 1: `fuzzyMatch` 이중 호출 (코드 버그)

```tsx
// Before: useMemo에서 한 번, JSX 렌더에서 또 한 번
const match = fuzzyMatch(query, r.path) ?? fuzzyMatch(query, r.label);
// ...later in JSX...
fuzzyMatch(query, route.label)?.matchedIndices ?? []  // 💥 또 호출!
```

`??` 연산자 때문에 path가 먼저 매치되면 label 결과는 저장 안 됨 → JSX에서 label 하이라이팅을 위해 재계산 필수.

→ **수정**: `pathMatch`와 `labelMatch`를 분리 저장, JSX에서 캐시된 결과만 참조.

```tsx
// After: 두 매치 모두 useMemo에서 계산 + 캐싱
interface MatchedRoute extends RouteEntry {
  pathMatch: FuzzyMatchResult;
  labelMatch: FuzzyMatchResult;  // ← 분리 저장
}
```

#### 원인 2: 커널 `console.log` (진짜 병목)

`stack.ts`의 `STACK_PUSH`/`STACK_POP`에 하드코딩된 `console.log`가 있었음.
Command Palette에서 ↑↓ 탐색할 때마다 이 커맨드가 발생하고, 매번 **객체를 직렬화 → DevTools 렌더링** → 프레임 드랍.

```ts
// Before: 매 포커스 변경마다 실행
console.log("[STACK_PUSH] Pushing:", { currentZoneId, currentItemId, ... });
console.log("[STACK_POP] Stack Depth Before Pop:", stack.length);
console.log("[STACK_POP] Restoring Entry:", entry);
```

→ **수정**: `logger.debug("FOCUS", ...)` 로 교체. `isLayerEnabled("FOCUS")` 체크가 먼저 실행되어, 비활성 시 직렬화 비용 = 0.

> **핵심 교훈**: `console.log`는 "무료"가 아니다. 특히 객체를 인자로 넘기면 직렬화가 발생하고, DevTools가 열려있으면 렌더링 비용까지 추가된다. 고빈도 경로(hot path)에서는 반드시 게이트(guard)를 두어야 한다.

### 2.4 디자인 이터레이션 과정

| 이터레이션 | 변경 사항 |
|---|---|
| v1 | 별도 CSS 파일, 상단 14vh 오프셋 |
| v2 | 정중앙 배치 (`align-items: center`) |
| v3 | blur 제거 (성능), 가로 640px |
| v4 | Tailwind CSS 전면 전환, CSS 파일 삭제 |
| v5 | Enter 키 힌트 opacity toggle (Layout Shift 방지) |

**Layout Shift 방지** 패턴은 특히 기억할 만하다:

```tsx
// ❌ Bad: 조건부 렌더링 → DOM 추가/제거 → 레이아웃 밀림
{isFocused && <Kbd shortcut="Enter" />}

// ✅ Good: 항상 렌더링 + opacity 토글 → 공간 확보, 시각적 변동 최소화
<div className={isFocused ? "opacity-100" : "opacity-0"}>
  <Kbd shortcut="Enter" />
</div>
```

---

## 3. 실제 코드

### 3.1 fuzzyMatch.ts — 경량 Fuzzy Matching

```ts
export interface FuzzyMatchResult {
  score: number;
  matchedIndices: number[];
}

export function fuzzyMatch(
  query: string,
  target: string,
): FuzzyMatchResult | null {
  if (!query) return { score: 0, matchedIndices: [] };

  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  const matchedIndices: number[] = [];

  let queryIdx = 0;
  let score = 0;
  let lastMatchIdx = -1;

  for (let i = 0; i < targetLower.length && queryIdx < queryLower.length; i++) {
    if (targetLower[i] === queryLower[queryIdx]) {
      matchedIndices.push(i);

      // Consecutive match bonus
      if (lastMatchIdx === i - 1) score += 5;

      // Word boundary bonus (start of string or after separator)
      if (i === 0 || "/- _.".includes(target[i - 1] ?? "")) score += 10;

      // Exact case match bonus
      if (target[i] === query[queryIdx]) score += 1;

      score += 1; // base match score
      lastMatchIdx = i;
      queryIdx++;
    }
  }

  if (queryIdx !== queryLower.length) return null;

  // Shorter targets rank higher (more specific match)
  score -= target.length * 0.1;

  return { score, matchedIndices };
}
```

**스코어링 전략:**
- **연속 매치**: +5 (e.g. "play" in "playground" → 연속 4글자 = +15)
- **단어 경계**: +10 (e.g. `/playground` → `/` 뒤의 `p`)
- **대소문자 정확 매치**: +1
- **길이 페널티**: -0.1 × target.length (짧은 경로 우선)

### 3.2 useRouteList.ts — Router Tree Traversal

```ts
export function useRouteList(): RouteEntry[] {
  const router = useRouter();

  return useMemo(() => {
    const entries: RouteEntry[] = [];

    function traverse(route: any) {
      const fullPath: string | undefined = route.fullPath;

      if (fullPath && !fullPath.includes("$")) {
        const isLayout = fullPath === "/" && route.id?.startsWith("/_");
        if (!isLayout) {
          if (!entries.some((e) => e.path === fullPath)) {
            entries.push({ path: fullPath, label: formatLabel(fullPath) });
          }
        }
      }

      const children = route.children;
      if (children) {
        for (const child of Object.values(children)) {
          traverse(child as any);
        }
      }
    }

    traverse(router.routeTree as any);
    entries.sort((a, b) => a.path.localeCompare(b.path));
    return entries;
  }, [router]);
}

function formatLabel(path: string): string {
  if (path === "/") return "Home";
  return path
    .split("/")
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "))
    .join(" / ");
}
```

**설계 포인트:**
- `router.routeTree`를 재귀 순회하여 **leaf route만 추출**
- `$`를 포함하는 동적 라우트 제외
- Layout route (id가 `/_`로 시작) 제외
- `useMemo(() => ..., [router])` — router 인스턴스가 바뀌지 않으면 재계산 안 함

### 3.3 register.ts — Keybinding + Toggle Command

```ts
export const TOGGLE_COMMAND_PALETTE = kernel.defineCommand(
  "TOGGLE_COMMAND_PALETTE",
  (ctx) => () => {
    const isOpen = ctx.state.os.overlays.stack.some(
      (e) => e.id === "command-palette",
    );

    if (isOpen) {
      return { dispatch: OVERLAY_CLOSE({ id: "command-palette" }) };
    }
    return {
      dispatch: OVERLAY_OPEN({ id: "command-palette", type: "dialog" }),
    };
  },
);

Keybindings.register({
  key: "Meta+K",
  command: TOGGLE_COMMAND_PALETTE,
});
```

**패턴: Side-effect import**
```ts
// __root.tsx에서 이렇게 import만 하면 자동 등록
import "@/command-palette/register";
```

### 3.4 CommandPalette.tsx — 메인 컴포넌트 (핵심 발췌)

```tsx
export function CommandPalette() {
  const isOpen = kernel.useComputed((s) =>
    s.os.overlays.stack.some((e) => e.id === "command-palette"),
  );

  const filteredRoutes = useMemo<MatchedRoute[]>(() => {
    const empty = { score: 0, matchedIndices: [] };
    if (!query.trim()) return routes.map((r) => ({ ...r, pathMatch: empty, labelMatch: empty }));
    return routes
      .map((r) => {
        const pathMatch = fuzzyMatch(query, r.path);
        const labelMatch = fuzzyMatch(query, r.label);
        if (!pathMatch && !labelMatch) return null;
        return { ...r, pathMatch: pathMatch ?? empty, labelMatch: labelMatch ?? empty };
      })
      .filter(Boolean)
      .sort((a, b) => Math.max(b.pathMatch.score, b.labelMatch.score) - Math.max(a.pathMatch.score, a.labelMatch.score));
  }, [query, routes]);

  if (!isOpen) return null;

  return (
    <OS.Dialog id="command-palette">
      <OS.Dialog.Content className="..." zoneClassName="...">
        {/* Search → Zone → Item 구조 */}
      </OS.Dialog.Content>
    </OS.Dialog>
  );
}
```

---

## 4. 발견된 OS 프레임워크 개선점

| 이슈 | 설명 | 해결 여부 |
|---|---|---|
| Nested `<button>` | `Trigger` 기본 렌더가 `<button>`, Dialog 안에 `<button>` 넣으면 hydration error | ⚠️ `overlayId` prop 추가로 우회. 근본 해결은 `asChild` 패턴 적용 필요 |
| Dialog `id` prop 부재 | 프로그래밍적 open/close 불가 | ✅ `Dialog`에 `id` → `Trigger.overlayId` 전달 경로 추가 |
| `<dialog>` 브라우저 기본 스타일 | Tailwind로 완전히 덮으려면 `m-0 max-w-none max-h-none` 필수 | ✅ 문서화 |
| `exactOptionalPropertyTypes` | `?: string`에 `undefined` 전달 시 TS 에러 | ✅ `?: string \| undefined` 로 수정 |
| Hot path `console.log` | `STACK_PUSH/POP`에 guard 없는 로그 → 프레임 드랍 | ✅ `logger.debug` 교체 |

---

## 5. 결론

### 잘한 점
- OS 컴포넌트 스택을 실전 UX에 적용하여 **API 설계의 빈틈을 발견**
- `Dialog.id` → `Trigger.overlayId` 전달 경로 확보 → 프로그래밍적 오버레이 제어 가능
- 성능 병목 2가지를 발견하고 수정 (fuzzyMatch 이중 호출 + console.log hot path)

### 개선 필요
- `Trigger`의 기본 렌더 요소를 `<button>` 대신 `<div>` 또는 `asChild` 패턴으로 변경 검토
- `OS.Dialog.Content`의 `className`이 `<dialog>` 요소에 직접 적용되는 구조 → overlay wrapper vs content 분리 필요
- Fuzzy match 알고리즘 고도화 (fzy, fzf 수준의 정교한 스코어링)

### 다음 단계
1. Command Palette에 **라우트 외 커맨드** (e.g. Theme 전환, Inspector 토글) 추가
2. `Trigger` 컴포넌트의 `asChild` 패턴 적용 → nested `<button>` 근본 해결
3. 글로벌 커맨드 레지스트리 설계 → 플러그인 방식으로 커맨드 등록
