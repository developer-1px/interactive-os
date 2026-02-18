# OS Core 폴더 구조 제안 — 넘버링 + 명세 일치

## 1. 개요 (Overview)

OS의 데이터 흐름을 폴더 구조만으로 읽을 수 있게 한다.
코드를 열지 않아도 **"어떤 입력이 → 어떤 커맨드로 → 어떤 behavior로 → 어떤 effect로"** 흘러가는지 디렉토리 트리만으로 파악 가능해야 한다.

### 설계 원칙

1. **넘버링 = 파이프라인 순서** — 1부터 순서대로 데이터가 흐른다
2. **커맨드명 = 폴더명** — `navigate/`, `tab/`, `select/`
3. **behavior = 파일명** — `trap.ts`, `escape.ts`, `flow.ts`
4. **구조 = 명세(spec)** — W3C APG의 구조와 1:1 대응

---

## 2. 제안 구조

```
src/os/
│
├── schema/                          ← 타입 정의 (변하지 않는 것)
│   ├── types.ts                     ← OSContext, OSResult, DOMEffect 통합
│   ├── state.ts                     ← ZoneState, FocusStoreState
│   ├── transaction.ts               ← Transaction, StateDiff
│   └── effects.ts                   ← EffectRecord, InputSource
│
│   ╔════════════════════════════════════════════════════════════════╗
│   ║  DATA FLOW:  1 → 2 → 3 → 4 → 5                              ║
│   ╚════════════════════════════════════════════════════════════════╝
│
├── 1-sensor/                        ← 입력 감지 (DOM → Event)
│   ├── keyboard/
│   │   ├── KeyboardSensor.tsx       ← keydown/keyup 감지
│   │   ├── classify.ts             ← key → intent 분류 (arrow? tab? enter?)
│   │   └── keybindings.ts          ← 키바인딩 레지스트리
│   ├── focus/
│   │   └── FocusSensor.tsx          ← focusin/focusout/click 감지
│   └── clipboard/
│       └── ClipboardSensor.tsx      ← copy/cut/paste 감지
│
├── 2-command/                       ← 커맨드 정의 + 해석 (Intent → Resolution)
│   │
│   ├── navigate/                    ← NAVIGATE (방향키)
│   │   ├── command.ts               ← OSCommand 진입점 (run 함수)
│   │   ├── linear.ts                ← 1D 리스트 탐색
│   │   ├── spatial.ts               ← 2D 그리드 탐색 (focusFinder)
│   │   ├── tree.ts                  ← 트리 확장/축소 시 네비게이션
│   │   ├── seamless.ts              ← Zone 경계 넘는 탐색
│   │   └── corner.ts                ← 모서리 네비게이션 (가상 그리드)
│   │
│   ├── tab/                         ← TAB (탭키)
│   │   ├── command.ts               ← OSCommand 진입점
│   │   ├── trap.ts                  ← Zone 내부 순환 (dialog)
│   │   ├── escape.ts                ← 다음 Zone으로 이동
│   │   └── flow.ts                  ← 경계에서 자연 이동
│   │
│   ├── select/                      ← SELECT (선택)
│   │   ├── command.ts               ← OSCommand 진입점
│   │   ├── single.ts                ← 단일 선택
│   │   ├── toggle.ts                ← 토글 선택 (Ctrl+Click)
│   │   ├── range.ts                 ← 범위 선택 (Shift+Click)
│   │   └── all.ts                   ← 전체 선택 (Cmd+A)
│   │
│   ├── activate/                    ← ACTIVATE (Enter)
│   │   └── command.ts               ← bound command 실행
│   │
│   ├── focus/                       ← FOCUS (직접 포커스)
│   │   ├── command.ts
│   │   ├── sync.ts                  ← DOM focusin → 상태 동기화
│   │   └── recover.ts               ← 삭제 후 포커스 복구
│   │
│   ├── escape/                      ← ESCAPE (Esc)
│   │   └── command.ts               ← 선택 해제 / dismiss
│   │
│   ├── expand/                      ← EXPAND (트리 확장)
│   │   └── command.ts
│   │
│   ├── toggle/                      ← TOGGLE (Space - checkbox)
│   │   └── command.ts
│   │
│   ├── delete/                      ← DELETE (삭제)
│   │   └── command.ts
│   │
│   ├── clipboard/                   ← COPY / CUT / PASTE
│   │   └── command.ts
│   │
│   ├── history/                     ← UNDO / REDO
│   │   └── command.ts
│   │
│   └── _registry.ts                 ← 모든 커맨드 등록 (command name → handler)
│
├── 3-store/                         ← 상태 관리
│   ├── focusStore.ts                ← 단일 포커스 스토어 (zones Map + activeZone + stack)
│   ├── engineStore.ts               ← 앱 라우터 (CommandEngineStore)
│   └── transactionStore.ts          ← 트랜잭션 로그 (TransactionLogStore)
│
├── 4-effect/                        ← 부수효과 실행 (데이터 → DOM)
│   ├── domEffect.ts                 ← focus(), scrollIntoView(), blur(), click()
│   ├── snapshot.ts                  ← buildCurrentSnapshot, computeDiff
│   └── persistence.ts               ← localStorage 저장/복원
│
├── 5-dispatch/                      ← 트랜잭션 경계 (전체를 묶는 곳)
│   ├── createCommandStore.ts        ← 스토어 팩토리 (dispatch = tx boundary)
│   ├── middleware.ts                ← 미들웨어 정의
│   └── route.ts                     ← 커맨드 라우팅 (flat registry + zone bubbling)
│
├── primitives/                      ← React 컴포넌트 (UI 프리미티브)
│   ├── FocusGroup.tsx               ← Zone 컨테이너
│   ├── FocusItem.tsx                ← 포커스 가능 아이템
│   ├── Field.tsx                    ← 인라인 에디팅 필드
│   └── Root.tsx                     ← OS Provider (sensors mount)
│
├── registry/                        ← 정적 레지스트리
│   ├── roleRegistry.ts              ← ARIA role 프리셋
│   ├── groupRegistry.ts             ← Zone별 커맨드 바인딩
│   └── zoneData.ts                  ← WeakMap (Zone config + bound commands)
│
├── hooks/                           ← React 훅
│   ├── useIsFocusedGroup.ts
│   ├── useFocusRecovery.ts
│   └── useInputEvents.ts
│
├── lib/                             ← 유틸리티 (순수 함수)
│   ├── dom.ts                       ← DOM 쿼리 유틸
│   ├── loopGuard.ts                 ← 무한루프 방지
│   └── logger.ts                    ← 디버그 로거
│
└── debug/                           ← 개발 도구
    ├── inspector/
    │   ├── EventStream.tsx
    │   ├── OSStateViewer.tsx
    │   └── ...
    └── testBot/
        └── ...
```

