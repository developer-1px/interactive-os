# OS → OS-New 마이그레이션 현황

> 날짜: 2026-02-10
> 태그: refactoring, os, os-new, migration
> 상태: 현황 스냅샷

---

## 1. 아키텍처 전환 요약

```
Legacy (os/)                          New (os-new/)
─────────────────                     ──────────────────
Zustand Store 직접 조작               Kernel dispatch → effects
FocusGroupStore (monolithic)          createKernel<AppState>
CommandRegistry + EventBus            kernel.defineCommand → CommandFactory
resolveFocusMiddleware                kernel.defineContext + group inject
imperative effect execution           kernel.defineEffect → Effects as Data
```

---

## 2. 파이프라인 계층별 마이그레이션 상태

### 2.1 Sensor / Listener (입력 번역)

| Legacy (`os/`) | New (`os-new/`) | 상태 |
|---|---|---|
| `features/keyboard/` (KeyboardIntent, routeKeyboard, routeCommand, routeField) | `1-sensor/keyboard/` (KeyboardSensor, KeyboardIntent, classifyKeyboard, interceptKeyboard) | ✅ 마이그레이션 완료 |
| `features/focus/pipeline/2-intent/FocusIntent.tsx` | `1-sensor/focus/FocusSensor.tsx` | ✅ 마이그레이션 완료 |
| — | `1-sensor/clipboard/ClipboardSensor.tsx` | ✅ 신규 추가 |
| — | `1-sensor/history/HistoryIntent.tsx` | ✅ 신규 추가 |
| — | `1-listeners/` (KeyboardListener, keybindings, osDefaults) | ✅ 신규 (Kernel용 리스너) |

### 2.2 Command (커맨드 정의 & 해석)

**Legacy Pipeline (`2-command/`)** — Zustand 직접 조작 방식. 기존 순수 로직 보존.

| 커맨드 | Legacy (`os/`) | New Pipeline (`2-command/`) | Kernel (`3-commands/`) | 상태 |
|---|---|---|---|---|
| **NAVIGATE** | `focus/pipeline/3-resolve/resolveNavigate.ts` + strategies | `navigate/navigateCommand.ts` + resolve, strategies, cornerNav, zoneSpatial, focusFinder, entry | `navigate.ts` | ✅ 양쪽 존재 |
| **ACTIVATE** | `focus/pipeline/core/osCommand.ts` | `activate/activateCommand.ts` | `activate.ts` | ✅ 양쪽 존재 |
| **ESCAPE** | `focus/pipeline/core/osCommand.ts` | `escape/escapeCommand.ts` | `escape.ts` | ✅ 양쪽 존재 |
| **TAB** | `focus/pipeline/core/osCommand.ts` | `tab/tabCommand.ts` | `tab.ts` | ✅ 양쪽 존재 |
| **SELECT** | `focus/pipeline/core/osCommand.ts` | `select/selectCommand.ts`, `select/all.ts` | `select.ts` | ✅ 양쪽 존재 |
| **SELECTION_**(SET/ADD/REMOVE/TOGGLE/CLEAR) | — | — | `selection.ts` | ✅ Kernel only (신규) |
| **EXPAND** | `focus/pipeline/3-resolve/resolveExpansion.ts` | `expand/expandCommand.ts`, `expand/resolveExpansion.ts` | `expand.ts` | ✅ 양쪽 존재 |
| **FOCUS** | `focus/pipeline/core/osCommand.ts` | `focus/focusCommand.ts`, `focus/sync.ts`, `focus/RECOVER.ts` | `focus.ts` | ✅ 양쪽 존재 |
| **SYNC_FOCUS** | — | — | `syncFocus.ts` | ✅ Kernel only (신규) |
| **RECOVER** | — | `focus/RECOVER.ts` | `recover.ts` | ✅ 양쪽 존재 |
| **TOGGLE** | — | `toggle/toggleCommand.ts` | — | ⚠️ Pipeline only |
| **DELETE** | — | `delete/deleteCommand.ts` | — | ⚠️ Pipeline only |
| **FIELD_*** | `features/keyboard/` | `field/` (BLUR, CANCEL, COMMIT, START_EDIT, SYNC) | — | ⚠️ Pipeline only |
| **KEYBOARD** | `features/keyboard/pipeline/core/keyboardCommand.ts` | `keyboardCommand.ts` | — | ⚠️ Pipeline only |

