# @os-new 네이밍 컨벤션 규칙 (초안)

## 1. 개요

이 문서는 `src/os-new/` 폴더의 네이밍 컨벤션 규칙과 **그 규칙을 선호하는 이유**를 정리한다.
규칙만 있으면 "지금 이 순간"만 맞출 수 있고, 이유가 있어야 "다음에도" 일관되게 유지할 수 있다.

---

## 2. 핵심 철학: 왜 이 컨벤션인가

### 2.1 「하나의 개념 = 하나의 이름」

> 같은 것을 두 가지 이름으로 부르면, 그 순간부터 **검색이 깨진다**.

파일명, 폴더명, 타입명, 변수명이 모두 같은 단어를 공유해야 한다.
`expand`를 다루는 파일에서 `EXPAND`를 export하고, 폴더명도 `expand/`여야 한다.
`UserProfile`, `UserProfileData`, `UserProfileInfo` 중 **하나만** 존재해야 한다.

**위반 사례 (현재 코드)**:
- `sync.ts` → 내부에서 `SYNC_FOCUS` export → 파일명에서 추측 불가
- `all.ts` → 내부에서 `SELECT_ALL` export → 단어 `select`가 파일명에 없음
- `FIELD_BLUR.ts` → 파일이 SCREAMING_CASE, 형제 폴더 파일들은 camelCase

**이 규칙이 해결하는 문제**:
- `Cmd+P`(파일 검색)에서 이름을 치면 바로 찾을 수 있다
- import 경로를 보면 내용을 예측할 수 있다
- AI가 코드를 생성할 때도 명확한 패턴을 따를 수 있다

---

### 2.2 「접두어 그룹핑」 — domain이 먼저, role이 뒤에

> `tabCommand.ts`가 아니라 `tabCommand.ts`가 맞는 이유가 아니다.
> 핵심은 **같은 도메인의 파일이 탐색기에서 붙어 있느냐**이다.

```
❌ 역할 접두어 (role-first)          ✅ 도메인 접두어 (domain-first)
commandActivate.ts                  activateCommand.ts
commandDelete.ts                    deleteCommand.ts
commandNavigate.ts                  navigateCommand.ts
sensorClipboard.tsx                 clipboardSensor.tsx
sensorFocus.tsx                     focusSensor.tsx
```

역할(Command, Sensor)로 접두어를 잡으면 파일이 "타입별"로 모인다.
도메인(activate, clipboard)으로 접두어를 잡으면 파일이 "기능별"로 모인다.

이 프로젝트에서는 **이미 폴더(`1-sensor/`, `2-command/`)가 타입을 분리**하고 있으므로,
파일 레벨에서는 **도메인을 접두어로** 두어 같은 기능의 파일이 알파벳순으로 붙어있게 한다.

```
navigate/
  navigateCommand.ts     ← 메인 커맨드
  navigateResolve.ts     ← 해결 로직 (resolve와 domain이 같이)
  navigateStrategies.ts  ← 전략 레지스트리
  navigateEntry.ts       ← 진입점 결정
```

→ IDE에서 `navigate` 폴더를 열면 모두 `navigate*`로 시작해서 **시각적으로 그룹**이 보인다.

**반례**: `resolve.ts`, `strategies.ts`, `entry.ts`처럼 도메인 접두어 없이 짧은 이름을 쓰면,
폴더 컨텍스트 없이 import 경로만 봤을 때 (`from "./resolve"`) 무슨 resolve인지 알 수 없다.

---

### 2.3 「파일명은 primary export의 camelCase 변환」

> 파일명과 export명이 **변환 규칙으로 연결**되어야 한다.
> 보고 예측할 수 있으면 검색할 필요가 없다.

