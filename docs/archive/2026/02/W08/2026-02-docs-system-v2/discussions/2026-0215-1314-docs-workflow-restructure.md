# Journey: Docs & Workflow 구조 재설계

## 발단 — 세컨드 브레인 전문가 분석 요청

**🧑 사용자**: 세컨드 브레인과 업무 자동화 전문가로서 현재 우리의 docs 구성과 workflow를 분석해서 알려줘

**🤖 AI**: 전체 docs 구조(PARA+)와 33개 워크플로우를 5개 레이어(사고→구조화→실행→검증→기록)로 분류하여 분석함. 두 가지 Gap 발견:
1. `11-discussions/`에 25개 문서 체류 — self-pruning이 작동하는 건지, 고아 문서 누적인지?
2. `10-devnote`에 dev-log, til, changelog가 혼재 — 의도된 구조인지?

---

## 전환점 1 — 프로젝트가 과하다

**🧑 사용자**: Discussion 중 프로젝트로 승격할 것도 있고 순수 사고 정리도 있어. 그런데 "항상 승격은 하되, PRD/KPI 안 쓰고 아카이브해도 좋지 않을까?" **프로젝트가 지금 좀 과한가 싶기도 해.**

**🧑 사용자**: devnote는 daily/til이고, 하루를 마감하면서 개발자적 블로그/에세이 — 프로젝트와 무관하게 PARA 바깥에서 관리하려 했어.

**🤖 AI**: 핵심 직감을 포착. 프로젝트 규모 스펙트럼(Heavy/Medium/Light/Micro)이 있는데 현재 `/project`는 Heavy만 상정. 이 불일치가 Discussion 25개 체류의 근본 원인. devnote는 PARA와 별개의 "성찰 레이어" — 이 분리는 의도적이고 일관적.

---

## 전환점 2 — 프로젝트는 더 큰 단위여야 한다

**🧑 사용자**: 프로젝트의 더 큰 단위가 있고, 디스커션과 진행을 더 작은 단위로 관리하고 싶어.

**🤖 AI**: 이건 구조를 뒤집는 통찰. 현재 `focus-recovery`, `todo-v3-migration` 같은 것들은 사실 같은 "OS 안정화"라는 전략 아래의 작은 작업들. 프로젝트를 **전략적 컨테이너(Epic)**로 격상하고, 내부에 discussions/와 tasks/를 두는 구조를 제안. 3가지 스타일 제시:
- A) 폴더 기반 (tasks/ 폴더에 개별 파일)
- B) BOARD.md 싱글 파일 보드
- C) 하이브리드

---

## 전환점 3 — Discussion은 유일한 진입점, 5갈래 출구

**🧑 사용자**: 대부분의 시작은 디스커션으로 시작해. 현재 디스커션→프로젝트 단일 경로만 있는데, 기존 프로젝트의 세부 태스크로 가야 해. 매번 프로젝트를 새로 만드는 게 아니라 하나의 프로젝트 안에서 하위를 구성해야 해. 백로그는 뭐해야 할지 모를 때 펼쳐보면서 다시 디스커션으로 올라가는 거야.

**🤖 AI**: 핵심 발견 — **"Discussion → 기존 프로젝트 Task"** 경로가 빠져 있었음. 이것이 모든 것을 새 프로젝트로 분기시킨 원인. 전체 흐름을 재설계:
```
Discussion → 기존 프로젝트 Task / 기존 프로젝트 Discussion / 새 프로젝트 / Resource / Backlog
Backlog → "뭐하지?" → Discussion (순환)
```

---

## 결정 — 스타일 B, 이슈는 스테이징

**🧑 사용자**: 스타일 B(BOARD.md 싱글 파일)로 가자.

**🧑 사용자**: 이슈는 주로 버그 수정들. 요구사항보다는 발견된 버그나 단순 수정. 일단 모아두고 진행 끝나는 대로 완료, 프로젝트에 통합.

**🤖 AI**: 확정. 이슈 = 버그 스테이징 에어리어 (`0-issue/`). 수정 완료 후 관련 프로젝트 BOARD.md Done에 기록. Discussion(능동적 사고)과 Issue(반응적 수정)의 성격 차이를 명확히 구분.

---

**한 줄 요약**: Discussion을 유일한 진입점으로, Project를 전략적 컨테이너로, BOARD.md로 경량 태스크 관리를 하면, 과잉 프로젝트화와 Discussion 체류 문제가 구조적으로 해소된다.

---

# Conclusion: Docs & Workflow 구조 재설계

## Why

현재 docs & workflow 시스템은 PARA+ 방법론과 33개 워크플로우로 구성된 정교한 세컨드 브레인이지만, **프로젝트의 단위 불일치** 문제를 안고 있다.

