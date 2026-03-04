# Spec — Media Library (미디어 자산 관리)

> Feature 7 of builder-v3. 이미지가 흩어져 있으면 운영이 안 된다.
> 한 곳에서 올리고, 어디서든 꺼내 쓴다.

## 1. 개요

현재 이미지 필드는 URL 문자열을 직접 입력한다. 운영자에게는 불가능한 UX.
Media Library는 **이미지를 업로드하고, 중앙에서 관리하고, 필드에 삽입**하는 자산 관리 시스템.

```
이미지 필드 클릭 → Media Library 열림 → 기존 이미지 선택 or 새로 업로드 → 필드에 삽입
```

## 2. 핵심 개념

| 개념 | 설명 |
|------|------|
| **Asset** | 업로드된 파일 (이미지, 아이콘 SVG 등) |
| **Collection** | 폴더 또는 태그 기반 분류 |
| **Reference** | 블록 필드가 Asset을 참조. 1 Asset → N References |
| **Thumbnail** | 자동 생성된 미리보기 (리사이즈) |

## 3. 데이터 모델

```ts
interface MediaAsset {
  id: string;
  filename: string;           // "hero-banner.jpg"
  url: string;                // 저장 경로 / CDN URL
  thumbnailUrl: string;       // 미리보기용 리사이즈
  mimeType: string;           // "image/jpeg", "image/svg+xml"
  size: number;               // bytes
  width?: number;             // px (이미지만)
  height?: number;
  alt?: string;               // 대체 텍스트 (접근성)
  tags: string[];             // ["hero", "배너", "2026"]
  uploadedAt: string;
  usedIn: {                   // 참조 추적
    pageId: string;
    blockId: string;
    fieldName: string;
  }[];
}
```

## 4. UI 구조

### 4.1 Media Library Dialog

```
┌─ 미디어 라이브러리 ──────────────────────────────┐
│ [검색...]              [업로드 ↑]               │
│                                                │
│ 태그: [전체] [배너] [아이콘] [상품]              │
│ 정렬: [최근 ▾]                                  │
│                                                │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│ │ 🖼️  │ │ 🖼️  │ │ 🖼️  │ │ 🖼️  │ │ 🖼️  │      │
│ │     │ │     │ │     │ │     │ │     │      │
│ │hero │ │logo │ │gpu  │ │team │ │event│      │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
│                                                │
│ ┌─ 선택된 이미지 상세 ──────────────────┐       │
│ │ hero-banner.jpg                     │       │
│ │ 1920×1080 · 245KB · JPEG           │       │
│ │ Alt: [히어로 배너 이미지____________]  │       │
│ │ 태그: [hero] [배너] [+]             │       │
│ │ 사용처: NCP 상품 소개 > Hero > image │       │
│ └─────────────────────────────────────┘       │
│                                                │
│                    [취소]  [선택하기]            │
└────────────────────────────────────────────────┘
```

### 4.2 업로드 영역

```
┌───────────────────────────────┐
│                               │
│   파일을 여기에 끌어다 놓거나     │
│   [파일 선택] 버튼을 클릭하세요   │
│                               │
│   지원 형식: JPG, PNG, SVG, WebP │
│   최대 크기: 10MB               │
│                               │
└───────────────────────────────┘
```

### 4.3 이미지 필드 통합

현재: `fields: { image: "https://..." }` (URL 직접 입력)
변경: 이미지 필드 클릭 → Media Library Dialog 열림 → 선택 → URL 자동 입력

## 5. Decision Table

