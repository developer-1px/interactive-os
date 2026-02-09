# Full Interface Specification

> 날짜: 2026-02-09
> 태그: interface, specification, API, types
> 상태: Draft
> 선행 문서: 05-[architecture] 3-Layer, 06-[naming] Glossary
> 네이밍: 06 glossary 확정 용어 사용 (D1~D7 반영)

---

## 0. 읽는 법

- **확정 이름**으로 작성. 현재 코드 이름은 `/* 현재: OldName */` 주석으로 표기.
- `(제안)` = 아직 코드에 없는 인터페이스. 구현 시 이 시그니처를 따른다.
- Layer 1 (Kernel) → Layer 2 (OS) → Layer 3 (App) 순서.

---

## 1. Kernel Layer — 범용 이벤트 엔진

### 1.1 Command — 디스패치 데이터

```typescript
/* 현재: BaseCommand (os-new/schema/command/BaseCommand.ts) */
interface Command {
  type: string;
  payload?: unknown;
}
```

### 1.2 dispatch — 단일 진입점

```typescript
/* (제안) — 현재: CommandEngineStore.dispatch */
function dispatch(cmd: Command): void;
```

이벤트 큐 기반. re-entrance safe.

```typescript
// 센서에서
dispatch({ type: "OS_NAVIGATE", payload: { direction: "DOWN", sourceId: null } });

// 컴포넌트에서
const send = useDispatch();
send({ type: "TODO_TOGGLE", payload: { id: "todo-1" } });
```

### 1.3 Handler — 커맨드 처리 순수함수

```typescript
/* (D5: 통일) — 현재: OSCommand.run */
type Handler<P = unknown> = (ctx: Context, payload: P) => EffectMap | null;
```

`defineHandler`의 `(state, payload) => state`도 내부적으로 이 형태로 wrap된다.

### 1.4 CommandDef — 커맨드 등록 단위

```typescript
/* 현재: OSCommand (os-new), CommandFactory (os/) */
interface CommandDef<P = unknown> {
  id: string;
  run: Handler<P>;
  log?: boolean;
}
```

### 1.5 EffectMap — 핸들러 반환값

```typescript
/* (제안) — 현재: OSResult (os/) — 구조 다름 */
interface EffectMap {
  /** 상태 업데이트. 항상 먼저 실행. */
  state?: unknown;

  /** DOM 포커스 이동 */
  focus?: string;

  /** 스크롤 */
  scroll?: string;

  /** 블러 */
  blur?: true;

  /** 다른 커맨드 재발행 */
  dispatch?: Command;

  /** 복수 커맨드 일괄 발행 */
  batch?: Command[];

  /** 지연 발행 */
  defer?: { cmd: Command; ms: number };

  /** 버블 계속 (D4 scoped handler) */
  bubble?: boolean;

  /** 사용자 정의 이펙트 (key = defineEffect로 등록한 id) */
  [effectId: string]: unknown;
}
```

**현재 OSResult와의 차이:**

```typescript
/* 현재: os/features/focus/pipeline/core/osCommand.ts */
interface OSResult {
  state?: {
    focusedItemId?: string | null;
    selection?: string[];
    selectionAnchor?: string | null;
    expandedItems?: string[];
    stickyX?: number | null;
    stickyY?: number | null;
    recoveryTargetId?: string | null;
  };
  activeZoneId?: string | null;
  domEffects?: DOMEffect[];
  dispatch?: any;
}

// OSResult는 상태(state)와 이펙트(domEffects)가 혼합.
// EffectMap은 모든 것이 이펙트 선언. state 업데이트도 이펙트.
```

### 1.6 Context — 핸들러 읽기 컨텍스트

```typescript
/* (제안) — 현재: OSContext (os/) */
interface Context {
  /** 현재 상태 트리 (읽기 전용) */
  state: OSState;   /* 이름 보류 (D3) */

  /** inject()로 주입된 값 */
  [injectedKey: string]: unknown;
}
```

**현재 OSContext (레거시):**

```typescript
/* os/features/focus/pipeline/core/osCommand.ts */
interface OSContext {
  // Identity
  zoneId: string;

  // Store State (개별 필드로 펼쳐져 있음)
  focusedItemId: string | null;
  selection: string[];
  selectionAnchor: string | null;
  expandedItems: string[];
  stickyX: number | null;
  stickyY: number | null;
  recoveryTargetId: string | null;

  // Zone Config
  config: ZoneConfig;    /* 현재: FocusGroupConfig */

  // Store (직접 접근 — 제거 대상)
  store: FocusGroupStore;

  // Focus Path
  focusPath: string[];
  parentId: string | null;

  // DOM Snapshot
  dom: {
    items: string[];
    itemRects: Map<string, DOMRect>;
    siblingZones: { prev: string | null; next: string | null };
    queries: DOMQueries;
  };

  // Bound App Commands (scoped handler로 대체 예정)
  activateCommand?: any;
  selectCommand?: any;
  toggleCommand?: any;
  copyCommand?: any;
  cutCommand?: any;
  pasteCommand?: any;
  deleteCommand?: any;
  undoCommand?: any;
  redoCommand?: any;
}
```

### 1.7 defineHandler — 순수 상태 핸들러 등록

```typescript
/* (제안) */
function defineHandler<P = unknown>(
  id: string,
  handler: (state: OSState, payload: P) => OSState,
): void;
```

sugar. 내부적으로:
```typescript
defineCommand(id, (ctx, payload) => ({
  state: handler(ctx.state, payload),
}));
```

### 1.8 defineCommand — 이펙트 반환 핸들러 등록

