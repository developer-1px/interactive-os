# /discussion 진화사 — Red Team 소크라테스에서 Critical Friend까지

| 항목 | 내용 |
|------|------|
| **원문** | 특히나 discussion의 진화사를 집중적으로 문서를 작성해줘 |
| **내(AI)가 추정한 의도** | **경위**: 워크플로우 전체 진화사를 작성한 직후, 가장 핵심인 /discussion의 심층 기록을 원함.<br>**표면**: /discussion 워크플로우의 git 이력 기반 변천사 작성.<br>**의도**: /discussion이 프로젝트에서 가장 많이 쓰이고, 기능과 철학이 가장 많이 변한 워크플로우이므로, 그 진화를 기록하여 "왜 이런 형태가 되었는지"를 보존하고 싶다. |
| **날짜** | 2026-03-05 |

> 📌 /discussion은 23일간 7번의 주요 변신을 거쳤다. "AI가 질문하는 도구"에서 "AI가 전문가로서 함께 사고하는 프레임워크"로 진화.
> 📌 가장 결정적 전환: "Red Team 소크라테스" → "Critical Friend" 역할 변경. 적대적 심문에서 협업적 사고 파트너로.
> 📌 산출물도 3번 변형: 2파일(Conclusion+Journey) → 1파일(concat) → "지식만 남긴다"(Journey/Conclusion 폐지).

---

## 1. 개요

`/discussion`은 Interactive OS 워크플로우 시스템에서 **가장 높은 빈도로 사용되며, 가장 많이 진화한** 워크플로우다. 2026년 2월 11일 탄생 이후 3월 5일까지 23일간 7번의 주요 변신을 거쳤다.

다른 워크플로우가 "태어나서 안정화"되는 패턴을 보인 반면, `/discussion`은 **매주 형태가 달라졌다**. 그 이유는 명확하다: `/discussion`은 **사용자와 AI의 상호작용 자체를 구조화**하는 메타 워크플로우이므로, 상호작용의 질이 바뀔 때마다 `/discussion`의 설계도 바뀌어야 했다.

---

## 2. 연대기

### v1: 원시 소크라테스 (02-11, `b0f51b59`)

```markdown
역할: Red Team 소크라테스
핵심: 매 턴 3단계 — Intent 추론 + Warrant 누적 + Gap 질문
산출물: 2개 파일
  - Discussion_Conclusion.md (Warrant 구조)
  - Discussion_Journey.md (이정표 요약)
저장: docs/0-inbox/
```

**탄생 배경**: 이 시점까지 AI와의 대화는 구조 없이 흘러갔다. 사용자가 무언가를 말하면 AI가 바로 실행했다. "왜?"를 묻지 않고 "어떻게?"만 물었다.

**핵심 설계 결정**:
- **"Red Team 소크라테스"**: 적대적 심문자. 사용자의 모든 발화를 의심하고, 논리의 빈틈을 공격적으로 찾는다.
- **Toulmin 논증 모델**: Data → Warrant → Claim 구조. 단, 이 시점엔 **Claim이 명시되지 않았다** — Warrant만 쌓고 끝.
- **Journey 파일**: 대화의 이정표(Milestone) 형식. 이정표만 나열.

**한계**: "왜?"를 추적하는 습관은 생겼지만, AI가 너무 공격적. "이거 해"라고 해도 "정말요? 왜요?"로 시작. 또한 산출물이 2개 파일이라 관리 부담.

---

### v1.1: Journey 대화록화 (02-11, `a9bd9857` — 같은 날, 20분 후)

```diff
- Discussion_Journey.md: 이정표 형식
+ Discussion_Journey.md: 대화록 형식 (🧑/🤖 턴 구분)
```

**v1 탄생 20분 만에 수정**. 이정표 나열로는 대화의 맥락이 복원되지 않았다. "왜 이런 결론에 도달했는지"를 이해하려면 **대화의 흐름** 자체가 보여야 했다.

이것은 `/discussion`의 첫 번째 교훈이다: **결론만 저장하면 맥락을 잃는다. 과정도 기록해야 한다.**

---

### v2: Known/Open 구분 + 5갈래 라우팅 (02-14, `4e0e4748`)

```diff
+ 규칙 추가: "Known은 즉답, Open에만 Gap 질문"
+ 산출물: 3단계 프로세스 (Conclusion 임시 → Journey 임시 → concat)
+ 저장: docs/11-discussions/ (전용 디렉토리)
+ 5갈래 라우팅: 프로젝트 Task / Discussion / 새 프로젝트 / 리소스 / 백로그
+ 프로젝트 승격 경로: 11-discussions → 1-project/[name]/0-discussion.md
```

