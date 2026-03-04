# Field resetOnSubmit DOM 동기화 버그 수정

> 작성일: 2026-03-04
> 성격: Issue (긴급 수정)
> 출처: /discussion — Todo 드래프트 Enter 후 필드 내용 유지 버그

---

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `Field.tsx:handleCommit` | `resetOnSubmit` 시 `FieldRegistry.reset(fieldId)`만 호출. contentEditable DOM 미동기화 | reset 후 `innerRef.current.innerText = ""` 추가 | Clear | — | Red→Green + 기존 Field 테스트 유지 | 낮음. 동일 패턴 3곳 사용 중 |

## 라우팅

승인 후 → `/issue` — Field resetOnSubmit contentEditable DOM 동기화 누락
