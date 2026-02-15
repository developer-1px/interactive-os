# Discussion: Desktop Dashboard Concept

**🧑 사용자**: docs 개선하고 싶어. 한글로 대답해.

**🤖 AI (Red Team)**: '개선'의 구체적 의도가 무엇입니까? (Discoverability / Accuracy / Friction)

**🧑 사용자**: 단순 뷰어로는 프로젝트 현황을 볼 수 없어 답답해. 메인 화면의 빈 공간도 활용하고 싶고.

**🤖 AI (Red Team)**: **Intent 확인**: '문서 읽기'가 아니라 '프로젝트 상태 파악'이 핵심이군요. 메인 화면에 위젯처럼 박히는 걸 원합니까?

**🧑 사용자**: 맞아. 첫 화면(메인)에서 폴더나 바로가기를 누르면 PARA 각 성격에 맞는 UI(Kanban, List 등)로 보였으면 좋겠어. 보편적인 템플릿을 따르고 싶지만 뭘지 모르겠네.

**🤖 AI (Red Team)**: **Solution 제안**:
- **Project**: Linear 스타일의 카드/칸반
- **Area**: Notion 스타일의 리스트
- **Desktop 활용**: 앱을 켜는 게 아니라 배경 자체를 대시보드로 활용.
- 이걸 바로 PoC로 만들어볼까요?

**🧑 사용자**: 그래 해봐. Mock을 보고 판단할게. 수고했어.

---
**한 줄 요약**: 텍스트 뷰어의 한계를 느껴, 데스크톱 배경을 캔버스 삼아 프로젝트 현황판을 그리기로 합의함.

---

## Conclusion
**Why / Intent**: 사용자는 현재의 문서 뷰어가 프로젝트의 '상태'와 '흐름'을 보여주지 못한다고 느낌. 메인 화면(Desktop)의 빈 공간을 활용하여 프로젝트 현황과 PARA 바로가기를 **한눈에(At a Glance)** 파악하고 싶어함.

**Warrants**:
1. **Discoverability**: 현재 docs 뷰어는 파일 탐색기 수준이라 구조 파악이 어렵다.
2. **Space Utilization**: Desktop 배경의 빈 공간이 활용되지 않고 있다.
3. **Visual Intuition**: 구조와 상태는 텍스트보다 시각적 대시보드가 훨씬 직관적이다.
4. **Bias for Action**: 말로 하는 논의보다 실제 프로토타입(Mock)을 보고 판단하는 것이 빠르다.

**Action Item**:
- Desktop 배경을 활용한 **PARA Dashboard PoC** 구현
- Project(Card/Kanban), Area(List), Resource(Search), Archive(History) 패턴 적용

**한 줄 요약**: 문서 탐색기를 넘어, 데스크톱 배경에 살아있는 **PARA 대시보드**를 심어 프로젝트 생명력을 시각화한다.
