# Builder Sidebar Redesign: Blueprint & Thumbnails

**Journey**
**🧑 사용자**: `localhost:5555/builder` 빌더의 left menu의 디자인을 개선해보자.
**🤖 AI**: 단순 UI 폴리싱 기반으로 할지(옵션 1), 향후 확장을 위해 GlobalNav(w-10)와 패널을 분리하는 Pro-Tool 구조로 갈지(옵션 2) 제안. 제 판단은 2번입니다.
---
**🧑 사용자**: 향후 기능 뭘 추가할건데? 왼쪽패널은 컨텐츠 Tree의 역할(피그마의 페이지 계층뷰, PPT 슬라이드뷰)이 더 중요함. 트리로만 만들면 너무 인지하기 힘드니, 비주얼이 상상 가능한 썸네일이 있었으면 함.
**🤖 AI**: 피그마 형태를 차용하여 단순 아이콘+텍스트가 아닌, 각 블록의 형태를 알 수 있는 미니 스켈레톤/와이어프레임을 썸네일로 넣는 것을 제안.
---
**🧑 사용자**: 뭔가 욕심일까? 실제 렌더링해서 스케일 다운으로 보여주면 되지 않을까 보는데 훨씬 직관적일 것.
**🤖 AI**: CSS `transform: scale()`을 이용한 실제 컴포넌트 렌더링 방식 수용. 별도 캡처 부하 없이 완벽한 형태를 보여줄 수 있는 가장 이상적인 스펙임에 도달.

**Conclusion**

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | 좌측 패널은 컨텐츠 계층 트리의 역할을 명확히 하되, 실제 블록 컴포넌트를 CSS `transform: scale`로 축소한 **"라이브 미니맵 썸네일"** 트리 형태로 전면 개편한다. |
| **📊 Data** | 현재의 단순 트리 구조로는 복합적인 인터랙션 OS 블록(Section > Card 등)의 비주얼을 연상하기 불가능함. |
| **🔗 Warrant** | 좌측 뷰의 핵심 가치는 "전체 비주얼과 구조를 직관적으로 파악(Blueprinting)"하는 데 있다. React의 재사용성과 CSS scale 조합은 추가 비용 없이 가장 높은 정확도를 제공한다. |
| **📚 Backing** | Figma 레이어 뷰, Web Builder Implementation Standard (Premium SaaS Layout Patterns) 등 시각화 패러다임. |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | 너무 복잡한 3D나 고해상도 이미지 블록이 많을 경우 Live Scale 방식이 브라우저 DOM 렌더링에 미세한 영향을 줄 수는 있음 (pointer-events: none으로 이벤트 부하는 억제 가능). |
| **❓ Open Gap** | 없음 |

| 🚀 Next | 🟢 Clear → `/go` |
