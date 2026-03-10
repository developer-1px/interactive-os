# Blueprint: 프로젝트 스캐폴딩 v2

> 날짜: 2026-03-10

## 1. Goal

v2 프로젝트 구조를 설계하여, `/archive` 시 개별 파일 판단이 0건이 되는 스캐폴딩을 만든다.

## 2. Why

v1 구조(BOARD + spec + discussions/ + notes/)에서 아카이브 정리 시 296개 중 77%를 개별 판단으로 삭제해야 했다. notes/ 폴더가 수명이 다른 문서를 혼재시키는 근본 원인.

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| notes/가 필요하다 | ❌ 무효 | discussions/가 "안 간 길"을 흡수하면 notes/ 불필요. 실행 계획(plan, audit)은 코드 완성 후 가치 소멸 |
| decisions/ 폴더가 필요하다 | ❌ 무효 | Occam's Razor — discussions/가 이미 그 역할. 폴더 추가는 복잡도 증가 |
| blueprint는 항상 파일로 저장해야 한다 | ❌ 무효 | Challenge Matrix가 없는 blueprint = 실행 계획(disposable). Challenge 있을 때만 저장 |
| 모든 문서에 보존 여부를 개별 판단해야 한다 | ❌ 무효 | 폴더가 수명을 강제하면 판단 0 가능: discussions/ = 보존, 나머지 = 삭제 |
| spec.md는 불필요하다 (테스트가 spec) | ❌ 무효 | spec = intent, test = implementation. 둘 다 필요. spec이 테스트 수정의 진실 |

## 4. Ideal

- 새 프로젝트: `BOARD.md(테이블) + spec.md + discussions/` — 3파일 구조
- `/archive` 실행: discussions/ 이동 + spec 이동 + BOARD Context 보존 + 나머지 삭제. 판단 0
- BOARD.md: 테이블 기반 pit of success — 빈 셀이 강제력

## 5. Inputs

- 아카이브 정리 실증 데이터 (cleanup-report.md): 296→68, 77% 삭제
- scaffold-insights.md: 11개 구조적 발견 (I1-I11)
- v1 스킬 5개: /project, /archive, /blueprint, /diagnose, /retrospect

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | `/project` scaffold에서 notes/ 제거 + BOARD 테이블 템플릿 | v1 scaffold (notes/ 포함, 자유형 BOARD) | skill.md 수정 | High | — |
| G2 | `/archive` 판단 0 로직 | v1 4갈래 개별 판단 | skill.md 수정 | High | G1 |
| G3 | `/blueprint` Challenge 조건부 저장 | 무조건 notes/에 저장 | skill.md 수정 | Med | — |
| G4 | `/diagnose` 출력을 discussions/에 | 0-inbox에 저장 | skill.md 수정 | Med | — |
| G5 | `/retrospect` 출력을 discussions/에 | root에 저장 | skill.md 수정 | Med | — |
