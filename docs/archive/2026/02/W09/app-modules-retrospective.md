# app-modules 회고

## 세션 요약
undo toast 기능 요구 → OS App Module System 설계·구현 (T1~T8)
workflow: /project → /red → /green → /refactor

## KPT

### 🔧 개발
- **Keep**: 커널 미들웨어 파이프라인을 코드 리딩으로 정확히 파악 → `ctx.effects.dispatch`로 토스트 해결
- **Problem**: 커널 `after()` 계약을 사전 분석 없이 `ctx.state` 직접 수정 시도 → 3회 실패
- **Problem**: 테스트 인스턴스 command 등록 순서 (create() 스냅샷) 미숙지 → 2회 반복 수정
- **Try**: 미들웨어 작성 시 커널 processCommand 흐름 사전 확인 체크리스트

### 🤝 협업
- **Keep**: /go 라우터가 Red→Green→Refactor 순서를 정확히 강제
- 특별 문제 없음

### ⚙️ 워크플로우
- **Keep**: /refactor Gate 체계 (tsc→lint→unit→build) 누락 없이 검증
- **Problem**: /red 결정 테이블이 아키텍처 태스크에 부적합
- **Try**: /red에 "아키텍처 태스크는 결정 테이블 생략, GWT 직행" 예외 추가 → 반영 완료

## 자가 개선 반영
- `.agent/workflows/red.md`: 아키텍처/리팩토링 예외 한 줄 추가
