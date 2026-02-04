# 6-Axis Behavior Model

Focus 시스템의 핵심은 복잡한 ARIA 패턴을 6개의 **원자적 축(Atomic Axes)**으로 분해하는 것입니다.

---

## The Six Axes

### 1. Direction (방향)
Arrow 키 내비게이션의 물리적 차원

| 값 | 동작 |
|-----|------|
| `none` | Arrow 키 무시 (버튼, 모달 배경) |
| `v` | Up/Down만 사용 |
| `h` | Left/Right만 사용 |
| `grid` | 4방향 모두 사용 (시각적 근접성 기반) |

### 2. Edge (경계)
아이템 경계 도달 시 동작

| 값 | 동작 |
|-----|------|
| `loop` | 순환 (첫→끝, 끝→첫) |
| `stop` | 정지 (더 이상 이동 없음) |

### 3. Tab (v7.3)
Tab 키 동작 정책 (20년 Muscle Memory 정렬)

| 값 | 동작 | 사용 예 |
|-----|------|---------|
| `loop` | Zone 내 트랩 | Modal Dialog |
| `escape` | Zone 탈출 → 다음 Zone | Listbox, Menu, Toolbar |
| `flow` | 문서 순서 따름 | Form 필드 |

> [!TIP]
> `tab: "escape"` + `direction: "v"` 조합이 일반적입니다.
> Tab으로 리스트를 건너뛰고, Arrow로 내부 탐색합니다.

### 4. Target (대상)
포커스 대상 유형

| 값 | 동작 |
|-----|------|
| `real` | 실제 DOM `el.focus()` |
| `virtual` | `aria-activedescendant` 가상 포커스 |

### 5. Entry (진입)
Zone 진입 시 초기 포커스 위치

| 값 | 동작 |
|-----|------|
| `first` | 첫 번째 아이템 |
| `restore` | 마지막 포커스 위치 복원 |
| `selected` | 선택된 아이템 (listbox) |

### 6. Restore (복원)
Zone 탈출/복귀 시 상태 복원

| 값 | 동작 |
|-----|------|
| `true` | 이전 포커스 위치로 자동 복귀 |
| `false` | 복귀 없음 |

---

## ARIA Role Presets

각 ARIA Role에 대해 사전 정의된 behavior를 제공합니다:

| Role | Direction | Edge | Tab | Target | Entry | Restore |
|:-----|:----------|:-----|:----|:-------|:------|:--------|
| **dialog** | `none` | - | `loop` | `real` | `first` | `true` |
| **listbox** | `v` | `loop` | `escape` | `real` | `selected` | `false` |
| **menu** | `v` | `loop` | `escape` | `real` | `first` | `true` |
| **tabs** | `h` | `loop` | `escape` | `real` | `restore` | `false` |
| **toolbar** | `h` | `loop` | `escape` | `real` | `restore` | `false` |
| **tree** | `v` | `loop` | `escape` | `real` | `restore` | `false` |
| **grid** | `grid` | `stop` | `escape` | `real` | `restore` | `true` |
| **combobox** | `v` | `loop` | `escape` | `virtual` | `first` | `false` |
| **form** | `none` | - | `flow` | `real` | `first` | `false` |

---

## Behavior Resolution

Behavior는 3단계 병합으로 결정됩니다:

```typescript
finalBehavior = merge(BASE_DEFAULTS, PRESET[role], userOverrides);
```

```tsx
// 사용 예시
<OS.Zone 
  id="custom-menu" 
  preset="menu"           // menu preset 적용
  edge="stop"             // edge만 override
>
```

### Resolution Order
1. **Base Defaults**: 시스템 기본값
2. **Role Preset**: ARIA Role에 따른 preset
3. **User Overrides**: 컴포넌트 props

---

## Tab Navigation Patterns

### Loop (Modal Pattern)
```
[Zone: dialog]
  Item A → Item B → Item C → Item A (순환)
  Tab/Shift+Tab이 Zone 밖으로 나가지 않음
```

### Escape (Component Jump)
```
[Zone: listbox]          [Zone: toolbar]
  Item 1   ─────Tab────→   Tool A
  Item 2                   Tool B
  Item 3
```

### Flow (Form Pattern)
```
[Zone: form]
  Input 1 → Input 2 → Button → (다음 Zone의 첫 아이템)
  Zone 경계 무시, 문서 순서 따름
```

---

## Related Documents

- [Overview.md](./Overview.md) - 시스템 개요
- [Architecture.md](./Architecture.md) - 상세 아키텍처
- [Patterns.md](./Patterns.md) - 구현 패턴
