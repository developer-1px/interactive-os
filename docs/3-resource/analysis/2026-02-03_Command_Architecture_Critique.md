# 커맨드 아키텍처 비판 및 개선 제안: 정적 수집(Aggregation) vs 동적 독립(Independence)

## 1. 개요 (Overview)
현재 `src/apps/todo/features/commands/index.ts`를 통해 애플리케이션의 모든 커맨드를 수집하여 `CommandRegistry`에 등록하는 구조에 대한 사용자의 비판적 의견을 분석하였습니다. 주요 쟁점은 **보일러플레이트 발생**, **Dead Code 추적의 어려움**, 그리고 **구조적 모순(Zone vs Flat)**입니다.

## 2. 현행 "중앙 집중형" 구조의 배경 (Analysis)
왜 현재와 같은 구조가 되었는지에 대한 기술적 합리화는 다음과 같습니다:

1.  **OS 인덱싱 (Indexing)**: OS Core는 앱이 실행되지 않은 상태에서도 해당 앱의 단축키(`keymap`)와 능력(`label`, `icon`)을 알아야 전역 런처 등에 노출할 수 있습니다.
2.  **직렬화 및 히스토리 (Serialization)**: Undo/Redo 실행 시 ID(`type`)만으로 로직을 찾는 "ID-to-Logic Resolution" 방식이 필요했습니다.
3.  **타입 인트로서펙션 (Type Introspection)**: TypeScript에서 모든 커맨드를 한곳에 모아 유니온 타입을 추출함으로써 개발 편의성을 확보하려 했습니다.

## 3. 핵심 비판 포인트: Dead Code 추적 불가
- **문제**: `import *`와 `Object.values()`를 사용하면, 실제 UI에서 단 한 번도 호출되지 않는 커맨드도 "사용 중"인 것으로 간주되어 린터나 빌드 도구가 이를 제거하지 못합니다.
- **결과**: 기능을 삭제할 때 UI만 지우고 커맨드 로직은 방치하게 되어 기술 부채가 빠르게 쌓입니다.

## 4. 구조적 모순: Zone 계층 vs Flat Merge
가장 뼈아픈 지적입니다. 앱의 설계 원칙은 **Zone(영역)** 중심인데, 데이터 관리는 **Flat(전역)** 중심인 불일치가 발생하고 있습니다.

- **모순점**: 현재 `Zone` 컴포넌트는 jurisdictional boundary(관할 경계)를 형성하고 단축키도 영역별로 정의(Keymap config)되어 있습니다. 하지만 실제 실행 로직(`run`)은 이 경계를 무시하고 `ALL_COMMANDS` 하나로 뭉쳐져 전역 레지스트리에 주입됩니다.
- **결과**:
    - `sidebar` 전용 로직이 `main` 영역 실행 시에도 메모리에 상주하며 간섭 가능성을 가집니다.
    - 영역별로 커맨드를 독립적으로 로드(Code Splitting)하거나 동적으로 확장하는 것이 거의 불가능한 구조입니다.

## 5. 향후 설계 방향: "Contextual Command Injection"
커맨드도 Zone과 마찬가지로 계층적으로 관리되어야 합니다.

1.  **Scoped Registry**: 각 `Zone`이 자신이 처리할 수 있는 커맨드 집합을 직접 소유합니다.
2.  **Bubbling Resolution**: 커맨드 실행 요청이 들어오면 현재 포커스된 Zone부터 상위 Zone으로 올라가며 해당 명령을 처리할 수 있는 핸들러를 찾습니다. (DOM 이벤트 버블링 모델)
3.  **Zero-Config Discovery**: 중앙 장부(`index.ts`)를 없애고, Vite Glob나 Decorator 등을 활용해 각 기능 폴더에 커맨드를 방치해도 시스템이 알아서 찾아가는 방식을 지향합니다.

## 6. 결론 (Conclusion)
현재의 `index.ts`는 시스템의 모든 능력을 투명하게 관리하려 했던 **"중앙집중식 설계의 과욕"**이었습니다. 지적하신 대로 **Zone 중심의 계층적 커맨드 관리**로 전환하여, 코드의 지역성(Locality)을 확보하고 Dead Code 문제를 해결하는 것이 `Interaction OS`의 다음 단계가 되어야 합니다.

## 8. 혁신적 대안: "Mount-Based Discovery" (Registry-less)
사용자의 제안은 **"중앙 등록 절차를 2. 완전히 없애고, 컴포넌트가 화면에 나타날 때(Mount) 스스로를 신고하는 방식"**입니다. 이는 React의 생명주기와 완벽하게 일치하는 가장 현대적인 접근입니다.

### 8.1. 작동 원리
1.  **NO Registry**: 나  단계가 아예 없습니다.
2.  **Hook-Based Registration**: 각 컴포넌트(Zone, Widget)가 와 같은 훅을 사용합니다.
3.  **Dynamic Inspector**: Inspector는 정적 장부를 읽는 게 아니라, 현재 OS Core에 **"신고된(Mounted)"** 커맨드 목록을 실시간으로 구독하여 보여줍니다.

### 8.2. 장점
- **Zero Boilerplate**: 파일 만들고  훅만 쓰면 끝입니다. 어디에 등록할 필요가 없습니다.
- **Perfect Locality**: 컴포넌트가 사라지면 커맨드도 사라집니다. Zone이 숨겨지면 커맨드도 비활성화됩니다. 논리적 정합성이 완벽합니다.
- **Lazy Loading**: 해당 컴포넌트를 렌더링하기 전까진 커맨드 로직을 불러올 필요가 없습니다.

### 8.3. 고려사항 (Trade-off)
- **Global Search**: 앱이 꺼져있을 때(Unmounted)는 검색 런처에서 해당 기능을 찾을 수 없습니다. (단, 이는 "앱을 켜야 기능을 쓴다"는 직관과 일치할 수 있습니다.)
- **Performance**: 잦은 Mount/Unmount 시 OS Core의 커맨드 목록을 너무 자주 갱신하지 않도록 디바운싱이나 최적화가 필요합니다.

### 9. 결론 업데이트
사용자의 제안인 **"Mount-Based Discovery"**가 가장 이상적인 **Interaction OS v2.0**의 모델입니다. 중앙 집중식 통제(Registry)를 버리고, **"존재하는 것이 곧 기능(Presence is Capability)"**이라는 철학으로 아키텍처를 진화시켜야 합니다.