### Zone: media-library

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| L1 | image-field | Click 이미지 필드 | openLibrary | — | OPEN_MEDIA_LIBRARY(fieldRef) | dialog 열림 | 미디어 갤러리 표시 |
| L2 | media-lib | Click 이미지 카드 | selectAsset | — | SELECT_ASSET(assetId) | 선택 상태 + 상세 표시 | 카드 하이라이트, 상세 패널 |
| L3 | media-lib | Click [선택하기] | insertAsset | asset 선택됨 | INSERT_MEDIA(assetId, fieldRef) | 필드에 URL 삽입 | dialog 닫힘, 이미지 표시 |
| L4 | media-lib | Double-click 이미지 | quickInsert | — | INSERT_MEDIA(assetId, fieldRef) | 즉시 삽입 | dialog 닫힘 |
| L5 | media-lib | Click [업로드] | openUpload | — | OPEN_UPLOAD_ZONE | 업로드 영역 표시 | 드래그앤드롭 영역 |
| L6 | upload-zone | 파일 드롭 또는 선택 | upload | 파일 유효 | UPLOAD_ASSET(file) | 업로드 시작 | 프로그레스 표시 |
| L7 | upload-zone | 파일 드롭 | upload | 파일 초과 (>10MB) | no-op (validation) | 에러 표시 | "파일 크기가 10MB를 초과합니다" |
| L8 | upload-zone | 파일 드롭 | upload | 지원 안 되는 형식 | no-op (validation) | 에러 표시 | "지원되지 않는 파일 형식입니다" |
| L9 | upload-zone | 업로드 완료 | uploadComplete | — | ADD_ASSET(asset) | 갤러리에 추가 | 새 이미지 자동 선택 |
| L10 | media-lib | 검색 입력 | search | query.length > 0 | FILTER_ASSETS(query) | 표시 목록 필터링 | 파일명/태그 매칭 |
| L11 | media-lib | Tag 필터 클릭 | filterTag | — | SET_ASSET_TAG_FILTER | 태그 필터링 | 해당 태그만 표시 |
| L12 | media-lib | ArrowRight/Left/Up/Down | navigate | 카드 포커스 중 | OS_FOCUS_* | 카드 포커스 이동 | 2D 그리드 내비게이션 |
| L13 | media-lib | Enter | select | 카드 포커스 중 | SELECT_ASSET | 이미지 선택 | 상세 패널 표시 |
| L14 | media-lib | Press Escape | close | — | CLOSE_MEDIA_LIBRARY | dialog 닫힘 | 편집 모드 복귀 |

### Zone: asset-detail (상세 패널)

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| D1 | detail | Alt 텍스트 입력 | setAlt | — | UPDATE_ASSET_ALT(assetId, alt) | alt 갱신 | 접근성 텍스트 저장 |
| D2 | detail | Tag 추가 | addTag | — | ADD_ASSET_TAG(assetId, tag) | tags 배열 추가 | 새 태그 표시 |
| D3 | detail | Tag [✕] 클릭 | removeTag | — | REMOVE_ASSET_TAG(assetId, tag) | tags 배열 제거 | 태그 제거 |
| D4 | detail | Click [삭제] | deleteAsset | usedIn.length === 0 | DELETE_ASSET(assetId) | 갤러리에서 제거 | — |
| D5 | detail | Click [삭제] | deleteAsset | usedIn.length > 0 | OPEN_DELETE_WARNING | 경고 dialog | "N곳에서 사용 중입니다" |

## 5-A. Zone Binding Declaration

> DT가 **"무엇이 일어나는가"**를 기술한다면, 이 표는 **"OS에게 어떻게 선언하는가"**를 기술한다.
> LLM이 `defineApp` 코드를 생성할 때 이 표만 보면 role·callback·config를 추측 없이 작성할 수 있어야 한다.

### Zones

| Zone ID | OS Role | Items | Trigger | DT 행 |
|---------|---------|-------|---------|-------|
| `media-dialog` | `dialog` | — (컨테이너) | image-field 클릭 시 overlay open | L1, L14 |
| `asset-gallery` | `grid` | MediaAsset[] (필터된 목록) | — | L2, L4, L12, L13 |
| `tag-filter` | `toolbar` | Tag[] (전체 태그 목록) | — | L11 |
| `search-field` | — (Field) | — | — | L10 |
| `asset-detail` | `group` | — (단일 Asset 상세) | — | D1–D5 |
| `delete-warning` | `alertdialog` | — | D5 조건 시 overlay open | D5 |
| `upload-zone` | — (App 로직) | — | — | L5–L9 |

### Zone Callbacks

| Zone ID | onAction | onSelect | onDelete | onUndo/Redo | Custom |
|---------|----------|----------|----------|-------------|--------|
| `media-dialog` | — | — | — | — | onDismiss → CLOSE_MEDIA_LIBRARY |
| `asset-gallery` | `INSERT_MEDIA` (더블클릭 = L4) | `SELECT_ASSET` (L2, L13) | — | — | — |
| `tag-filter` | `SET_ASSET_TAG_FILTER` (L11) | — | — | — | — |
| `asset-detail` | — | — | `DELETE_ASSET` / `OPEN_DELETE_WARNING` (D4, D5) | — | onFieldCommit(alt) → `UPDATE_ASSET_ALT` (D1) |
| `delete-warning` | confirm → `DELETE_ASSET` | — | — | — | — |

