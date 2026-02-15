---
description: superseded된 문서를 식별하여 AI 컨텍스트에서 제거하고, 원본은 git archive 브랜치에 보존한다.
---

## /archive — 문서 수명 주기 관리

> **목적**: 더 이상 현행이 아닌 문서가 AI에게 "현재 진실"로 오인되는 노이즈를 제거한다.
> **원칙**: tombstone 금지. 물리적 이동만 한다. 이동된 원본은 그대로 보존한다.

### 문서 수명 주기 (3-Tier)

| 단계 | 위치 | 상태 | 접근 방법 |
|------|------|------|----------|
| 활성 | `docs/1-project/name/` | 진행 중 | Docs Viewer, AI 컨텍스트 |
| 냉장 | `docs/4-archive/YYYY-MM-name/` | 완료, 열람 가능 | Docs Viewer |
| 심층 | `archive/legacy-docs` git 브랜치 | 파일시스템에서 삭제 | `git show` 로만 접근 |

### 프로세스

#### 1. 판단 — superseded 여부 확인

각 문서에 대해 교차 검증:

- **문서가 참조하는 개념/패턴이 현재 소스코드에 존재하는가?**
- **`MIGRATION_MAP.md`에 이미 superseded로 기록된 패턴을 사용하는가?**

| 분류 | 기준 | 조치 |
|------|------|------|
| ✅ 현행 | 코드와 일치 | 유지 |
| ⚠️ 부분 outdated | 일부만 불일치 | 사용자에게 보고 |
| 🪦 superseded | 핵심 전제가 변경됨 | 아카이브 대상 |

#### 2. 냉장 — `docs/4-archive/`로 이동

완료된 프로젝트 또는 superseded 문서를 냉장 보관한다:

```bash
# 프로젝트 통째로 4-archive/로 이동 (BOARD.md, discussions/, notes/ 포함)
mv docs/1-project/name/ docs/4-archive/YYYY-MM-name/

# 또는 개별 문서
mv docs/3-resource/path/to/file.md docs/4-archive/YYYY-MM-topic/
```

- 날짜 프리픽스: `YYYY-MM-` (아카이브 시점 기준)
- 프로젝트 폴더는 **통째로** 이동 — BOARD.md, discussions/, notes/ 모두 보존
- 개별 파일도 원본 그대로 유지 (tombstone 금지)
- `MIGRATION_MAP.md`의 냉장 보관 섹션에 기록

```bash
git add docs/ && git commit -m "archive: move [name] to 4-archive (project completed)"
```

#### 3. 심층 — git 브랜치로 퇴출 (노이즈 임계치 초과 시)

`4-archive/`가 너무 커져서 AI 컨텍스트에 노이즈가 되면:

```bash
# archive 브랜치에 보존
git checkout archive/legacy-docs
git checkout main -- docs/4-archive/YYYY-MM-name/
git add . && git commit -m "archive: preserve [name] before deep archive"
git checkout main

# main에서 삭제
rm -rf docs/4-archive/YYYY-MM-name/
git add . && git commit -m "archive: deep archive [name] — git branch only"
```

- `MIGRATION_MAP.md`의 심층 보관 섹션으로 이동

#### 4. 기록 — MIGRATION_MAP.md 갱신

모든 아카이브 조치는 `docs/MIGRATION_MAP.md`에 기록한다:

- 냉장 → 냉장 보관 테이블에 추가
- 심층 → 심층 보관 테이블로 이동

#### 5. 보고 — 결과 요약

```
📊 Archive Report
- 대상: N개
- 냉장 보관 (4-archive): N개
- 심층 보관 (git branch): N개
- MIGRATION_MAP 갱신: ✅
```

### 복원 방법

```bash
# 냉장 → 활성 복원
mv docs/4-archive/YYYY-MM-name/ docs/1-project/name/

# 심층 → 복원
git show archive/legacy-docs:docs/4-archive/YYYY-MM-name/file.md
# 또는
git checkout archive/legacy-docs -- docs/4-archive/YYYY-MM-name/
```