`/project` 워크플로우가 모든 작업에 Heavy 프로세스(PRD, KPI, Proposal, Premortem)를 요구하고, Discussion에서 프로젝트로 가는 **단일 경로**만 존재해서, 작은 작업도 독립 프로젝트로 분기되고, Discussion은 승격 비용이 높아서 `11-discussions/`에 25개가 체류하게 되었다.

## Intent

프로젝트를 **전략적 컨테이너**(Epic)로 격상하고, Discussion을 **유일한 진입점**으로 유지하되 출구를 5갈래로 분기하여, 문서의 과잉 프로젝트화 문제를 구조적으로 해소한다.

## Warrant 구조

### 구조 관련
- W1. PARA+ 확장은 유효. `5-backlog/` 추가로 GTD의 Someday/Maybe 완성.
- W2. STATUS.md는 여전히 Single Source of Truth (hub-and-spoke).
- W3. `MIGRATION_MAP.md`로 컨텍스트 오염 방어 (유지).

### 프로젝트 재정의
- W4. Project = 전략적 컨테이너 (Epic). BOARD.md(싱글 파일)로 경량 태스크 관리.
- W5. PRD/KPI는 Heavy 프로젝트에서만 선택적 — 경량 트랙 도입.
- W6. Issue(`0-issue/`) = 버그 스테이징 에어리어. 수정 후 프로젝트 BOARD에 통합.

### Discussion 재설계
- W7. Discussion = 시스템의 유일한 진입점. 모든 것은 Discussion에서 시작.
- W8. Discussion 종료 시 5갈래 라우팅: 기존 프로젝트 Task / 기존 프로젝트 Discussion / 새 프로젝트 / Resource / Backlog.
- W9. `11-discussions/` 폐지. Discussion은 태어나자마자 귀속지가 결정된다.

### 백로그 & 성찰
- W10. Backlog = 순환점. 종착지가 아니라 "뭐하지?" 할 때 펼쳐서 Discussion으로 복귀하는 큐.
- W11. Known/Open 이분법은 시스템 전체의 코어 원칙 (유지).
- W12. devnote(`10-`) = PARA 독립 성찰 레이어. 변경 없음.

## 확정 구조

```
docs/
├── 0-inbox/         빠르게 비우는 임시 착지
├── 0-issue/         버그/단순수정 스테이징 (트리아지)
│   └── closed/
├── 1-project/       전략적 컨테이너 (장기적, Epic 수준)
│   └── [name]/
│       ├── README.md       WHY + 목표
│       ├── BOARD.md        Now / Done / Ideas
│       ├── discussions/    사고 기록 누적
│       └── notes/          참고 자료
├── 2-area/          지속적 관심 영역
├── 3-resource/      참고 자료, 읽을거리, 공부
├── 4-archive/       완료된 프로젝트 통째로
├── 5-backlog/       "뭐하지?" 대기열
├── 10-devnote/      daily, til (성찰 레이어)
├── STATUS.md        Single Source of Truth
└── MIGRATION_MAP.md 과거 패턴 사전
```

## 문서 생애주기

```
         ┌──────────── 5-backlog/ ◄──────────┐
         │ "뭐하지?" 하면 펼친다               │ 아직 아님
         ▼                                    │
    ┌──────────────┐                           │
    │  /discussion  │ ◄── 모든 것의 시작         │
    └──────┬───────┘                           │
           │ 결론                                │
     ┌─────┼─────┬──────────┬─────────┐        │
     ▼     ▼     ▼          ▼         ▼        │
  기존PJ  기존PJ  새PJ    Resource   Backlog ───┘
  Task   Disc.  (드물게)  (공부)
  추가    추가

    0-issue/ ──수정──→ 관련 프로젝트 BOARD.md Done
```

## 영향받는 워크플로우

| Workflow | 변경 사항 |
|----------|----------|
| `/discussion` | 종료 시 5갈래 라우팅 (현재: 2갈래) |
| `/project` | 경량화 — PRD/KPI 선택적, BOARD.md 도입, 하위 Task 구조 |
| `/para` | `11-discussions/` 폐지 반영, `5-backlog/` 추가 |
| `/status` | STATUS.md에 전략적 프로젝트 반영 |
| `/issue` | closed 이슈를 프로젝트 BOARD에 통합하는 단계 추가 |
| `/inbox` | 라우팅 대상에 `5-backlog/` 추가 |
| `/archive` | 프로젝트 통째로 아카이브 (discussions, BOARD 포함) |

## 한 줄 요약

**Discussion을 유일한 진입점으로, Project를 전략적 컨테이너로 격상하고, BOARD.md + Backlog + 5갈래 라우팅으로 문서의 과잉 프로젝트화 문제를 구조적으로 해소한다.**
