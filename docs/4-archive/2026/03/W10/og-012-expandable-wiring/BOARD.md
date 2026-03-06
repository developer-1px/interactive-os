# og-012-expandable-wiring

## Context

Claim: page.ts goto()가 expandableItems/treeLevels/items를 ZoneRegistry에 전달하지 않아 tree/treegrid의 aria-expanded projection이 깨진다. goto() opts 확장으로 해결.

Root cause: page.ts goto() opts 타입이 { focusedItemId, config, initial }만 허용. 테스트가 전달하는 expandableItems/treeLevels/items는 TypeScript excess property로 무시됨. ZoneRegistry에는 showcase의 bindings만 등록되어 테스트 ID와 불일치.

Fix: goto() opts에 items/expandableItems/treeLevels 추가. opts가 있으면 bindings보다 우선.

## Now
(empty)

## Done
- [x] T1: goto() opts에 items/expandableItems/treeLevels 추가 + ZoneRegistry override — page.ts ~15줄 수정
- [x] T2: 전체 APG 테스트 실행 — 108→18 failures (90 tests fixed), 0 regressions ✅

## Unresolved
- tree 3건: TreeApp=multi-select, 테스트=single-select 기대 (test-config mismatch)
- menu-button 12건: overlay/popup headless STACK gap (pre-existing)
- tabs 1건, meter 1건, checkbox 1건: pre-existing pattern-specific gaps
