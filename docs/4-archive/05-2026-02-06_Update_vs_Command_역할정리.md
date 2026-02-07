# Update vs Command 역할 정리

## 1. 개요

현재 Focus Pipeline에서 `2-intent/commands/`와 `3-update/`가 모두 순수함수인데, 역할이 중복되고 있음.

## 2. 현재 상태

### 2-intent/commands/ (새로 구현)
- `NAVIGATE.ts`, `TAB.ts`, `SELECT.ts` 등
- OSCommand 형태: `(ctx, payload) → OSResult`
- 비즈니스 로직을 직접 포함

### 3-update/ (기존)
- `updateNavigate.ts`, `updateZoneSpatial.ts`, `updateRecovery.ts`
- 순수 계산 함수
- **문제: NAVIGATE 커맨드에서 updateNavigate를 호출하지만, 실제 로직은 커맨드 내부에 더 많이 있음**

## 3. 정리 방안

### 방안 A: Update 폴더 제거
- Command가 모든 로직을 포함
- `3-update/` 폴더 삭제
- 단순하지만, 재사용 가능한 유틸리티 손실

### 방안 B: 역할 명확화
- **Command** = Intent 라우팅 + 결과 조합
- **Update** = 재사용 가능한 계산 유틸리티
- Command가 Update를 조합해서 OSResult 생성

### 방안 C: Update를 Command 내부로 인라인
- Update가 한 곳에서만 사용되면 Command 내부로 이동
- 여러 곳에서 재사용되면 유지

## 4. 제안: 방안 C

현재 사용 현황:
- `updateNavigate` - NAVIGATE 커맨드에서만 사용 → 인라인 가능
- `updateZoneSpatial` - NAVIGATE 커맨드에서만 사용 → 인라인 가능
- `updateRecovery` - items slice에서 사용 → **유지 필요**

결론: `updateRecovery`만 유지하고 나머지는 커맨드 내부로 이동
