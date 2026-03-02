# 🔍 삽질 일지: editingItemId의 소유권 — 커널인가, OS인가?

> 날짜: 2026-02-16
> 실행 명령: 코드 추적 (테스트 실패 아닌 아키텍처 분석)
> 결과: 설계 결함 발견

## 증상

Builder MVP E2E 테스트에서 `data-editing` 속성이 `null`인데 `contenteditable="true"`. 두 값이 같은 상태(편집 중)를 표현하는데 불일치.

표면적으로는 "동기화가 안 됨"이지만, 더 파보면 **같은 개념을 두 곳에서 독립적으로 관리**하고 있다.

## 삽질 과정

### 시작점: data-editing은 어디서 오나?

`Field.tsx:249`를 보면:

```typescript
"data-editing": mode === "deferred" ? (isEditing ? "true" : undefined) : undefined
```

`isEditing`은 `FieldRegistry.fields[id].state.isEditing`에서 온다.
FieldRegistry는 `src/os/6-components/6-project/FieldRegistry.ts`에 있는 **vanilla store** (React 외부).

### 그러면 contentEditable은?

`Field.tsx:191-194`:

```typescript
const isContentEditable =
  mode === "deferred"
    ? (isFocused && isEditing) || isParentEditing
    : isFocused || isParentEditing;
```

`isParentEditing`은:

```typescript
const isParentEditing =
  isSystemActive &&
  osEditingItemId !== null &&
  osFocusedItemId === osEditingItemId;
```

`osEditingItemId`는 **kernel 상태**: `kernel.state.os.focus.zones[zoneId].editingItemId`.

Builder에서 F2를 누르면:
1. `FIELD_START_EDIT` (OS 커맨드) → kernel `editingItemId` 설정 ✅
2. `isParentEditing = true` → `isContentEditable = true` ✅
3. **하지만** FieldRegistry의 `isEditing`은 아무도 안 건드림 ❌
4. 결과: `contenteditable="true"`, `data-editing=null`

### 누가 FieldRegistry.setEditing()을 부르나?

grep 결과: **아무도 안 부른다**. 코드 전체에서 `FieldRegistry.setEditing()`을 호출하는 곳은 FieldRegistry.ts 내부의 정의뿐.

**FieldRegistry.isEditing은 죽은 상태다.** 쓰이지 않는 게 아니라, 세팅되지 않는 상태.

### 그러면 대체 왜 FieldRegistry에 isEditing이 있나?

코드 히스토리를 추정해보면:
- **v3 시절**: FieldRegistry가 편집 상태의 유일한 소스였을 것
- **커널 도입 후**: `FIELD_START_EDIT` 등이 kernel 커맨드로 재설계되면서 `editingItemId`가 kernel의 ZoneState에 추가됨
- **마이그레이션 과정에서** FieldRegistry.isEditing은 제거되지 않고 남음

### 여기서 진짜 질문이 나온다

**editingItemId가 왜 kernel에 있지?**

코드를 따라가봤다:

| 위치 | 파일 |
|------|------|
| `editingItemId` 정의 | `src/os/state/OSState.ts` (ZoneState) |
| `FIELD_START_EDIT` | `src/os/3-commands/field/field.ts` |
| `FIELD_COMMIT` | `src/os/3-commands/field/field.ts` |
| `FIELD_CANCEL` | `src/os/3-commands/field/field.ts` |
| 키맵: F2 → FIELD_START_EDIT | `src/os/keymaps/osDefaults.ts` |
| 키맵: Enter(editing) → FIELD_COMMIT | `src/os/keymaps/osDefaults.ts` |
| Navigation에서 editing 해제 | `src/os/3-commands/navigate/index.ts:97` |

**전부 `src/os/` 안에 있다.** `packages/kernel/`에는 editing 관련 코드가 **단 한 줄도 없다.**

