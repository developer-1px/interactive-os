---
description: Discussion 결론을 프로젝트로 전환한다. scaffold 후 `/go` Phase 1(숙지)로 진입한다.
---

## /project — 프로젝트 생애주기

> **분류**: 오케스트레이터. `/go` 진입 라우터.
> **진입점**: `/discussion` 종료 → "새 프로젝트" 판정 시 자동 전환.

### 라우팅

```
/project
  ├─ discussion 미완료 → /discussion 진입 → 완료 후 /project 재진입
  └─ discussion 완료 → 규모 판정 → scaffold → /go Phase 1(숙지) 자동 진입
```

### 초기화

0. **Discussion 판정** — 미완료 시 `/discussion` 진입. 완료 후 재진입.
1. **규모 판정** — Heavy / Light 결정.
2. **문서 수집** — `docs/0-inbox/`, `docs/5-backlog/`, `docs/4-archive/` 탐색 → `discussions/`, `notes/`로 이동.
3. **Scaffold** — `docs/1-project/[name]/` 표준 구조 생성.
4. **등록** — `docs/STATUS.md`에 프로젝트 추가.
5. **BOARD.md** — Discussion Conclusion(Toulmin)을 Context에 매핑하여 작성:

   | Toulmin (Discussion) | → | BOARD Section |
   |---------------------|---|---------------|
   | 🎯 Claim | → | **Context**: 한 줄 요약 |
   | 📊 Data + 🔗 Warrant | → | **Context**: Before→After + 핵심 논거 |
   | 📚 Backing | → | **Context**: 선례 (있으면) |
   | ⚡ Rebuttal | → | **Context**: Drawbacks / Risks |
   | ❓ Open Gap | → | **Unresolved** |
   | ⚖️ Qualifier | → | 규모 판정 입력 |

   Heavy는 상세 설계를 `prd.md`에 위임.

### BOARD.md 표준 포맷

```markdown
# project-name

## Context

Claim: [Discussion에서 도달한 결론]

Before → After: [핵심 변경 한눈에]

Risks: [Rebuttal에서 온 위험/단점]

## Now
- [ ] T1: description

## Done
- [x] T1: description — tsc 0 | +N tests | build OK ✅

## Unresolved
- [Discussion의 Open Gap에서 온 미해결 질문]

## Ideas
- [미래 아이디어]
```

**DoD (Definition of Done)**: Done 항목에는 반드시 증빙을 포함한다.
증빙 없이 `✅`만 찍는 것은 금지.

| 증빙 패턴 | 예시 |
|-----------|------|
| 코드 변경 | `tsc 0 | +13 tests | build OK` |
| 문서 변경 | `N개 파일 갱신` |
| 워크플로우 변경 | `N개 워크플로우 수정, 검증 완료` |

### 표준 구조

```
docs/1-project/[name]/
  BOARD.md           ← Context + Now/Done/Unresolved/Ideas (필수)
  prd.md             ← PRD (Heavy 필수)
  discussions/
  notes/
```

### 규모 판정

| 규모 | 기준 | 필수 |
|------|------|------|
| **Heavy** | 아키텍처 변경, 새 primitive | BOARD + PRD |
| **Light** | 기능, 리팩토링, 버그 | BOARD |

Default: Light. 필요 시 escalate.

규모 판정은 `/go` Phase 2 깊이에 영향한다:
- **Heavy**: Phase 2 전체 필수 (divide + blueprint + naming + tdd + reflect)
- **Light**: /divide만 필수, 나머지 선택

초기화 완료 → `/go` Phase 1(숙지) 자동 진입.
