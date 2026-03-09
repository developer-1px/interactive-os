---
description: docs/STATUS.md를 갱신하여 프로젝트 대시보드를 최신 상태로 유지한다.
---

## Why

> `/status`는 스냅샷을 **쌓는** 것이 아니라 대시보드를 **갱신**한다.
> `docs/STATUS.md` 하나가 Single Source of Truth이고, git log가 곧 changelog다.

## STATUS.md 구조

```
# Project Dashboard
## 🔥 Active Focus        ← 지금 집중하는 프로젝트 (도메인/프로젝트명)
## 📋 Domains              ← 도메인별 프로젝트 테이블
  ### os-core              ← 도메인 = 코드 패키지 기반 상설 범주
  ### testing
  ### builder
  ### ...
## ⚠️ Active Migrations   ← 패턴 전환 추적 (Old→New+잔여)
## 📊 Summary             ← 요약 수치
```

## 절차

1. **대시보드 읽기**
   - `docs/STATUS.md`를 읽어 현재 상태를 파악한다.

2. **프로젝트 스캔**
   - `docs/1-project/`의 모든 하위 폴더를 스캔한다.
   - 각 프로젝트의 BOARD.md, 최근 git 활동을 확인한다.
   - 프로젝트를 도메인에 매핑한다 (코드 패키지 기준).

3. **Focus 자동 판정**
   - 최근 2일 이내 활동이 있는 프로젝트 → 🔥 Focus
   - 7일+ 활동 없음 → ⚠️ Stale
   - 그 외 → 표시 없음 (Active)

4. **Active Migrations 갱신**
   - Remaining이 비어있는 항목(완료된 마이그레이션) → 제거
   - 새로 발견된 패턴 전환 → 추가

5. **대시보드 갱신**
   - `docs/STATUS.md`를 **덮어쓰기(overwrite)**한다.
   - 도메인 구조를 유지하면서 데이터를 갱신한다.
   - `Last updated` 타임스탬프를 현재 시각으로 갱신한다.

6. **알림**
   - 주요 변화를 사용자에게 요약 보고한다:
     - 새로 Focus가 된 프로젝트
     - Stale로 강등된 프로젝트
     - 완료된 Active Migrations

> **⚠️ 금지**: Completed 섹션이나 changelog를 추가하지 않는다. 과거 기록은 git log가 담당한다.