`kernel.ts`는 `createKernel<AppState>(initialAppState)`를 호출하는데, `AppState.os: OSState`에 `editingItemId`가 포함되어 있을 뿐이다.

### 핵심 발견

"커널에 editing이 있다"는 **착각**이다.

실제 구조:

```
packages/kernel/  ← 순수 인프라: state store, dispatch, middleware
  └── createKernel.ts  ← AppState에 대해 아무것도 모름

src/os/  ← OS 레이어: focus, navigation, field, keybindings
  ├── state/OSState.ts  ← editingItemId ← 여기
  ├── 3-commands/field/  ← FIELD_START_EDIT/COMMIT/CANCEL ← 여기  
  ├── 3-commands/navigate/  ← editingItemId = null on nav ← 여기
  ├── keymaps/  ← F2, Enter(editing), Escape bindings ← 여기
  └── 6-components/6-project/
      ├── Field.tsx  ← contentEditable, data-editing 렌더링
      └── FieldRegistry.ts  ← 죽은 isEditing 상태
```

**editing은 이미 전적으로 OS의 책임이다.** Kernel은 상태를 저장하는 인프라일 뿐, editing의 의미를 전혀 모른다.

## 원인 추정 — 5 Whys

1. 왜 `data-editing`이 `contenteditable`과 불일치하나?
   → `data-editing`은 FieldRegistry.isEditing에서 파생, `contenteditable`은 kernel.editingItemId에서 파생. 서로 다른 소스.

2. 왜 두 소스가 분리되어 있나?
   → FieldRegistry는 v3 시절 유일한 편집 상태 저장소. kernel 도입 후 editingItemId가 ZoneState에 추가됐지만, FieldRegistry.isEditing은 제거/통합되지 않음.

3. 왜 통합되지 않았나?
   → 마이그레이션 중 "기능이 동작하면 OK" 기준으로 진행. contentEditable이 kernel에서 작동하므로, FieldRegistry.isEditing이 세팅 안 되는 것을 눈치 못씀.

4. 왜 눈치 못쳤나?
   → `data-editing`에 의존하는 CSS(blue ring)가 시각적으로만 확인 가능. 자동 테스트가 없었음.

→ **근본 원인**: v3→v5 마이그레이션 시 FieldRegistry.isEditing을 kernel.editingItemId로 대체하는 작업이 누락됨. **죽은 상태(dead state)**가 여전히 남아서, 그로부터 파생된 `data-editing`과 CSS가 깨짐.

→ **확신도**: 높음

## "커널의 책임인가?"에 대한 답

**아니다.** Kernel(`packages/kernel/`)은 `createKernel`, `dispatch`, `defineCommand` 등 **도메인 무관 인프라**만 제공한다. editing에 대해 아는 것은 제로.

`editingItemId`는 **OS state** (`src/os/state/OSState.ts`)에 정의되어 있고, 이를 다루는 모든 커맨드/키맵/컴포넌트가 `src/os/` 안에 있다.

**editing은 OS의 책임이다.** 그리고 OS 안에서 **ZoneState.editingItemId가 유일한 진실의 원천**이어야 한다.

## 다음 액션 제안

1. **FieldRegistry.isEditing 제거** — 죽은 상태. 세팅하는 코드 없음. 사용처(`data-editing` 파생)를 kernel.editingItemId 기반으로 전환.

2. **`data-editing` 파생을 단순화** — Field.tsx에서:
   ```typescript
   // 변경 전: FieldRegistry 기반 (죽은 상태)
   "data-editing": mode === "deferred" ? (isEditing ? "true" : undefined) : undefined
   
   // 변경 후: kernel 기반 (실제 동작하는 상태)
   "data-editing": mode === "deferred" ? (isContentEditable ? "true" : undefined) : undefined
   ```

3. **FieldRegistry의 역할 재정의** — editing 상태 관리는 제거하고, config 저장소(name, mode, fieldType, onSubmit, onCommit 등) + localValue 버퍼만 유지.
