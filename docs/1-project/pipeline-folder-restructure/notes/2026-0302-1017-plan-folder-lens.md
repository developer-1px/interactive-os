# /plan — Folder Lens Principle 문서화

> Discussion Clear → 실행 전 MECE 변환 명세표

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `.agent/knowledge/folder-structure.md` | 존재하지 않음 | "Flow→Dependency→Concept→Topology" 4-lens 원칙 문서. 각 렌즈 정의, 우선순위, 충돌 해소 규칙, 현재 구조 매핑 | Clear | — | 파일 존재 + rules.md에서 참조 | 없음 |
| 2 | `.agent/rules.md` 참조 추가 | 폴더 구조 관련 참조 없음 | `\| 폴더 구조 판단이 필요할 때 \| .agent/knowledge/folder-structure.md \|` 행 추가 | Clear | →#1 | rules.md에 행 존재 | 없음 |
| 3 | `docs/1-project/pipeline-folder-restructure/BOARD.md` 갱신 | Final Structure만 있음 | widgets/ 분리, _shared/ 통합 등 2-depth 변경 반영 + 원칙 문서 참조 링크 | Clear | →#1 | 파일 내용 최신화 | 없음 |

## MECE 점검

1. CE: 3행 실행하면 목표(원칙 문서화 + 세션 간 일관성) 달성? → ✅
2. ME: 중복 행? → ❌
3. No-op: Before=After? → ❌

## 라우팅

승인 후 → `/go` (기존 프로젝트 `pipeline-folder-restructure`) — Meta 프로젝트 직접 실행
