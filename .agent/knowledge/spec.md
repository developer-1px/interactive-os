# SPECBOOK — Spec 지식베이스

> `/spec` 시작 시 읽는다. 종료 시 새 지식이 있으면 갱신한다.
> BDD 번역 패턴과 함정을 축적한다.

---

## 1. 알려진 좋은 패턴

| 패턴 | 설명 | 발견일 |
|------|------|--------|
| **Zone 체크 먼저** | spec 시작 시 "이 기능에 Zone이 있는가?" 확인. Zone 있으면 수직 분해 강제 | 2026-02-25 |
| **DT 소스 판정** | stories.md에 DT 있으면 참조, 없으면 spec에서 직접 작성. stories 부재 = DT 스킵 사유 아님 | 2026-03-08 |
| **DT행 → Scenario 1:1** | DT 한 행 = BDD Scenario 하나. 행 번호와 Scenario를 매핑 유지 | 2026-02-25 |
| **상태 인벤토리** | 구현될 상태(currentLocale, dropdownOpen 등)를 Spec에 명시. Green이 이걸 읽는다 | 2026-02-25 |
| **이관 프로젝트 행동 전수 추출** | Before 코드의 onClick/onAction/dispatch/useCallback을 grep하여 행동 목록을 먼저 만든다. 이것이 BDD 입력 | 2026-03-08 |
| **앱 고유 리트머스** | "앱 이름을 지워도 통과하면 OS 기본 동작". 앱 고유 시나리오 0개 = spec 부실 | 2026-03-08 |

## 2. 알려진 함정

| 함정 | 결과 | 대응 |
|------|------|------|
| **stories 없으면 DT 스킵** | stories.md가 없는 프로젝트에서 DT 전체 누락 → 앱 고유 행동 무명세 | stories 없으면 spec에서 DT 직접 작성 |
| **이관 프로젝트에서 행동 추출 안 함** | Before 코드를 안 읽고 BDD 작성 → role 기본 동작만 나열 (testbot-zift: 10개 중 2개만 커버) | Step 1 이관 게이트: 행동 전수 추출 필수 |
| **BDD를 구현 언어로 작성** | "useState로 관리한다" → OS 패턴 위반을 spec 단계에서 심음 | 사용자 행동과 화면 결과만 기술 |

## 3. 판정 선례

| 선례 | 결정 | 이유 | 날짜 |
|------|------|------|------|
| LocaleSwitcher spec | DT는 stories.md 참조, BDD 4 Scenarios만 작성 | DT 소유권 = Product | 2026-02-25 |
| **testbot-zift v1→v2** | v1: DT 없음, 앱 고유 0개, V1 커버 20%. v2: DT 3개, 앱 고유 8개, V1 커버 100% | 이관 게이트 + DT 필수가 누락을 구조적으로 방지 | 2026-03-08 |

---

## 갱신 방법
`/spec` 세션 종료 후:
- 새 Zone 분해 패턴 → §1 추가
- BDD 번역 실수 패턴 → §2 추가
