# Retrospective — sentinel-removal

> 2026-02-19 | Heavy preset | 12-step cycle completed

## 세션 요약
OS_FOCUS sentinel → ZoneCursor function factory 전환. 29 files, +939 −429, 717/717 pass.

## 🔧 개발 과정

| | 항목 |
|---|------|
| 🟢 Keep | TDD 사이클이 계약 검증에 효과적. buildZoneCursor 헬퍼로 중복 제거. OS 루프 → 앱 위임 설계. |
| 🔴 Problem | buildZoneCursor에 중복 ZoneState 인터페이스 생성 (review에서 발견). tsc 통과 ≠ Vite 정상을 간과. |
| 🔵 Try | 새 유틸 작성 시 기존 타입 검색 먼저. /verify에 Vite 에러 확인 추가. |

## 🤝 AI 협업 과정

| | 항목 |
|---|------|
| 🟢 Keep | 이전 세션 결과물(discussion/prd/redteam)이 체크포인트로 잘 전달됨. |
| 🔴 Problem | 회고(Step 14~16) 건너뛰고 다음 프로젝트 진입 시도. 에러 진단 시 terminal 확인 실패. |
| 🔵 Try | Heavy 완료 시 반드시 회고 실행. 에러 보고 시 Vite 재시작 우선. |

## ⚙️ 워크플로우

| | 항목 |
|---|------|
| 🟢 Keep | /doubt 재귀 수렴이 3건 dead code 삭제를 자연스럽게 잡음. /fix lazy 주석 탐지 유효. |
| 🔴 Problem | /verify에 Vite dev server 에러 확인 없음 → esbuild 에러를 놓침. |
| 🔵 Try | /verify에 Vite 재시작 + 콘솔 에러 확인 단계 추가 (반영 완료). |

## 반영된 변경
- `.agent/workflows/verify.md` — Dev Server 복구 섹션에 캐시 삭제 + 에러 확인 추가
