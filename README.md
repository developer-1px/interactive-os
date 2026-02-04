# 🌌 Interactive OS (Project Antigravity)

**Project Antigravity**는 고해상도 공간 상호작용 중심의 React 기반 OS 환경입니다. 논리적 요소 레지스트리와 물리적 DOM 레이아웃 사이의 간극을 메우며, 복잡한 웹 애플리케이션을 위한 직관적이고 키보드 우선적인 공간 상호작용을 가능하게 합니다.

---

## 🚀 핵심 철학: "Structure as Specification"

Interactive OS는 포커스 시스템, 커맨드 오케스트레이션, 공간 인식을 위한 체계적인 접근 방식을 통해 웹 인터랙션을 공식화합니다. 모든 컴포넌트는 OS 내에서 자신의 물리적 위치와 논리적 관할 구역(Jurisdiction)을 인식하도록 설계되었습니다.

### 🎯 7축 포커스 모델 (The 7-Axis Focus Model)
복잡한 2D 레이아웃에서도 예측 가능한 탐색을 보장하기 위해 7개의 원자적 축을 중심으로 포커스 동작을 공식화했습니다:
1.  **Direction (방향)**: 상하좌우 공간 이동.
2.  **Edge (경계)**: 경계 처리 및 순환(Wrapping) 정책.
3.  **Tab (탭)**: DOM 및 시각적 순서를 따르는 재귀적 선형 탐색.
4.  **Target (대상)**: ID 또는 로직을 통한 직접 포커스 타겟팅.
5.  **Entry (진입)**: 구역(Zone) 간 이동 시 스마트한 진입점 선택 (Seamless Entry).
6.  **Restore (복원)**: OS 관지 기반의 포커스 메모리 및 복구.
7.  **Recovery (자가 치유)**: *Standard 1.27* – 포커스된 항목이 삭제되거나 변경될 때 가장 적절한 형제 요소로 포커스를 자동 복구.

### 🕹️ 커맨드 이벤트 버스 및 관할권 바인딩 (Command Event Bus & Jurisdictional Binding)
상호작용 신호를 중앙에서 관리하여 "핸들러 지옥(Handler Hell)"을 제거했습니다:
-   **Command Center**: OS 레벨 신호(예: `focus.move`, `field.edit`)를 조율하는 중앙 허브.
*   **Jurisdictions (관할권)**: 커맨드를 특정 컨테이너(Zone)로 스코핑하여, 컴포넌트가 현재 컨텍스트에 유효한 커맨드에만 반응하도록 보장.
*   **Select-then-Edit**: 선택(Selection)이라는 고수준 인터랙션과 실제 입력(Input) 모드를 깔끔하게 분리하는 통일된 패턴.

---

## 🛠️ 주요 어플리케이션

### 📝 Reference Todo Implementation
다음 기능을 포함하는 벤치마크 SaaS 스타일 애플리케이션입니다:
-   **Kanban 2D Navigation**: 컬럼 간 복잡한 가로/세로 이동 처리.
-   **Normalized Data**: Record + Order 패턴을 통한 O(1) 성능 확보.
-   **Undo/Redo**: Immer 기반의 스냅샷 상태 관리.

### 🏗️ Web Builder (Visual CMS)
고해상도 레이아웃 빌더입니다:
-   **Bento Grid Layouts**: 비선형 그리드에서의 공간 감지 테스트.
-   **Seamless Section Navigation**: 복잡한 웹 섹션 간의 부드러운 수직 이동.
-   **Integrated Text Editing**: 인라인 콘텐츠 조작을 위한 제로 베이스 스캐폴딩.

---

## 💎 Teo 디자인 시스템 (Teo Design System)
Antigravity 애플리케이션의 시각적 근간이자 고밀도 전문 도구에 최적화된 시스템입니다:
-   **Compact Premium Light**: 생산성에 집중할 수 있는 매끄럽고 최소화된 미학.
-   **Command-Driven Purity**: interactive 프리미티브(예: `Field`)가 글로벌 OS 신호를 통해 제어되어 로컬 상태의 순수성을 유지.
-   **Responsive Layouts**: 복잡한 그리드와 유연한 전환을 기본적으로 지원.

---

## 🔍 관찰 가능성 및 진단 (Observability & Diagnostics)

"볼 수 없다면 디버깅할 수 없다"는 믿음을 바탕으로 합니다:
-   **Zero-Base Command Inspector**: 실시간 이벤트 트레이싱, 상태 검사 및 인터랙션 원격 측정을 위한 내장 개발자 도구.
-   **Spatial Laboratory**: `/focus-showcase` 페이지를 통해 7축 탐색 정책을 벤치마킹하는 활성 실험실 운영.

---

## 💻 기술 스택

-   **Runtime**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand) + [Immer](https://immerjs.github.io/immer/)
-   **Styling**: Vanilla CSS + Tailwind CSS (Utility-first의 유연성)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Linter/Formatter**: [Biome](https://biomejs.dev/)

---

## 🏁 시작하기

```bash
# 저장소 클론
git clone https://github.com/developer-1px/interactive-os.git

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

---

## 📂 문서화 (PARA 방법론)
프로젝트 문서는 고해상도 조직화를 위해 PARA 방법론을 따릅니다:
-   `docs/0-inbox`: 새로운 제안 및 작업 초안.
-   `docs/1-project`: 활성 구현 세부 정보.
-   `docs/2-area`: 핵심 아키텍처 표준 (7-Axis, Teo Design).
-   `docs/3-resource`: 연구 및 벤치마크 자료.

---

**Built with ❤️ by Project Antigravity Team.**
