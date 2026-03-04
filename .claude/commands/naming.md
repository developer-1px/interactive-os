---
description: 구현 전에 이름(변수, 함수, 모듈, 커맨드)을 설계한다. 이름이 아키텍처다.
---

## /naming — 이름 먼저

> Ubiquitous Language (Eric Evans, DDD).
> 이름이 맞으면 구조가 맞다. 이름이 어색하면 설계가 틀렸다.
> 리프.

### 시점

`/go` 보편 사이클 Step 8. /blueprint 후, /tdd 전에 실행.

### Knowledge

이름을 지을 때 반드시 이 두 파일을 읽는다:

- `.agent/knowledge/naming.md` — **동사 Dictionary** + 접미사 Dictionary + 충돌 검사 체크리스트
- `.agent/knowledge/domain-glossary.md` — **도메인 개념 정의** (ZIFT, Zone, Item, Cursor 등)

### 절차

1. **PRD/BOARD에서 도메인 개념 추출** — 명사(엔티티), 동사(액션), 형용사(상태).
2. **기존 동사/접미사 확인** — `.agent/knowledge/naming.md`를 읽어 해당하는 동사와 접미사를 찾는다.
   - "이 함수가 무엇을 하는가?" → 동사 Dictionary에서 찾는다
   - "이 타입이 무엇인가?" → 접미사 Dictionary에서 찾는다
3. **도메인 개념 확인** — `.agent/knowledge/domain-glossary.md`에서 관련 개념이 이미 정의됐는지 확인한다.
4. **이름 후보 제안** — 각 개념에 대해 2~3개 후보. 기준:
   - 기존 코드베이스와 일관성 (Consistency)
   - 의미 명확성 — 읽는 사람이 구현을 안 봐도 역할을 아는가 (Intention-Revealing)
   - 길이 — 스코프에 비례. 좁으면 짧게, 넓으면 길게
5. **충돌 검사** — `grep -rn "후보명" src/`로 기존 사용 확인.
6. **확정** — 사용자와 합의. 확정된 이름 목록을 BOARD.md 또는 PRD에 기록.

### 산출물
PRD 또는 BOARD.md에 **용어 사전(Glossary)** 섹션 추가:
```
## Glossary
| 도메인 개념 | 코드 이름 | 근거 |
```