### Zone Config Overrides (defaults 외 변경분만)

| Zone ID | Axis | Override | 이유 |
|---------|------|----------|------|
| `asset-gallery` | navigate | `orientation: "grid"`, `loop: true` | 2D 그리드 탐색 (ArrowRight/Left/Up/Down) |
| `asset-gallery` | select | `mode: "single"`, `followFocus: false` | 포커스≠선택. Enter로 명시 선택 |
| `asset-gallery` | activate | `onClick: true`, `reClickOnly: false` | 더블클릭 → INSERT_MEDIA |
| `asset-gallery` | tab | `behavior: "escape"` | Tab으로 gallery 탈출 → detail 패널 |
| `tag-filter` | navigate | `orientation: "horizontal"` | 가로 태그 칩 나열 |
| `tag-filter` | action | `commands: [OS_ACTIVATE()]`, `onClick: true` | 클릭/Enter로 태그 토글 |
| `media-dialog` | dismiss | `escape: "close"`, `outsideClick: "close"`, `restoreFocus: true` | Escape/외부클릭 → 닫기 + 포커스 복귀 |
| `delete-warning` | dismiss | `escape: "close"`, `restoreFocus: true` | AlertDialog 기본 |

### Fields

| Zone ID | Field Name | Type | 설명 |
|---------|-----------|------|------|
| `search-field` | query | `inline` | 검색어 입력 → FILTER_ASSETS 트리거 |
| `asset-detail` | alt | `inline` | 대체 텍스트 편집 → UPDATE_ASSET_ALT |
| `asset-detail` | newTag | `inline` | 태그 추가 입력 → ADD_ASSET_TAG |

## 5-B. App State Declaration

```ts
interface MediaLibraryState {
  // 전체 자산 저장소
  assets: MediaAsset[];

  // UI 상태
  ui: {
    isOpen: boolean;            // dialog 열림 여부
    fieldRef: FieldRef | null;  // 어떤 이미지 필드에서 열었는지 (삽입 대상)
    selectedAssetId: string | null;
    searchQuery: string;
    activeTagFilter: string | null;  // null = 전체
    sortBy: "recent" | "name" | "size";

    // 업로드
    upload: {
      isActive: boolean;        // 업로드 영역 표시 여부
      progress: number | null;  // 0~100, null = 업로드 안 함
      error: string | null;     // 유효성 검사 에러
    };

    // 삭제 경고
    deleteWarning: {
      isOpen: boolean;
      targetAssetId: string | null;
    };
  };
}

interface FieldRef {
  pageId: string;
  blockId: string;
  fieldName: string;
}
```

## 5-C. Command Declaration

| Command | Payload | State 변경 | 조건 | DT |
|---------|---------|-----------|------|-----|
| `OPEN_MEDIA_LIBRARY` | `{ fieldRef }` | `ui.isOpen = true`, `ui.fieldRef = fieldRef` | — | L1 |
| `CLOSE_MEDIA_LIBRARY` | — | `ui.isOpen = false`, `ui.fieldRef = null`, `ui.selectedAssetId = null` | — | L14 |
| `SELECT_ASSET` | `{ assetId }` | `ui.selectedAssetId = assetId` | — | L2, L13 |
| `INSERT_MEDIA` | `{ assetId, fieldRef }` | 대상 block의 `fields[fieldName] = asset.url` → `CLOSE_MEDIA_LIBRARY` | `selectedAssetId != null` | L3, L4 |
| `FILTER_ASSETS` | `{ query }` | `ui.searchQuery = query` (표시 목록은 derived) | — | L10 |
| `SET_ASSET_TAG_FILTER` | `{ tag \| null }` | `ui.activeTagFilter = tag` | — | L11 |
| `OPEN_UPLOAD_ZONE` | — | `ui.upload.isActive = true` | — | L5 |
| `UPLOAD_ASSET` | `{ file }` | `ui.upload.progress = 0` → 비동기 업로드 시작 | 파일 유효 (≤10MB, 지원 형식) | L6 |
| `ADD_ASSET` | `{ asset: MediaAsset }` | `assets.push(asset)`, `ui.selectedAssetId = asset.id`, `ui.upload = reset` | — | L9 |
| `UPDATE_ASSET_ALT` | `{ assetId, alt }` | `asset.alt = alt` | — | D1 |
| `ADD_ASSET_TAG` | `{ assetId, tag }` | `asset.tags.push(tag)` | — | D2 |
| `REMOVE_ASSET_TAG` | `{ assetId, tag }` | `asset.tags.filter(t ≠ tag)` | — | D3 |
| `DELETE_ASSET` | `{ assetId }` | `assets.filter(a ≠ assetId)`, 경고 닫기 | — | D4, D5 confirm |
| `OPEN_DELETE_WARNING` | `{ assetId }` | `ui.deleteWarning = { isOpen: true, targetAssetId: assetId }` | `usedIn.length > 0` | D5 |

