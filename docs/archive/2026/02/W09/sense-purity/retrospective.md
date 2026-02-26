# sense-purity 회고

## 세션 요약

**목표**: sense 함수 순수화 — DOM→어댑터 격리, 변환 로직 vitest 테스트 가능
**결과**: 58→71 tests (+13), MouseListener+DragListener 450줄 삭제, 파이프라인 동사 법 제정

## KPT

### 🔧 개발
- Keep: sense→extract→resolve 3단계가 독립 테스트 가능
- Keep: Red→Green이 리팩토링 방파제
- Problem: DragListener 삭제 누락 (audit에서 발견)
- Problem: rename 시 테스트 파일명 누락 (doubt에서 발견)
- Try: rename 체크리스트에 파일명 포함

### 🤝 협업
- Keep: 사용자의 한 줄 질문이 AI의 편의 우선 사고를 교정
- Problem: AI가 Rule #8로 Rule #7/#9를 면제하려 함
- Try: rules 간 우선순위 명시 (backlog)

### ⚙️ 워크플로우
- Keep: audit→doubt 순서가 효과적
- Keep: /plan 전행 Clear 강제
- Try: OS 코드 리팩토링에도 audit 적용 가능함을 명확히

## 액션
| # | 액션 | 상태 |
|---|------|------|
| 1 | rename 체크리스트 | ✅ |
| 2 | dead code 전수 검색 | ✅ |
| 3 | rules 우선순위 체계 | 🟡 backlog |
| 4 | OG-006, OG-007 등록 | ✅ |