| Export | 파일명 | 변환 규칙 |
|--------|--------|-----------|
| `ACTIVATE` (const) | `activateCommand.ts` | SCREAMING을 camelCase로 + `Command` suffix |
| `FIELD_BLUR` (const) | `fieldBlurCommand.ts` | SCREAMING을 camelCase로 + `Command` suffix |
| `SYNC_FOCUS` (const) | `syncFocusCommand.ts` | SCREAMING을 camelCase로 + `Command` suffix |
| `resolveExpansion` (fn) | `resolveExpansion.ts` | 그대로 (function은 이미 camelCase) |
| `FocusSensor` (component) | `FocusSensor.tsx` | 그대로 (component는 PascalCase) |
| `FocusGroupConfig` (type) | `focusTypes.ts` | 도메인 camelCase + `Types` suffix |

규칙: **"export가 결정되면 파일명이 자동으로 나온다"**

---

### 2.4 「이벤트 기반 커맨드명」

> OS 커맨드는 **"무엇이 일어났는가"**(이벤트)로 명명한다.
> **"무엇을 해라"**(동작)로 명명하지 않는다.

- ✅ `OS_ESCAPE` — "Escape 키가 눌렸다"
- ❌ `OS_DISMISS` — "닫아라" (행동 지시)
- ✅ `OS_ACTIVATE` — "활성화 이벤트 발생"
- ❌ `OS_CLICK` — "클릭해라" (행동 지시)

**이유**: 같은 이벤트가 config에 따라 다른 행동을 하기 때문이다.
`OS_ESCAPE`는 Zone config에 따라 `deselect`, `close`, `none` 중 하나를 수행한다.
이름이 `OS_DISMISS`였다면 deselect 동작과 이름이 충돌한다.

---

### 2.5 「코드 최소주의 + 약어 허용 목록」

> 모든 코드는 부채다. 이름도 마찬가지다.
> 하지만 과도한 축약은 더 큰 부채다.

**허용되는 약어** (워낙 보편적이라 풀네임보다 가독성이 좋은 것들):

| 약어 | 의미 | 설명 |
|------|------|------|
| `ctx` | context | 매개변수명 한정 |
| `cmd` | command | 매개변수명 한정 |
| `id` | identifier | 보편적 |
| `ref` | reference | React ref |
| `props` | properties | React props |
| `e` | event | 이벤트 핸들러 매개변수 한정 |
| `fn` | function | 고차함수 매개변수 한정 |
| `el` | element | DOM element 한정 |
| `DOM` | Document Object Model | 대문자 약어 |
| `OS` | Operating System | 프로젝트 핵심 약어 |

**그 외는 풀네임**: `config` (O), `cfg` (X). `direction` (O), `dir` (X).

---

### 2.6 「파일명 해부학」 — 반드시 포함해야 하는 것

> **파일명은 폴더 컨텍스트 없이, 단독으로 읽혀야 한다.**

파일명에는 다음 두 가지가 **반드시** 포함되어야 한다:

```
{domain}{Kind}.ts
  │       │
  │       └── Kind: 이 파일이 "무엇"인가 (역할/종류)
  └────────── Domain: 이 파일이 "어떤 개념"을 다루는가
```

#### 왜 필요한가

`import { resolveEntry } from "./entry"` — 이 import만 보면 **무슨 entry인지 모른다.**
`import { resolveEntry } from "./navigateEntry"` — navigate의 entry라는 것이 즉시 보인다.

IDE 탭에 `entry.ts`가 떠 있으면 무슨 파일인지 알 수 없다.
`navigateEntry.ts`가 떠 있으면 폴더를 확인할 필요 없다.

#### Domain (필수)

**"이 파일이 어떤 개념/기능을 다루는가"**를 한 단어로 표현.

| Domain 예시 | 설명 |
|------------|------|
| `navigate` | 방향키 네비게이션 |
| `focus` | 포커스 관리 |
| `select` | 선택 상태 |
| `field` | 입력 필드 |
| `keyboard` | 키보드 이벤트 |
| `clipboard` | 복사/붙여넣기 |
| `expand` | 확장/축소 |
| `activate` | Enter 활성화 |

**예외**: `slices/` 폴더 안의 파일은 폴더 자체가 "이것은 스토어 슬라이스다"를 명시하므로 domain만으로 충분 (`cursor.ts`, `selection.ts`).

