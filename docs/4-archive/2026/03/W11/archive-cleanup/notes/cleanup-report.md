# Archive Cleanup Report — v2 스캐폴딩 설계를 위한 실증 분석

> 작성일: 2026-03-10
> 대상: docs/4-archive/2026/ (W08, W01, W10, W11)

---

## 1. 숫자 요약

| 주차 | Before | After | 삭제율 |
|------|--------|-------|--------|
| W08 | 42 | 15 | 64% |
| W01 | 8 | 1 | 88% |
| W10 | 178 | 32 | 82% |
| W11 | 74 | 20 | 73% |
| **합계** | **296** | **68** | **77%** |

## 2. 보존된 68개의 유형 분포

| 유형 | 개수 | 비율 | 판단 난이도 |
|------|------|------|------------|
| discussions/ 내 파일 | 28 | 41% | 기계적 (100% 보존) |
| retrospective.md | 15 | 22% | 기계적 (100% 보존) |
| [analysis]/진단/삽질일지 | 8 | 12% | 개별 판단 필요 |
| [proposal]/기각대안 | 4 | 6% | 개별 판단 필요 |
| blueprint (Challenge 포함) | 5 | 7% | 개별 판단 필요 |
| 기타 (matrix, gap-report, decision-table, ADR, antipattern) | 8 | 12% | 개별 판단 필요 |

**핵심 발견: 63%는 기계적 판정, 37%는 개별 판단이 필요했다.**

## 3. v1 구조의 문제점 — 실증 기반

### 3-1. `notes/`가 쓰레기통이다

v1 구조:
```
project/
  BOARD.md          ← 수명: disposable (100% 삭제)
  spec.md           ← 수명: disposable (100% 삭제)
  discussions/      ← 수명: archivable (100% 보존)
  notes/            ← 수명: ??? (혼재)
```

`notes/`에서 발견된 파일 유형과 판정:

| notes/ 안의 유형 | 판정 | 근거 |
|-----------------|------|------|
| `[plan]-*.md` | 🗑️ 삭제 | 실행 계획. After = 코드 |
| `[blueprint]-*.md` (Challenge 없음) | 🗑️ 삭제 | 실행 설계. After = 코드 |
| `[blueprint]-*.md` (Challenge 있음) | ✅ 보존 | 의사결정 기록. 기각된 전제 포함 |
| `[analysis]-*.md` | ✅ 보존 | 깊은 진단. 탈락한 용의자 포함 |
| `[proposal]-*.md` | ✅ 보존 | 안 간 길. 기각 이유 포함 |
| `[audit]-*.md` | 🗑️ 삭제 | 시점 스냅샷. 결과는 코드에 |
| `[discussion]-*.md` | ✅ 보존 | discussions/에 있었어야 할 문서 |
| `adr-*.md` | ✅ 보존 | 의사결정 기록 |

**결론: `notes/` 안에서 수명이 갈린다. 폴더가 수명을 강제하지 못한다.**

### 3-2. 파일명 태그가 수명의 유일한 힌트지만 강제력이 없다

실제 태그와 수명의 상관:

| 태그 | 수명 | 신뢰도 |
|------|------|--------|
| `[plan]` | disposable | 높음 (예외 0) |
| `[audit]` | disposable | 높음 (예외 0) |
| `[blueprint]` | **갈린다** | 낮음 — Challenge Matrix 유무로 결정 |
| `[proposal]` | archivable | 높음 (기각 대안 포함) |
| `[analysis]` | archivable | 높음 (진단 과정 포함) |
| `[discussion]` | archivable | 높음 |

`[blueprint]`만 예외적으로 수명이 불확정. 나머지 태그는 수명을 정확히 예측한다.

### 3-3. 기계적 판정 vs 개별 판단의 경계

**기계적 판정이 가능한 조건** (추가 판단 불필요):
- `BOARD.md` → 삭제
- `spec.md` → 삭제
- `REPORT.md` → 삭제
- `README.md` → 삭제
- `discussions/` 내 모든 파일 → 보존
- `retrospective.md` → 보존
- `[plan]-*.md` → 삭제
- `[audit]-*.md` → 삭제

**개별 판단이 필요한 조건** (내용을 열어봐야 함):
- `[blueprint]-*.md` → Challenge Matrix 유무 확인
- `[analysis]-*.md` → 깊은 진단(3+ 용의자)인가, 단순 상태 보고인가
- `notes/` 안의 태그 없는 파일 → 내용 확인 필수
- `closed-issues/` → 단순 버그인가, 깊은 진단인가

### 3-4. 프로젝트 밖에서 태어나는 문서

W11에 `[antipattern]-os-react-overengineering.md`가 프로젝트 밖 loose file로 존재. v1은 프로젝트 중심 구조라 이런 문서의 자리가 없다.

유사 사례: 범용 교훈, cross-cutting 발견물, 도메인 지식 정리

## 4. v2를 위한 설계 질문

위 실증에서 도출된, v2 설계 시 답해야 할 질문들:

### Q1. `notes/` 폴더를 어떻게 할 것인가?

| 선택지 | 장점 | 단점 |
|--------|------|------|
| A. **해체** — `plans/` + `decisions/` 분리 | 수명이 폴더로 강제됨 | 워크플로우 전부 수정 필요 |
| B. **유지하되 태그로 수명 결정** | 변경 최소 | 태그 누락 시 판단 불가 (현재와 동일) |
| C. **`decisions/`만 추가** | notes는 disposable 기본값. 보존할 것만 decisions로 이동 | "이동" 행위가 필요 |

### Q2. `[blueprint]`의 수명 불확정을 어떻게 해결할 것인가?

- 옵션 A: Challenge Matrix를 blueprint 필수 섹션으로 만든다 → 모든 blueprint가 보존 가치
- 옵션 B: blueprint 완료 시 Challenge 유무를 체크하고, 있으면 decisions/로 이동

### Q3. `discussions/`와 `retrospective.md`의 위치는?

현재 v1에서 이 둘은 100% 보존되므로 v2에서도 1급 시민. 문제는:
- discussions/가 있는 프로젝트와 없는 프로젝트가 공존
- retrospective.md는 root에 있어 다른 root 파일(BOARD, spec)과 혼재

### Q4. 프로젝트 독립적 문서는 어디에?

antipattern, 범용 교훈 등 프로젝트에 귀속되지 않는 발견물의 위치:
- 옵션 A: `.agent/knowledge/`에 직접 반영
- 옵션 B: `docs/2-area/`에 토픽별 수용
- 옵션 C: 프로젝트가 있어야 문서가 있다 (독립 문서 금지)

### Q5. `/archive` 워크플로우를 어떻게 단순화할 것인가?

v2 구조가 수명을 강제하면 `/archive`는:
1. `decisions/` → `4-archive/`로 이동
2. 나머지 → 삭제
3. 끝

판단 0. 현재의 3-Gate Test + 개별 확인이 불필요해진다.

## 5. 부수적 발견

| # | 발견 | 조치 필요 |
|---|------|----------|
| 1 | 중첩 폴더 버그 (I6) | `/project` 스킬에 이름 검증 추가 |
| 2 | 빈 폴더가 남는 프로젝트 (I2) | 정상 경로로 수용 (아카이브에 0 파일 = 깨끗한 프로젝트) |
| 3 | 디스크 공간 — git stash 18개 누적 | worktree agent 운영 시 stash 정리 자동화 필요 |
