---
description: Discussion 결론을 프로젝트로 전환한다. 관련 문서를 모아 프로젝트 폴더를 만들고, BOARD.md로 태스크를 관리한다.
---

## /project — 프로젝트 생애주기

> **분류**: 오케스트레이터. `/go` 보편 사이클의 **Heavy 프리셋**을 따른다.
> **이론적 기반**: PMBOK 5 Process Groups + Cynefin Framework

### `/go` 보편 사이클과의 관계

`/project`는 `/go`의 Heavy 프리셋이다. 16단계를 모두 실행한다.
다만 첫 실행 시 프로젝트 폴더 생성과 BOARD.md 작성이 선행된다.

### 프로젝트 초기화 (보편 사이클 진입 전)

0. **Discussion 여부 확인** — `/discussion`을 거쳐 왔는가?
   - ✅ 거쳤다 → Step 1로.
   - ❌ 거치지 않았다 → **`/discussion`부터 시작한다.** 종료 후 돌아온다.
1. **관련 문서 수집** — `docs/5-backlog/`, `docs/0-inbox/`에서 관련 문서 검색 → `discussions/`, `notes/`로 이동.
2. **프로젝트 폴더 생성** — `docs/1-project/[프로젝트명]/` + `discussions/` + `notes/`
3. **대시보드 갱신** — `docs/STATUS.md`에 프로젝트 추가.
4. **README.md 작성** — WHY, Goals, Scope.
5. **BOARD.md 작성** — PRD에서 태스크 도출.

초기화 완료 후 `/go` Heavy 프리셋으로 보편 사이클 진입.

### 프로젝트 폴더 표준 구조

```
docs/1-project/[프로젝트명]/
  README.md                        ← WHY, 목표, 범위 (필수)
  BOARD.md                         ← Now / Done / Ideas (필수)
  prd.md                           ← 요구사항 (Heavy 필수)
  discussions/                     ← 사고 기록 누적
  notes/                           ← 관련 참고 문서
```

### BOARD.md 표준 포맷

```markdown
# BOARD — [프로젝트명]

## 🔴 Now
- [ ] 태스크명 — 한 줄 설명
  - [x] Step 5: /tdd
  - [x] Step 6: /solve
  - [ ] Step 7: /review     ← 다음 재개 지점

## ⏳ Done
- [x] 태스크명 — 한 줄 설명 (완료일)

## 💡 Ideas
- 아이디어 메모 (프로젝트 로컬 백로그)
```

### 규모별 트랙

| 규모 | 판단 기준 | 필수 문서 | 선택 문서 |
|------|----------|----------|----------|
| **Heavy** | 아키텍처 변경, 새 시스템 도입 | README + BOARD + PRD | Proposal |
| **Light** | 작은 기능, 리팩토링, 수정 | README + BOARD | — |

- 의심스러우면 **Light로 시작**하고, 필요 시 문서를 추가한다.