## 6. BDD Scenarios

```gherkin
Feature: Media Library

Scenario: 이미지 필드에서 미디어 라이브러리 열기
  Given 캔버스에서 Hero 섹션의 이미지 필드를 선택했다
  When 이미지 필드를 클릭한다
  Then 미디어 라이브러리 Dialog가 열린다
    And 기존 업로드된 이미지가 그리드로 표시된다

Scenario: 기존 이미지 선택하여 삽입
  Given 미디어 라이브러리가 열려있다
  When "hero-banner.jpg" 이미지를 클릭한다
  Then 오른쪽에 상세 정보가 표시된다 (크기, 해상도, 사용처)
  When [선택하기]를 클릭한다
  Then Dialog가 닫히고 이미지 필드에 해당 이미지가 표시된다

Scenario: 새 이미지 업로드
  Given 미디어 라이브러리가 열려있다
  When [업로드] 버튼을 클릭한다
  Then 드래그앤드롭 업로드 영역이 표시된다
  When "new-banner.jpg" (2MB) 파일을 드롭한다
  Then 업로드 프로그레스가 표시된다
  When 업로드가 완료된다
  Then 갤러리에 새 이미지가 추가되고 자동 선택된다

Scenario: 파일 크기 초과
  Given 업로드 영역이 열려있다
  When 15MB 파일을 드롭한다
  Then "파일 크기가 10MB를 초과합니다" 에러 표시
    And 업로드가 실행되지 않는다

Scenario: Alt 텍스트 설정 (접근성)
  Given "hero-banner.jpg"가 선택되어 상세 패널이 보인다
  When Alt 텍스트에 "GPU 서버 히어로 배너"를 입력한다
  Then alt 텍스트가 저장된다
    And 이 이미지를 사용하는 모든 곳에 alt 속성이 반영된다

Scenario: 사용 중인 이미지 삭제 경고
  Given "logo.svg"가 3개 페이지에서 사용 중이다
  When [삭제]를 클릭한다
  Then 경고: "이 이미지는 3곳에서 사용 중입니다. 삭제하면 해당 위치의 이미지가 표시되지 않습니다."
  When [그래도 삭제]를 클릭한다
  Then 이미지가 삭제된다

Scenario: 키보드로 이미지 탐색
  Given 미디어 갤러리가 5열 그리드로 표시되어 있다
    And 첫 번째 이미지에 포커스가 있다
  When ArrowRight를 누른다
  Then 다음 이미지로 포커스 이동
  When ArrowDown을 누른다
  Then 아래 행의 같은 열 이미지로 포커스 이동
  When Enter를 누른다
  Then 해당 이미지가 선택되어 상세 패널 표시

Scenario: 태그로 필터링
  Given 갤러리에 20개 이미지가 있다
    And 5개에 "배너" 태그가 있다
  When [배너] 태그를 클릭한다
  Then 5개 이미지만 표시된다

Scenario: 검색
  Given 갤러리에 20개 이미지가 있다
  When 검색에 "hero"를 입력한다
  Then 파일명 또는 태그에 "hero"가 포함된 이미지만 표시된다
```

## 7. OS 검증 포인트

| OS Primitive | 검증 내용 |
|-------------|----------|
| **Grid** | 이미지 갤러리 — 2D 키보드 네비게이션 (ArrowRight/Left/Up/Down) |
| **Dialog** | 미디어 라이브러리 복합 Dialog — Gallery + Detail + Upload |
| **Search** | 파일명/태그 검색 — 인크리멘탈 필터링 |
| **Upload (Drop Zone)** | 파일 드래그앤드롭 — OS 레벨 제공 가능? |
| **Form** | Alt 텍스트, 태그 관리 — 인라인 편집 |
| **AlertDialog** | 사용 중 이미지 삭제 경고 |
| **Tag (Filter)** | 태그 기반 필터링 — toggle chip 그룹 |
| **Progress** | 업로드 진행률 — `role="progressbar"` |

---

_Status: 기획 완료. 개발 보류._
