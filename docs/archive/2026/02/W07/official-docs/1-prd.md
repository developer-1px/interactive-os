# PRD: 공식 문서 PARA 분리

---

## 배경

Interactive OS의 Kernel이 `@frozen 2026-02-11`로 프리징되었으며, `docs/2-area/05-kernel/`에 10개의 고품질 기술 문서가 존재한다. 그러나 이 문서들은 내부 PARA 지식 관리 시스템 안에 묻혀 있어, 외부 이해관계자에게 보여줄 공식 문서로 활용하기 어렵다.

## 목표

1. 공식 문서를 PARA 체계에서 물리적으로 분리하여 `docs/official/`에 배치
2. 문서 내부의 깨진 링크(`file:///` 절대 경로)를 상대 경로로 수정
3. 공식 문서 진입점(`README.md`)을 만들어 외부 사람이 바로 탐색 가능하게 함
4. 나중에 `website/` 등 독립 사이트로 통째로 이동할 수 있는 자립형 구조 확보

## 범위

### In Scope

| # | 작업 | 대상 |
|---|------|------|
| 1 | `docs/official/` 폴더 생성 | 새 폴더 |
| 2 | Kernel 문서 10개 이동 | `docs/2-area/05-kernel/0*.md` → `docs/official/kernel/` |
| 3 | 링크 수정 | `file:///` → 상대경로 |
| 4 | `README.md` 작성 | `docs/official/README.md` (목차 + 소개) |
| 5 | `packages/kernel/README.md` 작성 | 패키지 진입점 (docs/official/kernel 참조) |
| 6 | 원본 위치에 안내 문서 | `docs/2-area/05-kernel/`에 "공식 문서 이동됨" 링크 |

### Out of Scope

- 문서 사이트 빌드 도구(VitePress/Starlight 등) 도입
- OS 레이어 공식 문서 작성 (추후 프로젝트)
- 문서 내용 수정/증보 (현재 프리징된 내용 그대로 이동)
- PARA 시스템 자체의 리팩토링

## 사용자 시나리오

### S1: 외부 개발자가 커널 문서를 처음 볼 때
1. `docs/official/README.md`를 열면 전체 목차가 보임
2. Kernel 섹션 클릭 → `docs/official/kernel/00-overview.md`로 이동
3. 각 문서 하단의 "Next" 링크로 순차 탐색 가능

### S2: 내부 개발자가 기존 경로로 접근할 때
1. `docs/2-area/05-kernel/`에 들어가면 이동 안내 문서가 있음
2. 공식 문서 위치로 안내받음

### S3: 나중에 문서 사이트로 이전할 때
1. `docs/official/` 폴더를 통째로 `website/content/`로 이동
2. 내부 상대 링크가 그대로 동작

## 기술 제약

- 문서 이동은 `git mv`로 수행 (git history 보존)
- 상대 경로 링크만 사용 (호스팅 환경 독립)
- 마크다운 순수 — 빌드 도구 의존성 없음
