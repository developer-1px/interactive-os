---
description: 작업 중 중간 커밋을 수행하고, 프로젝트 폴더의 changelog와 status를 동시에 갱신한다.
---

## /changelog — 커밋 + 기록 갱신

### 원칙

> 큰 작업의 중간 중간 커밋으로 진행을 보존한다.
> 커밋할 때마다 프로젝트 changelog와 status를 함께 갱신한다.
> `/project`, `/go` 등 장기 워크플로우 안에서 호출된다.

### 절차

1. **변경 사항 확인**
   - `git status`로 변경된 파일을 확인한다.
   - 변경이 없으면 중단한다.

2. **프로젝트 폴더 탐지**
   - 명시적으로 지정되지 않으면, 최근 커밋 기록과 변경 파일 경로를 분석하여 현재 진행 중인 프로젝트를 판단한다.
   - `docs/1-project/` 하위 폴더 중 가장 관련성 높은 프로젝트를 선택한다.
   - 판단 불가 시 사용자에게 묻는다.

3. **코드 커밋**
   - 변경 내용을 요약하는 conventional commit 메시지를 작성한다.
   - 형식: `type(scope): 한줄 요약`
   - `git add` + `git commit` 실행.
   - 커밋 해시를 기록한다.

4. **Changelog 갱신**
   - 프로젝트 폴더의 `changelog.md`에 기록을 추가한다.
   - 위치: `docs/1-project/[프로젝트명]/changelog.md`
   - 파일이 없으면 생성한다.
   - 형식:
     ```markdown
     ## Changelog

     | 커밋 | 날짜 | 내용 |
     |------|------|------|
     | `해시` | YYYY-MM-DD HH:mm | 커밋 메시지 — 변경 파일 요약 |
     ```
   - 새 기록은 테이블 **맨 위**에 추가한다 (최신순).

5. **Status 갱신**
   - 프로젝트의 `4-status.md`를 갱신한다.
   - 완료된 항목 체크, 진행률 업데이트.
   - `4-status.md`가 없으면 이 단계를 스킵한다.

6. **대시보드 갱신**
   - `docs/STATUS.md`를 읽어 해당 프로젝트의 Last Activity를 현재 시각으로 갱신한다.
   - Phase가 변경되었으면 Phase도 갱신한다.
   - Focus 상태를 재판정한다 (최근 2일 이내 활동 = 🔥 Focus).

7. **문서 커밋**
   - changelog + status + STATUS.md 변경을 `docs: changelog & status 갱신`으로 커밋한다.
