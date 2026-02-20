---
description: 구현 전에 이름(변수, 함수, 모듈, 커맨드)을 설계한다. 이름이 아키텍처다.
---

## /naming — 이름 먼저

> Ubiquitous Language (Eric Evans, DDD).
> 이름이 맞으면 구조가 맞다. 이름이 어색하면 설계가 틀렸다.
> 리프.

### 시점

`/go` 보편 사이클 Step 7. /divide 후, /tdd 전에 실행.

### 절차

1. **PRD/BOARD에서 도메인 개념 추출** — 명사(엔티티), 동사(액션), 형용사(상태).
2. **기존 네이밍 컨벤션 확인** — `rules.md` + 기존 코드에서 패턴 수집.
   - 컴포넌트: PascalCase
   - 커맨드: UPPER_SNAKE_CASE
   - 파일: 번호 prefix
3. **이름 후보 제안** — 각 개념에 대해 2~3개 후보. 기준:
   - 기존 코드베이스와 일관성 (Consistency)
   - 의미 명확성 — 읽는 사람이 구현을 안 봐도 역할을 아는가 (Intention-Revealing)
   - 길이 — 스코프에 비례. 좁으면 짧게, 넓으면 길게
4. **충돌 검사** — `grep -rn "후보명" src/`로 기존 사용 확인.
5. **확정** — 사용자와 합의. 확정된 이름 목록을 BOARD.md 또는 PRD에 기록.

### 산출물
PRD 또는 BOARD.md에 **용어 사전(Glossary)** 섹션 추가:
```
## Glossary
| 도메인 개념 | 코드 이름 | 근거 |
```