---

## 3. 구조가 말하는 것 — 명세 읽기

### 트리만 보고 OS 동작을 읽는다

**Q: "Tab키를 누르면 어떻게 동작해?"**
```
2-command/tab/
  ├── command.ts     → 진입점: config.tab.behavior를 보고 분기
  ├── trap.ts        → Zone 내부 순환 (dialog)
  ├── escape.ts      → 다음 Zone으로 이동
  └── flow.ts        → 경계에서 자연 이동
```
→ "tab behavior는 trap, escape, flow 3가지가 있고, config로 설정한다."

**Q: "방향키 네비게이션은 어떤 전략이 있어?"**
```
2-command/navigate/
  ├── command.ts     → 진입점
  ├── linear.ts      → 1D 리스트
  ├── spatial.ts     → 2D 그리드 (focusFinder 기반)
  ├── tree.ts        → 트리 구조
  ├── seamless.ts    → Zone 간 이동
  └── corner.ts      → 모서리 처리
```
→ "navigate는 5가지 전략이 있고, Zone 경계 넘는 seamless와 corner가 별도로 있다."

**Q: "선택은 어떤 모드가 있어?"**
```
2-command/select/
  ├── single.ts      → 단일 선택
  ├── toggle.ts      → 토글 (Ctrl+Click)
  ├── range.ts       → 범위 (Shift+Click)
  └── all.ts         → 전체 (Cmd+A)
```
→ "4가지 선택 모드: single, toggle, range, all."

### 데이터 파이프라인을 넘버링으로 읽는다

```
1-sensor/  → 사용자 입력 감지
2-command/ → 순수함수로 다음 상태 계산
3-store/   → 상태 저장
4-effect/  → DOM 부수효과 실행
5-dispatch/→ 1~4를 하나의 트랜잭션으로 묶음
```

---

## 4. 현재 → 목표 파일 이동 매핑

