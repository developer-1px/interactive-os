# KPI: Builder Focus Navigation

## 1. 성공 지표 (Success Metrics)

| 지표 | 현재 값 | 목표 값 | 측정 방법 |
|------|---------|---------|-----------|
| **E2E Test Pass Rate** | 0% (예상) | 100% | `e2e/builder/builder-spatial.spec.ts` 실행 결과 |
| **Focus Restoration** | Broken | Working | 빌더에서 Arrow 키로 상하좌우 이동 가능 여부 수동 확인 |
| **Selection Sync** | Disconnected | Connected | 커널 상태(`os.focus.zones`) 변경 시 UI 반영 여부 |