#### Kind (필수)

**"이 파일이 어떤 종류/역할인가"**를 suffix 또는 prefix로 표현.

| Kind | 위치 | 적용 대상 | 예시 |
|------|------|-----------|------|
| `Command` | suffix | OS 커맨드 정의 파일 | `activateCommand.ts` |
| `Sensor` | suffix | DOM 이벤트 감지 컴포넌트 | `FocusSensor.tsx` |
| `Intent` | suffix | 커맨드 라우팅 컴포넌트 | `ClipboardIntent.tsx` |
| `Store` | suffix | Zustand 스토어 | `focusGroupStore.ts` |
| `Registry` | suffix | 등록소 | `fieldRegistry.ts`, `roleRegistry.ts` |
| `use` | prefix | React Hook | `useInputEvents.ts` |
| `resolve` | prefix | 순수 해결 함수 | `resolveExpansion.ts`, `resolvePayload.ts` |
| `classify` | prefix | 분류 함수 | `classifyKeyboard.ts` |
| `intercept` | prefix | 변환 함수 | `interceptKeyboard.ts` |
| `get` | prefix | 조회 함수 | `getCanonicalKey.ts`, `getCaretPosition.ts` |
| `build` | prefix | 생성 함수 | `buildBubblePath.ts` |
| `eval` | prefix | 평가 함수 | `evalContext.ts` |
| `create` | prefix | 팩토리 함수 | (주로 slice 내부) |

**함수 파일의 경우**: 동사(verb)가 Kind 역할을 겸한다.
`resolveExpansion.ts` → `resolve`가 Kind(해결 함수), `Expansion`이 Domain.

#### 전수 점검: 현재 파일 적합성

**✅ 적합 — domain + kind 모두 포함**:

| 파일명 | Domain | Kind | 판정 |
|--------|--------|------|------|
| `ClipboardSensor.tsx` | Clipboard | Sensor | ✅ |
| `ClipboardIntent.tsx` | Clipboard | Intent | ✅ |
| `FocusSensor.tsx` | Focus | Sensor | ✅ |
| `HistoryIntent.tsx` | History | Intent | ✅ |
| `KeyboardSensor.tsx` | Keyboard | Sensor | ✅ |
| `KeyboardIntent.tsx` | Keyboard | Intent | ✅ |
| `classifyKeyboard.ts` | Keyboard | classify (verb) | ✅ |
| `getCanonicalKey.ts` | CanonicalKey | get (verb) | ✅ |
| `interceptKeyboard.ts` | Keyboard | intercept (verb) | ✅ |
| `keyboardTypes.ts` | Keyboard | Types | ✅ |
| `useInputEvents.ts` | InputEvents | use (hook) | ✅ |
| `useKeyboardEvents.ts` | KeyboardEvents | use (hook) | ✅ |
| `activateCommand.ts` | Activate | Command | ✅ |
| `deleteCommand.ts` | Delete | Command | ✅ |
| `escapeCommand.ts` | Escape | Command | ✅ |
| `expandCommand.ts` | Expand | Command | ✅ |
| `resolveExpansion.ts` | Expansion | resolve (verb) | ✅ |
| `focusCommand.ts` | Focus | Command | ✅ |
| `navigateCommand.ts` | Navigate | Command | ✅ |
| `selectCommand.ts` | Select | Command | ✅ |
| `tabCommand.ts` | Tab | Command | ✅ |
| `toggleCommand.ts` | Toggle | Command | ✅ |
| `keyboardCommand.ts` | Keyboard | Command (types) | ✅ |
| `focusGroupStore.ts` | FocusGroup | Store | ✅ |
| `buildBubblePath.ts` | BubblePath | build (verb) | ✅ |
| `resolvePayload.ts` | Payload | resolve (verb) | ✅ |
| `dispatchToZone.ts` | Zone | dispatch (verb) | ✅ |
| `evalContext.ts` | Context | eval (verb) | ✅ |
| `focusDOMQueries.ts` | focusDOM | Queries | ✅ |
| `getCaretPosition.ts` | CaretPosition | get (verb) | ✅ |
| `useIsFocusedGroup.ts` | IsFocusedGroup | use (hook) | ✅ |
| `useEventListeners.ts` | EventListeners | use (hook) | ✅ |

