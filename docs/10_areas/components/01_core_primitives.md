# 핵심 프리미티브 (TFIZ)

인터랙션 OS는 DOM과 커맨드 엔진 사이의 인터페이스 역할을 하는 4가지 "자주적 프리미티브(Sovereign Primitives)"를 기반으로 구축되었습니다.

## 1. `<Zone />` (관할권, Jurisdiction)
포커스와 키바인딩을 위한 공간적 문맥을 정의합니다. 한 번에 하나의 Zone만 "활성(Active)" 상태가 될 수 있습니다 (Jur.Active).

### Props
| Prop | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | **필수**. Zone의 고유 식별자 (예: `'sidebar'`, `'main'`). |
| `area` | `string` | 그룹화를 위한 의미론적 영역 이름 (예: `'navigation'`). |
| `defaultFocusId` | `string` | Zone이 활성화될 때 포커스할 Item의 ID. |
| `active` | `boolean` | *선택*. 활성 상태를 수동으로 재정의합니다 (`useFocusStore`에 의해 기본적으로 활성화됨). |

### 사용법 (Usage)
```tsx
<Zone id="sidebar" defaultFocusId="inbox">
  {/* 아이템들이 여기에 위치합니다 */}
</Zone>
```

## 2. `<Item />` (객체, Object)
Zone 내의 개별적이고 상호작용 가능한 객체를 나타냅니다. 선택 및 포커스 가시성을 처리합니다.

### Props
| Prop | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` \| `number` | **필수**. 객체의 고유 식별자. |
| `asChild` | `boolean` | `true`일 경우, 자식 컴포넌트에 props를 병합합니다 (Radix UI 패턴). |
| `className` | `string` | CSS 클래스. |

### 사용법 (Usage)
```tsx
<Item id="task-1" className="flex row p-2">
  <span>할 일 1</span>
</Item>
```

## 3. `<Field />` (속성, Property)
기본적인 입력 프리미티브입니다. 키 입력을 엔진에 동기화하는 "커맨드 인식 입력(Command-Aware Input)" 역할을 합니다.

### Props
| Prop | Type | Description |
| :--- | :--- | :--- |
| `value` | `string` | **필수**. 현재 값 (제어 컴포넌트). |
| `name` | `string` | 상태 내의 속성 이름 (예: `'title'`). |
| `syncCommand` | `BaseCommand` | 모든 키 입력(`onChange`)마다 발생합니다. |
| `commitCommand` | `BaseCommand` | `Enter` 또는 `Blur` 시 발생합니다. |
| `cancelCommand` | `BaseCommand` | `Escape` 시 발생합니다. |
| `asChild` | `boolean` | `true`일 경우, 자식 Input 컴포넌트에 동작을 연결합니다. |

### 사용법 (Usage)
```tsx
<Field
    value={todo.text}
    syncCommand={{ type: 'UPDATE_DRAFT', payload: { id: todo.id } }}
    commitCommand={{ type: 'SAVE_TODO', payload: { id: todo.id } }}
/>
```

## 4. `<Trigger />` (행위, Verb)
버튼, 체크박스 또는 동작을 유발하는 모든 요소에 사용됩니다.

### Props
| Prop | Type | Description |
| :--- | :--- | :--- |
| `command` | `BaseCommand` | **필수**. 클릭 시 디스패치할 커맨드. |
| `asChild` | `boolean` | `true`일 경우, 자식 요소에 동작을 병합합니다. |
| `allowPropagation`| `boolean` | *기본값: false*. `true`일 경우, 클릭 이벤트가 상위로 버블링되도록 허용합니다. |

### 사용법 (Usage)
```tsx
<Trigger command={{ type: 'DELETE_TODO', payload: { id: 1 } }}>
  <button>삭제</button>
</Trigger>
```
