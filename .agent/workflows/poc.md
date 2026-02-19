---
description: 아이디어를 빠르게 검증하는 PoC spike를 만든다. 별도 라우트 + GlobalNav 등록.
---

## /poc — PoC Spike

> **분류**: 오케스트레이터. `/go` 보편 사이클의 **Light 프리셋**을 따른다.

### `/go` 보편 사이클과의 관계

`/poc`은 `/go`의 Light 프리셋이다. 생각(2~4), 다듬기(7, 9, 10), 회고(14~16)를 skip.
가볍게 만들고 돌아가는지만 확인한다.

### PoC 준비 (보편 사이클 진입 전)

1. **검증 질문 1개** 정의: "이 실험으로 확인하고 싶은 것은?"
2. **스코프 제한**: 1~2시간 안에 끝낼 수 있는 범위로 좁힌다.
3. `/routes` — 별도 라우트 생성 + GlobalNav 등록.

### 보편 사이클 진입 (Light)

- Step 1: /ready
- Step 6: /solve — 최소 구현 (spike)
- Step 8: /fix — 형식 정정
- Step 11: /verify — 돌아가는지 확인
- Step 12: /changelog — 커밋
- Step 13: /ready — 확인

### PoC 평가 (보편 사이클 이후)

사용자와 함께 결과를 평가한다:

| 판정 | 조치 |
|------|------|
| **채택 (Adopt)** | `/project` 생성. PoC 코드는 프로젝트 첫 커밋. |
| **폐기 (Discard)** | `/routes` 제거 모드로 관련 파일 삭제. |
| **보류 (Hold)** | PoC 코드 유지. `docs/5-backlog/`에 기록. |