**❌ 부적합 — domain 또는 kind 누락**:

| 파일명 | 문제 | Domain 누락 | Kind 누락 | 수정안 |
|--------|------|:-----------:|:---------:|--------|
| `FIELD_BLUR.ts` | casing 위반 + Command suffix 없음 | — | ⚠️ | `fieldBlurCommand.ts` |
| `FIELD_CANCEL.ts` | casing 위반 + Command suffix 없음 | — | ⚠️ | `fieldCancelCommand.ts` |
| `FIELD_COMMIT.ts` | casing 위반 + Command suffix 없음 | — | ⚠️ | `fieldCommitCommand.ts` |
| `FIELD_START_EDIT.ts` | casing 위반 + Command suffix 없음 | — | ⚠️ | `fieldStartEditCommand.ts` |
| `FIELD_SYNC.ts` | casing 위반 + Command suffix 없음 | — | ⚠️ | `fieldSyncCommand.ts` |
| `RECOVER.ts` | casing 위반 + domain 불명확 | ⚠️ | ⚠️ | `recoverCommand.ts` |
| `sync.ts` | domain 누락 (focus? keyboard?) | ⚠️ | ⚠️ | `syncFocusCommand.ts` |
| `all.ts` | domain 누락 (select? 전체?) | ⚠️ | ⚠️ | `selectAllCommand.ts` |
| `resolve.ts` | domain 누락 (navigate의 resolve) | ⚠️ | — | `navigateResolve.ts` |
| `strategies.ts` | domain 누락 | ⚠️ | — | `navigateStrategies.ts` |
| `entry.ts` | domain 누락 | ⚠️ | — | `navigateEntry.ts` |
| `cornerNav.ts` | kind 불명확 (Nav ≠ 표준 suffix) | — | ⚠️ | `navigateCorner.ts` |
| `zoneSpatial.ts` | domain 불명확 (zone? spatial?) | ⚠️ | — | `navigateZoneSpatial.ts` |
| `focusFinder.ts` | kind 불명확 (Finder ≠ 표준) | — | ⚠️ | `navigateFocusFinder.ts` |
| `FieldRegistry.ts` | PascalCase (컴포넌트가 아닌데) | — | — | `fieldRegistry.ts` |
| `middlewareTypes.ts` | domain 불명확 (effect? pipeline?) | ⚠️ | — | `effectTypes.ts` |
| `LogicNode.ts` | PascalCase (컴포넌트가 아닌데) | — | — | `logicNode.ts` |
| `Rule.ts` | PascalCase (컴포넌트가 아닌데) | — | — | `rule.ts` |
| `OSState.ts` | PascalCase (컴포넌트가 아닌데) | — | — | `osState.ts` |
| `PersistenceAdapter.ts` | PascalCase (컴포넌트가 아닌데) | — | — | `persistenceAdapter.ts` |
| `dom.ts` | domain 누락 (무슨 dom?) | ⚠️ | — | `focusDOM.ts` 또는 `domUtils.ts` |
| `logger.ts` | kind만 (무슨 logger?) | — | — | OK (범용 유틸) |
| `loopGuard.ts` | OK (범용 유틸) | — | — | OK |

#### 예외: Kind 없이 Domain만으로 충분한 경우

| 상황 | 이유 | 예시 |
|------|------|------|
| `slices/` 폴더 내 파일 | 폴더가 kind를 명시 | `slices/cursor.ts`, `slices/selection.ts` |
| `entities/` 폴더 내 파일 | 폴더가 kind를 명시 + PascalCase가 타입 | `entities/BaseCommand.ts` |
| 범용 유틸 (프로젝트 전체 공유) | 특정 domain에 속하지 않음 | `logger.ts`, `loopGuard.ts` |

이 세 경우를 제외하면, **모든 파일은 domain + kind를 파일명에 포함해야 한다.**

