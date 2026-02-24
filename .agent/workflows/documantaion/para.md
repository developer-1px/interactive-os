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
     - `→ project/discussions/` 또는 `project/notes/` — 관련 Active 프로젝트가 있음
     - `→ 5-backlog/` — 언젠가 할 아이디어, 지금은 아님
     - `→ archive` — 일회성 보고서 또는 관련 프로젝트가 Completed
     - `→ 2-area/` — 프로젝트 무관, 지속 참조 가치
     - `→ 3-resource/` — 참고 자료, 레퍼런스, 공부/읽을거리
     - `→ 삭제` — STATUS.md로 대체된 과거 상태 스냅샷
   - Do NOT merge files; keep them intact.

3. **Project Review (Active → Archive)**
   - **대시보드 기반**: Completed 섹션의 `Archived? ❌` 항목을 처리한다.
   - **추가 검토**: Stale 프로젝트(`💤`)에 대해 사용자에게 아카이브 여부를 묻는다.
   - **`/archive` 호출**: 직접 `mv`하지 않는다. `/archive` 워크플로우를 호출하여 지식을 Area/Resource로 분배한 후 잔여물만 아카이브한다.

4. **Backlog Review**
   - `docs/5-backlog/`를 스캔한다.
   - Active 프로젝트로 승격 가능한 아이디어가 있으면 사용자에게 보고한다.
   - 오래된 아이디어(30일+)는 여전히 관심 있는지 사용자에게 묻는다.

5. **Area & Resource Maintenance**
   - `docs/2-area`와 `docs/3-resource`를 스캔한다.
   - Area/Resource가 특정 프로젝트가 되었으면 → `docs/1-project`로 이동.
   - **Superseded 문서 발견 시**: `/retire` 워크플로우를 호출하여 AI 컨텍스트에서 제거한다.
   - Area가 소스코드 구조와 동기화되어 있는지 확인한다.

6. **대시보드 최종 갱신**
   - 모든 이동이 완료되면 `docs/STATUS.md`를 갱신한다:
     - Inbox 섹션에서 처리된 항목 제거
     - Archived 프로젝트를 `Archived? ✅`로 갱신 또는 목록에서 제거
     - Summary 카운트 갱신
     - Last updated 타임스탬프 갱신

7. **Execution**
   - Present a summary of all moves.
   - Upon confirmation, execute filesystem commands (`mv`).
   - Ensure the structure remains clean:
     - `docs/1-project` contains only *active* strategic projects.
     - `docs/4-archive` contains the history.
     - `docs/5-backlog` contains ideas waiting for activation.
     - `docs/0-inbox` is empty or near-empty.
