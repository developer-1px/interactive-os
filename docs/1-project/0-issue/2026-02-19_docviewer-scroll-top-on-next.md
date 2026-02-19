# 🐛 DocViewer next 클릭 시 스크롤이 맨 위로 이동하지 않음
> 등록일: 2026-02-19
> 상태: open
> 심각도: P2

## 원문
next시 스크롤이 맨 위로 갈 수 있도록 수정

## 환경 (Environment)
- 브라우저/OS: Chrome, macOS
- 관련 서버 상태: App 5555 ✅

## 재현 단계 (Reproduction Steps)
1. DocViewer 라우트 접속
2. 긴 문서를 스크롤하여 아래까지 내림
3. 하단 "Next" 버튼 클릭
4. 다음 문서로 전환되지만 스크롤 위치가 그대로 유지됨

## 기대 결과 (Expected)
Next/Prev 버튼으로 문서 전환 시 스크롤이 맨 위(top)로 이동해야 한다.

## 실제 결과 (Actual)
스크롤 위치가 이전 문서의 위치 그대로 유지되어 새 문서의 시작 부분이 보이지 않는다.

## 관련 이슈
없음
