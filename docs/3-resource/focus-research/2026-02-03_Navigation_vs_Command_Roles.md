# 2026-02-03 Unified Command Architecture: Navigation vs Command Roles

## 1. 개요 (Overview)
사용자로부터 "내부 내비게이션(Arrow Keys)과 커맨드 시스템이 서로 엮여 있지 않다"는 피드백이 접수되었습니다. 현재 시스템에서는 리스트 내부에서의 이동이 인스펙터에 기록되지 않으며(Flash 미발생), 이는 내비게이션(Navigation)과 커맨드(Command)의 역할 분리에 기인한 구조적 차이에서 비롯됩니다.

## 2. 분석 (Analysis)

### 2.1 현재 구조의 파편화
`InputEngine.tsx` 분석 결과, 입력 처리가 두 갈래로 나뉩니다:
1.  **Software Layer (Command)**: `registry`에 등록된 커맨드와 매칭될 경우 `dispatch`를 통해 처리됩니다. (예: `NAVIGATE_UP` - 구역 간 이동 시에만 발생)
2.  **Hardware Layer (Physics)**: 매칭되는 커맨드가 없을 경우 "Physics" 로직이 작동하며, 이때 내부 아이템 이동은 `useFocusStore.setFocus()`를 **직접 호출**하여 처리합니다.

```tsx
// InputEngine.tsx (현 구조)
if (nextId) {
    setFocus(nextId); // 직접 호출 -> Command History에 남지 않음 (Flash 안됨)
} else {
    dispatch({ type: `NAVIGATE_${dir}`, ... }); // Dispatch 호출 -> Command History에 남음 (Flash 됨)
}
```

### 2.2 역할과 책임 (Roles & Responsibilities)
- **Navigation (Physics - OS Layer)**:
    - **역할**: 하드웨어 시그널을 위치 좌표나 아이템 ID로 변환하는 '물리적' 이동.
    - **책임**: 공간적(Spatial) 또는 논리적(Roving) 순서에 따른 포커스 무결성 유지.
    - **기존 철학**: 고빈도 발생 데이터이므로 엔진 오버헤드를 줄이기 위해 별도의 Store(FocusStore)에서 관리함.

- **Command (Intent - App Layer)**:
    - **역할**: 사용자의 '의도'가 담긴 유의미한 상태 변화.
    - **책임**: 도메인 로직 실행, 히스토리 관리(Undo/Redo), 데이터 동기화.
    - **기존 철학**: 모든 행위의 기록과 추적을 위해 `dispatch`를 거침.

### 2.3 문제의 핵심
"Interaction OS"는 도메인과 물리를 구분하지 않고 **모든 상호작용을 투명하게 관찰 가능(Observable)**하게 만들어야 합니다. 현재 내비게이션이 Physics로만 처리되는 것은 시스템의 '동작'을 커맨드 브라우저에서 절반만 보여주는 결과를 낳습니다.

## 3. 제안 (Proposal): Everything is a Command

### 3.1 Unified Command Sink
내비게이션 결과를 `setFocus`로 직접 반영하는 대신, 모든 물리적 결과물을 `FOCUS_MOVE`와 같은 OS 공통 커맨드로 `dispatch` 하도록 통합합니다.

- **장점**: 
    - 인스펙터에서 모든 키보드 이동이 시각화됨 (Flash 발생).
    - 내비게이션 경로가 커맨드 히스토리에 포함되어 완벽한 Telemetry 확보.
    - 미들웨어를 통해 특정 구역 이동 시 추가 로직(효과음, 권한 체크 등) 개입 가능.

### 3.2 물리(Physics)와 의도(Intent)의 레이어링
커맨드 엔진 내에서 `isPhysics: true`와 같은 메타데이터를 활용하여, 히스토리(Undo)에는 포함시키지 않되 인스펙터(Telemetry)에는 노출시키는 필터링 전략을 채택할 수 있습니다.

## 4. 결론 (Conclusion)
내비게이션은 단순히 '포커스를 옮기는 것'이 아니라, OS 입장에서는 '사용자가 인풋을 주어 커서를 이동시킨 커맨드'입니다. 따라서 **Navigation 또한 Command Engine의 관할 아래 있어야 하며**, 이를 통해 하드웨어와 소프트웨어가 단일한 Interaction Stream으로 통합되어야 합니다.