```typescript
/* (제안) */
function defineCommand<P = unknown>(
  id: string,
  handler: Handler<P>,
): void;

function defineCommand<P = unknown>(
  id: string,
  middleware: Middleware[],
  handler: Handler<P>,
): void;

function defineCommand<P = unknown>(
  id: string,
  options: { scope: string },
  handler: Handler<P>,
): void;
```

### 1.9 defineEffect — 이펙트 실행기 등록

```typescript
/* (제안) */
function defineEffect(
  id: string,
  executor: (value: unknown) => void,
): void;
```

```typescript
// OS가 등록
defineEffect("focus", (id: string) => {
  document.getElementById(id)?.focus({ preventScroll: true });
});

defineEffect("scroll", (id: string) => {
  document.getElementById(id)?.scrollIntoView({ block: "nearest" });
});

defineEffect("blur", () => {
  (document.activeElement as HTMLElement)?.blur();
});

// App이 등록
defineEffect("toast", (msg: string) => toastStore.add(msg));
defineEffect("clipboard", (text: string) => navigator.clipboard.writeText(text));
```

### 1.10 defineContext / inject — 컨텍스트 주입

```typescript
/* (제안) */
function defineContext(
  id: string,
  provider: () => unknown,
): void;

function inject(id: string): Middleware;
```

```typescript
defineContext("dom-items", () => {
  const zoneId = getState().focus.activeZoneId;
  const el = document.getElementById(zoneId!);
  return el ? Array.from(el.querySelectorAll("[data-focus-item]")).map(e => e.id) : [];
});

defineContext("zone-config", () => {
  const zoneId = getState().focus.activeZoneId;
  return zoneRegistry.get(zoneId!)?.config;
});

// 핸들러에서 선언적 요청
defineCommand("OS_NAVIGATE", [inject("dom-items"), inject("zone-config")], handler);
```

### 1.11 Scope — 버블링 계층

```typescript
/* (제안) */
interface Scope {
  id: string;
  parent?: string;
}

function defineScope(id: string, config: { parent?: string }): void;
function removeScope(id: string): void;
function setActiveScope(id: string): void;
function getActiveScope(): string | null;
function buildBubblePath(from?: string): string[];
```

```typescript
// FocusGroup 마운트 시 (OS Layer에서 호출)
defineScope("todo-list", { parent: null });
defineScope("todo-item-editor", { parent: "todo-list" });

// 포커스 이동 시
setActiveScope("todo-list");

// dispatch 시 Kernel이 자동 계산
buildBubblePath("todo-list");
// → ["todo-list", "__global__"]
```

### 1.12 Middleware — 핸들러 전후 훅

```typescript
/* (D4: re-frame 형태 확정) */
/* 현재: (next) => (state, action) => ... (Redux 스타일) */
interface Middleware {
  id: string;
  before?: (context: MiddlewareContext) => MiddlewareContext;
  after?: (context: MiddlewareContext) => MiddlewareContext;
}

/* (제안) */
interface MiddlewareContext {
  command: Command;
  coeffects: Record<string, unknown>;   /* inject된 값 */
  effects: EffectMap | null;            /* after에서만 사용 */
  state: OSState;
}

function use(middleware: Middleware): void;
```

```typescript
const transactionMiddleware: Middleware = {
  id: "transaction",
  before: (ctx) => {
    return { ...ctx, coeffects: { ...ctx.coeffects, snapshotBefore: getState() } };
  },
  after: (ctx) => {
    const before = ctx.coeffects.snapshotBefore as OSState;
    const after = getState();
    TransactionLog.add({ command: ctx.command, diff: computeDiff(before, after) });
    return ctx;
  },
};

use(transactionMiddleware);
```

### 1.13 Computed — 파생 상태

```typescript
/* (제안) */
function defineComputed<T>(
  id: string,
  extractor: (state: OSState, args: unknown[]) => T,
): void;

function useComputed<T>(query: [string, ...unknown[]]): T;
```

```typescript
defineComputed("focused-item", (state, [_, zoneId]) =>
  state.focus.zones[zoneId as string]?.focusedItemId ?? null
);

defineComputed("is-focused", (state, [_, zoneId, itemId]) =>
  state.focus.zones[zoneId as string]?.focusedItemId === itemId
);

// 컴포넌트에서
const isFocused = useComputed<boolean>(["is-focused", "todo-list", "todo-1"]);
```

### 1.14 Keybinding

```typescript
/* (제안) */
interface KeybindingDef {
  key: string;
  command: string;
  args?: Record<string, unknown>;
  scope?: string;
  when?: string | LogicNode;
  preventDefault?: boolean;
  allowInInput?: boolean;
}

function defineKeybinding(binding: KeybindingDef): void;
function resolveKeybinding(key: string, context: ResolveContext): { command: string; args: unknown } | null;
```

**현재 KeybindingItem:**

```typescript
/* os-new/schema/keyboard/KeybindingItem.ts */
interface KeybindingItem<T = string> {
  key: string;
  command: T;
  args?: any;
  when?: string | LogicNode;
  preventDefault?: boolean;
  allowInInput?: boolean;
  groupId?: string;    /* → 제거 (Phase 2) */
  zoneId?: string;     /* → scope로 통합 */
}
```

### 1.15 Store Access

```typescript
/* (제안) */
function getState(): OSState;   /* 이름 보류 (D3) */
function resetState(state: OSState): void;
function useDispatch(): (cmd: Command) => void;
```

---

## 2. OS Layer — 포커스 시스템

### 2.1 FocusState — 포커스 서브시스템 상태

```typescript
/* os-new/schema/focus/FocusState.ts */
interface FocusState {
  /** 현재 활성 Zone ID */
  activeZoneId: string | null;

  /** 모든 Zone 상태 (D7: Record 모델) */
  zones: Record<string, ZoneState>;

  /** Focus Stack 깊이 */
  focusStackDepth: number;
}
```

