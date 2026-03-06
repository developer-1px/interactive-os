# DocsViewer: prev/next/return home을 Trigger로 전환

> Status: [Closed]
> Priority: P2 (대안 존재 — 동작은 하나 안티패턴)
> Created: 2026-03-06

## 증상

- prev/next 버튼이 클릭 시 즉시 동작하지 않음 (re-click 필요)
- return home 버튼이 `onClick={() => os.dispatch()}` 직접 호출 — Pit of Success 위반
- prev/next가 `docs-page-nav` toolbar Zone으로 묶여 있음 — 독립 액션인데 불필요한 Zone

## 근본 원인

1. prev/next/return home은 독립 네비게이션 액션이다. Zone/Item이 아니라 Trigger로 표현해야 한다.
2. `DocsApp.createTrigger(selectDoc)`이 올바른 패턴이다.
3. `onClick={() => os.dispatch()}`는 OS 선언적 구조를 우회하는 안티패턴이다.

## 해결 방향

기존 메커니즘 재사용: `defineApp().createTrigger(commandFactory)` = DynamicTrigger

## 수정 파일 목록

| # | 파일 | 변경 |
|---|------|------|
| 1 | `app.ts` | `pageNavZone` + `DocsPageNavUI` 삭제. `SelectDocTrigger` export 추가 |
| 2 | `DocsViewer.tsx` | prev/next → SelectDocTrigger. return home → SelectDocTrigger |
| 3 | `testbot-docs.ts` | `PAGE_NAV_ITEMS` 삭제 |
| 4 | `docs-tab.test.ts` | 6 zones → 5 zones |

## 엔트로피 체크

"새로운 유일한 패턴을 추가하는가?" → No. 기존 `createTrigger` 패턴 활용.

## 설계 냄새 4질문

- 개체 증가? → No. Zone 1개 감소.
- 내부 노출? → No.
- 동일 버그 타 경로? → No.
- API 확장? → No.
