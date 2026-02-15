# Inspector 통합 — KPI

| 지표 | 현재 값 | 목표 값 | 측정 방법 |
|------|---------|---------|----------|
| Inspector 패널 파일 수 | 12 | 10 (-2) | `ls src/inspector/panels/` |
| STATE 탭 존재 여부 | 존재 | 제거 | `InspectorActivityBar.tsx` 확인 |
| `UnifiedInspector` Store 표시 | ❌ 미지원 | ✅ 접이식 | 브라우저에서 확인 |
| tsc 빌드 에러 | 0 | 0 | `npx tsc --noEmit` |
| 기존 테스트 통과 | 12/12 | 12/12 | `npm test -- inferPipeline` |