> 현재 코드는 `zone: ZoneSnapshot | null` (단수). D7에 의해 `zones: Record` 로 변경 예정.

### 2.2 ZoneState — Zone 런타임 상태

```typescript
/* 현재: FocusGroupState (os-new/3-store/focusGroupStore.ts) */
/* = CursorSlice & SpatialSlice & SelectionSlice & ExpansionSlice */
interface ZoneState {
  // ── Cursor ──
  focusedItemId: string | null;
  lastFocusedId: string | null;
  recoveryTargetId: string | null;

  // ── Selection ──
  selection: string[];
  selectionAnchor: string | null;

  // ── Expansion ──
  expandedItems: string[];

  // ── Spatial ──
  stickyX: number | null;
  stickyY: number | null;
}
```

### 2.3 ZoneSnapshot — Zone 직렬화 스냅샷

```typescript
/* os-new/schema/focus/FocusState.ts — 유지 (D2) */
interface ZoneSnapshot {
  id: string;
  focusedItemId: string | null;
  selection: string[];
  selectionAnchor: string | null;
  expandedItems: string[];
  stickyX: number | null;
  stickyY: number | null;
  recoveryTargetId: string | null;
}
```

**ZoneState vs ZoneSnapshot:**

| | ZoneState | ZoneSnapshot |
|---|---|---|
| 용도 | Zustand 런타임 스토어 | 트랜잭션 로그 직렬화 |
| 위치 | `zones[zoneId]` | `Transaction.snapshot.focus.zone` |
| 액션 포함 | ✅ `setFocus()`, `toggleSelection()` 등 | ❌ 순수 데이터 |
| `id` 필드 | ❌ (key가 zoneId) | ✅ 포함 |
| `lastFocusedId` | ✅ (restore 용도) | ❌ |

### 2.4 ZoneConfig — Zone 설정

```typescript
/* 현재: FocusGroupConfig (os-new/schema/focus/config/) */
interface ZoneConfig {
  navigate: NavigateConfig;
  tab: TabConfig;
  select: SelectConfig;
  activate: ActivateConfig;
  dismiss: DismissConfig;
  project: ProjectConfig;
}

const DEFAULT_CONFIG: ZoneConfig = {
  navigate: DEFAULT_NAVIGATE,
  tab: DEFAULT_TAB,
  select: DEFAULT_SELECT,
  activate: DEFAULT_ACTIVATE,
  dismiss: DEFAULT_DISMISS,
  project: DEFAULT_PROJECT,
};
```

#### NavigateConfig

```typescript
interface NavigateConfig {
  /** 탐색 축 */
  orientation: Orientation;   // "horizontal" | "vertical" | "both" | "corner"

  /** 끝에서 처음으로 순환 */
  loop: boolean;

  /** 인접 Zone으로 이어서 탐색 */
  seamless: boolean;

  /** 타이핑으로 아이템 검색 */
  typeahead: boolean;

  /** Zone 진입 시 초기 포커스 */
  entry: "first" | "last" | "restore" | "selected";

  /** 아이템 삭제 시 포커스 복구 전략 */
  recovery: "next" | "prev" | "nearest";
}

const DEFAULT_NAVIGATE: NavigateConfig = {
  orientation: "vertical",
  loop: false,
  seamless: false,
  typeahead: false,
  entry: "first",
  recovery: "next",
};
```

#### TabConfig

```typescript
interface TabConfig {
  /** Tab 키 동작 */
  behavior: "trap" | "escape" | "flow";

  /** 재진입 시 마지막 포커스 복원 */
  restoreFocus: boolean;
}

const DEFAULT_TAB: TabConfig = {
  behavior: "flow",
  restoreFocus: false,
};
```

#### SelectConfig

```typescript
interface SelectConfig {
  /** 선택 모드 */
  mode: "none" | "single" | "multiple";

  /** 포커스 이동 시 선택도 따라감 */
  followFocus: boolean;

  /** 선택 해제 불가 (최소 1개) */
  disallowEmpty: boolean;

  /** Shift 범위 선택 */
  range: boolean;

  /** Ctrl 토글 선택 */
  toggle: boolean;
}

const DEFAULT_SELECT: SelectConfig = {
  mode: "none",
  followFocus: false,
  disallowEmpty: false,
  range: false,
  toggle: false,
};
```

#### ActivateConfig

```typescript
interface ActivateConfig {
  /** manual: Enter/Click으로만 활성화. automatic: 포커스 시 자동 활성화 (탭). */
  mode: "manual" | "automatic";
}

const DEFAULT_ACTIVATE: ActivateConfig = {
  mode: "manual",
};
```

#### DismissConfig

```typescript
interface DismissConfig {
  /** Escape 키 동작 */
  escape: "close" | "deselect" | "none";

  /** 영역 외 클릭 동작 */
  outsideClick: "close" | "none";
}

const DEFAULT_DISMISS: DismissConfig = {
  escape: "none",
  outsideClick: "none",
};
```

#### ProjectConfig

```typescript
interface ProjectConfig {
  /** aria-activedescendant 기반 가상 포커스 */
  virtualFocus: boolean;

  /** 마운트 시 자동 포커스 */
  autoFocus: boolean;
}

const DEFAULT_PROJECT: ProjectConfig = {
  virtualFocus: false,
  autoFocus: false,
};
```

### 2.5 OS Commands

#### 커맨드 ID 상수

