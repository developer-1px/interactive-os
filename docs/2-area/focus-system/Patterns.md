# Focus System Patterns

실제 구현에서 자주 사용되는 패턴과 예제입니다.

---

## 1. Kanban 2D Navigation

N차원 포커스(Board → Column → Item)를 Zone 계층과 Axis 조합으로 구현합니다.

### Structure

```tsx
<OS.Zone id="board" preset="grid">     {/* 보드: 4방향 */}
  <Column id="col-1">                   {/* 컬럼: 위/아래만 */}
    <OS.Zone id="col-1-zone" direction="v" allowedDirections={["UP", "DOWN"]}>
      <OS.Item id="card-1" />
      <OS.Item id="card-2" />
    </OS.Zone>
  </Column>
  <Column id="col-2">
    <OS.Zone id="col-2-zone" direction="v" allowedDirections={["UP", "DOWN"]}>
      <OS.Item id="card-3" />
    </OS.Zone>
  </Column>
</OS.Zone>
```

### Axis-Locked Bubbling

Column에서 `allowedDirections: ["UP", "DOWN"]`을 설정하면:
- ↑↓: Column 내 Item 간 이동
- ←→: Column이 무시 → Board로 버블 → 다음 Column으로 이동

### Seamless Transition

컬럼 간 이동 시 같은 높이의 카드로 "순간이동":

```tsx
<OS.Zone 
  id="board" 
  preset="grid" 
  restore={true}  // stickyIndex 보존
>
```

---

## 2. Nested Zones

계층적 Zone 구조에서의 포커스 관리

### Focusable Zone Pattern

Zone이 Container이면서 동시에 Target인 경우:

```tsx
<OS.Zone id="parent">
  <OS.Zone 
    id="nested" 
    focusable={true}  // 자기 자신도 Item으로 등록
  >
    <OS.Item id="child-1" />
    <OS.Item id="child-2" />
  </OS.Zone>
</OS.Zone>
```

- 부모에서 Tab: nested Zone 자체로 이동
- Enter: nested Zone 내부로 진입
- Escape: nested Zone 탈출 → 부모로 복귀

### Exit Intent

```tsx
// Zone 내부 트랩 후 탈출
<OS.Zone id="modal" tab="loop">
  {/* Escape 키로만 탈출 가능 */}
  {/* OS_EXIT 커맨드에 매핑 */}
</OS.Zone>
```

---

## 3. Focus-Scroll Coordination

포커스 이동 시 뷰포트 추적

### Implementation

```typescript
useEffect(() => {
  if (!focusedItemId) return;
  
  const el = document.getElementById(focusedItemId);
  if (!el) return;

  // 1. 네이티브 점프 방지
  el.focus({ preventScroll: true });

  // 2. 부드러운 스크롤
  el.scrollIntoView({ 
    block: "nearest",   // 최소 이동
    inline: "nearest",
    behavior: "smooth"
  });
}, [focusedItemId]);
```

### Why `block: "nearest"`?

| 기본 동작 | nearest |
|-----------|---------|
| 항상 뷰포트 상단/하단으로 점프 | 이미 보이면 이동 없음 |
| 빠른 내비게이션 시 "진동" 발생 | 안정적인 UX |

---

## 4. Virtual Focus (Combobox)

Listbox/Autocomplete에서 가상 포커스 사용

```tsx
<OS.Zone 
  id="combobox" 
  target="virtual"  // aria-activedescendant 사용
>
  <input 
    aria-activedescendant={activeItemId}
    aria-controls="listbox"
  />
  <OS.Zone id="listbox" role="listbox">
    <OS.Item id="option-1">Option 1</OS.Item>
    <OS.Item id="option-2">Option 2</OS.Item>
  </OS.Zone>
</OS.Zone>
```

- Input이 실제 포커스 유지
- Arrow 키로 가상 커서 이동
- `aria-activedescendant`로 스크린리더 지원

---

## 5. Navigation vs Command Integration

모든 내비게이션을 커맨드로 통합 (관찰 가능성 확보)

### Before (분리)
```typescript
// 직접 호출 → Inspector에 안 보임
setFocus(nextId);
```

### After (통합)
```typescript
// 커맨드로 래핑 → Telemetry 확보
dispatch({ 
  type: 'FOCUS_MOVE', 
  payload: { targetId: nextId },
  meta: { isPhysics: true }  // Undo에서 제외
});
```

### 장점
- Inspector에서 모든 키보드 이동 시각화
- 미들웨어로 추가 로직 개입 가능 (효과음, 권한 체크)
- 완벽한 Telemetry

---

## Anti-Patterns

### ❌ Index Math in Apps
```typescript
// 잘못됨: 앱에서 인덱스 계산
const nextIndex = currentIndex + 1;
focusItem(items[nextIndex]);
```

### ✅ Delegate to Engine
```typescript
// 올바름: OS가 계산
dispatch({ type: 'NAVIGATE_DOWN' });
```

---

## Related Documents

- [Overview.md](./Overview.md) - 시스템 개요
- [Architecture.md](./Architecture.md) - 상세 아키텍처
- [6-Axis-Behavior.md](./6-Axis-Behavior.md) - Axis 명세
