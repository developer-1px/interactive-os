# Legacy Pipeline 완전 정리 계획서

## 1. 개요

Kernel 기반 focus pipeline 인프라가 확립되었다 (11/13 테스트 통과).
이제 old pipeline 코드를 완전히 제거하고, 모든 consumer를 kernel 기반으로 전환한다.

**목표**: `os/features/command/`, `os/features/keyboard/`, `os/features/focus/pipeline/` 디렉토리를 제거하거나 최소한으로 축소하고, `CommandEngineStore`, `FocusData`, `KeyboardIntent` 등 old singleton에 대한 의존을 0으로 만든다.

---

## 2. 분석: 현재 의존 관계

### 2.1 Old Pipeline 핵심 모듈

| Module | 역할 | 참조 수 | Kernel 대체물 |
|--------|------|---------|--------------|
| `CommandEngineStore` | Old command dispatch + keybinding registry | ~19 files | `kernel.dispatch` + `Keybindings` |
| `FocusData` (focusData.ts) | Global focus state singleton | ~15 files | `kernel.getState().os.focus` |
| `useOSCore()` | Old keybinding 등록 to CommandEngineStore | Root.tsx | `osDefaults.ts` (already registered) |
| `KeyboardIntent.tsx` | Old keyboard → CommandEngineStore dispatch | 3 files | `KeyboardListener.tsx` |
| `KeyboardSensor.tsx` | Old keyboard sensor component | 1 file | `KeyboardListener.tsx` |
| `defineApplication()` | Old app command registration | 2 apps | kernel `group()` + `defineCommand()` |
| `dispatchToZone.ts` | Old zone-scoped dispatch | 3 files | `kernel.dispatch(cmd, { scope })` |
| `useCommandListener()` | Old React hook for command subscription | 4 files | `kernel.useComputed()` |

### 2.2 보존해야 할 Pure Functions (`os-new/2-command/`)

이 폴더에는 **old command 래퍼**와 **pure resolver 함수**가 섞여 있다.

| 보존 | 파일 | 사용처 |
|------|------|--------|
| ✅ 보존 | `navigate/resolve.ts`, `navigate/strategies.ts`, `navigate/entry.ts` 등 | `3-commands/navigate.ts` |
| ✅ 보존 | `expand/resolveExpansion.ts` | `3-commands/expand.ts` |
| ✅ 보존 | `field/` (전체) | Field editing logic — 아직 kernel 미이관 |
| ❌ 제거 | `*Command.ts` (navigateCommand, escapeCommand 등) | Dead code — kernel commands가 대체 |
| ❌ 제거 | `keyboardCommand.ts` | Old keyboard→command dispatch |

### 2.3 Consumer 별 의존 분류

#### A. OS Core (`os/app/export/primitives/`)

| File | Old 의존 | 변환 방법 |
|------|---------|----------|
| `Root.tsx` | `useFocusRecovery`, `useOSCore` | useOSCore → Inspector 부분만 kernel group으로, useFocusRecovery → kernel RECOVER |
| `App.tsx` | `CommandEngineStore`, `defineApplication` | kernel `group({ scope })` 기반 App 등록 |
| `Zone.tsx` | - | 이미 FocusGroup wrapper |
| `Item.tsx` | - | 이미 FocusItem wrapper |
| `Field.tsx` | `FocusData` | FocusData 대체 필요 |
| `Trigger.tsx` | `CommandEngineStore` | kernel dispatch로 전환 |
| `Builder.tsx` | `FocusData` | FocusData 대체 필요 |

#### B. Apps (`apps/todo/`, `apps/kanban/`)

| App | Old 의존 |
|-----|---------|
| Todo | `defineApplication`, `CommandEngineStore`, `FocusData` |
| Kanban | `defineApplication`, `CommandEngineStore`, `FocusData` |

#### C. Sensors (`os-new/1-sensor/`)

| File | Old 의존 | 변환 방법 |
|------|---------|----------|
| `FocusSensor.tsx` | ✅ 이미 완료 — kernel dispatch 사용 | - |
| `KeyboardIntent.tsx` | `CommandEngineStore`, `useCommandListener` | Dead — `KeyboardListener`로 대체됨 |
| `ClipboardIntent.tsx` | `useCommandListener`, `dispatchToZone` | kernel dispatch로 전환 필요 |
| `ClipboardSensor.tsx` | `dispatchToZone` | kernel dispatch로 전환 |
| `HistoryIntent.tsx` | `useCommandListener`, `dispatchToZone` | kernel dispatch로 전환 |

