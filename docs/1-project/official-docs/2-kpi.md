# KPI: 공식 문서 PARA 분리

---

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|-----------|
| 공식 문서 독립 폴더 | ❌ 없음 | ✅ `docs/official/` 존재 | `ls docs/official/` |
| Kernel 문서 위치 | `docs/2-area/05-kernel/` | `docs/official/kernel/` | 파일 경로 확인 |
| 깨진 링크 (`file:///`) | 10개 문서 × 2~3개 = ~25개 | **0개** | `grep -r "file:///" docs/official/` |
| 진입점 README | ❌ 없음 | ✅ `docs/official/README.md` | 파일 존재 확인 |
| 패키지 README | ❌ 없음 | ✅ `packages/kernel/README.md` | 파일 존재 확인 |
| 문서 간 상대 링크 | `file:///` 절대경로 | 상대경로 (`./*.md`) | `grep -r "file:///" docs/official/` = 0 |
| 원본 안내 문서 | ❌ 없음 | ✅ `docs/2-area/05-kernel/` redirect | 파일 확인 |
