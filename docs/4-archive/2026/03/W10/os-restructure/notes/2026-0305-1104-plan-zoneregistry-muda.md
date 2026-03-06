# Plan: zoneRegistry Muda 제거

> Blueprint: [blueprint-zoneregistry-muda.md](../blueprint-zoneregistry-muda.md)
> /why 근본 원인: LLM "path of least resistance" 관성으로 6개 관심사가 하나의 파일에 누적

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `zoneRegistry.ts:triggerOverlays` Map (L108-111) | `const triggerOverlays` Map이 zoneRegistry.ts에 선언 | triggerRegistry.ts 하단에 `// Runtime Registry` 섹션으로 이동 | 🟢 Clear | — | tsc 0, 기존 tests 유지 | 없음 (순수 이동) |
| 2 | `zoneRegistry.ts:setTriggerOverlay` (L311-317) | ZoneRegistry 객체의 메서드 | `TriggerOverlayRegistry.set()` as export from triggerRegistry.ts | 🟢 Clear | →#1 | tsc 0 | 소비자 2곳 (os-sdk/trigger.ts, os-devtool/page.ts) |
| 3 | `zoneRegistry.ts:clearTriggerOverlay` (L319-321) | ZoneRegistry 객체의 메서드 | `TriggerOverlayRegistry.clear()` as export from triggerRegistry.ts | 🟢 Clear | →#1 | tsc 0 | 소비자 1곳 (os-sdk/trigger.ts) |
| 4 | `zoneRegistry.ts:getTriggerOverlay` (L323-327) | ZoneRegistry 객체의 메서드 | `TriggerOverlayRegistry.get()` as export from triggerRegistry.ts | 🟢 Clear | →#1 | tsc 0 | 소비자 3곳 (senseKeyboard, senseMouse, compute.ts) |
| 5 | `os-sdk/trigger.ts:L120-121` | `ZoneRegistry.setTriggerOverlay(...)` / `ZoneRegistry.clearTriggerOverlay(...)` | `TriggerOverlayRegistry.set(...)` / `TriggerOverlayRegistry.clear(...)` | 🟢 Clear | →#2,#3 | tsc 0 | — |
| 6 | `os-devtool/page.ts:L390` | `ZoneRegistry.setTriggerOverlay(...)` | `TriggerOverlayRegistry.set(...)` | 🟢 Clear | →#2 | tsc 0 | — |
| 7 | `senseKeyboard.ts:L34` | `ZoneRegistry.getTriggerOverlay(triggerIdAttr)` | `TriggerOverlayRegistry.get(triggerIdAttr)` | 🟢 Clear | →#4 | tsc 0 | — |
| 8 | `senseMouse.ts:L174` | `ZoneRegistry.getTriggerOverlay(triggerId)` | `TriggerOverlayRegistry.get(triggerId)` | 🟢 Clear | →#4 | tsc 0 | — |
| 9 | `compute.ts:L199` | `ZoneRegistry.getTriggerOverlay(triggerId)` | `TriggerOverlayRegistry.get(triggerId)` | 🟢 Clear | →#4 | tsc 0 | — |
| 10 | `itemQueries.ts:getZoneItems` (L13-24) | 독자적 구현: `entry.getItems()` + `itemFilter` | `ZoneRegistry.resolveItems(zoneId)` 위임 + `itemFilter` 적용 | 🟢 Clear | — | 기존 headless-item-discovery tests 유지 | getZoneItems 소비자가 itemFilter 적용을 기대하는지 확인 필요 |
| 11 | `zoneRegistry.ts:resolveItems` DOM fallback (L343-353) | `getItems` 없을 때 `entry.element` DOM scan | DOM fallback 제거. `getItems` 없으면 빈 배열 반환 | 🟢 Clear | — | tsc 0, vitest 전체 | Zone.tsx가 useMemo에서 existing preserving + bindElement에서 getItems 자동 설치 → fallback 도달 불가 |
| 12 | `zoneRegistry.ts:resolveLabels` DOM fallback (L368-381) | `getLabels` 없을 때 `entry.element` DOM scan | DOM fallback 제거. `getLabels` 없으면 빈 Map 반환 | 🟢 Clear | →#11 | tsc 0, vitest 전체 | bindElement에서 getLabels 자동 설치 → fallback 도달 불가 |

## MECE 점검

1. **CE**: #1~#9 실행 → triggerOverlays 완전 이동. #10 → getZoneItems SPoT 통합. #11~#12 → dead fallback 제거. 목표 달성 ✓
2. **ME**: 중복 행 없음 ✓
3. **No-op**: Before=After 행 없음 ✓

## 라우팅

승인 후 → `/go` (기존 프로젝트: os-core/os-restructure) — BOARD.md에 태스크 추가 후 순차 실행
