# Archive System Redesign — 4-archive 폐지 + 프로젝트 영구 거주

> 작성일: 2026-03-12
> 태그: analysis
> 출처: /discussion (skill-description-eval M9 중 파생)

## 문제 / 동기

현재 `/archive` 스킬은 완료된 프로젝트를 `4-archive/YYYY/MM/WNN/`에 날짜 기반으로 매장한다.
이로 인해:

1. **프로젝트 재발견 마찰** — "sdk-role-factory 어떻게 했더라?" → `1-project/os/sdk-role-factory/`가 아니라 `4-archive/2026/03/W10/`을 뒤져야 한다
2. **"완료"와 "매장"의 혼동** — 프로젝트 산출물(BOARD.md, spec.md)은 "죽는" 게 아니라 "완료"하는 것. 상태 전환이지 위치 이동이 아니다
3. **git과의 역할 중복** — 삭제해도 git log에 남는다. 파일시스템 아카이브는 git이 이미 하는 일의 중복
4. **프로젝트 내 미해결 항목 유실** — 완료 프로젝트의 Unresolved가 `5-backlog/`로 이동하면 원래 프로젝트 맥락과 분리

## 현재 상태

- `/archive` 스킬: `4-archive/YYYY/MM/WNN/`에 폴더째 이동
- `docs/STATUS.md`: Archive 상태를 "Archive" 라벨로 표시하지만, 실제 파일은 `4-archive/`에 있음
- 3-tier 구조(`1-project/[domain]/[epic]/[project]/`)가 이미 프로젝트 위치를 고정

## 기대 상태 (Emerging Claim)

**프로젝트는 `1-project/`에 영구 거주한다. Status만 전환한다. `4-archive/` 폐지.**

| 종류 | 현재 | 이후 |
|------|------|------|
| 프로젝트 산출물 | `4-archive/YYYY/MM/` 이동 | `1-project/`에 유지, Status: Archive |
| 프로젝트 내 미해결 | `5-backlog/`로 이동 | 프로젝트 내 `backlog/` 폴더 |
| 일회성 문서 (inbox) | `4-archive/` 이동 | 프로젝트에 흡수 또는 삭제 |
| git | 보조 | git이 진짜 아카이브 |

## 논거 (Warrants)

- W1: Backlog(미확정 컨셉) ≠ Unresolved(확정 프로젝트 내 미해결) — 구분 필요
- W2: 날짜 기반 아카이브는 프로젝트 재발견 마찰이 높다
- W3: 3-tier `1-project/` 구조가 이미 프로젝트 위치를 고정한다
- W4: 프로젝트 산출물은 "죽는" 게 아니라 "완료"하는 것 — 상태 전환이지 매장이 아님
- W5: git log가 진짜 아카이브. 파일시스템 아카이브는 중복

## 접근 방향

1. **`/archive` 스킬 재설계**: 폴더 이동 제거. STATUS.md 갱신 + knowledge 환류만 유지
2. **프로젝트 내 `backlog/` 폴더**: 완료 시 Unresolved → `backlog/`에 남겨두기
3. **`4-archive/` 기존 내용 처리**: 기존 매장된 프로젝트를 `1-project/`로 복원할지, git에 맡기고 삭제할지
4. **STATUS.md 상태 체계 정리**: Active / Hold / Archive가 모두 `1-project/` 내에서 공존

## Open Gap

- [ ] `/archive` 스킬이 현재 하는 일(STATUS.md 갱신, knowledge 환류, 폴더 이동, discussions/ 처리) 중 폴더 이동만 제거하면 되는가, 스킬 전체를 재설계해야 하는가?
- [ ] `4-archive/`에 이미 매장된 12+ 프로젝트의 처리 방안
- [ ] 프로젝트 내 `backlog/` vs `discussions/` — 미해결 항목의 최적 보관 형태

## 관련 항목

- `docs/5-backlog/docs-anti-drift-structure.md` — 문서 구조 개선 (별도 주제)
- `.claude/skills/archive/SKILL.md` — 현행 아카이브 스킬
- `.claude/skills/project/SKILL.md` — 프로젝트 scaffold (구조 변경 시 연동)
- `docs/STATUS.md` — 상태 대시보드 (Archive 표시 방식 변경 필요)
