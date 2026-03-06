# 부록: 워크플로우 카탈로그 (47개)

> AI Native 파이프라인: /auto까지의 여정 — 부록
>
> [시리즈 목차로 돌아가기](./04-self-learning-and-beyond.md#시리즈-전체-목차)

---

이 프로젝트에서 사용하는 47개 워크플로우의 전체 목록입니다. 각 워크플로우는 **하나의 산출물**을 정의하고, 산출물이 다음 워크플로우의 입력이 됩니다.

## 파이프라인 — 메인 흐름

> `/go`가 자동으로 라우팅하는 핵심 경로입니다.

| # | 워크플로우 | 산출물 | 다음 단계 | 시리즈 |
|---|-----------|--------|----------|--------|
| 1 | `/discussion` | 구조화된 합의 (Warrant + Claim) | `/plan` | 1편 |
| 2 | `/plan` | 변환 명세표 (전행 Clear) | `/project` | 3편 |
| 3 | `/project` | BOARD.md + scaffold | `/go` 루프 | 3편 |
| 4 | `/usage` | 컴파일 안 되는 이상적 Usage 코드 | `/spec` | 2편 |
| 5 | `/spec` | BDD 시나리오 + Decision Table | `/red` | 2편 |
| 6 | `/red` | 🔴 FAIL 테스트 (.test.ts) | `/green` | 2편 |
| 7 | `/green` | 🟢 PASS 최소 구현 | `/bind` | 2편 |
| 8 | `/bind` | UI에 연결된 코드 | `/verify` | 2편 |
| 9 | `/verify` | tsc + lint + unit + e2e + build 통과 | `/refactor` | — |
| 10 | `/refactor` | 패턴 A → B 전환 | 다음 Task | — |
| 11 | `/audit` | 계약 위반 감사 보고서 | `/doubt` | 2편 |
| 12 | `/doubt` | 과잉 산출물 의심 보고서 | `/retrospect` | 2편 |
| 13 | `/retrospect` | KPT 회고 + 즉시 반영 | `/archive` | 4편 |
| 14 | `/archive` | 프로젝트 매장 + 지식 환류 | 종료 | — |

## 복구 경로 — 어느 단계에서든 삽입 가능

> 파이프라인이 직선이 아닐 때 사용합니다. (3편)

| # | 워크플로우 | 산출물 | 트리거 | 시리즈 |
|---|-----------|--------|--------|--------|
| 15 | `/why` | WHY Report (5 Whys + Double-loop) | 막혔을 때 | 3편 |
| 16 | `/reflect` | 한 줄 통과/실패 | 매 단계 후 | 3편 |
| 17 | `/redteam` | Findings + Severity 분석표 | 설계 완료 후 | 3편 |
| 18 | `/diagnose` | 삽질 일지 (코드 수정 금지) | 테스트 실패 시 | 3편 |
| 19 | `/ban` | 실패록 + 인수인계 | 답이 없을 때 | 3편 |
| 20 | `/rework` | 게이트 실패 → 루프백 | 품질 게이트 탈락 시 | 3편 |
| 21 | `/conflict` | 대립하는 가치 명시화 + 해소 전략 | 설계 충돌 시 | — |
| 22 | `/blueprint` | TOC 기반 실행 설계도 | 복잡한 태스크 착수 전 | — |

## 분해·해결 — 큰 문제를 작게

| # | 워크플로우 | 산출물 | 시리즈 |
|---|-----------|--------|--------|
| 23 | `/divide` | Work Package 트리 (전제조건 역추적) | 3편 |
| 24 | `/solve` | 4단계 자율 해결 (probe→analyze→act→verify) | — |
| 25 | `/issue` | 자율적 이슈 분석→계획→수정→검증→재발방지 | 3편 |

## 지식 순환 — 세션 간 학습

> 모든 워크플로우에 암묵 적용되거나, 지식 인프라를 관리합니다. (4편)

| # | 워크플로우 | 산출물 | 시리즈 |
|---|-----------|--------|--------|
| 26 | `_middleware` | 지식 로딩 → 발견 누적 → 영구 반영 (암묵) | 4편 |
| 27 | `/knowledge` | 지식 보관 위치 판단 + 파일 생성 (명시) | 4편 |
| 28 | `/rules` | rules.md 헌법 개정 | 4편 |
| 29 | `/elicit` | 사용자 암묵지 추출 (AI가 사용자에게 "왜?") | 4편 |

## 지식 인프라 — 컨테이너 관리

| # | 워크플로우 | 산출물 | 시리즈 |
|---|-----------|--------|--------|
| 30 | `/inbox` | 정형화된 보고서 (docs/0-inbox/) | 4편 |
| 31 | `/status` | STATUS.md 대시보드 갱신 | 4편 |
| 32 | `/retire` | 문서 AI 컨텍스트 제거 + git archive 보존 | 4편 |
| 33 | `/resources` | 레퍼런스·best practice 자동 생성 | — |

## 메타 — 워크플로우를 만드는 워크플로우

| # | 워크플로우 | 산출물 | 시리즈 |
|---|-----------|--------|--------|
| 34 | `/workflow` | 워크플로우 생성/수정 | 4편 |
| 35 | `/reframe` | 비공식 용어 → 표준 프레임워크 용어 치환 | 4편 |

## 품질 게이트

| # | 워크플로우 | 산출물 | 시리즈 |
|---|-----------|--------|--------|
| 36 | `/fix` | LLM 산출물 well-formedness 교정 | 2편 |
| 37 | `/review` | 철학 준수 + 네이밍/구조 일관성 리포트 | 2편 |
| 38 | `/coverage` | 커버리지 갭 분석 + /red 자동 실행 | 2편 |
| 39 | `/naming` | 구현 전 이름 설계 (이름이 아키텍처) | — |
| 40 | `/perf` | 성능 근본 원인 보고서 (측정→진단→수정→검증) | — |

## 환경·인프라

| # | 워크플로우 | 산출물 | 시리즈 |
|---|-----------|--------|--------|
| 41 | `/go` | 상태 기반 파이프라인 라우팅 | 3편 |
| 42 | `/auto` | Stop Hook 자율 실행 | 4편 |
| 43 | `/ready` | 개발 환경 정상 확인 (서버+타입+렌더) | 2편 |
| 44 | `/routes` | 라우트 기반 앱 등록/제거 | — |

## Product Layer

| # | 워크플로우 | 산출물 | 시리즈 |
|---|-----------|--------|--------|
| 45 | `/stories` | 유저 스토리 목록 (living document) | 2편 |
| 46 | `/design` | HTML+Tailwind 프로토타입 (코드 미수정) | 2편 |
| 47 | `/apg` | W3C APG 패턴 구현·검증 | — |

---

## 전체 연결 맵

```
/discussion ─→ /plan ─→ /project ─→ /go ─────────────────────────┐
                                      │                           │
                            ┌─────────┴──────────┐               │
                            ↓                    ↓               │
                    /usage → /spec → /red → /green → /bind → /verify
                                                                  │
                            ┌─────────────────────────────────────┘
                            ↓
                    /refactor → (다음 Task → /spec 루프)
                            ↓ (모든 Task 완료)
                    /audit → /doubt → /retrospect → /archive

복구: /why · /reflect · /redteam · /diagnose · /ban · /rework
분해: /divide · /solve · /issue
지식: _middleware · /knowledge · /rules · /elicit
인프라: /inbox · /status · /retire · /resources
메타: /workflow · /reframe
품질: /fix · /review · /coverage · /naming · /perf
환경: /ready · /routes
제품: /stories · /design · /apg
자율: /go · /auto
```
