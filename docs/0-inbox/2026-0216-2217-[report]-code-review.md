# Code Review Report

> **Scope**: `git diff --name-only HEAD~5` (19 files)
> **Date**: 2026-02-16 22:17
> **Mode**: 보고서 (정식 리뷰)

---

## 대상 파일

### Kernel (`packages/kernel/`)
- `src/core/inspectorPort.ts`
- `src/core/tokens.ts`
- `src/createInspector.ts`
- `src/createKernel.ts`
- `src/index.ts`
- `README.md`

### Docs Viewer (`src/docs-viewer/`)
- `DocsViewer.tsx`
- `DocsSidebar.tsx`
- `docsUtils.ts`
- `fsAccessUtils.ts`

### 문서
- `docs/STATUS.md`
- `.agent/rules.md`
- `.agent/workflows/*` (7개 워크플로우 파일)

---

## 수렴 루프 — 1회차

### 철학 준수 검사

| # | 항목 | 결과 |
|---|------|------|
| 1 | 커맨드 원칙: 인터랙션 prop이 BaseCommand 브랜드 타입인가? | ✅ 해당 파일 범위에 인터랙션 prop 없음 |
| 2 | 커널 상태 원칙: 커널 state 대신 로컬 state를 쓴 곳? | 🔵 아래 DV-1 참조 |
| 3 | 표준 인터페이스 원칙 | ✅ |
| 4 | 100% Type-Strict: `as any` 우회 | 🟡 아래 K-1, DV-2 참조 |
| 5 | 100% Declarative | ✅ |
| 6 | 로깅 원칙: `console.log` 대신 `logger` | 🟡 아래 DV-3 참조 |

### 코드 품질 검사

| # | 항목 | 결과 |
|---|------|------|
| 1 | 복붙 코드 | 🟡 아래 DV-4 참조 |
| 2 | 레거시 패턴 답습 | ✅ |
| 3 | 불필요한 추상화/과잉 설계 | ✅ |
| 4 | Clear 해법 미루기 | ✅ |

### 성능 패턴 검사

| # | 항목 | 결과 |
|---|------|------|
| 1 | `useComputed` selector 원시값 반환 | ✅ 해당 파일 범위에 useComputed 사용 없음 (kernel 자체 정의만) |
| 2 | 반복 렌더 컴포넌트 불필요 구독 | ✅ |

### 네이밍/구조 검사

| # | 항목 | 결과 |
|---|------|------|
| 1 | 파일명 번호 prefix 컨벤션 | ✅ |
| 2 | 컴포넌트명 PascalCase | ✅ |
| 3 | 커맨드명 UPPER_SNAKE_CASE | ✅ (해당 범위 없음) |
| 4 | import 경로 alias, 상대 깊이 ≤ 3 | ✅ |

---

## 발견 항목

### K-1 · `tokens.ts:109,112` — InternalCommandHandler/InternalEffectHandler의 `any`

```typescript
export type InternalCommandHandler = (ctx: any) => (payload?: any) => any;
export type InternalEffectHandler = (value: any) => void;
```

- **심각도**: 🟡 네이밍/구조
- **의도**: `[Thought]`
- **분석**: 이들은 `@internal`로 표시된 타입이며, 커널 내부 레지스트리(scopedCommands, scopedEffects)가 **이종 핸들러를 동일 Map에 저장**하기 위해 타입 소거가 불가피한 경계이다. 외부에는 `CommandFactory<T,P>`와 `EffectToken<T,V>`가 보장하는 브랜드 타입이 있고, 이 `any`는 Map의 value 타입으로만 소비된다. existential type이 없는 TypeScript에서 이종 핸들러 레지스트리의 사실상 유일한 해법이다.
- **판정**: 현재 수정 불요. 만약 개선한다면 `unknown` + 타입 가드 패턴으로 전환 가능하나, 호출부에서 `as` 캐스트가 이동할 뿐 순 이득이 적다.

### K-2 · `createKernel.ts:475` — `CommandFactory<string, any>` 반환 타입

```typescript
): CommandFactory<string, any> => {
```

- **심각도**: 🟡 네이밍/구조
- **의도**: `[Thought]`
- **분석**: `defineCommand` 내부 구현의 반환 타입이 `CommandFactory<string, any>`이다. 이는 **overload 시그니처(`<T, P>`)가 외부에 정확한 타입을 제공**하고, 구현부는 모든 overload를 통합하는 "loosest" 시그니처이므로 TypeScript 관례에 부합한다. `as unknown as` 캐스트(L541, 543, 544, 546)도 이 패턴의 일환이다.
- **판정**: ✅ 수용 가능 — overload implementation signature의 표준 관례.

### K-3 · `createKernel.ts:241` — `bubblePath as unknown as string[]`

```typescript
const path: string[] = bubblePath
  ? (bubblePath as unknown as string[])
  : [GLOBAL as string];
```

- **심각도**: 🟡 네이밍/구조
- **의도**: `[Nitpick]`
- **분석**: `ScopeToken[]`은 `string[]`의 branded subtype이므로, `ScopeToken[] → string[]`은 widening이다. `as unknown as` 대신 직접 `as string[]`로도 가능하지만, branded type의 명시적 unwrap이라는 점에서 의도가 명확하다.
- **판정**: 선택적 개선. `as string[]`면 1단계 캐스트로 충분하지만, 현재도 문제는 없다.

