---
description: superseded된 문서를 식별하여 AI 컨텍스트에서 제거하고, 원본은 git archive 브랜치에 보존한다.
---

## 목적

소스코드/철학이 변경되어 더 이상 현행이 아닌 문서가 AI에게 "현재 진실"로 오인되는 노이즈를 제거한다.
원본은 git archive 브랜치에 영구 보존하되, main 브랜치에서는 삭제한다.

## 사전 준비 (최초 1회)

```bash
# archive 브랜치가 없으면 생성
git branch archive/legacy-docs || true
```

## 프로세스

### 1. 스캔 — 오래된 문서 식별

- `docs/` 하위의 파일을 **수정일 기준 오래된 순**으로 나열한다.
- 이미 아카이브된 `docs/4-archive/`는 제외한다.
- 오래된 순서대로 읽으면서 아래 기준으로 판단한다.

### 2. 판단 — superseded 여부 확인

각 문서에 대해 다음을 교차 검증한다:

- **문서가 참조하는 개념/패턴이 현재 소스코드에 존재하는가?**
- **`MIGRATION_MAP.md`에 이미 superseded로 기록된 패턴을 사용하는가?**

판단 결과를 3가지로 분류한다:

| 분류 | 기준 | 조치 |
|------|------|------|
| ✅ 현행 | 코드와 일치 | 유지 |
| ⚠️ 부분 outdated | 일부만 불일치 | 사용자에게 보고 |
| 🪦 superseded | 핵심 전제가 변경됨 | 퇴출 대상 |

### 3. 기록 — MIGRATION_MAP.md 갱신

`docs/MIGRATION_MAP.md`에 superseded 패턴을 기록한다:

```markdown
## Superseded Patterns

| 과거 패턴 | 현행 대체 | 퇴출일 | 관련 문서 |
|-----------|----------|--------|----------|
| zustand useStore | kernel.subscribe / kernel.getState | 2026-02-13 | design-doc-v1.md |
```

### 4. 퇴출 — main에서 제거

사용자 확인 후 실행한다:

```bash
# 1. archive 브랜치에 현재 상태 보존
git checkout archive/legacy-docs
git checkout main -- <퇴출 대상 파일들>
git add . && git commit -m "archive: preserve docs before removal from main"
git checkout main

# 2. main에서 삭제
git rm <퇴출 대상 파일들>
git commit -m "archive: remove superseded docs (see archive/legacy-docs branch)"
```

### 5. 보고 — 결과 요약

실행 결과를 다음 형식으로 보고한다:

```
📊 Archive Report
- 스캔 문서: N개
- 현행 유지: N개
- 부분 outdated (보고): N개
- 퇴출 완료: N개
- MIGRATION_MAP 신규 항목: N개
```

## 복원 방법

나중에 원본이 필요할 때:

```bash
# 파일 내용 확인
git show archive/legacy-docs:docs/path/to/file.md

# main으로 복원
git checkout archive/legacy-docs -- docs/path/to/file.md
```
