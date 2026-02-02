# 인터랙션 OS: 아키텍처 철학

## 0. 제 1원칙: AI 친화적 엔지니어링 (The First Principle)
우리는 **AI가 스스로 복구할 수 있는(Self-Healing)** 코드를 작성합니다. AI가 시행착오를 겪으며 비용을 낭비하지 않도록, 모든 의도는 **엄격한 타입(Type-Strictness)**으로 드러나야 합니다.
- **비용 절감**: AI가 문자열 기반의 죽은 코드(Deadcode)나 유효 범위를 파헤치기 위해 탐색 비용을 쓰는 것은 낭비입니다.
- **엄격함이 곧 성능**: 타입 시스템이 유효한 값의 범위를 보장해야 합니다. 느슨한 `string` 타입 대신 엄격한 Union Type이나 Enum을 사용하십시오.

## 1. 핵심 원칙 (Core Principles)

Antigravity 시스템은 웹 애플리케이션을 뷰의 집합이 아닌, 사용자 상호작용을 위한 자주적인 운영체제로 취급하는 **인터랙션 OS (Interaction OS)** 철학을 기반으로 구축되었습니다.

### 커맨드 중심성 ("동사" 우선)
전통적인 앱에서는 로직이 `onClick` 핸들러에 파묻혀 있습니다. 인터랙션 OS에서 의미 있는 모든 행동은 **커맨드 객체 (Command Object)**입니다.
- **직렬화 가능 (Serializable)**: 커맨드는 로그를 남기거나, 재생하거나, 네트워크로 전송할 수 있는 일반 객체입니다.
- **비결합성 (Decoupled)**: 뷰(View)는 작업이 *어떻게* 삭제되는지 알지 못하며, 단지 `dispatch({ type: 'DELETE_TODO' })`를 수행하는 방법만 압니다.

### 순수 뷰 ("수동적" UI)
뷰(React 컴포넌트)는 철저하게 상태의 반영이자 커맨드를 위한 다리 역할만 합니다.
- **로컬 로직 없음**: 컴포넌트 내부에는 비즈니스 로직을 위한 복잡한 `useEffect`나 `useCallback`이 없습니다.
- **프리미티브 바인딩**: 컴포넌트는 엔진과 상호작용하기 위해 프리미티브(`Action`, `Field`, `Option`)를 사용합니다.

### 문맥 기반 주권 (Context-Driven Sovereignty)
키바인딩과 UI 상태는 전역 **문맥(Context)**에 의해 지배됩니다.
- **명명된 조건 (Named Conditions)**: 전환(예: 편집 모드 진입)은 등록된 `ConditionDefinitions`에 의해 관리됩니다.
- **가시성 (Visibility)**: 커맨드의 `when` 절이 충족되지 않으면, 시스템은 해당 커맨드가 트리거될 수 없음을 보장하며 UI는 이를 자동으로 반영합니다.

## 2. 5-계층 모델 (The 5-Layer Model)

1.  **전송/신호 (Transport/Signal)**: 물리적인 키 입력 및 클릭.
2.  **해석 (Resolution)**: 키바인딩과 문맥을 통해 신호를 커맨드로 매핑.
3.  **커맨드 레지스트리 (Command Registry)**: 시스템에서 사용 가능한 모든 "동사"의 라이브러리.
4.  **상태 엔진 (State Engine)**: 커맨드를 처리하고 새로운 불변 상태(Immutable State)를 생성하는 중앙 로직.
5.  **투영(뷰) (Projection (View))**: 상태를 렌더링하고 상호작용 프리미티브를 제공하는 React 계층.