```typescript
/* os-new/schema/command/OSCommands.ts */
const OS_COMMANDS = {
  // Navigation
  NAVIGATE:      "OS_NAVIGATE",
  FOCUS:         "OS_FOCUS",
  SYNC_FOCUS:    "OS_SYNC_FOCUS",
  RECOVER:       "OS_RECOVER",
  TAB:           "OS_TAB",
  TAB_PREV:      "OS_TAB_PREV",

  // Selection
  SELECT:        "OS_SELECT",
  SELECT_ALL:    "OS_SELECT_ALL",
  DESELECT_ALL:  "OS_DESELECT_ALL",

  // Activation
  ACTIVATE:      "OS_ACTIVATE",

  // Escape
  ESCAPE:        "OS_ESCAPE",

  // Field
  FIELD_START_EDIT: "OS_FIELD_START_EDIT",
  FIELD_COMMIT:    "OS_FIELD_COMMIT",
  FIELD_CANCEL:    "OS_FIELD_CANCEL",
  FIELD_SYNC:      "OS_FIELD_SYNC",
  FIELD_BLUR:      "OS_FIELD_BLUR",

  // Clipboard
  COPY:          "OS_COPY",
  CUT:           "OS_CUT",
  PASTE:         "OS_PASTE",

  // Editing
  TOGGLE:        "OS_TOGGLE",
  DELETE:         "OS_DELETE",

  // History
  UNDO:          "OS_UNDO",
  REDO:          "OS_REDO",

  // Shell
  TOGGLE_INSPECTOR: "OS_TOGGLE_INSPECTOR",
} as const;

type OSCommandType = (typeof OS_COMMANDS)[keyof typeof OS_COMMANDS];
```

#### 커맨드별 Payload

```typescript
/* os-new/schema/command/OSCommandPayload.ts */

interface OSNavigatePayload {
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT" | "HOME" | "END";
  sourceId: string | null;
  targetId?: string | null;
  select?: "range" | "toggle";
}

interface OSFocusPayload {
  id: string | null;
  sourceId?: string | null;
}

interface OSSelectPayload {
  targetId?: string;
  mode?: "toggle" | "range" | "replace";
  isExplicitAction?: boolean;
}

interface OSActivatePayload {
  targetId?: string;
}
```

#### 타입 안전 커맨드 유니온

```typescript
type OSCommandUnion =
  | { type: "OS_NAVIGATE"; payload: OSNavigatePayload }
  | { type: "OS_FOCUS"; payload: OSFocusPayload }
  | { type: "OS_TAB"; payload?: undefined }
  | { type: "OS_TAB_PREV"; payload?: undefined }
  | { type: "OS_SELECT"; payload?: OSSelectPayload }
  | { type: "OS_SELECT_ALL"; payload?: undefined }
  | { type: "OS_DESELECT_ALL"; payload?: undefined }
  | { type: "OS_ACTIVATE"; payload?: OSActivatePayload }
  | { type: "OS_ESCAPE"; payload?: undefined }
  | { type: "OS_FIELD_START_EDIT"; payload?: { fieldId?: string } }
  | { type: "OS_FIELD_COMMIT"; payload?: { fieldId?: string } }
  | { type: "OS_FIELD_CANCEL"; payload?: { fieldId?: string } }
  | { type: "OS_UNDO"; payload?: any }
  | { type: "OS_REDO"; payload?: any }
  | { type: "OS_COPY"; payload?: any }
  | { type: "OS_CUT"; payload?: any }
  | { type: "OS_PASTE"; payload?: any }
  | { type: "OS_DELETE"; payload?: any }
  | { type: "OS_TOGGLE_INSPECTOR"; payload?: any }
  | { type: "OS_RECOVER"; payload?: any };
```

### 2.6 Navigation Strategies

```typescript
/* os-new/2-command/navigate/strategies.ts */

interface NavigateResult {
  targetId: string | null;
  stickyX: number | null;
  stickyY: number | null;
}

type NavigationStrategy = (
  currentId: string | null,
  direction: Direction,
  items: string[],
  config: NavigateConfig,
  spatial: {
    stickyX: number | null;
    stickyY: number | null;
    itemRects?: Map<string, DOMRect>;
  },
) => NavigateResult;

function resolveWithStrategy(
  orientation: string,
  ...args: Parameters<NavigationStrategy>,
): NavigateResult;
```

### 2.7 DOMEffect

```typescript
/* os/features/focus/pipeline/core/osCommand.ts */
type DOMEffect =
  | { type: "FOCUS"; targetId: string }
  | { type: "SCROLL_INTO_VIEW"; targetId: string }
  | { type: "CLICK"; targetId: string }
  | { type: "BLUR" };
```

### 2.8 EffectRecord

```typescript
/* os-new/schema/effect/EffectRecord.ts */
type InputSource = "mouse" | "keyboard" | "programmatic";
type EffectSource = "focus";
type FocusEffectAction = "focus" | "scrollIntoView" | "blur" | "click";

interface EffectRecord {
  source: EffectSource;
  action: string;
  targetId: string | null;
  executed: boolean;
  reason?: string;
}

function createFocusEffect(
  action: FocusEffectAction,
  targetId: string | null,
  executed: boolean,
  reason?: string,
): EffectRecord;
```

### 2.9 OSState — 루트 상태

```typescript
/* os-new/schema/state/OSState.ts — 이름 보류 (D3) */
interface OSState {
  /** 포커스 서브시스템 */
  focus: FocusState;

  /** 마지막 입력 소스 */
  inputSource: InputSource;

  /** 현재 커맨드의 이펙트 (커맨드당 리셋) */
  effects: EffectRecord[];
}

const INITIAL_OS_STATE: OSState = {
  focus: {
    activeZoneId: null,
    zones: {},          /* D7: Record 모델 */
    focusStackDepth: 0,
  },
  inputSource: "programmatic",
  effects: [],
};
```

### 2.10 Zone Role Registry

