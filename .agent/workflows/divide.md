---
description: Goal에서 역추적하여 Work Package를 도출한다. /solve의 입력을 만든다.
---

## Step 0: 입력 수집

- `/discussion`의 Emerging Claim + Warrants를 읽는다
- Goal이 없으면 한 문장으로 확인한다 (이것만 질문)

## Step 1: 선제 분해 (AI 자율)

Goal에서 backward chaining으로 **전체 WP를 한 번에** 도출한다:

| # | WP | 산출물 | 검증 기준 | Cynefin | Gap |
|---|-----|--------|----------|---------|-----|
| 1 | ... | ...    | 테스트/파일 | Clear | — |
| 2 | ... | ...    | ... | Complicated | 선택지 A vs B |
| 3 | ... | ...    | ... | Complex | ❓ [질문] |

규칙:
- **Clear/Complicated WP는 질문하지 않는다** — AI 판단으로 확정
- **Complex WP만 Gap 열에 질문을 넣는다** — 사용자 답변 대기
- WP 크기 = 한 세션(~30분) 이내
- 의존 순서도 함께 제시: `WP1 → WP2 → (WP3 ∥ WP4) → WP5`

## Step 2: 사용자 응답 (Complex gap만)

- Complex gap에 대한 사용자 답변을 받으면 해당 WP를 확정
- 답변 없는 Clear/Complicated WP는 이미 확정 상태

## Step 3: BOARD.md 기록 → /go

- 승인 시 `docs/1-project/[domain]/[name]/BOARD.md`에 기록
- Now/Next/Later 배치 후 `/go` 전환
