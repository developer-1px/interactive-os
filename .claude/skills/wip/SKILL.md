---
description: 백로그에서 랜덤 1개를 선택하여 분석 도구로 자율 숙성시킨다. Clear면 실행, 아니면 풍부해진 분석을 백로그에 환류한다.
---

## /wip — Backlog Probe Loop

> **What**: 백로그에서 항목 1개를 골라, 분석 도구를 자율 오케스트레이션하여 Cynefin을 낮춘다.
> **성공**: Clear 도달 → `/project` → `/go` 자동 위임.
> **실패**: N턴 소진 → 분석 과정 + Open Gap을 백로그에 상세 기록 (enriched push-back).
> **핵심 가치**: 실패해도 백로그가 풍부해진다. 반복할수록 Clear 확률이 올라간다.

### 핵심 원칙

1. **자율 실행**: 사용자 입력 대기 없음. 분석 도구만 호출하고, Gap은 기록만 한다.
2. **N턴 제한 (N=3)**: AI 자기확신 루프 방지. 3턴 안에 Clear가 안 나오면 환류하고 종료.
3. **Safe-to-fail probe**: Cynefin Complex 도메인의 정석. probe → sense → respond.

---

## Step 0: Rule 숙지

`.agent/rules.md`를 읽는다.

---

## Step 1: 백로그 선택

1. `docs/5-backlog/` 전체 항목을 나열한다.
2. **랜덤 1개**를 선택한다.
   - 디렉토리(하위 프로젝트)는 대표 파일(BOARD.md 또는 README.md)을 선택.
   - `os-gaps.md`는 제외 (개별 항목이 아니라 집합 파일).
3. 선택한 항목을 읽고 내용을 파악한다.

**출력**: 선택된 항목 경로 + 1줄 요약.

---

## Step 2: 분석 루프 (max 3턴)

### 턴 구조

```
턴 N:
  1. Cynefin 판정 (현재 상태)
  2. 도구 선택 (적응형)
  3. 도구 실행
  4. 결과 반영 → Cynefin 재판정
```

### 도구 선택 전략 (적응형)

**1턴째는 `/divide`로 시작한다.** 이후는 결과에 따라 LLM이 선택:

| 상황 | 추천 도구 |
|------|----------|
| 분해가 안 됨 (구조 불명) | `/divide` |
| 트레이드오프 발견 | `/conflict` |
| 방향은 잡혔으나 구체화 필요 | `/blueprint` |
| API/인터페이스 설계 필요 | `/usage` |
| 기존 코드와의 정합성 의문 | `/review` |
| 실패 원인 분석 필요 | `/diagnose` |
| 독립적 추론 필요 | `/solve` |
| 과잉/불필요 의심 | `/doubt` |

### 사용 불가 도구 (대화형 — 인간 응답 필요)

`/discussion`, `/elicit`, `/workflow`, `/stories`

### Cynefin 판정 기준

| Cynefin | 기계적 기준 |
|---------|-----------|
| **Clear** | `/divide` leaf가 전부 S/M 크기 + `/conflict` 충돌 0건 + Before/After가 코드 레벨로 구체적 |
| **Complicated** | 방향은 보이나 분해 미완 또는 일부 leaf가 L |
| **Complex** | 핵심 정보 부족 (인간만 답할 수 있는 질문 존재) 또는 해소 불가 충돌 |

### Clear 도달 시 (턴 중간이라도)

→ 즉시 Step 3A로 이동.

### N턴 소진 시

→ Step 3B로 이동.

---

## Step 3A: Clear 경로 — 실행 위임

1. 분석 결과를 바탕으로 **`/project`를 실행**하여 프로젝트를 생성한다.
2. `/go`를 호출하여 실행 파이프라인에 위임한다.

---

## Step 3B: Complex 경로 — Enriched Push-back

분석한 데까지의 과정을 **원본 백로그 파일에 추가** (또는 새 파일로 교체)한다.

### 환류 포맷

원본 파일 하단에 다음 섹션을 추가한다:

```markdown
---

## /wip 분석 이력 (YYYY-MM-DD)

### 분석 과정

#### 턴 N: [도구명]
- **입력**: [무엇을 분석했는가]
- **결과**: [핵심 발견]
- **Cynefin**: [판정 + 이유]

(턴별 반복)

### Open Gaps (인간 입력 필요)

- [ ] Q1: [질문] — 해소 시 [어떤 진전이 가능]
...

### 다음 /wip 시 시작점

[추천 도구 + 이유]
```

### 환류 후

커밋한다 (메시지: `docs(backlog): enrich [항목명] via /wip probe`).

---

## 안전장치

**N턴 hard limit**: 3턴 초과 불가. "한 턴만 더" 금지.

---

## 요약

```
/wip
  ├─ Step 1: 백로그 랜덤 1개 선택
  ├─ Step 2: 분석 루프 (≤3턴, 적응형 도구)
  ├─ Step 3A: Clear → /project → /go (실행 위임)
  └─ Step 3B: Complex → enriched push-back (백로그 환류)
```
