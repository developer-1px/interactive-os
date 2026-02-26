# Problem Solving Reference

> 문제의 근본 원인을 찾고 해결하는 기법 모음.

---

## 5 Whys / Root Cause Analysis (RCA)

> 증상에서 출발하여 "왜?"를 반복 질문하며 근본 원인까지 파고드는 분석 기법.

**출처**: Toyota Production System (Taiichi Ohno, 1950s), Lean Manufacturing

**우리의 용법**: `/solve` Step 1의 핵심 도구. 코드를 한 줄 수정하기 전에 RCA & Cynefin Assessment를 출력해야 한다 (Working #13: "산출물 없이는 다음 단계로 갈 수 없다"). `/why`에서 막혔을 때 증상→근본 원인을 최소 3회, 최대 5회 추적. `/blueprint` Section 2(Why)에서도 변경의 근본 원인 식별에 사용. `/solve`의 Complexity Guard에서는 메타 적용: 문제 정의 자체에 5 Whys를 적용하여 문제를 재구성.

**참조**: `/solve` Step 1, `/why` Step 3, `/blueprint` Section 2, `.agent/rules.md` Working #13

---

## 8D Problem Solving

> 8단계(D1~D8) 구조로 문제를 등록→분류→진단→계획→수정→검증→종료하는 체계적 해결 프로세스.

**출처**: Ford Motor Company (1987, Team Oriented Problem Solving)

**우리의 용법**: `/issue` 파이프라인의 구조적 골격. D1(등록) → D2(Triage: P0~P3) → D3(Diagnose: 코드 수정 없이 원인 분석) → D4(Plan: 문서로 설계) → D5(Red Table: 결정 테이블에 누락 행 추가) → D6(Red Test) → D7(Green) → D8(Verify) → D9(Close). 각 단계에 게이트가 있어 건너뛰기를 방지한다. "D4를 건너뛰고 D5/D6으로 가는 것은 금지."

**참조**: `/issue` Pipeline

---

## Scientific Debugging

> 버그를 과학적 방법론(가설→실험→관찰→결론)으로 접근하는 디버깅 기법.

**출처**: Andreas Zeller (Why Programs Fail, 2005)

**우리의 용법**: `/issue`의 이론적 기반 중 하나. D3(Diagnose) 단계에서 코드를 수정하지 않고 원인을 분석할 때 적용. Inspector 로그가 있으면 Diff/Effects 패턴을 분석하고, 없으면 재현 시나리오를 직접 실행하여 Diff 흐름을 추적한다. "왜 깨졌는지"를 모르면 또 깨진다 (Working #2).

**참조**: `/issue` D3 (Diagnose), `.agent/rules.md` Working #2

---

## Falsifiability (반증 가능성)

> 과학적 이론은 반증 가능해야 한다. 어떤 관찰 결과가 이론을 틀렸다고 증명할 수 있는지가 이론의 과학성을 결정한다.

**출처**: Karl Popper (The Logic of Scientific Discovery, 1934)

**우리의 용법**: `/issue`의 원칙 #1. "수정 완료의 증거는 Red→Green→Revert-Red 3점 세트뿐이다." Revert-Red 단계가 반증 가능성의 구현: 수정을 되돌렸을 때 테스트가 다시 실패하는가? 실패하지 않는다면 그 테스트는 수정을 검증하지 못하고 있는 것이다. 검증 #17의 "증명 없이 수정만 했으면 현황 보고로 종료"도 이 원칙의 적용.

**참조**: `/issue` 원칙 #1, `.agent/rules.md` 검증 #17

---

## TOC — Theory of Constraints (제약 이론)

> 시스템의 성과는 가장 약한 고리(제약)에 의해 결정된다. 제약을 식별하고 해소하는 것이 개선의 핵심이다.

**출처**: Eliyahu M. Goldratt (The Goal, 1984)

**우리의 용법**: `/blueprint` 워크플로우의 이론적 기반. "코드를 한 줄 수정하기 전에, 문제를 완전히 이해하고 설계를 마친다." TOC의 5가지 Thinking Process 도구(CRT, EC, FRT, PRT, NBR)와 Transition Tree가 `/blueprint`의 7개 섹션에 1:1 매핑된다. 아래 6개 도구가 세부 기법.

**참조**: `/blueprint` 전체

---

## CRT — Current Reality Tree (현재 현실 나무)

> 현재 시스템의 바람직하지 않은 효과(UDE)들을 나열하고, 인과 관계로 연결하여 핵심 원인을 찾는 도구.

**출처**: Eliyahu M. Goldratt (TOC Thinking Process)

**우리의 용법**: `/blueprint` Section 1(Goal)과 Section 2(Why)에 매핑. Section 1에서 현재 상태의 UDE를 나열하고 최종 도달 상태를 정의한다. Section 2에서 rules.md와 프로젝트 원칙에 의거하여 근본 원인(Root Cause)을 식별한다. 근거 없는 변경은 여기서 기각.

**참조**: `/blueprint` Section 1 "Goal — (CRT: Undesirable Effects → Goal)", Section 2 "Why — (CRT: Root Cause Analysis)"

---

## EC — Evaporating Cloud (증발 구름)

> 표면적 딜레마 뒤의 숨은 전제(assumption)를 찾아, 전제를 무효화함으로써 딜레마를 해소하는 도구.

**출처**: Eliyahu M. Goldratt (TOC Thinking Process)

**우리의 용법**: `/blueprint` Section 3(Challenge)에 매핑. 표면적 Goal 뒤의 숨은 충돌(Hidden Conflict)을 분석한다. 전제를 하나씩 나열하고 "정말 그런가?" 질문. 무효화할 수 있는 전제를 찾으면 진짜 Goal이 드러난다. "더 단순한 해법은 없는가? 안 하는 것이 답은 아닌가?"

**참조**: `/blueprint` Section 3 "Challenge — (EC: Evaporating Cloud)"

---

## FRT — Future Reality Tree (미래 현실 나무)

> 해결책을 적용한 후의 바람직한 상태를 구체적으로 기술하고, 부정적 분기(Negative Branch)를 사전에 식별하는 도구.

**출처**: Eliyahu M. Goldratt (TOC Thinking Process)

**우리의 용법**: `/blueprint` Section 4(Ideal)에 매핑. 해결 완료 후의 바람직한 상태를 UX/DX 관점에서 시나리오로 기술. 부정적 분기가 있으면 함께 기록하여 NBR(Section 6)의 입력으로 사용.

**참조**: `/blueprint` Section 4 "Ideal — (FRT: Future Reality Tree)"

---

## PRT — Prerequisite Tree (전제 조건 나무)

> 목표 달성에 필요한 모든 전제 조건과 장애물을 식별하고, 장애물 해소 순서를 결정하는 도구.

**출처**: Eliyahu M. Goldratt (TOC Thinking Process)

**우리의 용법**: `/blueprint` Section 5(Inputs)에 매핑. Ideal에 도달하기 위해 필요한 모든 입력을 나열: 관련 파일, 모듈, 패턴, 지식, 외부 레퍼런스, rules, PRD, 기존 구현. 필요하지만 아직 없는 것도 명시.

**참조**: `/blueprint` Section 5 "Inputs — (PRT: Prerequisite Tree)"

---

## NBR — Negative Branch Reservation (부정적 분기 예약)

> 해결책이 의도치 않은 부작용을 일으킬 가능성을 사전에 식별하고, 보호책을 마련하는 도구.

**출처**: Eliyahu M. Goldratt (TOC Thinking Process)

**우리의 용법**: `/blueprint` Section 6(Gap)에 매핑. 현재 인프라 대비 MECE 갭 분석: Have(지금 있는 것) vs Need(Ideal에 필요한 것) vs Gap(차이). 각 Gap에 영향도(High/Med/Low)와 의존 관계를 표시. FRT에서 식별한 부정적 분기를 여기서 구체적 갭으로 변환.

**참조**: `/blueprint` Section 6 "Gap — (NBR: Negative Branch Reservation)"

---

## TT — Transition Tree (전환 나무)

> 현재 상태에서 목표 상태로 이동하는 구체적 실행 단계를 순서대로 기술하는 도구.

**출처**: Eliyahu M. Goldratt (TOC Thinking Process)

**우리의 용법**: `/blueprint` Section 7(Execution Plan)에 매핑. Gap을 `/divide` 방식으로 분해하여 실행 순서를 설계한다. 각 Gap에 Cynefin 도메인을 판단하고, Clear/Complicated는 바로 실행 단위로, Complex는 추가 분해 또는 실험(Probe)으로 설계. 결과물은 순서가 매겨진 실행 항목 목록.

**참조**: `/blueprint` Section 7 "Execution Plan — (TT: Transition Tree → /divide)"
