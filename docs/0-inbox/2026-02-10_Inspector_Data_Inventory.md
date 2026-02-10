# Inspector 시각화 대상: OS/Kernel 데이터 인벤토리

## 1. 개요

Unified Inspector가 시각화해야 하는 데이터를 **두 레이어**(OS / Kernel)로 분류하고, 각 데이터 구조의 필드와 디버깅 용도를 정리한다.

---

## 2. 데이터 흐름 (Pipeline)

```
DOM Event
  ↓
Sensor (keyboard/mouse/programmatic)
  ↓
OS Command (type + payload)
  ↓
Kernel.dispatch()
  ├─ bubblePath resolution (scope tree)
  ├─ processCommand()
  │   ├─ middleware.before()
  │   ├─ handler execution (ctx → payload → effects)
  │   └─ middleware.after()
  ├─ setState()
  ├─ recordTransaction()
  └─ executeEffects()
  ↓
OS Transaction (snapshot + diff + effects)
```

---

## 3. OS Layer 데이터

### 3-1. Transaction (OS 트랜잭션)

> 파일: `src/os-new/schema/state/OSTransaction.ts`

| 필드 | 타입 | 디버깅 용도 |
|------|------|-------------|
| `id` | `number` | 시퀀스 번호 |
| `timestamp` | `number` | 시간축 정렬 |
| `input.source` | `"keyboard" \| "mouse" \| "programmatic"` | 입력 소스 아이콘 |
| `input.raw` | `string` | 사람이 읽을 수 있는 입력 (e.g. "ArrowDown") |
| `command` | `{ type, payload } \| null` | 어떤 커맨드가 실행되었는가 |
| `snapshot` | `OSState` | 실행 후 **전체 상태** |
| `diff[]` | `{ path, from, to }` | **무엇이 변했는가** |

### 3-2. OSState (전체 상태 스냅샷)

> 파일: `src/os-new/schema/state/OSState.ts`

| 필드 | 타입 | 디버깅 용도 |
|------|------|-------------|
| `focus` | `FocusState` | 포커스 서브시스템 상태 |
| `inputSource` | `InputSource` | 마지막 입력 소스 |
| `effects[]` | `EffectRecord[]` | 이 트랜잭션에서 발생한 부작용들 |

### 3-3. FocusState

> 파일: `src/os-new/schema/focus/FocusState.ts`

| 필드 | 타입 | 디버깅 용도 |
|------|------|-------------|
| `activeZoneId` | `string \| null` | 현재 포커스 영역 |
| `zone` | `ZoneSnapshot \| null` | 활성 Zone의 상세 상태 |
| `focusStackDepth` | `number` | 모달/오버레이 깊이 |

### 3-4. ZoneSnapshot (Zone 상세)

> 파일: `src/os-new/schema/focus/FocusState.ts`

| 필드 | 타입 | 디버깅 용도 |
|------|------|-------------|
| `id` | `string` | Zone ID |
| `focusedItemId` | `string \| null` | 현재 포커스된 아이템 |
| `selection` | `string[]` | 선택된 아이템 목록 |
| `selectionAnchor` | `string \| null` | 범위 선택의 기준점 |
| `expandedItems` | `string[]` | 펼침/접힘 상태 (트리뷰) |
| `stickyX / stickyY` | `number \| null` | 공간 기억 (그리드 네비게이션) |
| `recoveryTargetId` | `string \| null` | DOM 복구 대상 |

### 3-5. EffectRecord (부작용 기록)

> 파일: `src/os-new/schema/effect/EffectRecord.ts`

| 필드 | 타입 | 디버깅 용도 |
|------|------|-------------|
| `source` | `"focus"` | 어떤 서브시스템이 생성했는가 |
| `action` | `string` | 동작 종류 (focus, scrollIntoView, blur, click) |
| `targetId` | `string \| null` | 대상 DOM 엘리먼트 |
| `executed` | `boolean` | **실행 여부** (핵심! 스킵된 이유 추적) |
| `reason?` | `string` | 스킵된 이유 |

### 3-6. FocusIntent (의도 분류)

> 파일: `src/os-new/schema/focus/FocusIntent.ts`

8가지 variants:

| Intent | 주요 필드 | 디버깅 용도 |
|--------|-----------|-------------|
| `NAVIGATE` | `direction` | 방향키 이동 |
| `TAB` | `direction` | 탭 이동 |
| `SELECT` | `mode, targetId` | 선택 모드 |
| `ACTIVATE` | `targetId, trigger` | 활성화 트리거 |
| `DISMISS` | `reason` | 닫기/해제 이유 |
| `FOCUS` | `targetId, source` | 직접 포커스 |
| `POINTER` | `subtype, targetId` | 마우스 hover/click |
| `EXPAND` | `action, targetId` | 트리 토글 |

### 3-7. PipelineContext (파이프라인 중간 데이터)

> 파일: `src/os-new/schema/focus/FocusPipelineContext.ts`

| 필드 | 타입 | 디버깅 용도 |
|------|------|-------------|
| `sourceId / sourceGroupId` | `string \| null` | 어디서 출발했는가 |
| `intent` | `FocusIntent` | 의도 분류 |
| `targetId / targetGroupId` | `string \| null` | 어디로 이동했는가 |
| `stickyX / stickyY` | `number \| null` | 공간 기억 |
| `shouldTrap / shouldProject` | `boolean` | 트랩/프로젝트 플래그 |
| `newSelection / newAnchor` | `string[] / string` | 결과 선택 상태 |
| `activated` | `boolean` | 활성화 결과 |

