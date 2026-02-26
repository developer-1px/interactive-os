# /divide Report — Trigger 선언 headless 자동 등록

## Problem Frame

| | 내용 |
|---|------|
| **Objective** | `page.click(id)`가 수동 `setItemCallback` 없이 Trigger의 overlay open을 자동 동작 (🟢) |
| **Constraints** | 기존 113 테스트 유지, zone 구조 변경 없음, 브라우저 동작 유지 (🟢) |
| **Variables** | Trigger 선언 등록 방식, createPage/defineApp 확장 (🟡) |

## Backward Chain

| Depth | Subgoal | 충족? | Evidence | 미충족 시 전제조건 |
|-------|---------|-------|----------|--------------------|
| 0 | `page.click(id)` → overlay open (수동 setup 0) | ❌ | 현재 테스트에 수동 `setItemCallback` 필요 | → A, B |
| 1 | A: `simulateClick`이 item의 onActivate를 찾을 수 있다 | ✅ | `headless.ts:L237-249` findItemCallback | — |
| 1 | B: onActivate가 ZoneRegistry에 자동 등록되어 있다 | ❌ | `FocusItem.tsx:L187-194` useLayoutEffect = headless에서 안 돌음 | → B1, B2 |
| 2 | B1: Trigger의 선언 데이터(id, role, overlayId)가 React 밖에서 접근 가능하다 | ❌ | `LocaleSwitcher.tsx:L39` — JSX 안에만 존재. defineApp에 없음 | → B1a, B1b |
| 2 | B2: `createPage` 또는 `goto`가 선언 데이터를 읽어 `setItemCallback`을 자동 호출한다 | ❌ | `defineApp.page.ts:L138-167` goto는 zoneBindingEntries만 읽음 | 🔨 WP (B1 해결 후) |
| 3 | B1a: `defineApp`에 trigger 선언 API 추가 (`app.trigger(id, {role, overlayId})`) | ❌ | `defineApp.ts` — 현재 `createZone`만 존재, trigger API 없음 | 🔨 Work Package |
| 3 | B1b: zone.bind() 확장 — zone에 속한 trigger 목록 선언 | ❌ | `defineApp.ts:L251-256` — bindings에 triggers 필드 없음 | 🔨 Work Package (B1a의 대안) |

## Work Packages

| WP | Subgoal | 왜 필요한가 (chain) | Evidence | 대안 |
|----|---------|-------------------|----------|------|
| **B1a** | `defineApp`에 trigger 선언 API 추가 | Goal ← B ← B1 ← B1a | `defineApp.ts` createZone 패턴과 동일하게 triggerBindingEntries | zone 패턴 재사용. zone과 독립적 |
| **B1b** | zone.bind() 확장: triggers 필드 | Goal ← B ← B1 ← B1b | `defineApp.ts:L251` | Trigger가 zone에 종속 |
| **B2** | goto()에서 trigger callback 자동 등록 | Goal ← B ← B2 (B1 해결 후) | `defineApp.page.ts:L138` | B1a/B1b 중 하나 선택 후 구현 |

## B1a vs B1b 비교

| | B1a: `app.trigger()` | B1b: `zone.bind({triggers})` |
|---|---------------------|------------------------------|
| zone 종속성 | 독립 (zone 밖 trigger 가능) | zone에 종속 |
| 기존 패턴과 유사 | `app.createZone()` 패턴과 동일 | `zone.bind({onAction})` 패턴과 동일 |
| Trigger-Zone 관계 | 별도 선언 필요 | zone.bind에서 암묵적 소속 |
| 실제 사용 | `<Trigger>`가 zone 안에 렌더되므로 zone 소속이 자연스러움 | ✅ 기존 bind 확장만으로 충분 |

## Residual Uncertainty

- B1a vs B1b 결정 미확정 (🟡)
  - **제 판단: B1b (zone.bind 확장)**. 이유: Trigger는 실제로 zone 안에 렌더됨 (sidebar 안의 LocaleSwitcher). zone.bind에 triggers 필드를 추가하면 기존 패턴 확장으로 끝남. 새 API 불필요.
