---
description: 기존 workflow를 조립하여 아이디어 → 테스트 가능한 spike까지 end-to-end로 만든다.
---

## Phase 1: Discovery (/discussion)
1. /discussion workflow를 실행하여 사용자와 대화한다.
   - 사용자의 숨겨진 Intent를 추론하고, Warrant를 누적한다.
   - 사용자가 "됐어", "만들자" 등 진행 시그널을 보내면 Phase 2로 넘어간다.
   - Discussion 결론 문서는 생략하고, 발견된 Intent/Warrant를 Phase 2에 직접 활용한다.

## Phase 2: PRD 작성 (/inbox)
2. /inbox workflow를 실행하여 `docs/0-inbox/YYYY-MM-DD_[Topic]_PRD.md`에 PRD를 작성한다.
   - Phase 1에서 발견한 Intent, Warrant, 핵심 요구사항을 기반으로 작성.
   - 섹션: 개요, 사용자 스토리, 핵심 기능, 비기능 요구사항, 스코프 (In/Out).

## Phase 3: 개발 계획서 (/inbox)
3. /inbox workflow를 실행하여 `docs/0-inbox/YYYY-MM-DD_[Topic]_DevPlan.md`에 개발 계획서를 작성한다.
   - PRD를 기반으로 기술 설계, 파일 구조, 컴포넌트 목록, 라우트 경로를 정의.
   - 섹션: 기술 스택, 파일 구조, 구현 순서, 라우트 설계.

## Phase 4: 구현 (Execution)
4. 개발 계획서를 따라 spike를 구현한다.
   - TanStack Router에 새 라우트를 등록한다.
   - 최소한의 동작하는 코드를 작성한다 (spike 수준).
   - UI는 기본적인 레이아웃과 인터랙션이 동작하는 수준까지.

## Phase 5: 검증 (/fix)
5. /fix workflow를 실행한다.
   - Smoke test → Type check → Build 순서로 검증.
   - 에러 발견 시 수정 후 재실행.

## Phase 6: 정리 (/cleanup)
6. /cleanup workflow를 실행한다.
   - Lazy comment 제거, 타입/린트 정리, 미사용 코드 제거, 빌드 최종 확인.

## Phase 7: 완료 보고
7. 완료 후 사용자에게 다음을 알려준다:
   - 테스트 가능한 **라우트 경로** (예: `/spike/feature-name`)
   - 생성된 문서 목록 (PRD, 개발 계획서)
   - 구현 요약
