# eliminate-sync-draft

## WHY

`syncDraft`와 `syncEditDraft`는 모든 키스트로크마다 앱 상태에 텍스트를 복제한다.
하지만 `FIELD_COMMIT`은 이미 `FieldRegistry.localValue`에서 텍스트를 읽는다.
`state.ui.draft`는 복제본이다.

> Rule #11: "복제본을 동기화하려는 순간이 '왜 복제본이 있는가?'를 물어야 하는 순간이다."
> Rule #9: 오컴의 면도날 — 개체가 적은 쪽이 정답이다.

## Goals

1. `syncDraft` 커맨드 삭제 — 앱이 onChange에 sync 커맨드를 등록할 필요 없게.
2. `syncEditDraft` 커맨드 삭제 — 같은 패턴.
3. `state.ui.draft` / `state.ui.editDraft` 필드 삭제 — 복제본 제거.
4. `addTodo`는 `onSubmit({text})`의 payload에서 텍스트를 직접 받도록 변경.
5. `updateTodoText`도 동일하게 변경.
6. **다른 앱에서도 같은 패턴이 불필요해지는 것**을 확인.

## Scope

- **In**: Todo 앱의 syncDraft/syncEditDraft 제거, 관련 테스트 갱신
- **Out**: Field/FieldRegistry/FIELD_COMMIT 내부 변경 (이미 localValue 사용 중)
- **Risk**: `state.ui.draft`를 직접 읽는 뷰가 있는지 확인 필요 (ListView의 value prop)

## Before → After

```
BEFORE (개체 4개):
  FieldRegistry.localValue  ← OS가 관리
  state.ui.draft            ← 앱이 관리 (복제본!)
  syncDraft 커맨드           ← 복제본 동기화용
  onChange binding           ← 복제본 동기화 트리거

AFTER (개체 1개):
  FieldRegistry.localValue  ← OS가 관리. 끝.
```
