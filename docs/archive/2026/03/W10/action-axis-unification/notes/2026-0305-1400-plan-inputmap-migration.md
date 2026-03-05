# Plan: ActionConfig + ActivateConfig → inputmap 마이그레이션

> Discussion 결론: ZoneConfig = 6 커맨드 파라미터 축 + inputmap (입력→커맨드 라우팅)
> 기존 ActionConfig(commands/keys/keymap/onClick) + ActivateConfig를 inputmap으로 통합

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `FocusGroupConfig.ts`: 타입 정의 | `ActionConfig { commands, keys, keymap, onClick }` + `ActivateConfig { mode, onClick, reClickOnly, effect }` + `FocusGroupConfig.action` + `FocusGroupConfig.activate` | `inputmap: Partial<Record<string, BaseCommand[]>>` 필드 추가. ActionConfig/ActivateConfig/ActionKey 타입 삭제. FocusGroupConfig에서 action, activate 필드 제거 | Clear | — | tsc 0 | 17개 파일 import 파급 |
| 2 | `FocusGroupConfig.ts`: DEFAULT_CONFIG | `DEFAULT_ACTION: { commands: [] }`, `DEFAULT_ACTIVATE: { mode: "manual", ... }` 포함 | `DEFAULT_INPUTMAP: {}` (빈 Record). DEFAULT_ACTION, DEFAULT_ACTIVATE 삭제 | Clear | →#1 | tsc 0 | — |
| 3 | `roleRegistry.ts`: role presets | `action: { commands: [OS_CHECK()], keys: ["Space"] }` + `activate: { mode, onClick }` 이중 선언 | `inputmap: { Space: [OS_CHECK()], click: [OS_CHECK()] }` 직접 선언. activate 필드 전면 제거 | Clear | →#1 | 기존 rolePresets.test.ts 갱신 | 25개 role preset 전수 변환 |
| 4 | `roleRegistry.ts`: `resolveRole()` | action 축 특수 merge (getDefaultKeysForCommand, getDefaultOnClickForCommand 자동 파생) | inputmap shallow merge (`{ ...DEFAULT_INPUTMAP, ...preset.inputmap, ...overrides.inputmap }`). 자동 파생 로직 삭제 | Clear | →#1, →#3 | tsc 0 | merge 전략 변경 |
| 5 | `roleRegistry.ts`: helper 함수 | `getDefaultKeysForCommand()` (private), `getDefaultOnClickForCommand()` (exported) | 두 함수 삭제. inputmap이 명시적이므로 자동 파생 불필요 | Clear | →#3, →#4 | tsc 0 | simulate.ts, PointerListener.tsx import 제거 |
| 6 | `resolveKeyboard.ts`: action layer | `input.activeZoneAction` → ActionConfig → keys/keymap 변환 → actionKeymap layer push | `input.activeZoneInputmap` → Record → 직접 layer push. keys/keymap 변환 로직 삭제 | Clear | →#1 | 기존 resolveKeyboard.test.ts 갱신 | 키 매칭 정확성 |
| 7 | `senseKeyboard.ts`: action 읽기 | `activeZoneAction: (entry?.config?.action?.commands?.length ? entry.config.action : null) as ActionConfig` | `activeZoneInputmap: entry?.config?.inputmap ?? null` | Clear | →#1, →#6 | tsc 0 | — |
| 8 | `simulate.ts`: keyPress action 읽기 | `activeZoneAction: ...entry.config.action...` (ActionConfig 전달) | `activeZoneInputmap: entry?.config?.inputmap ?? null` | Clear | →#1, →#6 | tsc 0 | — |
| 9 | `simulate.ts`: click routing | `actionConfig.commands[0]` + `actionConfig.onClick ?? getDefaultOnClickForCommand()` + `activate.onClick` fallback + `reClickOnly` | `entry.config.inputmap["click"]` 직접 조회. Shift/Meta modifier: `inputmap["Shift+click"]`, `inputmap["Meta+click"]` 조회. reClickOnly → inputmap에서 표현 (또는 제거) | Complicated | →#1, →#3 | +click routing tests | reClickOnly 패턴 대체 방법 |
| 10 | `PointerListener.tsx`: click routing | `actionConfig.commands[0]` + `getDefaultOnClickForCommand()` + `activate.onClick` fallback | `entry.config.inputmap["click"]` 직접 조회. modifier별 `inputmap["Shift+click"]` 등 | Clear | →#9과 동일 로직 | 기존 pointer tests 유지 | DOM 이벤트와 inputmap key 매칭 |
| 11 | `compute.ts`: ARIA projection | `hasCheckCommand = config.action.commands.some(c => c.type === "OS_CHECK")` | `hasCheckCommand = Object.values(config.inputmap).flat().some(c => c.type === "OS_CHECK")` — inputmap 전체에서 command 존재 여부 탐색 | Clear | →#1 | 기존 compute tests 유지 | 성능 (매 렌더 flat scan) — 캐시 고려 |
| 12 | `zoneContext.ts`: ZoneOptions | `action?: Partial<ActionConfig>`, `activate?: Partial<ActivateConfig>` | `inputmap?: Partial<Record<string, BaseCommand[]>>`. activate 필드 제거 | Clear | →#1 | tsc 0 | — |
| 13 | `page.ts` (defineApp): GotoOptions | `config?: Partial<FocusGroupConfig>` (action, activate 포함) | `config.inputmap` merge. action/activate 제거 | Clear | →#1 | 기존 page tests 유지 | — |
| 14 | shim 파일 정리 | `FocusActivateConfig.ts` re-export | 삭제 | Clear | →#1 | tsc 0 | — |
| 15 | `schema/types/index.ts`: exports | `ActivateConfig`, `DEFAULT_ACTIVATE`, `ActionConfig`, `DEFAULT_ACTION`, `ActionKey` export | 제거. 필요 시 inputmap 관련 타입 export | Clear | →#1 | tsc 0 | — |
| 16 | 테스트: rolePresets.test.ts | `activate.mode`, `dismissEsc` 등 검증 | inputmap 기반 검증으로 전환 | Clear | →#3 | tests PASS | — |
| 17 | 테스트: config-chain.test.ts | action 축 merge 검증 | inputmap merge 검증 | Clear | →#4 | tests PASS | — |
| 18 | 테스트: resolve-axis.test.ts | ActionConfig 기반 키 분기 검증 | inputmap 기반 키 분기 검증 | Clear | →#6 | tests PASS | — |
| 19 | 테스트: check-select-absorption.test.ts | action.commands 기반 | inputmap 기반 | Clear | →#1 | tests PASS | — |
| 20 | 테스트: expand-absorption.test.ts | action.commands 기반 | inputmap 기반 | Clear | →#1 | tests PASS | — |

