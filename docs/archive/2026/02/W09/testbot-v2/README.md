# TestBot v2 — RFC

## Summary

Vitest Browser Mode를 사용하여 기존 vitest 테스트를 실제 브라우저에서 실행하고, `pressKey/click/attrs` 호출을 기록(Record)한 뒤 TestBot Panel에서 시각적으로 재생(Replay)하는 시스템.

## Motivation

### Why

LLM이 작성한 테스트 코드만으로는 인간이 "이 테스트가 진짜 의미 있는가?"를 판단하기 어렵다. `pressKey("ArrowDown") → expect(attrs("b")).toMatchObject({...})`라는 코드를 읽는 것보다, 커서가 실제로 b로 이동하는 것을 보는 것이 빠르다.

### Warrants (from Discussion)

- W1. Visual Verification (커서, 버블, 스탬프)은 불변
- W2. LLM이 작성, 인간이 검증 — 역할 분리
- W3. vitest 코드가 유일한 원본 — TestBot 전용 코드 없음
- W4. "이 OS 위에서 이 OS를 테스트한다" (rules.md 검증 #2)
- W5. "표준이 있으면 발명하지 않는다" — Vitest Browser Mode가 정석
- W6. Record/Replay 분리 — 테스트 속도와 시각화 속도가 독립

### Prior Art

- TestBot v1: Playwright Shim 기반. Todo 12/12 PASS. Playground 0/63. 보류→아카이브.
- `createApgKernel.browser.ts`: 브라우저 DOM 연동 이미 구현 (재작성 대상)
- `test-shim.ts` Vite plugin: 커스텀 shim (정석이 아닌 해킹 — 대체 대상)

## Detailed Design

→ `6-products/testbot/VISION.md` (What/Why)
→ `6-products/testbot/discussions/2026-0221-1340-testbot-v2-divide.md` (How/Tasks)

## Unresolved Questions

- T3 데이터 브릿지: vitest --browser 프로세스 → TestBot Panel 간 데이터 전달 방식 미결정 (JSON 파일 유력)