---

### 2.7 「도메인 인터페이스」 — 파일명 = 타입명, 폴더 = 도메인

> **도메인 인터페이스는 `파일명 = 타입명`이고, 폴더가 도메인을 드러내야 한다.**

#### 문제: 현재 `schema/`의 구조

```
schema/
  commands.ts        ← OS_COMMANDS + OSNavigatePayload + OSSelectPayload + ... (6개 섞임)
  focusTypes.ts      ← Direction + NavigateConfig + TabConfig + ... (14개 타입이 한 파일)
  focus.ts           ← FocusState + ZoneSnapshot (2개)
  effects.ts         ← EffectRecord + InputSource + createFocusEffect (타입+함수 혼재)
  OSState.ts         ← OSState + INITIAL_OS_STATE
  transaction.ts     ← Transaction + 6개 diff 함수 (타입+로직 혼재)
  entities/
    BaseCommand.ts   ← BaseCommand + FieldCommandFactory
    FocusTarget.ts   ← FocusTarget (1줄)
    KeybindingItem.ts← KeybindingItem
```

**문제점**:
1. `focusTypes.ts`에 14개 타입 → 검색이 안 됨 (어떤 타입이 여기 있는지 파일명에서 안 보임)
2. `entities/`에는 3개뿐인데 나머지 도메인 타입들은 루트에 흩어져 있음
3. `transaction.ts`에 타입과 로직이 혼재
4. **폴더 트리만 보고는 "이 프로젝트에 어떤 도메인 개념이 있는지" 알 수 없음**

#### 원칙: 도메인이 폴더 구조에 드러나야 한다

**규칙 1 (절대 원칙): 모든 interface/type은 자기 이름의 파일로 분리한다**

```
✅ NavigateConfig.ts  → export interface NavigateConfig
✅ FocusState.ts      → export interface FocusState
✅ Transaction.ts     → export interface Transaction
✅ Direction.ts       → export type Direction = "up" | "down" | ...

❌ focusTypes.ts      → 14개 타입을 한 파일에 모으는 것은 안티패턴
❌ keyboardTypes.ts   → types.ts로 모으지 않는다
❌ commands.ts        → 상수 + 여러 Payload 타입 혼재
```

**`types.ts`, `{domain}Types.ts` 파일은 만들지 않는다.**

이유:
- `Cmd+P`에서 `NavigateConfig`를 치면 `NavigateConfig.ts`가 나와야 한다
- `focusTypes.ts`라고 나오면 "어떤 타입이 여기 있지?" 열어봐야 한다
- 파일명이 곧 **목차**다. 폴더를 열면 어떤 타입이 존재하는지 한눈에 보여야 한다
- `types.ts`는 쓰레기통이 된다 — 어디 넣을지 모르면 다 여기로 간다

**규칙 2: 폴더명 = 도메인명**

도메인 인터페이스가 여러 개일 때, **폴더가 도메인을 그룹핑**한다.

```
schema/
  command/               ← 커맨드 도메인
    BaseCommand.ts       ← export interface BaseCommand
    OSCommand.ts         ← export type OSCommand (union)
    ...
  focus/                 ← 포커스 도메인
    FocusState.ts        ← export interface FocusState
    ZoneSnapshot.ts      ← export interface ZoneSnapshot
    NavigateConfig.ts    ← export interface NavigateConfig
    ...
  keyboard/              ← 키보드 도메인
    KeybindingItem.ts    ← export interface KeybindingItem
    ...
```

→ 폴더 트리를 펼치면 **"이 시스템에 command, focus, keyboard 도메인이 있구나"** 즉시 파악.

**규칙 3: 관련 타입이 2~3개뿐이면 하나의 파일에 모아도 된다**

무조건 쪼개는 것이 아니다. 의미적으로 묶이는 소수의 타입은 한 파일에 둔다.

```
✅ FocusState.ts  → FocusState + ZoneSnapshot (2개, 같은 도메인, 항상 함께 쓰임)
✅ BaseCommand.ts → BaseCommand + FieldCommandFactory (2개, 밀접한 관계)
❌ focusTypes.ts  → 14개 타입 (너무 많음, 검색 불가)
```

