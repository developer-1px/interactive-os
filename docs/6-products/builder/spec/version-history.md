# Spec — Version History (배포 이력 관리)

> Feature 4 of builder-v3. Page Lifecycle의 자연스러운 확장.
> "언제 뭘 바꿨는지" 알아야 실수를 복구할 수 있다.

## 1. 개요

Publish할 때마다 저장되는 스냅샷을 **타임라인으로 탐색**하고,
특정 버전으로 **롤백**하거나 **두 버전을 비교**할 수 있다.

```
v3 (현재 Published)  ──── 2026-03-04 14:00  "GPU 서버 소개 업데이트"
v2                   ──── 2026-03-01 11:30  "가격표 수정"
v1                   ──── 2026-02-28 09:00  "최초 배포"
```

## 2. 데이터 모델

```ts
interface PageVersion {
  id: string;
  pageId: string;
  version: number;            // 자동 증가 (1, 2, 3...)
  blocks: Block[];            // 해당 시점의 Block Tree 전체
  publishedAt: string;        // ISO timestamp
  message?: string;           // 배포 메모 (선택)
  diff?: {                    // 이전 버전 대비 변경 요약
    added: number;
    removed: number;
    modified: number;
  };
}
```

- Page Lifecycle의 `PageSnapshot`을 확장
- 최대 보관 수: 50개 (이후 가장 오래된 것부터 자동 삭제)
- 배포 시 message 입력은 선택 사항 (빈칸 허용)

## 3. UI 구조

### 3.1 Version History 패널

```
┌─ 버전 이력 ──────────────────────────────┐
│                                          │
│  🟢 v3 (현재)        2026-03-04 14:00    │
│     "GPU 서버 소개 업데이트"              │
│     +1 블록, ~2 수정                     │
│     [미리보기]  [비교]                    │
│                                          │
│  ── v2                2026-03-01 11:30    │
│     "가격표 수정"                         │
│     ~3 수정                              │
│     [미리보기]  [비교]  [이 버전으로 복원] │
│                                          │
│  ── v1                2026-02-28 09:00    │
│     "최초 배포"                           │
│     +5 블록                              │
│     [미리보기]  [비교]  [이 버전으로 복원] │
│                                          │
└──────────────────────────────────────────┘
```

### 3.2 Publish Dialog 확장 (배포 메모)

```
┌─────────────────────────────────┐
│ 페이지를 배포하시겠습니까?         │
│                                 │
│ 변경 메모 (선택):                │
│ [가격표 수정 반영________________] │
│                                 │
│        [취소]  [배포하기]         │
└─────────────────────────────────┘
```

### 3.3 Version Preview (읽기 전용)

과거 버전의 캔버스를 읽기 전용으로 표시. 편집 불가. 헤더에 "v2 미리보기 — 읽기 전용" 표시.

## 4. Decision Table

### Zone: version-panel

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| H1 | toolbar | Click [이력] | openHistory | snapshot 1개 이상 | OPEN_VERSION_PANEL | 패널 열림 | 버전 타임라인 표시 |
| H2 | toolbar | Click [이력] | openHistory | snapshot 0개 | OPEN_VERSION_PANEL | 패널 열림 | "아직 배포 이력이 없습니다" 안내 |
| H3 | version-panel | Click [미리보기] | preview | — | PREVIEW_VERSION(versionId) | 읽기 전용 캔버스 | 해당 버전 Block Tree 렌더링 |
| H4 | version-panel | Click [비교] | compare | — | OPEN_DIFF_VIEW(current, versionId) | diff 뷰 진입 | Content Diff Feature 연동 |
| H5 | version-panel | Click [이 버전으로 복원] | rollback | status=draft | OPEN_ROLLBACK_DIALOG(versionId) | 확인 dialog | "이 버전으로 되돌리시겠습니까?" |
| H6 | rollback-dialog | Click [복원하기] | confirmRollback | — | ROLLBACK_TO_VERSION(versionId) | blocks ← version.blocks | Draft에 과거 블록 복원 |
| H7 | rollback-dialog | Click [취소] | cancelRollback | — | CLOSE_DIALOG | dialog 닫힘 | 상태 불변 |
| H8 | version-panel | ArrowUp/Down | navigate | 버전 포커스 중 | OS_FOCUS_PREV/NEXT | 버전 포커스 이동 | 다음/이전 버전으로 이동 |
| H9 | version-panel | Press Escape | close | — | CLOSE_VERSION_PANEL | 패널 닫힘 | 편집 모드 복귀 |
| H10 | version-panel | Enter | action | 버전 포커스 중 | PREVIEW_VERSION(focusedId) | 읽기 전용 미리보기 | 해당 버전 캔버스 |

