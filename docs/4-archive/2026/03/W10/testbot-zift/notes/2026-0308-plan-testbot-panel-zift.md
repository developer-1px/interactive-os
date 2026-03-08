# /plan -- TestBot Panel ZIFT

> Created: 2026-03-08
> Goal: TestBot panel ZIFT version을 별도 파일로 생성하여 headless 검증 가능하게 한다.
> Context: bootstrapping -- OS로 OS 도구를 만든다. gap 발견이 목표.

## Constraints

- C1. 기존 TestBotPanel.tsx 수정 금지 (보존, 병렬 비교)
- C2. ZIFT(Zone/Item/Trigger) 사용
- C3. headless 테스트 작성
- C4. OS gap 발견 시 backlog 기록

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `src/apps/testbot/zones.ts` (신규) | 없음 | `TestBotApp.createZone("testbot-suites")` accordion + `TestBotApp.createZone("testbot-toolbar")` toolbar. `bind()` with role, `getItems`, `onAction`. getItems는 `getTestBotState().suites`에서 동적 도출 | Clear | -- | tsc 0 | 동적 getItems (kernel state 직접 읽기) |
| 2 | `src/inspector/panels/TestBotPanelV2.tsx` (신규) | 없음 | 기존 TestBotPanel.tsx 복사 후 ZIFT 재구성. `useState(expandedSuites)` -> accordion aria-expanded. `onClick={toggleSuite}` -> Item 클릭. `onClick={runAll}` -> toolbar onAction. Zone/Item/Item.Content 패턴 | Clear | ->#1 | tsc 0 | 677줄 컴포넌트의 ZIFT 전환 범위 |
| 3 | `src/inspector/register.ts` | TestBotPanel 1개 등록 | V2도 "TESTBOT_V2" / "TestBot v2" 로 추가 등록. 기존 등록 유지 | Clear | ->#2 | tsc 0 | -- |
| 4 | `tests/headless/inspector/testbot-panel.test.ts` (신규) | 없음 | headless page로 accordion 접기/펴기(ArrowDown, Enter), toolbar 클릭(Run All) 검증. `createHeadlessPage(TestBotApp, TestBotPanelV2)` | Clear | ->#1, ->#2 | +N tests | Inspector 내 ZIFT Zone이 headless에서 동작하는지 (OS gap 후보) |

## 라우팅

승인 후 -> `/project` (신규 프로젝트: testbot-zift, Light 규모 -- UI 상호작용 있음)