---

### DV-1 · `DocsViewer.tsx` — useState/useEffect 사용

```typescript
const [activePath, setActivePath] = useState<string | undefined>(undefined);
const [content, setContent] = useState<string>("");
const [error, setError] = useState<string | null>(null);
const [externalSource, setExternalSource] = useState<ExternalFolderSource | null>(null);
// + 3개 useEffect
```

- **심각도**: 🔵 개선 제안
- **의도**: `[Thought]`
- **분석**: DocsViewer는 **독립된 Vite 문서 앱**(`vite.docs.config.ts`)이며 OS 커널 위에서 구동되지 않는다. 커널 연동 앱(Todo, Builder 등)과 달리, 문서 뷰어는 OS 밖의 유틸리티이므로 `useState/useEffect` 직접 사용이 적절하다. "커널 state 원칙"의 적용 범위 밖이다.
- **판정**: ✅ 현재 구조가 올바름 — OS 바깥 앱이므로 커널 원칙 비적용.

### DV-2 · `fsAccessUtils.ts:58` — `(window as any).showDirectoryPicker`

```typescript
const dirHandle = await (window as any).showDirectoryPicker({ mode: "read" });
```

- **심각도**: 🟡 네이밍/구조
- **의도**: `[Suggest]`
- **분석**: File System Access API는 아직 TypeScript 기본 lib에 포함되지 않았다. `biome-ignore lint/suspicious/noExplicitAny` 주석은 이미 있으나, `as any` 대신 `declare global` 선언으로 타입 안전성을 높일 수 있다.
- **제안 수정**:
  ```typescript
  // 파일 상단에 선언 추가
  declare global {
    interface Window {
      showDirectoryPicker?(options?: { mode?: string }): Promise<FileSystemDirectoryHandle>;
    }
  }
  // 사용부
  const dirHandle = await window.showDirectoryPicker!({ mode: "read" });
  ```
- **판정**: 기능적 문제 없음. 타입 강화 기회.

### DV-3 · `DocsViewer.tsx:98` — `console.error` 사용

```typescript
console.error(err);
```

- **심각도**: 🔵 개선 제안
- **의도**: `[Nitpick]`
- **분석**: docs-viewer는 OS 커널 밖의 독립 앱이므로 `logger` 인프라가 존재하지 않는다. OS 앱이라면 🔴지만, 문서 뷰어에서는 `console.error`가 가용한 유일한 수단이다.
- **판정**: ✅ 수용 가능 — OS 밖 앱.

### DV-4 · `fsAccessUtils.ts:91-98` — `flattenTreeLocal` 중복

```typescript
function flattenTreeLocal(items: DocItem[]): DocItem[] {
  let flat: DocItem[] = [];
  for (const item of items) {
    if (item.type === "file") flat.push(item);
    if (item.children) flat = flat.concat(flattenTreeLocal(item.children));
  }
  return flat;
}
```

- **심각도**: 🟡 네이밍/구조
- **의도**: `[Suggest]`
- **분석**: `docsUtils.ts`의 `flattenTree`와 **완전 동일한 로직**이다. 주석에 "circular dependency concerns"라고 적혀 있으나, `fsAccessUtils.ts`는 이미 `import { buildDocTree, type DocItem } from "./docsUtils"`로 docsUtils에 의존한다. circular dependency는 발생하지 않으므로 `flattenTree`를 직접 import하면 중복을 제거할 수 있다.
- **제안 수정**: `flattenTreeLocal` 삭제, `import { buildDocTree, flattenTree, type DocItem } from "./docsUtils"` 사용.
- **판정**: 🟡 코드 중복. 원칙 5 "모든 산출물은 부채다" — 같은 로직의 두 번째 복사본은 유지 비용 증가.

---

### DOC-1 · `README.md:40` — `console.log` in Quick Start example

```typescript
console.log(kernel.getState()); // { count: 1 }
```

- **심각도**: 🔵 개선 제안
- **의도**: `[Nitpick]`
- **분석**: README 예제에서의 `console.log`는 교육 목적이므로 별도 `logger` 도입은 과잉이다. 다만, 프로젝트 원칙 "로깅 원칙"과의 표면적 불일치가 있다. 독자가 예제를 그대로 복사할 경우를 고려하면, 주석으로 "production에서는 logger 사용"을 안내할 수 있다.
- **판정**: ✅ 수용 가능 — 문서 예제의 관례.

---

## 수렴 루프 — 2회차

재검토 결과 **새 발견 0건**. 루프 종료.

---

## 요약

| 심각도 | 건수 | 항목 |
|--------|------|------|
| 🔴 철학 위반 | 0 | — |
| 🟡 네이밍/구조 | 4 | K-1, K-3, DV-2, DV-4 |
| 🔵 개선 제안 | 3 | DV-1, DV-3, DOC-1 |

### 실행 가능한 수정 (우선순위)

1. **DV-4** `[Suggest]` — `flattenTreeLocal` 중복 제거 → `flattenTree` import로 교체
2. **DV-2** `[Suggest]` — `window as any` → `declare global` 타입 선언으로 교체

나머지는 현재 상태에서 수용 가능하며, 즉시 수정 필요 없음.

---

> ✅ **🔴 항목 0건** — 즉시 수정 필요 항목 없음.
> 🟡/🔵 항목 중 DV-4, DV-2는 선택적으로 수정 가능.
