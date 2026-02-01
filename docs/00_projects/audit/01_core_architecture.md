# 감사 챕터 1: 아키텍처 무결성 (Architectural Integrity)
## 인터랙션 OS 코어 (The Interaction OS Core)

**상태**: 🔴 CRITICAL REVIEW (중대 검토 필요)
**날짜**: 2026-02-01
**범위**: `src/lib/primitives`, 포커스 시스템, 커맨드 레지스트리

### 1. 신호 대 의도(Signal-to-Intent) 및 이벤트 전파
이 시스템은 `Action` 프리미티브를 통해 "신호 대 의도(Signal-to-Intent)" 패턴을 성공적으로 구현하고 있습니다. 물리적인 클릭(`onClick`)과 논리적인 의도(`dispatch(command)`)를 분리함으로써, 아키텍처는 관심사의 분리를 명확히 강제하고 있습니다.

그러나 `Action.tsx`의 구현은 강력한 `e.stopPropagation()`을 사용하고 있습니다:

```tsx
// src/lib/primitives/Action.tsx
const handleClick = (e: ReactMouseEvent) => {
    e.stopPropagation() // ⚠️ 과도한 격리
    logger.debug('PRIMITIVE', `Action Clicked: [${command.type}]`);
    dispatch(command)
}
```

**위험 평가**:
- **장점**: 커맨드 트리거가 상위로 버블링되어 부모 FocusZone의 포커스 회수(reclamation)나 기타 일반적인 핸들러를 실수로 트리거하는 것을 방지합니다. 이는 "자주적 프리미티브(Sovereign Primitive)" 개념에 필수적입니다.
- **단점**: 표준 DOM의 기대를 깨뜨립니다. `document.body`에 부착된 타사 분석 트래커나 합성 이벤트 리스너는 캡처 단계 리스너(capture-phase listeners)를 사용하지 않는 한 이러한 상호작용을 감지하지 못할 수 있습니다.

**권고 사항**:
- 이 동작을 `docs/architecture/events.md`에 명시적으로 문서화하십시오.
- 분석 래퍼 컴포넌트를 위해 `allowPropagation` 같은 옵트아웃(opt-out) prop을 고려하십시오.

### 2. 포커스 존 및 논리적 주권 (Logical Sovereignty)
`FocusZone.tsx` 구현은 "인터랙션 OS"의 중추입니다. 이는 "이중 트랙(Dual-Track)" 현실을 생성합니다:
1.  **물리적 포커스**: 브라우저의 `document.activeElement`.
2.  **논리적 포커스**: `FocusContext` 및 `activeZone` 상태.

**`FocusZone.tsx`의 주요 발견 사항**:
- **활성화 로직**:
  ```tsx
  const isActive = activeZone ? activeZone === id : (String(currentFocusId).startsWith(id) || currentFocusId === id);
  ```
  이 로직은 다소 복잡하게 얽혀 있습니다. 명시적인 `activeZone` 매칭과 암시적인 `currentFocusId` 문자열 매칭을 혼합하고 있습니다. 이는 "경로 기반(Path-based)" ID 시스템(예: `sidebar.list.item1`)을 암시하지만, 이 계약은 타입(type)에 의해 엄격하게 강제되지 않습니다.

- **시각적 상태 결합 (Coupling)**:
  ```tsx
  className={`... ${!isActive ? 'grayscale opacity-30 ...' : 'grayscale-0 ...'}`}
  ```
  시각적인 "흑백 격리(Grayscale Isolation)"가 컴포넌트 클래스 문자열에 하드코딩되어 있습니다.
  **비평**: 이는 "레이아웃과 로직의 분리" 원칙을 위반합니다. FocusZone은 자신의 상태를 내보내기만 하고(data-attributes 등을 통해), 스타일링은 CSS (Vanilla Extract)가 처리해야 합니다. 여기서 Tailwind/CSS 클래스를 하드코딩하면 코드를 수정하지 않고는 테마를 변경하거나 효과를 비활성화할 수 없습니다.

### 3. 키바인딩 수명주기
`FocusZone`의 `useEffect` 훅은 키바인딩 수명주기를 엄격하게 관리합니다:
```tsx
useEffect(() => {
    if (isActive && registry && ...) {
        // 윈도우 리스너 바인딩
    }
}, [isActive, registry, ...]);
```
이는 견고한 구현입니다. `isActive`가 참일 때만 `window`에 리스너를 부착함으로써, "관할권(Jurisdiction)"을 엄격히 강제합니다. 특정 존(Zone)에 정의된 키는 해당 존이 포커스될 때만 작동합니다.

**판결**:
코어 아키텍처는 견고하지만, FocusZone의 기능에서 "구현 누수(Implementation Leakage)"(로직과 섞인 스타일링)가 보입니다.
