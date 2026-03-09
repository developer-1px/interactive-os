---
description: 워크플로우의 비공식 용어를 LLM이 잘 아는 표준 프레임워크 용어로 치환한다.
---

## /reframe — Canonical Terminology Rewrite

> **Goal**: 대상 워크플로우의 의도를 보존하면서, LLM 학습 데이터에 풍부한 표준 프레임워크 용어로 치환한다.
> **Why**: 같은 의미라도 학술/업계 표준 용어를 쓰면 LLM이 맥락을 더 정확하게 추론한다.
> **Constraint**: 의미(intent)는 바꾸지 않는다. 용어(terminology)만 바꾼다.

### Step 1 — Read & Extract Intent

대상 워크플로우 파일을 읽고, 각 단계의 **의도(intent)**를 1문장으로 추출한다.

```
for each step in workflow:
  intent[step] = "이 단계는 ___를 달성하기 위해 ___를 한다"
```

### Step 2 — Framework Mapping

각 intent에 대해, LLM 학습 데이터에서 가장 높은 빈도로 등장하는 표준 프레임워크/용어를 매핑한다.

**우선순위 기준** (LLM 친화도 순):

| Priority | Source | Examples |
|----------|--------|----------|
| 1 | CS/SE 교과서 표준 | Design Patterns (GoF), SOLID, DRY, SoC |
| 2 | Agile/XP 표준 | Spike, User Story, Definition of Done, Red-Green-Refactor |
| 3 | 전략 컨설팅 표준 | MECE, Issue Tree, Hypothesis-Driven, 5 Whys |
| 4 | PM 표준 (PMI/PMBOK) | WBS, Work Package, Progressive Elaboration, RACI |
| 5 | 도메인 특화 | Cynefin, Wardley Map, Event Storming, DDD |

**매핑 규칙**:
- 1:1 대응이 있으면 → 표준 용어로 치환
- 1:N 대응이면 → 가장 범용적인(LLM이 가장 잘 아는) 용어 선택
- 대응이 없으면 → 원래 용어 유지 (억지로 붙이지 않는다)

### Step 3 — Produce Mapping Table

치환 전/후를 명시하는 테이블을 작성한다. 이것이 리뷰의 핵심 산출물.

```markdown
| Original Term | Framework | Canonical Term | Rationale |
|--------------|-----------|---------------|-----------|
| "나눈다" | McKinsey | MECE Decomposition | 상호배제·전체포괄 분해 |
| "조각" | PMI WBS | Work Package | 최소 실행 단위 |
| "해법 1문장" | Consulting | Solution Sketch | 가설 수준 해법 기술 |
```

### Step 4 — Rewrite

매핑 테이블을 적용하여 워크플로우를 재작성한다.

**재작성 원칙**:
- description(frontmatter)은 한국어 유지
- 섹션 제목에 영어 표준 용어를 병기 (예: `### 절차 (Procedure)` → `### Procedure`)
- 절차 코드 블록의 변수명/주석에 표준 용어 사용
- Theoretical Basis 테이블을 상단에 추가 (사용된 프레임워크 일람)

### Step 5 — Verify Intent Preservation

원본의 intent 목록과 재작성본을 1:1 대조한다.

```
for each step:
  assert intent_before[step] == intent_after[step]
  // 의미가 달라졌으면 롤백
```

### Step 6 — Write & Report

- 대상 파일을 재작성본으로 덮어쓴다
- Mapping Table을 사용자에게 보여준다
- 의도적으로 유지한 비표준 용어가 있으면 그 이유를 명시한다

### Definition of Done

- [ ] 원본의 모든 intent가 보존되었다
- [ ] 표준 용어의 출처(프레임워크명)가 명시되었다
- [ ] 억지 매핑이 없다 (대응 없으면 원래 용어 유지)
- [ ] Mapping Table이 사용자에게 제시되었다
- [ ] 재작성된 파일이 저장되었다