### Zone: publish-dialog (메모 확장)

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| M1 | publish-dialog | 메모 입력 | setMessage | — | SET_PUBLISH_MESSAGE(text) | message 설정 | — |
| M2 | publish-dialog | Click [배포하기] | publish | message 있음 | PUBLISH_PAGE(message) | snapshot + message 저장 | 이력에 메모 표시 |
| M3 | publish-dialog | Click [배포하기] | publish | message 없음 | PUBLISH_PAGE(null) | snapshot만 저장 | 이력에 메모 없음 |

## 5. BDD Scenarios

```gherkin
Feature: Version History

Scenario: 배포 이력 조회
  Given "NCP 상품 소개" 페이지를 3번 배포했다 (v1, v2, v3)
  When [이력] 버튼을 클릭한다
  Then 버전 패널이 열린다
    And v3(현재), v2, v1 순서로 타임라인이 표시된다
    And 각 버전에 배포 시각과 변경 요약이 표시된다

Scenario: 과거 버전 미리보기
  Given 버전 패널이 열려있다
  When v1의 [미리보기]를 클릭한다
  Then 캔버스가 v1 시점의 Block Tree로 렌더링된다
    And 헤더에 "v1 미리보기 — 읽기 전용" 표시
    And 편집 기능이 비활성화된다

Scenario: 과거 버전으로 롤백
  Given 현재 Draft 상태이고 v2로 복원하려 한다
  When v2의 [이 버전으로 복원]을 클릭한다
  Then 확인 Dialog: "v2로 되돌리시겠습니까? 현재 편집 중인 내용은 사라집니다."
  When [복원하기]를 클릭한다
  Then Draft의 Block Tree가 v2 블록으로 교체된다
    And 상태는 Draft 유지

Scenario: 두 버전 비교
  Given 버전 패널이 열려있다
  When v1의 [비교]를 클릭한다
  Then Content Diff 뷰가 열린다 (현재 Draft vs v1)
    And 추가/삭제/수정된 블록이 색으로 구분된다

Scenario: 배포 메모 작성
  Given Draft 페이지에서 [Publish]를 클릭했다
  When 메모에 "가격표 수정 반영"을 입력한다
  When [배포하기]를 클릭한다
  Then 버전 이력에 "가격표 수정 반영" 메모가 표시된다

Scenario: 키보드로 버전 탐색
  Given 버전 패널이 열려있다
    And v3에 포커스가 있다
  When ArrowDown을 누른다
  Then v2로 포커스가 이동한다
  When Enter를 누른다
  Then v2 미리보기가 열린다

Scenario: 배포 이력이 없는 페이지
  Given 한 번도 배포하지 않은 새 페이지이다
  When [이력] 버튼을 클릭한다
  Then "아직 배포 이력이 없습니다" 안내가 표시된다
```

## 6. OS 검증 포인트

| OS Primitive | 검증 내용 |
|-------------|----------|
| **List (Timeline)** | 버전 목록 — `role="list"` + `role="listitem"` 키보드 탐색 |
| **AlertDialog** | 롤백 확인 — 파괴적 액션 |
| **Preview Mode** | 읽기 전용 캔버스 — OS 수준의 편집 잠금? |
| **Panel** | 사이드 패널 열기/닫기 — slide-in 패턴 |
| **Form** | 배포 메모 입력 — optional field in dialog |

---

_Status: 기획 완료. 개발 보류._
