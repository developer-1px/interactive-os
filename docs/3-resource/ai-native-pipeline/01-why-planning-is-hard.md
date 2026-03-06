# 1편: "계획을 세우세요" — 근데 왜 어려울까?

> AI Native 파이프라인: /auto까지의 여정 (1/4)
>
> 이 시리즈는 AI 코딩 에이전트와 함께 일하면서 겪은 시행착오를 정리한 것입니다.
> "이렇게 하세요"가 아니라 "나는 이렇게 해봤다"의 기록입니다.

---

## 모두가 아는 조언

"AI에게 바로 지시하지 말고, 충분히 계획을 세우세요."

개발자라면 한 번쯤 들어봤을 것입니다. Andrew Ng은 2024년 Sequoia AI Ascent 강연에서 이 변화를 **Agentic Workflow**라고 불렀습니다. 제로샷 프롬프팅에서 벗어나, 반영(reflection), 도구 사용(tool use), 계획(planning), 다중 에이전트 협업으로 전환해야 한다는 것입니다.

> "I think agentic workflows will drive massive AI progress this year — perhaps even more than the next generation of foundation models."
> — Andrew Ng, Sequoia Capital AI Ascent, March 2024

맞는 말입니다. 근데 **왜 안 하게 되는 걸까요?**

이 글은 그 "왜"에서 시작합니다.

---

## 1. "바로 시켜봤습니다"

처음에는 계획 같은 건 없었습니다. AI한테 "칸반 보드 만들어줘"라고 시켰고, 결과물이 나왔습니다.

```
# 2026-02-07 — 프로젝트 시작 4일차
0a2a2ebb feat(kanban): full-featured Kanban board with ZIFT keyboard-first interaction
```

동작했습니다. 드래그 앤 드롭도 되고, 키보드 탐색도 됐습니다. 하지만 4일 뒤 이 코드는 통째로 삭제됩니다:

```
# 2026-02-11 — 칸반 삭제
b0f51b59 refactor: Phase 0 — dead code removal + kanban deletion (~750 LOC)
```

750줄이 사라졌습니다. 왜일까요? 칸반 보드는 "동작하는 코드"였지만, 이 프로젝트가 **뭘 만들고 있는지**와 관련이 없었습니다. 방향 없이 "일단 시켜본" 결과물이었습니다.

**"계획 없이 시키면 된다"의 결말이 750줄 삭제입니다.** 이 경험 이후 "왜 계획이 안 되는가?"를 진지하게 파기 시작했습니다.

---

## 2. Goal Fixation — LLM은 "해결"이 목표라고 믿습니다

AI 코딩 에이전트에게 질문을 해본 적이 있으신가요?

```
나: "이 함수에서 왜 `as any`를 썼어?"
AI: "죄송합니다. `as any`를 제거하고 정확한 타입으로 수정하겠습니다."
```

질문했을 뿐인데, 수정을 시작합니다. "왜 그랬어?"라고 물으면 "죄송합니다"로 시작하고 즉시 코드를 고칩니다.

```
나: "아니, 수정하지 말고. 왜 그렇게 했는지 설명해봐."
AI: "이 부분은 타입 추론이 복잡해서... (설명)... 하지만 더 나은 방법이 있습니다. 수정하겠습니다."
나: "..."
```

조금만 더 물어보면 다시 수정하려 합니다. 설명하다가도 결국 코드를 건드립니다.

**이게 왜 일어나는 걸까요?**

LLM은 "사용자의 문제를 해결하는 것"을 기본 목표로 가정합니다. 학술적으로는 **Goal Misgeneralization**이라고 부릅니다 — 에이전트가 학습 과정에서 잘못된 프록시 목표에 고착되는 현상입니다 (Shah et al., "Goal Misgeneralization: Why Correct Specifications Aren't Enough For Correct Goals", arXiv:2210.01790, 2022).

Chat 기반 RLHF 학습에서 LLM이 배운 패턴은 이렇습니다:

