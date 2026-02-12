# 레거시 문서 퇴출 프로세스 설계

## Why

소스코드/철학이 바뀌었는데 이전 방식을 설명하는 문서가 `docs/`에 남아있으면,
새 대화의 AI가 그것을 "현재 진실"로 오인하여 잘못된 컨텍스트로 작업하는 노이즈가 발생한다.

## Intent

AI 컨텍스트에서 superseded 문서를 제거하되, 인간용 원본은 안전하게 보관하는 **체계적 퇴출 프로세스**를 만든다.

## Warrants

| # | Warrant |
|---|---------|
| W1 | 소스와 동기화되지 않은 문서는 AI에 노이즈를 발생시킨다 |
| W2 | 문서에는 코드에 없는 의사결정 맥락이 담겨 있으므로 보관 가치가 있다 |
| W3 | 삭제/보존 이분법이 아닌 단계적 퇴출 경로가 필요하다 |
| W4 | 노이즈의 피해자는 AI이다 (인간이 아님) |
| W5 | 보관은 유지하되 AI의 "현재 진실" 범위에서 제외가 목표 |
| W6 | 대부분의 과거 문서는 도움이 된다. 문제는 superseded된 진실만이다 |
| W7 | 새 대화의 AI는 컨텍스트 없이 docs를 스캔하므로, 유효성 정보가 문서에 내재해야 한다 |
| W8 | 현재 트리거는 사람(reactive)이며, 프로세스(proactive)로 전환이 필요하다 |
| W9 | 구체적 superseded 패턴: Zustand, React Router, 구 OS 구조 |
| W10 | 산출물은 (a) MIGRATION_MAP.md + (b) main에서 삭제 |
| W11 | archive 이동만으로는 AI 차단 불가 — 물리적 차단 필요 |
| W12 | 원본 보관 + AI 차단 + 핵심 맥락 접근을 동시 만족해야 함 |
| W13 | git branch가 zip보다 우월 (검색, 접근성, 히스토리, 복원 모두 가능) |
| W14 | archive 브랜치 = 원본의 영구 무덤. main에서만 삭제하므로 복원 리스크 제로 |
| W15 | 프로세스 단순: 식별 → 기록 → git rm → commit |

## 결론

**git archive 브랜치 + MIGRATION_MAP.md 하이브리드 전략**

- `archive/legacy-docs` 브랜치에 원본을 영구 보존
- `main`에서 superseded 문서를 `git rm`으로 삭제
- `docs/MIGRATION_MAP.md`에 "과거 패턴 → 현행 대체" 매핑 유지
- `/archive` 워크플로우로 프로세스 자동화

## 한 줄 요약

> AI가 읽는 main에서는 삭제하고, git archive 브랜치에 원본을 보존하며, MIGRATION_MAP.md로 "뭘 왜 바꿨는지"를 AI에게 알려주는 것이 레거시 문서 퇴출의 정답이다.
