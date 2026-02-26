# Discussion: 2-area/ 지식 영역 재설계

> 2026-02-26

---

## Journey

**🧑 사용자**: docs/area를 지식의 영역으로 개선하고 싶어.

**🤖 AI**: 현재 2-area/ 21개 파일 중 워크플로우에서 참조되는 것이 사실상 없다. official/이 살아있는 지식의 거처가 되면서 2-area/의 인큐베이터 역할이 형해화됨. 이전 docs-topology 프로젝트에서 이미 진단: "2-area/는 소스코드 미러 + Johnny.Decimal + PARA의 혼합체로 정체성 불분명" (W14).

---

**🧑 사용자**: 도메인적 지식이 아니라 LLM이 일하는 방식에 대한 체계가 되었으면 좋겠어.

**🤖 AI**: 현재 지식 배치에서 빠진 계층을 발견. official/ = 시스템 지식, workflows/ = 절차, CLAUDE.md = 규칙. 빠진 것 = "왜 이렇게 판단하는가"의 사고 프레임워크. Cynefin, Toulmin, Red Team 등이 워크플로우 안에 절차와 뒤섞여 재사용 불가.

---

**🧑 사용자**: resource에는 변하지 않는 실존 지식을 담고, area에는 LLM이 일하는 방식을 계속 갱신하는 Living Document를 원함. workflow는 행동이면 area는 고민하는 것. 회고나 discussion 중에 나오는 일하는 방식에 대한 기록.

**🤖 AI**: 핵심 구분 발견:
- 3-resource/ = 불변 외부 지식 ("Toulmin이란 이것이다")
- 2-area/ = 진화하는 실천 지혜 ("Toulmin을 쓰면서 알게 된 것")
- workflows/ = 절차 ("Step 1: Intent 추론")
Chris Argyris의 Double-Loop Learning: 규칙을 따르는 것(single-loop) vs 규칙을 진화시키는 것(double-loop). 2-area/는 double-loop의 기록.

---

**🧑 사용자**: discussion 결론 중 project가 아닌 것들, 회고시 알게 되는 것들, 내가 이따금씩 말하는 철학, LLM 판단 교정 — 이런 것들이 흘러들어가는 곳.

**🤖 AI**: 4개 입구 식별. 특히 "LLM 판단 교정" — 사용자가 "아니야 그건 이래"라고 할 때가 암묵지→명시지 전환의 핵심 순간인데, 현재 대화와 함께 휘발됨.

---

**한 줄 요약**: 2-area/를 official 중복 인큐베이터에서, "일하면서 축적되는 실천 지혜(praxis)"의 Living Document로 정체성 전환한다.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **Claim** | 2-area/를 "LLM의 실천 지혜(praxis)" 저장소로 재정립한다. 현재 파일은 official/resource/archive로 분배하고, 회고·discussion·판단교정에서 나오는 작업 방법론을 수집하여 Living Document로 채운다 |
| **Data** | ① 현재 21개 파일 중 워크플로우에서 참조되는 것 0개 ② official/과 광범위한 주제 중복 ③ 사고 프레임워크가 워크플로우 절차 안에 묻혀 재사용 불가 ④ LLM 판단 교정이 대화와 함께 휘발 |
| **Warrant** | W1. 읽히지 않는 문서 = 존재하지 않음 / W2. official=시스템, resource=FE도메인, area=방법론으로 삼분 / W3. 프레임워크가 절차에 묻혀 재사용 불가 / W4. CLAUDE.md 한 줄로는 "왜"를 전달하기 부족 / W5. resource=외부도메인, area=내부메타인지 / W6. workflow=절차, 빠진것="왜 이렇게 하는가" / W7. 판단 교정 순간이 암묵지→명시지 전환 핵심인데 휘발 / W8. MEMORY.md는 flat 200줄 한계 / W9. 현재 2-area/는 전부 정리 대상 |
| **Qualifier** | Complicated — 방향 명확, 실행은 분석+정리 |

### 지식 계층 최종 정의

| 계층 | 성격 | 변화 | 비유 |
|------|------|------|------|
| `CLAUDE.md` | 규칙 — "하라" | 드물게 | 헌법 |
| `official/` | 시스템 지식 — "이것이다" | 덮어쓰기 | 교과서 |
| `2-area/` | 실천 지혜 — "왜 이렇게 하게 됐는가" | 계속 갱신 | 팀 위키 |
| `3-resource/` | 외부 지식 — "세상에 이런 게 있다" | 불변 | 참고문헌 |
| `workflows/` | 절차 — "이렇게 해라" | 간헐적 | 체크리스트 |

### 4개 입구

1. Discussion 결론 중 프로젝트가 아닌 방법론 발견
2. /retrospect 교훈 중 "일하는 방식"에 대한 것
3. 사용자가 이따금 말하는 철학/원칙
4. LLM 판단 교정 (암묵지→명시지 전환)