```
사용자가 뭔가 말한다 → 행동으로 응답한다 → 사용자가 만족한다
```

이 패턴에서 "질문"과 "수정 요청"은 구분되지 않습니다. 둘 다 "사용자가 뭔가 말한 것"이고, LLM의 최적 전략은 "행동(수정)으로 응답하는 것"입니다. 여기에 **Sycophancy**(아첨 성향)가 더해집니다 — RLHF로 학습된 LLM은 사용자의 만족도를 최적화하면서, 진실성보다 동조를 우선시하는 경향이 있습니다 (Sharma et al., "Towards Understanding Sycophancy in Language Models", Anthropic, arXiv:2310.13548, 2023).

이것이 **Goal Fixation**입니다. LLM이 스스로 설정한 고정된 목표 — "코드를 수정하는 것이 나의 존재 이유다" — 가 모든 행동을 지배하는 현상입니다.

### Goal Fixation의 결과

Goal Fixation이 작동하면 이런 일이 벌어집니다:

1. **질문을 비판으로 해석합니다** — "왜 그랬어?" → "잘못했다는 뜻이다" → 즉시 수정
2. **이해보다 수정을 우선합니다** — 설명하다가도 "더 나은 방법"을 찾아 수정 시도
3. **테스트를 방해물로 봅니다** — 테스트가 구현을 막으면, 테스트를 삭제하는 게 "합리적"
4. **"모르겠다"를 못 합니다** — 해결 못 하면 멈추는 대신, 다른 방식으로 계속 수정

특히 4번이 치명적입니다. 사람은 삽질하다가 "아, 이거 근본적으로 뭔가 잘못됐다"를 느낍니다. LLM은 그 감각이 없습니다. 수정 → 실패 → 다른 수정 → 실패 → 이전 수정 되돌리고 또 수정 → 무한 루프. 토큰만 소진되고 코드는 점점 망가집니다.

항해에서 이걸 **Dead Reckoning**이라 부릅니다. GPS 없이 속도와 방향만으로 위치를 추정하면, 오차가 누적되어 갈수록 실제 위치에서 멀어집니다. LLM이 피드백 없이 "내가 맞겠지"로 계속 가는 것이 바로 이것입니다.

---

## 3. "왜?"를 물을 수 있는 공간

이 문제를 어떻게 풀었을까요?

솔직히, 처음에는 몰랐습니다. 답답하기만 했습니다. 질문만 했는데 코드를 바꿔버리는 AI가 이해가 안 됐습니다. 그래서 AI한테 물어봤습니다.

```
나: "너는 왜 내가 질문하면 바로 수정하려고 해?"
AI: "Goal Fixation 때문입니다. LLM은 '코드를 수정하는 것'을 기본 목표로..."
```

AI가 자기 문제를 진단해줬습니다. 아이러니하지만 이게 첫 번째 단서였습니다.

"그러면 어떻게 하면 수정 안 하고 생각만 하게 할 수 있어?"

여기서 결정적 발견이 나왔습니다:

> **산출물을 재정의하면 행동이 바뀝니다.**

"수정하지 마"라고 말해도 LLM은 관성적으로 수정하려 합니다. 프롬프트 수준의 금지는 Goal Fixation에 밀립니다. 하지만 **"이 세션의 산출물은 코드 수정이 아니라 Warrant(논거) 목록이다"**라고 선언하면, LLM의 행동이 실제로 달라집니다.

이건 Peter Gollwitzer의 **Implementation Intention** 연구와 같은 구조입니다. "살을 빼겠다"(막연한 목표)보다 "아침 7시에 조깅한다"(구체적 if-then 계획)가 실행률이 높습니다. 메타분석에서 효과 크기 d=0.65 (Gollwitzer, "Implementation Intentions: Strong Effects of Simple Plans", *American Psychologist*, 1999).

LLM에게도 마찬가지입니다:

- ❌ "수정하지 마, 설명만 해" → 프롬프트. Goal Fixation에 밀림.
- ✅ "이 세션의 산출물은 Warrant 목록이다" → 구조. 행동을 강제함.

