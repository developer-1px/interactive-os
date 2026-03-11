# Route-Based Manifest + Script Group + Collapse

## Claim

manifest trigger를 Zone→Route로 전환. script-level group으로 2단계 hierarchy. Green 그룹 디폴트 접힘.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `main.tsx` | router 미export | `export const router = createRouter(...)` | Clear | — | tsc 0 | — |
| 2 | `testbot-manifest.ts:ManifestEntry` | `zones: string[]` | `route: string` | Clear | — | tsc 0 | — |
| 3 | `testbot-manifest.ts` entries | `zones: [...]` | `route: "/playground/focus"` 등 | Clear | →#2 | tsc 0 | — |
| 4 | `TestBotRegistry:ManifestEntry` | `zones: string[]` | `route: string` | Clear | →#2 | tsc 0 | — |
| 5 | `TestBotRegistry:initRouteReactive` | ZoneRegistry.subscribe → onZoneChange | router.subscribe → onRouteChange | Clear | →#1,#4 | tsc 0 | router import 경로 |
| 6 | `TestBotRegistry:onRouteChange` | `mounted.has(zone)` → script match | `currentRoute.startsWith(entry.route)` → match | Clear | →#4 | tsc 0 | — |
| 7 | `TestBotPanel.tsx` | `initZoneReactive(manifest)` | `initRouteReactive(manifest, router)` | Clear | →#1,#5 | tsc 0 | — |
| 8 | APG scripts (12개) | `group` 미설정 | 각 패턴별 `group` 설정 (Listbox, Tabs...) | Clear | — | tsc 0 | — |
| 9 | `TestBotRegistry:onRouteChange` | `group: entry.group` 덮어쓰기 | `group: s.group ?? entry.group` (script 우선) | Clear | →#4 | tsc 0 | — |
| 10 | `TestBotPanel.tsx` render | 그룹 항상 펼침 | Green 그룹 디폴트 접힘, Red/Running만 펼침 | Clear | — | tsc 0 | — |

## MECE 점검

1. CE: 10개 모두 실행하면 zone→route 전환 + script group + collapse 완료 ✅
2. ME: 중복 없음 ✅
3. No-op: 모두 Before≠After ✅

## 라우팅

승인 후 → `/go` (test-observability) — T15: Route-based manifest + script group + collapse