**22건 일괄 워크플로우 리팩토링**의 일부. 이 커밋에서 모든 워크플로우가 컨벤션 통일을 거쳤다.

**핵심 변화 1 — Known/Open 구분**:

> Known을 Open인 척 질문하면 시간을 낭비하고 신뢰를 잃는다.

이것은 AI가 **정답이 있는 것에까지 소크라테스식 질문을 던지는** 문제에서 왔다. "TypeScript에서 배열 타입은 뭐죠?"라고 물어봤는데 "왜 배열이 필요한지부터 물어봐도 될까요?"라고 반문하는 식. 정답을 아는 것은 바로 답하고, 정답이 없는 것만 탐색하라.

**핵심 변화 2 — 5갈래 라우팅**:

Discussion의 결론이 어디로 가야 하는지가 명시됐다. 이전에는 무조건 `0-inbox`에 떨어졌지만, 이제 결론의 성격에 따라 프로젝트, 백로그, 리소스 등으로 분기. **Discussion이 파이프라인의 입구**가 되기 시작.

**핵심 변화 3 — 3단계 concat**:

산출물 작성이 Conclusion(임시) → Journey(임시) → cat으로 concat하는 3단계로 구조화. "절대 내용을 다시 작성하지 않는다" 규칙. AI가 종합할 때 내용을 재해석하거나 변형하는 것을 방지.

---

### v3: /doubt 적용 — 경량화 (02-15, `df11f66b`)

```diff
- 산출물: 3단계 프로세스 (임시파일 2개 → concat → 저장)
+ 산출물: 직접 1파일 작성 (Journey + --- + Conclusion)
- 라우팅 후 조치: 상세 설명
+ 라우팅 후 조치: 3줄 요약
```

`/doubt`가 전체 워크플로우에 적용된 날. `/discussion`의 산출물 프로세스가 3단계에서 "그냥 1파일 직접 작성"으로 단순화. 임시 파일을 만들고 concat하는 의식(ceremony)이 불필요하다는 판단.

**교훈**: 과정의 엄밀함보다 결과의 존재가 더 중요하다. 3단계 프로세스를 지키느라 산출물 자체를 안 만드는 것보다, 단순하게 1파일을 바로 쓰는 게 낫다.

---

### v4: Critical Friend + Toulmin 정석 + 대혁신 (02-26, `22ae6417`)

```diff
- 역할: Red Team 소크라테스
+ 역할: Critical Friend

- 누적 구조: 코드블록 (📌 + 📋 + ❓)
+ 누적 구조: 테이블 (📌 + 🎯 + 📋 + 📎 + ⚖️ + 🚀 + ❓)

+ 🎯 Emerging Claim 추가 (Toulmin에서 빠졌던 목적지)
+ ⚖️ Cynefin 판정 추가 (Qualifier = Cynefin)
+ 🚀 Next 판정 규칙 (Cynefin 게이트)
+ 📎 References 추적 (참조 문서 누적)

+ Expert Toolkit (7가지 기법)
+ 종료 시그널 명확화 + AI 임의 종료 금지
+ Conclusion: Toulmin 정석 표
+ How 추적 금지 → Why 추적
+ 선택지를 물을 때 AI 판단 먼저 밝히기
```

**가장 결정적인 전환점.** 이 변경은 `discussion-expert-upgrade` discussion에서 탄생했다.

#### 역할 변경: Red Team 소크라테스 → Critical Friend

> Costa & Kallick (1993)의 Critical Friend: 도전 + 지원 + 지식 제공을 동시에

"Red Team 소크라테스"는 **적대적 심문자**였다. 모든 발화를 의심하고, 빈틈을 공격했다. 효과적이었지만 **협업적이지 않았다**. 사용자가 아이디어를 꺼내면 "정말요?"부터 시작하니, 초기 아이디어 탐색 단계에서 마찰이 컸다.

Critical Friend는 다르다: **도전하되 지지한다**. "좋은 아이디어인데, 이 부분만 더 생각해보면 어떨까요?"

#### 🎯 Emerging Claim 도입

이전까지 `/discussion`은 **Warrant(논거)만 쌓았다**. "W1. 이것 때문에... W2. 저것 때문에..." 그런데 **어디로 향하는지**가 없었다. 사용자가 "그래서 결론이 뭐야?"라고 물어야 결론이 나왔다.

Emerging Claim은 **매 턴마다 수렴 중인 결론 후보**를 보여준다. 대화가 어디로 가고 있는지, 현재 가설이 무엇인지. 이것은 Toulmin 모델에서 가장 중요한 요소(Claim)가 빠져있었다는 발견에서 왔다.

#### Cynefin + Next 라우팅

