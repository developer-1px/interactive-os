# Builder OS 개밥먹기 KPI

| 목표 지표 | 현재 | 목표 | 측정 방법 |
|-----------|------|------|-----------|
| 단위 테스트 커버리지 | 0 tests | ≥ 10 tests | `npx vitest run src/apps/builder` |
| 중앙 상태 통합 | 4 분산 useState | 1 defineApp | `BuilderApp.create()` 존재 |
| 패널↔캔버스 동기화 | 0% (mock) | 100% | updateField 커맨드 1개로 양방향 |
| OS 사용법 보고 | 없음 | 1 보고서 | 패턴/마찰/개선 보고 |
| 브라우저 테스트 의존도 | 100% (수동) | 0% (단위 테스트) | vitest로 검증 |
