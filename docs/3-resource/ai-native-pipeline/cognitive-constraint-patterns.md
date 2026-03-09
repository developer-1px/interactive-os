---
last-reviewed: 2026-03-10
---

# Cognitive Constraint Patterns: AI의 사고 방식을 설계하다

> 행동을 지시하는 커맨드("뭘 해라")가 아닌, **사고 방식을 제약하는 워크플로우("이렇게 생각해라")**의 설계 원리와 외부 근거.

## 왜 이 주제인가

워크플로우 수정 과정에서 발견: 우리의 `/solve`, `/why`, `/diagnose`, `/discussion` 등은 AI에게 "무엇을 하라"가 아닌 "어떻게 생각하라"를 지시한다. 외부 Claude 커맨드 생태계(216개짜리 모음 포함)를 리서치한 결과, 이런 패턴은 **업계에서 거의 사례가 없었다.** 반면 의료계는 50년간 동일한 문제(전문가의 인지 편향)를 연구해왔으며, 우리와 동일한 결론에 도달했다.

## Background: 두 세계의 같은 문제

### 의료계 — Diagnostic Error

의사의 오진(diagnostic error)의 주 원인은 지식 부족이 아니라 **인지 편향**:
- **Premature Closure** — 첫 번째 패턴 매칭에 만족, 데이터 수집 중단
- **Anchoring Bias** — 초기 정보에 과도한 가중치, 반대 증거 무시
- **Confirmation Bias** — 기존 가설에 맞는 정보만 선택적 수집

### AI 코딩 — LLM Failure Modes

LLM이 코딩할 때 보이는 동일한 패턴:
- **Yes-man 관성** — 사용자의 확인 요청에 무조건 동의
- **확증 편향** — 하나의 해결책을 먼저 정하고 근거를 맞춤
- **치료 충동** — 원인을 모르면서 코드부터 수정
- **조기 종결** — 첫 번째로 떠오르는 방법에 고착

**공통점**: System 1(빠른 직관)이 System 2(분석적 추론)를 건너뛴다.

## Core Concept: Cognitive Forcing Strategy

### 의료계의 해법

Pat Croskerry(환자 안전 연구) 등이 수십 년 연구한 결론:

> **"교육(Awareness)만으로는 편향을 줄일 수 없다. 구조적 강제(Forcing Strategy)만이 유효하다."**

| 기법 | 메커니즘 | 효과 |
|------|----------|------|
| **Diagnostic Timeout** | 진단 중 의도적으로 멈추고 "이게 아니라면?" 질문 | System 2 강제 전환 |
| **"Until Proven Otherwise"** | 가장 위험한 가능성을 먼저 배제할 때까지 유지 | Premature Closure 방지 |
| **Actively Seek Disconfirming Evidence** | 현재 가설에 반하는 증거를 의도적으로 찾기 | Confirmation Bias 방지 |
| **"Not Yet Diagnosed"** | 확실해질 때까지 진단명 부여 보류 | Anchoring 방지 |
| **TWED 체크리스트** | Threat, What else, Evidence, Disposition influence | 4가지 관점 강제 점검 |
| **10초 Pause** | 복잡한 프로세스 없이 10초만 멈춤 | 그것만으로 정확도 상승 (NIH 연구) |
| **Croskerry 3종 체크리스트** | ① 인지 점검 ② 감별 진단 ③ 흔한 함정 | 다층적 편향 포착 |

### 우리의 해법: System 2 Forcing

| 워크플로우 | 의료 기법 대응 | 제약하는 LLM 실패 모드 |
|---|---|---|
| `/solve` — 제약 먼저, 결론 나중 | Premature Closure 방지 + Disconfirming Evidence | 확증 편향 |
| `/why` — 🛑 STOP + Self-Audit | Diagnostic Timeout | 잘못된 컨텍스트 고착 |
| `/diagnose` — 코드 수정 금지, 읽기만 | "Not Yet Diagnosed" | 치료 충동 |
| `/discussion` 2-4 — 확인 요청에 근거로 응답 | 동료 자문(Second Opinion) | Yes-man 관성 |
| `/discussion` 2-2 — 선택지에 판단 먼저 밝히기 | 의사의 진단 소견 제시 의무 | 역할 방기 |

## Usage: Claude 커맨드 생태계와의 비교

### 업계 현황 (2026-03 기준)