| 현재 경로 | 목표 경로 |
|---|---|
| `features/focus/pipeline/1-sense/FocusSensor.tsx` | `1-sensor/focus/FocusSensor.tsx` |
| `features/keyboard/pipeline/1-sense/KeyboardSensor.tsx` | `1-sensor/keyboard/KeyboardSensor.tsx` |
| `features/clipboard/ClipboardSensor.tsx` | `1-sensor/clipboard/ClipboardSensor.tsx` |
| `features/keyboard/pipeline/2-classify/classifyKeyboard.ts` | `1-sensor/keyboard/classify.ts` |
| `features/focus/pipeline/2-intent/commands/NAVIGATE.ts` | `2-command/navigate/command.ts` |
| `features/focus/pipeline/3-resolve/resolveNavigate.ts` | `2-command/navigate/linear.ts` |
| `features/focus/pipeline/3-resolve/focusFinder.ts` | `2-command/navigate/spatial.ts` |
| `features/focus/pipeline/3-resolve/resolveZoneSpatial.ts` | `2-command/navigate/seamless.ts` |
| `features/focus/pipeline/3-resolve/cornerNav.ts` | `2-command/navigate/corner.ts` |
| `features/focus/pipeline/2-intent/commands/TAB.ts` | `2-command/tab/command.ts` (trap/escape/flow 분리) |
| `features/focus/pipeline/2-intent/commands/SELECT.ts` | `2-command/select/command.ts` (single/toggle/range/all 분리) |
| `features/focus/pipeline/2-intent/commands/ACTIVATE.ts` | `2-command/activate/command.ts` |
| `features/focus/pipeline/2-intent/commands/FOCUS.ts` | `2-command/focus/command.ts` |
| `features/focus/pipeline/2-intent/commands/SYNC_FOCUS.ts` | `2-command/focus/sync.ts` |
| `features/focus/pipeline/2-intent/commands/RECOVER.ts` | `2-command/focus/recover.ts` |
| `features/focus/pipeline/2-intent/commands/ESCAPE.ts` | `2-command/escape/command.ts` |
| `features/focus/pipeline/2-intent/commands/TOGGLE.ts` | `2-command/toggle/command.ts` |
| `features/focus/pipeline/2-intent/commands/DELETE.ts` | `2-command/delete/command.ts` |
| `features/clipboard/ClipboardIntent.tsx` | `2-command/clipboard/command.ts` |
| `features/history/HistoryIntent.tsx` | `2-command/history/command.ts` |
| `features/focus/pipeline/2-intent/FocusIntent.tsx` | **삭제** (레지스트리로 대체) |
| `features/focus/store/focusGroupStore.ts` | `3-store/focusStore.ts` (통합) |
| `features/focus/lib/focusData.ts` | `3-store/focusStore.ts` (통합) + `registry/zoneData.ts` (config만) |
| `features/command/store/CommandEngineStore.ts` | `3-store/engineStore.ts` |
| `features/inspector/InspectorLogStore.ts` | `3-store/transactionStore.ts` |
| `features/focus/pipeline/core/osCommand.ts` | `4-effect/domEffect.ts` + `5-dispatch/route.ts` |
| `features/focus/schema/analyzer.ts` | `4-effect/snapshot.ts` |
| `features/command/model/createCommandStore.tsx` | `5-dispatch/createCommandStore.ts` |
| `features/command/lib/useCommandEventBus.ts` | **삭제** |
| `middleware/` | `5-dispatch/middleware.ts` |

---

## 5. 결론

### 이 구조의 특징

1. **넘버링 = 실행 순서** — `1 → 2 → 3 → 4 → 5`를 따라가면 전체 흐름
2. **커맨드 폴더 = W3C APG 명세** — `navigate/spatial`을 보면 "2D 그리드 탐색이 있다"
3. **behavior 파일 = 설정 가능한 동작** — `tab/trap.ts`를 보면 "trap 모드가 있다"
4. **flat** — 최대 깊이 3 (`os/2-command/navigate/spatial.ts`)
5. **삭제 대상 명확** — FocusIntent, EventBus, Zone별 스토어

### 핵심 질문

- `5-dispatch`의 위치가 마지막인 이유: 1~4를 **조율**하는 역할이므로 마지막. re-frame에서 `dispatch`가 전체 루프를 시작하는 것과 같은 위치.
- `command`가 `store` 앞인 이유: 커맨드는 **순수함수**. store를 읽고 쓰는 건 dispatch의 책임. 커맨드 자체는 store를 모른다 (cofx로 받을 뿐).