기준: **"이 파일 안에 뭐가 있나?" 열지 않고도 예측 가능한 수(~3개)**

**규칙 4: Entity 파일은 PascalCase**

도메인 인터페이스 파일은 **PascalCase로 유지**한다.
이유: 파일명 = 타입명이고, TypeScript 타입은 PascalCase이므로.

```
entities/BaseCommand.ts     ← interface BaseCommand
entities/KeybindingItem.ts  ← interface KeybindingItem
focus/NavigateConfig.ts     ← interface NavigateConfig
```

이것이 `.tsx` 컴포넌트 규칙의 예외가 아니라, **"파일명 = primary export명" 규칙의 일관된 적용**이다.
컴포넌트도 PascalCase export → PascalCase 파일명.
타입도 PascalCase export → PascalCase 파일명.

#### 제안: `schema/` 재구조화

```
schema/
  command/
    BaseCommand.ts          ← BaseCommand, FieldCommandFactory
    OSCommands.ts           ← OS_COMMANDS 상수 + OSCommandType
  focus/
    FocusState.ts           ← FocusState, ZoneSnapshot
    FocusGroupConfig.ts     ← FocusGroupConfig + sub-configs (Navigate/Tab/Select/...)
    FocusIntent.ts          ← FocusIntent union type
    FocusNode.ts            ← FocusNode
    PipelineContext.ts      ← PipelineContext
    FocusTarget.ts          ← FocusTarget
  effect/
    EffectRecord.ts         ← EffectRecord, EffectSource, createFocusEffect()
  keyboard/
    KeybindingItem.ts       ← KeybindingItem
  state/
    OSState.ts              ← OSState, INITIAL_OS_STATE
    Transaction.ts          ← Transaction, StateDiff (타입만)
    computeDiff.ts          ← computeDiff() 함수 (로직 분리)
  PersistenceAdapter.ts     ← interface + LocalStorageAdapter
```

**변화의 핵심**:
- 폴더 트리만 열면 도메인이 보인다: `command/`, `focus/`, `effect/`, `keyboard/`, `state/`
- 파일명 = 타입명: `NavigateConfig`을 찾으면 `FocusGroupConfig.ts`(또는 `NavigateConfig.ts`)에 있다
- 타입과 로직이 분리: `Transaction.ts`(타입) vs `computeDiff.ts`(함수)

---

## 3. 구체적 규칙


### 3.1 파일 이름

| 대상 | Casing | 패턴 | 예시 |
|------|--------|------|------|
| React 컴포넌트 | PascalCase | `{Name}.tsx` | `FocusGroup.tsx`, `ClipboardSensor.tsx` |
| OS 커맨드 | camelCase | `{name}Command.ts` | `activateCommand.ts`, `fieldBlurCommand.ts` |
| 순수 함수 | camelCase | `{verb}{Noun}.ts` | `resolveExpansion.ts`, `classifyKeyboard.ts` |
| **도메인 인터페이스** | **PascalCase** | **`{TypeName}.ts`** | **`NavigateConfig.ts`, `FocusState.ts`, `Direction.ts`** |
| React Hook | camelCase | `use{Name}.ts` | `useInputEvents.ts`, `useIsFocusedGroup.ts` |
| Zustand Store | camelCase | `{name}Store.ts` | `focusGroupStore.ts` |
| Registry | camelCase | `{name}Registry.ts` | `fieldRegistry.ts`, `roleRegistry.ts` |
| Zustand Slice | camelCase | `{name}.ts` (폴더가 slice임을 명시) | `cursor.ts`, `selection.ts` |
| 유틸/라이브러리 | camelCase | `{name}.ts` | `logger.ts`, `loopGuard.ts` |
| ~~타입 모음~~ | — | ~~`{domain}Types.ts`~~ | **❌ 안티패턴. 사용 금지** |

### 3.2 Export 이름

