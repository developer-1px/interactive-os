# OS Legacy Dead Code 정리 계획서

> **도구**: knip v5 · **분석일**: 2026-02-10  
> **관련 문서**: [Legacy Pipeline Cleanup Plan](file:///Users/user/Desktop/interactive-os/docs/0-inbox/2026-02-10_Legacy_Pipeline_Cleanup_Plan.md)

---

## 1. 개요 (Overview)

knip 기반 dead code 분석 결과와 `src/os/` (legacy) ↔ `src/os-new/` 교차 의존성 분석을 종합하여, **즉시 제거 가능한 항목**과 **아직 제거 불가한 항목**을 분류하고 단계별 정리 계획을 제안한다.

### knip 요약

| 카테고리 | 수량 |
|---------|------|
| Unused files | **61** |
| Unused exports | **44** |
| Unused exported types | **59** |
| Unused devDependencies | **1** (`ts-morph`) |
| Duplicate exports | **4** |

---

## 2. 분석 (Analysis)

### 2.1 Unused Files — 즉시 제거 가능 ✅

아래 파일은 **어디에서도 import되지 않으며**, 삭제해도 빌드에 영향이 없다.

#### `src/os/` Legacy (23개 — 전체 legacy 파일의 핵심 dead code)

| 파일 | 역할 | 비고 |
|------|------|------|
| `features/command/pipeline/2-resolve/resolveKeybinding.ts` | Old keybinding resolver | os-new 대체 완료 |
| `features/command/pipeline/3-dispatch/dispatchCommand.ts` | Old command dispatch | kernel 대체 완료 |
| `features/command/pipeline/types.ts` | Old pipeline types | 참조 0 |
| `features/focus/hooks/useIsFocusedGroup.ts` | Unused hook | 참조 0 |
| `features/focus/lib/focusDOMQueries.ts` | Old DOM queries | os-new 대체 |
| `features/focus/pipeline/3-resolve/cornerNav.ts` | Proxy → os-new | 참조 0 (proxy) |
| `features/focus/pipeline/3-resolve/focusFinder.ts` | Proxy → os-new | 참조 0 (proxy) |
| `features/focus/pipeline/3-resolve/resolveEntry.ts` | Proxy → os-new | 참조 0 (proxy) |
| `features/focus/pipeline/3-resolve/resolveExpansion.ts` | Proxy → os-new | 참조 0 (proxy) |
| `features/focus/pipeline/3-resolve/resolveNavigate.ts` | Proxy → os-new | 참조 0 (proxy) |
| `features/focus/pipeline/3-resolve/resolveZoneSpatial.ts` | Proxy → os-new | 참조 0 (proxy) |
| `features/focus/pipeline/3-resolve/strategies/navigatorRegistry.ts` | Proxy → os-new | 참조 0 (proxy) |
| `features/focus/store/slices/cursor.ts` | Old state slice | 참조 0 |
| `features/focus/store/slices/expansion.ts` | Old state slice | 참조 0 |
| `features/focus/store/slices/selection.ts` | Old state slice | 참조 0 |
| `features/focus/store/slices/spatial.ts` | Old state slice | 참조 0 |
| `features/keyboard/index.ts` | Old barrel export | 참조 0 |
| `features/keyboard/pipeline/3-route/routeCommand.ts` | Old routing | kernel 대체 완료 |
| `features/keyboard/pipeline/3-route/routeField.ts` | Old routing | kernel 대체 완료 |
| `features/keyboard/pipeline/3-route/routeKeyboard.ts` | Old routing | kernel 대체 완료 |
| `features/keyboard/pipeline/core/keyboardCommand.ts` | Old keyboard command | kernel 대체 완료 |
| `features/keyboard/types.ts` | Old types | 참조 0 |
| `shared/hooks/useEventListeners.ts` | Old hook | os-new 대체 |
| `testBot/playwright/index.ts` | Dead barrel export | 참조 0 |

#### `src/os-new/` (20개 — 미사용 모듈/리팩토링 잔재)

| 파일 | 역할 | 비고 |
|------|------|------|
| `1-listeners/index.ts` | Empty/dead barrel | 참조 0 |
| `1-sensor/keyboard/KeyboardCategory.ts` | Old keyboard module | 미사용 |
| `1-sensor/keyboard/KeyboardExecutionResult.ts` | Old keyboard module | 미사용 |
| `1-sensor/keyboard/KeyboardIntent.ts` | Old keyboard module | 미사용 |
| `1-sensor/keyboard/KeyboardResolution.ts` | Old keyboard module | 미사용 |
| `1-sensor/keyboard/classifyKeyboard.ts` | Old keyboard classifier | 미사용 |
| `1-sensor/keyboard/interceptKeyboard.ts` | Old keyboard interceptor | 미사용 |
| `1-sensor/keyboard/keyboardTypes.ts` | Old keyboard types | 미사용 |
| `1-sensor/keyboard/useInputEvents.ts` | Old keyboard hook | 미사용 |
| `2-command/field/FIELD_BLUR.ts` | Field command | 미사용 |
| `2-command/field/FIELD_CANCEL.ts` | Field command | 미사용 |
| `2-command/field/FIELD_COMMIT.ts` | Field command | 미사용 |
| `2-command/field/FIELD_START_EDIT.ts` | Field command | 미사용 |
| `2-command/field/FIELD_SYNC.ts` | Field command | 미사용 |
| `2-command/field/index.ts` | Field barrel | 미사용 |
| `2-command/focus/RECOVER.ts` | Focus recovery | 미사용 |
| `2-command/navigate/zoneSpatial.ts` | Zone spatial nav | 미사용 |
| `4-effect/buildBubblePath.ts` | Old effect | 미사용 |
| `5-hooks/index.ts` | Dead barrel | 참조 0 |
| `6-components/index.ts` | Dead barrel | 참조 0 |
| `shared/hooks/useEventListeners.ts` | Duplicated hook | os/ 버전 복사 |

#### 기타 (18개)

| 영역 | 파일 | 비고 |
|------|------|------|
| `packages/kernel/` | `__tests__/step1~4.ts`, `type-proof.ts`, `internal.ts` | 테스트 잔재 + 미사용 모듈 |
| `scripts/` | `check-file-export-mismatch.ts`, `rename-exports.ts`, `rename-to-match-export.ts`, `revert-file-names.ts` | 일회성 리팩토링 스크립트 |
| `vite-plugins/` | `component-inspector/ui/` (5개 파일) | DebugManager, InspectorOverlay, client, utils, CSS |
| `src/` | `spec.d.ts` | Unused type declaration |

---

### 2.2 Unused Exports — 주요 항목

#### 즉시 제거 가능 (os/ legacy, 사용처 0)

```
src/os/features/AntigravityOS.tsx: Root, App, Zone, Item, Field, Trigger
src/os/features/command/definitions/osCommands.ts: OS_COMMANDS
src/os/features/command/store/CommandTelemetryStore.ts: CommandTelemetryStore
src/os/features/command/ui/CommandContext.tsx: useDispatch, useAppState, useRegistry
src/os/features/focus/pipeline/core/osCommand.ts: buildContext, isOSCommandRunning, _currentInput, setCurrentInput, runOS
src/os/features/focus/registry/roleRegistry.ts: resolveRole, getChildRole, isCheckedRole, isExpandableRole
src/os/features/focus/schema/analyzer.ts: buildSnapshotFromLogs
src/os/features/focus/store/focusGroupStore.ts: createFocusGroupStore, useFocusGroupStoreInstance
src/os/features/focus/types.ts: DEFAULT_NAVIGATE, DEFAULT_TAB, DEFAULT_SELECT, DEFAULT_ACTIVATE, DEFAULT_DISMISS, DEFAULT_PROJECT, DEFAULT_CONFIG
src/os/features/keyboard/ui/Field/useFieldHooks.ts: useFieldState, useFieldDOMSync, useFieldContext
src/os/inspector/InspectorLogStore.ts: InspectorLog, useInspectorLogStore
src/os/lib/Slot.tsx: mergeProps
src/os/lib/loopGuard.ts: createReentrantGuard, createFrequencyGuard, sensorGuard
```

#### 아직 제거 불가 ⚠️ (os-new/, 향후 사용 예정)

아래 export는 현재 knip에서 unused로 나오지만, **kernel 기반 마이그레이션 완료 시 사용될 예정**이거나 public API로 유지가 필요하다:

```
src/os-new/3-commands/index.ts: ACTIVATE, ESCAPE, EXPAND, NAVIGATE, TAB 등
  → 커널 커맨드 정의. 현재 3-commands 내부에서만 사용되나 re-export용
src/os-new/4-effects/index.ts: FOCUS_EFFECT, SCROLL_EFFECT, BLUR_EFFECT, CLICK_EFFECT
  → 이펙트 정의. kernel에서 사용 중이나 barrel export가 미사용
src/os-new/schema/index.ts: 다수의 type re-export
  → Public API surface. Consumer 마이그레이션 후 자연스럽게 사용될 예정
```

---

### 2.3 Duplicate Exports

| 파일 | 중복 | 조치 |
|------|------|------|
| `src/lib/Icon.tsx` | `Icon` + `default` | named export만 유지 |
| `src/os/features/command/ui/CommandContext.tsx` | `useEngine` + `useCommandEngine` | 하나 제거 |
| `src/pages/aria-showcase/index.tsx` | `AriaShowcasePage` + `default` | named only |
| `src/pages/focus-showcase/index.tsx` | `FocusShowcasePage` + `default` | named only |

---

### 2.4 Unused devDependency

| Package | 비고 |
|---------|------|
| `ts-morph` | 일회성 리팩토링 스크립트에서만 사용. scripts 삭제 시 함께 제거 |

---

## 3. 결론 / 제안 (Proposal)

### Phase 0: 안전한 즉시 제거 (빌드 영향 없음)

가장 먼저 실행. knip unused files + exports 중 **참조 카운트 0** 확인된 항목만.

- [ ] **Unused files 61개 삭제** (위 테이블 참조)
- [ ] **os/ legacy unused exports 정리** (export 키워드만 제거, 파일 보존)
- [ ] **Duplicate exports 4개 정리** (default export 제거)
- [ ] **devDependency `ts-morph` 제거** + `scripts/` 폴더 삭제
- [ ] **vite-plugins/component-inspector/ui/** 삭제

> [!TIP]
> Phase 0는 `npx knip --fix` 로 일부 자동화 가능 (unused exports 제거).

### Phase 1: os/ Legacy Proxy Layer 제거

`src/os/` 내 proxy re-export 파일 중 **이미 dead로 판정된 것**은 Phase 0에서 삭제. 아직 살아있는 것들:

- [ ] `os/features/focus/primitives/FocusGroup.tsx` → `os-new/primitives/FocusGroup`의 proxy
- [ ] `os/features/logic/` → `os-new/core/logic/`의 proxy
- [ ] `os/middleware/types.ts` → `os-new/4-effect/middlewareTypes`의 proxy
- [ ] `os/app/debug/logger.ts` → `os-new/lib/logger`의 proxy

이들은 **import 경로를 직접 os-new로 교체한 후** 삭제 가능.

### Phase 2: Consumer 마이그레이션 (기존 Legacy Pipeline Cleanup Plan의 Phase 2~3 해당)

기존 [Legacy Pipeline Cleanup Plan](file:///Users/user/Desktop/interactive-os/docs/0-inbox/2026-02-10_Legacy_Pipeline_Cleanup_Plan.md)의 Phase 2~3을 참조. 이 작업이 완료되어야 `src/os/` 전체 삭제가 가능.

> [!WARNING]
> `src/os/` 폴더는 아직 완전 삭제 불가. `apps/todo/`, `apps/kanban/`, 여러 `pages/`에서 아래 모듈에 대한 **활성 의존**이 남아있다:
> - `CommandEngineStore` (~19 files)
> - `FocusData` (~15 files)
> - `defineApplication` (2 apps)
> - `useCommandListener` (4 files)
> - `dispatchToZone` (3 files)
> - `testBot/` (pages, showcase tests 전반)

### Phase 3: os-new/ 내부 정리

kernel 마이그레이션 완료 후, os-new 내 미사용 barrel exports와 dead module 정리:

- [ ] `os-new/3-store/` — old Zustand store factories
- [ ] `os-new/4-effect/` — old middleware types (4-effects와 구분)
- [ ] `os-new/schema/index.ts` 내 사용되지 않는 re-export 제거

---

## 4. 요약 매트릭스

```
                    즉시 제거     마이그레이션 후     보존
                    ─────────    ──────────────    ─────
Unused files         61개 ✅       -                -
os/ pipeline         23 files ✅   나머지 ~50 files   -
os/ unused exports   ~30 ✅        ~15               -
os-new/ dead files   20개 ✅       -                 -
os-new/ exports      barrel만 ✅   schema types      public API
scripts/             4개 ✅        -                 -
vite-plugins/ui      5개 ✅        -                 -
kernel tests         6개 ✅        -                 -
ts-morph             1개 ✅        -                 -
```

> [!IMPORTANT]
> Phase 0만으로 **61개 파일 + ~50개 dead export를 제거**할 수 있어 코드베이스가 크게 간결해진다. 빌드 안전성이 보장되므로 즉시 실행 권장.
