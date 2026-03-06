
# Docs Dashboard Design Improvement (Design Proposal)

| 항목 | 내용 |
| :--- | :--- |
| **원문** | docs dashboard 디자인 개선안 올려봐 @[/inbox] |
| **내(AI)가 추정한 의도** | 기존 Docs Dashboard의 디자인을 심미적(Rich Aesthetics)이고 기능적(Workflow-centric)으로 개선하기 위한 구체적인 제안서를 요청함. |
| **상태** | Draft |

## 1. 개요 (Overview)
현재 `DocsDashboard.tsx`는 기본적인 Bento Grid 형태를 취하고 있으며, 실험적인 `playground.design-dashboard-v3.tsx`에서 좀 더 진보된 "Almanac" 스타일의 3단 레이아웃을 시도한 흔적이 있습니다. 본 제안서는 이 두 가지의 장점을 통합하고, 시스템 프롬프트의 "Rich Aesthetics" 원칙을 적용하여 **"OS Almanac"**이라는 컨셉의 프리미엄 대시보드 디자인을 제안합니다.

## 2. 분석 (Analysis) & 상세 내용 (Details)

### 현황 분석
*   **DocsDashboard.tsx**:
    *   **장점**: 심플하고 직관적인 Bento Layout.
    *   **단점**: 다소 평범한 디자인(Standard Slate/Indigo palette), 정보 밀도가 낮음, 워크플로우와의 연계성 부족.
*   **playground.design-dashboard-v3.tsx**:
    *   **장점**: 3-Column Layout (Workflow / Focus / Reference)이 정보 구조적으로 매우 우수함. `ProjectPulse` 등의 컴포넌트는 매우 유용함.
    *   **단점**: 아직 실험적인 단계이며, 시각적 완성도(Typography, Spacing, Micro-interaction)가 다듬어지지 않음.

### 디자인 제안: "Glass OS Almanac"
**Core Concept**: 정보의 "흐름(Flow)"과 "집중(Focus)"을 시각적으로 분리하되, Glassmorphism을 사용하여 깊이감을 줌.

#### 1. Visual Language (Aesthetics)
*   **Glassmorphism**: 배경에 과하지 않은 `backdrop-blur-xl`과 `bg-white/70` (Light) 또는 `bg-zinc-900/70` (Dark)를 사용하여 레이어감을 형성.
*   **Typography**: 시스템 폰트(San Francisco)의 `tracking-tight`와 다양한 `font-weight`를 활용하여 정보 위계를 명확히 함. 제목은 대담하게, 메타데이터는 섬세하게.
*   **Color**: Slate/Zinc 베이스에 **Vibrant Violet (#8B5CF6)** 및 **Emerald (#10B981)**를 포인트 컬러로 사용. 그라디언트를 버튼이나 활성 상태에 은은하게 적용.

#### 2. Layout Structure (3-Column Hybrid)
`design-dashboard-v3`의 구조를 계승하되, 시각적 계층을 단순화합니다.

*   **Left Pane (Navigator)**:
    *   기존 `DocsSidebar` 통합.
    *   **Quick Actions**: 자주 쓰는 `/inbox`, `/daily` 워크플로우를 아이콘 버튼으로 상단 배치.
*   **Main Pane (Focus & Feed)**:
    *   **Greeting & Pulse**: "Good Morning" 헤더와 현재 진행 중인 프로젝트(Active Project)의 상태를 보여주는 "Pulse Card" (진척도, 페이즈, 최근 로그).
    *   **Activity Stream**: 타임라인 형태로 최근 변경된 문서(Proposal, Decision 등)를 카드 형태로 나열.
*   **Right Pane (Context)**:
    *   **Inbox Widget**: 캡처된 생각들을 빠르게 확인하고 처리.
    *   **Domains (Areas)**: 지식 도메인별 바로가기.

#### 3. Key Components
*   **Pulse Card**: 프로젝트 상태를 보여주는 핵심 컴포넌트. 진행률 바에 애니메이션 적용 (`layoutId` 활용한 부드러운 전이).
*   **Workflow Launcher**: Bento Grid 스타일의 미니 버튼들. 호버 시 미세한 스케일 업 인터랙션.

## 3. 결론 (Conclusion) / 제안 (Proposal)
1.  **통합**: `design-dashboard-v3`의 구조를 기반으로 `DocsDashboard`를 리팩토링.
2.  **디자인 업그레이드**: Tailwind CSS를 활용해 Glassmorphism 스타일 적용.
3.  **구현**: `src/docs-viewer/DocsDashboard.tsx`를 메인으로 하고, 컴포넌트를 분리하여 구현.

## 4. 해법 유형 (Solution Landscape)
*   🔴 **Open**: 디자인은 주관적인 영역이나, "Premium" & "Rich Aesthetics"라는 명확한 지향점이 있으므로 이를 충족시키는 방향으로 진행.

## 5. 인식 한계 (Epistemic Status)
*   이 제안은 코드 정적 분석과 사용자가 이전에 시도한 V3 디자인을 바탕으로 작성되었습니다. 실제 런타임 데이터(문서 양 등)에 따라 레이아웃 조정이 필요할 수 있습니다.

## 6. 열린 질문 (Open Questions)
1.  **Dark Mode**: 처음부터 다크 모드를 기본으로 할 것인지, 시스템 설정을 따를 것인지? (제안: 시스템 설정 따르되, Dark Mode에서 더 빛나는 디자인 설계)
2.  **Sidebar 통합**: 대시보드 내에 사이드바를 포함할 것인지, 아니면 글로벌 레이아웃의 사이드바를 활용할 것인지? (제안: 글로벌 사이드바 활용, 대시보드는 컨텐츠 영역에 집중)

---
**한줄요약**: V3의 구조적 장점(3-Column)과 V1의 심플함을 결합하고, Glassmorphism 디자인 언어를 입혀 "OS Almanac" 스타일의 프리미엄 대시보드로 재탄생시킨다.
