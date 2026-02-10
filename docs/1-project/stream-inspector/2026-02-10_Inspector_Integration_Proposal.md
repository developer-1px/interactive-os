# 2026-02-10_Inspector_Integration_Proposal

## 1. 개요 (Overview)

기존 OS Inspector (6-Domino Pipeline 기반)와 새로운 Kernel Inspector (Transaction/State 기반)를 통합하여 **100% 관찰 가능한(Observable) 레이어**를 구축하기 위한 제안입니다.

현재 두 시스템은 서로 다른 추상화 레벨을 다루고 있습니다:
- **OS Inspector**: 사용자의 의도(Intent)와 비즈니스 로직 흐름 (Event → Command → Effect)
- **Kernel Inspector**: 시스템의 상태 변화와 실행 메커니즘 (Transaction → Atom → Snapshot)

이 둘을 유기적으로 연결하여, "어떤 커맨드가 어떤 트랜잭션을 일으켰고, 그 결과 상태가 어떻게 변했는지"를 한눈에 파악할 수 있도록 합니다.

## 2. 현황 분석 (Current Architecture)

### A. OS Inspector (High-Level)
현재 `CommandInspector.tsx`는 **6-Domino Pipeline**의 각 단계를 시각화하는 탭들로 구성되어 있습니다:
1. **Event**: `KeyMonitor`, `EventStream`
2. **Dispatch**: (암시적 포함)
3. **Command**: `RegistryMonitor`
4. **State**: `StateMonitor`
5. **Effect**: (일부 `EventStream`에 포함)
6. **Render**: (UI 실행 결과)

### B. Kernel Inspector (Low-Level)
`KernelPanel.tsx`는 커널 내부의 동작을 보여줍니다:
1. **Transactions**: 상태 변경의 원자적 단위 (Atomic Unit)
2. **State Atoms**: Raw State JSON
3. **Effects Queue**: 실행된 이펙트 목록

### C. 통합 포인트 (`InspectorRegistry`)
현재 `InspectorRegistry`를 통해 동적으로 패널을 추가할 수 있는 구조가 이미 마련되어 있습니다. `SpikeDemo.tsx`에서 `KernelPanel`을 "SPIKE"라는 이름으로 등록하여 사용하는 것이 좋은 예시입니다.

## 3. 통합 제안 (Proposal)

**"Two Views, One Truth"** 전략을 제안합니다.

### A. 통합 뷰 구조 (Unified View Structure)
`CommandInspector`를 메인 셸(Shell)로 유지하되, 내부를 **Logical Layer (OS)**와 **Physical Layer (Kernel)**로 명확히 구분합니다.

```mermaid
graph TD
    Shell[Inspector Shell] --> Header[Global Toolbar]
    Shell --> Body[Split View / Tabs]
    Body --> OS[OS Layer (Blue)]
    Body --> Kernel[Kernel Layer (Red)]
    
    OS --> Domino1[Event Stream]
    OS --> Domino2[Command Registry]
    
    Kernel --> TxLog[Transaction Log]
    Kernel --> StateTree[Raw State]
```

### B. 제안 1: 듀얼 모드 (Dual Mode Switch)
사용자가 보고자 하는 관점에 따라 모드를 전환합니다.
- **Workflow Mode (OS)**: "내가 키를 눌렀을 때 무슨 로직이 실행되었나?" (디버깅, 로직 검증)
- **Internals Mode (Kernel)**: "상태가 정확히 어떻게 변했나? 리렌더링이 왜 발생했나?" (최적화, 코어 검증)

### C. 제안 2: 상관관계 연결 (Correlation ID)
가장 중요한 것은 **연결성**입니다.
1. OS 레벨의 `Command`가 실행될 때, 생성되는 Kernel `Transaction`의 ID를 매핑합니다.
2. OS 패널에서 특정 커맨드(`NAVIGATE`)를 클릭하면, Kernel 패널의 해당 트랜잭션(`tx #123`)이 하이라이트됩니다.
3. 반대로 Kernel 트랜잭션을 클릭하면, 이를 유발한 상위 레벨의 OS 이벤트가 표시됩니다.

### D. 제안 3: Pipeline 시각화 (6-Domino Flow)
OS 패널을 단순한 탭 나열이 아닌, **데이터 흐름(Pipeline)** 형태로 재구성합니다.
- `[Input] -> [Dispatch] -> [Command] -> [State] -> [Effect] -> [Render]`
- 각 단계가 성공했는지, 실패했는지 시각적으로 보여줍니다.

## 4. 실행 계획 (Action Plan)

1. **Inspector Shell 일반화**:
   - `CommandInspector`의 하드코딩된 탭(REGISTRY, STATE 등)을 제거하고, 모든 패널을 `InspectorRegistry`를 통해 주입받도록 변경합니다.
   - 플러그인 아키텍처로 전환하여 유연성 확보.

2. **OS 패널 구현 (Bundle)**:
   - 기존 컴포넌트들(`KeyMonitor`, `RegistryMonitor` 등)을 묶어 하나의 `OSFlowPanel`로 만듭니다.
   - 이 패널은 6-Domino 흐름을 보여주는 데 집중합니다.

3. **Kernel 패널 고도화**:
   - `KernelPanel`을 다듬어 `Transaction` 리스트와 `Details` 뷰를 강화합니다.
   - OS Inspector와 통신할 수 있는 선택(Selection) 상태 공유 메커니즘 추가.

4. **Integration**:
   - App 초기화 시 두 패널을 모두 레지스트리에 등록합니다.
   - 필요 시 `Split View` 컴포넌트를 도입하여 동시에 볼 수 있게 합니다.

## 5. 결론

기존의 6-Domino 기반 OS Inspector는 "비즈니스 로직"을, Kernel Inspector는 "실행 엔진"을 대변합니다. 이 둘을 **상호 보완적인 관계**로 정의하고, `InspectorRegistry`를 통해 유연하게 결합한다면 100% 관찰 가능한 시스템을 구축할 수 있습니다.
