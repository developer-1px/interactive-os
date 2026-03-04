# /plan — Action Axis Unification

> Discussion Claim: activate/check/open/expand는 하나의 action 축의 mode.
> Usage Spec: `docs/2-area/praxis/usage-spec-action-axis.md`

## 현황 — 영향받는 파일 전수

### Config 타입 (핵심)
| # | 파일 | 현재 | After |
|---|------|------|-------|
| 1 | `FocusGroupConfig.ts` | activate + check + expand 3개 축 | → action 1개 축 |

### Config 소비자
| # | 파일 | 참조하는 축 | 영향 |
|---|------|------------|------|
| 2 | `roleRegistry.ts` | activate/check/expand presets | preset 구조 변경 |
| 3 | `resolveClick.ts` | activate.onClick | action.onClick 파생 |
| 4 | `simulate.ts` | activate.onClick | 동기화 |
| 5 | `zoneContext.ts` | activate/check/expand | runtime context |
| 6 | `compute.ts` | check.mode/aria | aria 투영 |
| 7 | `activate.ts` | activate command handler | action 축으로 재귀속 |
| 8 | `resolveKeyboard.ts` | check.keys, check keymap | action.keys 파생 |
| 9 | `senseKeyboard.ts` | check.mode | action 감지 |

### TriggerConfig (별도)
| # | 파일 | 현재 | After |
|---|------|------|-------|
| 10 | `TriggerConfig.ts` | open/focus/aria 3축 | → action.mode="open" + Zone config |
| 11 | `triggerRegistry.ts` | trigger role presets | → roleRegistry로 통합 |
| 12 | `resolveTriggerKey.ts` | trigger keymap | → action keymap |
| 13 | `resolveTriggerClick.ts` | trigger click | → action click |

### 테스트
| # | 파일 | 검증 |
|---|------|------|
| 14 | `resolve-axis.test.ts` | 기존 9 tests 유지 + action 축 테스트 추가 |
| 15 | `apg-matrix.test.ts` | 17 tests regression 0 |
| 16 | `rolePresets.test.ts` | preset 구조 변경 반영 |

## 핵심 설계 결론 (Discussion → Clear)

**action = command 배열 직접 참조.** mode enum / effect enum 이중 관리 불필요.

```typescript
// roleRegistry preset 예시
checkbox:    { action: [OS_CHECK()] }
treeitem:    { action: [OS_EXPAND({ action: "toggle" })] }
menuitem:    { action: [OS_ACTIVATE(), OS_OVERLAY_CLOSE()] }
tab:         { action: [OS_SELECT()] }
menu_button: { action: [OS_OVERLAY_OPEN({ overlayId: "..." })] }
```

- command는 순수 데이터 팩토리 → config에서 직접 참조 가능
- roleRegistry → command → schema 단방향, 순환 없음
- activate.effect enum 삭제, mode enum 삭제

## 변환 명세표 (전부 Clear)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 |
|---|------|--------|-------|---------|------|------|
| T1 | `FocusGroupConfig.ts` | activate/check/expand 3축 | `action: BaseCommand[]` 1축 | 🟢 Clear | — | tsc 0 |
| T2 | `roleRegistry.ts` presets | effect enum + check/activate 분리 | command 배열 직접 | 🟢 Clear | →T1 | tsc 0 |
| T3 | `resolveKeyboard.ts` | check.keys + activate hardcoding | action 배열의 첫 command에서 keys 자동 파생 | 🟢 Clear | →T1,T2 | +tests, APG matrix |
| T4 | `resolveClick.ts` + `simulate.ts` | activate.onClick + check.onClick 이중 | action 배열 첫 command에서 onClick 자동 파생 | 🟢 Clear | →T1,T2 | tsc 0 |
| T5 | `compute.ts` + `zoneContext.ts` | check/activate/expand 개별 참조 | action 배열 참조로 통합 | 🟢 Clear | →T1 | tsc 0 |
| T6 | `activate.ts` — effect 삭제 | effect switch (toggleExpand, selectTab, invokeAndClose) | 삭제 — action 배열이 직접 command 결정 | 🟢 Clear | →T1,T2 | tsc 0, regression 0 |
| T7 | TriggerConfig → action 통합 | TriggerConfig 3축 별도 파이프라인 | action: [OS_OVERLAY_OPEN()] + Zone config | 🟢 Clear | →T1,T2,T6 | +tests |

## 위험

- FocusGroupConfig 구조 변경 → OS core 전체 파급. 테스트 regression 필수.
- TriggerConfig 삭제 시 overlay lifecycle 보존 확인

## MECE 점검

CE/ME/No-op 통과 ✅

## 라우팅

승인 후 → `/project` (Heavy) — "action-axis-unification"
