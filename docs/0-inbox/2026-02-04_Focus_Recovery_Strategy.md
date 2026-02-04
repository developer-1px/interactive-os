# Focus Recovery Strategy: 포커스 해제 시 복원 전략 제안서

> **Date**: 2026-02-04  
> **Status**: ✅ IMPLEMENTED (Phase 1)  
> **Category**: Architecture / Focus System

---

## ✅ Implementation Summary

**Phase 1 완료**: OS-Level Self-Healing이 구현되어 작동 중입니다.

### 구현된 파일:
- `src/os/core/focus/axes/recovery/recoveryTypes.ts` - Recovery 정책 타입 정의
- `src/os/core/focus/axes/recovery/recoveryHandler.ts` - Direction-aware 형제 선택 로직
- `src/os/core/focus/axes/recovery/index.ts` - Module exports
- `src/os/core/focus/store/zoneSlice.ts` - `removeItem` 시 자동 복구 통합

### 검증 결과:
1. **중간 아이템 삭제** → 다음 형제로 포커스 이동 ✅
2. **마지막 아이템 삭제** → 이전 형제로 포커스 이동 ✅  
3. **유일한 아이템 삭제** → Zone Default (DRAFT)로 이동 ✅

---

## 1. 개요 (Overview)

Focus가 해제되는 상황(Todo Item 삭제, 데이터 재로딩, 언마운트 등)에서 사용자 경험을 유지하기 위한 **Focus Recovery(복원) 전략**을 MECE하게 분석하고 구현 옵션을 제안합니다.

### 1.1. 문제 정의: "Zombie Focus" 현상

복잡한 상태 트리에서 데이터 변이(삭제, 필터 변경, 재로딩)가 발생하면, 현재 포커스가 더 이상 존재하지 않는 ID를 가리키게 되는 **"Zombie Focus"** 상태에 빠질 수 있습니다.

**발생 시나리오:**
1. **Item 삭제**: 현재 포커스된 Todo Item을 삭제
2. **데이터 재로딩**: API refresh로 인해 리스트가 갱신됨
3. **필터 변경**: 현재 포커스된 아이템이 새 필터에서 제외됨
4. **컴포넌트 언마운트**: 페이지 전환이나 모달 닫힘

### 1.2. 현재 시스템 (6-Axis Behavior Model)

현재 OS는 **Entry**(진입)와 **Restore**(복원) 두 개의 축을 통해 Zone 진입/재진입 시의 포커스 위치를 결정합니다:

| 축 | 역할 | 현재 값 |
|:---|:-----|:--------|
| **Entry** | Zone 진입 시 초기 포커스 위치 | `first`, `restore`, `selected` |
| **Restore** | Zone 탈출/복귀 시 상태 복원 여부 | `true`, `false` |

---

## 2. MECE 분석: Recovery Strategy 분류 체계

