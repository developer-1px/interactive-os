# Cmd+Z 시 focusId 복구 전략

## 1. 개요

Undo(⌘Z) 실행 시 앱 데이터(`data`, `ui`)는 스냅샷에서 복원되지만, **포커스 위치**(`focusedItemId`)는 OS FocusGroupStore에 있어서 복원되지 않는 문제.

예: 아이템 삭제 → ⌘Z → 아이템은 돌아오지만 포커스는 엉뚱한 곳에 남아있음.

## 2. 분석

### 현재 아키텍처

```
┌─────────────────────────────────────────────────┐
│  OS Layer (FocusGroupStore)                     │
│  ├─ focusedItemId: string | null    ← 복원 안됨 │
│  ├─ selection: string[]                         │
│  └─ lastFocusedId: string | null                │
├─────────────────────────────────────────────────┤
│  App Layer (CommandStore - AppState)             │
│  ├─ data: { todos, categories, ... } ← 복원됨   │
│  ├─ ui: { selectedCategoryId, ... }  ← 복원됨   │
│  ├─ effects: AppEffect[]            ← 비어있음   │
│  └─ history.past[].snapshot          ← 여기서 복원│
└─────────────────────────────────────────────────┘
```

### 기존 포커스 지정 메커니즘

앱은 이미 `effects` FIFO 큐 + `FOCUS_ID` 이펙트 패턴을 사용:

```typescript
// list.ts - 아이템 삭제 후 포커스 이동
draft.effects.push({ type: "FOCUS_ID", id: recoveryId });

// navigationMiddleware.ts - 이펙트 소비
const data = FocusData.getById(activeGroupId);
data.store.setState({ focusedItemId: targetId });
```

## 3. 제안

### 방안: 스냅샷에 focusedItemId 기록 + Undo 시 FOCUS_ID 이펙트 발행

가장 직관적이고 기존 패턴에 잘 맞는 방법:

#### 1단계: historyMiddleware에서 스냅샷 생성 시 focusedItemId 함께 기록

```typescript
// historyMiddleware.ts
const activeGroupId = FocusData.getActiveZoneId();
const focusedItemId = activeGroupId
  ? FocusData.getById(activeGroupId)?.store?.getState().focusedItemId
  : null;

const entry: HistoryEntry = {
  command: action,
  timestamp: Date.now(),
  snapshot: (({ history, ...rest }) => rest)(prevState),
  focusedItemId,  // ← NEW: 포커스 위치도 기록
};
```

#### 2단계: UndoCommand에서 복원 시 FOCUS_ID 이펙트 발행

```typescript
// history.ts - UndoCommand
if (entry.snapshot) {
  // ... 기존 data/ui 복원 ...
}
// 포커스 복원 이펙트 발행
if (entry.focusedItemId) {
  draft.effects.push({ type: "FOCUS_ID", id: entry.focusedItemId });
}
```

#### 변경 범위

| 파일 | 변경 |
|------|------|
| `model/appState.ts` | `HistoryEntry`에 `focusedItemId?: string` 추가 |
| `middleware/historyMiddleware.ts` | 스냅샷 생성 시 `FocusData`에서 현재 focusedItemId 캡처 |
| `features/commands/history.ts` | Undo/Redo 시 `FOCUS_ID` 이펙트 push |

### 장점

- **기존 패턴 재사용**: `FOCUS_ID` 이펙트 → `navigationMiddleware`가 이미 소비하는 구조
- **Jurisdiction 준수**: 앱이 직접 FocusGroupStore를 조작하지 않고 이펙트로 요청
- **변경 최소화**: 3개 파일, 각 5줄 이내 수정
- **Redo에도 동일 적용**: 같은 메커니즘으로 Redo 시에도 포커스 복원
