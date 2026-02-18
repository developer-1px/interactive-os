# OS Elegance — PRD

> 목표: Interactive OS의 시각적 완성도와 코드 우아함을 "데모 가능" 수준까지 끌어올린다.

---

## 배경

defineApp v5 프로젝트 완료 후, OS의 핵심 아키텍처(Kernel, defineApp, Zone)는 안정 단계에 진입했다. 그러나 **겉으로 보이는** 완성도 — Shell UI, 라우트 정리, 코드 일관성 — 에 아직 갭이 있다.

## 목표

1. OS Shell(GlobalNav, 404, Root Layout)의 **시각적 프리미엄감** 향상
2. defineApp v5 코드 리뷰 발견사항 정리 (R1, E1, E4, E5, E6)
3. Dead/Stale 라우트 및 코드 제거
4. TanStack Router Devtools 프로덕션 분리

## 범위 (In-Scope)

| # | 항목 | 근거 |
|---|------|------|
| S1 | GlobalNav 리디자인 — 아이콘, 간격, 호버 효과, 활성 상태 강화 | Shell 첫인상 |
| S2 | 404 페이지 개선 — 일러스트·메시지·돌아가기 CTA | 완성도의 신호 |
| S3 | Todo 앱 v5 코드 정리 — dead guard 제거, Immer 일관성, 타입 수정 | 코드 리뷰 R1, E1, E4 |
| S4 | Stale playground 라우트 정리 — 미사용 showcase/playground 삭제 | 불필요한 것의 부재 |
| S5 | Router Devtools 조건부 렌더링 — development only | 프로덕션 분리 |
| S6 | 전역 디자인 토큰 보강 — 그라디언트, 미세 애니메이션, 타이포그래피 | 시각적 일관성 |
| S7 | Root Layout 개선 — app-viewport 배경, 간격, 전환 효과 | 전체 느낌 |

## 범위 밖 (Out-of-Scope)

| 항목 | 이유 |
|------|------|
| Builder 앱 v5 마이그레이션 | 별도 프로젝트 |
| Scope 버블링 구현 (Red Team Attack #2) | kernel 아키텍처 변경은 별도 프로젝트 |
| createModule 구현 | 별도 프로젝트 |
| E2E 테스트 추가 | 이 프로젝트는 시각적 + 코드 정리 |

## 사용자 시나리오

### Scenario 1: 첫 방문 — "와"
1. 사용자가 OS를 처음 열었을 때, 세련된 사이드바와 메인 콘텐츠를 보고 "전문적이다"라는 인상을 받는다.
2. 부드러운 전환 효과와 미세 애니메이션이 "살아있는" 느낌을 준다.

### Scenario 2: 잘못된 URL — 404
1. 존재하지 않는 URL로 접근하면, 친절하고 세련된 404 페이지가 표시된다.
2. "홈으로" 버튼이 명확하다.

### Scenario 3: 코드 리뷰어 — "깨끗하다"
1. 코드를 읽는 사람이 dead code, 불필요한 guard, 타입 불일치를 발견하지 않는다.
2. 모든 핸들러가 Immer로 통일되어 일관적이다.

## 기술 제약

- TailwindCSS v4 사용 중 (TailwindCSS + CSS theme)
- TanStack Router 기반 라우팅
- defineApp v5 API 기반
- Lucide React 아이콘