### 3-8. OS Commands (커맨드 목록)

> 파일: `src/os-new/schema/command/OSCommands.ts`

커맨드 그룹 6개, 19종:
- **Navigation**: NAVIGATE, FOCUS, SYNC_FOCUS, RECOVER, TAB, TAB_PREV
- **Selection**: SELECT, SELECT_ALL, DESELECT_ALL
- **Activation**: ACTIVATE
- **Escape**: ESCAPE
- **Field**: FIELD_START_EDIT, FIELD_COMMIT, FIELD_CANCEL, FIELD_SYNC, FIELD_BLUR
- **Clipboard**: COPY, CUT, PASTE
- **Edit**: TOGGLE, DELETE
- **History**: UNDO, REDO
- **Shell**: TOGGLE_INSPECTOR

---

## 4. Kernel Layer 데이터

### 4-1. Kernel Transaction (커널 트랜잭션)

> 파일: `packages/kernel/src/core/transaction.ts`

| 필드 | 타입 | 디버깅 용도 |
|------|------|-------------|
| `id` | `number` | 시퀀스 번호 |
| `timestamp` | `number` | 시간 |
| `command` | `{ type, payload }` | 실행된 커맨드 |
| `handlerScope` | `string` | **어떤 스코프에서 핸들링됐는가** |
| `bubblePath` | `string[]` | **버블링 경로** (스코프 → GLOBAL) |
| `effects` | `Record<string, unknown> \| null` | 핸들러가 반환한 이펙트 맵 |
| `changes` | `StateDiff[]` | 상태 변경 diff |
| `stateBefore` | `unknown` | 실행 전 전체 상태 |
| `stateAfter` | `unknown` | 실행 후 전체 상태 |

### 4-2. MiddlewareContext

> 파일: `packages/kernel/src/core/tokens.ts`

| 필드 | 타입 | 디버깅 용도 |
|------|------|-------------|
| `command` | `Command` | 현재 처리 중인 커맨드 |
| `state` | `unknown` | 현재 상태 |
| `handlerScope` | `string` | 핸들러 스코프 |
| `effects` | `Record \| null` | 이펙트 맵 |
| `injected` | `Record` | 주입된 컨텍스트 값 |

### 4-3. Kernel Inspector API

`createKernel`이 노출하는 인스펙터 관련 API:

| API | 반환값 | 용도 |
|-----|--------|------|
| `getState()` | `S` | 현재 상태 조회 |
| `getTransactions()` | `Transaction[]` | 트랜잭션 로그 |
| `getLastTransaction()` | `Transaction \| undefined` | 최신 트랜잭션 |
| `travelTo(id)` | `void` | **시간여행 디버깅** |
| `clearTransactions()` | `void` | 로그 초기화 |

---

## 5. 시각화 요소 정리

### 핵심 시각화 (Must Have)

| 요소 | 데이터 소스 | 시각화 방식 |
|------|-------------|-------------|
| **Input Event** | `Transaction.input` | 타임라인 첫 줄 (아이콘 + raw) |
| **Command** | `Transaction.command` | 배지 (type + payload) |
| **State Diff** | `Transaction.diff[]` 또는 `Kernel.changes[]` | `old → new` 테이블 |
| **Effects** | `OSState.effects[]` | 체크/경고 리스트 (executed, reason) |
| **Full Snapshot** | `Transaction.snapshot` 또는 `Kernel.stateAfter` | JSON 트리뷰 |

### 확장 시각화 (Nice to Have)

| 요소 | 데이터 소스 | 시각화 방식 |
|------|-------------|-------------|
| **Bubble Path** | `Kernel.Transaction.bubblePath` | 스코프 체인 시각화 |
| **Handler Scope** | `Kernel.Transaction.handlerScope` | 어떤 레벨에서 처리됐는지 |
| **Middleware** | `MiddlewareContext` | before/after 변환 diff |
| **Pipeline Context** | `PipelineContext` | source → intent → target 흐름 |
| **Focus Stack** | `FocusState.focusStackDepth` | 모달 깊이 표시기 |
| **Zone Snapshot** | `ZoneSnapshot` | 활성 Zone 필드별 상태 |
| **Time Travel** | `Kernel.travelTo()` | 스냅샷 선택 시 상태 롤백 |

---

## 6. 결론

현재 시스템에는 **두 개의 Transaction 타입**이 존재한다:

1. **OS Transaction** (`@os/schema`): input, command, snapshot(OSState), diff
2. **Kernel Transaction** (`@kernel`): command, handlerScope, bubblePath, effects, changes, stateBefore/After

Inspector는 이 두 레이어를 **하나의 타임라인**으로 통합해야 한다. OS Transaction은 "무엇이 일어났는가"(What), Kernel Transaction은 "어떻게 처리되었는가"(How)를 각각 담당한다.

**Mock 설계 시 가장 중요한 요소 우선순위**:
1. Input → Command **매핑** (무슨 키가 무슨 커맨드가 됐는지)
2. State **Diff** (뭐가 변했는지)
3. Effect **실행 여부** (실행됐는지, 스킵됐는지, 왜?)
4. **Full Snapshot** (디버깅 시 현재 상태 확인)
5. **Bubble Path** (어떤 스코프 체인을 따라 핸들링됐는지)