| 종류 | Casing | 예시 |
|------|--------|------|
| React 컴포넌트 | PascalCase | `export function FocusSensor()` |
| OS 커맨드 객체 | SCREAMING_CASE | `export const ACTIVATE: OSCommand<P>` |
| 순수 함수 | camelCase | `export function resolveExpansion()` |
| 타입 / 인터페이스 | PascalCase | `export interface FocusGroupConfig` |
| 상수 맵 (enum-like) | SCREAMING_CASE | `export const OS_COMMANDS = { ... }` |
| Store 정적 accessor | PascalCase | `export const FieldRegistry = { ... }` |
| Zustand hook | camelCase (`use` prefix) | `export const useFieldRegistry = create(...)` |
| Slice creator | camelCase (`create` prefix) | `export const createCursorSlice = (...)` |

### 3.3 폴더 이름

| 수준 | Casing | 패턴 | 예시 |
|------|--------|------|------|
| 파이프라인 단계 | `{n}-{noun}` | 번호 + 명사 | `1-sensor/`, `2-command/` |
| 도메인 폴더 | camelCase, 단수 | 기능 도메인 | `keyboard/`, `clipboard/`, `focus/` |
| 커맨드 폴더 | camelCase, 단수 | 커맨드 동사/명사 | `activate/`, `navigate/`, `field/` |
| 하위 구조 폴더 | camelCase | 역할 설명 | `slices/`, `entities/`, `hooks/` |

### 3.4 일관성 검증 체크리스트

새 파일을 만들 때 아래를 확인한다:

- [ ] **파일명에서 primary export를 예측할 수 있는가?**
- [ ] **같은 개념이 이미 다른 이름으로 존재하지 않는가?**
- [ ] **폴더 안의 형제 파일들과 casing이 일치하는가?**
- [ ] **같은 도메인 파일들이 알파벳순으로 그룹됐는가?** (접두어 확인)
- [ ] **import 경로만 보고 내용을 추측할 수 있는가?**

---

## 4. 변환 규칙 레퍼런스

**"이 export가 있으면, 파일 이름은 이것이다"**: 

```
Export: FIELD_BLUR          → File: fieldBlurCommand.ts
Export: SYNC_FOCUS          → File: syncFocusCommand.ts  
Export: SELECT_ALL          → File: selectAllCommand.ts
Export: RECOVER             → File: recoverCommand.ts
Export: resolveExpansion()  → File: resolveExpansion.ts
Export: FocusSensor         → File: FocusSensor.tsx
Export: FieldRegistry       → File: fieldRegistry.ts
Export: FocusGroupConfig    → File: focusTypes.ts (타입 파일은 domain + Types)
```

**"이 파일 이름이 있으면, export는 이것이다"**:

```
File: activateCommand.ts   → Export: ACTIVATE (OSCommand)
File: classifyKeyboard.ts  → Export: classifyKeyboard() (function)
File: FocusSensor.tsx       → Export: FocusSensor (component)
File: focusTypes.ts         → Export: 여러 타입 (NavigateConfig, TabConfig, ...)
File: cursor.ts (in slices/) → Export: CursorSlice (type) + createCursorSlice() (factory)
```

---

## 5. 결론 / 다음 단계

### 이 컨벤션의 핵심 가치

| 가치 | 설명 |
|------|------|
| **예측 가능성** | 이름을 보면 내용을 알고, 내용을 보면 이름을 안다 |
| **검색 가능성** | `Cmd+P`에 도메인 키워드를 치면 관련 파일이 모두 나온다 |
| **AI 친화성** | 규칙이 명시적이면 AI가 생성하는 코드도 규칙을 따른다 |
| **지속 가능성** | "왜"를 알면 새로운 상황에서도 올바른 판단을 할 수 있다 |

### 다음 단계

1. **이 초안을 리뷰**하고 수정/보완한다
2. 확정된 규칙을 `.agent/rules.md`의 네이밍 컨벤션 섹션에 반영한다
3. 기존 코드의 위반 사항을 단계적으로 수정한다 (rename)
