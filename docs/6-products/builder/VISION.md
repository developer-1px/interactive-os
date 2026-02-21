# Product Vision — Visual CMS

> Interactive OS의 첫 번째 프로덕션 앱이자, OS 인프라의 최고난도 검증 대상.

## Vision

**기존 웹 페이지의 디자인을 그대로 유지하면서, 콘텐츠를 비주얼로 편집·관리할 수 있는 시스템.**
페이지를 새로 만드는 것이 아니라, 이미 만들어진 페이지의 콘텐츠를 운영한다.

## Target Group

**대형 포털·브랜드 홈페이지의 콘텐츠 운영자.**
- 콘텐츠가 자주 변경되고, 디자인이 중요한 페이지를 관리하는 사람
- 디자인은 개발팀이 만들었고, 운영자는 텍스트·이미지·배지 등 콘텐츠만 교체
- 예시: 네이버클라우드 랜딩페이지, 상품 소개 페이지, 이벤트 페이지

## Needs

1. **보이는 대로 편집** — 실제 렌더링된 페이지 위에서 콘텐츠를 직접 수정 (WYSIWYG)
2. **구조 유지** — 디자인과 레이아웃은 건드리지 않고 콘텐츠만 교체
3. **반복 블록 관리** — 카드, 탭, 리스트 등 반복 구조의 항목을 추가/삭제/재배치
4. **실수 복구** — 변경을 되돌리고 다시 할 수 있는 안전망
5. **키보드 효율** — 대량의 콘텐츠를 빠르게 순회하며 편집 (마우스 왕복 최소화)

## Product

### 핵심 기능

| 기능 | 설명 |
|------|------|
| **Inline Editing** | 렌더링된 페이지 위에서 텍스트, 이미지, 아이콘을 제자리 편집 |
| **Block Tree** | 재귀적 블록 모델. 섹션 → 그룹 → 아이템 계층으로 콘텐츠 구조화 |
| **Properties Panel** | 선택한 요소의 속성을 사이드 패널에서 상세 편집 |
| **Collection CRUD** | 반복 블록(카드, 탭)의 추가, 삭제, 복제, 순서 이동 |
| **Undo/Redo** | Snapshot 기반 전체 변경 이력 관리 |
| **Hierarchical Navigation** | Section ↔ Group ↔ Item 계층 탐색 (drill-down/up) |
| **Dual Projection** | 하나의 데이터 → 사이드바(구조 트리) + 캔버스(비주얼) 동시 표시 |
| **Block Presets** | 사전 정의된 블록/페이지 템플릿으로 빠른 콘텐츠 투입 |

### 아키텍처 특징

- **Design Block + Editing Overlay** — 디자인은 기존 웹 페이지 그대로, Builder Primitives가 편집 포인트만 선언
- **fields: Record\<string, string\>** — 모든 편집 가능 콘텐츠는 문자열. 복잡한 스키마 없음
- **커맨드 기반** — 모든 편집이 OS 커맨드를 통과. 입력 방식(키보드/마우스) 무관 동일 동작

## Business Goals

### 1차: Interactive OS의 최고난도 검증

> "실제 기능은 거의 없는데, 복잡한 데이터·Copy/Paste·Focus·Selection 등 기본기가 밀도 높게 필요한 서비스"

Visual CMS는 OS가 제공하는 모든 primitive를 실전에서 검증한다:

| OS Primitive | Visual CMS에서의 사용 |
|-------------|----------------------|
| Focus & Navigation | 계층적 블록 탐색, 사이드바 ↔ 캔버스 전환 |
| Selection | 블록 선택, 다중 선택 |
| Copy/Paste | 블록 구조 복사, 텍스트 복사, 타입 매칭 |
| Undo/Redo | 콘텐츠 변경 이력 관리 |
| Inline Editing | Field 컴포넌트 기반 제자리 편집 |
| Collection CRUD | 반복 블록 추가/삭제/이동 |
| ARIA | 트리, 그리드, 탭 등 복합 위젯 패턴 |

→ **이 수준의 앱을 만들 수 있는 OS**임을 증명하는 것이 핵심 가치.

### 2차: 독립적 프로덕트 가치

- 실제 운영 가능한 Visual CMS로 발전
- Interactive OS 공식 사이트를 이 도구로 관리 (self-hosting)

## Non-Goals

- ❌ 페이지 레이아웃을 처음부터 만드는 "빌더" (디자인은 개발팀의 영역)
- ❌ 비개발자를 위한 Wix/Squarespace 대체
- ❌ CMS 백엔드 / 데이터베이스 연동 (현재 단계)
- ❌ 배포/호스팅 기능
- ❌ 실시간 협업

## Now / Next / Later

### 🔴 Now — 편집 인터랙션 완성

- Container Block 범용화 (Tabs → accept 기반)
- Dual Projection 검증 (사이드바 Tree ↔ 캔버스 동기화)
- 블록 드래그 정렬
- 커서/포커스 리팩토링 (OS primitive 활용)

### 🟡 Next — 콘텐츠 타입 확장

- Accordion, Carousel 컨테이너
- 콘텐츠 타입 확장 (Video, Map, Code 블록)
- 반응형 미리보기
- 변경 이력 비교 (diff)

### 🔵 Later — 실서비스

- 정적 HTML/JSON 내보내기
- 외부 페이지 임포트 (기존 HTML → Block Tree 변환)
- 공식 사이트 self-hosting
- 테마/스타일 오버라이드 시스템

---

_Format: [Product Vision Board](https://www.romanpichler.com/tools/product-vision-board/) (Roman Pichler) + [Now/Next/Later Roadmap](https://www.prodpad.com/blog/invented-now-next-later-roadmap/) (Janna Bastow)_