## 비-Clear 행 해소

### #9 (Complicated): click routing — reClickOnly 대체

**문제**: `ActivateConfig.reClickOnly`는 "이미 focus된 item을 re-click해야 활성화"하는 Figma/Slides 패턴. inputmap에서 이를 어떻게 표현?

**제 판단**: reClickOnly는 inputmap 라우팅이 아니라 **click의 조건부 동작**이다. 두 가지 선택지:
- A) select 축에 `reClickOnly: boolean` 추가 (click 시 조건 분기)
- B) inputmap에 `"reclick": [OS_ACTIVATE()]` 같은 가상 입력 추가

**추천: A안.** reClickOnly는 "첫 click = focus+select, 재 click = activate"라는 선택 정책이므로 select 축이 적합. inputmap은 순수 라우팅만 담당.

→ select config에 `reClickOnly?: boolean` 추가. 기존 tree preset의 `activate: { reClickOnly: true }` → `select: { reClickOnly: true }`.

## MECE 점검

1. **CE**: #1~#20 전부 실행하면 ActionConfig+ActivateConfig 완전 제거, inputmap으로 대체 → ✅
2. **ME**: 중복 없음 (각 행이 별도 파일/관심사) → ✅
3. **No-op**: Before≠After 전행 확인 → ✅

## ProjectConfig 결정

ProjectConfig(`autoFocus`, `virtualFocus`)는 이번 스코프에서 **유지**한다. 이유:
- 커맨드 라우팅이 아닌 포커스 투영 정책 (Zone.tsx, Item.tsx에서 사용)
- inputmap과 무관한 관심사
- 추후 navigate 축으로 흡수 검토 가능

## 라우팅

승인 후 → `/go` (기존 프로젝트: action-axis-unification) — T8 이후 T9~T20으로 태스크 등록