```typescript
/* os-new/registry/roleRegistry.ts */

type ZoneRole =
  | "group"
  | "listbox"
  | "menu"
  | "menubar"
  | "radiogroup"
  | "tablist"
  | "toolbar"
  | "grid"
  | "treegrid"
  | "tree"
  | "dialog"
  | "alertdialog"
  | "combobox"
  | "feed"
  | "accordion"
  | "disclosure"
  | "builderBlock"
  | "application";

type RolePreset = DeepPartial<ZoneConfig>;

/** role → 기본 설정 매핑 */
const rolePresets: Record<ZoneRole, RolePreset>;

/** role에서 child item의 ARIA role 추론 */
function getChildRole(zoneRole?: ZoneRole | string): string;

/** role preset + 사용자 override → 최종 ZoneConfig */
function resolveRole(
  role: ZoneRole | string | undefined,
  overrides: Partial<ZoneConfig>,
): ZoneConfig;
```

---

## 3. Sensor Pipeline — 키보드 입력 처리

### 3.1 4-Phase 파이프라인

```
KeyboardEvent → [1.Sense] → [2.Classify] → [3.Resolve] → [4.Execute]
                    │             │              │              │
             KeyboardIntent  KeyboardCategory  KeyboardResolution  KeyboardExecutionResult
```

### 3.2 Phase 1: Sense — KeyboardIntent

```typescript
/* os-new/1-sensor/keyboard/KeyboardIntent.ts */
interface KeyboardIntent {
  /** 정규화된 키 문자열 (e.g., "ArrowDown", "Meta+K") */
  canonicalKey: string;

  /** Field 요소에서 발생했는지 */
  isFromField: boolean;

  /** IME 조합 중인지 */
  isComposing: boolean;

  /** 이벤트 대상 요소 */
  target: HTMLElement;

  /** 등록된 Field의 ID (null이면 Field 아님) */
  fieldId: string | null;

  /** 원본 이벤트 */
  originalEvent: KeyboardEvent;
}
```

### 3.3 Phase 2: Classify — KeyboardCategory

```typescript
/* os-new/1-sensor/keyboard/KeyboardCategory.ts */
type KeyboardCategory =
  | "COMMAND"    // 키바인딩 매칭됨 (탐색 포함)
  | "FIELD"      // Field 내 입력
  | "PASSTHRU";  // 브라우저에 위임

function classifyKeyboard(intent: KeyboardIntent): KeyboardCategory;
```

### 3.4 Phase 3: Resolve — KeyboardResolution

```typescript
/* os-new/1-sensor/keyboard/KeyboardResolution.ts */

interface CommandResolution {
  type: "COMMAND";
  commandId: string;
  args?: Record<string, unknown>;
  source: "app" | "os";
}

interface FieldResolution {
  type: "FIELD";
  action: "START_EDIT" | "COMMIT" | "CANCEL" | "SYNC";
  fieldId: string;
}

type KeyboardResolution = CommandResolution | FieldResolution | null;
```

### 3.5 Phase 4: Execute — KeyboardExecutionResult

```typescript
/* os-new/1-sensor/keyboard/KeyboardExecutionResult.ts */
interface KeyboardExecutionResult {
  success: boolean;
  category: KeyboardCategory;
  commandId?: string;
  error?: Error;
  timestamp: number;
}
```

### 3.6 Keyboard Hook

```typescript
/* os-new/1-sensor/keyboard/useKeyboardEvents.ts */
let isComposing: boolean;
function useKeyboardEvents(): void;
```

---

## 4. Focus Pipeline

### 4.1 FocusIntent — 사용자 의도

```typescript
/* os-new/schema/focus/FocusIntent.ts */
type FocusIntent =
  | { type: "NAVIGATE"; direction: Direction }
  | { type: "TAB"; direction: TabDirection }
  | { type: "SELECT"; mode: "single" | "toggle" | "range" | "all" | "none"; targetId?: string }
  | { type: "ACTIVATE"; targetId?: string; trigger: "enter" | "space" | "click" | "focus" }
  | { type: "DISMISS"; reason: "escape" | "outsideClick" }
  | { type: "FOCUS"; targetId: string; source?: "pointer" | "manual" | "auto" }
  | { type: "POINTER"; subtype: "enter" | "leave" | "down" | "up"; targetId: string }
  | { type: "EXPAND"; action: "toggle" | "expand" | "collapse"; targetId?: string };
```

### 4.2 PipelineContext — 실행 스레드

```typescript
/* os-new/schema/focus/FocusPipelineContext.ts */
interface PipelineContext {
  // Source
  readonly sourceId: string | null;
  readonly sourceGroupId: string | null;

  // Intent
  readonly intent: FocusIntent;

  // Resolution (파이프라인이 채움)
  targetId: string | null;
  targetGroupId: string | null;

  // Spatial Memory
  stickyX: number | null;
  stickyY: number | null;

  // Flags
  shouldTrap: boolean;
  shouldProject: boolean;

  // Selection
  newSelection?: string[];
  newAnchor?: string | null;

  // Activation
  activated?: boolean;
}
```

### 4.3 FocusNode / FocusTarget

```typescript
/* os-new/schema/focus/FocusNode.ts */
interface FocusNode {
  id: string;
  element: HTMLElement;
  rect: DOMRect;
  disabled?: boolean;
}

/* os-new/schema/focus/FocusTarget.ts */
type FocusTarget = "real" | "virtual";
```

### 4.4 방향 프리미티브

```typescript
/* os-new/schema/focus/FocusDirection.ts */
type Direction = "up" | "down" | "left" | "right" | "home" | "end";
type TabDirection = "forward" | "backward";
type Orientation = "horizontal" | "vertical" | "both" | "corner";
```

---

## 5. Store Slices — Zone 런타임 상태

### 5.1 ZoneState 구성

```typescript
/* 현재: FocusGroupState (os-new/3-store/focusGroupStore.ts) */
type ZoneState = CursorSlice & SpatialSlice & SelectionSlice & ExpansionSlice & {
  groupId: string;
};
```

