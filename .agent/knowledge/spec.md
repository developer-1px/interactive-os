# SPECBOOK — Spec 지식베이스

> `/spec` 시작 시 읽는다. 종료 시 새 지식이 있으면 갱신한다.
> BDD 번역 패턴과 함정을 축적한다.

---

## 1. 알려진 좋은 패턴

| 패턴 | 설명 | 발견일 |
|------|------|--------|
| **Zone 체크 먼저** | spec 시작 시 "이 기능에 Zone이 있는가?" 확인. Zone 있으면 수직 분해 강제 | 2026-02-25 |
| **DT는 참조, BDD만 여기서** | DT는 `6-products/stories.md`에 있다. spec은 DT를 읽어서 Given/When/Then으로 번역만 | 2026-02-25 |
| **DT행 → Scenario 1:1** | DT 한 행 = BDD Scenario 하나. 행 번호와 Scenario를 매핑 유지 | 2026-02-25 |
| **상태 인벤토리** | 구현될 상태(currentLocale, dropdownOpen 등)를 Spec에 명시. Green이 이걸 읽는다 | 2026-02-25 |

## 2. 알려진 함정

| 함정 | 결과 | 대응 |
|------|------|------|
| **DT를 spec에서 새로 작성** | Product 자산(`6-products/`)에 있어야 할 DT가 Playground(`1-project/`)에 묻힘 | DT는 stories.md 참조만 |
| **BDD를 구현 언어로 작성** | "useState로 관리한다" → OS 패턴 위반을 spec 단계에서 심음 | 사용자 행동과 화면 결과만 기술 |

## 3. 판정 선례

| 선례 | 결정 | 이유 | 날짜 |
|------|------|------|------|
| LocaleSwitcher spec | DT는 stories.md 참조, BDD 4 Scenarios만 작성 | DT 소유권 = Product | 2026-02-25 |

---

## 갱신 방법
`/spec` 세션 종료 후:
- 새 Zone 분해 패턴 → §1 추가
- BDD 번역 실수 패턴 → §2 추가
