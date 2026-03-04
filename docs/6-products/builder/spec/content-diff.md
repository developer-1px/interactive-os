# Spec — Content Diff (변경사항 시각화)

> Feature 3 of builder-v3. "뭐가 바뀌었는지" 모르면 배포할 용기가 없다.
> Publish 전 변경사항을 시각적으로 확인하는 안전망.

## 1. 개요

Draft(현재 편집본)와 Published(마지막 배포본)를 비교하여,
블록 단위로 **추가/삭제/수정**을 시각화한다.

```
┌─── Draft (현재) ──────────────── Published (배포본) ───┐
│                                                       │
│  [Hero Section]        ═══     [Hero Section]         │
│    title: "새 제목" 🟡          title: "구 제목"       │
│    subtitle: (동일)            subtitle: (동일)        │
│                                                       │
│  [서비스 소개] 🟢 NEW           (없음)                  │
│                                                       │
│  [푸터]                ═══     [푸터]                   │
│    (동일)                       (동일)                  │
│                                                       │
│  (없음)                        [이벤트 배너] 🔴 삭제됨   │
│                                                       │
└───────────────────────────────────────────────────────┘
```

## 2. Diff 단위

| 단위 | 비교 대상 | 표시 |
|------|----------|------|
| **Block 추가** | Draft에만 있는 블록 | 🟢 초록 배경 |
| **Block 삭제** | Published에만 있는 블록 | 🔴 빨강 배경 + 취소선 |
| **Block 수정** | 양쪽 모두 있지만 fields가 다름 | 🟡 노랑 배경 + 변경 필드 하이라이트 |
| **Block 이동** | 같은 블록이 다른 위치 | 🔵 파랑 화살표 |
| **Block 동일** | 변경 없음 | 배경 없음 (기본) |

### Diff 알고리즘

```ts
interface BlockDiff {
  type: "added" | "removed" | "modified" | "moved" | "unchanged";
  blockId: string;
  draftBlock?: Block;       // added | modified | moved | unchanged
  publishedBlock?: Block;   // removed | modified | moved | unchanged
  fieldDiffs?: FieldDiff[]; // modified일 때만
}

interface FieldDiff {
  fieldName: string;
  draftValue: string;
  publishedValue: string;
}
```

- Block 매칭: **id 기반**. 같은 id = 같은 블록
- 새 id = 추가, 없어진 id = 삭제
- 같은 id + 다른 index = 이동
- 같은 id + 다른 fields = 수정
- children도 재귀적으로 비교

## 3. UI 모드

### 3.1 Side-by-side (기본)

좌: Draft, 우: Published. 대응하는 블록이 같은 높이에 정렬.

### 3.2 Unified (단일 뷰)

하나의 캔버스에 변경사항을 인라인으로 표시. 수정된 필드만 하이라이트.

### 3.3 사이드바 트리 Diff

```
📁 페이지
  🟢 서비스 소개 (NEW)
  🟡 Hero Section (modified)
     🟡 title
     ── subtitle (unchanged)
  🔴 이벤트 배너 (removed)
  ── 푸터 (unchanged)
```

트리에서 변경된 블록만 아이콘으로 표시. 클릭하면 해당 블록으로 스크롤.

## 4. 진입 경로

| 경로 | When | 동작 |
|------|------|------|
| Publish 전 자동 | [Publish] 클릭 시 | Diff 뷰 → 확인 → Publish |
| 수동 열기 | [변경사항 보기] 버튼 | Diff 뷰 진입 |
| 이력 비교 | Snapshot 2개 선택 | 두 버전 비교 |

## 5. Decision Table