### 5.2 CursorSlice

```typescript
interface CursorSlice {
  focusedItemId: string | null;
  lastFocusedId: string | null;
  recoveryTargetId: string | null;
  setFocus: (itemId: string | null) => void;
}
```

### 5.3 SelectionSlice

```typescript
interface SelectionSlice {
  selection: string[];
  selectionAnchor: string | null;
  setSelection: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  toggleSelection: (id: string) => void;
  setSelectionAnchor: (id: string | null) => void;
  clearSelection: () => void;
}
```

### 5.4 ExpansionSlice

```typescript
interface ExpansionSlice {
  expandedItems: string[];
  toggleExpanded: (id: string) => void;
  setExpanded: (id: string, expanded: boolean) => void;
  isExpanded: (id: string) => boolean;
}
```

### 5.5 SpatialSlice

```typescript
interface SpatialSlice {
  stickyX: number | null;
  stickyY: number | null;
  setSpatialSticky: (x: number | null, y: number | null) => void;
  clearSpatialSticky: () => void;
}
```

### 5.6 Store Factory

```typescript
/* os-new/3-store/focusGroupStore.ts */
function createFocusGroupStore(groupId: string): ZustandStore<ZoneState>;
function useFocusGroupStoreInstance(groupId: string): ZustandStore<ZoneState>;
```

---

## 6. Internal Primitives — OS Developer

### 6.1 FocusGroup

```typescript
/* os-new/primitives/FocusGroup.tsx */
interface FocusGroupProps extends Omit<ComponentProps<"div">,
  "id" | "role" | "style" | "className" |
  "onSelect" | "onCopy" | "onCut" | "onPaste" | "onToggle"
> {
  id?: string;
  role?: ZoneRole;

  // Config Overrides
  navigate?: Partial<NavigateConfig>;
  tab?: Partial<TabConfig>;
  select?: Partial<SelectConfig>;
  activate?: Partial<ActivateConfig>;
  dismiss?: Partial<DismissConfig>;
  project?: Partial<ProjectConfig>;

  // App Command Bindings (→ Scoped Handler로 변환됨)
  onAction?: Command;
  onSelect?: Command;
  onCopy?: Command;
  onCut?: Command;
  onPaste?: Command;
  onToggle?: Command;
  onDelete?: Command;
  onUndo?: Command;
  onRedo?: Command;

  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function FocusGroup(props: FocusGroupProps): JSX.Element;

/** FocusGroup 내부 context 접근 */
function useFocusGroupContext(): FocusGroupContextValue | null;

/** FocusGroup의 Zustand store 접근 */
function useFocusGroupStore(): ZustandStore<ZoneState>;
```

### 6.2 FocusItem

```typescript
/* os-new/primitives/FocusItem.tsx */
interface FocusItemProps {
  id: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "li" | "button" | "a" | "span";
  asChild?: boolean;
  role?: string;
  [key: string]: any;
}

const FocusItem: React.ForwardRefExoticComponent<
  FocusItemProps & React.RefAttributes<HTMLElement>
>;
```

---

## 7. Public Primitives — App Developer

### 7.1 Zone

```typescript
/* os/app/export/primitives/Zone.tsx */

interface ZoneOptions {
  navigate?: Partial<NavigateConfig>;
  tab?: Partial<TabConfig>;
  select?: Partial<SelectConfig>;
  activate?: Partial<ActivateConfig>;
  dismiss?: Partial<DismissConfig>;
  project?: Partial<ProjectConfig>;
}

interface ZoneProps extends Omit<ComponentProps<"div">,
  "id" | "role" | "onSelect" | "onCopy" | "onCut" | "onPaste" | "onToggle"
> {
  id?: string;
  role?: ZoneRole;
  options?: ZoneOptions;

  // App Command Bindings
  onAction?: Command;
  onSelect?: Command;
  onCopy?: Command;
  onCut?: Command;
  onPaste?: Command;
  onToggle?: Command;
  onDelete?: Command;
  onUndo?: Command;
  onRedo?: Command;

  children: ReactNode;
}

function Zone(props: ZoneProps): JSX.Element;
```

```tsx
<Zone id="todo-list" role="listbox"
  options={{ select: { mode: "multiple", range: true } }}
  onAction={ToggleDone({ id: OS.FOCUS })}
  onDelete={DeleteTodo({ id: OS.FOCUS })}
>
  {todos.map(todo => (
    <Item key={todo.id} id={todo.id}>
      {({ isFocused, isSelected }) => (
        <div data-focused={isFocused} data-selected={isSelected}>
          {todo.text}
        </div>
      )}
    </Item>
  ))}
</Zone>
```

### 7.2 Item

```typescript
/* os/app/export/primitives/Item.tsx */

interface ItemState {
  isFocused: boolean;
  isSelected: boolean;
  isAnchor?: boolean;
}

interface ItemProps extends Omit<HTMLAttributes<HTMLElement>, "id" | "children"> {
  id: string | number;
  payload?: any;
  index?: number;
  children: ReactNode | ((state: ItemState) => ReactNode);
  asChild?: boolean;
  className?: string;
  selected?: boolean;
}

const Item: React.ForwardRefExoticComponent<
  ItemProps & React.RefAttributes<HTMLElement>
>;
```

### 7.3 Field

