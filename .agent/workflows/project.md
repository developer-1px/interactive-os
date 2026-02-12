---
description: Discussion 결론을 프로젝트로 전환한다. 관련 문서를 모아 프로젝트 폴더를 만들고, 표준 문서를 작성한 뒤, /divide로 실행한다.
---

## Why — 이 workflow가 존재하는 이유

> "생각하는 단계"와 "실행하는 단계" 사이에 구조화된 전환점이 없으면,
> 왜 하는지, 뭘 하는지, 어떻게 하는지 없이 진행하게 된다.
> 프로젝트도 커맨드처럼 `(입력, 액션) → 측정 가능한 결과` 구조여야 한다.
> 이 workflow는 Discussion(발산)을 프로젝트(수렴)로 전환하는 구조화된 전환점이다.

## 프로젝트 폴더 표준 구조

```
docs/1-project/[프로젝트명]/
  0-discussion-journey.md        ← 대화 흐름 (Discussion Journey)
  1-discussion-conclusion.md     ← 정돈된 논증 (Discussion Conclusion)
  2-prd.md                       ← 요구사항, 범위, 시나리오
  3-kpi.md                       ← 성공 기준 (정량적 지표)
  4-proposal.md                  ← 기술 설계, 구현 전략
  5-status.md                    ← 진행 추적
  notes/                         ← 관련 참고 문서
```

- 번호 = 읽기 순서 = 프로젝트 탄생 순서 (WHY → WHAT → HOW → IF)
- 이름 = 역할 설명. 태그 불필요.
- 아카이브 시 `6-retro.md` 추가.

## Step 1: 관련 문서 수집

- `docs/0-inbox`, `docs/11-discussions` 등에서 프로젝트 주제와 관련된 문서를 검색한다.
- 관련 Discussion Conclusion/Journey가 있으면 이를 `0-`, `1-`로 배치.
- 기타 관련 문서는 `notes/`로 이동한다.

## Step 2: 프로젝트 폴더 생성

- `docs/1-project/[프로젝트명]/` 폴더를 만든다.
- Step 1에서 수집한 문서를 배치한다.

## Step 3: PRD 작성 (2-prd.md)

- Discussion 결론에서 요구사항을 추출한다.
- 배경, 목표, 범위(In/Out), 사용자 시나리오, 기술 제약을 포함한다.

## Step 4: KPI 작성 (3-kpi.md)

- 프로젝트의 성공 기준을 정량적으로 정의한다.
- 형식: 목표 지표, 현재 값, 목표 값, 측정 방법.

## Step 5: 제안서 작성 (4-proposal.md)

- PRD를 바탕으로 기술 설계 제안서를 작성한다.
- 구현 방향, 변경 범위, 리스크, 대안을 포함한다.
- 사용자에게 제안서를 리뷰 요청한다.

## Step 6: /divide 실행

- 제안서의 작업 항목을 `/divide` 방식으로 분해한다.
  - 🟢 **Known** (정답 있음) → AI가 바로 실행
  - 🟡 **Constrained** (선택지 있음) → AI가 트레이드오프를 제시, 사용자가 선택
  - 🔴 **Open** (의사결정 필요) → 사용자에게 질문

## Step 7: STATUS 초기화 (5-status.md)

- 진행 상태를 기록한다.
- 커밋 시 **커밋 해시 + changelog**를 진행 기록에 포함한다.
  - 형식: `| 날짜 | 이벤트 | 커밋 | changelog |`
  - changelog: 변경된 파일 목록과 핵심 변경 내용 요약
- 이후 `/status`로 추적 가능.

## 프로젝트 종료 — 커밋 & 아카이브

1. 변경 파일을 **커밋**한다.
2. `6-retro.md`를 작성하고, **changelog를 문서에 포함**한다:
   ```markdown
   ## Changelog
   | 커밋 | 내용 |
   |------|------|
   | `해시` | 커밋 메시지 — 변경 파일 요약 |
   ```
3. 프로젝트 폴더를 `docs/4-archive/YYYY/[프로젝트명]/`으로 이동한다.
4. 사용자에게 최종 리포트를 보고한다.
