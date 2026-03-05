# Lazy Resolution PRD

> Focus/Selection의 모든 상태 변경 시나리오를 전수 열거

## 원칙

1. Focus/Selection의 원본 ID는 사용자 의도(Navigate, Click)에 의해서만 변경된다
2. 시스템 변경(삭제, undo, redo, reorder)은 원본 ID를 변경하지 않는다
3. 읽을 때 resolve: 있으면 그대로, 없으면 인접(next > prev)

## 시나리오 전수 열거

### 1. 삭제 (Delete / Cut)

| 상황 | 저장된 ID | 아이템 리스트 | 해석 결과 |
|------|----------|-------------|----------|
| 단일 삭제 — focus 대상 | B | [A, C] | C (next) |
| 단일 삭제 — focus 아님 | A | [A, C] | A (존재) |
| 다중 삭제 — focus 포함 | C | [A, D] | D (next) |
| 전체 삭제 | B | [] | null |
| 마지막 아이템 삭제 | C | [A, B] | B (prev, next 없음) |

### 2. Undo

| 상황 | 저장된 ID | undo 후 리스트 | 해석 결과 |
|------|----------|--------------|----------|
| 삭제 undo — 원본 부활 | B | [A, B, C] | B ✅ 자동 복귀 |
| 삭제 undo — selection 복귀 | [B, C] | [A, B, C, D] | [B, C] ✅ 전체 복귀 |
| 추가 undo — 추가된 것 제거 | X (새로 추가됨) | [A, B, C] | A (next, X 없음) |

### 3. Redo

| 상황 | 저장된 ID | redo 후 리스트 | 해석 결과 |
|------|----------|--------------|----------|
| 삭제 redo — 다시 사라짐 | B | [A, C] | C (next) |
| 추가 redo — 다시 나타남 | X | [A, X, B, C] | X ✅ |

### 4. Reorder (Move Up/Down)

| 상황 | 저장된 ID | reorder 후 리스트 | 해석 결과 |
|------|----------|----------------|----------|
| 포커스된 아이템 이동 | B | [A, C, B] | B (존재, 위치만 변경) ✅ |
| 다른 아이템 이동 | A | [C, A, B] | A ✅ |

### 5. Selection

| 상황 | 저장된 selection | 아이템 리스트 | 해석 결과 |
|------|-----------------|-------------|----------|
| 일부 삭제 | [A, B, C] | [A, C, D] | [A, C] (B 필터) |
| 전체 삭제 | [A, B, C] | [D, E] | [] (빈 배열) |
| Undo 복귀 | [A, B, C] | [A, B, C, D] | [A, B, C] ✅ |

### 6. Paste

| 상황 | 동작 |
|------|------|
| Paste 후 focus | 새 아이템 ID로 OS_FOCUS (사용자 의도) — 이건 write 허용 |

## Edge Cases

- **빈 리스트**: `resolveId` → null
- **storedId가 null**: → `items[0]` (첫 아이템) 또는 null (빈 리스트)
- **Disabled items**: resolve 시 disabled 아이템도 포함? → Yes (focus 가능, navigable 여부와 별개)

## 제거 대상 체크리스트

- [ ] `ZoneState.recoveryTargetId` — 상태 필드
- [ ] `OS_RECOVER` — 커맨드 (`focus/recover.ts`)
- [ ] `OS_NAVIGATE` 내 `recoveryTargetId` 계산 로직
- [ ] Collection 삭제 후 `OS_FOCUS` 호출
- [ ] Collection 삭제 후 `OS_SELECTION_CLEAR` 호출
