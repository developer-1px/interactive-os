# docs-viewer-headless

## Context

Claim: DocsViewer를 headless test로 검증할 수 있어야 한다. 현재 `virtual:docs-meta`(Vite 가상 모듈)와 `import.meta.glob`(Vite glob import) 의존으로 vitest에서 import 불가.

Before → After:
- **Before**: DocsViewer는 headless test 불가. `virtual:docs-meta`와 `import.meta.glob`이 vitest에서 resolve 안 됨. fixture app으로 메커니즘만 검증
- **After**: `vi.mock`으로 Vite 전용 모듈을 mock → `createHeadlessPage(DocsApp, DocsViewer)` → 실제 DocsViewer의 Tab/ArrowKey/docs-reader projection 검증 가능

Backing:
- projection-items 프로젝트에서 projection 인프라 완성 (`parseProjectionItems`, `syncProjectionToRegistry`)
- `require-component` archive의 Unresolved: "DocsViewer를 테스트에서 사용하려면 virtual:docs-meta mock 필요"

Evidence:
- `src/docs-viewer/DocsViewer.tsx:2` — `import docsMeta from "virtual:docs-meta"`
- `src/docs-viewer/DocsSidebar.tsx:1` — same import
- `src/docs-viewer/docsUtils.ts:198` — `import.meta.glob("../../docs/**/*.md")`
- `src/docs-viewer/DocsViewer.tsx:24` — `import "./app"` (side-effect: zone/command registration)

Risks:
- CSS import (`./docs-viewer.css`) vitest에서 에러 가능 — vitest css config 또는 mock으로 해결
- lucide-react 등 UI 라이브러리 SSR 호환성 미확인
- DocsViewer 내부 useEffect (async content load 등) SSR에서 무시됨 — projection은 초기 렌더만 캡처

## Now
- [ ] T1: `virtual:docs-meta` + `docsModules` vi.mock → DocsViewer import 가능 — 크기: S, 의존: —
- [ ] T2: DocsViewer headless Tab cycle + projection items 테스트 — 크기: M, 의존: →T1

## Done

## Unresolved
- DocsViewer 내부 `loadDocContent`가 async glob loader — renderToString에서 content가 빈 문자열일 수 있음. 초기 상태에서 어떤 items가 렌더되는지 확인 필요

## Ideas
- mock 패턴을 다른 Vite 전용 앱에도 재사용할 수 있는 vitest setup 유틸로 추출
- DocsSidebar의 tree navigation (expand/collapse) headless 검증
