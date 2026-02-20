# BOARD — inspector-redesign

## 🔴 Now
- [x] 01. 기존 Inspector 컴포넌트 현황 분석 
  - [x] src 하위의 StateMonitor, DevTools 패널 관련 코드 위치 파악
  - [x] kernel/app의 상태 구독(Log/Subscribe) 흐름 분석
- [x] 02. Prd (요구사항 정의서) 작성 및 확정
  - [x] /prd 템플릿에 맞추어 상태 모델, UI 컴포넌트, 인터랙션 스펙 문서화
- [ ] 03. 아키텍처 및 데이터 흐름 설계
  - [ ] Event, Command, Diff를 생산하는 커스텀 미들웨어/로거 설계
  - [ ] Focus (OS-level) 이벤트 분리를 위한 필터링 정책 마련 설계
- [ ] 04. UI 프로토타이핑 (/design)
  - [ ] 자동 스크롤, 타임라인 뷰, Copy for AI 버튼 배치 등 순수 컴포넌트 마크업
- [ ] 05. 상태 수집 레이어 구현 (EXECUTION)
- [ ] 06. UI 컴포넌트 연동 (EXECUTION)
- [ ] 07. E2E 및 수동 검증 (VERIFICATION)
- [ ] 08. 프로젝트 문서화 및 /archive (VERIFICATION)

## ⏳ Done
- [x] 프로젝트 초기화 및 폴더 스캐폴딩 (2026-02-20)
- [x] README 작성 (2026-02-20)

## 💡 Ideas
- "Copy for AI"는 JSON 베이스가 나을까, 마크다운 렌더링 텍스트가 나을까? 
  - (결정 필요 사항: JSON 트리보다, `<event>...<command>...<diff>` 식의 마크다운 포맷이 LLM 프롬프트 토큰으로 더 효율적일 수 있음)
- 상태 변경이 진짜로 없는 빈 껍데기 커맨드는 완전히 폐기할 것인가, 아니면 희미하게(Dim) 남길 것인가?
