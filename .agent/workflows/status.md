---
description: docs/STATUS.md를 갱신하여 프로젝트 대시보드를 최신 상태로 유지한다.
---

## Why

> `/status`는 스냅샷을 **쌓는** 것이 아니라 대시보드를 **갱신**한다.
> `docs/STATUS.md` 하나가 Single Source of Truth이고, git log가 곧 changelog다.

## 절차

1. **대시보드 읽기**
   - `docs/STATUS.md`를 읽어 현재 상태를 파악한다.

2. **프로젝트 스캔**
   - `docs/1-project/`의 모든 하위 폴더를 스캔한다.
   - 각 프로젝트의 BOARD.md, README.md, 최근 git 활동을 확인한다.
   - Phase를 판정한다: Discovery → Definition → Design → Execution → Closing

3. **Focus 자동 판정**
   - 최근 2일 이내 활동이 있는 프로젝트 → 🔥 Focus
   - 3~6일 활동 없음 → ⏸ Idle
   - 7일+ 활동 없음 → 💤 Stale
   - Status에 "완료", "Complete", "✅" 등이 명시된 프로젝트 → ✅ Completed

4. **Inbox 스캔**
   - `docs/0-inbox/`의 모든 파일을 스캔한다.
   - 각 파일의 제목, 타입, 내용을 분석하여 관련 프로젝트를 매칭한다.
   - Suggested Action을 판정한다:
     - 관련 프로젝트가 Active → `→ project/notes/`
     - 관련 프로젝트가 Completed → `→ archive`
     - 프로젝트 무관 + 지속 참조 가치 → `→ 2-area/` 또는 `→ 3-resource/`
     - 과거 상태 스냅샷 (STATUS.md로 대체됨) → `→ 삭제`
     - 일회성 보고서 → `→ archive`

5. **대시보드 갱신**
   - `docs/STATUS.md`를 **덮어쓰기(overwrite)**한다.
   - 기존 파일의 구조를 유지하면서 데이터를 갱신한다.
   - `Last updated` 타임스탬프를 현재 시각으로 갱신한다.

6. **알림**
   - 주요 변화를 사용자에게 요약 보고한다:
     - 새로 Focus가 된 프로젝트
     - Stale로 강등된 프로젝트
     - Completed로 판정된 프로젝트
     - Inbox에서 즉시 처리 가능한 항목
     - Backlog에서 승격 가능한 아이디어

> **⚠️ 금지**: `docs/0-inbox/`에 새 상태 보고서를 생성하지 않는다. 대시보드가 유일한 상태 파일이다.
