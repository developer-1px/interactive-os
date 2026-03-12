---
description: 두 가지 유효한 설계 원칙·패턴·방향이 충돌할 때, 또는 논의가 교착될 때 사용. 양쪽을 Steel-man하여 충돌 구조를 명시화한다.
---

## /conflict — 충돌 진단

> **이론적 기반**: TOC Evaporating Cloud + 변증법(Thesis/Antithesis/Synthesis)
> 대립의 본질을 진단한다. 양쪽을 각각 Steel-man하여 "뭐가 부딪히는지"를 명확히 드러낸다.
> "해결"은 `/blueprint`나 `/discussion` 복귀 후. `/conflict`의 책임은 **진단**이다.

### 진입 경로

| 경로 | 트리거 | 범위 |
|------|--------|------|
| **`/discussion` → `/conflict`** | "뭐가 부딪히는지 모르겠다" (Complex — 충돌 불명확) | 대화에서 이미 드러난 충돌만 구조화 |
| **독립 호출** | `/conflict` 직접 입력 | 코드베이스·문서 전수 탐색 포함 |

## Step 0: 진입

1. `.agent/rules.md`를 읽는다.
2. `/discussion`에서 라우팅된 경우: 대화 맥락의 충돌 지점을 파악한다.
3. 독립 호출인 경우: `docs/STATUS.md`를 읽고 범위를 파악한다.

## Step 1: Conflict Statement — 충돌 선언

충돌을 한 문장으로 선언한다:

```
"[공통 목표]를 위해 [A]가 필요하다. 동시에 [B]도 필요하다. 그런데 A와 B가 양립 불가능해 보인다."
```

- **공통 목표**: 양쪽 모두 동의하는 상위 목적
- **A (Thesis)**: 한쪽의 주장/가치/방향
- **B (Antithesis)**: 반대쪽의 주장/가치/방향

## Step 2: Steel-manning — 양쪽 최선의 논거 구축

**각 쪽을 가장 강한 형태로 옹호한다.** 허수아비를 세우지 않는다.

### Thesis 진단

```
주장: [A]
근거: [왜 A가 맞는가 — 코드/원칙/선례 증거]
전제: [A가 성립하려면 참이어야 하는 것들]
대가: [A를 포기하면 무엇을 잃는가]
원칙 정합성: [rules.md/BOARD 원칙 인용] → 준수/위반
```

### Antithesis 진단

```
주장: [B]
근거: [왜 B가 맞는가 — 코드/원칙/선례 증거]
전제: [B가 성립하려면 참이어야 하는 것들]
대가: [B를 포기하면 무엇을 잃는가]
원칙 정합성: [rules.md/BOARD 원칙 인용] → 준수/위반
```

### 원칙 우선순위

> **원칙을 위반하는 쪽이 입증 책임을 진다.** 위반 쪽이 더 강한 근거를 제시하지 못하면, 원칙 준수 쪽이 이긴다.

```
원칙 계층: 프로젝트 원칙(rules.md, BOARD) > 기존 코드 관행 > 편의성
```

⚠️ **사용 빈도 해석 가이드**: "N개 파일에서 사용 중"은 **오염 범위의 증거**이지, 유지 근거가 아니다. 많이 쓰인다 = 수정 비용이 크다(정당한 고려). 하지만 많이 쓰인다 ≠ 올바르다.

### 충돌 지점 (Collision Point)

```
A와 B가 정확히 어디서 부딪히는가?
→ [구체적 코드 위치, 설계 결정, 또는 원칙 조항]
→ 원칙 위반 여부: [A가 위반 / B가 위반 / 양쪽 다 준수 — 순수 가치 충돌]
```

## Step 3: 긴장의 분류

| 유형 | 설명 | 예시 |
|------|------|------|
| **Value Tension** | 두 가치/원칙이 특정 맥락에서 충돌 | 관찰 가능성 vs 성능 |
| **Pattern Tension** | 기존 패턴과 새 패턴이 공존 (마이그레이션 중) | 옛 API vs 새 API |
| **Direction Tension** | 프로젝트의 두 방향이 서로 다른 곳을 가리킴 | 범용 OS vs 특화 앱 |
| **Boundary Tension** | 두 모듈/레이어의 책임 경계가 불명확 | OS 책임 vs 앱 책임 |

## Step 4: 독립 호출 시 — 코드베이스 탐색 (선택적)

> `/discussion`에서 라우팅된 경우 이 단계를 건너뛴다.

독립 호출 시, 사용자가 지정한 범위에서 긴장을 탐색한다:

1. **코드에서 냄새 찾기**:
   - 같은 문제를 두 가지 방식으로 푸는 코드 (패턴 불일치)
   - `// TODO`, `// FIXME`, `// HACK` 주석
   - `eslint-disable`, `as any`, `as unknown as` — 엔트로피 증가의 냄새
   - 한 모듈이 두 방향으로 끌려가는 의존성

2. **문서에서 냄새 찾기**:
   - `docs/1-project/*/discussions/` — 미결 논의
   - `docs/5-backlog/` — 보류된 아이디어 중 상충하는 것
   - `BOARD.md`의 Paused 태스크 — 왜 멈췄는가?

3. **rules.md에서 긴장 찾기**:
   - 두 원칙이 특정 상황에서 충돌하는 경우

## Step 5: 산출물

### `/discussion`에서 라우팅된 경우

인라인으로 Conflict Statement + Steel-manning 결과를 제시하고, `/discussion`으로 복귀한다.
파일 저장 없음. 대화 맥락에서 충돌이 명확해지면 수렴 재시도.

복귀 후 선택지:
- 충돌이 명확해졌으니 `/discussion`에서 수렴 가능 → 계속 discussion
- "A냐 B냐"를 결정해야 한다 → `/blueprint`로 이동

### 독립 호출의 경우

Tension Report를 파일로 저장한다:

```markdown
# Conflict Report: [범위]

> 생성일: YYYY-MM-DD HH:mm
> 범위: [전체 / 프로젝트 이름 / 모듈 경로]

## Summary

| # | 충돌 | 유형 | 심각도 |
|---|------|------|--------|
| C1 | ... | Value | 🟡 |

## Conflicts

### C1: [충돌 이름]
(Step 1~3 형식)

## Recommendations

1. 즉시 해소 필요: [C 번호] — `/discussion` 또는 `/blueprint`로
2. 관리하며 유지: [C 번호] — 건강한 긴장
3. 모니터링: [C 번호] — 기울어지고 있으나 아직 위험하지 않음
```

저장 위치:
- **프로젝트 범위**: `docs/1-project/[name]/discussions/YYYY-MMDD-HHmm-conflict-report.md`
- **전체 범위**: `docs/2-area/tension/YYYY-MMDD-HHmm-conflict-report.md`
