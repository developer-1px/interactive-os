# Docs Dashboard — PRD

## 배경

현재 interactive-os의 docs 시스템은 PARA 구조(`0-inbox`, `1-project`, `11-discussions` 등)로 잘 분류되어 있고, `DocsViewer` 앱을 통해 사이드바 + 마크다운 렌더링으로 소비되고 있다. 에이전트(AI)가 일상적으로 discussion, daily, TIL, inbox 등의 문서를 생성하며, 사용자는 이를 수시로 확인한다.

문서 수가 늘어남에 따라, **읽기 속도**, **검색성**, **변화 감지**에 대한 개선 니즈가 발생했다.

## 목표

기존 docs 시스템을 파괴하지 않고, 세 가지 기능을 **자연스럽게 확장**한다.

## 범위

### In-Scope

1. **CommandPalette docs 검색**
   - CommandPalette에 docs 파일 목록을 추가
   - 기존 `fuzzyMatch` 알고리즘으로 퍼지 검색
   - `Cmd+K` (기존) + `Shift+Shift` (신규) 단축키
   - 선택 시 해당 문서로 이동 (`/_minimal/docs/{path}`)

2. **문서 페이지네이션 모드**
   - `DocsViewer`에서 마크다운 콘텐츠를 페이지 단위로 분할
   - ←/→ 키보드로 페이지 네비게이션
   - 분할 기준: `---`와 `#` 헤딩이 hard break
   - 테이블, 코드 블록은 atomic unit (중간에 안 자름)
   - 뷰포트 높이에 맞게 동적 분할 (height estimation)
   - 현재 페이지 / 전체 페이지 인디케이터

3. **HMR 기반 new-docs 알림**
   - `import.meta.glob`의 HMR로 docs 파일 변경 감지
   - 이전 파일 목록과 diff → 새 파일 발견
   - GlobalNav의 Docs 아이콘에 red dot 표시
   - 해당 문서를 열면 red dot 해제

### Out-of-Scope
- 문서 편집 기능
- 전문 검색 (full-text search) — 파일명/경로 기반 fuzzy만
- 문서 간 관계 시각화
- 외부 서비스 연동 (Notion, Obsidian 등)

## 사용자 시나리오

### 시나리오 1: 문서 검색
1. 사용자가 `Cmd+K` 또는 `Shift+Shift`를 누른다
2. CommandPalette가 열리고, 기존 라우트 + docs 파일 목록이 합산된다
3. "discussion archiving" 입력 → 관련 문서가 퍼지 매칭으로 표시
4. Enter → 해당 문서 페이지로 이동

### 시나리오 2: 페이지 단위 읽기
1. 사용자가 긴 discussion 문서를 연다
2. 콘텐츠가 뷰포트 높이에 맞게 여러 페이지로 분할됨
3. →키로 다음 페이지, ←키로 이전 페이지
4. 하단에 "3 / 7" 같은 페이지 인디케이터 표시

### 시나리오 3: 새 문서 알림
1. 에이전트가 다른 대화에서 새 discussion 문서를 생성
2. Vite HMR이 파일 변경을 감지
3. GlobalNav의 Docs 아이콘에 빨간 점 표시
4. 사용자가 Docs를 열면 → 빨간 점 해제

## 기술 제약

- **기존 인프라 활용**: `CommandPalette`, `DocsViewer`, `fuzzyMatch`, `MarkdownRenderer`, `import.meta.glob`
- **라이브러리 최소화**: Fuse.js 등 새 의존성 없이 기존 `fuzzyMatch` 사용
- **반응형**: 뷰포트 리사이즈 시 페이지네이션 재계산
