# Discussion: 검증 워크플로우 재설계 (reflect · premortem · redteam)

## Journey

**🧑 사용자**: `/reflect`가 더 있었으면 좋겠어. 제안서 단계에서는 제출 전 reflect는 필요하다 생각해. 그리고 redteam의 효용성에 대해서도 고민이 돼.

**🤖 AI**: 두 논점을 분리. `/reflect`는 제안서 직후 자동 삽입이 Known. `/redteam`은 같은 LLM이 공격+방어를 모두 수행하는 구조적 한계가 있어 Open으로 분류.

현재 검증 도구 3개(`/reflect`, `/redteam`, `/review`)의 경계가 모호하다는 분석 제시.

---

**🧑 사용자**: `/reflect`를 강화하기보다는 **횟수가 늘었으면** 좋겠어. 1회하고 2회했을 때 3회하고서야 너는 ok를 했거든.

**🤖 AI**: 핵심 통찰 — `/reflect`의 가치는 체크리스트 복잡도가 아니라 **반복 횟수**. 이번 세션 실증:

| 회차 | 발견건수 |
|------|---------|
| 1회 | 1건 |
| 2회 | 5건 |
| 3회 | 0건 (통과) |

해답: `/reflect`를 **수렴 루프**로 변경 — "새 발견 0건"이 탈출 조건. 이렇게 하면 `/redteam`의 90%를 자연 흡수.

---

**🧑 사용자**: `/redteam`은 외부의 관점이라고 생각하자. discussion은 나와 하는 건데 나도 외부의 시각이 필요해. redteam은 최대한 공격적으로 생각해보게 하고 관점을 생각해보게 하는 장치이지 **꼭 받아들이고 수정해야 하는 건 아니니까**. 이런 유사한 걸 redteam이 아닌 더 전문적인 용어가 있어?

**🤖 AI**: Known — **Pre-mortem** (Gary Klein). "이미 실패했다고 가정하고 원인을 역추적." 수정 의무 없는 사고 확장 도구. Devil's Advocate보다 구조화되어 있고, Critique보다 공격적.

| `/reflect` | `/premortem` |
|---|---|
| 수렴 (converge) | 발산 (diverge) |
| 수정 의무 있음 | 수정 의무 없음 |
| rules.md 기반 체크리스트 | "이미 실패했다. 왜?" |

---

**🧑 사용자**: 그러면 redteam은 내가 discussion 시 필요할 때마다 요청하는 자문 도구의 역할로 만들고 제안서 reflect 전 사고의 확장 단계로 `/premortem`을 만들까? 순서는 어떻게 생각해? 업계 표준이 있다면 따라가고.

**🤖 AI**: Known — Design Thinking의 **Double Diamond: Diverge → Converge**.

```
Draft → Pre-mortem(발산) → Reflect(수렴) → Submit
```

Pre-mortem이 먼저인 이유: reflect의 입력을 풍부하게 만들어줌. 표면적 체크리스트만 통과하는 걸 방지.

3개 도구의 최종 역할:

| 도구 | 성격 | 언제 | 의무 |
|------|------|------|------|
| `/premortem` | 발산 | 제출 전 자동 | 없음 |
| `/reflect` | 수렴 루프 | premortem 후 자동 | 위반 시 수정 |
| `/redteam` | 자문 | discussion 중 요청 시 | 참고용 |

---

## Conclusion

### Why
이번 세션에서 `/reflect`가 3회 반복되어야 실질적 검증이 완료되었다. 1회 reflect는 불충분하며, `/redteam`은 같은 LLM의 구조적 한계로 진정한 외부 관점을 제공하지 못한다.

### Intent
검증 워크플로우를 3단 구조로 재설계하여 역할 충돌을 없앤다:
- **Pre-mortem** (발산) — 사고 확장, 수정 의무 없음
- **Reflect** (수렴 루프) — 새 발견 0건까지 반복, 위반 시 수정
- **Redteam** (자문) — discussion 중 요청 시 외부 관점 시뮬레이션

### Warrants
1. W1. 이번 세션에서 `/reflect` 2회 반복이 5건 추가 발견 — 1회론 부족하다는 실증.
2. W2. `/redteam`은 같은 LLM이 공격+방어 → 구조적 한계.
3. W3. `/reflect`의 가치는 체크리스트 복잡도가 아니라 **반복 횟수**.
4. W4. 수렴 루프의 탈출 조건은 "새 발견 0건" — 명확하고 기계적.
5. W5. Pre-mortem(Gary Klein)은 "수정 의무 없는 사고 확장" — `/reflect`와 결정적 차이.
6. W6. Double Diamond 패턴: Diverge → Converge. Pre-mortem이 Reflect의 입력을 풍부하게 한다.
7. W7. 3개 도구 간 역할 충돌 없음: 자동/발산, 자동/수렴, 수동/자문.

### 한 줄 요약
> **Reflect를 수렴 루프로, Pre-mortem을 발산 도구로 신설하고, Redteam은 discussion 중 자문으로 재정의한다.**
