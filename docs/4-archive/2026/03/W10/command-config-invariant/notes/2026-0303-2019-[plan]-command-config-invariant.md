# Command-Config 불변 구조 변환 명세표

> Discussion: `docs/0-inbox/2026-0303-2008-command-config-invariant.md`
> 원칙: Command = { intent + chain(string[]) }. 6 commands. rolePresets = chain 소스.

## 영향 범위 요약

| 패키지 | 파일 수 | 핵심 변경 |
|--------|--------|---------|
| os-core | ~15 | rolePresets config 확장, resolveItemKey 삭제, OS_CHECK/OS_EXPAND 흡수 |
| os-sdk | ~4 | onCheck callback → onSelect(check) 전환, defineApp types |
| os-react | ~2 | resolveKeyboard 참조 정리 |
| apps (todo, builder 등) | ~5 | onCheck → onSelect 마이그레이션 |

**총 ~26 파일. Big Bang 위험 🔴 → 점진적 마이그레이션 필수.**

## 변환 명세표

### Phase 1: Config 확장 (비파괴적, 기존 코드 유지)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `roleRegistry.ts:NavigateConfig` | `orientation, loop, entry, typeahead, arrowExpand` | + `onRight?: string[]`, `onLeft?: string[]`, `onCrossAxis?: string[]`, `onEdge?: string[]` | Clear | — | tsc 0 | 기존 preset 동작 불변 |
| 2 | `roleRegistry.ts:SelectConfig` | `mode, followFocus, range, toggle, disallowEmpty` | + `scope?: "cell"\|"column"\|"row"`, `extend?: boolean`, `aria?: "selected"\|"checked"` | Clear | — | tsc 0 | 기존 preset 동작 불변 |
| 3 | `roleRegistry.ts:ActivateConfig` | `mode, onClick` | + `effect?: string` | Clear | — | tsc 0 | 기존 preset 동작 불변 |
| 4 | `roleRegistry.ts:DismissConfig` | `escape, outsideClick` | + `restoreFocus?: boolean` | Clear | — | tsc 0 | 기존 preset 동작 불변 |
| 5 | `roleRegistry.ts:rolePresets` | 기존 값만 | tree/menu/menubar에 `onRight`, `onLeft`, `onCrossAxis` 배열 추가 | Clear | →#1 | tsc 0, 기존 tests 유지 | 옵셔널이므로 깨지지 않음 |

### Phase 2: NAVIGATE에 chain 실행기 추가 (코어 변경)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 6 | `navigate/index.ts:OS_NAVIGATE` | `direction`만 받고 내부 resolve | `direction + chain` 받아서 chain fallback 실행 | Complicated | →#1,5 | +5 tests (tree onRight 3케이스, menu submenu 2케이스) | navigate 핵심 로직 변경 |
| 7 | `navigate/index.ts:atomicActions` | 없음 | `expand`, `collapse`, `enterChild`, `goParent`, `expandSubmenu`, `closeSubmenu`, `move`, `stop`, `loop` 테이블 | Clear | →#6 | +9 tests (각 action 성공/실패) | 신규 코드 |
| 8 | `osDefaults.ts:keybindings` | `ArrowRight → OS_NAVIGATE({direction:"right"})` | resolve 시 rolePresets에서 chain 복사하여 command에 포함 | Complicated | →#5,6 | 기존 navigation tests 유지 | keybinding 생성 로직 변경 |

### Phase 3: resolveItemKey 대체 (레이어 제거)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 9 | `resolveItemKey.ts` | treeitem/checkbox/switch key→command override | **삭제** (chain으로 대체) | Clear | →#6,7 | 기존 resolve-item-key.test.ts → navigate chain tests로 이관 | resolveKeyboard 호출 제거 필요 |
| 10 | `resolveKeyboard.ts:L2` | Layer 2 resolveItemKey 호출 | Layer 2 제거 | Clear | →#9 | resolveKeyboard tests 유지 | 체인 단순화 |

### Phase 4: CHECK → SELECT 흡수

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 11 | `check.ts:OS_CHECK` | 별도 커맨드 | **삭제**, `OS_SELECT`에 `aria: "checked"` 분기 추가 | Complicated | →#2 | +3 tests (checkbox/switch/radio check via SELECT) | onCheck callback 소비자 전체 |
| 12 | `select.ts:OS_SELECT` | `mode: single/toggle/multiple/none` | + `aria: "checked"` 옵션 시 `aria-checked` 토글 | Complicated | →#11 | 기존 select tests 유지 + check tests 이관 | 핵심 커맨드 변경 |
| 13 | `defineApp/types.ts:ZoneCallbacks` | `onCheck` 별도 | `onSelect(id, { type: "check" })` 또는 **onCheck 유지** | Complicated | →#11,12 | tsc 0 | app API 변경. 파급 클 수 있음 |

### Phase 5: EXPAND → NAVIGATE 흡수

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 14 | `expand/index.ts:OS_EXPAND` | 별도 커맨드 | **삭제**, chain의 `"expand"` atomic action으로 대체 | Clear | →#7 | chain tests에서 검증 | accordion/disclosure의 activate.effect 연동 |
| 15 | `activate.ts:OS_ACTIVATE` | activate 후 별도 expand 호출 | `activate.effect: "toggleExpand"` config으로 전환 | Complicated | →#3 | +2 tests (accordion Enter, disclosure Enter) | activate 핵심 로직 변경 |

### Phase 6: osDefaults modifier 바인딩 추가

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 16 | `osDefaults.ts` | Shift+Arrow↕만 | + `Shift+Arrow↔`, `Ctrl+Arrow`, `Ctrl+Space`, `Shift+Space` | Clear | — | +4 tests | 신규 바인딩. 기존 무영향 |

## MECE 점검

```
1. CE: Phase 1-6 완료 시 9→6 커맨드, resolveItemKey 제거, chain 실행기 도입 → 목표 달성 ✅
2. ME: Phase 3(resolveItemKey 삭제)와 Phase 5(EXPAND 삭제)는 독립 ✅
3. No-op: 없음 ✅
```

## 위험 요약

| 위험 | Phase | 완화 |
|------|-------|------|
| Big Bang regression | 전체 | Phase 1부터 점진적. 각 Phase 후 전체 test suite 실행 |
| onCheck app API 변경 | P4 | onCheck callback은 유지하되 내부를 SELECT dispatch로 전환 (P4 #13) |
| navigate 핵심 로직 | P2 | tree/menu 전용 tests 먼저 작성 (Red), chain 구현 (Green) |
| activate.effect 복잡도 | P5 | accordion/disclosure만 먼저. menu는 후속 |

## 라우팅

승인 후 → `/project` (새 프로젝트: `command-config-invariant`) — OS 핵심 파이프라인 구조 변경. Heavy.