```typescript
/* os/app/export/primitives/Field.tsx */

type FieldMode = "immediate" | "deferred";

interface FieldProps extends Omit<HTMLAttributes<HTMLElement>,
  "onChange" | "onBlur" | "onFocus" | "onSubmit"
> {
  /** 현재 값 */
  value: string;

  /** 필드 이름 (식별용) */
  name?: string;

  /** 빈 값일 때 표시 */
  placeholder?: string;

  /** 여러 줄 편집 */
  multiline?: boolean;

  /** 확정(Enter) 시 커맨드 */
  onSubmit?: FieldCommandFactory;

  /** 변경 시 커맨드 */
  onChange?: FieldCommandFactory;

  /** 취소(Escape) 시 커맨드 */
  onCancel?: Command;

  /** 업데이트 타입 ("sync" | "commit") */
  updateType?: string;

  /** 값 확정 콜백 (순수 JS) */
  onCommit?: (value: string) => void;

  /** 값 동기화 콜백 (순수 JS) */
  onSync?: (value: string) => void;

  /** 취소 콜백 (순수 JS) */
  onCancelCallback?: () => void;

  /** 편집 모드 */
  mode?: FieldMode;

  /** 포커스 타겟 ("real" | "virtual") */
  target?: FocusTarget;

  /** aria-controls 대상 ID */
  controls?: string;

  /** Zone 비활성 시 blur */
  blurOnInactive?: boolean;

  /** 렌더링 요소 */
  as?: "span" | "div";
}

const Field: React.ForwardRefExoticComponent<
  FieldProps & React.RefAttributes<HTMLElement>
>;
```

### 7.4 FieldCommandFactory

```typescript
/* os-new/schema/command/BaseCommand.ts */
type FieldCommandFactory<P extends { text: string } = { text: string }> =
  ((payload: P) => Command) & { id: string; _def?: any };
```

### 7.5 Trigger

```typescript
/* os/app/export/primitives/Trigger.tsx */
interface TriggerProps<T extends Command> extends HTMLAttributes<HTMLButtonElement> {
  id?: string;
  onPress: T;
  children: ReactNode;
  asChild?: boolean;
  dispatch?: (cmd: T) => void;
  allowPropagation?: boolean;
}

const Trigger: React.ForwardRefExoticComponent<
  TriggerProps<Command> & React.RefAttributes<HTMLButtonElement>
>;
```

### 7.6 Label

```typescript
/* os/app/export/primitives/Label.tsx */
interface LabelProps extends HTMLAttributes<HTMLDivElement> {
  for?: string;
  asChild?: boolean;
}

const Label: React.ForwardRefExoticComponent<
  LabelProps & React.RefAttributes<HTMLDivElement>
>;
```

---

## 8. Transaction System

### 8.1 Transaction

```typescript
/* os-new/schema/state/OSTransaction.ts */
interface Transaction {
  id: number;
  timestamp: number;
  input: TransactionInput;
  command: TransactionCommand | null;
  snapshot: OSState;
  diff: StateDiff[];
}

interface TransactionInput {
  source: InputSource;
  raw: string;           // "ArrowDown", "mousedown" 등
}

interface TransactionCommand {
  type: string;
  payload?: unknown;
}

interface StateDiff {
  path: string;          // dot-path: "focus.zones.todo-list.focusedItemId"
  from: unknown;
  to: unknown;
}

function computeDiff(before: OSState, after: OSState): StateDiff[];
```

### 8.2 History

```typescript
/* os-new/4-effect/HistoryState.ts */
interface HistoryEntry {
  command: { type: string; payload?: any };
  timestamp: number;
  snapshot?: any;
  focusedItemId?: string | null;
}

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}
```

### 8.3 Persistence

```typescript
/* os-new/schema/state/PersistenceAdapter.ts */
interface PersistenceAdapter {
  save(key: string, data: any): void;
  load(key: string): any;
}

const LocalStorageAdapter: PersistenceAdapter;
```

---

## 9. Logic Engine

### 9.1 LogicNode — 조건 평가

```typescript
/* os-new/core/logic/LogicNode.ts */
type ContextKey = string;
type ContextValue = boolean | string | number | null | undefined | string[];

interface ContextState {
  activeZone?: string;
  focusPath?: string[];
  [key: ContextKey]: ContextValue;
}

/** 평가 함수 + 문자열 표현 */
type LogicNode = {
  (ctx: ContextState): boolean;
  toString(): string;
};
```

### 9.2 Rule — 조건 빌더

```typescript
/* os-new/core/logic/Rule.ts */
const Rule = {
  and: (...fns: LogicNode[]) => LogicNode;
  or: (...fns: LogicNode[]) => LogicNode;
};

/** Expect 빌더 (fluent API) */
const Expect: <T>(key: keyof T) => {
  toBe: (v: any) => LogicNode;
  toBeTruthy: () => LogicNode;
  toBeFalsy: () => LogicNode;
  gt: (v: number) => LogicNode;
  gte: (v: number) => LogicNode;
  lt: (v: number) => LogicNode;
  lte: (v: number) => LogicNode;
  not: { toBe: (v: any) => LogicNode };
};
```

```typescript
// 사용 예
const when = Expect<ContextState>;

defineKeybinding({
  key: "Enter",
  command: "OS_ACTIVATE",
  when: Rule.and(
    when("activeZone").toBeTruthy(),
    when("isEditing").toBeFalsy(),
  ),
});
```

### 9.3 evalContext

```typescript
/* os-new/core/logic/evalContext.ts */
function evalContext(
  expr: LogicNode | string | undefined,
  ctx: ContextState,
): boolean;
```

---

## 10. Middleware 계약 (현재)

> D4에 의해 re-frame 형태로 전환 예정. 현재 코드의 인터페이스를 참고용으로 기록.

```typescript
/* os-new/4-effect/OSMiddleware.ts — 현재 (전환 대상) */
type Next<S, A> = (state: S, action: A) => S;
type OSMiddleware<S = any, A = any> = (next: Next<S, A>) => Next<S, A>;
```

```typescript
/* os-new/4-effect/OSManagedState.ts */
interface OSManagedState {
  effects?: { type: string; [key: string]: any }[];
  history?: HistoryState;
  data?: any;
  ui?: any;
}
```

