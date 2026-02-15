# Registry Monitor v5 — KPI

## 성공 기준

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|-----------|
| **커맨드 가시성** | GroupRegistry에 수동 등록된 것만 보임 | 커널에 등록된 100% 커맨드 표시 | `getRegistry()` 결과 vs. 화면 행 수 비교 |
| **레거시 코드 제거** | `GroupRegistry.ts` 존재 | `GroupRegistry.ts` 삭제됨 | 파일 부재 확인 |
| **Scope 계층 표시** | focusPath 기반 (부분적) | 전체 Scope Tree 표시 | parentMap 기반 트리 렌더링 |
| **When Guard 표시** | evalContext (레거시) | 커널 내부 when guard 실시간 | 커맨드 enabled/disabled 실시간 토글 확인 |
| **빌드 통과** | ✅ | ✅ | `npm run build` 성공 |
| **타입 체크 통과** | ✅ | ✅ | `npx tsc --noEmit` 성공 |
