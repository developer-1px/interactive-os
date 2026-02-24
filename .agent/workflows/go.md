---
description: 자율 실행 에이전트 루프. 보편 사이클을 정의하고, 상태를 복원하여 올바른 단계에서 재개한다.
---

## /go — 상태 기반 라우터

> `/go`는 세 가지 뜻이다:
> 1. **"시작해"** — 새 세션. 상태를 파악하고 올바른 워크플로우로 라우팅.
> 2. **"이어해"** — 하다 만 작업. 마지막 단계에서 재개.
> 3. **"진행해"** — AI가 질문했을 때 "ㅇㅇ 해".
>
> 세 경우 모두: **지금 상태를 파악하고, 해당 워크플로우를 실행하라.**

### 핵심 원칙

> **`/go`는 라우터다. 직접 코드를 수정하지 않는다.**
> 상태를 읽고, 해당하는 워크플로우 파일을 `view_file`로 읽어서 실행한다.
>
> **모든 프로젝트의 목적은 앱의 완성이 아니라 OS의 완성이다.**
> 순수 React(`useState`, `onClick`, `useEffect`)로 완성되면 OS를 안 썼다는 뜻이므로 **실패**다.

---

## 부팅

1. `.agent/rules.md`를 읽는다.
2. 대화 맥락이 명확하면 → 해당 프로젝트 `BOARD.md` 읽기.
   대화 맥락이 없으면 → `docs/STATUS.md`의 Active Focus를 따른다.
3. BOARD.md의 Now 태스크를 확인한다.

---

## 상태 판별 + 라우팅

BOARD.md와 테스트 파일 상태를 보고 **하나의 워크플로우**로 라우팅한다.

| # | 판별 | 라우팅 | 행동 |
|---|------|--------|------|
| 1 | BOARD.md 없음 | → `/project` | 프로젝트 초기화 |
| 2 | Now 태스크에 Red 테스트 없음 | → `/red` | `.agent/workflows/red.md`를 `view_file`로 읽고 실행 |
| 3 | Red 테스트 FAIL 있음 | → `/green` | `.agent/workflows/green.md`를 `view_file`로 읽고 실행 |
| 4 | 모든 테스트 PASS | → `/refactor` | `.agent/workflows/refactor.md`를 `view_file`로 읽고 실행 |
| 5 | 다음 Now 태스크 있음 | → #2로 루프 | 다음 태스크의 Red 테스트 확인 |
| 6 | 모든 Now Done | → 회고 | `/retrospect` → `/archive` |

### 상태 확인 방법

```bash
# Red 테스트 존재 여부: 해당 태스크의 .test.ts 파일 검색
# 테스트 상태: vitest run으로 FAIL/PASS 확인
source ~/.nvm/nvm.sh && nvm use && npx vitest run --reporter=verbose [테스트파일경로] 2>&1 | tail -30
```

---

## 라우팅 후 행동

**반드시 해당 워크플로우 파일을 `view_file` 도구로 읽은 뒤, 그 안의 단계를 순서대로 실행한다.**

`/go`가 직접 코드를 수정하거나, 워크플로우 이름만 보고 "아는 대로" 행동하는 것은 금지.

---

## 완료의 정의 (DoD)

**"완료"는 Red→Green 증명이다.**

| 증명 상태 | BOARD.md 표기 |
|-----------|--------------|
| Red→Green + regression 없음 | `[x] 태스크명 — tsc 0 | +N tests | build OK ✅` |
| 수정했지만 Red→Green 없음 | `[ ] 태스크명 — 증명 미완` |

증빙 없이 `✅`만 찍는 것은 금지.

---

## 회고 (모든 Now Done 시 1회)

| 순서 | 단계 | 산출물 |
|------|------|--------|
| 1 | `/retrospect` | KPT 회고 |
| 2 | `/archive` | 프로젝트 매장 |
