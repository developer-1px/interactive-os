# Zustand 아키텍처 분석 보고서

## 1. 개요
현재 프로젝트(`interactive-os`)에서 사용 중인 Zustand 기반의 상태 관리 아키텍처를 분석했습니다. 대규모 OS와 같은 환경을 구축하기 위해 **전역 상태(Global)**와 **지역 상태(Local/Scoped)**를 명확히 구분하는 패턴을 채택하고 있습니다.

## 2. 주요 패턴

### A. Global Singleton Pattern (전역 싱글톤)
OS 전반에 걸쳐 공유되어야 하는 상태를 관리합니다.

- **예시**: `CommandEngineStore`, `InspectorStore`
- **구조**:
  - `useStore` 훅을 export하여 React 컴포넌트 내에서 사용.
  - **특징**: React 컴포넌트 외부(순수 함수, 이벤트 핸들러 등)에서도 상태를 읽고 쓸 수 있도록 **Static API Object**를 함께 export합니다.
    ```typescript
    // Static API 예시 (InspectorStore.ts)
    export const InspectorStore = {
      toggle: () => useInspectorStore.getState().toggle(),
      isOpen: () => useInspectorStore.getState().isOpen,
      // ...
    };
    ```
  - **활용**: `FocusSensor`나 `OSCommand` 같은 로직이 훅을 사용할 수 없는 곳에서 이 Static API를 통해 상태를 제어합니다.

### B. Instance Store Pattern (인스턴스 스토어)
특정 컴포넌트나 기능 단위로 격리된 상태를 관리합니다.

- **예시**: `FocusGroupStore`
- **구조**:
  - `createStore`를 바로 호출하지 않고, **Factory Function**을 export합니다.
    ```typescript
    export function createFocusGroupStore(groupId: string) {
      return create<FocusGroupState>()(...);
    }
    ```
  - **캐싱 및 생명주기 관리**: `useFocusGroupStoreInstance` 훅을 통해 `groupId`를 키로 스토어를 생성하고, 캐싱하며, 컴포넌트 언마운트 시 정리(Cleanup)합니다.
- **장점**: 다수의 `FocusGroup`이 존재해도 각각 독립적인 상태를 가지며, 서로 간섭하지 않습니다.

### C. Middleware Usage
- **Persist**: `InspectorStore` 등 브라우저 새로고침 후에도 유지되어야 하는 상태(UI 설정 등)에 `persist` 미들웨어를 사용하여 `localStorage`와 동기화합니다.

## 3. 요약 (The "OS" Architecture)

이 프로젝트의 Zustand 아키텍처는 일반적인 웹 앱보다 **OS 시스템**에 가깝습니다.

1. **Static API Bridge**: React와 Non-React(DOM Event, OS Core) 세계를 연결하기 위해 모든 전역 스토어는 Static Accessor를 제공합니다.
2. **Registry System**: `CommandEngineStore`는 앱들의 상태를 직접 관리하지 않고, 각 앱의 `dispatch`, `getState` 함수를 등록받아 라우팅하는 **레지스트리 역할**을 합니다.
3. **Isolation**: `FocusGroup` 등 복잡한 UI 컴포넌트는 전역 스토어를 오염시키지 않도록 철저히 격리된 인스턴스 스토어를 사용합니다.