#### D. Debug (`os/app/debug/`)

| File | Old 의존 |
|------|---------|
| `CommandInspector.tsx` | `CommandEngineStore`, `FocusData` |
| `OSStateViewer.tsx` | `FocusData` |

---

## 3. 제안: 단계별 정리 계획

### Phase 1: Dead Code 제거 (안전, 즉시 가능)

> 현재 사용되지 않는 old pipeline 코드 제거. **빌드 깨지지 않음 보장.**

- [ ] `os-new/2-command/*Command.ts` 래퍼 삭제 (pure function은 보존)
- [ ] `os-new/2-command/keyboardCommand.ts` 삭제
- [ ] `os-new/1-sensor/keyboard/KeyboardIntent.tsx` 삭제 (import 없음 확인 후)
- [ ] `os-new/1-sensor/keyboard/KeyboardSensor.tsx` 삭제 (import 없음 확인 후)
- [ ] `os-new/1-sensor/keyboard/` 나머지 old 파일 정리 (`getCanonicalKey.ts`만 보존)

### Phase 2: FocusData → Kernel State 전환

> `FocusData` singleton 의존을 `kernel.getState()` 또는 `kernel.useComputed()`로 교체.

- [ ] `FocusItem.tsx`: `FocusData.subscribeActiveZone` → kernel state
- [ ] `FocusGroup.tsx`: `FocusData` registration 제거 (ZoneRegistry만 사용)
- [ ] `Field.tsx`, `Builder.tsx`: FocusData 참조 교체
- [ ] `os/app/debug/`: FocusData → kernel state
- [ ] `FocusData.ts` 자체 삭제

### Phase 3: CommandEngineStore → Kernel 전환

> Old command engine 완전 제거. App들의 명령 등록을 kernel group 기반으로 전환.

- [ ] `useOSCore.ts`: Inspector 관련만 kernel group으로 이관, 나머지 삭제
- [ ] `App.tsx`: `defineApplication` → kernel `group({ scope })` 기반
- [ ] `Trigger.tsx`: CommandEngineStore dispatch → kernel dispatch
- [ ] Clipboard/History sensors: `dispatchToZone` → `kernel.dispatch`
- [ ] Apps (todo, kanban): `defineApplication` → kernel group 기반 마이그레이션

### Phase 4: 최종 삭제

> Phase 1~3 완료 후, consumer가 0인 old 모듈 일괄 삭제.

- [ ] `os/features/command/` 디렉토리 (CommandEngineStore, createEngine 등)
- [ ] `os/features/keyboard/pipeline/` (old routing)
- [ ] `os/features/focus/pipeline/` (old osCommand routing)
- [ ] `os/features/focus/lib/focusData.ts`
- [ ] `os-new/core/dispatchToZone.ts`
- [ ] `os-new/4-effect/` (old middleware types — `4-effects/`와 혼동 주의)
- [ ] `os-new/3-store/` (old Zustand store factories — `focusGroupStore.ts`는 bridge로 아직 사용 중일 수 있음)

---

## 4. 주의사항

> [!WARNING]
> Apps (todo, kanban)은 `defineApplication` + `CommandEngineStore`로 App-level 커맨드를 등록한다. 이 부분의 마이그레이션은 kernel의 `group({ scope })` API를 사용해야 하며, 각 App의 command registry를 kernel command로 재정의해야 한다. **가장 큰 작업량.**

> [!IMPORTANT]
> `FocusData`는 현재 kernel→Zustand bridge와 공존 중이다. `FocusItem`이 `FocusData.subscribeActiveZone`으로 `activeGroupId`를 읽고, bridge가 `FocusData.setActiveZone()`으로 sync한다. Phase 2에서 이것을 `kernel.useComputed()`로 교체하면 bridge의 `FocusData.setActiveZone()` 호출도 제거할 수 있다.

> [!NOTE]
> `os-new/2-command/navigate/`, `os-new/2-command/expand/`, `os-new/2-command/field/` 안의 **pure resolver 함수는 보존**한다. 이것들은 kernel command handler 안에서 import되어 사용 중이다. 폴더를 삭제하지 말고 `*Command.ts` 래퍼만 제거할 것.