### Zone: diff-view

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| F1 | toolbar | Click [변경사항 보기] | openDiff | snapshot 있음 | OPEN_DIFF_VIEW | diff 계산, diff 뷰 진입 | side-by-side 표시 |
| F2 | toolbar | Click [변경사항 보기] | openDiff | snapshot 없음 (첫 배포) | OPEN_DIFF_VIEW | 전체를 "added"로 표시 | 모든 블록 초록 |
| F3 | diff-view | Click [Side-by-side] | switchMode | — | SET_DIFF_MODE("side-by-side") | 뷰 모드 변경 | 좌우 분할 |
| F4 | diff-view | Click [Unified] | switchMode | — | SET_DIFF_MODE("unified") | 뷰 모드 변경 | 단일 뷰 |
| F5 | diff-sidebar | Click 변경된 블록 | navigateToBlock | — | SCROLL_TO_BLOCK(blockId) | 해당 블록으로 스크롤 | 블록 하이라이트 |
| F6 | diff-view | Click [이 변경 되돌리기] | revertBlock | 블록이 modified | REVERT_BLOCK(blockId) | 해당 블록을 published 값으로 복원 | 해당 블록 "unchanged"로 전환 |
| F7 | diff-view | Press Escape | closeDiff | — | CLOSE_DIFF_VIEW | 일반 편집 모드로 복귀 | diff 뷰 종료 |
| F8 | diff-view | Click [배포하기] | publishFromDiff | — | OPEN_PUBLISH_DIALOG | 확인 dialog 열림 | Lifecycle T3 흐름으로 연결 |

## 6. BDD Scenarios

```gherkin
Feature: Content Diff

Scenario: 필드 수정 후 변경사항 확인
  Given "NCP 상품 소개" 페이지가 Published 상태에서 Draft로 전환되었다
    And Hero Section의 title을 "구 제목"에서 "새 제목"으로 수정했다
  When [변경사항 보기]를 클릭한다
  Then Diff 뷰가 열린다
    And Hero Section이 🟡(modified)로 표시된다
    And title 필드에 "구 제목" → "새 제목" 변경이 표시된다
    And 나머지 블록은 변경 없음으로 표시된다

Scenario: 블록 추가 후 변경사항 확인
  Given Published 상태에서 "서비스 소개" 섹션을 새로 추가했다
  When [변경사항 보기]를 클릭한다
  Then "서비스 소개"가 🟢(added)로 표시된다
    And Published 쪽에는 대응하는 블록이 없다

Scenario: 블록 삭제 후 변경사항 확인
  Given Published 상태에서 "이벤트 배너" 섹션을 삭제했다
  When [변경사항 보기]를 클릭한다
  Then "이벤트 배너"가 🔴(removed)로 표시된다
    And Draft 쪽에는 대응하는 블록이 없다

Scenario: 변경 없는 페이지
  Given Published 상태에서 아무것도 수정하지 않았다
  When [변경사항 보기]를 클릭한다
  Then "변경사항이 없습니다" 메시지가 표시된다

Scenario: 개별 블록 되돌리기
  Given Diff 뷰에서 Hero Section이 modified로 표시되어 있다
  When Hero Section의 [이 변경 되돌리기]를 클릭한다
  Then Hero Section이 Published 값으로 복원된다
    And Diff 표시가 "unchanged"로 변경된다
    And 다른 블록의 변경사항은 유지된다

Scenario: Diff 뷰에서 바로 배포
  Given Diff 뷰에서 변경사항을 확인했다
  When [배포하기]를 클릭한다
  Then Publish 확인 Dialog가 열린다 (page-lifecycle 흐름)

Scenario: 사이드바 트리에서 변경 블록 탐색
  Given Diff 뷰가 열려있다
    And 3개 블록이 변경됨 (1 added, 1 modified, 1 removed)
  When 사이드바에서 modified 블록을 클릭한다
  Then 캔버스가 해당 블록으로 스크롤된다
    And 해당 블록이 하이라이트된다

Scenario: 첫 배포 시 Diff
  Given 한 번도 배포한 적 없는 새 페이지이다
  When [변경사항 보기]를 클릭한다
  Then 모든 블록이 🟢(added)로 표시된다
    And "첫 배포입니다" 안내 메시지가 표시된다
```

## 7. OS 검증 포인트

| OS Primitive | 검증 내용 |
|-------------|----------|
| **Side-by-side Layout** | 두 개의 동기화된 스크롤 영역 — 새로운 레이아웃 패턴 |
| **Tree Diff** | NormalizedCollection diff — 아직 OS에 없는 기능 |
| **Toolbar** | Diff 모드 전환 (Side-by-side / Unified) — radio group |
| **Scroll Sync** | 좌우 패널 스크롤 연동 — OS 레벨 제공 가능? |
| **Block-level Action** | "이 변경 되돌리기" — 개별 블록 단위 커맨드 |

---

_Status: 기획 완료. 개발 보류._