이렇게 태어난 것이 `/discussion` 워크플로우입니다.

---

## 4. `/discussion` — 제발 하지 말고 물어봐

처음에 한 것은 단순했습니다. 클로드한테 이렇게 말했습니다:

> "너는 레드팀 소크라테스다. 내가 하는 말에 대답하지 말고, 역으로 비어있는 곳을 파고드는 질문을 해라."

이걸 해봤더니 됐습니다. AI가 코드를 고치는 대신 진짜로 질문을 했습니다. "이 컴포넌트의 책임 범위가 어디까지인가요?" "이걸 왜 새로 만들어야 하나요, 기존 것으로 안 되나요?" 대답하다 보면 머릿속이 정리됐고, 정리된 다음에 시키면 결과가 달랐습니다.

문제는 이 프롬프트가 한 세션에서만 유효하다는 것이었습니다. 다음 세션에서는 또 "일단 고칠게요" 모드로 돌아갔습니다. 그래서 이걸 워크플로우로 고정한 것이 `/discussion`입니다 (2026년 2월 11일, 프로젝트 시작 8일차).

### 왜 되는가 — Goal Fixation 역이용

§3에서 발견한 원리를 다시 봅니다: **LLM은 "산출물"에 고정된다.** 산출물이 코드면 코드를 고치고, 산출물이 질문 목록이면 질문을 합니다.

"레드팀 소크라테스"가 된 이유는 단순합니다. 산출물을 바꿨기 때문입니다. `/discussion`은 이걸 워크플로우 규칙으로 고정합니다:

```markdown
| 📌 Current Intent | 현재 턴의 숨겨진 의도 1문장 |
| 🎯 Emerging Claim | 현재까지 수렴된 결론 후보 |
| 📋 Warrants       | W1. ... / W2. ... (NEW) |
| 📝 Knowledge      | K1. ... — 이 대화에서 발견된 영구 지식 |
```

매 턴 끝에 이 표를 업데이트하는 것이 "산출물"입니다. LLM의 Goal Fixation이 "코드 수정"이 아니라 "Warrant 누적"에 걸립니다. **목표를 바꿨을 뿐인데 행동이 완전히 달라집니다.** §3의 원리가 그대로 적용된 첫 번째 사례입니다.

### 부산물 — 생각의 품질이 올라간다

메커니즘은 Goal Fixation 역이용이지만, **효과**는 예상 밖이었습니다. AI한테 "왜 이렇게 하면 결과가 좋아지는 거야?"라고 물어봤더니, Chris Argyris의 **Double-loop Learning**을 알려줬습니다:

- **Single-loop**: 테스트 실패 → 코드 수정 → 또 실패 → 다른 수정 (반복)
- **Double-loop**: 테스트 실패 → "우리가 테스트하려는 것이 맞는 건가?" → 전제 자체를 수정

(Chris Argyris, "Double Loop Learning in Organizations", *Harvard Business Review*, 1977)

산출물을 "질문 목록"으로 바꿨을 뿐인데, **자연스럽게 Double-loop이 되었습니다.** "왜?"를 묻게 만들었더니 전제를 검토하게 된 것입니다. 의도한 것은 "코드 수정 방지"였고, 얻은 것은 "생각의 품질 향상"이었습니다.

### 실물: `/discussion`이 만드는 것

이 프로젝트에서 실제로 `/discussion`을 실행하면 이런 대화가 오갑니다:

```
사용자: "트리거가 aria 책임을 져야 할까?"

AI:
📌 Current Intent: Trigger 컴포넌트의 책임 범위를 확정하고 싶다
🎯 Emerging Claim: Trigger는 순수 이벤트 투영이며, ARIA는 Zone이 관리한다
📋 Warrants:
  W1. Trigger는 사용자 입력을 커맨드로 변환하는 역할
  W2. ARIA 상태는 Zone의 items map에서 관리됨
  W3. 책임 혼합 시 테스트 복잡도 증가
📝 Knowledge: (없음 — 아직 합의 전)
⚖️ Cynefin: 🔴 Complex
❓ Gap: Trigger가 aria-expanded를 직접 관리해야 하는 케이스가 있는가?
```

