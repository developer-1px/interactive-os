# 2026-02-12 Daily Changelog

| 항목 | 내용 |
|------|------|
| 원문 | `changelog` |
| 내(AI)가 추정한 의도 | 오늘 하루 작업의 전체 변경 이력을 정리하여 기록으로 남기려 한다 |
| 날짜 | 2026-02-12 |
| 커밋 수 | 14 |
| 파일 변경 | 252 files, +15,924 / -8,511 lines |

---

## 1. 개요

오늘 하루 동안 14개 커밋, 252개 파일 변경(+15,924/-8,511 lines). 레거시 파이프라인 제거, 커널 타입 정비, 리스너 구조 통일, 문서 뷰어 통합, TestBot E2E 테스트 전환 및 12/12 PASS 달성까지 대규모 리팩토링 + 테스트 정비가 진행됨.

## 2. 커밋 상세

### Phase 1 — 레거시 제거 & 구조 정리

| 커밋 | 내용 |
|------|------|
| `6d2164b` | 레거시 미들웨어 제거 후 깨진 import 수정 |
| `387d47f` | Phase 3 — 레거시 `CommandEngineStore` 파이프라인 완전 제거 |
| `a3c6bdf` | `os-new/core/` 삭제 — `FocusData`를 `kernel/ZoneRegistry`로 이관 |
| `ff1260f` | `lib/`, `shared/` 파일을 소비자 위치로 colocate |
| `7925913` | `store/`, `lib/` 디렉토리 제거 — 모든 파일 소비자 인접 배치 |

### Phase 2 — 타입 정비 & 리스너 통일

| 커밋 | 내용 |
|------|------|
| `1ce003f` | 50+ tsc 타입 에러 수정 (kernel + Todo app) |
| `17bb393` | `1-listeners/` 네이밍 통일(`*Listener`) + `keymaps/` 분리 |

### Phase 3 — 문서 & 뷰어

| 커밋 | 내용 |
|------|------|
| `c6ce9fb` | docs-viewer 통합, Mermaid 렌더링 수정, inbox 파일명 리네이밍 |

### Phase 4 — TestBot & E2E

| 커밋 | 내용 |
|------|------|
| `ffea73c` | `dryRun`이 테스트 본문을 실행하는 버그 수정 (중복 키 근본 원인) |
| `5703cca` | headless 테스트를 testBot/Playwright → vitest로 이관 |
| `487bf42` | Todo whitebox TestBot → black-box Playwright E2E 전환 |
| `89cc142` | **TestBot 12/12 PASS** — shim parity with Playwright |

### Phase 5 — 기능 & 문서

| 커밋 | 내용 |
|------|------|
| `c683cee` | PARA inbox 처리 + command-palette 아카이브 |
| `0cda6f9` | `OS_SELECT` (aria-selected) ↔ `OS_CHECK` (aria-checked) 분리 |

## 3. 주요 성과

- **레거시 파이프라인 완전 제거**: `CommandEngineStore`, `os-new/core/`, `store/`, `lib/`, `shared/` 모두 삭제. 커널 단일 파이프라인으로 통합 완료.
- **TestBot 12/12 PASS**: 3/12 → 6/12 → 8/12 → **12/12**. selector escaping, contenteditable typing, Meta+a polyfill, state isolation, DOM scope 총 6건 수정.
- **Playwright E2E 75/75 PASS**: 전체 E2E 무결성 유지.
- **tsc clean**: 50+ 타입 에러 수정 후 zero errors 유지.

## 4. 해법 유형

🟢 **Known** — 하루 작업의 이력 정리는 git log 기반의 자명한 작업.

## 5. 인식 한계

- 커밋 간 unstaged 변경사항 (rules.md 선언문 개편, workflow 파일, 추가 inbox 문서 등)은 아직 미커밋 상태로 이 changelog에 포함되지 않음.

## 6. 열린 질문

없음.

---

> **한줄요약**: 레거시 파이프라인 완전 제거 + TestBot 12/12 PASS 달성 — 14커밋 252파일 +15.9k/-8.5k lines의 대규모 정비일.
