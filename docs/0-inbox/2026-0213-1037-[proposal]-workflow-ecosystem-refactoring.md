# 워크플로 생태계 리팩토링 제안서

| 항목 | 내용 |
|------|------|
| 원문 | 전체 워크플로우를 다 읽어봐. 그리고 missing을 찾아봐 |
| 내(AI)가 추정한 의도 | 20개 워크플로 생태계의 빈 구멍을 찾고, 각 워크플로의 정체성과 관계를 선명하게 만들고 싶다 |
| 날짜 | 2026-02-13 |
| 상태 | 🟡 사용자 승인 대기 |

## 1. 개요

20개 워크플로를 전수 분석한 결과, **정체성이 모호하거나 중복인 워크플로**와 **빈 자리**를 발견했다. 이를 교정하는 5개 액션을 제안한다.

## 2. AS-IS / TO-BE 비교

### 실행 파이프라인 스펙트럼

```
AS-IS:
  /make(모호) ──── /project(무거움)
  리팩토링? 어디에?

TO-BE:
  /poc(가벼움) ─── /refactor(중간) ─── /project(무거움)
  "검증 spike"      "패턴 전환"          "정식 프로젝트"
```

### 자율 실행

```
AS-IS:
  /next = tsc 에러 탐지 → /fix
        = E2E 실패 → /diagnose
        = inbox 정리 → /para
        = 할 일 없음 → /todo
        (= /fix + /diagnose + /para + /todo의 중복 조합)

TO-BE:
  /todo = "뭘 할지 모를 때" (탐지 & 제안)
  /go   = "갈 수 있는 데까지 가라" (자율 실행 & 보고)
  /next = 폐기
```

### 라우트 관리

```
AS-IS:
  라우트 생성/삭제 시 관련 코드를 수동으로 정리
  GlobalNav 등록도 규칙(rule)에 의존 → 에이전트가 잘 안 지킴

TO-BE:
  /routes = 라우트 기반 앱 등록/제거 도구
    등록: 라우트 탐색 → 아이콘+이름 매칭 → GlobalNav 등록
    제거: 라우트 삭제 → GlobalNav 해제 → 관련 코드/파일 정리
```

### 전체 워크플로 지도

```
AS-IS (20개):
  /onboarding /discussion /inbox /divide /make /project /issue
  /fix /diagnose /test /review /cleanup /redteam /resources
  /status /next /todo /para /archive
  /daily /til /rules /workflow

TO-BE (22개 = 20 - 2삭제 + 4신규):
  /onboarding /discussion /inbox /divide /poc /project /issue
  /fix /diagnose /test /review /cleanup /redteam /resources
  /status /go /todo /para /archive /routes /refactor
  /daily /til /rules /workflow
```

## 3. 상세 액션

### 액션 1: `/next` 폐기

- **이유**: 기능이 `/fix`, `/diagnose`, `/para`, `/todo`의 중복 조합
- **방법**: `next.md` 삭제

### 액션 2: `/go` 신규 생성

- **역할**: 자율 실행 에이전트 루프
- **핵심 원칙**: `/divide`의 자율 버전
  - Known → 알아서 실행 (멈추지 않음)
  - LLM이 잘 아는 것 → `/resources` 등으로 답 찾아서 실행
  - Open(의사결정 필요) → `/inbox`로 보고서 → 사용자 호출 → 멈춤
- **트리거**: 에이전트가 멈춰있을 때 "이어서 가"

### 액션 3: `/refactor` 신규 생성

- **역할**: 패턴 전환 파이프라인
- **파이프라인**:
  1. 대상 식별 — grep으로 패턴 A 사용처 전수 조사
  2. 변환 규칙 정의 — A → B 매핑
  3. `/divide` → 파일별 적용 + 검증
  4. `/review` → 철학 위반 확인
  5. `/fix` → smoke/type/build
  6. `/rules` → 패턴 A 금지 규칙 등록
  7. `/archive` → 관련 구 문서 퇴출

### 액션 4: `/make` → `/poc` 리네임 + 개선

- **이유**: "make"는 의도가 모호, "poc"는 spike/검증 의도가 명확
- **개선 사항**:
  - Step에 라우트 생성 + `/routes`로 GlobalNav 등록 추가
  - 종료 분기: 채택 → `/project`로 승격 / 폐기 → `/routes`로 정리
  - 관례(GlobalNav 등록 등)는 rule이 아닌 **workflow step으로** 강제

### 액션 5: `/routes` 신규 생성

- **역할**: 라우트 기반 앱 등록/제거 도구
- **등록 모드**: 기존 라우트 탐색 → 아이콘+이름 매칭 → GlobalNav 등록
- **제거 모드**: 라우트 삭제 + GlobalNav 해제 + 관련 코드/파일 정리

## 4. 해법 유형

🟡 **Constrained** — 워크플로 구조 자체는 명확하지만, 각 워크플로의 내부 Step 세부사항은 구현 과정에서 조정이 필요할 수 있다.

## 5. 인식 한계

- `/go`의 "어떤 작업을 이어갈지 판단하는 로직"은 실제 사용하면서 조정이 필요할 수 있다.
- `/routes`의 구체적인 구현 (어떤 파일을 수정하는지)은 코드베이스 분석 후 확정해야 한다.

## 6. 열린 질문

1. `/poc`의 Phase 1(discussion)이 필수인지 선택인지? (현재는 선택으로 제안)

## 설계 원칙 (이 논의에서 발견)

> **Rule은 soft, Workflow Step은 hard.**
> 반드시 지켜야 할 관례는 rule이 아닌 workflow step으로 강제한다.

```
강제 메커니즘 3단계:
  Workflow Step (반드시) > Rule (가급적) > Resource (참고)
```

## 한줄요약

20개 워크플로에서 중복(`/next`)과 빈 자리(`/go`, `/refactor`, `/routes`)를 찾아, 실행 파이프라인 스펙트럼(`/poc` → `/refactor` → `/project`)을 확립하고 자율 에이전트 루프(`/go`)를 추가하는 5개 액션 제안.
