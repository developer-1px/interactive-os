# Focus System의 명령형 패턴 vs State-Action 패턴 불일치

## 1. 개요 (Overview)

Focus System(`FocusIntent.tsx`)의 상태 변경 방식이 앱의 Command System과 불일치합니다.

| 영역 | 패턴 | 예시 |
|------|------|------|
| **App Commands** | 순수함수 State-Action | `(state, payload) => newState` |
| **Focus System** | 명령형 Commit | `commitAll(store, { targetId })` |

## 2. 분석 (Analysis)

### 현재 Focus System의 명령형 패턴

```tsx
// FocusIntent.tsx - 직접 store mutation
commitAll(store, {
    selection: [result.targetId],
    anchor: result.targetId,
});
```

### App Command의 순수함수 패턴

```tsx
// Todo App Command - 순수함수
run: (state, payload) => 
    produce(state, (draft) => {
        draft.ui.selectedCategoryId = payload.id;
    }),
```

### 근본 원인

1. **Store 구조 차이**:
   - App: 단일 글로벌 스토어 (Zustand with Immer)
   - Focus: Zone별 격리된 스토어 (`createFocusGroupStore`)

2. **명령 라우팅 차이**:
   - App: Command Registry → Handler → Pure Reducer
   - Focus: OS Command → FocusIntent → 직접 Commit

3. **역사적 진화**:
   - Focus System이 먼저 만들어질 때 명령형으로 시작
   - App Command는 나중에 순수함수 패턴으로 설계됨

## 3. 제안 (Proposal)

### Option A: Focus System을 순수함수로 리팩토링

```tsx
// Before (명령형)
function handleNavigate(payload) {
    commitAll(store, { targetId: result.targetId });
}

// After (순수함수)
function handleNavigate(state, payload): FocusState {
    return { ...state, focusedItemId: result.targetId };
}
```

장점:
- App과 일관성
- 테스트 용이
- Undo/Redo 통합 가능

단점:
- Zone별 격리 스토어 구조 변경 필요
- 대규모 리팩토링

### Option B: OS Command Layer에 Action 패턴 도입

```tsx
// OS Command도 Reducer 패턴 사용
const focusReducer = (state, action) => {
    switch (action.type) {
        case 'OS_NAVIGATE':
            return updateNavigate(state, action.payload);
        case 'OS_SELECT':
            return updateSelect(state, action.payload);
    }
};
```

### Option C: 현재 구조 유지 + 문서화

- Focus System을 "Low-level Infrastructure"로 정의
- App Command를 "High-level Application Logic"으로 정의
- 둘의 패턴 차이를 의도적 결정으로 문서화

### Option D: 순수함수 + Commit 분리 (권장)

**핵심 아이디어**: 로직은 순수함수로, 실행은 commit으로 분리

```tsx
// Before (명령형 - 로직과 커밋이 섞임)
function handleNavigate(payload) {
    const result = updateNavigate(state, ...);
    commitAll(store, { targetId: result.targetId });  // 여기서 바로 commit
}

// After (순수함수 스타일)
function handleNavigate(payload): FocusStateChange {
    const result = updateNavigate(state, ...);
    
    // 순수하게 "변경할 내용"만 반환
    return {
        targetId: result.targetId,
        stickyX: result.stickyX,
        stickyY: result.stickyY,
    };
}

// Commit은 별도 레이어에서
const stateChange = handleNavigate(payload);
commitAll(store, stateChange);  // 또는 배치로 모아서 한번에
```

**장점**:
- ✅ 로직은 순수함수 (테스트 용이)
- ✅ 기존 Zone별 격리 스토어 구조 유지
- ✅ 점진적 마이그레이션 가능
- ✅ Commit 타이밍 제어 가능 (배치 처리, 트랜잭션 등)

**구현 방향**:
1. 각 handler가 `FocusStateChange` 객체를 반환하도록 변경
2. `commitAll`은 그대로 유지하되, handler 외부에서 호출
3. 필요시 여러 state changes를 모아서 한번에 commit

## 4. 권장사항

**Option D 채택**: 순수함수 스타일을 먼저 적용.
- 현재 handler들을 state change 객체를 반환하는 형태로 점진적 리팩토링
- commit은 orchestration 레이어에서 일괄 처리

---

*Created: 2026-02-06*
*Topic: Architecture Inconsistency - Focus System Pattern*
