# Plan: OS_ZONE_INIT 제거 — 변환 명세표

> Blueprint: `docs/0-inbox/2026-0305-0845-blueprint-eliminate-zone-init.md`

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `compute.ts:computeItem` L92-100 | `if ("aria-selected" in ariaItemState)` + `"aria-checked" in` + `"aria-pressed" in` + `"aria-expanded" in` — items map 키 존재에 의존 | config에서 직접 판단: `config.select?.mode !== "none"` → project selected, `config.expand?.mode !== "none"` → project expanded, inputmap에서 OS_CHECK/OS_PRESS 존재 여부로 판단 | 🟢 Clear | — | accordion headless 24/24 PASS | computeItem 소비자 전체 (Item.tsx, headless, resolveElement) |
| 2 | `compute.ts:computeItem` L54-57 주석 | `// Seeded at Zone init (OS_ZONE_INIT) via seedAriaState()` | 주석 삭제 또는 config 기반으로 갱신 | 🟢 Clear | #1 | — | — |
| 3 | `seedAriaState.ts` (83줄) | `deriveAriaKeys()` + `seedAriaState()` 존재 | **파일 삭제** | 🟢 Clear | #1 | tsc 0 | zoneInit.ts, page.ts에서 import 제거 필요 |
| 4 | `zoneInit.ts` (48줄) | `OS_ZONE_INIT` 커맨드 정의 — zone 상태 생성 + seed | **파일 삭제** | 🟢 Clear | #3 | tsc 0 | 5곳 import/dispatch 제거 필요 |
| 5 | `focus/index.ts` L4 | `export { OS_ZONE_INIT } from "./zoneInit"` | **해당 줄 삭제** | 🟢 Clear | #4 | tsc 0 | — |
| 6 | `Zone.tsx` L32, L162 | `OS_ZONE_INIT` import + `os.dispatch(OS_ZONE_INIT(zoneId))` | import 제거, dispatch 줄 삭제 | 🟢 Clear | #4 | tsc 0 | Zone 마운트 시 zone 상태는 OS_FOCUS의 ensureZone이 생성 |
| 7 | `simulate.ts` L38, L355 | `import { OS_ZONE_INIT }` + `kernel.dispatch(OS_ZONE_INIT(zoneId))` | import 제거, dispatch 삭제. registerHeadlessZone은 ZoneRegistry.register만 하고 kernel state 생성은 첫 커맨드에 위임 | 🟢 Clear | #4 | headless-item-discovery 테스트 PASS | registerHeadlessZone 소비자 |
| 8 | `page.ts:setActiveZone` L820-838 | `const seeded = seedAriaState(mockConfig, mockItems)` + seed 블록 | seed 블록 삭제. ensureZone만으로 zone 상태 생성 (이미 L823-840에서 `produce` + `ensureZone` 사용 중) | 🟢 Clear | #3 | accordion headless PASS | setActiveZone 소비자 (apg.test.ts 전체) |
| 9 | `page.ts:goto` L1008-1075 | T1+T2 seed 블록: needsAriaSeed 판단 + items 순회 + `"aria-expanded": false` 세팅 | **seed 블록 삭제**. initial.selection과 initial.expanded 로직은 유지 (값 설정이므로 seed와 무관) | 🟢 Clear | #3 | defineApp 기반 테스트 PASS | goto 소비자 (createPage/createOsPage) |
| 10 | `page.ts` L20 | `import { seedAriaState } from "@os-core/3-inject/seedAriaState"` | **import 삭제** | 🟢 Clear | #9 | tsc 0 | — |
| 11 | `headless-item-discovery.test.ts` L21, L48 | `import { OS_ZONE_INIT }` + `os.dispatch(OS_ZONE_INIT(zoneId))` | import 제거, dispatch 제거. 대신 `os.dispatch(OS_FOCUS({zoneId, itemId: null}))` 또는 직접 setState로 zone 생성 | 🟢 Clear | #4 | 해당 테스트 PASS | — |

## MECE 점검

1. **CE (전수 완료?)**: #1(computeItem 코어)~#11(테스트) — OS_ZONE_INIT·seedAriaState 전체 참조 제거 + computeItem 전환. ✅ 누락 없음.
2. **ME (중복?)**: #4(zoneInit 삭제)와 #5(export 삭제)는 관련되나 파일이 다름. 중복 아님. ✅
3. **No-op**: 없음. 모든 행이 실질 변경. ✅

## 라우팅

승인 후 → `/issue` (기존 프로젝트 없음, 단일 이슈 성격) — OS_ZONE_INIT 설계 미스 수정. `docs/1-project/0-issue/`에 등록.

> 프로젝트로 분리하기엔 스코프가 작음 (삭제 위주). 이슈 수준.
