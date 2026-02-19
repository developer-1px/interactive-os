---
description: 패턴 A를 패턴 B로 전환하는 리팩토링 파이프라인. 대상 식별부터 재발 방지까지.
---

## /refactor — 패턴 전환

> **분류**: 오케스트레이터. `/go` 보편 사이클의 **Medium 프리셋**을 따른다.
> **이론적 기반**: Mikado Method + Strangler Fig Pattern

### `/go` 보편 사이클과의 관계

`/refactor`는 `/go`의 Medium 프리셋이다. Step 2~4(discussion, prd, redteam)를 skip하고 Step 5(/tdd)부터 시작한다.
다만 진입 전에 대상 식별과 변환 규칙 정의가 선행된다.

### 리팩토링 준비 (보편 사이클 진입 전)

#### 1. 의도 확인
- "왜 리팩토링하는가?" 1문장으로 정의한다.
- 의도가 불명확하면 `/discussion`으로 전환한다.

#### 2. 대상 식별
```bash
# 대상 패턴(A)의 모든 인스턴스를 찾는다
grep -rn "패턴A" src/ --include="*.ts" --include="*.tsx"
```
- 대상 목록과 영향 범위를 기록한다.

#### 3. 변환 규칙 정의
```markdown
## 변환 규칙
패턴 A: [현재 패턴]
패턴 B: [목표 패턴]
변환 전략: [점진적 교체 / 일괄 변환]
```

### 보편 사이클 진입

준비 완료 후, `/go` Medium 프리셋으로 **Step 5(/tdd)부터** 진입:
- Step 5: /tdd — 현재 동작을 보호하는 테스트 먼저 작성
- Step 6: /solve — 패턴 A → B 점진적 변환
- Step 7~13: /review → /fix → /doubt → /cleanup → /verify → /changelog → /ready

### 리팩토링 종료 (보편 사이클 이후)

1. `/rules` — 패턴 A 금지 규칙 추가 (재발 방지).
2. `/retire` — 패턴 A 관련 문서가 있으면 퇴출.
3. Step 14~16: /retrospect → /coverage(선택) → skip(/para).