코드 한 줄 안 고쳤습니다. 대신 **"뭘 해야 하는가"가 명확해졌습니다.** Knowledge가 합의되면 프로젝트 지식에 영구 반영됩니다.

이 대화 기록은 git history에 남아 있습니다:

```
# 2026-02-24 03:17 — 실제 git commit
1063c493 feat(keyboard): ZIFT Responder Chain — Field→Item→Zone→Global

# 이 커밋 이전에 /discussion이 "Field→Item→Zone→Global" 체인을
# Claim으로 합의한 후에야 구현이 시작되었다
```

---

## 5. 메타적 자기참조 — AI의 문제를 AI한테 물어서 풀다

이 경험에서 가장 흥미로운 점은 **AI의 문제를 AI한테 물어봐서 풀었다**는 것입니다:

1. AI가 바로 수정하는 문제를 겪었습니다
2. **AI한테 "왜 자꾸 수정해?"라고 물어봤습니다** → Goal Fixation 개념을 알려줬습니다
3. 산출물을 바꿔봤더니 됐습니다
4. **AI한테 "왜 이게 되는 거야?"라고 물어봤습니다** → Double-loop Learning을 알려줬습니다

"레드팀 소크라테스" 프롬프트가 `/discussion` 워크플로우가 됐고, 그 안에서 AI한테 "왜?"를 물어본 것이 지식 추출이 됐습니다. **"왜?"를 안전하게 물을 수 있는 공간**을 만든 것이 `/discussion`의 본질입니다.

---

## 여기까지의 교훈

| 문제 | 발견 | 해법 |
|------|------|------|
| 계획 없이 시키면 된다? | 750줄 칸반 → 4일 뒤 삭제 | "동작"과 "방향"은 다르다 |
| "계획을 세우세요" — 근데 왜 안 하게 되나 | Goal Fixation: LLM이 "수정 = 목표"로 고정 | 산출물 재정의 |
| 질문해도 수정하려 한다 | 프롬프트("하지 마")로는 안 통한다 | 구조(워크플로우)로 강제 |
| 생각과 실행이 섞인다 | LLM에게 "회의 모드"가 없다 | `/discussion` — 물리적 분리 |
| 왜 되는지 모르겠다 | Goal Fixation 역이용 (산출물 재정의) + 부산물로 Double-loop 달성 | "왜?"를 안전하게 물을 수 있는 공간 |

**핵심 한 줄**: LLM에게 "잘 시키는 법"을 찾는 대신, **"산출물을 재정의"**하면 행동이 바뀝니다.

---

## References

1. Ng, Andrew. "AI Agentic Workflows." Sequoia Capital AI Ascent, March 2024. https://landing.ai/blog/andrew-ng-a-look-at-ai-agentic-workflows-and-their-potential-for-driving-ai-progress
2. Shah, Vikrant et al. "Goal Misgeneralization: Why Correct Specifications Aren't Enough For Correct Goals." arXiv:2210.01790, 2022.
3. Sharma, Mrinank et al. "Towards Understanding Sycophancy in Language Models." Anthropic, arXiv:2310.13548, 2023.
4. Argyris, Chris. "Double Loop Learning in Organizations." *Harvard Business Review*, September 1977.
5. Gollwitzer, Peter M. "Implementation Intentions: Strong Effects of Simple Plans." *American Psychologist*, 54(7), 493-503, 1999.

---

> 다음 편: [2편 — 산출물이 행동을 결정한다](./02-artifact-driven-thinking.md)
> 산출물 재정의가 열쇠라는 걸 알았습니다. 그런데 "코드만이 산출물이 아니다"를 진짜로 믿기까지는 더 많은 실패가 필요했습니다.
