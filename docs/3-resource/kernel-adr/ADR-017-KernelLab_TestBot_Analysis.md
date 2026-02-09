# KernelLab TestBot: expect 미동작 분석 및 수정 보고서

## 1. 개요 (Overview)

kernel-lab 페이지의 TestBot 실행 시 expect 단언이 전혀 실행되지 않는 문제 분석 및 수정 완료.

## 2. 근본 원인 (Root Cause)

### 원인 #1 — `findByText`의 완전 일치(exact match) vs Playwright 부분 일치 관례

`findByText`는 `textContent.trim() === text` (완전 일치)를 사용했으나, API 이름 `getByText`는 Playwright에서 유래했으며 Playwright 기본 동작은 **부분 일치(substring)**. LLM이 Playwright 패턴으로 테스트를 작성하면서 `getByText('"count": 0')` 같은 부분 문자열을 검색 → `<pre>` 안 전체 JSON과 매칭 불가 → `BotError` throw.

### 원인 #2 — `BotError` 무시 패턴

`getByText` 실패 시 `BotError`를 throw하지만, `executeSuite`의 catch에서 `BotError`를 명시적으로 무시 → **에러 스텝 기록 없이 0 steps로 조용히 실패**.

### 원인 #3 — API 이름과 동작의 불일치

TestBot API가 Playwright 이름 체계를 사용하면서도 동작이 달라, LLM이 자신있게 틀린 코드를 작성하는 최악의 패턴 발생.

## 3. 수정 내용 (Changes Made)

| 항목 | 변경 |
|------|------|
| `findByText` | `===` → `includes()` (Playwright 기본 = substring) |
| `findAllByText` | 동일 |
| `focused()` | → `toBeFocused()` (Playwright 관례) |
| `toHaveAttr()` | → `toHaveAttribute()` (Playwright 관례) |
| `toNotHaveAttr()` | → `toNotHaveAttribute()` (Playwright 관례) |
| `getByText`/`getByRole` 실패 | throw 전 에러 스텝 기록 |

영향 파일: `selectors.ts`, `TestActions.ts`, `createActions.ts`, `createMockActions.ts`, `FocusShowcaseBot.tsx`, `SpatialTest.tsx`, `DisclosureTest.tsx`, `GridTest.tsx`

## 4. 결론 (Conclusion)

**API 이름-동작 불일치 + LLM 비친화적 설계**가 근본 원인. Playwright 관례에 맞춰 수정 완료. `tsc --noEmit` 통과 확인.
