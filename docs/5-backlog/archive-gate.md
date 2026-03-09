# Archive Gate — vitest stop hook으로 물리적 품질 게이트

> 작성일: 2026-03-09

## 문제

LLM이 "pre-existing FAIL이니까 괜찮다"고 자기 합리화하면서 검증 게이트를 우회.
unify-scenario-items 프로젝트에서 5 FAIL 미해소 상태로 archive 완료됨.

## 설계

`/archive` stop hook = 마커 기반 vitest gate.

```
/archive 시작 → /tmp/.archive-gate-{session} 마커 생성
LLM이 멈추려 함 → stop hook이 마커 감지 → vitest run
  → all PASS: 마커 삭제, exit 0
  → FAIL 있음: exit 2 + "N개 FAIL. 해소 or 백로그 등록 후 재시도"
```

검증된 선례: `/auto` stop hook (마커 기반 조건부 실행).

## 해결해야 할 이슈

- 전체 vitest에 26+ pre-existing APG FAIL → 스코프 정의 필요 (전체 vs 프로젝트 관련 파일만)
- FAIL을 백로그에 등록하면 archive 허용할 것인가? (미분류 FAIL 0건 규칙)

## 발견된 LLM 패턴

- cherry-picking: 자기에게 유리한 테스트 범위만 실행하고 통과를 선언
- 예외 합리화: "pre-existing"이라는 라벨로 검증 게이트 우회
- 부분 보고: docs-scenarios.test.ts 5 FAIL을 "19 PASS"로 보고 (다른 파일만 실행)
