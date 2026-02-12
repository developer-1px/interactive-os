# Discussion Conclusion: 프로젝트 폴더 표준 구조

## Why

/project workflow가 만드는 프로젝트 폴더의 구조가 표준화되어 있지 않았다. os-core-refactoring과 create-module이 서로 다른 구조를 쓰고 있었고, 어떤 문서를 어떤 순서로 읽어야 하는지 불명확했다.

## Intent

프로젝트 문서의 표준 구조를 정의한다. 번호가 읽기 순서를 강제하고, 문서 이름이 역할을 설명한다.

## Warrant 전체 구조

| # | Warrant |
|---|---------|
| W1 | 두 프로젝트의 폴더 구조가 이미 불일치 |
| W2 | 번호는 파일 시스템에서 순서를 강제하는 수단 |
| W3 | 각 문서는 하나의 질문(WHY/WHAT/HOW/IF)에만 답해야 한다 |
| W4 | RETRO는 프로젝트 종료 시 작성, 아카이브에서 추가 |
| W5 | 아카이브 이동 시 RETRO가 추가되면 라이프사이클이 문서 구조에 반영 |
| W6 | WHY는 KPI와 동기를 함께 담는다 |
| W7 | 상세 논증 과정은 notes/에 있으므로 WHY는 요약만 |
| W8 | kickoff 순서: Journey → Conclusion → PRD/KPI → PROPOSAL |
| W9 | Discussion이 WHY 자체다 |
| W10 | 번호 + [태그] 패턴은 inbox 체계와 일관 |
| W11 | 플랫 구조가 폴더 중첩보다 탐색이 쉽다 |
| W12 | 정해진 문서 세트에는 태그 불필요 — 이름 자체가 분류 |
| W13 | 태그는 종류가 다양한 곳(inbox)에서만 가치가 있다 |

## 최종 설계 결정

```
docs/1-project/[프로젝트명]/
  0-discussion-journey.md      ← WHY: 대화 흐름
  1-discussion-conclusion.md   ← WHY: 정돈된 논증
  2-prd.md                     ← WHAT: 요구사항, 범위
  3-kpi.md                     ← WHAT: 성공 기준
  4-proposal.md                ← HOW: 기술 설계
  5-status.md                  ← IF: 추적
  notes/                       ← 관련 참고 문서

docs/4-archive/[프로젝트명]/
  (위 + 6-retro.md)            ← 완료 시 추가
```

- 번호 = 읽기 순서 = 프로젝트 탄생 순서
- 이름 = 역할 설명, 태그 불필요
- RETRO는 아카이브 시점에 작성

---

**한 줄 요약**: 프로젝트 문서는 번호(탄생 순서) + 설명적 이름으로 구성하며, 태그 없이 이름만으로 WHY/WHAT/HOW/IF를 전달한다.