### 2.3 Context (커널 컨텍스트 주입)

| Context | 설명 | 파일 | 상태 |
|---|---|---|---|
| `DOM_ITEMS` | active zone 내 아이템 ID 목록 | `2-contexts/index.ts` | ✅ 구현됨 |
| `DOM_RECTS` | 아이템 DOMRect (spatial nav용) | `2-contexts/index.ts` | ✅ 구현됨 |
| `ZONE_CONFIG` | active zone의 FocusGroupConfig | `2-contexts/index.ts` | ✅ 구현됨 |
| `ZoneRegistry` | Zone 등록/해제 레지스트리 | `2-contexts/zoneRegistry.ts` | ✅ 구현됨 |

### 2.4 Store (상태 관리)

| Legacy (`os/`) | New (`os-new/`) | 상태 |
|---|---|---|
| `features/focus/store/focusGroupStore.ts` (Zustand) | `3-store/focusGroupStore.ts` (Zustand 유지) | ✅ 복사됨 |
| `features/focus/store/slices/cursor.ts` | `3-store/slices/cursor.ts` | ✅ 복사됨 |
| `features/focus/store/slices/expansion.ts` | `3-store/slices/expansion.ts` | ✅ 복사됨 |
| `features/focus/store/slices/selection.ts` | `3-store/slices/selection.ts` | ✅ 복사됨 |
| `features/focus/store/slices/spatial.ts` | `3-store/slices/spatial.ts` | ✅ 복사됨 |
| `features/keyboard/registry/FieldRegistry.ts` | `3-store/FieldRegistry.ts` | ✅ 복사됨 |
| `features/command/store/CommandEngineStore.ts` | — | ❌ 미마이그레이션 (Kernel 대체) |
| `features/command/store/CommandTelemetryStore.ts` | — | ❌ 미마이그레이션 (Kernel Transaction 대체) |
| — | `state/OSState.ts` + `state/initial.ts` | ✅ Kernel용 새 상태 정의 |

> **참고:** `3-store/`(Zustand)와 `state/`(Kernel)가 공존 중. Kernel 전환 완료 시 `3-store/`는 제거 대상.

### 2.5 Effect (부수효과)

| Legacy (`os/`) | New (`os-new/`) | 상태 |
|---|---|---|
| `schema/effects.ts` (타입 정의) | `schema/effect/EffectRecord.ts` | ✅ 타입 마이그레이션 |
| `middleware/` (historyMiddleware, navigationMiddleware) | `4-effect/` (OSMiddleware, HistoryState, buildBubblePath, resolvePayload) | ✅ 마이그레이션 완료 |
| 직접 DOM 조작 (imperative) | `4-effects/index.ts` (FOCUS, SCROLL, BLUR, CLICK — Kernel defineEffect) | ✅ Kernel 이펙트 전환 |

### 2.6 Hook (React)

| Legacy (`os/`) | New (`os-new/`) | 상태 |
|---|---|---|
| `features/focus/hooks/useFocusExpansion.ts` | `5-hooks/useExpanded.ts` | ✅ Kernel `useComputed` 기반 |
| `features/focus/hooks/useFocusRecovery.ts` | — | ❌ 미마이그레이션 |
| `features/focus/hooks/useIsFocusedGroup.ts` | `primitives/hooks/useIsFocusedGroup.ts` | ✅ 복사됨 |
| — | `5-hooks/useFocused.ts` | ✅ Kernel `useComputed` 기반 (신규) |
| — | `5-hooks/useSelected.ts` | ✅ Kernel `useComputed` 기반 (신규) |
| — | `5-hooks/useActiveZone.ts` | ✅ Kernel `useComputed` 기반 (신규) |
| `shared/hooks/useEventListeners.ts` | `shared/hooks/useEventListeners.ts` | ✅ 복사됨 |

### 2.7 Component / Primitive

