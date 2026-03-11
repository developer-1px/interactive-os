# Argumentation Reference

> 논증과 합의 도출에 사용하는 기법.

---

## Toulmin Argumentation Model

> 주장(Claim)을 6개 요소로 구조화하여 논증의 완성도를 보장하는 모델.

**출처**: Stephen Toulmin (The Uses of Argument, 1958, University of Cambridge)

| 요소 | 역할 | 질문 |
|------|------|------|
| **Claim** | 주장 | 우리가 도달한 결론은 무엇인가? |
| **Data** | 근거 | 이 결론을 뒷받침하는 사실은? |
| **Warrant** | 논거 | Data가 Claim을 지지하는 논리적 연결은? |
| **Backing** | 배경 | Warrant의 신뢰성을 뒷받침하는 학문적·산업적 근거는? |
| **Qualifier** | 한정어 | 이 주장의 확실성 수준은? (이 OS에서는 Cynefin 도메인으로 대체) |
| **Rebuttal** | 반론 | 이 주장이 틀릴 수 있는 조건은? |

**우리의 용법**: `/discussion`의 구조적 골격이자 산출물 포맷. 모든 discussion은 Toulmin 정석 표로 종료된다.

- **매 턴 수행**: Intent 추론 → Warrant 누적 → Gap 질문. 사용자의 발화 뒤에 숨겨진 Why를 추출하고, 논거를 누적하며, 주장의 숨겨진 전제(Enthymeme)를 질문으로 드러낸다.
- **Qualifier = Cynefin**: Toulmin의 한정어를 Cynefin 도메인(Clear/Complicated/Complex)으로 대체하여 `/discussion`의 exit 라우팅에 활용. Clear면 `/plan`으로, Complex면 계속 `/discussion`.
- **프로젝트 전환 시**: `/project`에서 Discussion Conclusion의 Toulmin 요소를 BOARD.md의 Context 섹션에 매핑 (Claim→요약, Data+Warrant→Before→After+논거, Rebuttal→Risks, Open Gap→Unresolved).

**누적 구조** (매 턴 끝):

| 요소 | 내용 |
|------|------|
| 📌 Current Intent | 현재 턴의 숨겨진 의도 |
| 🎯 Emerging Claim | 수렴 중인 결론 후보 |
| 📋 Warrants | W1, W2, W3... 누적 리스트 |
| 📎 References | 참조된 docs/ 경로 |
| ⚖️ Cynefin | Clear / Complicated / Complex |
| 🚀 Next | 다음 워크플로우 예측 |
| ❓ Complex Gap | 미해결 질문 (Complex일 때만) |

**Expert Toolkit** — `/discussion`에서 Toulmin과 함께 사용하는 보조 기법:

| 기법 | 트리거 |
|------|--------|
| Steel-manning | 사용자의 직관적 표현을 가장 강한 버전으로 재구성 |
| Conceptual Anchoring | 아이디어가 기존 이론과 공명할 때 출처 명시 |
| Inversion / Pre-mortem | 결론에 가까워졌을 때 역방향 검증 |
| Analogical Bridging | 추상적 문제를 구체적 비유로 전환 |
| Reframing | 논의가 한 관점에 고착됐을 때 시점 전환 |
| Tension Surfacing | 숨어있는 트레이드오프를 명시화 |

**참조**: `/discussion` 전체, `/project` Step 5 (BOARD.md 매핑), `/elicit` (암묵지 추출 후 명세화)
