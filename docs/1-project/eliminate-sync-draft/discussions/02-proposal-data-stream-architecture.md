# Field Data Stream Architecture: Separating Input from Intent

| 메타 정보 | 내용 |
|-----------|------|
| 원문 | `Field는 향후 앞으로 그러면 어떻게 관리되고 처리할건데? 코드 수정이 목표가 아니라 더 큰 Goal을 줄게 설계를 완성해봐. 나는 이게 redux -> tanstackQuery와 같이 커맨드가 아닌걸 커맨드로 하려고 하기 떄문이라 생각해. Field는 데이터로 관리해도 되는 부분이잖아?` |
| 추정 의도 | `syncDraft` 제거를 넘어, Field 입력 처리를 OS 데이터 레이어로 이관하고 앱은 순수 Intent(Command)만 처리하는 아키텍처 비전을 요구함. |
| 작성일 | 2026-02-19 |
| 상태 | [proposal] |

## 1. 개요 (Overview)

현재 OS의 Field 입력 처리는 **Data Stream(고빈도 입력)**을 **Command Stream(저빈도 의도)**으로 강제 변환하는 구조적 문제를 안고 있다. 이는 Redux 초기의 "모든 상태 변경은 액션이다"라는 강박과 유사하며, 불필요한 보일러플레이트와 성능 저하를 야기한다.

본 제안서는 **Data Stream(FieldRegistry)과 Command Stream(App Command)의 명확한 분리**를 통해, "TanStack Query" 스타일의 데이터 관리 철학을 OS에 도입하는 아키텍처 청사진이다.

## 2. 분석 (Analysis)

### 현행 아키텍처 (Redux Style)
- **Input**: 키 입력 → `InputListener` → `onChange` → **Command (`syncDraft`)** → **App State (`ui.draft`)**
- **Submit**: Enter → `onSubmit` → Command (`addTodo`) → App State (`ui.draft` 참조)
- **문제점**:
  1. **고비용 경로**: 단순 텍스트 입력이 전체 커맨드 파이프라인(미들웨어, 히스토리 등)을 통과함.
  2. **중복 상태**: `FieldRegistry`와 `AppState`에 동일 데이터가 존재 (Single Source of Truth 위반).
  3. **강한 결합**: 앱이 입력 처리 로직(`syncDraft`)을 직접 구현해야 함.

### 제안 아키텍처 (TanStack Query Style)
- **Input**: 키 입력 → `InputListener` → **OS Data Layer (`FieldRegistry`)**
- **Submit**: Enter → `onSubmit` → Command (`addTodo`) → **Payload (`text`)** (OS가 주입)
- **변화**:
  1. **Zero Config**: 앱은 `onChange`를 구현할 필요가 없음.
  2. **Lazy Read**: 데이터는 필요할 때(Submit)만 읽음.
  3. **Weak Coupling**: 앱은 "텍스트가 어디 저장되는지" 몰라도 됨.

## 3. 상세 설계 (Detailed Design)

### Layer 1: OS Data Layer (The "Server State")
- **주체**: `InputListener` + `FieldRegistry`
- **역할**: 사용자의 물리적 입력(DOM Event)을 논리적 데이터(`localValue`)로 변환 및 유지.
- **특징**: 앱의 생명주기와 무관하게 독립적으로 데이터 보존. (`TanStack Query`의 캐시 역할)
- **책임**:
  - DOM 동기화 (contentEditable ↔ Registry)
  - 값 보존 (Unmount 시 정책에 따라 유지/삭제)

### Layer 2: Interface Layer (The "Component")
- **주체**: `Field.tsx`
- **역할**: OS 데이터와 React 컴포넌트의 연결.
- **API**:
  - `defaultValue`: 초기값 주입 (Mount 시 1회).
  - `key`: 초기화 트리거 (Reset이 필요하면 key 변경).
  - `value`: (Optional) Controlled Component 모드일 때만 사용. (지양)

### Layer 3: App Intent Layer (The "Mutation")
- **주체**: App Command (`addTodo`)
- **역할**: 사용자의 의도(Intent)를 실행.
- **특징**: 데이터(`text`)는 Payload로 전달됨. 상태(`ui.draft`)를 읽지 않음.

## 4. App Interface: How to Read/Write

App이 FieldRegistry의 데이터를 다루는 3가지 패턴:

### 1. Payload (Default) — "제출할 때 받는다"
가장 권장되는 방식. App은 입력 중인 값을 몰라도 된다.
```typescript
// App Command (addTodo)
(ctx, payload: { text?: string }) => {
  // OS가 onSubmit 시점에 text를 주입해준다.
  const text = payload.text; 
}
```

### 2. Hook (Read) — "필요할 때 읽는다"
유효성 검사나 필터링 등, 제출 전 값이 필요할 때. **복제하지 않고 직접 참조**한다.
```typescript
// Component
const value = useField("todo-draft").value; // Reactive
const isValid = value.length > 0;
```

### 3. Command (Write) — "값을 바꾼다"
초기화, 리셋, 템플릿 주입 등.
```typescript
// App Command (reset)
(ctx) => {
  // OS.UPDATE_FIELD 커맨드를 디스패치 (App State 수정 아님)
  return OS.updateField({ id: "todo-draft", value: "" });
}
```

## 5. Cynefin 도메인 판정

🔴 **Complex**
- 정답이 없는 아키텍처 설계 영역.
- "Redux vs TanStack Query" 비유는 적절하나, OS 컨텍스트에 맞게 재해석이 필요.
- 기존 앱들의 마이그레이션 전략 수립 필요.

## 5. 인식 한계 (Epistemic Status)
- `FieldRegistry`의 메모리 관리(GC) 정책이 아직 명확하지 않음. (언제 데이터를 지울 것인가?)
- 실시간 필터링(`QuickPick`) 같은 "파생 상태" 요구사항은 `onChange`를 유지해야 함. (Transformation vs Storage 구분 필요)

## 6. 결론 (Conclusion)

Field는 더 이상 "앱 상태의 일부"가 아니라 "OS가 관리하는 데이터 리소스"다.
앱은 데이터를 소유하지 않고, OS로부터 주입받는다.

**Action Plan**:
1. `eliminate-sync-draft` 프로젝트를 통해 Todo 앱에 이 아키텍처를 시범 적용 (PoC).
2. 성공 시 `FieldRegistry`를 공식적인 "OS Data Layer"로 승격 및 문서화.
3. 다른 앱(Builder 등)으로 패턴 확산.

**한줄요약**:
입력(Input)은 OS가 관리하는 데이터 스트림이고, 제출(Submit)만이 앱이 처리해야 할 커맨드다.
