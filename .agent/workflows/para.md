---
description: 표준 PARA 방법론(Projects, Areas, Resources, Archives)을 적용한다. 완료된 프로젝트는 아카이브로 이동하고, inbox는 실행 가능성 기준으로 정리한다.
---

## Why

> `/para`는 **세션 대청소**다. 일상적 라우팅은 각 워크플로우가 대시보드를 보고 처리하지만,
> 누적된 고아 문서, 완료된 프로젝트 아카이빙, 분류 오류는 `/para`가 주기적으로 정리한다.

## 대시보드 기반 실행

> `/para`는 항상 `docs/STATUS.md`를 먼저 읽고, 대시보드의 제안(Suggested Action)을 우선 실행한다.

## 절차

1. **대시보드 읽기**
   - `docs/STATUS.md`를 읽어 현재 상태를 파악한다.
   - Inbox의 Suggested Action, Completed 프로젝트, Stale 프로젝트를 확인한다.

2. **Inbox Review & Clear**
   - **대시보드 기반**: STATUS.md의 Inbox 섹션에 Suggested Action이 이미 있는 항목은 바로 실행한다.
   - **신규 스캔**: 대시보드에 없는 inbox 파일이 있으면 분석 후 처리한다.
   - **이동 기준**:
     - `→ project/notes/` — 관련 Active 프로젝트가 있음
     - `→ archive` — 일회성 보고서 또는 관련 프로젝트가 Completed
     - `→ 2-area/` — 프로젝트 무관, 지속 참조 가치
     - `→ 3-resource/` — 참고 자료, 레퍼런스
     - `→ 삭제` — STATUS.md로 대체된 과거 상태 스냅샷
   - Do NOT merge files; keep them intact.

3. **Project Review (Active → Archive)**
   - **대시보드 기반**: Completed 섹션의 `Archived? ❌` 항목을 아카이브한다.
   - **추가 검토**: Stale 프로젝트(`💤`)에 대해 사용자에게 아카이브 여부를 묻는다.
   - **Archive**: 프로젝트 폴더를 `docs/4-archive/[YYYY]/[ProjectName]`으로 이동한다.
     - Create the year folder if it doesn't exist.

4. **Area & Resource Maintenance**
   - `docs/2-area`와 `docs/3-resource`를 스캔한다.
   - If an Area/Resource has become a specific Project → move to `docs/1-project`.
   - If no longer relevant → move to `docs/4-archive/[YYYY]/[ItemName]`.

5. **대시보드 최종 갱신**
   - 모든 이동이 완료되면 `docs/STATUS.md`를 갱신한다:
     - Inbox 섹션에서 처리된 항목 제거
     - Archived 프로젝트를 `Archived? ✅`로 갱신 또는 목록에서 제거
     - Summary 카운트 갱신
     - Last updated 타임스탬프 갱신

6. **Execution**
   - Present a summary of all moves.
   - Upon confirmation, execute filesystem commands (`mv`).
   - Ensure the structure remains clean:
     - `docs/1-project` contains only *active* projects.
     - `docs/4-archive` contains the history, organized by year.
     - `docs/0-inbox` is empty or near-empty.
