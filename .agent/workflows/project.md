---
description: Discussion 결론을 프로젝트로 전환한다. 프로젝트 폴더를 scaffold하고, `/go` 프리셋을 라우팅한다.
---

## /project — 프로젝트 생애주기

> **분류**: 오케스트레이터. `/go` 프리셋 라우터.
> **진입점**: `/discussion` 종료 → "새 프로젝트" 판정 시 자동 전환.

### 라우팅

```
/project
  ├─ discussion 미완료 → /discussion 진입 → 완료 후 /project 재진입
  └─ discussion 완료 → 규모 판정 → scaffold → /go [preset] 자동 진입
```

### 초기화

0. **Discussion 판정** — 미완료 시 `/discussion` 진입. 완료 후 재진입.
1. **규모 판정** — Heavy / Light 결정.
2. **문서 수집** — `docs/0-inbox/`, `docs/5-backlog/`, `docs/4-archive/` 탐색 → `discussions/`, `notes/`로 이동.
3. **Scaffold** — `docs/1-project/[name]/` 표준 구조 생성.
4. **등록** — `docs/STATUS.md`에 프로젝트 추가.
5. **README.md** — Rust RFC 포맷 (`rust-lang/rfcs/0000-template.md`).
   Discussion 산출물(Warrant, Conclusion)을 Motivation의 입력으로 사용.
   Heavy는 Detailed Design을 `prd.md`에 위임 가능.
6. **BOARD.md** — Now / Done / Ideas. 태스크별 진척은 `/go` 상태 기록에 위임.

초기화 완료 → `/go` [판정된 프리셋] 자동 진입.

### 표준 구조

```
docs/1-project/[name]/
  README.md          ← Rust RFC (필수)
  BOARD.md           ← Now / Done / Ideas (필수)
  prd.md             ← PRD (Heavy 필수)
  discussions/
  notes/
```

### 규모 판정

| 규모 | 기준 | 필수 |
|------|------|------|
| **Heavy** | 아키텍처 변경, 새 primitive | README + BOARD + PRD |
| **Light** | 기능, 리팩토링, 버그 | README + BOARD |

Default: Light. 필요 시 escalate.
