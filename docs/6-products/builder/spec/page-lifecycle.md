# Spec — Page Lifecycle (Draft → Published → Archived)

> Feature 1 of builder-v3. 콘텐츠 운영의 최소 단위 = "배포".
> 편집만 되고 배포가 없으면 에디터지 CMS가 아니다.

## 1. 개요

페이지에 **상태(status)**를 부여하여, 편집→검토→배포→보관의 생명주기를 관리한다.

```
Draft ──(Publish)──→ Published ──(Archive)──→ Archived
  ↑                      │                       │
  └──(Edit)──────────────┘                       │
  └──(Restore)───────────────────────────────────┘
```

## 2. 상태 정의

| 상태 | 의미 | 편집 가능 | 라이브 표시 |
|------|------|----------|------------|
| **Draft** | 작업 중. 아직 배포되지 않음 | ✅ | ❌ |
| **Published** | 현재 라이브. 방문자에게 보임 | ❌ (수정 시 자동 Draft 전환) | ✅ |
| **Archived** | 더 이상 사용 안 함. 보관 상태 | ❌ | ❌ |

## 3. 상태 전이

| # | From | Action | To | 조건 | 부수효과 |
|---|------|--------|----|------|---------|
| L1 | Draft | Publish | Published | — | 현재 Block Tree를 snapshot으로 저장 |
| L2 | Published | Edit (아무 필드 수정) | Draft | — | 이전 Published snapshot 보존 |
| L3 | Published | Archive | Archived | — | 라이브에서 제거 |
| L4 | Archived | Restore | Draft | — | Draft 상태로 복귀, 편집 가능 |
| L5 | Draft | Archive | Archived | — | 배포 없이 바로 보관 |

### 금지 전이

| From | To | 이유 |
|------|-----|------|
| Archived | Published | 보관된 페이지를 바로 배포하면 위험. 반드시 Draft 거쳐야 함 |
| Published | Published | 이미 배포됨. 수정하면 자동으로 Draft |

## 4. Snapshot 모델

```ts
interface PageSnapshot {
  id: string;
  pageId: string;
  blocks: Block[];         // 배포 시점의 Block Tree 전체
  publishedAt: string;     // ISO timestamp
  publishedBy?: string;    // 운영자 식별 (Later)
}
```

- Publish할 때마다 새 snapshot 생성
- 최근 N개 보관 (기본 10)
- Rollback = 특정 snapshot의 blocks를 현재 Draft에 복원

## 5. UI 요소

### 5.1 페이지 헤더 Toolbar

```
┌─────────────────────────────────────────────────┐
│ [← 목록]  NCP 상품 소개    [Draft ●]  [Publish] │
│           /products/ncp     [Preview] [Archive]  │
└─────────────────────────────────────────────────┘
```

| 요소 | ARIA | 동작 |
|------|------|------|
| Status Badge | `role="status"` | Draft(노랑), Published(초록), Archived(회색) |
| Publish 버튼 | `role="button"` | Draft일 때만 활성. 클릭 → 확인 Dialog |
| Preview 버튼 | `role="button"` | 항상 활성. 현재 Draft를 미리보기 |
| Archive 버튼 | `role="button"` | Draft/Published일 때 활성 |

### 5.2 Publish 확인 Dialog

```
┌─────────────────────────────────┐
│ 페이지를 배포하시겠습니까?         │
│                                 │
│ "NCP 상품 소개" 페이지가          │
│ 즉시 라이브에 반영됩니다.          │
│                                 │
│        [취소]  [배포하기]         │
└─────────────────────────────────┘
```

- `role="alertdialog"` — 파괴적 액션 확인
- Escape → 취소
- Enter → 배포하기 (포커스 기본값)

### 5.3 BuilderListPage 상태 필터

| 필터 | 표시 페이지 |
|------|-----------|
| 전체 | 모든 상태 |
| Draft | status === "draft" |
| Published | status === "published" |
| Archived | status === "archived" |

> 참고: BuilderListPage에 이미 필터 UI 존재 (published/draft/archived). 데이터 연결만 필요.

## 6. Decision Table

