# 🐛 Shift+Tab이 Draft 필드를 건너뛴다
> 등록일: 2026-02-16
> 상태: done ✅
> 심각도: P2

## 원문
지금 탭을 하면 사이드메뉴 -> Draft -> List 순으로 움직이는데 shift+tab을 하면 Draft로 가지 않아. 왜인지 분석해서 수정해봐.

## 환경 (Environment)
- 브라우저/OS: Chrome, macOS
- App server: localhost:5555 ✅

## 재현 단계 (Reproduction Steps)
1. Todo 앱(`/`) 접속
2. List 영역의 아이템에 포커스
3. Shift+Tab 누름

## 기대 결과 (Expected)
Draft 필드로 이동해야 한다 (Tab의 역순: List → Draft → Sidebar)

## 실제 결과 (Actual)
Draft를 건너뛰고 Sidebar로 직접 이동한다.

## 해결

field-key-ownership 프로젝트로 해결. FIELD_DELEGATES_TO_OS (allowlist) 모델 도입.
Commit: `52b0d33`
