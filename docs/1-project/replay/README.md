# Replay — RFC

## Summary

`createPage` API의 `press/click/query` 호출을 가상 마우스, 가상 키보드, PASS/FAIL 배지로 시각화하여 재생하는 도구. LLM이 vitest로 작성한 테스트를 인간이 눈으로 검증한다.

## Motivation

### Why

LLM이 작성한 테스트 코드가 `PASS`를 반환해도, 인간은 "이 PASS가 진짜 의미 있는가?"를 코드만으로 판단하기 어렵다. `pressKey("ArrowDown") → expect(focusedItemId()).toBe("b")`를 읽는 것보다, **커서가 실제로 b로 이동하는 것을 보는 것**이 빠르다.

### Warrants (from Discussion)

| # | Warrant |
|---|---------|
| W1 | Replay = 동기 실행된 테스트의 시각적 재생. 이름이 곧 기능 |
| W2 | createPage API가 시각화 단위와 1:1 매핑 (press→키보드, click→마우스, query→배지) |
| W3 | vitest 코드가 유일한 원본 — Replay 전용 코드 없음 |
| W4 | "이 OS 위에서 이 OS를 테스트한다" (rules.md 검증 #2) |
| W5 | TestBot v1/v2의 기술적 부채(Shim, ReplayPanel) 없이 깨끗한 시작 |
| W6 | 비전 불변: "LLM이 만든 테스트를 인간이 시각적으로 검증하는 도구" |

### Prior Art

- TestBot v1: Playwright Shim 기반. Todo 12/12 PASS. 한계 발견 → 아카이브.
- TestBot v2: OS 시그널 기반으로 전환 시도. 구현 복잡성으로 보류.
- `createPage(App, View?)`: projection-checkpoint 프로젝트에서 구현 완료. Replay의 기반.
- 기존 가상 마우스/키보드/배지 컴포넌트: 이전 TestBot에서 구현한 시각화 자산.

## Detailed Design

→ `prd.md` 위임

## Unresolved Questions

- createPage의 동기 실행을 어떻게 step-by-step 재생으로 변환하는가? (instrumentation/recording)
- Replay 앱은 별도 라우트(`/replay`)인가, Inspector 탭인가?
- 기존 가상 마우스/키보드 컴포넌트를 재사용할 수 있는가, 처음부터 만드는가?
