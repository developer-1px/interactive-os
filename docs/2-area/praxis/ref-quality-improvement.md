# 품질 개선 기법 레퍼런스

> 워크플로우와 규칙에서 참조되는 품질 개선 기법 5건의 정의·출처·용법.

---

## Lean 7 Muda (7가지 낭비)

> 가치를 창출하지 않는 7가지 활동: 과잉생산, 대기, 운반, 과잉가공, 재고, 동작, 결함. 이를 식별하고 제거하는 것이 Lean의 핵심.

**출처**: Taiichi Ohno, Toyota Production System (1978)
**우리의 용법**: `/doubt`의 "쓸모가 있나? 줄일 수 있나?"의 이론적 근거. 코드·문서·워크플로우에서 가치를 창출하지 않는 것을 식별한다. "모든 산출물은 부채다"(Project#8) — 존재하는 것은 정당화되어야 한다. `/retire`에서 superseded 문서를 제거하는 것은 "재고" 낭비의 제거.

| 낭비 유형 | 소프트웨어 대응 | 우리의 사례 |
|----------|---------------|------------|
| 과잉생산 | 안 쓰는 기능·문서 | `/doubt`로 식별 |
| 대기 | 느린 피드백 루프 | 순수함수→커맨드→E2E 순서 |
| 운반 | 불필요한 데이터 변환 | Transform 최소화 |
| 과잉가공 | 과도한 추상화 | Occam's Razor |
| 재고 | 죽은 코드·문서 | `/retire`, `/doubt` |
| 동작 | 반복 수작업 | 워크플로우 자동화 |
| 결함 | 버그, 잘못된 문서 | TDD, `/verify` |

**참조**: `doubt.md`, `retire.md`, `rules.md` Project#8

---

## Subtract (빼기의 힘)

> 문제 해결 시 "무엇을 추가할까?"보다 "무엇을 빼야 할까?"를 먼저 묻는다. 인간은 추가 편향(additive bias)이 있어 빼기를 간과한다.

**출처**: Leidy Klotz, *Subtract: The Untapped Science of Less* (2021)
**우리의 용법**: `/doubt`의 핵심 정신. "더 적게 할 수 없나?" "이거 없으면 어떻게 되나?" `/refactor`에서 리팩토링이 지표를 개선하지 않으면 하지 않는 이유. `eslint-disable` 줄이기, dead code 제거, 문서 퇴출 — 빼는 것이 추가보다 더 큰 개선일 수 있다.
**참조**: `doubt.md`, `refactor.md`

---

## KPT (Keep / Problem / Try)

> 회고 프레임워크. Keep(유지할 것), Problem(문제), Try(시도할 것)으로 분류하여 개선점을 도출한다.

**출처**: 일본 Agile 커뮤니티, Toyota Kata에서 파생
**우리의 용법**: `/retrospect`의 회고 형식. 세 관점(개발·협업·워크플로우)에서 각각 KPT를 작성한다. Keep은 `rules.md`에 원칙으로 승격, Problem은 `/issue`로 전환, Try는 다음 프로젝트에서 실험. `/archive`에서 프로젝트 완료 시 반드시 `/retrospect`를 먼저 실행하는 이유.
**참조**: `retrospect.md`, `archive.md`

---

## Conventional Comments

> 코드 리뷰 코멘트에 라벨(suggestion, issue, question, praise, nitpick, thought, chore)을 붙여 의도를 명확히 하는 규약.

**출처**: conventionalcomments.org (2019)
**우리의 용법**: `/review`에서 코드 리뷰 결과를 보고할 때 Conventional Comments 라벨을 사용한다. "이건 고쳐야 한다"(issue)와 "이건 취향이다"(nitpick)를 명시적으로 구분하여, 에이전트가 우선순위를 판단할 수 있게 한다.
**참조**: `review.md`

---

## Double-Loop Learning

> Single-loop: 행동을 수정한다 (오류 → 교정). Double-loop: 행동의 전제(mental model)를 수정한다 (오류 → 전제 재검토 → 새 행동). 근본적 개선은 double-loop에서만 일어난다.

**출처**: Chris Argyris, *Organizational Learning* (1978)
**우리의 용법**: `/retrospect`에서 KPT의 Problem이 반복되면 single-loop에 갇힌 것이다. "왜 같은 문제가 반복되나?"를 물어 전제를 재검토한다. `/elicit`에서 사용자의 암묵적 전제를 드러내는 것도 double-loop. `rules.md` 자체의 갱신(Working#9, 확증 편향 경계)이 double-loop의 제도화.
**참조**: `retrospect.md`, `elicit.md`, `rules.md` Working#9