Focus Recovery 전략을 **3개의 축**으로 MECE하게 분류합니다:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Focus Recovery Strategy                       │
├─────────────────┬──────────────────┬───────────────────────────┤
│   ① Target      │   ② Trigger      │   ③ Fallback              │
│   (대상 선정)    │   (발동 조건)     │   (최종 안전망)            │
├─────────────────┼──────────────────┼───────────────────────────┤
│ • Sibling       │ • Unmount        │ • Zone Default            │
│ • Parent        │ • Data Change    │ • Global Default          │
│ • Anchor        │ • Filter Change  │ • No Focus                │
│ • History       │ • Manual         │                           │
└─────────────────┴──────────────────┴───────────────────────────┘
```

---

## 3. 상세 분석

### 3.1. Target (대상 선정 전략)

포커스가 해제될 때 **어디로 이동할지** 결정하는 전략입니다.

| 전략 | 설명 | 장점 | 단점 | 사용 예 |
|:-----|:-----|:-----|:-----|:--------|
| **Sibling (형제)** | 삭제된 아이템의 다음/이전 형제로 이동 | 컨텍스트 유지, 연속 작업 용이 | 형제가 없으면 실패 | 리스트 아이템 삭제 |
| **Parent (부모)** | 상위 Zone 또는 컨테이너로 이동 | 항상 유효한 대상 존재 | 사용자 위치 컨텍스트 손실 | 모달 닫힘, 서브 패널 종료 |
| **Anchor (앵커)** | 미리 지정된 고정 위치로 이동 | 예측 가능한 동작 | 유연성 부족 | Draft Item, 검색창 |
| **History (히스토리)** | 이전 포커스 스택에서 복원 | 다단계 이동 후에도 정확한 복귀 | 구현 복잡도 증가 | 중첩 모달, 위저드 |

#### 3.1.1. Sibling 세부 옵션

```
┌─────────────────────────────────────────────────────┐
│              Sibling Selection Policy               │
├────────────────┬────────────────────────────────────┤
│ Next-First     │ 다음 형제 → 없으면 이전 형제       │
│ Prev-First     │ 이전 형제 → 없으면 다음 형제       │
│ Spatial        │ 공간적으로 가장 가까운 형제        │
│ Index-Preserve │ 동일 index 유지 (새 리스트 기준)   │
└────────────────┴────────────────────────────────────┘
```

### 3.2. Trigger (발동 조건)

Recovery 로직이 **언제 실행되는지** 결정합니다.

| 트리거 | 설명 | 감지 방법 |
|:-------|:-----|:----------|
| **Unmount** | 포커스된 DOM 요소가 언마운트됨 | MutationObserver, React lifecycle |
| **Data Change** | 스토어의 데이터가 변경됨 | Zustand subscriber, useEffect |
| **Filter Change** | 필터 조건 변경으로 아이템이 숨겨짐 | Derived state 비교 |
| **Manual** | 명시적 API 호출로 복원 요청 | Command dispatch (`FOCUS.RECOVER`) |

### 3.3. Fallback (최종 안전망)

모든 대상 선정 전략이 실패했을 때의 **최후 수단**입니다.

| 정책 | 동작 | 사용 시나리오 |
|:-----|:-----|:--------------|
| **Zone Default** | 현재 Zone의 첫 번째 아이템 | 일반적인 리스트 |
| **Global Default** | 지정된 전역 앵커 (예: Draft) | 앱 전체 안전망 |
| **No Focus** | 포커스 해제 (document.body) | 오버레이 닫힘 후 |

---

## 4. 구현 옵션

### Option A: OS-Level Self-Healing (권장)

**개념**: OS Focus Engine이 자동으로 "Zombie Focus"를 감지하고 복구합니다.

**장점:**
- 앱 코드 불변: 앱은 데이터만 관리하고, 포커스 복구는 OS가 처리
- 일관된 동작: 모든 앱에서 동일한 복구 로직 적용
- 테스트 용이: 중앙화된 로직으로 단위 테스트 가능

**구현 방안:**
```typescript
// Zone 선언 시 복구 정책 명시
<OS.Zone
    id="todo-list"
    recovery={{
        target: "sibling",
        policy: "next-first",
        fallback: "zone-default"
    }}