---

## 11. DOMQueries — DOM 유틸리티

```typescript
/* os/features/focus/pipeline/core/osCommand.ts */
interface DOMQueries {
  getItemRole(id: string): string | null;
  getItemRect(id: string): DOMRect | undefined;
  getGroupRect(id: string): DOMRect | undefined;
  getAllGroupRects(): Map<string, DOMRect>;
  getGroupEntry(id: string): any | undefined;
  getGroupItems(id: string): string[];
  getGroupParentId(id: string): string | null;
}
```

---

## 12. runOS — 커맨드 실행 함수 (현재)

> Kernel의 `dispatch` + handler resolution으로 대체 예정.

```typescript
/* os/features/focus/pipeline/core/osCommand.ts */
function runOS<P>(
  command: CommandDef<P>,    /* 현재: OSCommand<P> */
  payload: P,
  overrideZoneId?: string,
): boolean;

function isOSCommandRunning(): boolean;

function setCurrentInput(event: Event): void;
function getLastInputSource(): InputSource;
function consumeInputInfo(): TransactionInput;
function consumeCollectedEffects(): EffectRecord[];
```

---

## 부록 A. 전체 타입 인덱스

| 타입 | Layer | 현재 코드 | Section |
|---|---|---|---|
| `Command` | Kernel | `BaseCommand` | 1.1 |
| `CommandDef<P>` | Kernel | `OSCommand<P>` / `CommandFactory` | 1.4 |
| `Handler<P>` | Kernel | `OSCommand.run` | 1.3 |
| `EffectMap` | Kernel | `OSResult` | 1.5 |
| `Context` | Kernel | `OSContext` | 1.6 |
| `Middleware` | Kernel | `OSMiddleware` (Redux) | 1.12 |
| `Scope` | Kernel | (제안) | 1.11 |
| `BubblePath` | Kernel | (제안) | 1.11 |
| `Computed<T>` | Kernel | (제안) | 1.13 |
| `KeybindingDef` | Kernel | `KeybindingItem` | 1.14 |
| `FocusState` | OS | `FocusState` | 2.1 |
| `ZoneState` | OS | `FocusGroupState` | 2.2 |
| `ZoneSnapshot` | OS | `ZoneSnapshot` | 2.3 |
| `ZoneConfig` | OS | `FocusGroupConfig` | 2.4 |
| `NavigateConfig` | OS | `NavigateConfig` | 2.4 |
| `TabConfig` | OS | `TabConfig` | 2.4 |
| `SelectConfig` | OS | `SelectConfig` | 2.4 |
| `ActivateConfig` | OS | `ActivateConfig` | 2.4 |
| `DismissConfig` | OS | `DismissConfig` | 2.4 |
| `ProjectConfig` | OS | `ProjectConfig` | 2.4 |
| `OS_COMMANDS` | OS | `OS_COMMANDS` | 2.5 |
| `OSCommandType` | OS | `OSCommandType` | 2.5 |
| `OSCommandUnion` | OS | `OSCommandUnion` | 2.5 |
| `DOMEffect` | OS | `DOMEffect` | 2.7 |
| `EffectRecord` | OS | `EffectRecord` | 2.8 |
| `OSState` | OS | `OSState` (이름 보류) | 2.9 |
| `ZoneRole` | OS | `ZoneRole` | 2.10 |
| `NavigateResult` | OS | `NavigateResult` | 2.6 |
| `NavigationStrategy` | OS | `NavigationStrategy` | 2.6 |
| `InputSource` | OS | `InputSource` | 2.8 |
| `KeyboardIntent` | Sensor | `KeyboardIntent` | 3.2 |
| `KeyboardCategory` | Sensor | `KeyboardCategory` | 3.3 |
| `KeyboardResolution` | Sensor | `KeyboardResolution` | 3.4 |
| `CommandResolution` | Sensor | `CommandResolution` | 3.4 |
| `FieldResolution` | Sensor | `FieldResolution` | 3.4 |
| `KeyboardExecutionResult` | Sensor | `KeyboardExecutionResult` | 3.5 |
| `FocusIntent` | Pipeline | `FocusIntent` | 4.1 |
| `PipelineContext` | Pipeline | `PipelineContext` | 4.2 |
| `FocusNode` | Pipeline | `FocusNode` | 4.3 |
| `FocusTarget` | Pipeline | `FocusTarget` | 4.3 |
| `Direction` | Pipeline | `Direction` | 4.4 |
| `TabDirection` | Pipeline | `TabDirection` | 4.4 |
| `Orientation` | Pipeline | `Orientation` | 4.4 |
| `CursorSlice` | Store | `CursorSlice` | 5.2 |
| `SelectionSlice` | Store | `SelectionSlice` | 5.3 |
| `ExpansionSlice` | Store | `ExpansionSlice` | 5.4 |
| `SpatialSlice` | Store | `SpatialSlice` | 5.5 |
| `Transaction` | Cross | `Transaction` | 8.1 |
| `TransactionInput` | Cross | `TransactionInput` | 8.1 |
| `TransactionCommand` | Cross | `TransactionCommand` | 8.1 |
| `StateDiff` | Cross | `StateDiff` | 8.1 |
| `HistoryEntry` | Cross | `HistoryEntry` | 8.2 |
| `HistoryState` | Cross | `HistoryState` | 8.2 |
| `PersistenceAdapter` | Cross | `PersistenceAdapter` | 8.3 |
| `LogicNode` | Logic | `LogicNode` | 9.1 |
| `ContextState` | Logic | `ContextState` | 9.1 |
| `DOMQueries` | OS | `DOMQueries` | 11 |
| `FieldCommandFactory` | App | `FieldCommandFactory` | 7.4 |

**총 56개 타입, 15개 함수 API.**
