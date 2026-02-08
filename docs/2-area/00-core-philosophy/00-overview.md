# 개요: Interaction OS 철학

## 1. 핵심 문제: 핸들러 지옥(Handler Hell)
현대 웹 개발은 **"핸들러 지옥"**을 겪고 있습니다. 비즈니스 로직이 수천 개의 `onClick`, `onChange`, `useEffect` 훅에 흩어져 View 레이어와 밀접하게 결합되어 있습니다. 이는 애플리케이션의 테스트, 디버깅, 리팩토링을 어렵게 만듭니다.

## 2. 솔루션: Interaction OS
웹 애플리케이션을 페이지의 모음이 아니라, 사용자 인터랙션을 위한 독립적인 **운영체제(Operating System)**로 취급합니다.

### 핵심 원칙

#### A. 커맨드 중심성 ("동사 우선")
모든 사용자 의도는 **커맨드 객체**입니다 (예: `{ type: 'ADD_TODO', payload: { text: '우유 사기' } }`).
- **직렬화 가능**: 커맨드는 로깅, 재생, 네트워크 전송이 가능.
- **디커플링**: View는 로직 *실행 방법*을 모르고, 의도를 *디스패치*하는 방법만 앎.

#### B. 순수 뷰 ("수동적 UI")
React 컴포넌트는 상태의 엄격한 수동 투영(Passive Projection)입니다.
- **로컬 로직 없음**: 컴포넌트에 비즈니스 로직을 위한 복잡한 `useEffect`나 `useCallback` 사용하지 않음.
- **프리미티브 바인딩**: 컴포넌트는 프리미티브(`Zone`, `Item`, `Field`, `Trigger`)를 통해 엔진과 상호작용.

#### C. 관할권 기반 포커스 (컨텍스트 주도)
화면은 **Zone**으로 분할됩니다. 키바인딩과 인터랙션은 컨텍스트를 인식합니다.
- **Zone**: 공간 영역(예: 사이드바, 메인 콘텐츠)을 정의하고 키바인딩 규칙을 시행.
- **컨텍스트**: 명명된 조건(예: `isEditing`, `hasTodos`)이 커맨드 트리거 가능 여부를 결정.

## 3. 5-레이어 모델

> **구현 위치**: `src/os/features/` 하위 각 feature 모듈

1. **전송/신호(Transport/Signal)**: 물리적 키 입력과 클릭. → `src/os/features/keyboard/`, `src/os/features/focus/pipeline/1-sense/`
2. **해결(Resolution)**: 키바인딩과 컨텍스트를 통해 신호를 커맨드에 매핑. → `src/os/features/focus/pipeline/2-intent/`, `3-resolve/`
3. **커맨드 레지스트리**: 사용 가능한 모든 시스템 "동사"의 라이브러리. → `src/os/features/command/`
4. **상태 엔진**: 커맨드를 처리하여 불변 상태를 생성하는 중앙 로직. → `src/os/features/focus/pipeline/4-commit/`
5. **프로젝션(View)**: 상태를 렌더링하고 인터랙션 프리미티브를 제공하는 React 레이어. → `src/os/features/focus/pipeline/5-sync/`

## 4. AI 네이티브 엔지니어링
이 아키텍처는 AI 협업에 최적화되어 있습니다.
- **지역성(Locality)**: 관련 로직(`run`, `when`)이 동일 위치에 배치되어 AI 컨텍스트 윈도우를 존중.
- **엄격한 타입**: 엄격한 타입이 AI 할루시네이션을 방지하고 자기 치유 코드를 가능하게 함.
- **컴포넌트 디커플링**: `Sidebar`와 `TodoPanel` 같은 컴포넌트가 물리적으로 분리되지만 중앙 엔진에 의해 논리적으로 통합되어, 리팩토링 시 할루시네이션 위험을 최소화.