| 레포 | 규모 | 접근 | 특징 |
|------|------|------|------|
| **Claude-Command-Suite** | 216개 커맨드 | "모든 것을 커맨드로" | 네임스페이스 분류 (`/dev:*`, `/test:*`, `/deploy:*` 등) |
| **awesome-claude-code** | 큐레이션 목록 | 커뮤니티 기반 | Skills, Hooks, Commands 등 카테고리 |
| **addyosmani/web-quality-skills** | 6개 도메인 스킬 | 전문가 지식 패키지 | Performance, A11y, SEO 등 |
| **우리 시스템** | 46개 워크플로우 | 인지 제약 + 파이프라인 라우팅 | 고유 |

### 핵심 차이: 행동 지시 vs 사고 제약

```
대부분의 커맨드:
  /commit → "커밋해"
  /review → "리뷰해"
  /test → "테스트 써"
  → "뭘 해라" (What to do)

우리의 워크플로우:
  /solve → "결론 먼저 정하지 마"
  /why → "멈추고 전제를 의심해"
  /diagnose → "고치지 마, 보기만 해"
  → "이렇게 생각해라" (How to think)
```

워킹 네임: **"Cognitive Constraint Command"** — AI의 행동이 아닌 사고 방식을 제약하는 커맨드 유형.

## Best Practice + Anti-Pattern

### ✅ Best Practice

1. **구조적 강제가 교육을 이긴다** — "편향 조심해"는 효과 없음. 규칙으로 강제해야 함.
2. **멈추는 것 자체가 가치** — 10초 Pause 연구. `/why`의 STOP이 정확히 이 원리.
3. **제약은 적을수록 강력** — 46개 > 216개. 정말 필요한 인지 개입만 분리.
4. **파이프라인 라우팅이 핵심** — 216개를 나열하면 사용자가 선택 마비. `/go`가 자동 라우팅.

### 🚫 Anti-Pattern

1. **커맨드 과잉** — 모든 행동을 커맨드로 만들면 기억 불가, 형식만 남음.
2. **편향 교육만** — "이런 편향이 있으니 조심해" → 의료계에서 검증된 실패 전략.
3. **체크리스트 과잉** — 의료계에서도 너무 많은 체크리스트는 기계적 수행 → 무의미.

## 흥미로운 이야기들

### "독립 재발견"

우리가 만든 Cognitive Constraint 패턴은 의료계의 50년 연구(Croskerry, Kahneman 등)와 독립적으로 동일한 결론에 도달했다. 이것이 시사하는 바:

- LLM의 인지 실패 모드는 인간의 인지 편향과 **구조적으로 동형**이다
- 인간 전문가를 위해 설계된 Cognitive Forcing Strategy가 LLM에도 유효하다
- "System 2 Forcing"은 도메인(의료/코딩)을 초월하는 범용 패턴이다

### 216개 vs 46개

Claude-Command-Suite는 216개 커맨드를 17개 네임스페이스로 분류한다. 하지만 사용자가 216개를 기억할 수 없으므로, 결국 쓰는 것만 쓰게 된다. 양의 문제가 아니라 **설계 철학의 문제**: "모든 행동을 커맨드화"(OOP적 사고) vs "판단이 필요한 순간만 개입"(이벤트 드리븐 사고).

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|------|------|------|--------|------|
| Croskerry Cognitive Forcing | 원조 이론 | Croskerry, P. "Cognitive forcing strategies in clinical decisionmaking" (Annals of Emergency Medicine, 2003) | ⭐⭐⭐ | 2시간 |
| TWED 체크리스트 | 실전 적용 가능 | NIH PMC — "TWED checklist for metacognition in clinical decision-making" | ⭐⭐ | 1시간 |
| Kahneman Noise | 편향 vs 잡음 구분 | Kahneman, Sibony, Sunstein. *Noise: A Flaw in Human Judgment* (2021) | ⭐⭐⭐⭐ | 8시간 |
| Checklist Manifesto | 체크리스트 설계 원리 | Gawande, A. *The Checklist Manifesto* (2009) | ⭐⭐ | 4시간 |
| Dual Process Theory | System 1/2 기본 | Kahneman, D. *Thinking, Fast and Slow* (2011) | ⭐⭐⭐ | 10시간 |
| DECLARE Framework | 복잡 케이스 분해 | AHRQ — Decomposition-based diagnostic approach | ⭐⭐⭐ | 2시간 |