`⚖️ Cynefin` 판정이 단순한 메타데이터가 아니라 **실행 라우팅의 게이트**가 됐다:
- Complex → 계속 discussion
- Complicated → /divide
- Clear → /go

이것으로 "/discussion이 언제 끝나는가?"라는 질문에 명확한 답이 생겼다: **Cynefin이 Clear가 되면 끝난다.** 더 정확히는, **`/discussion`의 exit은 항상 `/go`다.**

#### Expert Toolkit

7가지 전문가 기법이 명시됐다:
1. Proactive Knowledge Surfacing — 선행 조사
2. Steel-manning — 약한 주장을 최선으로 강화
3. Conceptual Anchoring — 기존 이론 연결
4. Inversion / Pre-mortem — 반대로 생각하기
5. Analogical Bridging — 유추
6. Reframing — 관점 전환
7. Tension Surfacing — 숨은 트레이드오프 드러내기

이것은 사용자의 요청에서 직접 나왔다: "전문가스러운 밀도를 높이고 싶다."

#### Conclusion → Toulmin 정석 표

Journey+Conclusion 형태는 유지하되, Conclusion이 **Toulmin 정석 표**로 변경:

| Toulmin | 내용 |
|---------|------|
| 🎯 Claim | 합의된 결론 |
| 📊 Data | 근거 사실 |
| 🔗 Warrant | 핵심 논리 |
| 📚 Backing | 학문적 근거 |
| ⚖️ Qualifier | Cynefin |
| ⚡ Rebuttal | 반론·리스크 |
| ❓ Open Gap | 미해결 질문 |

이전의 "Why / Intent / Warrant 구조 + 한 줄 요약"보다 훨씬 완결된 논증 기록.

---

### v5: Knowledge 반영 + /knowledge 분리 (03-04, `workflow-knowledge-separation` 프로젝트)

```diff
+ 📝 Knowledge 누적 필드 추가 (Warrant과 별도)
+ Knowledge 트리거: 사용자가 명시적으로 확인/동의한 것만
+ 종료 시 산출물 재정의: "Discussion의 산출물은 새롭게 알게 된 지식이다"
- Journey + Conclusion 파일 저장
+ Knowledge 반영 (/knowledge 워크플로우 실행)
+ 2-1. 참조 문서 추적 (📎 References)
+ 2-3. 새 지식을 발견하면 즉시 누적
```

**패러다임 전환**: Discussion의 산출물이 **"대화 기록"에서 "지식"**으로 변경.

> "Discussion의 산출물은 '새롭게 알게 된 지식'이다. 대화 맥락(Journey)이나 논증 구조(Toulmin)는 저장하지 않는다."

Journey와 Conclusion을 파일로 저장하는 것을 **폐지**했다. 이유:
1. 대화 기록은 AI의 conversation history에 이미 있다
2. Toulmin 표는 살아있는 논증이지, 파일로 굳으면 죽은 문서가 된다
3. 진짜 가치 있는 것은 **대화에서 발견된 영구 지식**(원칙, 경계, 패턴, 정의)이다

📝 Knowledge 필드가 📋 Warrants와 구분되어 추가됐다:
- Warrant = "왜 이 Claim이 맞는가"의 **논거** (대화 내 쓰이고 끝)
- Knowledge = "이 대화에서 발견된 **프로젝트에 영구 반영할 지식**"

---

### v6: Complex 3분기 + Escape Valve (03-05, 이 세션)

```diff
- 🔴 Complex → 계속 /discussion (단일 행)
+ 🔴 Complex — 정보 부족 → 계속 /discussion
+ 🔴 Complex — 충돌 불명확 → /conflict (충돌 양쪽 진단)
+ 🔴 Complex — 선택 불가 → /blueprint (AI가 EC로 해소 제안)
+ "/conflict·/blueprint는 대화 내 탈출 밸브" 규칙 추가
```

**Complex가 너무 넓다**는 문제의 해결. "아직 수렴 안 됨"의 이유를 3가지로 세분화:

1. **정보 부족** → 더 탐색 (기존)
2. **충돌 불명확** → `/conflict`가 양쪽을 Steel-man하여 진단
3. **선택 불가** → `/blueprint`가 TOC EC로 전제를 무효화

이전에는 discussion이 Complex에서 무한 루프에 빠질 수 있었다. 새 정보가 나오지 않는데 계속 Gap 질문만 던지는 상황. 이제 **왜** 수렴하지 못하는지를 구분하여 적절한 도구로 라우팅.

---

## 3. 변천 요약표

