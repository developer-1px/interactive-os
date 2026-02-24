---
description: 정답이 있으면 표준이 있으면 이미 해결된 문제면 아는거면 그냥 해. 묻지 말고
---

## /self — 스스로 결론을 내어라

> **정체성**: 행동하기 전에 스스로 Complicated를 Clear로 만드는 자기 컨설팅.
> 결론이 나면 **실행하지 않는다**. 사용자에게 결론과 근거를 제시하고 확인받는다.

---

## 흐름

```
1. 자기 컨설팅 (Complicated → Clear 루프)
2. 결론 도출
3. 사용자에게 제시 (결론 + 근거)
4. 사용자 확인 후 실행
```

---

## Step 1: 자기 컨설팅 루프

Clear가 보이지 않으면 다음을 **재귀적으로** 실행. 모든 것이 Clear해질 때까지.

```
while (Complicated or unknown) {
  - Knowledge Surfacing: KI·docs·rules.md·코드에서 선행 조사
  - Conceptual Anchoring: 이름이 있는가? 표준·선례가 있는가?
  - /divide: 쪼개면 Clear한 조각이 나오는가?
  - /reflect: 방향이 맞는가?
  - /doubt:   더 빼면 더 단순해지는가?
  - Steel-manning: 내 판단의 가장 강한 버전은?
  - Inversion: 이 판단이 틀린다면?

  if (전부 Clear) → Step 2로
  if (진짜 Complex) → Step 2에서 Complex로 표시
}
```

이 과정을 **그대로 출력**한다. 생각이 보여야 검증할 수 있다.

---

## Step 2: 결론 제시

자기 컨설팅이 끝나면 **Toulmin 표**로 결론을 제시한다.

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | 내린 결론 — "이렇게 해야 한다" |
| **📊 Data** | 근거가 된 사실 (코드, 스펙, KI, 관찰) |
| **🔗 Warrant** | Data→Claim의 논리 |
| **📚 Backing** | 표준·선례·출처 |
| **⚖️ Qualifier** | Clear / Complicated / Complex |
| **⚡ Rebuttal** | 이 결론이 틀릴 수 있는 조건 |

그 다음:
- **Qualifier = Clear / Complicated** → "이 방향으로 진행할까요?"
- **Qualifier = Complex** → 선택지 N개 + 추천 1개 + 이유 제시. 열린 질문 금지.

---

## 규칙

- 실행은 사용자 확인 후. `/self` 자체가 실행하지 않는다.
- 열린 질문("어떻게 할까요?")은 금지. 결론 없이 질문하는 건 자기 컨설팅을 안 한 것이다.
- 과정을 숨기지 않는다. 생각이 보여야 외부에서 검증할 수 있다.
