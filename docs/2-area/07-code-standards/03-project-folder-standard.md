# 프로젝트 폴더 문서 표준

> `docs/1-project/<project-name>/` 내부 파일 생성 규칙

## 표준 구조

```
project-name/
├── 0-discussion-journey.md    ← WHY: 발견 과정 (논증 여정)
├── 1-discussion-conclusion.md ← WHY: 결론 (확정 논거)
├── 2-prd.md                   ← WHAT: 요구사항 정의
├── 3-kpi.md                   ← IF: 성공 측정 기준
├── 4-proposal.md              ← HOW: 기술 제안서
├── 5-status.md                ← 진행 상황 추적
└── notes/                     ← 부속 분석·메모 (번호 없음)
```

## 번호 의미

| 번호 | 역할 | 질문 |
|------|------|------|
| 0-1 | Discussion | **WHY** — 왜 이 프로젝트가 필요한가? |
| 2 | PRD | **WHAT** — 무엇을 만드는가? |
| 3 | KPI | **IF** — 어떻게 성공을 측정하는가? |
| 4 | Proposal | **HOW** — 어떻게 구현하는가? |
| 5 | Status | 현재 어디까지 왔는가? |

> **WHY → WHAT → IF → HOW** 순서는 의도적이다. "어떻게"보다 "왜"와 "무엇"이 먼저 정의되어야 한다.

## 네이밍 규칙

- 파일명: `N-role.md` (소문자 kebab-case)
- notes/ 하위: inbox 형식 또는 자유 형식

## 예외 허용

`os-core-refactoring` 등 표준 확립 이전의 프로젝트는 기존 네이밍을 유지한다. 신규 프로젝트는 반드시 이 표준을 따른다.

## 관련 워크플로우

- `/project` — 이 표준에 따라 프로젝트 폴더를 자동 생성
- `/discussion` — 0, 1번 문서를 생성
- `/divide` — notes/ 하위에 분석 문서 생성