| Legacy (`os/`) | New (`os-new/`) | 상태 |
|---|---|---|
| `features/focus/primitives/FocusGroup.tsx` | `primitives/FocusGroup.tsx` | ✅ 복사됨 (Zustand 기반) |
| `features/focus/primitives/FocusItem.tsx` | `primitives/FocusItem.tsx` | ✅ 복사됨 (Zustand 기반) |
| `app/export/primitives/Zone.tsx` | `6-components/Zone.tsx` | ✅ Kernel 기반 신규 |
| `app/export/primitives/Item.tsx` | `6-components/Item.tsx` | ✅ Kernel 기반 신규 |
| `app/export/primitives/App.tsx` | — | ❌ 미마이그레이션 |
| `app/export/primitives/Builder*.tsx` (6개) | — | ❌ 미마이그레이션 |
| `app/export/primitives/Field.tsx` | — | ❌ 미마이그레이션 |
| `app/export/primitives/Label.tsx` | — | ❌ 미마이그레이션 |
| `app/export/primitives/Root.tsx` | — | ❌ 미마이그레이션 |
| `app/export/primitives/Trigger.tsx` | — | ❌ 미마이그레이션 |
| — | `6-components/ZoneContext.tsx` | ✅ 신규 |

### 2.8 Schema / Types

| Legacy (`os/`) | New (`os-new/`) | 상태 |
|---|---|---|
| `schema/OSState.ts` | `schema/state/OSState.ts` + `state/OSState.ts` | ✅ 재정의 (Kernel용) |
| `schema/effects.ts` | `schema/effect/EffectRecord.ts` | ✅ 마이그레이션 |
| `schema/focus.ts` | `schema/focus/` (FocusState, FocusTarget, FocusNode 등 8+파일) | ✅ 세분화 완료 |
| `schema/transaction.ts` | `schema/state/OSTransaction.ts` + Kernel Transaction | ✅ Kernel 대체 |
| `entities/BaseCommand.ts` | `schema/command/BaseCommand.ts` | ✅ 마이그레이션 |
| `entities/CommandDefinition.ts` | — | ❌ Kernel CommandFactory 대체 |
| `entities/CommandFactory.ts` | — | ❌ Kernel CommandFactory 대체 |
| `entities/FocusTarget.ts` | `schema/focus/FocusTarget.ts` | ✅ 마이그레이션 |
| `entities/KeybindingItem.ts` | `schema/keyboard/KeybindingItem.ts` | ✅ 마이그레이션 |
| — | `schema/focus/config/` (7개 config 타입) | ✅ 신규 (세분화) |

### 2.9 Inspector / Debug

| Legacy (`os/`) | New (`os-new/`) | 상태 |
|---|---|---|
| `app/debug/inspector/KernelPanel.tsx` | 동일 위치 (os/ 공유) | ✅ Kernel 연동 |
| `app/debug/inspector/OSStateViewer.tsx` | 동일 위치 (os/ 공유) | ✅ 기존 유지 |
| `app/debug/inspector/EventStream.tsx` | 동일 위치 (os/ 공유) | ✅ 기존 유지 |
| `app/debug/CommandInspector.tsx` | 동일 위치 (os/ 공유) | ✅ 기존 유지 |
| `inspector/InspectorRegistry.ts` | 동일 위치 (os/ 공유) | ✅ 기존 유지 |

> Inspector는 `os/` 에 남아서 양쪽 모두 서비스. Kernel Inspector(KernelPanel)가 추가됨.

### 2.10 TestBot

| Legacy (`os/`) | New (`os-new/`) | 상태 |
|---|---|---|
| `testBot/` (전체 14 파일) | — | ❌ 미마이그레이션 |

> TestBot은 os/ 전용으로 유지. Kernel 테스트는 `packages/kernel/src/__tests__/` 에서 별도 수행 (70 tests).

### 2.11 기타

