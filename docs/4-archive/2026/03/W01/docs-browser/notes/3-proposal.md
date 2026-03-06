# Docs Dashboard — Technical Proposal

## 개요

기존 docs 시스템에 세 가지 기능을 확장한다. 모든 변경은 기존 컴포넌트를 확장하는 방식이며, 새 의존성 없이 기존 인프라(`fuzzyMatch`, `import.meta.glob`, `DocsViewer`, `CommandPalette`)를 활용한다.

---

## Feature ① CommandPalette docs 검색

### 현재 구조
- `CommandPalette.tsx`: `useRouteList()` → 라우트만 검색
- `fuzzyMatch.ts`: fzf-inspired 퍼지 매칭 (이미 충분히 좋고 Fuse.js 불필요)
- `docsUtils.ts`: `import.meta.glob("../../docs/**/*.md")` → docs 파일 목록

### 변경 계획

#### [MODIFY] `useRouteList.ts`
- docs 파일 목록을 `docsModules` 키로부터 추출하여 **`RouteEntry[]`에 추가**
- docs 경로는 `/_minimal/docs/{relativePath}` 형태로 변환
- 라벨은 `cleanLabel()`로 포맷

또는 (더 깔끔한 접근):

#### [NEW] `useDocsList.ts`
- `docsModules`에서 파일 목록 추출
- `DocEntry` 인터페이스: `{ path, label, category }`
- category는 폴더명 기반 (inbox, project, discussions 등)

#### [MODIFY] `CommandPalette.tsx`
- `useDocsList()` 훅 도입
- 검색 결과를 **두 섹션으로 분리**: `Routes` / `Docs`
- docs 항목 선택 시 `navigate({ to: '/_minimal/docs' })` + 해당 문서 활성화

#### [MODIFY] 키바인딩 등록
- `Shift+Shift` 감지를 위한 더블 키 핸들러 (연속 Shift 300ms 이내)
- 기존 `Cmd+K`와 동일하게 CommandPalette 열기

### 리스크
- `Shift+Shift`는 표준 웹 이벤트가 아님 → 커스텀 타이머 로직 필요
- docs 파일이 많을 때 성능 → `fuzzyMatch`는 이미 효율적이므로 문제없을 것

---

## Feature ② 문서 페이지네이션 모드

### 현재 구조
- `DocsViewer.tsx`: 스크롤 기반, 파일 단위 prev/next 네비게이션
- `MarkdownRenderer.tsx`: `react-markdown` + remark/rehype 플러그인

### 변경 계획

#### [NEW] `usePagination.ts`
마크다운 문자열을 뷰포트 높이에 맞게 페이지로 분할하는 핵심 훅.

```typescript
interface Page {
  content: string;      // 해당 페이지의 마크다운 텍스트
  startLine: number;
  endLine: number;
}

function usePagination(
  markdown: string,
  viewportHeight: number
): {
  pages: Page[];
  currentPage: number;
  totalPages: number;
  goNext: () => void;
  goPrev: () => void;
}
```

**분할 알고리즘**:
1. 마크다운을 **블록 단위로 파싱** (split by `\n\n`, `---`, `# `)
2. 각 블록을 분류: heading, paragraph, code, table, list, hr, etc.
3. **height estimation**:
   - heading: 레벨별 고정 높이 (h1=60px, h2=48px, h3=40px, h4=36px)
   - paragraph: `Math.ceil(charCount / charsPerLine) * lineHeight`
   - code block: `lineCount * monoLineHeight + padding(40px)`
   - table: `(rowCount + 1) * rowHeight(40px) + border(2px)`
   - list item: `lineHeight * estimatedLines`
   - `---`: 32px (hr 높이 + margin)
4. **페이지 패킹**:
   - `---`와 `#`은 항상 새 페이지 시작 (hard break)
   - 블록을 순서대로 페이지에 추가
   - 누적 높이가 뷰포트 높이(- padding)를 초과하면 새 페이지
   - 테이블/코드 블록은 절대 분할하지 않음 (atomic)
   - 오차 허용: ±10% 정도는 OK

#### [MODIFY] `DocsViewer.tsx`
- `usePagination` 훅 도입
- 기존 스크롤 뷰를 페이지 뷰로 교체
  - 스크롤 컨테이너 대신 `overflow: hidden` + 현재 페이지만 렌더링
- ←/→ 키보드 이벤트 핸들러 추가
- 하단에 페이지 인디케이터: `3 / 7`
- 기존 prev/next (파일 간 이동)는 당 파일의 마지막 페이지에서 →를 누르면 다음 파일로

#### [MODIFY] `docs-viewer.css`
- 페이지 전환 애니메이션 (slide-in 등)

### 리스크
- height estimation 정확도 → 약간의 오차 허용이 전제이므로 OK
- 뷰포트 리사이즈 시 재계산 → `ResizeObserver`로 해결
- Mermaid 다이어그램 높이는 렌더링 전에 알 수 없음 → 고정값으로 추정

---

## Feature ③ HMR 기반 new-docs 알림

### 현재 구조
- `docsUtils.ts`: `import.meta.glob("../../docs/**/*.md")` (lazy 로더)
- Vite의 HMR: glob 패턴에 매칭되는 파일이 추가/변경되면 모듈이 HMR됨

### 변경 계획

#### [NEW] `useDocsNotification.ts`
```typescript
function useDocsNotification(): {
  hasNewDocs: boolean;
  newDocPaths: string[];
  clearNotification: () => void;
}
```

- 컴포넌트 마운트 시 현재 docs 파일 목록을 스냅샷으로 저장
- Vite HMR 이벤트 (`import.meta.hot`) 감지
- 새 파일이 스냅샷에 없으면 `hasNewDocs = true`
- `clearNotification()` 호출 시 스냅샷 갱신

#### [MODIFY] `GlobalNav.tsx`
- Docs 아이콘에 조건부 red dot 렌더링
- `useDocsNotification()` 훅 사용
- Docs 페이지 진입 시 `clearNotification()` 호출

---

## 구현 순서

1. **Feature ①** — CommandPalette docs 검색 (가장 독립적, 빠르게 완성 가능)
2. **Feature ③** — HMR 알림 (작은 범위, Feature ①과 독립적)
3. **Feature ②** — 페이지네이션 (가장 복잡, 나머지가 동작하는 상태에서 작업)

---

## Verification Plan

### 자동 테스트
- `npx tsc --noEmit` — 타입 체크 통과
- `npm run build` — 빌드 통과

### 수동 검증 (브라우저)
1. **Feature ①**: `Cmd+K` → docs 파일명 입력 → 매칭 결과 표시 → Enter → 문서 이동 확인
2. **Feature ①**: `Shift` 두 번 연속 타이핑 → CommandPalette 열림 확인
3. **Feature ②**: 긴 문서 열기 → ←/→ 키 → 페이지 전환 확인 → 인디케이터 확인
4. **Feature ②**: 테이블/코드 블록 포함 문서 → 페이지 경계에서 분할 안 되는지 확인
5. **Feature ③**: docs 폴더에 파일 추가 → GlobalNav red dot 확인 → Docs 방문 → red dot 소멸 확인
