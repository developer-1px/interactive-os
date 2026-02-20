# Inspector Redesign

## WHY (Background)
현재의 State Monitor Inspector는 Event, Command, Focus, State 변경 등 모든 런타임 정보가 혼재되어 노이즈가 심하다. AI와 협업하여 디버깅할 때 컨텍스트 환전 비용(Context Translation Cost)을 극적으로 줄이기 위해, "사용자의 특정 액션으로 인해 무엇이 어떻게 변했는가"라는 핵심 인과관계(Trigger-Context-Diff)만을 깔끔하게 추출하고 전달할 수 있는 도구가 필요하다.

## Goals
1. **타임라인 기반 뷰어**: Event → Command → Diff 구조가 채팅처럼 오토 스크롤되는 UI 적용.
2. **시그널/노이즈 분리**: State 변경 시그널과 Focus/Drag 같은 고빈도 OS 레벨 이벤트를 별개의 채널로 분리하여 필요할 때만 필터링해서 볼 수 있게 한다. 빈 껍데기 커맨드는 숨긴다.
3. **AI 컨텍스트 캡처 (Copy for AI)**: 특정 시점의 문제 상황을 한 번에 복사하여 AI에게 "이게 이렇게 되어야 할 것 같은데 확인해줘"라고 전달할 수 있는 고밀도 텍스트 클립보드 기능 제공. 전체 상태 덤프는 배제한다.

## Scope
- `@/packages/kernel` (혹은 관련 앱 레이어) 내 인스펙터 상태 수집 및 필터링 로직 구현 
- OS 수준 이벤트(Focus 등)와 State 변경 이벤트의 전송/로깅 흐름 분리
- 프론트엔드 UI 컴포넌트 재설계 (타임라인, 필터 토글, On-demand Full State 펼침, 컨텍스트 복사 버튼)

## References
- [2026-0220-0859-inspector-redesign.md](./discussions/2026-0220-0859-inspector-redesign.md) (초안 논의)