| Legacy (`os/`) | New (`os-new/`) | 상태 |
|---|---|---|
| `features/logic/` (LogicNode, Rule, evalContext) | `core/logic/` (동일) | ✅ 복사됨 |
| `features/focus/registry/roleRegistry.ts` | `registry/roleRegistry.ts` | ✅ 복사됨 |
| `features/jurisdiction/model/GroupRegistry.ts` | — | ❌ 미마이그레이션 |
| `features/persistence/` (PersistenceAdapter, hydrateState) | `schema/state/PersistenceAdapter.ts` (타입만) | ⚠️ 타입만 |
| `features/application/defineApplication.ts` | — | ❌ 미마이그레이션 |
| `features/command/lib/createCommandFactory.ts` | — | ❌ Kernel CommandFactory 대체 |
| `features/command/model/CommandRegistry.ts` | — | ❌ Kernel Registry 대체 |
| `features/command/model/createEngine.ts` | — | ❌ Kernel 대체 |
| `features/command/pipeline/` | — | ❌ Kernel dispatch 대체 |
| `lib/Slot.tsx` | `shared/Slot.tsx` | ✅ 복사됨 |
| `lib/loopGuard.ts` | `lib/loopGuard.ts` | ✅ 복사됨 |
| `features/focus/lib/dom.ts` | `lib/dom.ts` | ✅ 복사됨 |
| `features/focus/lib/focusDOMQueries.ts` | `lib/focusDOMQueries.ts` | ✅ 복사됨 |
| `features/focus/ui/FocusDebugOverlay.tsx` | — | ❌ 미마이그레이션 |

---

## 3. 총괄 요약

| 상태 | 개수 | 설명 |
|---|---|---|
| ✅ 완료 / 존재 | ~45 | 마이그레이션 또는 Kernel 대체 완료 |
| ⚠️ 부분 / Pipeline only | ~7 | 레거시 Pipeline에만 존재 (FIELD_*, DELETE, TOGGLE 등) |
| ❌ 미마이그레이션 | ~20 | 미착수 또는 Kernel이 대체하여 불필요 |

### Kernel이 대체하여 더 이상 불필요한 것

- `CommandRegistry`, `createEngine`, `CommandFactory` (legacy) → **Kernel `defineCommand`**
- `CommandEngineStore`, `CommandTelemetryStore` → **Kernel Transaction**
- `CommandDefinition`, `createCommandFactory` → **Kernel `CommandFactory<T,P>`**
- `dispatchCommand pipeline` → **Kernel `dispatch()`**
- `resolveFocusMiddleware` → **Kernel `defineContext` + `group inject`**

### 아직 마이그레이션이 필요한 것

| 항목 | 우선순위 | 비고 |
|---|---|---|
| FIELD_* 커맨드 (BLUR, CANCEL, COMMIT, START_EDIT, SYNC) | 높음 | Field 편집 기능 |
| DELETE, TOGGLE 커맨드 | 중간 | Pipeline only → Kernel 전환 필요 |
| `useFocusRecovery` hook | 중간 | Kernel 기반 재구현 필요 |
| App, Builder*, Field, Label, Root, Trigger 프리미티브 | 중간 | Kernel 기반 6-components로 전환 |
| TestBot | 낮음 | os/ 에서 계속 사용 가능 |
| GroupRegistry (jurisdiction) | 낮음 | Kernel scope tree가 대체 가능 |
| PersistenceAdapter (hydrateState) | 낮음 | 타입만 있음, 구현 필요 시 |
| FocusDebugOverlay | 낮음 | KernelPanel이 대체 |
| defineApplication | 낮음 | 현재 미사용 |

---

## 4. 공존 구조

현재 `os-new/` 에는 **두 아키텍처가 공존**한다:

```
os-new/
├── 1-sensor/, 2-command/, 3-store/, 4-effect/   ← Legacy Pipeline (Zustand 직접 조작)
├── kernel.ts, 2-contexts/, 3-commands/,
│   4-effects/, 5-hooks/, 6-components/          ← Kernel Pipeline (dispatch → effects)
├── primitives/ (FocusGroup, FocusItem)          ← Legacy Primitive (Zustand)
├── 6-components/ (Zone, Item)                   ← Kernel Primitive (신규)
└── spike/                                       ← Kernel 검증 데모
```

**전환 방향:** Legacy Pipeline → Kernel Pipeline. `3-store/`(Zustand slices)는 Kernel `state`로 흡수. `primitives/`는 `6-components/`로 대체.
