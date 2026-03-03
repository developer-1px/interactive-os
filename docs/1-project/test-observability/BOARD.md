# test-observability

## Context

Claim: `createAppPage()`에 `onTestFailed` 자동 등록 + `formatDiagnostics()`를 "최소 경로 + Δ none + schema path 필터 + zone snapshot"으로 강화하면, 새 인프라 0으로 AI 자율 진단 루프가 완성된다.

Before → After:
- Before: 테스트 실패 시 진단 정보 없음. AI는 소스 코드를 읽고 추측. dumpDiagnostics()는 수동 호출만 가능.
- After: 테스트 실패 시 자동으로 schema-filtered 진단 출력. vitest + TestBot 클립보드 양쪽 소비.

Risks:
- `onTestFailed`가 vitest 글로벌로 접근 가능한지 환경 확인 필요 (try-catch 방어)
- 이중 등록 방지 (docs-viewer 기존 수동 등록 제거)

## Now

- [ ] T1: `formatDiagnostics(kernel): string` 순수 포맷터 — schema path 필터 + Δ none 감지 + zone snapshot
- [ ] T2: createAppPage + createOsPage에 auto-diagnostics 배선 — dumpDiagnostics() + onTestFailed 자동 등록
- [ ] T3: docs-viewer 4개 테스트에서 수동 onTestFailed 제거
- [ ] T4: TestBot 클립보드에 diagnostics 추가 — SuiteState.diagnostics + suiteDone payload + formatLog 포함

## Done

## Unresolved

- 2단계(Smart 진단 — 계약 기반 hint)는 Simple 적용 후 패턴을 보고 설계

## Ideas

- 계약 기반 자동 분류기: command 의도 vs 실제 상태 변경 불일치 감지
- AI가 formatDiagnostics 출력을 파싱하여 자동 수정 제안