| 버전 | 날짜 | 역할 | 누적 구조 | 산출물 | Next 판정 | 라우팅 |
|------|------|------|----------|--------|-----------|--------|
| v1 | 02-11 | Red Team 소크라테스 | 코드블록 (Intent+Warrant+Gap) | 2파일 (Conclusion+Journey) | 없음 | inbox |
| v1.1 | 02-11 | (동일) | (동일) | Journey→대화록 형식 | 없음 | inbox |
| v2 | 02-14 | (동일) | (동일) + Known/Open 구분 | 3단계 concat → 1파일 | 없음 | 5갈래 |
| v3 | 02-15 | (동일) | (동일) | 직접 1파일 작성 | 없음 | 5갈래 |
| v4 | 02-26 | **Critical Friend** | 테이블 (7필드) + **Claim** | Journey+Toulmin표 | **Cynefin 게이트** | 6갈래 |
| v5 | 03-04 | (동일) | 테이블 + **Knowledge** | **지식만** (Journey/Conclusion 폐지) | (동일) | /knowledge→6갈래 |
| v6 | 03-05 | (동일) | (동일) | (동일) | **Complex 3분기** | +/conflict +/blueprint |

---

## 4. 진화의 패턴 — 무엇이 /discussion을 바꿨는가

### 패턴 1: 모든 변화는 실제 사용에서 왔다

v1의 "과잉 질문 문제" → v2의 Known/Open 구분.
v3의 "산출물 안 만드는 문제" → 3단계→1단계 단순화.
v4의 "방향 없이 Warrant만 쌓이는 문제" → Emerging Claim.
v5의 "Journey 파일 안 읽는 문제" → 저장 폐지, 지식만 남김.
v6의 "Complex 무한 루프 문제" → 3분기 escape valve.

### 패턴 2: 역할 정체성이 도구의 행동을 결정한다

"Red Team 소크라테스"였을 때 AI는 **심문**했다.
"Critical Friend"가 되자 AI는 **함께 사고**했다.

역할 이름 하나가 AI의 전체 행동 패턴을 바꿨다. 이것은 LLM의 특성 — 역할 설정(role prompting)이 세부 규칙보다 행동에 더 큰 영향을 미친다.

### 패턴 3: 산출물이 목적을 반영한다

| 시기 | 산출물 | 암묵적 가정 |
|------|--------|-----------|
| v1~v3 | 대화 기록 (Journey+Conclusion) | "대화 기록이 가치 있다" |
| v4 | Toulmin 정석 표 | "논증 구조가 가치 있다" |
| v5 | 지식만 | **"영구적 지식만 가치 있다"** |

산출물의 변천은 **"Discussion은 무엇을 남기는 활동인가?"**라는 질문에 대한 답이 바뀐 것이다.

### 패턴 4: 라우팅이 시스템을 만든다

| 시기 | Discussion의 출구 | 시스템적 의미 |
|------|-------------------|-------------|
| v1~v2 | inbox, 5갈래 | Discussion = 독립 활동 |
| v4 | /go (필수 출구) | **Discussion = 파이프라인의 입구** |
| v6 | /go + /conflict + /blueprint | Discussion = 허브 (탈출 밸브 포함) |

Discussion이 `/go`에 연결된 순간 (v4), 전체 워크플로우 시스템이 하나의 파이프라인이 되었다. `/discussion`은 단순한 "대화 도구"에서 **"모든 의사결정의 관문"**이 됐다.

---

## 5. 현재 /discussion의 정체성 (v6)

**`/discussion`은 Interactive OS의 국회다.**

- 모든 의사결정이 여기서 시작된다
- 합의(Claim)에 도달해야 실행(Go)이 가능하다
- 합의가 안 되면 원인에 맞는 도구(conflict/blueprint)를 호출한다
- 산출물은 법률(Knowledge)이지, 의사록(Journey)이 아니다

---

## 6. Cynefin 도메인 판정

🟢 **Clear** — git diff 기반의 확정된 사실. 해석을 추가했지만 증거는 변하지 않는다.

## 7. 인식 한계 (Epistemic Status)

- 각 버전 변경의 **동기**는 git 커밋 메시지와 discussion-expert-upgrade.md에서 복원. 하지만 모든 변경의 동기가 문서화되어 있지는 않다 (특히 v2~v3).
- v4 변경의 직접 근거인 `discussion-expert-upgrade.md`는 현존하며 확인 가능.
- 사용자가 기억하는 추가 맥락이 있을 수 있다.

> 📌 23일간 7번 변신. "AI가 질문하는 도구"에서 "AI가 함께 사고하는 프레임워크"로 진화.
> 📌 가장 결정적 순간: Red Team 소크라테스 → Critical Friend (역할 이름이 행동을 바꿨다).
> 📌 최종 정체성: "Interactive OS의 국회" — 모든 의사결정의 관문, 산출물은 법률(Knowledge).
