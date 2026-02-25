# Audit: DocsViewer OS 계약 감사

> 감사일: 2026-02-25
> 대상: `src/docs-viewer/` (tests 제외)

## 위반 전수 열거 + 분류

### useState (15건)

| # | 파일:줄 | 코드 | 분류 | 사유 |
|---|---------|------|------|------|
| 1 | DocsViewer.tsx:155 | `useState<string>("")` (content) | 🟡 OS 갭 | 문서 콘텐츠 로딩 — OS에 비동기 콘텐츠 로딩 메커니즘 없음. `defineQuery` 후보 |
| 2 | DocsViewer.tsx:156 | `useState<string \| null>(null)` (error) | 🟡 OS 갭 | 에러 상태 — defineQuery와 묶여야 함 |
| 3 | DocsViewer.tsx:158 | `useState<ExternalFolderSource \| null>` | ⚪ 예외 | File System Access API — 브라우저 전용 |
| 4 | DocsViewer.tsx:159 | `useState(0)` (favVersion) | 🔴 실수 | localStorage 동기화를 위한 hack. OS 상태로 관리 가능 |
| 5 | DocsViewer.tsx:66 | `useState("")` (InlineDocContent md) | 🟡 OS 갭 | 비동기 콘텐츠 — defineQuery 후보 |
| 6 | DocsSidebar.tsx:40 | `useState(true)` (isOpen) | 🔴 실수 | 섹션 열기/닫기 — OS expanded 상태로 관리 가능 |
| 7 | DocsSidebar.tsx:268 | `useState(0)` (favVersion) | 🔴 실수 | #4와 동일 hack |
| 8 | MermaidBlock.tsx:13 | `useState<string \| null>` (error) | ⚪ 예외 | Mermaid 라이브러리 통합 |
| 9 | useDocsNotification.ts:19 | `useState(false)` (hasNewDocs) | ⚪ 예외 | HMR dev-only 기능 |
| 10 | useDocsNotification.ts:20 | `useState<string[]>` (newDocPaths) | ⚪ 예외 | HMR dev-only 기능 |
| 11 | TableOfContents.tsx:13 | `useState<string \| null>` (activeSlug) | 🟡 OS 갭 | 스크롤 위치 추적 — OS IntersectionObserver 메커니즘 없음 |

### useEffect (10건)

| # | 파일:줄 | 목적 | 분류 | 사유 |
|---|---------|------|------|------|
| 12 | DocsViewer.tsx:167 | Section nav subscribe | 🔴 실수 | os.subscribe()로 커맨드 감시 → 스크롤. Zone 마운트로 대체 가능 |
| 13 | DocsViewer.tsx:270 | activePath → content load | 🟡 OS 갭 | defineQuery 후보 |
| 14 | DocsViewer.tsx:295 | popstate listener | ⚪ 예외 | 브라우저 히스토리 API — OS가 대체 불가 |
| 15 | DocsViewer.tsx:311 | Auto-select first file | 🔴 실수 | 초기 상태 로직 — app.ts의 getInitialPath에서 처리 가능 |
| 16 | DocsViewer.tsx:67 | InlineDocContent load | 🟡 OS 갭 | defineQuery 후보 |
| 17 | MermaidBlock.tsx:15 | Mermaid render | ⚪ 예외 | 외부 라이브러리 비동기 렌더링 |
| 18 | useDocsNotification.ts:23 | HMR watcher | ⚪ 예외 | dev-only |
| 19 | TableOfContents.tsx:17 | IntersectionObserver | 🟡 OS 갭 | 스크롤 관찰 API |

### onClick (17건)

| # | 파일:줄 | 목적 | 분류 | 사유 |
|---|---------|------|------|------|
| 20 | DocsSidebar.tsx:52 | Recent 섹션 토글 | 🔴 실수 | OS expand로 대체 |
| 21 | DocsDashboard.tsx:113,123,152,164,217 | 파일/폴더 선택 | 🔴 실수 | Dashboard에 OS Zone 없음. Zone+Item 패턴으로 대체 |
| 22 | DocsViewer.tsx:110 | FolderIndex 파일 선택 | 🔴 실수 | Zone+Item 패턴으로 대체 |
| 23 | DocsViewer.tsx:358,367 | 폴더 열기/닫기 | ⚪ 예외 | File System Access API 버튼 |
| 24 | DocsViewer.tsx:405 | Return to Home | 🔴 실수 | OS command로 대체 |
| 25 | DocsViewer.tsx:449 | Favorite toggle | 🔴 실수 | OS command로 대체 |
| 26 | DocsViewer.tsx:492,510 | Prev/Next nav | 🔴 실수 | OS command로 대체 |
| 27 | TableOfContents.tsx:86,111 | TOC heading click | 🟡 OS 갭 | TOC 스크롤 연동 — anchorLink OS 메커니즘 없음 |

### document.querySelector / getElementById (11건)

| # | 파일:줄 | 목적 | 분류 | 사유 |
|---|---------|------|------|------|
| 28 | main.tsx:11 | createRoot | ⚪ 예외 | React 엔트리포인트 — 필수 |
| 29 | MermaidBlock.tsx:39 | Mermaid ghost cleanup | ⚪ 예외 | 외부 라이브러리 정리 |
| 30 | DocsViewer.tsx:173 | h1~h6 querySelectorAll | 🔴 실수 | Zone 마운트 후 OS inject 사용 가능 |
| 31 | register.ts:28,34,61,106,126,135,136 | DOM 직접 접근 7건 | 🔴 실수 | DOCS_SCROLL_PAGE 전체가 DOM 직접 접근. OS 방식으로 대체 |
| 32 | TableOfContents.tsx:23,59 | heading element 접근 | 🟡 OS 갭 | 스크롤 대상 요소 참조 |

### addEventListener (1건)

| # | 파일:줄 | 목적 | 분류 | 사유 |
|---|---------|------|------|------|
| 33 | DocsViewer.tsx:306 | popstate | ⚪ 예외 | 브라우저 히스토리 API |

---

## 집계

```
총 위반: 33건 (중복 그룹화 후)
  🔴 LLM 실수: 14건
    - DocsSidebar useState hack (isOpen, favVersion): 3건
    - DocsViewer subscribe/auto-select: 2건
    - onClick 직접 핸들링: 7건 (Dashboard 5 + Viewer 2)
    - register.ts DOM 직접 접근: 7건 → 1그룹
    - DocsViewer querySelectorAll: 1건
  🟡 OS 갭: 8건
    - 비동기 콘텐츠 로딩 (defineQuery): 4건
    - IntersectionObserver (TOC): 2건
    - TOC anchor scroll: 1건
    - register.ts → Zone 마운트: 1건
  ⚪ 정당한 예외: 11건
    - 외부 라이브러리 (Mermaid): 2건
    - 브라우저 API (popstate, FSAPI, createRoot): 4건
    - HMR dev-only: 2건
    - FSAPI 버튼: 2건
    - undefined: 1건
```
