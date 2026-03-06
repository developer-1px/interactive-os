# Issue: Todo 카테고리 필터 시 포커스 목록 불일치

> **Status**: [Closed] ✅
> **Priority**: P1 (기능불가 — 포커스 네비게이션이 보이지 않는 아이템으로 이동)
> **Created**: 2026-02-23
> **Closed**: 2026-02-23
> **Resolution**: `createCollectionZone.ts` L566-569 — `getItems()`에 `config.filter` 적용 (3줄 추가).
>   Regression: `test-page.test.ts` 수정 — `navigate/index.ts` L46에서 `getItems`가
>   `DOM_ITEMS` context보다 우선 호출됨을 발견. 테스트를 `selectVisibleTodoIds`로 전환.
> **Created**: 2026-02-23

## 증상

사이드바에서 카테고리를 선택하면 해당 카테고리의 Todo만 화면에 표시되지만,
방향키로 포커스 이동 시 **보이지 않는 다른 카테고리의 아이템**으로도 포커스가 이동한다.

사용자 관점:
1. 카테고리 "Work" 선택 → Work todos 3개 렌더링
2. Arrow Down으로 이동 → 3개를 넘어서 **포커스가 사라짐**
3. 실제로는 "Personal" 카테고리의 todo에 포커스가 가 있지만 화면에 보이지 않음

## 근본 원인

`collectionBindings().getItems()`가 **전체 아이템 목록**을 반환한다.

```
createCollectionZone.ts L566-569:
  getItems: () => {
    const appState = os.getState().apps[...];
    return ops.getItems(appState).map(item => toItemId(item.id));
    //     ↑ 전체 아이템. config.filter 미적용.
  }
```

한편 View(`ListView.tsx`)는 `selectVisibleTodoIds`로 **필터된 아이템만** 렌더링.

```
OS가 아는 아이템:     [work-1, work-2, work-3, personal-1, personal-2]
DOM에 있는 아이템:    [work-1, work-2, work-3]
```

→ OS_NAVIGATE가 `personal-1`로 포커스 이동 → DOM에 없음 → 포커스 유실.

## 해결 방향

`getItems()`에서 `config.filter`를 적용하여 **화면에 보이는 아이템만** 반환.

## 수정 파일 목록

| 파일 | 변경 |
|------|------|
| `src/os/collection/createCollectionZone.ts` L566-569 | `getItems()`에 `config.filter` 적용 |

## 엔트로피 체크

- 새로운 유일한 패턴을 추가하는가? → **No**. 기존 `config.filter` 메커니즘을 활용.
- `remove`, `cut` 등 다른 command에서 이미 `config.filter`를 사용하는 패턴 존재 (L108-109, L181-182).

## 설계 냄새 4질문

1. 개체 증가? → No. 코드 1줄 변경.
2. 내부 노출? → No.
3. 동일 버그 타 경로? → No. `getItems`가 유일한 accessor 경로.
4. API 확장? → No.

## /reflect

- **영향 범위**: `getItems` 변경은 OS_NAVIGATE, OS_TAB, OS_SELECT, OS_DELETE 등
  모든 navigation/selection command에 영향. 이 중 어느 것도 "필터 밖의 아이템"에 접근할 필요 없음.
- **기존 메커니즘**: `config.filter`는 `remove`와 `cut` command에서 이미 사용 중.
  동일 패턴을 `getItems`에 적용하면 됨.
- **다른 환경**: sidebar collection에는 `filter` 없음 → 영향 없음.
  builder collection에도 `filter` 없음 → 영향 없음.
  filter가 있는 collection에서만 동작 변경.