>
```

**핵심 구현 포인트:**
1. `useFocusStore`에 `recovery` 정책 추가
2. MutationObserver로 포커스된 요소의 언마운트 감지
3. `executeRecovery(zoneId, policy)` 함수 구현

```typescript
// focusTypes.ts
interface RecoveryPolicy {
    target: "sibling" | "parent" | "anchor" | "history";
    siblingPolicy?: "next-first" | "prev-first" | "spatial" | "index-preserve";
    fallback: "zone-default" | "global-default" | "none";
    anchorId?: string;
}
```

---

### Option B: App-Level Explicit Recovery

**개념**: 앱이 데이터 변경 시 명시적으로 복구 API를 호출합니다.

**장점:**
- 세밀한 제어: 앱별 특수한 복구 로직 구현 가능
- 명시적 흐름: 복구 시점과 대상이 코드에서 명확히 보임

**단점:**
- 책임 분산: 각 앱이 복구 로직을 구현해야 함 (표준화 어려움)
- 누락 위험: 개발자가 복구 호출을 잊을 수 있음

**구현 방안:**
```typescript
// App-level reducer
case "DELETE_TODO": {
    const nextFocus = findRecoveryTarget(state.todos, action.id);
    OS.dispatch({ type: "FOCUS.MOVE", targetId: nextFocus });
    return { ...state, todos: state.todos.filter(t => t.id !== action.id) };
}
```

---

### Option C: Hybrid (권장 확장)

**개념**: OS가 기본 복구를 제공하되, 앱이 오버라이드할 수 있습니다.

**장점:**
- 기본 안전망 보장 + 앱별 커스터마이징 가능
- 점진적 마이그레이션 용이

**구현 방안:**
```typescript
// OS-level: 기본 복구 정책
const defaultRecovery: RecoveryPolicy = {
    target: "sibling",
    siblingPolicy: "next-first",
    fallback: "zone-default"
};

// App-level: 필요 시 오버라이드
<OS.Zone
    id="todo-list"
    recovery={{
        ...defaultRecovery,
        fallback: "anchor",
        anchorId: "draft-item"
    }}
>
```

---

## 5. 제안 로드맵

```
┌─────────────────────────────────────────────────────────────────┐
│                     Implementation Roadmap                       │
├─────────────────┬───────────────────────────────────────────────┤
│ Phase 1         │ RecoveryPolicy 타입 정의 및 Zone Props 확장   │
│ (Foundation)    │ - behaviorTypes.ts에 RecoveryPolicy 추가     │
│                 │ - Zone.tsx에 recovery prop 추가              │
├─────────────────┼───────────────────────────────────────────────┤
│ Phase 2         │ MutationObserver 기반 Unmount 감지            │
│ (Detection)     │ - FocusStore에 구독자 패턴 추가              │
│                 │ - focusedItemId 유효성 검증 로직             │
├─────────────────┼───────────────────────────────────────────────┤
│ Phase 3         │ Recovery Engine 구현                          │
│ (Core Logic)    │ - executeRecovery() 함수 구현                │
│                 │ - Sibling/Parent/Anchor/History 해석기       │
├─────────────────┼───────────────────────────────────────────────┤
│ Phase 4         │ Todo App 적용 및 검증                         │
│ (Validation)    │ - 삭제 시나리오 테스트                        │
│                 │ - 필터 변경 시나리오 테스트                   │
└─────────────────┴───────────────────────────────────────────────┘
```

---

## 6. 결론 및 제안 (Conclusion)

### 6.1. 권장 방향: **Option C (Hybrid)**

1. **OS Core가 기본 책임**을 지고, "Sibling Next-First + Zone Default" 정책을 기본 제공
2. **앱은 선언적 오버라이드**만 제공 (imperative 호출 지양)
3. **Recovery Policy를 6-Axis에 7번째 축으로 공식화** 고려

### 6.2. 핵심 결정 사항

| 질문 | 제안 답변 |
|:-----|:----------|
| Recovery 발동 시점? | OS가 MutationObserver로 자동 감지 (Option A) |
| 기본 Target 정책? | Sibling (next-first) |
| 기본 Fallback 정책? | Zone Default (entry: "first") |
| History 지원 여부? | Phase 2 이후 고려 (복잡도 높음) |

### 6.3. 다음 단계

1. **RecoveryPolicy 타입 설계** 리뷰 후 승인
2. Phase 1 구현 착수
3. Todo App에서 파일럿 적용 및 피드백 수집

---

> [!NOTE]
> 이 문서는 Focus Recovery 전략의 **설계 옵션 분석**입니다.  
> 최종 구현 방향은 팀 리뷰 후 확정됩니다.