### Zone: page-toolbar

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| T1 | toolbar | Click [Publish] | publish | status=draft | OPEN_PUBLISH_DIALOG | dialog 열림 | 확인 dialog 표시 |
| T2 | toolbar | Click [Publish] | publish | status≠draft | no-op | — | 버튼 비활성 |
| T3 | publish-dialog | Click [배포하기] | confirmPublish | — | PUBLISH_PAGE | status→published, snapshot 생성 | dialog 닫힘, 배지 초록 |
| T4 | publish-dialog | Click [취소] | cancelPublish | — | CLOSE_DIALOG | dialog 닫힘 | 상태 불변 |
| T5 | publish-dialog | Press Escape | cancelPublish | — | CLOSE_DIALOG | dialog 닫힘 | 상태 불변 |
| T6 | toolbar | Click [Archive] | archive | status=draft∨published | OPEN_ARCHIVE_DIALOG | dialog 열림 | 확인 dialog 표시 |
| T7 | archive-dialog | Click [보관하기] | confirmArchive | — | ARCHIVE_PAGE | status→archived | dialog 닫힘, 배지 회색 |
| T8 | toolbar | Click [Preview] | preview | — | OPEN_PREVIEW | 미리보기 모드 | 편집 UI 숨김, 콘텐츠만 표시 |

### Zone: page-list (BuilderListPage)

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| P1 | page-list | Click [Restore] | restore | status=archived | RESTORE_PAGE | status→draft | 페이지 목록 갱신 |
| P2 | page-list | Filter 변경 | filter | — | SET_STATUS_FILTER | 표시 목록 갱신 | 해당 상태만 표시 |
| P3 | page-list | Click 페이지 행 | navigate | — | OPEN_PAGE | 해당 페이지 에디터 열림 | — |

## 7. BDD Scenarios

```gherkin
Feature: Page Lifecycle

Scenario: 새 페이지는 Draft 상태로 생성된다
  Given 빌더에서 새 페이지를 생성했다
  When 페이지 헤더를 확인한다
  Then 상태 배지가 "Draft"(노랑)로 표시된다
    And Publish 버튼이 활성화되어 있다

Scenario: Draft 페이지를 배포한다
  Given "NCP 상품 소개" 페이지가 Draft 상태이다
  When [Publish] 버튼을 클릭한다
  Then 확인 Dialog가 열린다 ("페이지를 배포하시겠습니까?")
  When [배포하기]를 클릭한다
  Then 상태가 Published(초록)로 변경된다
    And Block Tree snapshot이 저장된다
    And Publish 버튼이 비활성화된다

Scenario: Published 페이지를 수정하면 자동으로 Draft 전환
  Given "NCP 상품 소개" 페이지가 Published 상태이다
  When 캔버스에서 "Hero Title" 필드를 수정한다
  Then 상태가 자동으로 Draft(노랑)로 변경된다
    And 이전 Published snapshot은 보존된다
    And Publish 버튼이 다시 활성화된다

Scenario: 페이지를 보관한다
  Given "이벤트 페이지" 가 Published 상태이다
  When [Archive] 버튼을 클릭한다
  Then 확인 Dialog가 열린다
  When [보관하기]를 클릭한다
  Then 상태가 Archived(회색)로 변경된다
    And 페이지 목록에서 "Archived" 필터로만 보인다

Scenario: 보관된 페이지를 복원한다
  Given "이벤트 페이지"가 Archived 상태이다
  When 페이지 목록에서 [Restore]를 클릭한다
  Then 상태가 Draft로 변경된다
    And 편집이 가능해진다

Scenario: Publish 취소
  Given Draft 상태에서 [Publish]를 클릭하여 확인 Dialog가 열려있다
  When Escape를 누른다
  Then Dialog가 닫힌다
    And 상태는 Draft 그대로 유지된다
```

## 8. OS 검증 포인트

| OS Primitive | 검증 내용 |
|-------------|----------|
| **Toolbar** | APG toolbar 패턴. Publish/Preview/Archive 버튼 그룹 |
| **AlertDialog** | Publish 확인, Archive 확인 — `role="alertdialog"` |
| **Status Badge** | `role="status"`, `aria-live="polite"` — 상태 변경 스크린리더 통지 |
| **State Machine** | Draft/Published/Archived 전이 — OS 레벨 FSM 필요성 탐색 |
| **Snapshot** | 커널 History 확장 — undo 스택과 별도의 명명된 스냅샷 |

---

_Status: 기획 완료. 개발 보류._
