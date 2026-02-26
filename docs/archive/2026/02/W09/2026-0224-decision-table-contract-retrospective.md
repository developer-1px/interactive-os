# Retrospective — decision-table-contract

> 2026-02-25

## 세션 요약

**목표**: 결정 테이블을 LLM 계약 구조로 만들어 `/red` 워크플로우에 통합  
**결과**: 8열 표준 포맷 확정, 템플릿 생성, `/red` Step 1 재정렬, Todo 갭 분석 완료  
**사용 workflow**: Discussion → /inbox ×2 → /project → /go ×3 → /retrospect

---

## 🔧 개발 과정

| | 내용 |
|--|------|
| **Keep 🟢** | Todo/Builder 두 앱의 코드를 실제로 읽고 표를 채워봄으로써 이론이 아닌 실증으로 8열 구조 검증. T2 갭 분석에서 Home/End/F2 누락이라는 구체적 실패 모드 발견 |
| **Problem 🔴** | Step 1-A에서 표 작성 시 Home/End/F2를 빠뜨림 — 템플릿에 입력 목록이 있었는데도 모든 입력을 순회하지 않음 |
| **Try 🔵** | Step 1-A에서 입력 열거 시 템플릿의 전체 입력 목록과 1:1 대조하는 체크 패턴 사용 |
| **자가 점검 🪞** | 정직함. Home/End/F2 누락은 "LLM의 습관적 일탈"의 실제 사례로 이 프로젝트의 Claim을 자기 스스로 증명 |

## 🤝 AI 협업 과정

| | 내용 |
|--|------|
| **Keep 🟢** | "표랑 코드랑 테스트 코드랑 비슷하게"라는 한 문장으로 핵심 Claim 전달. AI가 Isomorphic 계약으로 구조화. 짧은 핑퐁으로 수렴 |
| **Problem 🔴** | Discussion 단계에서 "Emerging Claim" 표를 반복 첨부 — 실행 단계에서는 불필요한 오버헤드 |
| **Try 🔵** | Discussion 종료 후 실행 단계에서는 Toulmin 프레임 생략, 작업 결과만 보고 |
| **자가 점검 🪞** | 처음 test-observability T5로 오해했으나 빠르게 수정. 사용자 의도 추적은 양호 |

## ⚙️ 워크플로우

| | 내용 |
|--|------|
| **Keep 🟢** | `/project`에 Meta 유형 추가 — 워크플로우/문서 프로젝트가 Red 테스트 게이트 우회 가능. 이 세션에서 즉시 효과 |
| **Problem 🔴** | `/go` 라우팅 테이블에 Meta 프로젝트 경로가 없어 불명확한 라우팅 발생 |
| **Try 🔵** | `/go` 상태 판별에 Meta 분기(#1.5) 추가 → 즉시 반영 완료 |
| **자가 점검 🪞** | Meta 분기 추가는 과잉이 아님 — 이 세션에서 실제로 라우팅이 모호했기 때문 |

---

## 자가 개선 반영 목록

| 파일 | 변경 내용 |
|------|----------|
| `.agent/workflows/go.md` | 라우팅 테이블에 #1.5 Meta 분기 추가 ✅ |
| `.agent/workflows/red.md` | Step 1-A~F 재정렬, 완료 기준 MECE 5항목 추가 ✅ |
| `.agent/workflows/project.md` | Heavy/Light/Meta 3유형 + 각 DoD 분리 ✅ |
| `.agent/workflows/documantaion/decision-table.md` | 8열 템플릿 신규 생성 ✅ |

---

## 📜 Rules 발견

> 이 세션의 핵심 교훈이 `rules.md`에 기록할 만한가?

**후보**: "결정 테이블(8열)은 `/red` Step 1의 산출물이며, 표의 행 수 = 테스트 it() 수 = 바인딩 수가 동형 강제되어야 한다."

→ 이미 `/red` 워크플로우에 반영됨. `rules.md`는 워크플로우가 아닌 원칙 레벨이므로, 이 교훈은 워크플로우 수준에서 충분. **rules.md 변경 불필요.**
