# Discussion Journey: 프로젝트 폴더 표준 구조

---

**🧑 사용자**: project의 구조

**🤖 AI**: 현재 create-module(KPI/PRD/PROPOSAL/STATUS)과 os-core-refactoring(0-SPEC/1-PROPOSAL/2-STATUS/3-RETRO)이 다른 구조. 표준 정의가 필요한 건지?

---

**🧑 사용자**: 번호를 붙이는 건 파일구조에서 순서를 정하는 것이고, 순서대로 읽기 위해 why what how if에 대응되는 문서가 있도록 해야 해.

**🤖 AI**: `0-WHY.md → 1-WHAT.md → 2-HOW.md → 3-IF.md` 구조 제안.

---

**🧑 사용자**: RETRO는 프로젝트가 끝나면 아카이브로 넘기면서 쓰면 되지.

**🤖 AI**: 진행 중 4개 문서, 아카이브 시 RETRO 추가로 5개.

---

**🧑 사용자**: WHY에 들어가야 할 건 뭘까?

**🤖 AI**: 5 Whys + KPI + Discussion 참조?

**🧑 사용자**: Discussion이야. Journey가 먼저, 그리고 정돈된 Discussion, 그리고 PRD KPI PROPOSAL까지가 첫 kickoff야.

**🤖 AI**: kickoff 순서 자체가 문서 구조. WHY를 폴더로?

---

**🧑 사용자**: 굳이 WHY라고 쓸 필요 없어. 순서대로 번호를 붙이자.

**🤖 AI**: `0-discussion-journey.md, 1-discussion-conclusion.md, 2-prd.md, ...` — inbox 태그체계와 일관성.

**🧑 사용자**: WHY WHAT HOW IF가 굳이 필요할까?

**🤖 AI**: 이름이 이미 말해주니까 불필요. P6 — 이름은 법이다.

**🧑 사용자**: 그래, 번호를 무슨 순서로 매겨야 하나에 대한 나의 대답이었지.

---

**한 줄 요약**: 프로젝트 문서 번호 순서는 WHY→WHAT→HOW→IF이지만, 태그 없이 문서 이름(discussion-journey, prd, proposal 등)만으로 충분하다.


---

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
