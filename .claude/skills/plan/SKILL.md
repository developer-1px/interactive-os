---
description: Clear 판정 후 실행 전 Task Map. 1턴 크기로 분해하고 현황판을 만든다.
---

## /plan — Task Map + 현황판

> **전제**: /discussion에서 Clear 도달 후, /project로 전략(BOARD.md Context)이 세워진 상태.
> **산출물**: Task Map (1턴 크기 태스크 + 의존 순서 + 현황판). BOARD.md의 Now 섹션에 반영.
> **원칙**: Task Map에 없는 것은 하지 않는다. Task Map에 있는 것은 전부 한다.

---

### Step 0: `/divide` 전제 확인

`/plan` 진입 전에 목표의 전제조건이 분해되어 있어야 한다.

1. 프로젝트 BOARD.md를 읽는다.
2. `/divide` 리포트가 존재하는가? (discussions/ 또는 BOARD에 Backward Chain 증거)
   - **있음** → Step 1로 진행.
   - **없음** → `/divide`를 먼저 실행한다. 완료 후 `/plan`에 재진입.

> `/divide`가 Goal→전제조건을 분해하고, `/plan`이 전제조건→Task Map으로 변환한다.
> 분해 없이 Task Map을 쓰면 누락이 발생한다.

### Step 1: 대상 전수 열거

코드베이스를 조사하여 변경 대상을 빠짐없이 나열한다.

- `grep`, `view_file` 등으로 Before 상태를 전수 파악
- 파일명:함수명 수준의 구체성 (모호한 설명 금지)

### Step 2: Task Map 작성

| # | Task | Before | After | 크기 | 의존 | 검증 | 상태 |
|---|------|--------|-------|------|------|------|------|
| 1 |      |        |       |      |      |      | ⬜   |

**열 규칙**:
- **Task**: 동사로 시작. "X를 Y로 변경", "Z 추출", "W 삭제"
- **Before**: 현재 시그니처, 위치, 동작을 코드 레벨로 기술
- **After**: 변환 후 시그니처, 위치, 동작을 코드 레벨로 기술
- **크기**: `S`(한 턴 확실) / `M`(한 턴 가능) / `L`(멀티턴 필요 → 더 쪼갠다)
  - S: 파일 1~2개, 함수 1~3개 수정
  - M: 파일 3~5개, 함수 5~10개 수정
  - L: 그 이상 → **L은 허용하지 않는다. S 또는 M까지 분해.**
- **의존**: `→#N` 형식. 없으면 `—`
- **검증**: `tsc 0`, `+N tests`, `기존 N tests 유지` 등 구체적
- **상태**: `⬜` 대기 / `🔄` 진행 중 / `✅` 완료 / `⛔` 막힘

### Step 3: 비-Clear 행 즉석 해소

Complicated 또는 Complex 행이 있으면:

1. 해당 행의 **After가 왜 확정되지 않는지** 1줄로 설명
2. AI의 **약식 제안**: "제 판단: [A안]. 이유: [근거]."
3. 미니 discussion으로 Clear까지 해소
4. 해소되면 표의 After와 Cynefin을 갱신

**L 크기 행은 무조건 분해한다.** L이 남아있으면 plan 미완성.

### Step 4: MECE 점검

```
1. CE: 모든 행을 실행하면 목표 달성? → 아니오 → 누락 행 추가
2. ME: 중복 행? → 예 → 병합
3. No-op: Before=After? → 예 → 제거
4. L 없음: 크기가 전부 S 또는 M? → 아니오 → Step 2로 돌아가 분해
```

### Step 5: BOARD.md 반영

Task Map을 BOARD.md의 **Now 섹션**에 반영한다:

```markdown
## Now
- [ ] T1: [Task 설명] — 크기: S, 의존: —
- [ ] T2: [Task 설명] — 크기: M, 의존: →T1
...
```

Task Map 전체(Before/After/검증 포함)는 notes에 저장:
- `docs/1-project/[name]/notes/YYYY-MMDD-HHmm-[plan]-slug.md`

### Step 6: 사용자 승인

전행 Clear + L 없음 상태의 Task Map을 제시한다. 승인 전까지 실행하지 않는다.

수정 요청:
- "N번 빠졌어" → Step 2로
- "N번 필요 없어" → 제거 후 재확인
- "N번 너무 커" → S/M으로 분해

승인 → `/go` 진입.
